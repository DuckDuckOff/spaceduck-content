---
title: "The first resonance breadboard"
date: 2026-08-09
order: 1
lane: notes
status: published
visibility: public
source: cli
tags: [pop, crystal, resonance, hardware, prototype]
---
# The first resonance breadboard

Today we stopped talking about the crystal build as a future thing and put the
first sensing circuit on the desk.

The piezos are glued to the discs. The Waveshare ESP32-S3 screen is the
temporary hub. Its header gives us a practical little bridge between the
physical discs and the POP software: one pin to drive the resonator, one pin to
listen, and the screen waiting to show what the crystal tells us.

The breadboard now has the first conditioned sensing path: a protected ADC
input, a biased signal node, and a separate drive path through a 10kΩ resistor.
The objective is deliberately simple. We are not trying to power the hub from
the piezos yet. We are trying to make the discs hum, measure their response,
find their resonance profile, and then register that crystal on-chain and in
the little POP hub.

The wiring is complete and has been checked. The next step is firmware: flash a
small test mode that drives the disc around 403 Hz, reads the response, and
reports the signal safely. The machine’s file-edit runner misbehaved before we
could flash it, so the hardware is resting unplugged and the setup is recorded
for the next session.

That is still a beginning. The disc is attached, the hub is waiting, and the
first physical identity is almost ready to answer back.
