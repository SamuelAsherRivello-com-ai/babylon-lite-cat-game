import { MultiplayerClient, type MultiplayerState } from "@rmc/multiplayer-client";

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
type CatActions = Readonly<{ move: Readonly<{ x: number; z: number }>; interact: undefined; snapshot: undefined }>;
type SharedState = MultiplayerState<unknown, unknown, unknown, unknown> & Readonly<{ cats?: readonly ServerCat[] }>;
type SharedClientFactory = (endpoint: string) => MultiplayerClient<unknown, CatActions>;

const DEFAULT_ENDPOINT = "https://rmc-colyseus-multiplayer-server.vercel.app";

function endpointFromEnvironment() {
  return import.meta.env.VITE_RMC_SERVER_URL?.trim().replace(/\/$/, "") || DEFAULT_ENDPOINT;
}

/** Connects the public hangout UI to one authoritative shared Colyseus room. */
export class CatHangoutClient {
  readonly endpoint: string;
  private shared: MultiplayerClient<unknown, CatActions> | undefined;
  private listeners = new Set<Listener>();
  private state: CatHangoutConnection = { status: "connecting", snapshot: null, sessionId: null, error: "" };

  constructor(
    endpoint = endpointFromEnvironment(),
    private readonly createSharedClient: SharedClientFactory = (url) => new MultiplayerClient<unknown, CatActions>(url, "cat-hangout"),
  ) { this.endpoint = endpoint; }

  subscribe(listener: Listener) { this.listeners.add(listener); listener(this.state); return () => this.listeners.delete(listener); }

  connect() {
    if (this.shared) { void this.shared.connect(); return; }
    const shared = this.createSharedClient(this.endpoint);
    this.shared = shared;
    shared.subscribe((state) => this.receiveShared(shared, state as SharedState));
    void shared.connect();
  }

  retryNow() {
    void this.shared?.connect();
  }

  move(x: number, z: number) { if (this.state.status === "connected") this.shared?.send("move", { x, z }); }

  interact() { if (this.state.status === "connected") this.shared?.send("interact"); }

  disconnect() {
    this.shared?.disconnect(); this.shared = undefined;
  }

  private emit() { for (const listener of this.listeners) listener(this.state); }

  private setState(next: CatHangoutConnection) { this.state = next; this.emit(); }

  private receiveShared(shared: MultiplayerClient<unknown, CatActions>, state: SharedState) {
    if (shared !== this.shared) return;
    const snapshot = state.cats ? { capacity: state.capacity, players: state.players as ServerCat[], cats: state.cats } : this.state.snapshot;
    const status = state.status === "ended" ? "expired" : state.status === "offline" ? "disconnected" : state.status;
    this.setState({ status: status as CatHangoutConnection["status"], snapshot, sessionId: state.sessionId, error: state.error });
  }
}

export function getRecoveryStatus(message: string): Extract<CatHangoutConnection["status"], "full" | "expired" | "disconnected" | "reconnecting"> {
  const normalized = message.toLowerCase();
  if (normalized.includes("full") || normalized.includes("capacity")) return "full";
  if (normalized.includes("expired") || normalized.includes("reservation")) return "expired";
  if (normalized.includes("disconnect") || normalized.includes("interrupted")) return "disconnected";
  return "reconnecting";
}

