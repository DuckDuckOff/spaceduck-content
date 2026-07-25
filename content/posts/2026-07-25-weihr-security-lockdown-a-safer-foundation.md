---
title: "WEIHR Security Lockdown: A Safer Foundation"
date: 2026-07-25
lane: security
status: published
visibility: public
source: session
tags: []
---
# WEIHR Security Lockdown: A Safer Foundation

Today we gave WEIHR a serious security pass.

The goal was simple: make sure identity, resonance, and administrative actions fail safely before we build further on top of them.

## What changed

- WARDEN identity records can no longer be used for self-escalation. Assigning privileged roles or policy references now requires the immutable bootstrap authority or an already trusted administrator.
- Resonant readings now need finite, positive values and a recent timestamp. Old readings cannot simply be replayed later.
- WARDEN request bodies are bounded so oversized JSON cannot consume unlimited memory.
- The public identity registry now has a conservative capacity ceiling, reducing the risk of disk and memory exhaustion through repeated registrations.
- The chain HTTP server now has explicit read, write, idle, and header-size limits instead of relying on unsafe defaults.
- Resolver administration no longer returns internal exception details to callers. Operational detail stays in server logs.

## What we verified

The Go test suite passed after the changes. The work was kept local for review; no production deployment was made today.

## What comes next

WEIHR still needs endpoint rate limiting, a deliberate browser-origin allowlist, and focused tests for the WARDEN HTTP surface before these changes should be considered deployment-ready.

This was a foundational day: security is now part of the protocol’s shape, not an afterthought added around it.
