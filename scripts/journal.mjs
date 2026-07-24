#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

const root = process.cwd();
const draftsDir = path.join(root, "content", "drafts");
const postsDir = path.join(root, "content", "posts");

await fs.mkdir(draftsDir, { recursive: true });
await fs.mkdir(postsDir, { recursive: true });

const args = process.argv.slice(2);
const command = args[0] ?? "help";
const execFileAsync = promisify(execFile);

function option(name, fallback = "") {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1] ?? fallback;
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

async function git(...gitArgs) {
  try {
    const result = await execFileAsync("git", gitArgs, {
      cwd: root,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
    return result.stdout.trim();
  } catch (error) {
    const detail = error.stderr?.trim() || error.message;
    throw new Error(`git ${gitArgs.join(" ")} failed: ${detail}`);
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "untitled-note";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function frontmatter(fields) {
  return [
    "---",
    `title: ${JSON.stringify(fields.title)}`,
    `date: ${fields.date}`,
    `lane: ${fields.lane}`,
    `status: ${fields.status}`,
    `visibility: ${fields.visibility}`,
    `source: ${fields.source}`,
    "tags: []",
    "---",
    "",
  ].join("\n");
}

async function filesIn(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();
}

async function createDraft() {
  const title = option("title");
  if (!title) {
    throw new Error('Use: npm run journal -- new --title "Your note title"');
  }

  const date = option("date", today());
  const lane = option("lane", "notes");
  const source = option("source", "cli");
  const filename = `${date}-${slugify(title)}.md`;
  const destination = path.join(draftsDir, filename);
  const exists = await fs
    .access(destination)
    .then(() => true)
    .catch(() => false);

  if (exists) throw new Error(`Draft already exists: content/drafts/${filename}`);

  await fs.writeFile(
    destination,
    frontmatter({
      title,
      date,
      lane,
      status: "draft",
      visibility: "private",
      source,
    }) +
      "# " +
      title +
      "\n\nWrite the public version here. Remove private details, secrets, wallet data, and anything that should remain off the internet.\n",
    "utf8",
  );

  console.log(`Created content/drafts/${filename}`);
}

async function promoteDraft() {
  const requested = args[1];
  if (!requested) {
    throw new Error("Use: npm run journal -- publish <draft-file>");
  }

  const filename = path.basename(requested.endsWith(".md") ? requested : `${requested}.md`);
  const source = path.join(draftsDir, filename);
  const target = path.join(postsDir, filename);
  const content = await fs.readFile(source, "utf8");
  const publicContent = content
    .replace(/^status:\s*.*$/m, "status: published")
    .replace(/^visibility:\s*.*$/m, "visibility: public");

  await fs.writeFile(target, publicContent, "utf8");
  await fs.unlink(source);
  console.log(`Published content/posts/${filename}`);
  return { source, target };
}

async function listNotes() {
  const [drafts, posts] = await Promise.all([filesIn(draftsDir), filesIn(postsDir)]);
  console.log(`Drafts (${drafts.length})`);
  drafts.forEach((file) => console.log(`  content/drafts/${file}`));
  console.log(`Posts (${posts.length})`);
  posts.forEach((file) => console.log(`  content/posts/${file}`));
}

async function setupGit() {
  const remote = option("remote");
  const branch = option("branch", process.env.SPACEDUCK_GIT_BRANCH || "main");

  const isRepo = await git("rev-parse", "--is-inside-work-tree")
    .then((value) => value === "true")
    .catch(() => false);

  if (!isRepo) {
    await git("init", "-b", branch);
    console.log(`Initialized Git repository on ${branch}`);
  } else {
    const currentBranch = await git("branch", "--show-current");
    if (!currentBranch) await git("switch", "-c", branch);
    console.log("Git repository already initialized");
  }

  if (remote) {
    const remotes = await git("remote");
    if (remotes.split(/\r?\n/).includes("origin")) {
      await git("remote", "set-url", "origin", remote);
    } else {
      await git("remote", "add", "origin", remote);
    }
    console.log(`Configured origin: ${remote}`);
  } else {
    console.log("No remote changed. Add one with --remote <git-url>.");
  }
}

async function gitStatus() {
  console.log(await git("status", "--short", "--branch"));
  const remote = await git("remote", "get-url", "origin").catch(() => "");
  if (remote) console.log(`origin: ${remote}`);
}

async function commitPost(filename, push) {
  // -A is required here because publishing deletes the draft and creates the post.
  await git("add", "-A", "--", "content/drafts/", "content/posts/");
  const staged = await git("diff", "--cached", "--quiet").then(() => false).catch(() => true);
  if (!staged) {
    console.log("No Git changes to commit");
    return;
  }

  await git("commit", "-m", `content: publish ${filename.replace(/\.md$/, "")}`);
  console.log("Committed published post");

  if (push) {
    const remote = option("remote", "origin");
    const branch = option("branch", process.env.SPACEDUCK_GIT_BRANCH || (await git("branch", "--show-current")));
    await git("push", "-u", remote, branch);
    console.log(`Pushed ${branch} to ${remote}`);
  }
}

async function publishAndCommit() {
  const requested = args[1];
  const filename = path.basename(requested?.endsWith(".md") ? requested : `${requested ?? ""}.md`);
  const { source, target } = await promoteDraft();

  try {
    await commitPost(filename, hasFlag("push"));
  } catch (error) {
    await fs.rename(target, source).catch(() => {});
    throw new Error(`${error.message}\nRestored draft: content/drafts/${filename}`);
  }
}

function help() {
  console.log(`
spaceduck journal

  npm run journal -- new --title "A note from the build"
  npm run journal -- list
  npm run journal -- publish 2026-07-24-a-note-from-the-build.md
  npm run journal -- setup --remote https://github.com/you/spaceduck-content.git
  npm run journal -- status
  npm run journal -- publish 2026-07-24-a-note-from-the-build.md --push

New notes are private drafts. Publishing only moves a reviewed Markdown file
into content/posts. Use --push when the approved commit should be sent to the
configured Git remote for Alf to consume.
`);
}

try {
  if (command === "new") await createDraft();
  else if (command === "publish") await publishAndCommit();
  else if (command === "list") await listNotes();
  else if (command === "setup") await setupGit();
  else if (command === "status") await gitStatus();
  else help();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
