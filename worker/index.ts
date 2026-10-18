/**
 * Cloudflare Worker for kwantum.net.
 *
 * Static pages are served straight from ./dist by Cloudflare's asset handling and never reach
 * this code. Only /api/* runs here (see run_worker_first in wrangler.jsonc).
 *
 * POST /api/contact emails the contact form to CONTACT_TO via Resend, then redirects to
 * /thank-you/ (or /form-error/ if sending failed). Reusable on client sites: copy this file
 * and wrangler.jsonc, then set the three variables below in that site's Cloudflare dashboard.
 *
 *   RESEND_API_KEY  secret     Resend API key
 *   CONTACT_TO      text       where submissions go, e.g. mark@kwantum.net
 *   CONTACT_FROM    text       sender on a Resend-verified domain, e.g. Kwantum Website <forms@kwantum.net>
 *
 * The recipient is only ever read from these settings, never from the submitted form, so the
 * endpoint can't be abused to send mail to arbitrary addresses.
 */

interface Env {
  ASSETS: Fetcher;
  RESEND_API_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
}

const FIELDS = [
  { name: 'name', label: 'Name', required: true, max: 200 },
  { name: 'business', label: 'Business', required: false, max: 200 },
  { name: 'email', label: 'Email', required: true, max: 320 },
  { name: 'website', label: 'Website', required: false, max: 500 },
  { name: 'source', label: 'Found us via', required: false, max: 100 },
  { name: 'message', label: 'Message', required: true, max: 5000 },
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
      }
      return handleContact(request, env, url);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

async function handleContact(request: Request, env: Env, url: URL): Promise<Response> {
  const redirect = (path: string) => Response.redirect(new URL(path, url).toString(), 303);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirect('/form-error/');
  }

  // Honeypot: bots fill the hidden field. Pretend it worked so they don't retry.
  if (String(form.get('bot-field') ?? '').trim() !== '') {
    return redirect('/thank-you/');
  }

  const values: Record<string, string> = {};
  for (const field of FIELDS) {
    const value = String(form.get(field.name) ?? '').trim();
    if ((field.required && !value) || value.length > field.max) {
      return redirect('/form-error/');
    }
    values[field.name] = value;
  }
  if (!EMAIL_RE.test(values.email)) {
    return redirect('/form-error/');
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.error('Contact form is missing RESEND_API_KEY, CONTACT_TO or CONTACT_FROM');
    return redirect('/form-error/');
  }

  const text = FIELDS.map((f) => `${f.label}: ${values[f.name] || '-'}`).join('\n\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: env.CONTACT_TO.split(',').map((s) => s.trim()),
      reply_to: values.email,
      subject: `Website enquiry from ${values.name}${values.business ? ` (${values.business})` : ''}`,
      text: `New enquiry from ${url.hostname}\n\n${text}`,
    }),
  });

  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return redirect('/form-error/');
  }

  return redirect('/thank-you/');
}
