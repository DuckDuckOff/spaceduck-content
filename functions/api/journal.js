const encoder = new TextEncoder();

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

function sessionHeaders(value, maxAge) {
  return { "set-cookie": `spaceduck_journal_session=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Strict` };
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64Utf8(value) {
  const bytes = encoder.encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64Url(value) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

async function makeSession(secret) {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  return base64Url(encoder.encode(`${issuedAt}.${await sign(issuedAt, secret)}`));
}

async function authenticated(request, secret) {
  const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)spaceduck_journal_session=([^;]+)/)?.[1];
  if (!cookie) return false;
  try {
    const [issuedAt, expected] = new TextDecoder().decode(decodeBase64Url(cookie)).split(".");
    if (!issuedAt || !expected || Date.now() / 1000 - Number(issuedAt) > 86400) return false;
    return expected === (await sign(issuedAt, secret));
  } catch {
    return false;
  }
}

function apiTokenAuthenticated(request, env) {
  const expected = env.JOURNAL_BOT_API_TOKEN;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(expected && provided && provided === expected);
}

function filenameFor(date, title) {
  const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "untitled-note";
  return `${date}-${slug}.md`;
}

function frontmatter({ title, date, lane }) {
  return [
    "---",
    `title: ${JSON.stringify(title)}`,
    `date: ${date}`,
    `lane: ${lane}`,
    "status: published",
    "visibility: public",
    "source: journal-chat",
    "tags: []",
    "---",
    "",
  ].join("\n");
}

async function createDraft(prompt, env) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const result = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Write public-safe Spaceduck field-journal entries. Never include passwords, API keys, private wallet keys, exact authentication codes, personal addresses, or other sensitive data. Return JSON only with title, lane, and body. The body is concise Markdown without frontmatter or a duplicate H1. Preserve the user's meaning and be honest about uncertainty." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!result.ok) {
    const detail = await result.json().catch(() => ({}));
    const message = typeof detail.error?.message === "string" ? `: ${detail.error.message.slice(0, 180)}` : "";
    throw new Error(`AI draft failed (${result.status})${message}`);
  }
  const payload = await result.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty draft");
  const draft = JSON.parse(content);
  if (typeof draft.title !== "string" || typeof draft.body !== "string") throw new Error("AI returned an invalid draft");
  return {
    title: draft.title.trim().slice(0, 160),
    lane: typeof draft.lane === "string" && /^[a-z0-9-]{1,32}$/.test(draft.lane) ? draft.lane : "notes",
    body: draft.body.trim().slice(0, 20000),
  };
}

async function publish(draft, env) {
  if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not configured");
  const repository = env.GITHUB_REPOSITORY || "DuckDuckOff/spaceduck-content";
  const branch = env.GITHUB_BRANCH || "main";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(draft.date) ? draft.date : new Date().toISOString().slice(0, 10);
  const filename = filenameFor(date, draft.title);
  const path = `content/posts/${filename}`;
  const content = `${frontmatter({ title: draft.title, date, lane: draft.lane })}${draft.body}\n`;
  const apiUrl = env.GITHUB_API_URL || "https://api.github.com";
  const result = await fetch(`${apiUrl}/repos/${repository}/contents/${path}`, {
    method: "PUT",
    headers: { accept: "application/vnd.github+json", authorization: `Bearer ${env.GITHUB_TOKEN}`, "content-type": "application/json", "x-github-api-version": "2022-11-28", "user-agent": "spaceduck-journal-chat" },
    body: JSON.stringify({ message: `content: publish ${filename.replace(/\.md$/, "")}`, content: base64Utf8(content), branch }),
  });
  if (!result.ok) {
    const detail = await result.json().catch(() => ({}));
    if (result.status === 422) throw new Error("A post with that title and date already exists");
    const message = typeof detail.message === "string" ? `: ${detail.message.slice(0, 180)}` : "";
    throw new Error(`GitHub publish failed (${result.status})${message}`);
  }
  let deploy = "committed";
  if (env.CF_PAGES_DEPLOY_HOOK_URL) {
    const hook = await fetch(env.CF_PAGES_DEPLOY_HOOK_URL, { method: "POST" });
    deploy = hook.ok ? "deploy-triggered" : "committed-deploy-trigger-failed";
  }
  return { filename, repository, branch, deploy };
}

async function githubCheck(env) {
  if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not configured");
  const repository = env.GITHUB_REPOSITORY || "DuckDuckOff/spaceduck-content";
  const apiUrl = env.GITHUB_API_URL || "https://api.github.com";
  const headers = { accept: "application/vnd.github+json", authorization: `Bearer ${env.GITHUB_TOKEN}`, "x-github-api-version": "2022-11-28", "user-agent": "spaceduck-journal-chat" };
  const userResult = await fetch(`${apiUrl}/user`, { headers });
  const user = await userResult.json().catch(() => ({}));
  if (!userResult.ok) throw new Error(`GitHub identity check failed (${userResult.status})${typeof user.message === "string" ? `: ${user.message.slice(0, 180)}` : ""}`);
  const repoResult = await fetch(`${apiUrl}/repos/${repository}`, { headers });
  const repo = await repoResult.json().catch(() => ({}));
  if (!repoResult.ok) throw new Error(`GitHub repository check failed (${repoResult.status})${typeof repo.message === "string" ? `: ${repo.message.slice(0, 180)}` : ""}`);
  return { githubUser: user.login, repository: repo.full_name, defaultBranch: repo.default_branch, permissions: repo.permissions || {} };
}

async function deletePost(filenameInput, env) {
  if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not configured");
  const raw = typeof filenameInput === "string" ? filenameInput.trim() : "";
  const filename = raw.replace(/^.*\/posts\//, "").replace(/\/$/, "").replace(/\.md$/, "") + ".md";
  if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(filename)) throw new Error("Use the exact dated post filename, for example 2026-07-27-my-entry.md");
  const repository = env.GITHUB_REPOSITORY || "DuckDuckOff/spaceduck-content";
  const branch = env.GITHUB_BRANCH || "main";
  const apiUrl = env.GITHUB_API_URL || "https://api.github.com";
  const headers = { accept: "application/vnd.github+json", authorization: `Bearer ${env.GITHUB_TOKEN}`, "x-github-api-version": "2022-11-28", "user-agent": "spaceduck-journal-chat" };
  const path = `content/posts/${filename}`;
  const existing = await fetch(`${apiUrl}/repos/${repository}/contents/${path}?ref=${encodeURIComponent(branch)}`, { headers });
  const file = await existing.json().catch(() => ({}));
  if (!existing.ok) {
    if (existing.status === 404) throw new Error("That post was not found");
    throw new Error(`GitHub lookup failed (${existing.status})${typeof file.message === "string" ? `: ${file.message.slice(0, 180)}` : ""}`);
  }
  const removed = await fetch(`${apiUrl}/repos/${repository}/contents/${path}`, {
    method: "DELETE",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ message: `content: delete ${filename.replace(/\.md$/, "")}`, sha: file.sha, branch }),
  });
  const detail = await removed.json().catch(() => ({}));
  if (!removed.ok) throw new Error(`GitHub delete failed (${removed.status})${typeof detail.message === "string" ? `: ${detail.message.slice(0, 180)}` : ""}`);
  return { filename, repository, branch, deploy: "automated" };
}

export async function onRequestPost({ request, env }) {
  const password = env.JOURNAL_BOT_PASSWORD;
  if (!password) return json({ error: "Journal bot is not configured" }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Request body must be JSON" }, 400); }

  if (body.action === "login") {
    if (body.password !== password) return json({ error: "Invalid password" }, 401);
    return json({ ok: true }, 200, sessionHeaders(await makeSession(password), 86400));
  }
  if (body.action === "logout") return json({ ok: true }, 200, sessionHeaders("", 0));
  if (!(await authenticated(request, password)) && !apiTokenAuthenticated(request, env)) return json({ error: "Authentication required" }, 401);

  try {
    if (body.action === "draft") {
      if (typeof body.prompt !== "string" || body.prompt.trim().length < 3) return json({ error: "Give the journal bot a little more to work with" }, 400);
      return json({ ok: true, draft: await createDraft(body.prompt.trim().slice(0, 8000), env) });
    }
    if (body.action === "github-check") return json({ ok: true, github: await githubCheck(env) });
    if (body.action === "delete") return json({ ok: true, result: await deletePost(body.filename, env) });
    if (body.action === "publish") {
      if (!body.draft || typeof body.draft.title !== "string" || typeof body.draft.body !== "string") return json({ error: "A valid reviewed draft is required" }, 400);
      const draft = {
        title: body.draft.title.trim().slice(0, 160),
        lane: typeof body.draft.lane === "string" && /^[a-z0-9-]{1,32}$/.test(body.draft.lane) ? body.draft.lane : "notes",
        date: typeof body.draft.date === "string" ? body.draft.date : "",
        body: body.draft.body.trim().slice(0, 20000),
      };
      return json({ ok: true, result: await publish(draft, env) });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Journal bot failed" }, 500);
  }
}
