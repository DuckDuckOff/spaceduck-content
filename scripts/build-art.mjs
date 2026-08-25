import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standalone = process.argv.includes('--standalone');
const base = standalone ? '' : '/art';
const journal = standalone ? 'https://blog.spaceduck.ing' : '/';
const source = path.join(root, 'content/art');
const out = standalone ? path.join(root, 'art-dist') : path.join(root, 'blog-dist/art');

fs.mkdirSync(source, { recursive: true });
fs.mkdirSync(out, { recursive: true });

const esc = value => String(value ?? '').replace(/[&<>"]/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}[char]));

const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const logo = (klass = 'pop-mark') => `<svg class="${klass}" viewBox="0 0 100 100" role="img" aria-label="POP mark"><circle cx="31" cy="34" r="17"></circle><circle cx="69" cy="34" r="17"></circle><circle cx="50" cy="72" r="17"></circle></svg>`;

const pieces = fs.readdirSync(source)
  .filter(file => file.endsWith('.md'))
  .map(file => {
    const raw = fs.readFileSync(path.join(source, file), 'utf8');
    const match = raw.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
    const meta = {};
    let body = raw;
    if (match) {
      match[1].split(/\r?\n/).forEach(line => {
        const index = line.indexOf(':');
        if (index > 0) {
          meta[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
        }
      });
      body = match[2].trim();
    }
    const kind = meta.kind || (meta.lane === 'P-M0' ? 'moment' : 'poem');
    return {
      file,
      slug: slug(meta.slug || file.replace(/\.md$/, '')),
      title: meta.title || file.replace(/\.md$/, ''),
      lane: meta.lane || 'POP Art',
      kind,
      status: meta.status || (kind === 'moment' ? 'submitted' : 'published'),
      date: meta.date || '',
      author: meta.author || '',
      accountHandle: meta.account_handle || '',
      accountId: meta.account_id || '',
      accountWallet: meta.account_wallet || '',
      reference: meta.reference || '',
      rigStatus: meta.rig_status || '',
      rigCrystalId: meta.rig_crystal_id || '',
      rigFrequency: meta.rig_frequency || '',
      rigQFactor: meta.rig_q_factor || '',
      body,
    };
  });

const wordCount = text => String(text || '').trim().split(/\s+/).filter(Boolean).length;

const authSessionScript = `
  const sessionEndpoint = '/api/art?action=session';
  async function readSession() {
    const response = await fetch(sessionEndpoint, { credentials: 'include' });
    return await response.json().catch(() => ({}));
  }
  function rigSummary(rig) {
    if (!rig || typeof rig !== 'object') return '';
    const bits = [];
    if (rig.status) bits.push(String(rig.status).replace(/_/g, ' '));
    if (rig.crystal_id) bits.push(String(rig.crystal_id));
    if (rig.online !== undefined && rig.online !== null && rig.online !== '') bits.push(rig.online ? 'online' : 'offline');
    return bits.join(' · ');
  }
`;

const pieceAuthor = piece => piece.accountHandle || piece.author || 'spacepapes';
const pieceWords = piece => wordCount(piece.body);
const pieceStatus = piece => piece.status || (piece.kind === 'moment' ? 'submitted' : 'published');
const pieceLink = piece => `${base}/${piece.slug}/`;

const publishedPoem = {
  id: 'poem_cccff902-d090-4a74-940d-2232c07f466d',
  title: 'Everybody Wonders',
  author: 'spacepapes',
  created_at: '2026-08-13',
  body: `Hero’s doses
Of dark demon potions
Take it all
It’s Funny
-cannot come
Till I’m willing

I’m feeling forces
And oxygen losses 
A battlefront 
Barren 
If the water doesn’t mind

There’s War on the wastelands
Thoughts here are traced and 
Orders are all taller than any standards being staked yet

So price a piece to pay now
Parle piu
-Per the pound
Your very essence to the decimal 
Face tests on radars now

So maybe thank those on the inside
Cause Falling free is all but false?
Invading space between all places
There’s still some angels you can call

Cos It’s never easy when the worry brings you 
more warmth than the hope
Before the windows crack and doors fly back &
they take all that you know

Let’s be real- that’s a deal
But see, I know how you feel
So like sometimes 
I’ll play with my food 

And in your sleep 
or your cistern 
You’ll think you’ve misheard it, oh
I’ll reveal something to you. 

You’ll just feel stupid, 
sick and superstitious 
But Soon the sounds will soothe your vision
Something stirs 
Where eyes were shut before. 

The music, pressure
The truth, your treasure 
Lost far beneath 
The highs that made you fall

So come back now, pray tell us how
The freedom tastes outside
When it’s all for one, and they take one from all 
Without the vacancies left to reside

Now I’m a fortress transparent 
My thoughts still, in fairness,
I refrain from relaying them twice 

I take logic and conscience 
Make sense of the nonesense 
It’s pretty straightforward, concise. 

I’m an artiifact
Still Hardly hacked 
And I’m proud to have to heal

Be it heart attack
Fucking cardiac 
Or a shark attack
For real

There’s an unspoken door
Held by some guarantor 
And I’ve been funny but don’t get me wrong

There’s no argument for
Playing hearts tug of war 
When the souls singing solitary songs

So I’m so sorry
They listen 
I can’t hurry decisions
That depend on the detriments view

I’m a noise in precision 
My choice was to visit 
I was told
I might ration with you. 

 But its your call
Entirely
You call for them quietly
But don’t let me make up your mind

There’s no portal-
..If hide and seek All ends in violence 
and
You can’t leave that wreckage alive

My message it serves as
Both
Blessing and curse 
To the vessel that heard me fight back. 

In my lessons I’ve learned
There’s no death
 Only murder
And I guess I should leave it at that.`
};

const momentsCopy = [
  'We have a market for things and a space for art. But Pop:Moments happen too: uncanny alignments, sideways leaps, working fragments, shared realizations, and flashes of brilliance that arrive before the world has learned how to recognize them.',
  'Too many ideas from neurodivergent people, developers, builders, artists, and other sideways minds are dismissed because they do not yet fit the language, institutions, or socioeconomic circles around them. Pop:Moments exists to document those ideas while they are alive so they have evidence, context, and a chance to unfold, connect with other minds, and take place in the future.',
];

const topNav = active => `
  <header class="topbar">
    <a class="brand" href="${base}/">${logo('brand-mark')}<span>POP Art</span></a>
    <nav class="nav-links" aria-label="Primary">
      <a href="${base}/poetic-resonance/"${active === 'poetic' ? ' class="active"' : ''}>Poetic Resonance</a>
      <a href="${base}/moments/"${active === 'moments' ? ' class="active"' : ''}>Pop:Moments</a>
      <a href="${base}/submit/"${active === 'submit' ? ' class="active"' : ''}>Submit poetry</a>
      <a href="${base}/moments/submit/"${active === 'moment-submit' ? ' class="active"' : ''}>Create a Pop-Mo</a>
      <a href="${journal}">Journal</a>
    </nav>
  </header>`;

const shell = ({ title, description, body, active = '', className = '' }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${esc(description || '')}">
  <title>${esc(title)} - POP Art</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${base}/styles.css">
</head>
<body>
${topNav(active)}
<main class="page ${className}">${body}</main>
</body>
</html>`;

const styles = `:root{
  color-scheme: light;
  --paper:#fbfaf7;
  --surface:#ffffff;
  --surface-soft:#f4f0fb;
  --ink:#18222d;
  --muted:#66727d;
  --line:#e7e4dd;
  --accent:#a06fa9;
  --violet:#76558f;
  --shadow:0 20px 60px rgba(45,38,77,.08);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;
  color:var(--ink);
  font:400 16px/1.7 Poppins,system-ui,sans-serif;
  background:
    radial-gradient(circle at top left, rgba(160,111,169,.08), transparent 26%),
    radial-gradient(circle at right top, rgba(248,229,216,.7), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, var(--paper) 24%, var(--paper) 100%);
}
a{color:var(--accent);text-decoration:none}
a:hover{color:var(--violet)}
h1,h2,h3{margin:0;font-family:Poppins,system-ui,sans-serif;line-height:1.08;font-weight:700;letter-spacing:-.05em}
h1{font-size:clamp(2rem,4vw,3.6rem)}
h2{font-size:clamp(1.25rem,2.4vw,2rem)}
h3{font-size:1rem}
p{margin:0}
.topbar{
  position:sticky;
  top:0;
  z-index:20;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:16px;
  flex-wrap:wrap;
  padding:18px 28px;
  border-bottom:1px solid rgba(231,228,221,.88);
  background:rgba(251,250,247,.9);
  backdrop-filter:blur(16px);
}
.brand{
  display:inline-flex;
  align-items:center;
  gap:10px;
  color:var(--violet);
  font-size:1rem;
  font-weight:800;
  letter-spacing:.18em;
  text-transform:uppercase;
}
.brand-mark{
  width:30px;
  height:30px;
  flex:0 0 auto;
  fill:var(--accent);
  filter:drop-shadow(0 7px 14px rgba(160,111,169,.18));
}
.nav-links{
  display:flex;
  flex-wrap:wrap;
  gap:18px;
  font-size:.76rem;
  color:var(--muted);
}
.nav-links a{
  color:inherit;
  text-transform:uppercase;
  letter-spacing:.14em;
  padding:4px 0;
}
.nav-links a.active,.nav-links a:hover{color:var(--violet)}
.page{
  max-width:1120px;
  margin:0 auto;
  padding:0 20px 56px;
}
.hero{
  display:grid;
  grid-template-columns:1.12fr .88fr;
  gap:30px;
  align-items:center;
  padding:74px 0 36px;
}
.hero--single{
  grid-template-columns:1fr;
  max-width:820px;
}
.hero-copy,.lead,.catalogue-intro,.moments-copy,.page-note{color:#52636b}
.hero-copy,.lead,.catalogue-intro{font-size:clamp(1.05rem,1.8vw,1.35rem);line-height:1.7}
.tag,.eyebrow{
  display:inline-block;
  color:var(--accent);
  font-size:.72rem;
  font-weight:800;
  letter-spacing:.18em;
  text-transform:uppercase;
}
.tag{
  margin-bottom:18px;
  padding:7px 16px;
  border:1px solid rgba(160,111,169,.2);
  border-radius:999px;
  background:#fff;
}
.page-brand{
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap:12px;
}
.page-brand-row{
  display:flex;
  align-items:center;
  gap:16px;
  flex-wrap:wrap;
}
.page-brand-logo{
  width:84px;
  height:84px;
  flex:0 0 auto;
  fill:var(--accent);
  transform:none;
  filter:drop-shadow(0 10px 20px rgba(160,111,169,.16));
}
.page-brand-row h1{margin:0}
.hero p{max-width:760px}
.hero-actions{
  display:flex;
  gap:12px;
  flex-wrap:wrap;
  margin-top:26px;
}
.btn, .button-link, .copy-token, .copy-button, button{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  padding:11px 18px;
  border-radius:999px;
  border:1px solid transparent;
  font:inherit;
  cursor:pointer;
  transition:transform .18s ease, box-shadow .18s ease, background .18s ease;
}
.btn:hover,.button-link:hover,.copy-token:hover,.copy-button:hover,button:hover{transform:translateY(-1px)}
.btn-primary,.button-link,button,.copy-token,.copy-button{
  background:var(--accent);
  color:#fff8ff;
  font-weight:700;
  box-shadow:0 14px 32px rgba(160,111,169,.22);
}
.btn-primary:hover,.button-link:hover,button:hover,.copy-token:hover,.copy-button:hover{background:var(--violet)}
.btn-secondary,.text-link{
  background:#fff;
  color:var(--violet);
  border-color:#d6d1e5;
  box-shadow:none;
}
.btn-sm{padding:8px 14px;font-size:.8rem}
.section{padding:34px 0 10px}
.section-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:2rem;
  margin:0 0 22px;
}
.section-head p{margin-top:12px;color:var(--muted);line-height:1.7;max-width:760px}
.section-head h2{margin-top:10px;font-size:clamp(1.45rem,2.6vw,2.3rem);line-height:1.04;letter-spacing:-.05em;color:#202533;text-transform:none}
.status-chip,.chain-state{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border:1px solid var(--line);
  border-radius:999px;
  padding:.45rem .8rem;
  color:var(--muted);
  font-size:.75rem;
  background:#fff;
}
.two-col,.grid,.room-grid,.moment-grid,.statement-grid,.poetry-table,.catalogue-grid{
  display:grid;
  gap:16px;
}
.two-col{grid-template-columns:repeat(2,minmax(0,1fr));padding-bottom:56px}
.room-grid{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:16px}
.statement-grid{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:16px}
.site-card,.story-card,.protocol-card,.feed-card,.panel,.room-grid > a,.piece,.moment,.full-piece,.catalogue-shell,.publish-panel,.note-panel,.timeline{
  border:1px solid var(--line);
  border-radius:24px;
  background:var(--surface);
  box-shadow:var(--shadow);
}
.site-card,.story-card,.protocol-card,.feed-card,.piece,.moment,.full-piece,.publish-panel,.note-panel,.timeline{padding:22px}
.room-grid > a{
  min-height:320px;
  padding:2.2rem;
  text-decoration:none;
  background:radial-gradient(circle at 80% 10%, rgba(160,111,169,.12), transparent 42%), var(--surface);
}
.room-grid span{color:var(--muted);font-size:.7rem;text-transform:uppercase;letter-spacing:.1em}
.room-grid p{max-width:470px;color:var(--muted);margin-top:12px}
.room-grid strong{display:block;margin-top:3rem;color:var(--accent);font-size:.85rem}
.room-grid h2{color:var(--ink);font-size:clamp(1.55rem,3vw,2.6rem);margin-top:8px}
.story-card h3,.protocol-card h3,.site-card h3{color:var(--violet)}
.story-card p,.protocol-card p,.site-card p,.feed-card p{color:var(--muted);line-height:1.65;margin-top:12px}
.site-card ul{list-style:none;display:grid;gap:10px;margin:0;padding:0}
.site-card li{color:var(--muted);font-size:.92rem;line-height:1.5;padding-left:14px;position:relative}
.site-card li::before{content:'';position:absolute;left:0;top:.5em;width:6px;height:6px;border-radius:50%;background:var(--accent)}
.feed-grid,.upload-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.feed-row{
  display:flex;
  justify-content:space-between;
  gap:12px;
  padding:14px 0;
  border-top:1px solid var(--line);
}
.feed-row:first-child{border-top:0;padding-top:0}
.feed-row strong,.poem-title{display:block;color:var(--ink)}
.feed-row span,.preview,.note,.page-note{display:block;color:var(--muted);font-size:.92rem;line-height:1.55;margin-top:4px}
.pill{
  display:inline-flex;
  align-items:center;
  height:fit-content;
  padding:.4rem .7rem;
  border-radius:999px;
  border:1px solid var(--line);
  color:var(--muted);
  font-size:.72rem;
  background:#fff;
  white-space:nowrap;
}
.moments-hero{
  padding:72px 0 34px;
}
.moments-copy{
  max-width:920px;
  font-size:clamp(1rem,1.8vw,1.25rem);
  line-height:1.7;
}
.moments-copy + .moments-copy{margin-top:18px}
.moment-grid{grid-template-columns:repeat(auto-fit,minmax(270px,1fr));margin-top:16px}
.moment{overflow:hidden;padding:0}
.default-mark,.square-preview{
  aspect-ratio:1/1;
  background:radial-gradient(circle at 50% 40%, #f1e5f3, #fffafe 65%);
  position:relative;
  display:grid;
  place-items:center;
  border-bottom:1px solid var(--line);
}
.default-mark i{position:absolute;width:16%;aspect-ratio:1;border-radius:50%;background:var(--accent);box-shadow:0 0 35px rgba(160,111,169,.22)}
.default-mark i:nth-child(1){transform:translateY(-70%)}
.default-mark i:nth-child(2){transform:translate(-65%,45%)}
.default-mark i:nth-child(3){transform:translate(65%,45%)}
.moments-token-mark{transform:rotate(180deg)}
.moment > div:last-child{padding:1.5rem}
.token-code{color:var(--accent);font:600 .75rem ui-monospace,monospace}
.poetry-shell{padding-top:34px}
.metric-key{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:18px;
}
.metric-key span,.poem-row,.poem-summary,.poem-address,.copy-row,.publish-banner,.key-chip{
  border:1px solid var(--line);
  border-radius:18px;
  background:#fff;
}
.metric-key span{
  padding:10px 14px;
  color:var(--muted);
  font-size:.88rem;
}
.metric-key b{color:var(--accent)}
.poetry-table{grid-template-columns:1fr}
.table-head,.poem-row{
  display:grid;
  grid-template-columns:minmax(0,1fr) 80px 80px 80px 120px;
  gap:12px;
  align-items:center;
}
.table-head{
  padding:0 18px;
  color:var(--muted);
  font-size:.76rem;
  text-transform:uppercase;
  letter-spacing:.12em;
}
.poem-row{
  margin-top:12px;
  padding:16px 18px;
  text-decoration:none;
  box-shadow:var(--shadow);
}
.poem-row.active{border-color:rgba(160,111,169,.28);background:var(--surface-soft)}
.poem-summary{display:flex;flex-direction:column;gap:6px;padding:0;border:0;background:transparent}
.poem-title{font-size:1rem;font-weight:700}
.spectrum{color:var(--accent);font-size:.88rem;text-align:right}
.full-piece{margin-top:22px}
.piece-heading{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
}
.piece-heading h1{font-size:clamp(1.65rem,3.2vw,2.8rem);margin-top:8px}
.verbatim{
  white-space:pre-wrap;
  tab-size:4;
  overflow-wrap:break-word;
  font-size:1.08rem;
  line-height:1.85;
  color:var(--ink);
}
.poem-address,.copy-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:12px 14px;
  margin-top:18px;
}
.poem-address code{overflow:auto;font-size:.86rem;color:var(--violet)}
.copy-token,.copy-button{padding:.75rem 1rem}
.sidebar-note,.status,.empty-state{color:var(--muted)}
form{
  max-width:820px;
  padding:2rem;
  border:1px solid var(--line);
  border-radius:24px;
  background:rgba(255,255,255,.92);
  box-shadow:var(--shadow);
}
form label{display:block;margin-top:1.2rem;color:var(--muted);font-size:.85rem;font-weight:600}
form input,form textarea{
  display:block;
  width:100%;
  margin:.6rem 0 1.2rem;
  padding:1rem 1.1rem;
  background:#fbf7fc;
  color:var(--ink);
  border:1px solid var(--line);
  border-radius:12px;
  font:400 1rem/1.6 Poppins,system-ui,sans-serif;
}
form textarea{min-height:220px;resize:vertical}
.check{display:flex!important;gap:.8rem;align-items:flex-start}
.check input{width:auto;margin:.35rem 0}
.square-preview{width:min(100%,420px);border:1px solid var(--line);border-radius:18px;overflow:hidden}
.square-preview img{width:100%;height:100%;object-fit:cover}
.generation-note{max-width:280px;text-align:center;color:var(--violet)}
.context-state{margin:1rem 0;padding:1rem;border:1px dashed var(--line);border-radius:12px;color:var(--muted)}
.landing{max-width:1240px}
.landing section{padding:6rem 0;border-bottom:1px solid var(--line)}
.landing-hero{padding-top:4rem!important}
.landing-hero h1{max-width:970px;font-size:clamp(2rem,4.8vw,3.9rem)}
.landing-hero .hero-copy{max-width:920px;font-size:clamp(1.05rem,2.1vw,1.5rem)}
.signal-field{
  display:flex;
  align-items:center;
  gap:.8rem;
  margin-top:5rem;
  color:var(--muted);
  font:500 .65rem ui-monospace,monospace;
  text-transform:uppercase;
  letter-spacing:.08em;
}
.signal-field i{
  height:1px;
  flex:1;
  background:linear-gradient(90deg,var(--line),var(--accent),var(--line));
}
.statement h2,.collective h2{max-width:900px;font-size:clamp(1.65rem,3.4vw,2.9rem)}
.statement-grid{display:grid;grid-template-columns:1fr 1fr;gap:4rem;margin-top:3rem;color:#5f5366}
.section-title{display:flex;justify-content:space-between;gap:3rem;align-items:end}
.section-title h2{max-width:700px}
.principles{display:flex;flex-wrap:wrap;gap:.7rem;margin-top:3rem}
.principles span{padding:.55rem .9rem;border:1px solid var(--line);border-radius:99px;color:var(--muted);font-size:.72rem;background:#fff}
.landing-footer{
  display:flex;
  gap:2rem;
  flex-wrap:wrap;
  padding:3rem 0;
  color:var(--muted);
  font-size:.75rem;
}
.landing-footer span{margin-right:auto}
@media(max-width:1000px){
  .hero,.two-col,.feed-grid,.upload-grid,.room-grid,.statement-grid,.table-head,.poem-row{grid-template-columns:1fr}
  .section-head{display:block}
  .piece-heading{flex-direction:column}
}
@media(max-width:700px){
  .topbar{padding:14px 16px}
  .nav-links{gap:12px}
  .page{padding:0 16px 44px}
  .hero,.moments-hero{padding:48px 0 28px}
  .page-brand-logo{width:72px;height:72px}
  .hero-actions{gap:10px}
  .room-grid > a{min-height:280px;padding:1.5rem}
  .landing section{padding:4rem 0}
}
`;

const buildPoetryPage = () => {
  const poetryEntries = [
    {
      id: publishedPoem.id,
      title: publishedPoem.title,
      body: publishedPoem.body,
      author: publishedPoem.author,
      created_at: publishedPoem.created_at,
      status: 'published',
      lane: 'Poetic Resonance',
      kind: 'poem',
      slug: publishedPoem.id,
    },
    ...pieces.filter(piece => piece.kind === 'poem' || piece.lane === 'Poetic Resonance').map(piece => ({
      id: piece.slug,
      title: piece.title,
      body: piece.body,
      author: pieceAuthor(piece),
      created_at: piece.date,
      status: pieceStatus(piece),
      lane: piece.lane,
      kind: piece.kind,
      slug: piece.slug,
      accountHandle: piece.accountHandle,
      accountId: piece.accountId,
      accountWallet: piece.accountWallet,
      reference: piece.reference,
      rigStatus: piece.rigStatus,
      rigCrystalId: piece.rigCrystalId,
      rigFrequency: piece.rigFrequency,
      rigQFactor: piece.rigQFactor,
    })),
  ];
  const poemRows = poetryEntries.map(piece => {
    const isCanonical = piece.id === publishedPoem.id;
    const href = isCanonical ? `#poem_${publishedPoem.id}` : `${base}/${piece.slug}/`;
    const ring = isCanonical ? 'open' : 'read';
    return `<a class="poem-row${isCanonical ? ' active' : ''}" href="${href}">
      <span class="poem-summary">
        <span class="poem-title">${esc(piece.title)}</span>
        <span class="preview">${isCanonical ? 'The collection is available. Open the poem to read the full signal.' : `Published from the signed-in account ${esc(piece.author)}.`}</span>
      </span>
      <span class="spectrum">${pieceWords(piece)} words</span>
      <span class="spectrum">${esc(pieceStatus(piece))}</span>
      <span class="spectrum">${esc(pieceAuthor(piece))}</span>
      <span class="spectrum">${ring}</span>
    </a>`;
  }).join('');

  return shell({
    title: 'Poetic Resonance',
    description: 'The POP Art poetry collection, preserved verbatim and arranged as a published signal.',
    active: 'poetic',
    className: 'poetry-shell',
    body: `
      <section class="hero hero--single">
        <div class="page-brand">
          <div class="tag">Poetic Resonance</div>
          <div class="page-brand-row">
            ${logo('page-brand-logo')}
            <h1>POPart</h1>
          </div>
        </div>
        <p class="hero-copy">POP Art is the encounter layer. It gives poems, observations, and signals a place to meet in their own language, because information travels differently through different minds. Poetic Resonance keeps a space where we can share what we notice, preserve the shape it arrived in, and let minted works hang off the submission without flattening the original.</p>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <p class="eyebrow">Published collection</p>
            <h2>${esc(publishedPoem.title)}</h2>
            <p>One canonical poem is live here now, held in full and kept exactly as it was offered. Signed-in submissions join the same collection with the account that published them.</p>
          </div>
          <span class="status-chip">${poetryEntries.length} poem${poetryEntries.length === 1 ? '' : 's'} live</span>
        </div>
        <div class="poetry-table">
          <div class="table-head">
            <span>Piece</span><span>Words</span><span>Status</span><span>Account</span><span>Open</span>
          </div>
          <div id="poem-list">${poemRows}</div>
        </div>
      </section>

      <article id="${publishedPoem.id}" class="full-piece">
        <div class="piece-heading">
          <div>
            <p class="eyebrow">Poetic Resonance / full signal</p>
            <h1>${esc(publishedPoem.title)}</h1>
            <p class="page-note">Published verbatim on ${esc(publishedPoem.created_at)} by ${esc(publishedPoem.author)}.</p>
          </div>
          <span class="chain-state">published · awaiting mint</span>
        </div>
        <div class="verbatim">${esc(publishedPoem.body)}</div>
        <div class="poem-address">
          <code>https://art.pops.mobi/poetic-resonance/#poem_${esc(publishedPoem.id)}</code>
          <button class="copy-token" type="button" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent).then(()=>{const prev=this.textContent;this.textContent='Copied';setTimeout(()=>this.textContent=prev,1200)})">Copy</button>
        </div>
      </article>
    `,
  });
};

const buildMomentsPage = () => {
  const momentEntries = pieces.filter(piece => piece.kind === 'moment' || piece.lane === 'P-M0');
  const momentCards = momentEntries.length > 0
    ? momentEntries.map(piece => `
        <article class="moment">
          <div class="default-mark moments-token-mark" aria-label="POP three-dot mark"><i></i><i></i><i></i></div>
          <div>
            <p class="token-code">P-M0 · ${esc(pieceAuthor(piece))}</p>
            <h3>${esc(piece.title)}</h3>
            <p class="note">${piece.reference ? `References ${esc(piece.reference)}.` : 'Signed-in moment record.'}</p>
            <p class="note">${esc(piece.date || 'Undated')} · ${esc(pieceStatus(piece))}</p>
            <a class="text-link" href="${pieceLink(piece)}">Open record</a>
          </div>
        </article>
      `).join('')
    : `
        <article class="moment">
          <div class="default-mark moments-token-mark" aria-label="POP three-dot mark"><i></i><i></i><i></i></div>
          <div>
            <p class="token-code">P-M0</p>
            <h3>The first moments are waiting.</h3>
            <p class="note">Signed-in submissions will appear here and link to their WAZAAR listing and canonical Chart metadata.</p>
          </div>
        </article>
      `;
  return shell({
    title: 'Pop:Moments',
    description: 'POP moments are records for uncanny alignments, shared openings, and ideas that deserve time to unfold.',
    active: 'moments',
    body: `
      <section class="moments-hero">
        <div class="page-brand">
          <div class="tag">Pop:Moments</div>
          <div class="page-brand-row">
            ${logo('page-brand-logo')}
            <h1>Moments</h1>
          </div>
        </div>
        <p class="moments-copy">We have a market for things and a space for art. But Pop:Moments happen too: uncanny alignments, sideways leaps, working fragments, shared realizations, and flashes of brilliance that arrive before the world has learned how to recognize them.</p>
        <p class="moments-copy">Too many ideas from neurodivergent people, developers, builders, artists, and other sideways minds are dismissed because they do not yet fit the language, institutions, or socioeconomic circles around them. Pop:Moments exists to document those ideas while they are alive so they have evidence, context, and a chance to unfold, connect with other minds, and take place in the future.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="${base}/moments/submit/">Record a Pop-Mo</a>
          <a class="btn btn-secondary" href="https://wazaar.pops.mobi">Explore through WAZAAR</a>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <p class="eyebrow">An intricate map</p>
            <h2>What we notice shapes what becomes possible.</h2>
          </div>
          <span class="status-chip">P-M0 registry opening</span>
        </div>
        <div class="statement-grid">
          <p>A thinking mind is not a straight road. It is an intricate map of associations, sensitivities, memories, patterns, interruptions, and improbable connections. Collective creation depends on this difference: one person notices the signal another person was taught to ignore.</p>
          <p>The uncanny happenings moving through our lives help decide what communities call normal, credible, valuable, or worthy of attention. Recording them is not nostalgia. It gives overlooked thought a social and economic history, and lets people across communities find, credit, support, and build upon one another's work.</p>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <p class="eyebrow">The collective object</p>
            <h2>Every documented opening becomes a Pop-Mo.</h2>
          </div>
        </div>
        <div class="room-grid">
          <a href="${base}/moments/submit/">
            <span>P-M0 token</span>
            <h2>Record a Pop-Mo</h2>
            <p>A Pop-Mo is a square graphic record with a title, creator account, timestamp, chain anchor, and the verified crystal or rig online at mint time.</p>
            <strong>Open the submission form →</strong>
          </a>
          <a href="${base}/poetic-resonance/">
            <span>Anchor point</span>
            <h2>Poetic Resonance</h2>
            <p>Moments can point back to a poem, a line, or a shared observation, keeping the social record attached to the original signal.</p>
            <strong>Read the published poem →</strong>
          </a>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <p class="eyebrow">Moment register</p>
            <h2>Pop-Mo tokens</h2>
          </div>
          <span class="status-chip">${momentEntries.length > 0 ? `${momentEntries.length} moment${momentEntries.length === 1 ? '' : 's'}` : 'No moments yet'}</span>
        </div>
        <div class="moment-grid">
          ${momentCards}
        </div>
      </section>
    `,
  });
};

const buildLandingPage = () => {
  const cards = [
    ['Poetic Resonance', 'Published collection', 'Verbatim poems with measurable textual spectra.', `${base}/poetic-resonance/`],
    ['Pop:Moments', 'P-M0 lane', 'Uncanny alignments, openings, and shared records.', `${base}/moments/`],
    ['Submit poetry', 'Publish', 'Add a new poem to the collection when it is ready.', `${base}/submit/`],
    ['Journal', 'Spaceduck', 'The wider field notes and build logs around the network.', journal],
  ];

  return shell({
    title: 'POP Art',
    description: 'POP Art is a living room for image, language, experiment, and resonance.',
    active: '',
    className: 'landing',
    body: `
      <section class="hero landing-hero">
        <div>
          <p class="eyebrow">SpaceDuck / POP</p>
          <h1>Different minds. Different signals. A place for them to travel.</h1>
          <p class="hero-copy">POP Art is a living room for language, image, rhythm, code, physical resonance, unfinished thought, and the moments that happen between them. It exists because information does not move through every mind in the same shape, and because an idea should not have to become conventional before it can be witnessed, credited, connected, or given a future.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="${base}/poetic-resonance/">Enter Poetic Resonance</a>
            <a class="btn btn-secondary" href="${base}/moments/">Discover Pop:Moments</a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <p class="eyebrow">Rooms in the space</p>
            <h2>Everything has a room, and every room has a language.</h2>
          </div>
        </div>
        <div class="room-grid">
          ${cards.map(([title, label, copy, href]) => `
            <a href="${href}">
              <span>${esc(label)}</span>
              <h2>${esc(title)}</h2>
              <p>${esc(copy)}</p>
              <strong>Open →</strong>
            </a>
          `).join('')}
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <p class="eyebrow">What this is for</p>
            <h2>POP is for noticing things before the world names them.</h2>
          </div>
        </div>
        <div class="statement-grid">
          <p>It is for art that stays exact. It is for moments that need a record. It is for language that should not be flattened into a generic system before anyone gets to witness it.</p>
          <p>The project keeps a place for poems, moments, submissions, and the surrounding notes that make them legible to the next person who arrives.</p>
        </div>
      </section>
    `,
  });
};

const buildSubmitPage = () => shell({
  title: 'Submit poetry',
  description: 'Submit a poem to Poetic Resonance, published verbatim without rewriting or correction.',
  active: 'submit',
  body: `
    <section class="hero hero--single">
      <div class="page-brand">
        <div class="tag">Poetic Resonance</div>
        <div class="page-brand-row">
          ${logo('page-brand-logo')}
          <h1>Submit your poetry</h1>
        </div>
      </div>
      <p class="lead">Your submission will be published verbatim. Please proofread it first: this site will not correct, rewrite, edit or use AI to alter the text.</p>
    </section>
    <div id="session-state" class="context-state">Checking your signed-in account...</div>
    <form id="form">
      <label>Title</label>
      <input name="title" placeholder="Give this piece a title" required>
      <label>Your poem</label>
      <textarea name="body" placeholder="Paste your poem exactly as you want it published" required></textarea>
      <input name="website" style="display:none">
      <button type="submit" disabled>Publish as signed-in account</button>
      <p id="status" class="note"></p>
    </form>
    <script>
      ${authSessionScript}
      const form = document.getElementById('form');
      const status = document.getElementById('status');
      const sessionState = document.getElementById('session-state');
      const submitButton = form.querySelector('button[type="submit"]');
      async function syncSession() {
        try {
          const session = await readSession();
          if (session.authenticated) {
            sessionState.innerHTML = 'Signed in as <strong>' + (session.handle || 'your account') + '</strong>. Posts publish directly to your profile and the public gallery.';
            submitButton.disabled = false;
            return;
          }
          sessionState.innerHTML = 'Sign in on <a href="https://home.pops.mobi">home.pops.mobi</a> to publish without a password.';
        } catch {
          sessionState.textContent = 'Could not read your sign-in state right now.';
        }
      }
      syncSession();
      form.onsubmit = async e => {
        e.preventDefault();
        if (submitButton.disabled) {
          status.textContent = 'Sign in first to publish from your account.';
          return;
        }
        status.textContent = 'Submitting';
        const r = await fetch('/api/art', {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({
            action: 'submit',
            title: form.title.value,
            body: form.body.value,
            website: form.website.value
          })
        });
        const j = await r.json();
        status.textContent = j.message || j.error || 'Done';
        if (j.url) location.href = j.url;
      };
    </script>
  `,
});

const buildMomentSubmitPage = () => shell({
  title: 'Create a Pop-Mo',
  description: 'Record a Pop-Mo, a moment record tied back to a poem or observation.',
  active: 'moment-submit',
  body: `
    <section class="hero hero--single">
      <div class="page-brand">
        <div class="tag">P-M0 submission</div>
        <div class="page-brand-row">
          ${logo('page-brand-logo')}
          <h1>Record a Pop-Mo</h1>
        </div>
      </div>
      <p class="lead">Document the moment first. Minting happens only after sign-in, media validation, and a fresh reading from the crystal or rig attached to your account.</p>
    </section>
    <div id="session-state" class="context-state">Checking your signed-in account...</div>
    <form id="moment-form">
      <label for="title">Title</label>
      <input id="title" name="title" maxlength="120" placeholder="What happened?" required>
      <label for="body">The moment</label>
      <textarea id="body" name="body" maxlength="5000" placeholder="Record what happened and why it matters." required></textarea>
      <label for="poetry-reference">Referenced Poetry token address <span class="optional">optional</span></label>
      <input id="poetry-reference" name="poetry_reference" maxlength="240" placeholder="pop://poetic-resonance/...">
      <p class="note">Paste the copied address when this Pop-Mo contains or responds to a line from an onchain Poetry work.</p>
      <label for="media">Upload your own image</label>
      <input id="media" name="media" type="file" accept="image/jpeg,image/png,image/webp,image/avif">
      <label class="check"><input id="generate" name="generate" type="checkbox"> Request a contextually relevant generated graphic instead</label>
      <p class="note">Choose either an upload or generated graphic - not both. With neither selected, your Pop-Mo uses the canonical POP three-dot mark.</p>
      <div class="square-preview" id="preview"><div class="default-mark"><i></i><i></i><i></i></div></div>
      <div id="rig-state" class="context-state">Sign in to resolve your currently online crystal or rig.</div>
      <label class="check"><input id="attest" name="attest" type="checkbox" required> I confirm this text documents the moment as I experienced it.</label>
      <button type="submit" disabled>Submit as signed-in account</button>
      <p id="status" class="note" role="status"></p>
      <div id="saved-reference" class="copy-row" hidden><span>Draft reference</span><code id="saved-address"></code><button id="copy-address" class="copy-button" type="button">Copy</button></div>
    </form>
    <script>
      ${authSessionScript}
      const form = document.getElementById('moment-form');
      const status = document.getElementById('status');
      const row = document.getElementById('saved-reference');
      const address = document.getElementById('saved-address');
      const copy = document.getElementById('copy-address');
      const sessionState = document.getElementById('session-state');
      const rigState = document.getElementById('rig-state');
      const submitButton = form.querySelector('button[type="submit"]');
      copy.onclick = async () => {
        await navigator.clipboard.writeText(address.textContent);
        copy.textContent = 'Copied';
        setTimeout(() => copy.textContent = 'Copy', 1500);
      };
      async function syncSession() {
        try {
          const session = await readSession();
          if (session.authenticated) {
            sessionState.innerHTML = 'Signed in as <strong>' + (session.handle || 'your account') + '</strong>. Pop-Mo submissions will keep this account, the associated wallet, and the active rig together.';
            rigState.textContent = session.rig ? 'Rig: ' + (rigSummary(session.rig) || 'connected') : 'Rig: not reported yet';
            submitButton.disabled = false;
            return;
          }
          sessionState.innerHTML = 'Sign in on <a href="https://home.pops.mobi">home.pops.mobi</a> to submit a Pop-Mo without another password.';
          rigState.textContent = 'Sign in to resolve your currently online crystal or rig.';
        } catch {
          sessionState.textContent = 'Could not read your sign-in state right now.';
        }
      }
      syncSession();
      form.onsubmit = async e => {
        e.preventDefault();
        if (submitButton.disabled) {
          status.textContent = 'Sign in first to submit from your account.';
          return;
        }
        if (!form.attest.checked) {
          status.textContent = 'Please confirm the moment before submitting.';
          return;
        }
        status.textContent = 'Submitting';
        const r = await fetch('/api/art', {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({
            action: 'moment',
            title: form.title.value,
            body: form.body.value,
            poetry_reference: form.poetry_reference.value,
            website: ''
          })
        });
        const j = await r.json();
        status.textContent = j.message || j.error || 'Done';
        if (j.url) {
          address.textContent = j.url;
          row.hidden = false;
        }
      };
    </script>
  `,
});

const buildPiecePage = piece => {
  const isMoment = piece.kind === 'moment' || piece.lane === 'P-M0';
  return shell({
    title: piece.title,
    description: `${piece.title} published through POP Art.`,
    active: isMoment ? 'moments' : 'poetic',
    className: 'poetry-shell',
    body: `
      <article id="piece_${esc(piece.slug)}" class="full-piece">
        <div class="piece-heading">
          <div>
            <p class="eyebrow">${esc(piece.lane || (isMoment ? 'P-M0' : 'Poetic Resonance'))}${piece.status ? ` / ${esc(piece.status)}` : ''}</p>
            <h1>${esc(piece.title)}</h1>
            <p class="page-note">Published on ${esc(piece.date || 'an unstated date')} by ${esc(pieceAuthor(piece))}${piece.accountWallet ? ` · ${esc(piece.accountWallet)}` : ''}.</p>
            ${piece.reference ? `<p class="page-note">Reference: ${esc(piece.reference)}</p>` : ''}
          </div>
          <span class="chain-state">${esc(pieceStatus(piece))}${piece.accountHandle ? ` · @${esc(piece.accountHandle)}` : ''}</span>
        </div>
        <div class="verbatim">${esc(piece.body)}</div>
      </article>
    `,
  });
};

const write = (name, data) => {
  const file = path.join(out, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
};

write('styles.css', styles);
write('index.html', buildLandingPage());
write('poetic-resonance/index.html', buildPoetryPage());
write('moments/index.html', buildMomentsPage());
write('submit/index.html', buildSubmitPage());
write('moments/submit/index.html', buildMomentSubmitPage());
for (const piece of pieces) {
  write(`${piece.slug}/index.html`, buildPiecePage(piece));
}
