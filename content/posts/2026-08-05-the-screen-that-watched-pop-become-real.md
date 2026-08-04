---
title: "The screen that watched POP become real"
date: 2026-08-05
lane: notes
status: published
visibility: public
source: cli
tags: [pop, device, mining, wallet, prototype]
---
# The screen that watched POP become real

There was a moment tonight when the POP device stopped feeling like a screen attached to a development board.

It was sitting on the desk, showing the miner’s live activity: steps moving, blocks being accepted, and the POP total gradually increasing. Not a mockup. Not a dashboard screenshot. A physical object was receiving the work of the miner and making that work visible in real time.

That is a strangely powerful feeling.

The device now knows about the rig, displays its live frequency and status, shows the mined total, and keeps the chain activity close enough to watch. The numbers are still bounded by testing limits and the chain’s verification cadence, but they are real network results. The screen is not pretending that POP is being earned. It is showing the system earning it.

Then came the part I really wanted to test: claiming.

The wallet pairing flow took some work to make consistent. For a while the device knew the wallet was paired, while the claim screen still behaved as if it did not. Once that state was repaired, the claim went through. The POP appeared in the wallet and on the chain explorer, and the miner continued afterwards.

That continuation mattered almost as much as the claim itself. The system did not stop at a successful transaction. It returned to its normal loop: the miner kept working, the device kept receiving telemetry, and the chain kept recording the next pieces of progress.

{{image:/media/pop-prototype-4.jpg|The POP prototype running on the desk}}

This is still a deliberately limited prototype. The current work is software-side mining and network integration while the physical crystal system is being assembled. The device is not yet driving the final resonance hardware, and the safety layers for that future stage still need to be designed properly.

But the architecture is beginning to separate into useful pieces. The ESP32-S3 device can become the real-time controller and instrument for the crystal data. A future handheld compute layer can carry the heavier interface, agentic interaction, Farcaster identity, signing, and creator tools. The crystal and tower can remain focused on the physical experiment.

For now, I get to hold the smaller version of that idea in my hand: a device that watches POP being mined, lets me claim it, and then keeps going.

That is wild enough for one night.
