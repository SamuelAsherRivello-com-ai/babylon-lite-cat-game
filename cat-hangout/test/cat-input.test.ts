import assert from "node:assert/strict";
import test from "node:test";
import { resolveCatMovement } from "../src/game/cat-input.ts";
import { CatHangoutClient, getRecoveryStatus, type ServerCat } from "../src/game/cat-hangout-client.ts";
import type { MultiplayerClient, MultiplayerState } from "@rmc/multiplayer-client";
import { setCatCameraTarget, subscribeCatCameraTarget } from "../src/game/cat-camera.ts";

test("combines WASD, arrows, and virtual-stick movement without exceeding server bounds", () => {
  assert.deepEqual(resolveCatMovement(new Set(["w", "d"]), { x: 0, y: 0 }), { x: 1, y: -1 });
  const blended = resolveCatMovement(new Set(["arrowleft"]), { x: 0.8, y: 1.2 });
  assert.ok(Math.abs(blended.x + 0.2) < Number.EPSILON);
  assert.equal(blended.y, 1);
  assert.deepEqual(resolveCatMovement(new Set(), { x: 0, y: 0 }), { x: 0, y: 0 });
});

test("classifies full, expired, and interrupted-room recovery states", () => {
  assert.equal(getRecoveryStatus("Room is full"), "full");
  assert.equal(getRecoveryStatus("seat reservation expired"), "expired");
  assert.equal(getRecoveryStatus("Connection interrupted. Retrying…"), "disconnected");
  assert.equal(getRecoveryStatus("gateway unavailable"), "reconnecting");
});

test("keeps server state through reconnect and never creates an offline cat room", () => {
  type State = MultiplayerState<unknown, unknown, unknown, unknown> & { cats?: readonly ServerCat[] };
  let receive: ((state: State) => void) | undefined;
  const calls: string[] = [];
  const fake = {
    subscribe(listener: (state: State) => void) { receive = listener; return () => true; },
    connect() { calls.push("connect"); return Promise.resolve(); },
    disconnect() { calls.push("disconnect"); },
    send(type: string) { calls.push(type); },
  } as unknown as MultiplayerClient;
  const state = (details: Pick<State, "status" | "capacity" | "players" | "sessionId" | "error"> & { cats?: readonly ServerCat[] }): State => ({
    ...details,
    strokes: new Map(), gameState: null, chats: [], seat: null, hostId: null, transfer: null, lastAction: null,
  });
  const client = new CatHangoutClient("https://example.test", () => fake);
  const states: Array<{ status: string; cats: number }> = [];
  client.subscribe((state) => states.push({ status: state.status, cats: state.snapshot?.cats.length ?? 0 }));
  client.connect();
  const cat: ServerCat = { id: "human", number: 1, name: "Mochi", color: "#f00", bot: false, x: 2, z: 3, activity: "idle" };
  receive?.(state({ status: "connected", capacity: 12, players: [cat], cats: [cat], sessionId: "human", error: "" }));
  client.move(1, 0);
  client.interact();
  receive?.(state({ status: "offline", capacity: 12, players: [], sessionId: "human", error: "connection interrupted" }));
  client.retryNow();
  receive?.(state({ status: "reconnecting", capacity: 12, players: [], sessionId: "human", error: "retrying" }));
  receive?.(state({ status: "ended", capacity: 12, players: [], sessionId: "human", error: "reservation expired" }));
  receive?.(state({ status: "full", capacity: 12, players: [], sessionId: null, error: "room full" }));
  assert.deepEqual(calls, ["connect", "move", "interact", "connect"]);
  assert.deepEqual(states, [
    { status: "connecting", cats: 0 },
    { status: "connected", cats: 1 },
    { status: "disconnected", cats: 1 },
    { status: "reconnecting", cats: 1 },
    { status: "expired", cats: 1 },
    { status: "full", cats: 1 },
  ]);
});

test("publishes the predicted local cat as the renderer camera target", () => {
  const received: Array<{ x: number; y: number } | null> = [];
  const unsubscribe = subscribeCatCameraTarget((target) => received.push(target));
  setCatCameraTarget({ x: 128, y: 96 });
  unsubscribe();
  setCatCameraTarget(null);
  assert.deepEqual(received, [null, { x: 128, y: 96 }]);
});
