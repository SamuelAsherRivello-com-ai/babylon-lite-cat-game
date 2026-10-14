import { Client, type Room } from "@colyseus/sdk";

export type ServerCatActivity = "idle" | "wander" | "rest" | "box" | "food" | "tree" | "social";

export type ServerCat = Readonly<{
  id: string;
  number: number;
  name: string;
  color: string;
  bot: boolean;
  x: number;
  z: number;
  activity: ServerCatActivity;
}>;

export type CatHangoutSnapshot = Readonly<{
  capacity: number;
  players: readonly ServerCat[];
  cats: readonly ServerCat[];
}>;

export type CatHangoutConnection = Readonly<{
  status: "connecting" | "connected" | "reconnecting" | "full" | "expired" | "disconnected" | "error";
  snapshot: CatHangoutSnapshot | null;
  sessionId: string | null;
  error: string;
}>;

type Listener = (connection: CatHangoutConnection) => void;
type CatHangoutRoom = Room<unknown, unknown>;

const DEFAULT_ENDPOINT = "https://rmc-colyseus-multiplayer-server.vercel.app";

function endpointFromEnvironment() {
  return import.meta.env.VITE_RMC_SERVER_URL?.trim().replace(/\/$/, "") || DEFAULT_ENDPOINT;
}

/** Connects the public hangout UI to one authoritative shared Colyseus room. */
export class CatHangoutClient {
  readonly endpoint: string;
  private room: CatHangoutRoom | undefined;
  private listeners = new Set<Listener>();
  private generation = 0;
  private retry: ReturnType<typeof setTimeout> | undefined;
  private stopped = true;
  private state: CatHangoutConnection = { status: "connecting", snapshot: null, sessionId: null, error: "" };

  constructor(endpoint = endpointFromEnvironment()) { this.endpoint = endpoint; }

  subscribe(listener: Listener) { this.listeners.add(listener); listener(this.state); return () => this.listeners.delete(listener); }

  connect() { this.stopped = false; void this.join(); }

  retryNow() {
    this.stopped = false;
    clearTimeout(this.retry);
    void this.join();
  }

  move(x: number, z: number) { if (this.state.status === "connected") this.room?.send("move", { x, z }); }

  interact() { if (this.state.status === "connected") this.room?.send("interact"); }

  disconnect() {
    this.stopped = true;
    this.generation++;
    clearTimeout(this.retry);
    const room = this.room; this.room = undefined;
    if (room) { room.reconnection.enabled = false; void room.leave(); }
  }

  private emit() { for (const listener of this.listeners) listener(this.state); }

  private setState(next: CatHangoutConnection) { this.state = next; this.emit(); }

  private async join() {
    const generation = ++this.generation;
    clearTimeout(this.retry);
    this.setState({ ...this.state, status: this.state.snapshot ? "reconnecting" : "connecting", error: "" });
    try {
      const response = await fetch(`${this.endpoint}/api/join/cat-hangout`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      const reservation = await response.json() as unknown;
      if (!response.ok) throw new Error(readError(reservation));
      const room = await new Client(this.endpoint).consumeSeatReservation(reservation as never);
      if (this.stopped || generation !== this.generation) { await room.leave(); return; }
      this.room = room;
      room.onMessage("snapshot", (snapshot: CatHangoutSnapshot) => this.receive(generation, snapshot));
      room.onMessage("presence", (snapshot: CatHangoutSnapshot) => this.receive(generation, snapshot));
      room.onMessage("catState", (snapshot: CatHangoutSnapshot) => this.receive(generation, snapshot));
      room.onError((_code, message) => this.fail(generation, message || "The room rejected the connection."));
      room.onLeave(() => this.fail(generation, "Connection interrupted. Retrying…"));
      this.setState({ status: "connected", snapshot: this.state.snapshot, sessionId: room.sessionId, error: "" });
      room.send("snapshot");
    } catch (error) { this.fail(generation, error instanceof Error ? error.message : "Cannot connect to Cat Hangout."); }
  }

  private receive(generation: number, snapshot: CatHangoutSnapshot) {
    if (this.stopped || generation !== this.generation) return;
    this.setState({ status: "connected", snapshot, sessionId: this.room?.sessionId ?? null, error: "" });
  }

  private fail(generation: number, message: string) {
    if (this.stopped || generation !== this.generation) return;
    this.room = undefined;
    const status = getRecoveryStatus(message);
    this.setState({ ...this.state, status, sessionId: null, error: message });
    if (status === "reconnecting" || status === "disconnected") this.retry = setTimeout(() => void this.join(), 2_000);
  }
}

export function getRecoveryStatus(message: string): Extract<CatHangoutConnection["status"], "full" | "expired" | "disconnected" | "reconnecting"> {
  const normalized = message.toLowerCase();
  if (normalized.includes("full") || normalized.includes("capacity")) return "full";
  if (normalized.includes("expired") || normalized.includes("reservation")) return "expired";
  if (normalized.includes("disconnect") || normalized.includes("interrupted")) return "disconnected";
  return "reconnecting";
}

function readError(value: unknown) {
  if (value && typeof value === "object" && "error" in value && typeof value.error === "string") return value.error;
  return "Cat Hangout is temporarily unavailable.";
}
