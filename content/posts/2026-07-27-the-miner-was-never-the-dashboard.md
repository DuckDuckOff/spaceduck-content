---
title: "The Miner Was Never the Dashboard"
date: 2026-07-27
lane: notes
status: published
visibility: public
source: journal-chat
tags: [popchain, fdtd, building]
---
Today the FDTD miner became something I could watch. The real simulation runs privately in a terminal, while a small local dashboard shows its progress and the chain records only whether the work is active.

Making the dashboard public briefly blurred visibility with proof, so it returned to `127.0.0.1`. The numbers climbed, the chain saw the miner stop, and the boundary became clearer: the terminal does the work, the browser watches, and the chain reports only what it has observed. It is software liveness for now, not hardware proof.
