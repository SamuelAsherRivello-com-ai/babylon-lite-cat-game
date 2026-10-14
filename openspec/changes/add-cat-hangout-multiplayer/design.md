# Design

## Context

See `proposal.md` for motivation. The starter is a strict TypeScript, WebGPU-only Babylon Lite 2D template. The game needs a Tiled-authored world, project-local art, and a shared Colyseus room hosted through the existing Vercel project.

## Goals / Non-Goals

**Goals:**

- Preserve pixel-perfect Babylon Lite rendering while supporting a scrolling top-down cat world.
- Keep gameplay rules independent from rendering, input, and transport.
- Keep the shared room responsive with predicted local motion and authoritative outcomes.

**Non-Goals:**

- Private rooms, matchmaking, combat, scores, progression, inventory, persistence beyond supported room recovery, or more than twelve humans.

## Decisions

### One public room with a minimum population

The server owns the sole room's human and bot slots. It fills only the gap below four cats, which preserves the requested social density without turning bots into a separate game mode. Private room codes and per-room discovery are excluded because they conflict with automatic entry.

### Server-authoritative rules with client presentation prediction

The server validates movement bounds, membership, bot transitions, and interaction outcomes. The local client predicts its own position and camera target, then reconciles corrections. Remote cats use timestamped snapshots and interpolation. This avoids visible local input delay while keeping a single source of truth.

### Tiled map contract and activity objects

The game reads an orthogonal map with named layers and objects for collisions, spawns, roaming zones, boxes, rest spots, food bowls, and cat trees. Gameplay reads the normalized map contract, not renderer objects. This keeps routine content edits in Tiled and rejects bad maps before play.

### Asset and animation adapters

Local copies of the provided CatMegaFree sheets feed a typed animation catalog. Cat state chooses directional walk, idle, sleep, or box frames. The existing dungeon Tiled and sprite-sheet systems provide reference behavior but are adapted to remove dungeon data and assumptions.

### Human and bot state separation

Human cats enter movement states only from input and select only stationary idles when inactive. Bots run a timed state machine of choose activity, path to a valid destination, perform activity, and cool down. This prevents bots from taking control of human cats.

## Risks / Trade-offs

- [Vercel's bounded room lifetime] → Show expired-room recovery and never promise durable room continuity.
- [Asset license evidence is absent from the supplied folder] → Record the user-provided source and required attribution; block public asset publication until rights are documented.
- [Latency can make crowds look jittery] → Limit update payloads, interpolate remote cats, and reduce activity frequency before reducing control responsiveness.
- [Tiled content can be malformed] → Validate map schema and object placement at load time with clear errors.

## Migration Plan

1. Rename the template application directory and update project paths.
2. Add and verify the server game registration, typed client package, and Vercel deployment.
3. Add client rules, map content, assets, UI, and transport integration.
4. Verify local and deployed two-client behavior, then publish Pages after server verification.
5. Roll back by deploying the prior verified server revision and restoring the prior Pages release if a release check fails.
