# Tasks

## 1. Project and content setup

- [x] 1.1 Rename `project-name` to the Cat Hangout application directory and update all project paths, placeholders, orientation, and metadata; verify searches find no required stale template names.
- [x] 1.2 Copy approved CatMegaFree files into project-local assets, document source and attribution evidence, and verify the built game has no external-folder asset references.
- [x] 1.3 Add typed Tiled map fixtures, map contract validation, and Tiled editor documentation; verify valid and invalid map tests pass.

## 2. Shared multiplayer server

- [x] 2.1 Add the Cat Hangout room registration, 12-human capacity, identity generation, and bot occupancy to the Colyseus server; verify server unit tests cover one, four, and twelve human populations.
- [x] 2.2 Add authoritative movement-bound and interaction validation with typed room state; verify invalid client actions are rejected or corrected.
- [ ] 2.3 Release and deploy the server through its existing workflow, run its sustained-session probe, and record the verified client package version and endpoint.

## 3. Client game rules and rendering

- [x] 3.1 Implement typed cat, activity, input, and bot state machines independent of rendering; verify unit tests cover human idle behavior and bot transitions.
- [x] 3.2 Replace the showcase with a pixel-perfect Babylon Lite Tiled world using only the approved entry-point sprite and camera APIs; verify WebGPU unsupported-state handling and map collision behavior.
- [x] 3.3 Add tilesheet animation definitions for walking, idle, sleep, and box activity; verify animation selection and frame timing tests pass.
- [x] 3.4 Add roster, labels, WASD/arrow input, Space action, virtual joystick, action button, pause, and connection-state UI; verify keyboard and touch tests pass.

## 4. Synchronization and recovery

- [ ] 4.1 Integrate the released shared client with local prediction, reconciliation, remote interpolation, and camera tracking; verify deterministic client rule and interpolation tests pass.
- [ ] 4.2 Implement join, full, disconnect, expired-room, and retry behavior without offline substitution; verify simulated connection-loss and reconnect tests pass.
- [ ] 4.3 Test two independent clients under simulated latency and jitter; verify responsive local movement, smooth remote motion, stable bot population, and consistent interactions.

## 5. Delivery and release

- [ ] 5.1 Update README and project documentation with controls, asset provenance, player limits, recovery limits, setup, and the original prompt; verify every documented command and link.
- [ ] 5.2 Run source coverage, strict typecheck, tests, production build, and the required triage analysis; verify all commands pass and record results.
- [ ] 5.3 Publish the verified public GitHub Pages game, verify its production path with the deployed backend, and capture representative browser evidence.
