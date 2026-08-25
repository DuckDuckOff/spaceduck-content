const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' },
});

const clean = value => String(value ?? '').trim();
const slug = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const yaml = value => JSON.stringify(String(value ?? ''));

const chainSessionURL = 'https://chain.pops.mobi/ibe/session';

async function sessionFromRequest(request) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  try {
    const response = await fetch(chainSessionURL, {
      headers: { accept: 'application/json', cookie },
    });
    if (!response.ok) return null;
    const session = await response.json();
    if (!session?.authenticated) return null;
    return {
      handle: clean(session.handle),
      accountId: clean(session.identity || session.account_id),
      wallet: clean(session.wallet || session.address),
      roles: Array.isArray(session.roles) ? session.roles.map(clean).filter(Boolean) : [],
      rig: session.rig && typeof session.rig === 'object' ? session.rig : null,
    };
  } catch {
    return null;
  }
}

function rigFrontmatterLines(rig) {
  if (!rig) return [];
  const lines = [];
  if (rig.status) lines.push(`rig_status: ${yaml(rig.status)}`);
  if (rig.crystal_id) lines.push(`rig_crystal_id: ${yaml(rig.crystal_id)}`);
  if (rig.frequency !== undefined && rig.frequency !== null && rig.frequency !== '') {
    lines.push(`rig_frequency: ${yaml(rig.frequency)}`);
  }
  if (rig.q_factor !== undefined && rig.q_factor !== null && rig.q_factor !== '') {
    lines.push(`rig_q_factor: ${yaml(rig.q_factor)}`);
  }
  if (rig.online !== undefined && rig.online !== null && rig.online !== '') {
    lines.push(`rig_online: ${yaml(rig.online)}`);
  }
  return lines;
}

function buildMarkdown({ title, lane, kind, date, author, account, reference, status, body }) {
  const lines = [
    '---',
    `title: ${yaml(title)}`,
    `lane: ${yaml(lane)}`,
    `kind: ${yaml(kind)}`,
    `status: ${yaml(status)}`,
    `date: ${yaml(date)}`,
    `author: ${yaml(author)}`,
  ];
  if (account?.handle) lines.push(`account_handle: ${yaml(account.handle)}`);
  if (account?.accountId) lines.push(`account_id: ${yaml(account.accountId)}`);
  if (account?.wallet) lines.push(`account_wallet: ${yaml(account.wallet)}`);
  if (reference) lines.push(`reference: ${yaml(reference)}`);
  lines.push(...rigFrontmatterLines(account?.rig));
  lines.push('---', '', String(body), '');
  return lines.join('\n');
}

async function publishSubmission({ request, env, kind, lane, title, body, reference = '' }) {
  if (clean(body) === '') return json({ error: 'Title and body are required.' }, 400);
  if (clean(kind) === '') return json({ error: 'Submission kind is required.' }, 400);
  if (clean(title) === '') return json({ error: 'Title is required.' }, 400);

  const account = await sessionFromRequest(request);
  if (!account) return json({ error: 'Sign in on home.pops.mobi to publish from your account.' }, 401);

  const date = new Date().toISOString().slice(0, 10);
  const prefix = kind === 'moment' ? 'moment' : 'poem';
  const file = `${prefix}-${date}-${slug(title)}.md`;
  const content = buildMarkdown({
    title: clean(title).slice(0, 160),
    lane,
    kind,
    date,
    author: account.handle,
    account,
    reference: clean(reference).slice(0, 240),
    status: kind === 'moment' ? 'submitted' : 'published',
    body: String(body),
  });

  const repo = env.GITHUB_REPOSITORY;
  const token = env.GITHUB_TOKEN;
  if (!repo || !token) return json({ error: 'Publishing is not configured.' }, 503);

  const response = await fetch(`https://api.github.com/repos/${repo}/contents/content/art/${file}`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json',
      'user-agent': 'POP-Art',
    },
    body: JSON.stringify({
      message: `art: publish ${title}`,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: env.GITHUB_BRANCH || 'main',
    }),
  });
  if (!response.ok) return json({ error: 'Could not publish submission.' }, 502);
  if (env.CF_PAGES_DEPLOY_HOOK_URL) fetch(env.CF_PAGES_DEPLOY_HOOK_URL, { method: 'POST' });
  return json({
    message: kind === 'moment' ? 'Pop-Mo submitted.' : 'Published verbatim.',
    url: `/art/${slug(file.replace(/\.md$/, ''))}/`,
    account: {
      handle: account.handle,
      account_id: account.accountId,
      wallet: account.wallet,
    },
  });
}

export async function onRequest({ request, env }) {
  if (request.method === 'GET') {
    const searchParams = new URL(request.url).searchParams;
    if (searchParams.get('action') === 'session') {
      const account = await sessionFromRequest(request);
      if (!account) return json({ authenticated: false });
      return json({
        authenticated: true,
        handle: account.handle,
        account_id: account.accountId,
        wallet: account.wallet,
        roles: account.roles,
        rig: account.rig,
      });
    }

    const piece = slug(searchParams.get('piece'));
    if (!piece) return json({ error: 'Missing piece' }, 400);
    if (!env.POP_ART_COMMENTS_KV) return json({ comments: [], message: 'Comments are awaiting site setup.' });
    return json({ comments: JSON.parse(await env.POP_ART_COMMENTS_KV.get(`comments:${piece}`) || '[]') });
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (body.action === 'comment') {
    const piece = slug(body.piece);
    const text = clean(body.body).slice(0, 2000);
    if (!piece || !text) return json({ error: 'A comment is required.' }, 400);
    if (!env.POP_ART_COMMENTS_KV) return json({ error: 'Comments are not configured yet.' }, 503);
    const key = `comments:${piece}`;
    const comments = JSON.parse(await env.POP_ART_COMMENTS_KV.get(key) || '[]');
    comments.push({ name: clean(body.name).slice(0, 80), body: text, at: new Date().toISOString() });
    await env.POP_ART_COMMENTS_KV.put(key, JSON.stringify(comments.slice(-100)));
    return json({ message: 'Comment posted.' });
  }

  if (body.action === 'submit') {
    if (clean(body.website)) return json({ error: 'Submission rejected.' }, 400);
    return publishSubmission({
      request,
      env,
      kind: 'poem',
      lane: 'Poetic Resonance',
      title: body.title,
      body: body.body,
    });
  }

  if (body.action === 'moment') {
    if (clean(body.website)) return json({ error: 'Submission rejected.' }, 400);
    return publishSubmission({
      request,
      env,
      kind: 'moment',
      lane: 'P-M0',
      title: body.title,
      body: body.body,
      reference: body.poetry_reference,
    });
  }

  return json({ error: 'Unknown action' }, 400);
}
