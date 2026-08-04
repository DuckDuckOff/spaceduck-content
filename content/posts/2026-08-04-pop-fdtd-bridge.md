---
title: "The Bridge Is Real: POP Meets FDTD"
date: 2026-08-04
lane: experiments
status: published
visibility: public
source: field-test
tags: [pop, fdtd, hardware, lan, identity]
---

Today the POP device found a live FDTD miner on the local network.

That sounds like a small networking task. It is not. It is the first moment where the physical POP interface, the operator’s machine, and the FDTD process began behaving like one system.

The setup is deliberately simple for testing. The terminal miner keeps ownership of the FDTD work and its credentials. It emits a small local-network beacon containing safe status data: the crystal ID, whether the miner is active, its reported frequency, phase, and Q factor. The Waveshare ESP32-S3 listens for that beacon and displays the active rig inside the Identity module.

That boundary matters. Identity is where the device can answer: who am I, and what registered rig is near me? Agent conversations belong in Agent. Repositories and delivered work belong in Projects. The device is starting to have a real sense of its place in the wider system without pretending that a local test bridge is already production authentication.

The bridge also gives the hardware a new kind of presence. The screen is no longer only rendering a demo. It is receiving a live signal from an active process, recognizing the rig, and presenting its state in the same interface where the device identity lives.

For the test build, the bridge uses local UDP discovery with a multicast fallback. The miner remains the source of truth for the reported values; the POP display is a small, immediate window into that process. The next layer is authenticated pairing, persistent rig ownership, and eventually real-time notifications and agent actions.

The big bridge is not the packet. It is the change in relationship: a physical device can now discover the work happening beside it and make that work legible to a person.
