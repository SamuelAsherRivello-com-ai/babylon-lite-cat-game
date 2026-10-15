[Overview](overview.md) · [Standardization analysis](standardization-analysis.md) · Architecture analysis · [Verification baseline](verification-baseline.md) · [Back](overview.md)

# Architecture analysis

`cat-hangout/src/game/` owns player input, cat state, network prediction, room presentation contracts, and Tiled validation. `src/content/` owns the Babylon Lite pixel-perfect scene through `BabylonLiteAIEntry`; `src/ui/` owns React shell and touch controls; `src/shared/` contains only shell-wide helpers. The public server is accessed solely through `CatHangoutClient`.

The dependency direction is appropriate: UI composes the game, game publishes camera state to content, and content does not own simulation state. `CatHangoutClient` maps generic shared-client lifecycle state to cat-specific snapshots; its injected factory is a practical seam for deterministic recovery tests. The Tiled loader keeps external TSX URL resolution and animation timing out of React components.

| # | Candidate | Evidence | Expected value | Risk and non-goals | Urgency / owner |
| --- | --- | --- | --- | --- | --- |
| ARCH02 | Shared multiplayer state contract | `CatHangoutClient` casts generic `players` to `ServerCat[]` after server validation. | A future released client could expose a typed Cat state directly. | Do not duplicate server schemas or replace Colyseus; current cast is localized and covered by browser verification. | Medium / Rearchitect only if the contract expands. |
| ARCH03 | Tiled asset boundary | TMJ references TSX and `tiled-tileset.ts` resolves it relative to the map URL. | Keeps editor-authored metadata independent from renderer code. | Do not move maps into React or use direct Babylon sprite APIs. | Low / preserve. |
| ARCH04 | Recovery factory seam | The client factory permits connection lifecycle tests without a live room. | Retains behavioral tests across library upgrades. | Do not make test fakes production transport. | Low / preserve. |
