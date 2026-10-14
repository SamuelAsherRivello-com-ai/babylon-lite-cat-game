# Proposal

## Why

The template is a renderer showcase, not a social game. Cat Hangout turns it into a low-pressure shared cat space where visitors can join immediately, move around together, and interact with the room without competitive goals.

## What Changes

- Replace the template showcase with a landscape, pixel-perfect 2D cat-hangout game for up to 12 human players in one automatic shared room.
- Add synchronized player identity, presence, movement, interactions, and bot occupancy through the shared Colyseus server.
- Add Tiled-authored map loading, collision, activity zones, tilesheet animation, and copied local CatMegaFree assets with provenance documentation.
- Add keyboard and touch controls, a compact roster, local prediction, remote interpolation, reconnect states, and a public GitHub Pages release path.
- Add bot cats only while fewer than four humans are present, up to three bots.

## Capabilities

### New Capabilities

- `shared-cat-room`: Automatic shared-room joins, 12-human capacity, identity, presence, and bot occupancy.
- `cat-hangout-play`: Cat movement, non-competitive interactions, controls, animation state, and bot activities.
- `tiled-cat-world`: Tiled map loading, validation, collision, activity zones, and local art provenance.
- `multiplayer-cat-sync`: Authoritative Colyseus state, client prediction, interpolation, reconnect, and recovery UI.

### Modified Capabilities

None.

## Impact

- Replaces the template app under the renamed Vite application directory.
- Extends `SamuelAsherRivello-com-ai/rmc-colyseus-multiplayer-server` and its Vercel deployment.
- Adds Tiled-compatible content, CatMegaFree asset copies, strict TypeScript rules/tests, and public Pages deployment configuration.
