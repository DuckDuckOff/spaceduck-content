#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const postsDir = path.join(root, "content", "posts");
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
:root { color-scheme: dark; --ink: #e9f3ff; --muted: #8ba0b8; --line: #203247; --panel: #0d1928; --accent: #9af7d4; --violet: #b9a7ff; }
* { box-sizing: border-box; }
body { margin: 0; color: var(--ink); background: #07101b; font: 16px/1.7 Georgia, serif; }
body::before { content: ""; position: fixed; inset: 0; pointer-events: none; opacity: .38; background: radial-gradient(circle at 78% 8%, #243c66 0, transparent 28rem), radial-gradient(circle at 12% 76%, #173a44 0, transparent 24rem); }
a { color: var(--accent); }
.shell { position: relative; width: min(1060px, calc(100% - 40px)); margin: auto; }
header { display: flex; justify-content: space-between; align-items: baseline; padding: 38px 0 90px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
.mark { color: var(--ink); font-size: 1rem; letter-spacing: .08em; text-decoration: none; }
.mark span { color: var(--accent); }
nav { color: var(--muted); font-size: .8rem; }
nav a { margin-left: 22px; text-decoration: none; }
.hero { max-width: 730px; padding-bottom: 90px; }
.eyebrow { color: var(--accent); font: .75rem ui-monospace, monospace; letter-spacing: .2em; text-transform: uppercase; }
h1 { margin: 18px 0; font: 500 clamp(3rem, 8vw, 6.4rem)/.96 Georgia, serif; letter-spacing: -.07em; }
.hero p { color: var(--muted); font-size: 1.15rem; max-width: 570px; }
.signal { display: inline-block; margin-top: 22px; color: var(--violet); font: .75rem ui-monospace, monospace; }
.signal::before { content: "✦  "; color: var(--accent); }
.posts { border-top: 1px solid var(--line); }
.post-card { display: grid; grid-template-columns: 150px 1fr; gap: 35px; padding: 30px 0; border-bottom: 1px solid var(--line); }
.post-meta { color: var(--muted); font: .72rem/1.6 ui-monospace, monospace; text-transform: uppercase; }
.post-card h2 { margin: 0 0 8px; font-size: clamp(1.4rem, 3vw, 2.1rem); font-weight: 500; }
.post-card p { margin: 0; color: var(--muted); }
.post-card a { color: var(--ink); text-decoration: none; }
.post-card a:hover { color: var(--accent); }
.article { max-width: 720px; padding-bottom: 110px; }
.article h1 { font-size: clamp(2.8rem, 7vw, 5.5rem); }
.article .lead { color: var(--muted); font: .8rem ui-monospace, monospace; }
.article-body { margin-top: 55px; font-size: 1.12rem; }
.article-body h2 { margin: 2.5em 0 .5em; font-size: 1.8rem; font-weight: 500; }
.article-body h3 { margin: 2em 0 .4em; font-size: 1.35rem; }
.article-body p { margin: 1.2em 0; }
.article-body li { margin: .45em 0; }
.article-body code { padding: .15em .35em; color: var(--accent); background: var(--panel); font: .85em ui-monospace, monospace; }
footer { padding: 35px 0 60px; color: var(--muted); font: .75rem ui-monospace, monospace; }
@media (max-width: 650px) { header { padding-bottom: 55px; } .post-card { grid-template-columns: 1fr; gap: 7px; } .shell { width: min(100% - 28px, 1060px); } }
`;

function layout(title, content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · spaceduck</title><meta name="description" content="Field notes from the spaceduck signal."><link rel="stylesheet" href="/styles.css"></head><body><div class="shell"><header><a class="mark" href="/"><span>✦</span> spaceduck.ing</a><nav><a href="/">journal</a><a href="/rss.xml">rss</a></nav></header>${content}<footer>signal received · spaceduck.ing</footer></div></body></html>`;
}

const entries = await fs.readdir(postsDir, { withFileTypes: true }).catch(() => []);
const posts = [];
for (const entry of entries) {
  if (entry.isFile() && entry.name.endsWith(".md")) {
    posts.push(parsePost(entry.name, await fs.readFile(path.join(postsDir, entry.name), "utf8")));
  }
}
posts.sort((a, b) => b.date.localeCompare(a.date) || b.filename.localeCompare(a.filename));

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(path.join(outputDir, "posts"), { recursive: true });
await fs.writeFile(path.join(outputDir, "styles.css"), css);

const cards = posts.length
  ? posts.map((post) => `<article class="post-card"><div class="post-meta">${escapeHtml(post.date)}<br>${escapeHtml(post.lane)}</div><div><h2><a href="/posts/${encodeURIComponent(post.slug)}/">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.body.replace(/[#*`]/g, "").slice(0, 180))}${post.body.length > 180 ? "…" : ""}</p></div></article>`).join("\n")
  : `<div class="post-card"><div class="post-meta">awaiting</div><div><h2>The first signal has not arrived.</h2><p>Approved field notes will appear here when they are pushed to the journal.</p></div></div>`;

const home = `<main><section class="hero"><div class="eyebrow">independent field journal</div><h1>Notes from the edge of the signal.</h1><p>A quiet record of building, resonance, strange systems, and the ideas that keep returning.</p><span class="signal">transmission open</span></section><section class="posts">${cards}</section></main>`;
await fs.writeFile(path.join(outputDir, "index.html"), layout("Journal", home));

for (const post of posts) {
  const article = `<main class="article"><div class="eyebrow">${escapeHtml(post.lane)}</div><h1>${escapeHtml(post.title)}</h1><div class="lead">${escapeHtml(post.date)} · spaceduck.ing</div><div class="article-body">${markdownToHtml(post.body)}</div></main>`;
  const directory = path.join(outputDir, "posts", post.slug);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, "index.html"), layout(post.title, article));
}

const rssItems = posts.map((post) => `<item><title>${escapeHtml(post.title)}</title><link>https://blog.spaceduck.ing/posts/${encodeURIComponent(post.slug)}/</link><pubDate>${new Date(post.date || Date.now()).toUTCString()}</pubDate><description>${escapeHtml(post.body.slice(0, 240))}</description></item>`).join("");
await fs.writeFile(path.join(outputDir, "rss.xml"), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>spaceduck journal</title><link>https://blog.spaceduck.ing/</link><description>Field notes from the spaceduck signal.</description>${rssItems}</channel></rss>`);
console.log(`Built blog-dist with ${posts.length} post${posts.length === 1 ? "" : "s"}`);
