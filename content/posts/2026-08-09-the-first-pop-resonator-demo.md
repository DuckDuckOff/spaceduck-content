---
title: "The First POP Resonator Demo"
date: 2026-08-09
lane: field-notes
status: published
visibility: public
source: session
tags: [pop, crystal, resonance, hardware, prototype]
---
# The First POP Resonator Demo

The prototype has made it out of the diagram and onto the bench.

This is the first proper look at the physical POP resonator setup: a Waveshare ESP32-S3 Touch LCD, a crystal disc in its temporary enclosure, a breadboard full of the drive and sense conditioning, and a nest of jumper wires connecting the whole experiment together.

{{image:/media/pop-resonator-demo1.jpg|The POP crystal disc, temporary enclosure, breadboard, and resonator wiring on the bench}}

It is not a finished instrument. It is much better than that: it is an honest prototype. The enclosure is still temporary, the wiring is still exposed, and the signal is still small. Every part of the setup is visible, which means every assumption can still be challenged.

The four-wire disc is divided into two jobs. One pair receives the drive signal from GPIO11. The other pair returns the sense signal through a protected, biased ADC path into GPIO9. The Waveshare is holding the drive at 403 Hz while the visualizer watches the response rather than pretending that a single number is already a discovery.

{{image:/media/pop-resonator-demo2.jpg|The Waveshare crystal scope showing the 403 Hz drive and live sense waveform}}

The screen is now doing the useful part of the work. It shows the live waveform, peak-to-peak response, RMS level, phase, the corrected phase reference, and the current Q estimate. In this photograph, the device is reporting a 403 Hz drive and a response of only a few millivolts. That is a real measurement, but it is not yet a validated crystal fingerprint. Q is still effectively zero because the present circuit does not yet provide a clean enough ring-down measurement.

That distinction matters. The crystal does not need to generate power for POP to work. It needs to respond in a way that is repeatable, physically coupled to the disc, and distinguishable from electrical leakage, loose wiring, enclosure vibration, or noise. The next circuit step is a modest LM358 gain stage so the sense signal can be measured with more headroom. After that, we can sweep around the candidate frequency, measure bandwidth or ring-down, and test whether the response survives reconnects and small changes in the bench setup.

The hardware record now lives in its own repository: [The-Pop-Network/hardware](https://github.com/The-Pop-Network/hardware). That gives the physical experiment a place to continue independently of the larger POPchain codebase. The wiring map, the Waveshare firmware, the display driver, and the current limitations are all recorded there.

For now, the result is simple and encouraging: the disc is connected, the scope is alive, the instrument is seeing a signal, and the next question is no longer whether the prototype exists. It is how carefully we can teach it to tell the truth.
