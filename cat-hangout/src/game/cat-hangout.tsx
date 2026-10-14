import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { updateBotCat, updateHumanCat } from "./cat-state.ts";
import { createRoomCats, type Cat } from "./room.ts";

const WORLD_WIDTH = 640;
const WORLD_HEIGHT = 360;
const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

export function CatHangout() {
  const [cats, setCats] = useState(() => createRoomCats(1));
  const [paused, setPaused] = useState(false);
  const keys = useRef(new Set<string>());
  const touchInput = useRef({ x: 0, y: 0 });
  const interaction = useRef(false);
  const catsRef = useRef(cats); catsRef.current = cats;

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
        interaction.current = false;
        setCats((current) => current.map((cat) => {
          const next = cat.kind === "human" ? updateHumanCat(cat, input, Math.random()) : updateBotCat(cat, Math.random());
          return { ...next, x: clamp(next.x, 24, WORLD_WIDTH - 24), y: clamp(next.y, 36, WORLD_HEIGHT - 32) };
        }));
        last = time;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [paused]);

  const roster = useMemo(() => [...cats].sort((a, b) => a.number - b.number), [cats]);
  const setStick = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    touchInput.current = { x: clamp((event.clientX - rect.left - rect.width / 2) / (rect.width / 2), -1, 1), y: clamp((event.clientY - rect.top - rect.height / 2) / (rect.height / 2), -1, 1) };
  };

  return <section className="cat_hangout" aria-label="Cat Hangout game">
    <div className="cat_world" style={{ aspectRatio: `${WORLD_WIDTH}/${WORLD_HEIGHT}` }}>
      <div className="world_sign">Cat Hangout<br /><small>Everyone is welcome</small></div>
      <div className="world_prop world_tree" aria-hidden="true">🌳</div><div className="world_prop world_box" aria-hidden="true">📦</div><div className="world_prop world_food" aria-hidden="true">🍜</div>
      {cats.map((cat) => <div className={`cat_sprite ${cat.kind} cat_${cat.activity}`} key={cat.id} style={{ left: `${(cat.x / WORLD_WIDTH) * 100}%`, top: `${(cat.y / WORLD_HEIGHT) * 100}%`, "--cat-color": cat.color } as CSSProperties}>
        <img src="assets/catmega/mochi-idle.png" alt="" /><span className="cat_label" style={{ backgroundColor: cat.color }}>{cat.number}. {cat.name}{cat.kind === "bot" ? " · bot" : ""}</span><span className="cat_activity">{cat.activity}</span>
      </div>)}
      {paused && <div className="pause_banner">Paused</div>}
      <button className="pause_button" type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button>
      <aside className="cat_roster" aria-label="Players"><strong>Room · {roster.length} cats</strong>{roster.map((cat) => <span key={cat.id}><i style={{ backgroundColor: cat.color }} />{cat.number}. {cat.name}{cat.kind === "bot" ? " (bot)" : ""}</span>)}</aside>
      <div className="touch_controls"><div className="virtual_stick" onPointerDown={setStick} onPointerMove={(event) => { if (event.buttons) setStick(event); }} onPointerUp={() => { touchInput.current = { x: 0, y: 0 }; }}><b>Move</b></div><button className="action_button" type="button" onPointerDown={() => { interaction.current = true; }}>Space<br />Play</button></div>
    </div>
  </section>;
}
