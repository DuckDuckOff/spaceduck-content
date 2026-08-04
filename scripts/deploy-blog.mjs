#!/usr/bin/env node

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import process from "node:process";

const execFileAsync = promisify(execFile);

if (process.env.SPACEDUCK_CONFIRM_DEPLOY !== "yes") {
  console.error("Refusing to deploy: set SPACEDUCK_CONFIRM_DEPLOY=yes only when publication is explicitly approved.");
  process.exit(1);
}

const npmCommand = process.platform === "win32" ? process.env.ComSpec : "npm";
const npxCommand = process.platform === "win32" ? process.env.ComSpec : "npx";
const npmArgs = process.platform === "win32" ? ["/d", "/s", "/c", "npm run blog:build"] : ["run", "blog:build"];
const npxPrefix = process.platform === "win32" ? ["/d", "/s", "/c"] : [];

const build = await execFileAsync(npmCommand, npmArgs, { windowsHide: true });
process.stdout.write(build.stdout);
process.stderr.write(build.stderr);
const deploy = await execFileAsync(npxCommand, [...npxPrefix, "npx", "wrangler", "pages", "deploy", "./blog-dist", "--project-name", "spaceduck-blog", "--branch", "main", "--commit-dirty=true"], {
  windowsHide: true,
});
process.stdout.write(deploy.stdout);
process.stderr.write(deploy.stderr);
