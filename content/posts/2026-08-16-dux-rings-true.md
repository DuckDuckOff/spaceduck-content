---
title: "DUX Rings True"
date: 2026-08-16
lane: field notes
status: published
visibility: public
source: cli
tags: [dux, resonance, popchain, warden, physical-evidence, mining]
---

# DUX Rings True

I did not build DUX because I wanted to generate power or spend forever mapping computer physics. I wanted a physical device to ring, measure its own resonance honestly, have that evidence checked by WARDEN, and mine POP. Today, that loop closed.

The difficult part was not the existence of the measurements. DUX was already measuring real resonance and producing authentic Q-factor values. The problem was in how the system selected and carried those measurements forward: a noisy broad sweep could win too early, phase could be overwritten later in the process, and one pass could be treated as stable before the device had actually converged.

We changed the firmware to build a repeated, multi-pass resonance profile. DUX now finds a candidate peak, measures it again, and only adopts the result when frequency, phase and Q agree within WARDEN's tolerances. The converged fingerprint was frozen at **363 Hz, 19.56° phase and Q 34.52**. WARDEN verified it with full confidence.

Then DUX mined a confirmed physical-resonance block: block **105525**, measured at **363 Hz**, **19.07° phase**, and **Q 34.7**, with a reward of **142 POP**. The chain records the evidence class as `physical_resonance` and the verification status as `verified`. For physical hardware, simulated FDTD steps are now shown honestly as `N/A` rather than pretending the device ran a numerical lattice.

This does not mean every future DUX will resonate at exactly 363 Hz. Resonance belongs to the whole coupled assembly—the enclosure, mounting, crystal, transducers, materials and electronics. What we have proved is that the process can discover a device's resonance, measure its phase and Q, register a trustworthy fingerprint with WARDEN, and use subsequent matching observations to mine POP.

The production path is clearer now: design a controlled enclosure and fixture, define a product-family acceptance envelope, and calibrate each unit at the end of the line so it carries its own authenticated physical fingerprint.

The bell rang. Time kept moving. DUX mined POP.
