import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { CatHangoutClient, type CatHangoutConnection, type ServerCat } from "./cat-hangout-client.ts";
import { predictPosition, reconcilePosition } from "./network-sync.ts";
import type { Cat, CatActivity } from "./room.ts";

const WORLD_WIDTH = 640;
const WORLD_HEIGHT = 360;
const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));
type Prediction = Readonly<{ id: string; x: number; z: number }>;

export function CatHangout() {
  const [connection, setConnection] = useState<CatHangoutConnection>({ status: "connecting", snapshot: null, sessionId: null, error: "" });
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [paused, setPaused] = useState(false);
  const keys = useRef(new Set<string>());
  const touchInput = useRef({ x: 0, y: 0 });
  const interaction = useRef(false);
  const client = useRef<CatHangoutClient | null>(null);

  useEffect(() => {
    const next = new CatHangoutClient();
    client.current = next;
    const unsubscribe = next.subscribe(setConnection);
    next.connect();
    return () => { unsubscribe(); next.disconnect(); };
  }, []);

  useEffect(() => {
    const authoritative = connection.snapshot?.cats.find((cat) => cat.id === connection.sessionId);
    if (!authoritative) { setPrediction(null); return; }
    setPrediction((current) => {
      if (!current || current.id !== authoritative.id) return { id: authoritative.id, x: authoritative.x, z: authoritative.z };
      const reconciled = reconcilePosition({ x: current.x, y: current.z }, { x: authoritative.x, y: authoritative.z }, 0.36);
      return { id: current.id, x: reconciled.x, z: reconciled.y };
    });
  }, [connection.sessionId, connection.snapshot]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", " "].includes(event.key.toLowerCase())) event.preventDefault();
      if (event.key === " ") interaction.current = true;
      else keys.current.add(event.key.toLowerCase());
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    let frame = 0; let last = 0;
    const tick = (time: number) => {
      if (time - last > 210 && !paused) {
        const key = keys.current;
        const input = { x: (key.has("d") || key.has("arrowright") ? 1 : 0) - (key.has("a") || key.has("arrowleft") ? 1 : 0) + touchInput.current.x, y: (key.has("s") || key.has("arrowdown") ? 1 : 0) - (key.has("w") || key.has("arrowup") ? 1 : 0) + touchInput.current.y, interact: interaction.current };
        if (input.x || input.y) {
          const x = clamp(input.x, -1, 1); const z = clamp(input.y, -1, 1);
          client.current?.move(x, z);
          const local = connection.snapshot?.cats.find((cat) => cat.id === connection.sessionId);
          setPrediction((current) => {
            const baseline = current?.id === connection.sessionId ? current : local && { id: local.id, x: local.x, z: local.z };
            if (!baseline) return current;
            const next = predictPosition({ x: baseline.x, y: baseline.z }, { x, y: z }, 0.002);
            return { id: baseline.id, x: next.x, z: next.y };
          });
        }
        if (input.interact) client.current?.interact();
        interaction.current = false;
        last = time;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [connection.sessionId, connection.snapshot, paused]);

  const cats = useMemo(() => (connection.snapshot?.cats ?? []).map((cat) => {
    const next = prediction?.id === cat.id ? { ...cat, x: prediction.x, z: prediction.z } : cat;
    return toDisplayCat(next);
  }), [connection.snapshot, prediction]);
  const roster = useMemo(() => [...cats].sort((a, b) => a.number - b.number), [cats]);
  const setStick = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    touchInput.current = { x: clamp((event.clientX - rect.left - rect.width / 2) / (rect.width / 2), -1, 1), y: clamp((event.clientY - rect.top - rect.height / 2) / (rect.height / 2), -1, 1) };
  };

  return <section className="cat_hangout" aria-label="Cat Hangout game">
    <div className="cat_world" style={{ aspectRatio: `${WORLD_WIDTH}/${WORLD_HEIGHT}` }}>
      <div className="world_sign">Cat Hangout<br /><small>{connection.status === "connected" ? "Everyone is welcome" : "Joining the shared room…"}</small></div>
      <div className="world_prop world_tree" aria-hidden="true">🌳</div><div className="world_prop world_box" aria-hidden="true">📦</div><div className="world_prop world_food" aria-hidden="true">🍜</div>
      {cats.map((cat) => <div className={`cat_sprite ${cat.kind} cat_${cat.activity}`} key={cat.id} style={{ left: `${(cat.x / WORLD_WIDTH) * 100}%`, top: `${(cat.y / WORLD_HEIGHT) * 100}%`, "--cat-color": cat.color } as CSSProperties}>
        <img src="assets/catmega/mochi-idle.png" alt="" /><span className="cat_label" style={{ backgroundColor: cat.color }}>{cat.number}. {cat.name}{cat.kind === "bot" ? " · bot" : ""}</span><span className="cat_activity">{cat.activity}</span>
      </div>)}
      {paused && <div className="pause_banner">Paused</div>}
      <button className="pause_button" type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button>
      <aside className="cat_roster" aria-label="Players"><strong>Room · {roster.length} cats</strong>{roster.map((cat) => <span key={cat.id}><i style={{ backgroundColor: cat.color }} />{cat.number}. {cat.name}{cat.kind === "bot" ? " (bot)" : ""}</span>)}</aside>
      {connection.error && <p className="connection_notice" role="status">{connection.error}</p>}
      <div className="touch_controls"><div className="virtual_stick" onPointerDown={setStick} onPointerMove={(event) => { if (event.buttons) setStick(event); }} onPointerUp={() => { touchInput.current = { x: 0, y: 0 }; }}><b>Move</b></div><button className="action_button" type="button" onPointerDown={() => { interaction.current = true; }}>Space<br />Play</button></div>
    </div>
  </section>;
}

function toDisplayCat(cat: ServerCat): Cat {
  const activities: Record<ServerCat["activity"], CatActivity> = { idle: "idle", wander: "walk", rest: "sleep", box: "box", food: "food", tree: "tree", social: "social" };
  return {
    id: cat.id, kind: cat.bot ? "bot" : "human", number: cat.number, name: cat.name, color: cat.color,
    activity: activities[cat.activity], x: clamp(((cat.x + 11) / 22) * (WORLD_WIDTH - 48) + 24, 24, WORLD_WIDTH - 24),
    y: clamp(((cat.z + 11) / 22) * (WORLD_HEIGHT - 68) + 36, 36, WORLD_HEIGHT - 32),
  };
}
