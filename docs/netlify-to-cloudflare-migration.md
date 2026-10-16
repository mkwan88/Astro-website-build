# Netlify → Cloudflare migration playbook

How kwantum.net moved from Netlify to Cloudflare Workers on 14–15 October 2026, written up so the
same process can be reused for client sites. Every step below is one we actually did, including the
places we got stuck.

**Result:** the site, contact form, email and DNS all moved with no downtime for visitors beyond a
minute or so while the site moved across, and email was never interrupted.

---

## Why we moved

| | Netlify Free (credit-based plan) | Cloudflare Free (Workers) |
|---|---|---|
| Publishing an update | 15 of 300 monthly credits, so roughly 20 production deploys a month | Uses build minutes, with 3,000 a month shared across the account (~1 min per build for this site) |
| Visitor traffic | Also uses credits (bandwidth and requests) | Static asset requests are free and unlimited |
| Running out | Site is paused until the next billing cycle | Builds queue or slow down; the live site keeps serving |
| Client sites | All projects share the same credit pool | Each site uses a few build minutes; clients can own their own free account |
| Built-in forms | Yes (Netlify Forms) | No, so we built a small Worker that sends via Resend |

In the month before moving, kwantum.net had 17 pushes to `main`, about 255 credits of the 300 before
counting bandwidth.

Sources (checked October 2026): [Netlify pricing](https://netlify.com/pricing.md),
[Netlify credits](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/),
[Cloudflare Workers Builds limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/),
[Cloudflare Pages → Workers](https://developers.cloudflare.com/workers/static-assets/migrate-from-pages/).

---

## Before you start: audit the current setup

1. **Find out where DNS actually lives.** For kwantum.net, the domain was registered with
   **Squarespace**, which also ran DNS. Netlify only hosted the site. So there was no "domain
   transfer from Netlify" at all, just a nameserver change. Check with:
   ```bash
   nslookup -type=NS example.com 8.8.8.8
   ```
2. **List every DNS record** so nothing is lost when nameservers change. For kwantum.net:

   | Name | Type | Value | Purpose |
   |---|---|---|---|
   | `@` | A | `75.2.60.5` | Netlify site (to be replaced) |
   | `www` | CNAME | `astrowebsitebuild.netlify.app` | Netlify site (to be replaced) |
   | `@` | MX | `1 smtp.google.com` | Google Workspace email |
   | `@` | TXT | `v=spf1 include:_spf.google.com ~all` | SPF |
   | `@` | TXT | `google-site-verification=…` | Google verification |
   | `google._domainkey` | TXT | `v=DKIM1; k=rsa; p=…` (long, split in two strings) | Google DKIM |
   | `_dmarc` | TXT | `v=DMARC1; p=none;` | DMARC |
   | `_domainconnect` | CNAME | Squarespace helper | Not needed on Cloudflare, so delete |

   Also check `send`, `resend._domainkey`, `autodiscover`, `mail` and any other subdomains you know
   about. Cloudflare's import scan can miss custom subdomains.
3. **Check whether DNSSEC is on.** This is the step most likely to cause an outage. See Phase 2.
   ```powershell
   Resolve-DnsName example.com -Type DS -Server a.gtld-servers.net -DnsOnly
   ```
   A DS record with a KeyTag means DNSSEC is on.
4. **Find anything host-specific in the code.** For kwantum.net that was Netlify Forms
   (`data-netlify="true"`, `data-netlify-honeypot`, hidden `form-name` input) on the contact form.
   Also look for `netlify.toml`, `_redirects`, `_headers` and Netlify Functions.

---

## Phase 1: build and test on Cloudflare (no risk to the live site)

All code work happens on a branch (`cloudflare-migration`). **Do not merge to `main` until after
the DNS cutover**: Netlify would deploy a form that posts to `/api/contact`, which doesn't exist on
Netlify, and the live form would break.

### 1. Code changes

- **`wrangler.jsonc`** at the repo root:
  ```jsonc
  {
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "kwantum",                      // must match the Worker name in the dashboard
    "main": "worker/index.ts",
    "compatibility_date": "2026-10-01",
    "assets": {
      "directory": "./dist",
      "binding": "ASSETS",
      "not_found_handling": "404-page",     // serves dist/404.html with a 404
      "run_worker_first": ["/api/*"]        // only /api/* hits the Worker; everything else is static
    },
    "keep_vars": true,                      // deploys don't wipe dashboard-set variables
    "observability": { "enabled": true }
  }
  ```
- **`worker/index.ts`**: a small Worker that handles `POST /api/contact`:
  - honeypot field `bot-field`: if filled, redirect to `/thank-you/` and drop silently
  - validates required fields, lengths and email format
  - sends a plain-text email through the Resend API with `reply_to` set to the visitor's email
  - redirects `303` to `/thank-you/` on success or `/form-error/` on any failure
  - **the recipient comes only from the `CONTACT_TO` setting, never from the form**, so it
    can't be abused as an open mail relay
  - everything else is passed to `env.ASSETS.fetch(request)`
- **Contact form**: remove the Netlify attributes and hidden `form-name` input, and set
  `action="/api/contact"`.
- **New `/form-error/` page** (noindex) with a fallback email link.
- **Sitemap filter** to keep the noindex `/thank-you/` and `/form-error/` out of the sitemap.
- **Dev tooling**:
  - `npm install -D wrangler`
  - add `"workerd": true` to `allowScripts` in `package.json` (npm blocks its install script otherwise)
  - add scripts `cf:dev` (`astro build && wrangler dev`) and `cf:types`
    (`wrangler types worker/worker-configuration.d.ts`)
  - give the Worker its own `worker/tsconfig.json` and exclude `worker` from the root tsconfig so
    Worker types don't clash with Astro's
- **`.gitignore`**: add `.dev.vars` and `.wrangler/`. Commit a `.dev.vars.example` instead.

### 2. Test locally

```bash
npx wrangler dev --port 8787
```

With a fake `RESEND_API_KEY` in `.dev.vars`, check:
- every page returns 200, a made-up URL returns the 404 page with status 404
- `GET /api/contact` returns 405
- honeypot submission redirects to `/thank-you/`
- missing fields and a bad email redirect to `/form-error/`
- a valid submission reaches Resend and gets `401 API key is invalid`, which proves the request is
  built correctly, then lands on `/form-error/`

### 3. Set up Resend (sending service for the form)

1. Sign up at resend.com (free plan: 3,000 emails/month, 100/day).
2. **Domains → Add Domain** → `example.com`, region closest to Australia.
3. Add the DNS records Resend shows at the current DNS host (Squarespace at this point). For
   kwantum.net they were:
   - `resend._domainkey` TXT (Resend's DKIM)
   - `send` CNAME → `send.forge.rmta.net` (bounce handling). This came as one CNAME, not the MX
     and TXT pair older Resend docs describe. Use whatever Resend shows.
   
   These sit on subdomains, so they don't affect Google Workspace email.
4. Click **Verify**.
5. **API Keys → Create** with **Sending access**. It's shown once, so store it in a password
   manager and never paste it into chat.

### 4. Create the Worker in Cloudflare

1. Push the branch to GitHub (doesn't touch `main` or the live site).
2. **Workers & Pages → Create application → Import a repository → Get started**, then pick the repo.
   - ⚠️ If you see **Framework preset** and **Build output directory**, you're on the **Pages**
     screen. Go back. On Pages the Worker (and so the form) won't run.
   - Workers screen values:

     | Field | Value |
     |---|---|
     | Project name | `kwantum` (must match `name` in `wrangler.jsonc`, or the build fails) |
     | Build command | `npm run build` |
     | Deploy command | `npx wrangler deploy` |
     | Preview command | leave as `npx wrangler preview` |
3. There's **no branch field** on the import screen, so the first build uses `main`. For us it built
   and deployed the old static site (no config on `main`). Harmless, because no domain is attached yet.
   If Cloudflare opens an "autoconfig" pull request, close it without merging.
4. **Settings → Build → Branch control** → production branch = `cloudflare-migration`.
5. Trigger a build from the branch. We pushed an empty commit:
   ```bash
   git commit --allow-empty -m "Trigger Cloudflare build"
   git push origin cloudflare-migration
   ```
6. **Settings → Variables and Secrets** (Production):

   | Type | Name | Value |
   |---|---|---|
   | Secret | `RESEND_API_KEY` | Resend key |
   | Text | `CONTACT_TO` | `mark@kwantum.net` (the client's inbox, for client sites) |
   | Text | `CONTACT_FROM` | `Kwantum Website <forms@kwantum.net>` (whole thing including `< >`) |

   **Gotchas we hit:**
   - While the deployed version was the static-only one from `main`, this section said
     *"Variables cannot be added to a Worker that only has static assets"*. It unlocks once a
     version with `main: worker/index.ts` is deployed.
   - After that build, the settings page kept showing the old version (old compatibility date)
     until a **hard refresh** (Ctrl+Shift+R).
   - The yellow "update your Wrangler configuration with these changes" banner can be dismissed,
     because `keep_vars: true` handles it.
7. Test on the `*.workers.dev` URL (ours: `kwantum.mark-9b8.workers.dev`):
   - all pages, 404, `/form-error/` exists (proves the new version is live)
   - honeypot, validation, `GET` → 405
   - **one real submission**: check the email arrives and Reply goes to the submitter

---

## Phase 2: move DNS to Cloudflare

### 1. Add the domain

**Cloudflare home → Add a site → Connect a domain**. Don't choose "Transfer a domain"; that moves
the *registration* and is optional and separate.

- **AI crawler settings**: left all three (Search, Agent, Training) on **Allow** and Bot
  Preference Sync on. That fits an AI-visibility-first SEO strategy. Leave "I monetize pages that
  serve ads" unticked.
- **Import DNS records: Automatic**, then **Free** plan.

### 2. Review the imported records (most important screen)

Compare against the audit list. What we changed:
- **Added** the missing `send` CNAME (Resend). The scan didn't find it.
- **Set `send` to DNS only (grey cloud).** It was added as Proxied by default, which breaks mail
  lookups. Cloudflare shows a ⚠ on it.
- **Deleted** `_domainconnect`.
- **Kept the Netlify `A` and `www` records but switched them to DNS only.** This means that after
  the nameserver switch, visitors keep going straight to Netlify with its own valid certificate.
  The site keeps working while the switch spreads.
- All email records (MX, SPF, DKIMs, DMARC, verification) are DNS only by nature.

Click **"I'll do this later"** on the "not fully protected" popup. It's expected while everything
is grey.

### 3. DNSSEC: turn it off first ⚠️

kwantum.net had DNSSEC on at Squarespace. If you switch nameservers while the old DS record is
still at the registry, validating resolvers (Google DNS and many ISPs) reject Cloudflare's answers,
and **the website and email go down**.

1. Turn **DNSSEC off** at the registrar (Squarespace: Domains → DNS → DNSSEC).
2. Confirm the DS record is gone at the registry and public resolvers:
   ```powershell
   Resolve-DnsName example.com -Type DS -Server a.gtld-servers.net -DnsOnly   # only "net SOA" = gone
   ```
   ```bash
   curl -s "https://dns.google/resolve?name=example.com&type=DS"              # no "Answer" = gone
   ```
3. **Wait out the DS cache TTL** (6 hours for .net) so other ISPs' caches clear too. We set a
   scheduled check for 6 hours later and switched the next morning.

### 4. Switch nameservers

At the registrar (Squarespace: **Domains → DNS → Nameservers → Use custom nameservers**), replace
all existing nameservers with the two Cloudflare gives you (ours: `kolton.ns.cloudflare.com`,
`leah.ns.cloudflare.com`). Then in Cloudflare click **Check nameservers now**.

Verify:
```bash
nslookup -type=NS example.com a.gtld-servers.net        # registry now points to Cloudflare
nslookup -type=MX example.com kolton.ns.cloudflare.com  # Cloudflare serves the same email records
```
We also compared the long DKIM values character for character between the old and new
nameservers (both 408 characters, identical).

Send a test email in both directions. Wait for the domain to show **Active** in Cloudflare (it
did within minutes for us).

### 5. Move the website onto the Worker

Do 1 and 2 back to back, because the site is down in between.

1. **DNS → Records**: delete the Netlify `A` and `www` CNAME records. Leave everything else.
2. **Workers & Pages → kwantum → Settings → Domains & Routes → + Add Domain** (not "Add Route"):
   pick the zone, add the apex (`kwantum.net`), then again for `www`. Cloudflare creates the DNS
   records and certificate.
3. **www → apex redirect**: **kwantum.net → Rules → Redirect Rules → Create rule**, using the
   "Redirect from WWW to root" template:
   - Wildcard pattern, Request URL: `https://www.kwantum.net/*`. Cloudflare warns if the pattern
     starts with `*` instead of a protocol.
   - Target URL: `https://kwantum.net/${1}`
   - **301**, **Preserve query string** ticked
4. **SSL/TLS → Edge Certificates → Always Use HTTPS: on**. Check **SSL/TLS → Overview** is
   **Full** or **Full (strict)**. Use the dashboard search (Ctrl+K) if menus have moved.

**Testing tip:** right after the switch, some resolvers (including Google DNS) still returned the
old Netlify IP for a while. To test what Cloudflare is serving, pin the request:
```bash
curl -sI --resolve example.com:443:104.21.93.137 https://example.com/   # look for "Server: cloudflare"
```

Final checks we ran:
- `Server: cloudflare`, `CF-RAY …-MEL` (served from Melbourne)
- certificate valid for apex and `*.kwantum.net`
- `http://` → `https://` is a 301
- `www` → apex is a 301 and keeps the path and query string
- all pages 200, unknown page 404
- the form posts to `/api/contact`, and one real enquiry arrived

---

## Phase 3: tidy up

1. **Stop Netlify builds** *before* merging. Netlify → Project configuration → **Configuration**
   tab → Build settings → **Build status: Stopped builds**. In the 2026 Netlify UI "Site" is called
   "Project".
2. **Merge to `main`** (fast-forward, so the code is identical to what's live, and no visible change):
   ```bash
   git switch main
   git merge --ff-only cloudflare-migration
   git push origin main
   ```
3. **Cloudflare → Settings → Build → Branch control** → production branch back to `main`. From
   here every push to `main` goes live.
4. **Re-enable DNSSEC**: Cloudflare → kwantum.net → DNS → Settings → **Enable DNSSEC**, then
   paste the DS details into the registrar. Verify: the registry has the new DS (ours: key tag 2371,
   algorithm 13), and Google/Cloudflare DNS return `"AD": true`.
5. **Delete the migration branch** (local and remote).
6. **About a week later**, if nothing's gone wrong, delete the Netlify project (Project configuration
   → General → Delete project) and optionally remove Netlify's access to the GitHub repo.

---

## Reusing this for a client site

- Copy `worker/` and `wrangler.jsonc`. Change `name` to the client's Worker name.
- Point the client's contact form at `/api/contact` and add a `/form-error/` page.
- Best practice is for the **client to own a free Cloudflare account** and invite you as a member,
  so their domain and site are theirs and their usage is separate from yours.
- Set `CONTACT_TO` to the client's inbox. For sender:
  - simplest: `forms@kwantum.net` via your verified Resend domain (Reply goes to the enquirer)
  - more polished: verify the client's own domain in Resend and send from it
- Run the same DNS audit, and check DNSSEC every time.

## Checklist

- [ ] Audit DNS host, all records, DNSSEC, host-specific code
- [ ] Branch: Worker + wrangler.jsonc + form change + error page
- [ ] Local test with `wrangler dev`
- [ ] Resend domain verified, API key created
- [ ] Worker imported (Workers screen, not Pages), name matches config
- [ ] Production branch → migration branch, build, variables set, hard refresh
- [ ] workers.dev tested, including one real email
- [ ] Domain connected, records reviewed (`send` grey, Netlify records grey, helpers deleted)
- [ ] DNSSEC off, DS gone, 6 h wait
- [ ] Nameservers switched, email tested, zone Active
- [ ] Netlify records deleted → custom domains added (back to back)
- [ ] www→apex 301 rule, Always Use HTTPS, SSL Full
- [ ] Live site verified (server, cert, redirects, pages, real form email)
- [ ] Netlify builds stopped → merge to main → production branch = main
- [ ] DNSSEC re-enabled and validating
- [ ] Migration branch deleted
- [ ] Netlify project deleted after ~1 week
