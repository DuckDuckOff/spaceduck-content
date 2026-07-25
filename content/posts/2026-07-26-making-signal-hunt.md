---
title: "Making Signal Hunt"
date: 2026-07-26
lane: field-notes
status: published
visibility: public
source: session
tags: [signal-hunt, popchain, hardware, games]
---
# Making Signal Hunt

I wanted to make the physical POP project easier to enter.

There are a lot of pieces to it now: a crystal, a receiver, a breadboard, an enclosure, clamps, a miner rig, a reference simulation, a chain application, and the long wait between an idea and something that can actually sit on a bench. It is possible to understand each piece separately and still lose the feeling of how they belong together.

So I made a small game.

Signal Hunt is a command-line adventure written in Go. It begins on a ridge, where the player finds a glassy resonance fragment in the dirt. From there, the project becomes a sequence of practical thresholds: tune the receiver to 403 Hz, wait for the hardware to arrive, assemble the breadboard, fit the enclosure, secure the clamps, and wake the first physical POPdevice.

The game is deliberately plain. There are no graphics engine, account system, or elaborate world to get through before the important idea appears. The terminal is enough. A saved story is enough. The point is to give the work a shape that can be followed.

After the device is assembled, the player visits the office and applies to mine on POPchain. The application is not an instant reward. It is reviewed, then the miner rig can be connected. The FDTD simulator can join as a reference source, but it does not earn POP. The physical rig has to be present, and its signal has to overlap the simulated reference within tolerance before calibration is complete.

That distinction matters to me. A simulation can help predict, compare, and debug a resonance. It should not quietly become a substitute for the physical contribution the network is meant to recognise.

Making the game also made the system easier to see. The sequence is not really about collecting points. It is about moving from attention, to measurement, to assembly, to permission, to verification. The little notifications in the game — POPchain, application passed, READY FOR FIELD TEST — turn invisible transitions into something the player can feel.

I like that the project can now be approached in two ways. Someone can read the protocol and inspect the code. Or they can start a story, climb the ridge, tune the receiver, and discover the structure one step at a time.

Signal Hunt is tiny, but that is part of its usefulness. It is a playable field note: a small interface for remembering that the chain is supposed to lead back to a device, a signal, and a real test in the world.
