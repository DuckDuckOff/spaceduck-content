---
title: "The Miner Was Never the Dashboard"
date: 2026-07-27
lane: notes
status: published
visibility: public
source: journal-chat
tags: [popchain, fdtd, building]
---
Today the FDTD miner moved from an idea into something I could actually watch.

The real wave-propagation engine runs in a terminal. A small local dashboard shows the field progressing, while the chain receives only a simple statement that the work is active and advancing. The public site does not pretend to be the miner.

There was a brief wrong turn where I made the dashboard public. That felt useful at first, but it confused visibility with proof. We pulled it back behind `127.0.0.1`, kept the process private, and let the chain record only the observed state.

Then I watched the numbers climb: thousands of FDTD steps, hundreds of hashes, a live process reflected remotely. Eventually I stopped it, and the chain could notice that too.

It is still software liveness, not hardware proof. But tonight the boundary feels clearer: the terminal does the work, the browser watches, and the chain says only what it has actually observed.
