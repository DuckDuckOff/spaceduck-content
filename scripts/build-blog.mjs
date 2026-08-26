#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const postsDir = path.join(root, "content", "posts");
const publicDir = path.join(root, "public");
const outputDir = path.join(root, "blog-dist");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugFromFilename(filename) {
  return filename.replace(/\.md$/, "");
}

function parsePost(filename, source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const metadata = {};
  let body = match ? match[2].trim() : source.trim();

  for (const line of match?.[1].split(/\r?\n/) ?? []) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      try {
        value = JSON.parse(value);
      } catch {
        value = value.slice(1, -1);
      }
    }
    metadata[key] = value;
  }

  // The article template already renders the frontmatter title. Avoid
  // rendering the conventional Markdown H1 a second time in the article.
  const firstLine = body.split(/\r?\n/, 1)[0]?.trim();
  if (firstLine === `# ${metadata.title}`) {
    body = body.slice(body.indexOf("\n") + 1).trim();
  }

  return {
    slug: slugFromFilename(filename),
    filename,
    title: metadata.title || slugFromFilename(filename),
    date: metadata.date || "",
    order: Number(metadata.order || 0),
    lane: metadata.lane || "notes",
    body,
  };
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
}

function videoEmbed(source) {
  const match = source.trim().match(/^\{\{video:(\/media\/[A-Za-z0-9._/-]+)(?:\|([^}]+))?\}\}$/);
  if (!match) return null;
  const url = match[1];
  const caption = match[2]?.trim();
  const label = caption || "Journal video";
  return `<figure class="journal-video"><video controls preload="metadata" src="${escapeHtml(url)}"><a href="${escapeHtml(url)}">${escapeHtml(label)}</a></video>${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
}

function imageEmbed(source) {
  const match = source.trim().match(/^\{\{image:(\/media\/[A-Za-z0-9._/-]+)(?:\|([^}]+))?\}\}$/);
  if (!match) return null;
  const url = match[1];
  const caption = match[2]?.trim();
  const label = caption || "Journal image";
  return `<figure class="journal-image"><img loading="lazy" src="${escapeHtml(url)}" alt="${escapeHtml(label)}">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let list = false;

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (list) {
      html.push("</ul>");
      list = false;
    }
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }
    const video = videoEmbed(line);
    if (video) {
      flushParagraph();
      closeList();
      html.push(video);
      continue;
    }
    const image = imageEmbed(line);
    if (image) {
      flushParagraph();
      closeList();
      html.push(image);
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const item = line.match(/^[-*]\s+(.+)$/);
    if (item) {
      flushParagraph();
      if (!list) {
        html.push("<ul>");
        list = true;
      }
      html.push(`<li>${inlineMarkdown(item[1])}</li>`);
      continue;
    }
    closeList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  closeList();
  return html.join("\n");
}

const css = `
:root { color-scheme: light; --paper: #fbfaf7; --ink: #17212b; --muted: #687580; --line: #e5e1da; --panel: #ffffff; --accent: #7354c9; --violet: #4c3695; --mint: #dff3e9; --lilac: #f0edf9; --peach: #fae8da; --shadow: 0 20px 60px rgba(45,38,77,.08); }
@font-face { font-family: Poppins; src: url('/fonts/Poppins-Regular.ttf') format('truetype'); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: Poppins; src: url('/fonts/Poppins-Medium.ttf') format('truetype'); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: Poppins; src: url('/fonts/Poppins-SemiBold.ttf') format('truetype'); font-weight: 600; font-style: normal; font-display: swap; }
@font-face { font-family: Poppins; src: url('/fonts/Poppins-Bold.ttf') format('truetype'); font-weight: 700; font-style: normal; font-display: swap; }
* { box-sizing: border-box; }
body { margin: 0; color: var(--ink); background: var(--paper); font: 16px/1.7 Poppins, sans-serif; }
body::before { content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none; background: radial-gradient(circle at 82% 5%, rgba(115,84,201,.10) 0, transparent 30rem), radial-gradient(circle at 8% 72%, rgba(101,182,142,.10) 0, transparent 27rem); }
a { color: var(--accent); }
.shell { position: relative; width: min(1100px, calc(100% - 40px)); margin: auto; }
header { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 28px 0 100px; font-family: Poppins, sans-serif; }
.mark { color: var(--ink); font-size: 1rem; font-weight: 600; letter-spacing: .08em; text-decoration: none; }
.mark span { color: var(--accent); }
nav { color: var(--muted); font-size: .8rem; }
nav a { margin-left: 22px; color: var(--muted); text-decoration: none; }
nav a:hover { color: var(--accent); }
.hero { max-width: 730px; padding-bottom: 90px; }
.eyebrow { color: var(--accent); font: 600 .75rem Poppins, sans-serif; letter-spacing: .2em; text-transform: uppercase; }
h1 { margin: 18px 0; font: 500 clamp(3rem, 8vw, 6.4rem)/.96 Poppins, sans-serif; letter-spacing: -.07em; }
.hero p { color: var(--muted); font-size: 1.15rem; max-width: 570px; }
.signal { display: inline-block; margin-top: 22px; padding: 7px 12px; border-radius: 999px; color: var(--violet); background: var(--mint); font: 500 .75rem Poppins, sans-serif; }
.signal::before { content: "✦  "; color: var(--accent); }
.posts { display: grid; gap: 12px; }
.post-card { display: grid; grid-template-columns: 150px 1fr; gap: 35px; padding: 28px; border: 1px solid var(--line); border-radius: 22px; background: rgba(255,255,255,.9); box-shadow: 0 8px 34px rgba(45,38,77,.035); transition: transform .18s ease, border-color .18s ease; }
.post-card:hover { transform: translateY(-2px); border-color: #d3caeb; }
.post-meta { color: var(--muted); font: 500 .72rem/1.6 Poppins, sans-serif; text-transform: uppercase; }
.post-card h2 { margin: 0 0 8px; font-size: clamp(1.4rem, 3vw, 2.1rem); font-weight: 500; }
.post-card p { margin: 0; color: var(--muted); }
.post-card a { color: var(--ink); text-decoration: none; }
.post-card a:hover { color: var(--accent); }
.article { max-width: 720px; padding-bottom: 110px; }
.article h1 { font-size: clamp(2.8rem, 7vw, 5.5rem); }
.article .lead { color: var(--muted); font: 500 .8rem Poppins, sans-serif; }
.article-body { margin-top: 55px; padding: 36px; border: 1px solid var(--line); border-radius: 26px; background: rgba(255,255,255,.82); box-shadow: 0 12px 42px rgba(45,38,77,.035); font-size: 1.12rem; }
.article-body h2 { margin: 2.5em 0 .5em; font-size: 1.8rem; font-weight: 500; }
.article-body h3 { margin: 2em 0 .4em; font-size: 1.35rem; }
.article-body p { margin: 1.2em 0; }
.article-body li { margin: .45em 0; }
.article-body code { padding: .15em .35em; color: var(--accent); background: var(--panel); font: .85em Poppins, sans-serif; }
.journal-video { margin: 2.2em 0; }
.journal-video video { display: block; width: 100%; max-height: 70vh; border: 1px solid var(--line); border-radius: 16px; background: #17212b; }
.journal-video figcaption { margin-top: .65em; color: var(--muted); font: .78rem Poppins, sans-serif; }
.journal-image { margin: 2.2em 0; }
.journal-image img { display: block; width: 100%; max-height: 70vh; object-fit: contain; border: 1px solid var(--line); border-radius: 16px; background: #f3f1ec; }
.journal-image figcaption { margin-top: .65em; color: var(--muted); font: .78rem Poppins, sans-serif; }
.back-link { margin: 0 0 35px; font: 500 .78rem Poppins, sans-serif; text-transform: lowercase; }
.back-link a { color: var(--muted); text-decoration: none; }
.back-link a:hover { color: var(--accent); }
.chat-panel { max-width: 720px; padding-bottom: 100px; }
.chat-panel label { display: block; margin: 1.4em 0 .45em; color: var(--muted); font: 500 .78rem Poppins, sans-serif; text-transform: uppercase; letter-spacing: .08em; }
.chat-panel input, .chat-panel textarea { width: 100%; border: 1px solid var(--line); border-radius: 12px; padding: .85em 1em; color: var(--ink); background: var(--panel); font: inherit; }
.chat-panel textarea { min-height: 150px; resize: vertical; }
.chat-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.chat-actions button { border: 1px solid var(--accent); border-radius: 999px; padding: .7em 1em; color: #fff; background: var(--accent); font: 600 .78rem Poppins, sans-serif; cursor: pointer; }
.chat-actions button.secondary { color: var(--accent); background: transparent; }
.chat-status { min-height: 1.5em; margin-top: 18px; color: var(--muted); font: .82rem Poppins, sans-serif; white-space: pre-wrap; }
.chat-preview { margin-top: 28px; padding: 22px; border: 1px solid var(--line); border-radius: 18px; background: rgba(255,255,255,.85); }
.chat-preview h2 { margin-top: 0; font-weight: 500; }
.chat-preview pre { overflow: auto; white-space: pre-wrap; color: var(--muted); font: .9rem/1.6 Poppins, sans-serif; }
.post-admin { margin-top: 70px; padding-top: 22px; border-top: 1px solid var(--line); }
.post-admin summary { color: var(--muted); cursor: pointer; font: 500 .78rem Poppins, sans-serif; text-transform: uppercase; letter-spacing: .08em; }
.post-admin form { max-width: 420px; margin-top: 16px; }
.post-admin input { width: 100%; border: 1px solid var(--line); border-radius: 12px; padding: .75em 1em; color: var(--ink); background: var(--panel); font: inherit; }
.post-admin button { margin-top: 10px; border: 1px solid #d6949f; border-radius: 999px; padding: .7em 1em; color: #914656; background: transparent; font: 600 .78rem Poppins, sans-serif; cursor: pointer; }
.post-admin-status { min-height: 1.5em; margin-top: 12px; color: var(--muted); font: .82rem Poppins, sans-serif; }
footer { padding: 35px 0 60px; color: var(--muted); font: 500 .75rem Poppins, sans-serif; }
@media (max-width: 650px) { header { align-items: flex-start; flex-direction: column; padding-bottom: 55px; } nav { display: flex; gap: 13px; width: 100%; overflow-x: auto; padding-bottom: 7px; } nav a { flex: 0 0 auto; margin: 0; } .post-card { grid-template-columns: 1fr; gap: 7px; padding: 22px; } .article-body { padding: 24px 20px; } .shell { width: min(100% - 28px, 1100px); } }
`;

function layout(title, content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · spaceduck</title><meta name="description" content="Field notes from the spaceduck signal."><link rel="stylesheet" href="/styles.css"></head><body><div class="shell"><header><a class="mark" href="https://spaceduck.ing"><span>✦</span> spaceduck.ing</a><nav><a href="/">journal</a><a href="/about/">about</a><a href="/synapses/">synapses</a><a href="/chat/">chat</a><a href="https://art.pops.mobi">POP-Art</a><a href="/rss.xml">rss</a></nav></header>${content}<footer>posts total: ${posts.length} · signal received · spaceduck.ing</footer></div></body></html>`;
}

const entries = await fs.readdir(postsDir, { withFileTypes: true }).catch(() => []);
const posts = [];
for (const entry of entries) {
  if (entry.isFile() && entry.name.endsWith(".md")) {
    posts.push(parsePost(entry.name, await fs.readFile(path.join(postsDir, entry.name), "utf8")));
  }
}
posts.sort((a, b) => b.date.localeCompare(a.date) || b.order - a.order || b.filename.localeCompare(a.filename));

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(path.join(outputDir, "posts"), { recursive: true });
await fs.writeFile(path.join(outputDir, "styles.css"), css);
const mediaDir = path.join(publicDir, "media");
await fs.cp(mediaDir, path.join(outputDir, "media"), { recursive: true, force: true }).catch((error) => {
  if (error.code !== "ENOENT") throw error;
});

const cards = posts.length
  ? posts.map((post) => `<article class="post-card"><div class="post-meta">${escapeHtml(post.date)}<br>${escapeHtml(post.lane)}</div><div><h2><a href="/posts/${encodeURIComponent(post.slug)}/">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.body.replace(/[#*`]/g, "").slice(0, 180))}${post.body.length > 180 ? "…" : ""}</p></div></article>`).join("\n")
  : `<div class="post-card"><div class="post-meta">awaiting</div><div><h2>The first signal has not arrived.</h2><p>Approved field notes will appear here when they are pushed to the journal.</p></div></div>`;

const home = `<main><section class="hero"><div class="eyebrow">independent field journal</div><h1>Notes from the edge of the signal.</h1><p>A quiet record of building, resonance, strange systems, and the ideas that keep returning.</p><span class="signal">transmission open</span></section><section class="posts">${cards}</section></main>`;
await fs.writeFile(path.join(outputDir, "index.html"), layout("Journal", home));

const chat = `<main class="chat-panel"><div class="eyebrow">private journal interface</div><h1>Talk to the journal.</h1><p>Describe what happened. The bot will shape a public-safe draft for you to review before anything is published.</p><label for="password">journal password</label><input id="password" type="password" autocomplete="current-password" placeholder="Required to continue"><label for="prompt">what should be recorded?</label><textarea id="prompt" placeholder="Record today’s mission..." maxlength="8000"></textarea><div class="chat-actions"><button id="draft">Draft entry</button><button id="publish" class="secondary" disabled>Publish reviewed entry</button><button id="logout" class="secondary" type="button">Log out</button></div><div id="status" class="chat-status" role="status"></div><section id="preview" class="chat-preview" hidden><h2 id="preview-title"></h2><div id="preview-meta"></div><pre id="preview-body"></pre></section></main><script>
const password = document.getElementById("password");
const prompt = document.getElementById("prompt");
const draftButton = document.getElementById("draft");
const publishButton = document.getElementById("publish");
const logoutButton = document.getElementById("logout");
const status = document.getElementById("status");
const preview = document.getElementById("preview");
const previewTitle = document.getElementById("preview-title");
const previewMeta = document.getElementById("preview-meta");
const previewBody = document.getElementById("preview-body");
let reviewedDraft = null;
async function call(action, data) {
  const result = await fetch("/api/journal", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...data }) });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) throw new Error(payload.error || "Request failed");
  return payload;
}
function showDraft(draft) {
  reviewedDraft = { ...draft, date: new Date().toISOString().slice(0, 10) };
  previewTitle.textContent = draft.title;
  previewMeta.textContent = reviewedDraft.date + " · " + draft.lane;
  previewBody.textContent = draft.body;
  preview.hidden = false;
  publishButton.disabled = false;
}
draftButton.addEventListener("click", async () => {
  status.textContent = "Drafting...";
  try {
    if (!password.value) throw new Error("Enter the journal password first");
    await call("login", { password: password.value });
    const result = await call("draft", { prompt: prompt.value });
    showDraft(result.draft);
    status.textContent = "Review the draft below. Nothing is public yet.";
  } catch (error) { status.textContent = error.message; }
});
publishButton.addEventListener("click", async () => {
  if (!reviewedDraft || !confirm("Publish this reviewed entry to the public journal?")) return;
  status.textContent = "Publishing...";
  try {
    const result = await call("publish", { draft: reviewedDraft });
    status.textContent = "Published " + result.result.filename + (result.result.deploy === "deploy-triggered" ? ". Deployment triggered." : ". GitHub commit created; automated deployment is running.");
    publishButton.disabled = true;
  } catch (error) { status.textContent = error.message; }
});
logoutButton.addEventListener("click", async () => { await call("logout", {}).catch(() => {}); reviewedDraft = null; publishButton.disabled = true; status.textContent = "Logged out."; });
</script>`;
await fs.mkdir(path.join(outputDir, "chat"), { recursive: true });
await fs.writeFile(path.join(outputDir, "chat", "index.html"), layout("Chat", chat));

const externalChat = `<main class="chat-panel"><div class="eyebrow">external journal interface</div><h1>Reach the journal bot.</h1><p>Use the journal password to draft and publish entries remotely. A secure session cookie is used after sign-in; the password is not stored by this page.</p><label for="password">journal password</label><input id="password" type="password" autocomplete="current-password" placeholder="Required to continue"><label for="external-prompt">what should be recorded?</label><textarea id="external-prompt" placeholder="Record today’s mission..." maxlength="8000"></textarea><div class="chat-actions"><button id="external-check" class="secondary">Check GitHub connection</button><button id="external-draft">Draft entry</button><button id="external-publish" class="secondary" disabled>Publish reviewed entry</button></div><label for="media-file">upload a photo or video</label><input id="media-file" type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif,video/mp4,video/webm,video/ogg,video/quicktime"><div class="chat-actions"><button id="external-upload" class="secondary">Upload media</button></div><p class="chat-help">Uploads are limited to 12 MB for photos and 30 MB for videos. The returned embed is inserted into the editor below.</p><label for="edit-filename">edit a published post</label><div class="chat-actions"><input id="edit-filename" placeholder="2026-07-27-my-entry.md" autocomplete="off"><button id="external-load-edit" class="secondary">Load post</button></div><textarea id="edit-content" placeholder="Load a post to edit it..." maxlength="30000" disabled></textarea><div class="chat-actions"><button id="external-save-edit" class="secondary" disabled>Save edited post</button></div><label for="delete-filename">delete a published post</label><input id="delete-filename" placeholder="2026-07-27-my-entry.md" autocomplete="off"><div class="chat-actions"><button id="external-delete" class="secondary">Delete post</button></div><div id="external-status" class="chat-status" role="status"></div><section id="external-preview" class="chat-preview" hidden><h2 id="external-title"></h2><div id="external-meta"></div><pre id="external-body"></pre></section></main><script>
const password = document.getElementById("password");
const prompt = document.getElementById("external-prompt");
const checkButton = document.getElementById("external-check");
const draftButton = document.getElementById("external-draft");
const publishButton = document.getElementById("external-publish");
const deleteButton = document.getElementById("external-delete");
const deleteFilename = document.getElementById("delete-filename");
const loadEditButton = document.getElementById("external-load-edit");
const saveEditButton = document.getElementById("external-save-edit");
const editFilename = document.getElementById("edit-filename");
const editContent = document.getElementById("edit-content");
const mediaFile = document.getElementById("media-file");
const uploadButton = document.getElementById("external-upload");
const status = document.getElementById("external-status");
const preview = document.getElementById("external-preview");
const title = document.getElementById("external-title");
const meta = document.getElementById("external-meta");
const body = document.getElementById("external-body");
let reviewedDraft = null;
async function call(action, data) {
  const result = await fetch("/api/journal", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...data }) });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) throw new Error(payload.error || "Request failed");
  return payload;
}
function showDraft(draft) {
  reviewedDraft = { ...draft, date: new Date().toISOString().slice(0, 10) };
  title.textContent = draft.title;
  meta.textContent = reviewedDraft.date + " · " + draft.lane;
  body.textContent = draft.body;
  preview.hidden = false;
  publishButton.disabled = false;
}
draftButton.addEventListener("click", async () => {
  status.textContent = "Drafting...";
  try { if (!password.value) throw new Error("Enter the journal password first"); await call("login", { password: password.value }); showDraft((await call("draft", { prompt: prompt.value })).draft); status.textContent = "Review the draft below. Nothing is public yet."; }
  catch (error) { status.textContent = error.message; }
});
checkButton.addEventListener("click", async () => {
  status.textContent = "Checking GitHub connection...";
  try { if (!password.value) throw new Error("Enter the journal password first"); await call("login", { password: password.value }); const result = await call("github-check", {}); status.textContent = "GitHub account: " + result.github.githubUser + "\\nRepository: " + result.github.repository + "\\nPush permission: " + (result.github.permissions.push ? "yes" : "no"); }
  catch (error) { status.textContent = error.message; }
});
publishButton.addEventListener("click", async () => {
  if (!reviewedDraft || !confirm("Publish this reviewed entry to the public journal?")) return;
  status.textContent = "Publishing...";
  try { const result = await call("publish", { draft: reviewedDraft }); status.textContent = "Committed " + result.result.filename + (result.result.deploy === "deploy-triggered" ? ". Deployment triggered." : ". Automated Pages deployment is running."); publishButton.disabled = true; }
  catch (error) { status.textContent = error.message; }
});
deleteButton.addEventListener("click", async () => {
  const filename = deleteFilename.value.trim();
  if (!filename || !confirm("Permanently delete " + filename + " from the public journal?")) return;
  status.textContent = "Deleting...";
  try { if (!password.value) throw new Error("Enter the journal password first"); await call("login", { password: password.value }); const result = await call("delete", { filename }); status.textContent = "Deleted " + result.result.filename + ". Automated deployment is running."; }
  catch (error) { status.textContent = error.message; }
});
loadEditButton.addEventListener("click", async () => {
  status.textContent = "Loading post...";
  try { if (!password.value) throw new Error("Enter the journal password first"); await call("login", { password: password.value }); const result = await call("get-post", { filename: editFilename.value }); editContent.value = result.post.content; editContent.disabled = false; saveEditButton.disabled = false; status.textContent = "Post loaded. Review your changes before saving."; }
  catch (error) { status.textContent = error.message; }
});
saveEditButton.addEventListener("click", async () => {
  if (!editFilename.value || !editContent.value || !confirm("Save these edits to the public journal?")) return;
  status.textContent = "Saving edits...";
  try { if (!password.value) throw new Error("Enter the journal password first"); await call("login", { password: password.value }); const result = await call("edit", { filename: editFilename.value, content: editContent.value }); status.textContent = "Updated " + result.result.filename + ". Automated Pages deployment is running."; }
  catch (error) { status.textContent = error.message; }
});
uploadButton.addEventListener("click", async () => {
  const file = mediaFile.files?.[0];
  if (!file) { status.textContent = "Choose a photo or video first."; return; }
  status.textContent = "Uploading media...";
  try {
    if (!password.value) throw new Error("Enter the journal password first");
    await call("login", { password: password.value });
    const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",", 2)[1] || ""); reader.onerror = () => reject(new Error("The file could not be read")); reader.readAsDataURL(file); });
    const result = await call("upload-media", { filename: file.name, contentType: file.type, data });
    if (!editContent.disabled) { editContent.value = editContent.value.replace(/\s*$/, "") + "\n\n" + result.result.embed + "\n"; }
    status.textContent = "Uploaded " + result.result.filename + ". " + (editContent.disabled ? "Load a post, then insert this embed manually: " : "Embed inserted into the editor. ") + result.result.embed;
  } catch (error) { status.textContent = error.message; }
});
</script>`;
await fs.mkdir(path.join(outputDir, "chat", "external"), { recursive: true });
await fs.writeFile(path.join(outputDir, "chat", "external", "index.html"), layout("External Chat", externalChat));

const about = `<main class="article"><p class="back-link"><a href="/">← back to list</a></p><div class="eyebrow">orientation</div><h1>A small place for the signal.</h1><div class="article-body"><p>Spaceduck is a living field journal for observations, build logs, strange ideas, and the ordinary moments that deserve to be remembered.</p><p>Notes begin privately, are shaped with care, and become public only when they are ready. The journal is deliberately small: a quiet surface for paying attention while the larger systems take form.</p><h2>How it works</h2><p>Approved Markdown notes are committed to Git, transformed into a static journal, and deployed to Cloudflare at <a href="https://blog.spaceduck.ing">blog.spaceduck.ing</a>.</p><p>The archive is a record of what arrived, what changed, and what is still becoming.</p></div></main>`;
await fs.mkdir(path.join(outputDir, "about"), { recursive: true });
await fs.writeFile(path.join(outputDir, "about", "index.html"), layout("About", about));

const synapsesPosts = posts.filter((post) => /synapses/i.test(`${post.title} ${post.body}`));
const synapsesLinks = synapsesPosts.length
  ? synapsesPosts.map((post) => `<li><a href="/posts/${encodeURIComponent(post.slug)}/">${escapeHtml(post.title)}</a><span>${escapeHtml(post.date)}</span></li>`).join("")
  : "<li>No public SynapSes notes yet.</li>";
const synapses = `<main class="article"><div class="eyebrow">system log</div><h1>SynapSes</h1><div class="lead">a directory-based node system for opportunities becoming instances</div><div class="article-body"><p>SynapSes gives each server a local boundary, a memory, and a way to develop structure around meaningful opportunities. The shared runtime stays separate from each instance directory.</p><h2>Current state</h2><ul><li><strong>origin</strong> — local system boundary initialized</li><li><strong>opportunities</strong> — creation command available</li><li><strong>instances</strong> — awaiting the first sealed emergence</li><li><strong>next</strong> — inquiry, capability compilation, validation, and sealing</li></ul><h2>Log entries</h2><ul>${synapsesLinks}</ul><p><a href="/">← return to the journal</a></p></div></main>`;
await fs.mkdir(path.join(outputDir, "synapses"), { recursive: true });
await fs.writeFile(path.join(outputDir, "synapses", "index.html"), layout("SynapSes", synapses));

for (const post of posts) {
  const postFilename = JSON.stringify(post.filename);
  const article = `<main class="article"><p class="back-link"><a href="/">← back to list</a></p><div class="eyebrow">${escapeHtml(post.lane)}</div><h1>${escapeHtml(post.title)}</h1><div class="lead">${escapeHtml(post.date)} · spaceduck.ing</div><div class="article-body">${markdownToHtml(post.body)}</div><details class="post-admin"><summary>journal controls</summary><form id="post-delete-form"><label for="post-delete-password">journal password</label><input id="post-delete-password" type="password" autocomplete="current-password" placeholder="Required to delete this note"><button type="submit">Delete this note</button><div id="post-delete-status" class="post-admin-status" role="status"></div></form></details><script>
const postDeleteForm = document.getElementById("post-delete-form");
const postDeletePassword = document.getElementById("post-delete-password");
const postDeleteStatus = document.getElementById("post-delete-status");
postDeleteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!postDeletePassword.value || !confirm("Permanently delete this note from the public journal?")) return;
  postDeleteStatus.textContent = "Deleting...";
  try {
    const login = await fetch("/api/journal", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", password: postDeletePassword.value }) });
    const loginPayload = await login.json().catch(() => ({}));
    if (!login.ok) throw new Error(loginPayload.error || "Login failed");
    const result = await fetch("/api/journal", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", filename: ${postFilename} }) });
    const payload = await result.json().catch(() => ({}));
    if (!result.ok) throw new Error(payload.error || "Delete failed");
    postDeleteStatus.textContent = "Deleted. Returning to the journal...";
    setTimeout(() => { window.location.href = "/"; }, 900);
  } catch (error) { postDeleteStatus.textContent = error.message; }
});
</script></main>`;
  const directory = path.join(outputDir, "posts", post.slug);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, "index.html"), layout(post.title, article));
}

const rssItems = posts.map((post) => `<item><title>${escapeHtml(post.title)}</title><link>https://blog.spaceduck.ing/posts/${encodeURIComponent(post.slug)}/</link><pubDate>${new Date(post.date || Date.now()).toUTCString()}</pubDate><description>${escapeHtml(post.body.slice(0, 240))}</description></item>`).join("");
await fs.writeFile(path.join(outputDir, "rss.xml"), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>spaceduck journal</title><link>https://blog.spaceduck.ing/</link><description>Field notes from the spaceduck signal.</description>${rssItems}</channel></rss>`);
console.log(`Built blog-dist with ${posts.length} post${posts.length === 1 ? "" : "s"}`);
