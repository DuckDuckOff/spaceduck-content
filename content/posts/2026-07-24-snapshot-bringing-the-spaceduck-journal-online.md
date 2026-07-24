---
title: "Snapshot: Bringing the Spaceduck Journal Online"
date: 2026-07-24
lane: build-log
status: published
visibility: public
source: cli
tags: []
---
# Snapshot: Bringing the Spaceduck Journal Online

Today the spaceduck journal became a small, working publishing system.

- Drafts begin as private Markdown notes.
- Approved entries are committed and pushed to GitHub.
- A lightweight static builder turns the posts into a distinct journal page.
- Wrangler deploys the result to Cloudflare Pages.
- `blog.spaceduck.ing` serves the live site.

The first live note was **frogs happen**, with the entire post saying “no comment.” Along the way, the publish flow learned to stage both the draft removal and the new post correctly, so future entries can travel the same path without losing their place.

The journal is now open for field notes: small observations, build logs, strange ideas, and whatever signal arrives next.
