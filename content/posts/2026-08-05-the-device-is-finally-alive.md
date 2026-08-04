---
title: "The device is finally alive"
date: 2026-08-05
lane: notes
status: published
visibility: public
source: cli
tags: [pop, hardware, prototype]
---
# The device is finally alive

Tonight felt like one of those sessions where a prototype quietly crosses a line.

We started with a device that could display a beautiful interface, but still felt separate from the system around it. By the end of the night, the physical device was connected to the live miner, reporting its work, keeping in sync with the chain, and showing that the whole loop can exist outside a terminal window.

The first real breakthrough was getting the heartbeat connection working again. Once the device and the miner could reliably see the same network state, the numbers started to mean something: blocks were being observed, rewards were accumulating, and the prototype was building a visible history of its own activity.

{{image:/media/pop-prototype-4.jpg|The working POP prototype on the desk}}

Then we connected the wallet. Pairing the device to a wallet turned it from a display into something with an owner and a destination. We also added a direct claim action, so the device can send its accumulated test rewards to the paired wallet without needing to leave the device and complete the whole process somewhere else.

{{image:/media/pop-prototype-3.jpg|The device interface running on the prototype}}

That part still feels surprisingly significant. It is a small prototype, running in a testing environment, with sensible limits in place. But it is no longer just an idea about a crystal-powered miner. There is a working device on the desk, a connected miner behind it, a chain receiving its activity, and a wallet that can receive what it earns.

{{image:/media/pop-prototype-2.jpg|A closer look at the prototype hardware}}

We also spent time making the device feel like a real object rather than a development board: matching the lock screen and miner controls, improving redraws, restoring reliable touch navigation, and giving the interface a proper background. The colourful POP wallpaper finally made it onto the display, and the little machine immediately felt more like itself.

{{image:/media/pop-prototype-1.jpg|The POP device with its colourful display background}}

There are still rough edges. Some navigation paths need another pass, the wallet and claiming flow will need more testing, and the crystal hardware is still ahead of us. But that is exactly where a prototype should be: no longer hypothetical, not yet finished, and moving because there is now something real to improve.

The next step is to keep tightening the device around the crystal experiment: better visual feedback, cleaner navigation, more reliable claims, and a clearer connection between the physical resonance and the work the network records.

For tonight, though, the important part is simple: the device is working, the miner is connected, and the prototype is beginning to feel like a system instead of a collection of separate pieces.
