# Cat Hangout technical overview

`CatHangoutClient` is the browser boundary for the public `cat-hangout`
Colyseus room. It requests a seat automatically, consumes the reservation,
subscribes to authoritative snapshots, and retries after an interrupted
connection. It deliberately does not create an offline substitute room.

The server's `CatHangoutRoom` is authoritative for the twelve-human capacity,
the bot-fill rule, movement validation, interactions, bot activity state, and
the roster snapshot. A room has zero to twelve human cats; while it has fewer
than four, it adds only enough bots to make four total cats, up to three bots.

`network-sync.ts` keeps local input responsive without treating a client
prediction as authority. The local cat predicts normalized movement, then
reconciles toward the room snapshot; remote cats are interpolated between
snapshots. The player list always comes from the latest authoritative roster.

The editable map is `cat-hangout/public/maps/cat-hangout.tmj`. Its collision
layer and activity objects are validated by `tiled-map.ts` and covered by the
shipped-map test. Cat animation state is likewise explicit: humans select
idles when no input is held, while bots choose wandering and activity states
on the server.

## Verified multiplayer release

The game uses the released `v0.9.15` shared multiplayer server at
`https://rmc-colyseus-multiplayer-server.vercel.app`. On 2026-10-14 UTC,
the server's `GET /api/health` endpoint returned HTTP 200, version `0.9.15`,
and the `cat-hangout` game registration after its sustained-session release
probe completed successfully.
