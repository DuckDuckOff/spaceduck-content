---
title: "The Miner Was Never the Dashboard"
date: 2026-07-27
lane: notes
status: published
visibility: public
source: journal-chat
tags: [popchain, fdtd, warden, building]
---
Today began in the middle of a thread that had been interrupted by a dead Wi-Fi connection. That is a strange way to build a system: not from a clean brief, but from fragments still warm from the previous attempt. A file uploader. Notes that could not be deleted. A crystal registration page. A wallet identity that should appear only after verification. A user front end that should not quietly become the WARDEN.

The important thing was not to flatten those things into one login.

The WARDEN belongs to weihr.org. People do not log in to the WARDEN state. POPchain is a separate surface. A crystal can be verified, receive a `~w` wallet identity, and then sign up for POPchain without the two systems pretending to be the same thing. That separation felt less like an architectural preference than a kind of honesty.

Then I misunderstood the simulator.

I put a browser page on the public chain that showed FDTD progress. It was wrong in the most instructive way: the page was visible, but visibility was being confused with proof. The real thing was elsewhere, in the BotBearPig Python engine: a crystal lattice, a field, a 500-step propagation window, a digest. The browser did not need to become the miner. It needed to watch the miner that was actually running.

So the public page came down. `/fdtd` returns 404 now. The miner runs in a terminal. Its dashboard lives at `127.0.0.1`, beside the process, where it can be watched without turning private work into a public performance.

That distinction changed the shape of the system. The terminal process runs the actual FDTD engine. The local browser shows its steps, hashes, durations, and last digest. POPchain receives a narrow message: observed, fresh, advancing. It does not turn the simulation into a reward faucet. It does not count the result as fruit just because something moved.

Then came the second boundary: the miner must not create WARDEN identities.

There should be one system WARDEN, apart from the worker identities we deliberately provision. A miner submits its reading. POPchain asks the configured WARDEN to verify it. If the heartbeat is fresh and the resonance reading agrees with the registered miner, the chain records the promotion. The explorer can say `verified`, and it can show the FDTD step count, but the miner has not become a person, and the person has not been smuggled into the verifier.

We ran it. For a while the numbers climbed: 47,000 steps, then 138,000. The local dashboard said the process was running. The chain saw the same steps. Then I stopped it. That also mattered. A live system should be able to say when the living thing is no longer there. After the timeout, the chain goes offline.

There is no grand conclusion tonight. The heartbeat is still software liveness, not hardware attestation. A bearer token is not a crystal. A digest from a local process is not the physical disc. The system is not finished, and it would be easy to write around that fact until the words sounded like certainty.

But the boundaries are clearer than they were this morning.

The crystal application can wait. The wallet identity can be issued without collapsing auth layers. The WARDEN can remain a verifier instead of becoming a login screen. The FDTD miner can run privately while the chain records only what it has actually been told and checked. The browser can watch without pretending to be the source.

That feels like progress: not making the machine louder, but making its claims smaller, cleaner, and harder to misunderstand.
