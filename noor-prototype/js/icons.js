/* ============ Icons, bank logos, illustrations ============ */
(function(){
const P = {
  home:'<path d="M3.5 10.2 12 3l8.5 7.2V20a1.3 1.3 0 0 1-1.3 1.3h-4.7v-6.6H9.5v6.6H4.8A1.3 1.3 0 0 1 3.5 20v-9.8Z"/>',
  wallet:'<path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h12a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z"/><path d="M15 12h5.5v3.6H15a1.8 1.8 0 1 1 0-3.6Z"/>',
  qr:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><path d="M13.5 13.5h3v3h-3zM17.5 17.5h3v3h-3z"/>',
  pie:'<path d="M12 3a9 9 0 1 0 9 9h-9V3Z"/><path d="M15 3.6A9 9 0 0 1 20.4 9H15V3.6Z"/>',
  target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
  bell:'<path d="M6 9.5a6 6 0 0 1 12 0c0 4.2 1.6 5.6 2.3 6.4H3.7C4.4 15.1 6 13.7 6 9.5Z"/><path d="M9.8 19a2.3 2.3 0 0 0 4.4 0"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  chevR:'<path d="m9 5.5 6.5 6.5L9 18.5"/>',
  back:'<path d="M15 5.5 8.5 12l6.5 6.5"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:'<path d="M4 4.5 20 19.5M9.9 6c.7-.3 1.4-.5 2.1-.5 6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.4M6.6 7.3A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1"/>',
  plus:'<path d="M12 4.5v15M4.5 12h15"/>',
  send:'<path d="M6 18 18 6M9 6h9v9"/>',
  recv:'<path d="M18 6 6 18M15 18H6V9"/>',
  swap:'<path d="M7 4 3.5 7.5 7 11M3.5 7.5h13M17 13l3.5 3.5L17 20M20.5 16.5h-13"/>',
  card:'<rect x="3" y="5.5" width="18" height="13" rx="2.6"/><path d="M3 10h18M7 14.8h4"/>',
  shield:'<path d="M12 3 5 5.8v5.4c0 4.4 3 7.7 7 9.3 4-1.6 7-4.9 7-9.3V5.8L12 3Z"/>',
  shieldCheck:'<path d="M12 3 5 5.8v5.4c0 4.4 3 7.7 7 9.3 4-1.6 7-4.9 7-9.3V5.8L12 3Z"/><path d="m9 11.7 2.2 2.2 4-4.2"/>',
  lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.4"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  gear:'<circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3H9.8L9.4 5.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4.4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.06-.4.1-.8.1-1.2Z"/>',
  doc:'<path d="M6 3.5h8L19 8.5V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V5A1.5 1.5 0 0 1 6.5 3.5Z"/><path d="M14 3.5V9h5M8.5 13h7M8.5 16.5h7"/>',
  cal:'<rect x="3.5" y="5" width="17" height="16" rx="2.4"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  gift:'<rect x="3.5" y="8" width="17" height="4.5"/><path d="M5 12.5h14V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20v-7.5ZM12 8v13.5M12 8s-4.5.3-5.5-2C5.8 4.4 7.5 3 9 3.6c2.2.8 3 4.4 3 4.4Zm0 0s4.5.3 5.5-2C18.2 4.4 16.5 3 15 3.6c-2.2.8-3 4.4-3 4.4Z"/>',
  spark:'<path d="M12 2.8c.5 4 2.8 6.7 7.2 7.5-4.4.8-6.7 3.5-7.2 7.5-.5-4-2.8-6.7-7.2-7.5 4.4-.8 6.7-3.5 7.2-7.5Z"/><path d="M19 16.2c.25 1.8 1.3 3 3 3.4-1.7.4-2.75 1.6-3 3.4-.25-1.8-1.3-3-3-3.4 1.7-.4 2.75-1.6 3-3.4Z"/>',
  moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
  zap:'<path d="M13 2.5 4.5 13.5H11L9.5 21.5 18.5 10H12l1-7.5Z"/>',
  check:'<path d="m4.5 12.5 5 5L19.5 7"/>',
  x:'<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/>',
  mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5"/>',
  cam:'<path d="M3.5 8.5A2 2 0 0 1 5.5 6.5H8l1.5-2.5h5L16 6.5h2.5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9Z"/><circle cx="12" cy="12.7" r="3.4"/>',
  phone:'<rect x="6.5" y="2.5" width="11" height="19" rx="2.6"/><path d="M10.5 18.5h3"/>',
  globe:'<circle cx="12" cy="12" r="8.8"/><path d="M3.2 12h17.6M12 3.2c2.6 2.5 3.8 5.4 3.8 8.8s-1.2 6.3-3.8 8.8c-2.6-2.5-3.8-5.4-3.8-8.8s1.2-6.3 3.8-8.8Z"/>',
  refresh:'<path d="M20 5v5h-5M4 19v-5h5"/><path d="M5.5 9A7.5 7.5 0 0 1 19 7.5M18.5 15A7.5 7.5 0 0 1 5 16.5"/>',
  trash:'<path d="M4.5 6.5h15M9.5 6V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5V6M6.5 6.5 7.5 20a1.5 1.5 0 0 0 1.5 1.4h6A1.5 1.5 0 0 0 16.5 20l1-13.5"/>',
  alert:'<path d="M12 3.5 2.5 19.5h19L12 3.5Z"/><path d="M12 10v4.4M12 17.3v.2"/>',
  info:'<circle cx="12" cy="12" r="8.8"/><path d="M12 11v5.5M12 7.6v.2"/>',
  percent:'<path d="M19 5 5 19"/><circle cx="7.5" cy="7.5" r="2.6"/><circle cx="16.5" cy="16.5" r="2.6"/>',
  coins:'<ellipse cx="12" cy="6.5" rx="7.5" ry="3.2"/><path d="M4.5 6.5v5c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2v-5"/><path d="M4.5 11.5v5c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2v-5"/>',
  bag:'<path d="M5.5 8.5h13l-1 11a2 2 0 0 1-2 1.9h-7a2 2 0 0 1-2-1.9l-1-11Z"/><path d="M8.5 11V7a3.5 3.5 0 0 1 7 0v4"/>',
  food:'<path d="M5 3.5v7M8 3.5v7M6.5 3.5V21M6.5 10.5C5 10.5 4 9.5 4 8V3.5h5V8c0 1.5-1 2.5-2.5 2.5ZM15 13.5c0-5.5 1.8-10 4.5-10V21M19.5 13.5H15"/>',
  car:'<path d="M5 13.5 6.7 8a2 2 0 0 1 1.9-1.4h6.8A2 2 0 0 1 17.3 8L19 13.5M5 13.5h14M5 13.5a1.8 1.8 0 0 0-1.5 1.8v4.2h2.8v-2h11.4v2h2.8v-4.2a1.8 1.8 0 0 0-1.5-1.8"/><path d="M7 16.2h.2M16.8 16.2h.2"/>',
  heart:'<path d="M12 20.5S3.5 15.5 3.5 9.3A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.7c0 6.2-8.5 11.2-8.5 11.2Z"/>',
  film:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.4"/><path d="M8 4.5v15M16 4.5v15M3.5 9H8M3.5 15H8M16 9h4.5M16 15h4.5"/>',
  plane:'<path d="M10.5 13.5 4 11l-1.5 1.5 5 3 3 5L12 19l-2.5-6.5 6-5.7c.8-.8 2.3-1.1 3.2-.3.8.9.5 2.4-.3 3.2l-5.7 6"/>',
  grid:'<rect x="3.5" y="3.5" width="7.4" height="7.4" rx="2"/><rect x="13.1" y="3.5" width="7.4" height="7.4" rx="2"/><rect x="3.5" y="13.1" width="7.4" height="7.4" rx="2"/><rect x="13.1" y="13.1" width="7.4" height="7.4" rx="2"/>',
  logout:'<path d="M14.5 8V5.5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h6.5a2 2 0 0 0 2-2V16"/><path d="M9.5 12H21M18 8.5l3 3.5-3 3.5"/>',
  faceid:'<path d="M3.5 8V5.8A2.3 2.3 0 0 1 5.8 3.5H8M16 3.5h2.2a2.3 2.3 0 0 1 2.3 2.3V8M20.5 16v2.2a2.3 2.3 0 0 1-2.3 2.3H16M8 20.5H5.8a2.3 2.3 0 0 1-2.3-2.3V16"/><path d="M8.3 9v1.6M15.7 9v1.6M12 9.5v3.6h-1M8.7 15.4a4.6 4.6 0 0 0 6.6 0"/>',
  trendUp:'<path d="m3.5 16.5 5.5-5.5 3.5 3.5 7-7.5"/><path d="M14.5 7h5v5"/>',
  clock:'<circle cx="12" cy="12" r="8.8"/><path d="M12 7v5.4l3.4 2"/>',
  headset:'<path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4.5" height="6.5" rx="2"/><rect x="16.5" y="13" width="4.5" height="6.5" rx="2"/><path d="M20 19.5a3.5 3.5 0 0 1-3.5 2.5H14"/>',
  split:'<path d="M12 4v7M12 11l-5.5 6M12 11l5.5 6"/><circle cx="12" cy="4" r="1.6"/><circle cx="6.5" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/>',
  receipt:'<path d="M6 3h12v18l-2-1.4L14 21l-2-1.4L10 21l-2-1.4L6 21V3Z"/><path d="M9 8h6M9 12h6M9 15.5h3.5"/>',
  link:'<path d="M9.5 14.5 14.5 9.5M8 11 5.5 13.5a3.9 3.9 0 0 0 5.5 5.5L13.5 16M16 13l2.5-2.5A3.9 3.9 0 0 0 13 5L10.5 8"/>',
  fingerprint:'<path d="M12 11a3 3 0 0 0-3 3c0 2.5-.4 4.2-1.2 5.6M12 11a3 3 0 0 1 3 3c0 3-.2 5-1 7M12 7.5A6.5 6.5 0 0 0 5.5 14c0 1.6-.1 2.9-.5 4M12 7.5a6.5 6.5 0 0 1 6.5 6.5c0 .8 0 1.6-.1 2.3M8.8 4.4A9.5 9.5 0 0 1 21.5 14M4.7 8A9.4 9.4 0 0 0 2.5 14"/>',
  edit:'<path d="m4 20 .9-3.8L16.2 4.9a2 2 0 0 1 2.9 0 2 2 0 0 1 0 2.9L7.8 19.1 4 20Z"/>',
  share:'<path d="M12 3.5v12M12 3.5 7.5 8M12 3.5 16.5 8"/><path d="M5 12.5v6A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5v-6"/>',
  bank:'<path d="m3 9 9-5.5L21 9H3ZM5 9v8M9.7 9v8M14.3 9v8M19 9v8M3.5 17h17M2.5 20.5h19"/>',
  filter:'<path d="M4 5.5h16M7 12h10M10 18.5h4"/>',
  dollar:'<circle cx="12" cy="12" r="8.8"/><path d="M12 6.5v11M14.8 8.7c-.6-.9-1.6-1.3-2.8-1.3-1.5 0-2.7.8-2.7 2.1 0 2.8 5.6 1.6 5.6 4.5 0 1.4-1.3 2.2-2.9 2.2-1.4 0-2.5-.6-3-1.6"/>',
  store:'<path d="M4 7.5 5.5 3.5h13L20 7.5M4 7.5h16M4 7.5c0 1.4 1.1 2.5 2.7 2.5S9.3 8.9 9.3 7.5c0 1.4 1.2 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1.1 2.5 2.7 2.5S20 8.9 20 7.5M5.5 10v10.5h13V10M9.5 20.5v-6h5v6"/>',
  book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/>',
  hand:'<path d="M7 11V5.8a1.5 1.5 0 0 1 3 0V10M10 9.8V4.3a1.5 1.5 0 0 1 3 0V10M13 9.9V5.3a1.5 1.5 0 0 1 3 0V11M16 10.6V7.3a1.5 1.5 0 0 1 3 0v6.2A7.5 7.5 0 0 1 11.5 21 7.3 7.3 0 0 1 5 17l-2.3-4.3a1.5 1.5 0 0 1 2.6-1.5L7 13.6"/>',
  sun:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/>',
};
window.ic = (n, s=22, cls='', sw=1.8) =>
  `<svg class="${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]||P.info}</svg>`;

/* ---------- banks ---------- */
window.BANKS = {
  fab:     {name:'FAB',              full:'First Abu Dhabi Bank',      bg:'#FFFFFF', fg:'#012169', accent:'#E10600', short:'FAB'},
  wio:     {name:'Wio',              full:'Wio Bank',                  bg:'#1B1A4A', fg:'#FFFFFF', accent:'#8B7BFF', short:'WIO'},
  ei:      {name:'Emirates Islamic', full:'Emirates Islamic',          bg:'#0D5640', fg:'#E8C268', accent:'#E8C268', short:'EI'},
  enbd:    {name:'Emirates NBD',     full:'Emirates NBD',              bg:'#00337F', fg:'#FFFFFF', accent:'#7AC143', short:'NBD'},
  adcb:    {name:'ADCB',             full:'Abu Dhabi Commercial Bank', bg:'#C8102E', fg:'#FFFFFF', accent:'#fff',    short:'ADCB'},
  adib:    {name:'ADIB',             full:'Abu Dhabi Islamic Bank',    bg:'#143C8C', fg:'#FFFFFF', accent:'#3DAE2B', short:'ADIB'},
  cbd:     {name:'CBD',              full:'Commercial Bank of Dubai',  bg:'#22313F', fg:'#FFFFFF', accent:'#E3B23C', short:'CBD'},
  dib:     {name:'DIB',              full:'Dubai Islamic Bank',        bg:'#00594C', fg:'#FFFFFF', accent:'#C2A14D', short:'DIB'},
  mashreq: {name:'Mashreq',          full:'Mashreq Bank',              bg:'#FF5E00', fg:'#FFFFFF', accent:'#fff',    short:'M'},
  rak:     {name:'RAKBANK',          full:'The National Bank of RAK',  bg:'#D72A2F', fg:'#FFFFFF', accent:'#fff',    short:'RAK'},
  hsbc:    {name:'HSBC',             full:'HSBC UAE',                  bg:'#FFFFFF', fg:'#DB0011', accent:'#DB0011', short:'HSBC'},
  liv:     {name:'Liv',              full:'Liv by Emirates NBD',       bg:'#0E1B2C', fg:'#A4F44A', accent:'#A4F44A', short:'Liv'},
  sib:     {name:'Sharjah Islamic',  full:'Sharjah Islamic Bank',      bg:'#0E6B5C', fg:'#FFFFFF', accent:'#E8C268', short:'SIB'},
  ajman:   {name:'Ajman Bank',       full:'Ajman Bank',                bg:'#7A1E3C', fg:'#FFFFFF', accent:'#E8C268', short:'AJ'},
  noor:    {name:'Noor',             full:'Noor Wallet',               bg:'#D7F050', fg:'#0B1410', accent:'#0B1410', short:'n'},
  /* digital wallets */
  careem:  {name:'Careem Pay',       full:'Careem Pay wallet',         bg:'#37B44E', fg:'#FFFFFF', accent:'#fff',    short:'C'},
  payit:   {name:'payit',            full:'payit by FAB',              bg:'#00B5AD', fg:'#FFFFFF', accent:'#fff',    short:'pi'},
  emoney:  {name:'e& money',         full:'e& money wallet',           bg:'#E0001B', fg:'#FFFFFF', accent:'#fff',    short:'e&'},
  botim:   {name:'Botim Pay',        full:'Botim Pay wallet',          bg:'#2F6BFF', fg:'#FFFFFF', accent:'#fff',    short:'B'},
  /* BNPL */
  tabby:   {name:'Tabby',            full:'Tabby · buy now, pay later',bg:'#3EE5B5', fg:'#0B1410', accent:'#0B1410', short:'tabby'},
  tamara:  {name:'Tamara',           full:'Tamara · split & pay later',bg:'#1E2A26', fg:'#C7F4D4', accent:'#C7F4D4', short:'tamara'},
  postpay: {name:'Postpay',          full:'Postpay · pay later',       bg:'#16161A', fg:'#FFFFFF', accent:'#fff',    short:'pp'},
  cashew:  {name:'Cashew',           full:'Cashew payments',           bg:'#5B3DF5', fg:'#FFFFFF', accent:'#fff',    short:'cw'},
  /* crypto */
  binance: {name:'Binance',          full:'Binance exchange',          bg:'#181A20', fg:'#F0B90B', accent:'#F0B90B', short:'◆B'},
  rain:    {name:'Rain',             full:'Rain · regulated UAE exchange', bg:'#0E63F4', fg:'#FFFFFF', accent:'#fff', short:'R'},
  bitoasis:{name:'BitOasis',         full:'BitOasis exchange',         bg:'#0A2540', fg:'#4FE3C1', accent:'#4FE3C1', short:'bO'},
  /* invest / brokers */
  ibkr:    {name:'Interactive Brokers', full:'IBKR brokerage',         bg:'#D81222', fg:'#FFFFFF', accent:'#fff',    short:'IB'},
  sarwa:   {name:'Sarwa',            full:'Sarwa invest & trade',      bg:'#0E8A7B', fg:'#FFFFFF', accent:'#fff',    short:'S'},
  etoro:   {name:'eToro',            full:'eToro brokerage',           bg:'#59C12A', fg:'#FFFFFF', accent:'#fff',    short:'eT'},
};
window.blg = (id, size='') => {
  const b = BANKS[id] || {bg:'#444', fg:'#fff', short:'?'};
  return `<span class="blg ${size}" style="background:${b.bg};color:${b.fg}">${b.short}</span>`;
};

/* ---------- category meta ---------- */
window.CATS = {
  groceries:{n:'Groceries', ic:'bag',  c:'#53DE8E'},
  dining:   {n:'Dining out',ic:'food', c:'#FFB050'},
  transport:{n:'Transport', ic:'car',  c:'#6FB6FF'},
  shopping: {n:'Shopping',  ic:'gift', c:'#B89CFF'},
  bills:    {n:'Bills & utilities', ic:'zap', c:'#D7F050'},
  health:   {n:'Health',    ic:'heart',c:'#FF7A6B'},
  travel:   {n:'Travel',    ic:'plane',c:'#5EE6D0'},
  entertainment:{n:'Entertainment', ic:'film', c:'#FF8FC0'},
  income:   {n:'Income',    ic:'recv', c:'#53DE8E'},
  transfer: {n:'Transfers', ic:'swap', c:'#9DB2A6'},
  other:    {n:'Other',     ic:'grid', c:'#9DB2A6'},
};

/* ---------- avatar palette ---------- */
window.AVC = ['#6FB6FF','#B89CFF','#FF8FC0','#53DE8E','#FFB050','#5EE6D0','#FF7A6B'];
window.avx = (name, size='', emoji=null) => {
  const i = (name||'?').charCodeAt(0) % AVC.length;
  const init = (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('');
  return `<span class="avx ${size}" style="background:${emoji?'rgba(255,255,255,.1)':AVC[i]}">${emoji||init}</span>`;
};

/* ---------- product art ---------- */
window.ART = {
  ps5: `<svg width="92" height="64" viewBox="0 0 92 64" fill="none">
    <rect x="30" y="4" width="13" height="56" rx="6" fill="#E8ECF5"/><rect x="49" y="4" width="13" height="56" rx="6" fill="#10182B"/>
    <path d="M14 44c2-7 8-10 13-10 0 0 2 6-2 11s-9 5-13 5c0 0 0-2 2-6Z" fill="#3D4D78"/>
    <circle cx="76" cy="22" r="9" stroke="#3D4D78" stroke-width="3"/><path d="M72 40h9M76.5 36v9" stroke="#3D4D78" stroke-width="3" stroke-linecap="round"/></svg>`,
  iphone: `<svg width="80" height="64" viewBox="0 0 80 64" fill="none"><rect x="26" y="2" width="28" height="60" rx="7" fill="#0F1320" stroke="#46506B" stroke-width="2"/><rect x="34" y="6" width="12" height="4" rx="2" fill="#46506B"/><circle cx="40" cy="54" r="3" stroke="#46506B" stroke-width="1.6"/></svg>`,
  sofa: `<svg width="86" height="64" viewBox="0 0 86 64" fill="none"><rect x="10" y="22" width="66" height="22" rx="8" fill="#8B6F4E"/><rect x="4" y="30" width="12" height="20" rx="5" fill="#6E563B"/><rect x="70" y="30" width="12" height="20" rx="5" fill="#6E563B"/><rect x="14" y="14" width="58" height="14" rx="7" fill="#A0825D"/><path d="M12 50v8M74 50v8" stroke="#4A3A28" stroke-width="4" stroke-linecap="round"/></svg>`,
};

/* shield illustration for connect */
window.ILL = {
  shieldBig: `<div style="width:92px;height:92px;border-radius:30px;background:linear-gradient(135deg,#E6FA7E,#D7F050 60%,#B9D32E);display:flex;align-items:center;justify-content:center;color:#0B1410;box-shadow:0 18px 50px rgba(215,240,80,.35)">${ic('shieldCheck',46,'',1.6)}</div>`,
  lockGrey: `<div style="width:84px;height:84px;border-radius:26px;background:#F1F2F4;display:flex;align-items:center;justify-content:center;color:#16191C">${ic('lock',40,'',1.6)}</div>`,
  faceOval: `<div style="width:150px;height:196px;border-radius:18px;background:#FAFAFB;border:1px solid #E5E7EB;display:flex;align-items:center;justify-content:center;margin:0 auto">
     <svg width="92" height="116" viewBox="0 0 92 116"><ellipse cx="46" cy="58" rx="38" ry="52" fill="none" stroke="#1B7A4E" stroke-width="2.5"/><circle cx="34" cy="48" r="3" fill="#1B7A4E"/><circle cx="58" cy="48" r="3" fill="#1B7A4E"/><path d="M34 74c7 6 17 6 24 0" stroke="#1B7A4E" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg></div>`,
};
})();
