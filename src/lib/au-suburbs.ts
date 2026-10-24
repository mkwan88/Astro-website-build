// Suburbs and towns from every state and territory, used only for decorative motion (the hero
// map and the scrolling strip) to show "wherever your customers search". This is NOT a service
// area: the real service area lives in src/content/areas/ and must match the Google Business
// Profile. Keep anything rendered from this list aria-hidden and out of crawlable text.
export const AU_SUBURBS = [
  'Ascot Vale VIC', 'Moonee Ponds VIC', 'Fitzroy VIC', 'Geelong VIC', 'Ballarat VIC', 'Bendigo VIC',
  'Newtown NSW', 'Surry Hills NSW', 'Parramatta NSW', 'Penrith NSW', 'Wollongong NSW', 'Byron Bay NSW',
  'Fortitude Valley QLD', 'West End QLD', 'Southport QLD', 'Noosa Heads QLD', 'Toowoomba QLD', 'Cairns QLD',
  'Fremantle WA', 'Subiaco WA', 'Joondalup WA', 'Scarborough WA', 'Mandurah WA',
  'Glenelg SA', 'Norwood SA', 'Prospect SA', 'Mount Barker SA',
  'Sandy Bay TAS', 'Launceston TAS', 'Kingston TAS',
  'Braddon ACT', 'Belconnen ACT',
  'Parap NT', 'Alice Springs NT',
];

// Trades and shops people search for, paired with a suburb in the hero's search bubble.
export const SEARCH_TERMS = [
  'plumber', 'electrician', 'cafe', 'dentist', 'accountant', 'physio', 'florist', 'mechanic',
  'hairdresser', 'locksmith', 'bakery', 'vet', 'landscaper', 'builder', 'pet groomer',
];
