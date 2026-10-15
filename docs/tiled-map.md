# Tiled map contract

Create an orthogonal Tiled map with positive tile dimensions. Add a `Collision` tile layer with one cell for every map tile. Add an `Activities` object layer containing at least one object of each type: `human-spawn`, `bot-roam`, `box`, `rest`, `food`, and `tree`.

## Tilesets and animation

`cat-hangout/public/maps/cat-hangout.tmj` references the external
`../tilesets/cat-furniture.tsx` tileset. Keep that relative path when editing
the map in Tiled. The TypeScript runtime resolves the TSX from the map URL,
checks its declared tile geometry against the image, and uses the tile's
`animation` frame durations when it renders animated furniture.

Cat characters use the copied CatMega tilesheets through the same typed
animation catalog: a human has movement and idle frame selections, while bots
also select typed activity animations. Keep frame dimensions and durations in
the catalog instead of embedding ad-hoc sprite offsets in UI code.
