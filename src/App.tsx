import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  CircleHelp,
  Footprints,
  Heart,
  Leaf,
  Lightbulb,
  Maximize2,
  RotateCcw,
  Rocket,
  Sparkles,
  Sprout,
  Star,
  Trees,
  Trophy,
  Volume2,
  VolumeX,
  Waves,
  X,
} from "lucide-react";
import OfflineNotice from "./OfflineNotice";
import { Animal, Scenery, Treat } from "./Artwork";
import type { Character, Theme } from "./Artwork";
import { generateMaze, neighbor, solve } from "./game/maze";
import type { Maze } from "./game/maze";

const difficulties = [
  { size: 4, name: "小小探索", detail: "4 × 4", label: "简单", icon: Sprout },
  { size: 6, name: "勇敢出发", detail: "6 × 6", label: "中等", icon: Trees },
  { size: 8, name: "迷宫高手", detail: "8 × 8", label: "挑战", icon: Rocket },
];
const themes: { id: Theme; name: string; icon: typeof Leaf; note: string }[] = [
  { id: "forest", name: "奇妙森林", icon: Trees, note: "在绿意里，发现小惊喜" },
  {
    id: "ocean",
    name: "蓝色海洋",
    icon: Waves,
    note: "跟着泡泡，开启海底冒险",
  },
  {
    id: "space",
    name: "梦幻星空",
    icon: Sparkles,
    note: "向着星光，探索未知世界",
  },
];
const characters: {
  id: Character;
  name: string;
  treat: string;
  verb: string;
}[] = [
  { id: "bunny", name: "小兔米米", treat: "胡萝卜", verb: "找到" },
  { id: "cat", name: "小猫布丁", treat: "毛线球", verb: "找到" },
  { id: "bear", name: "小熊多多", treat: "蜂蜜", verb: "找到" },
  { id: "yiyi", name: "小牛伊一", treat: "蝴蝶", verb: "找到" },
];
type Game = {
  maze: Maze;
  position: number;
  trail: number[];
  steps: number;
  phase: "ready" | "playing" | "won";
};
const freshGame = (size: number): Game => ({
  maze: generateMaze(size),
  position: 0,
  trail: [0],
  steps: 0,
  phase: "ready",
});
function readSaved(key: string, fallback: number) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function MazeBoard({
  game,
  theme,
  character,
  hint,
  onPointerStart,
  svgRef,
}: {
  game: Game;
  theme: Theme;
  character: Character;
  hint: number[];
  onPointerStart: (event: React.PointerEvent<SVGSVGElement>) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  const { maze, position, trail } = game;
  const unit = 520 / maze.size;
  const center = (cell: number) => [
    100 + ((cell % maze.size) + 0.5) * unit,
    55 + (Math.floor(cell / maze.size) + 0.5) * unit,
  ];
  const points = (cells: number[]) =>
    cells.map((cell) => center(cell).join(",")).join(" ");
  const lines: [number, number, number, number][] = [];
  for (let cell = 0; cell < maze.size * maze.size; cell++) {
    const x = 100 + (cell % maze.size) * unit,
      y = 55 + Math.floor(cell / maze.size) * unit;
    if (maze.walls[cell] & 1) lines.push([x, y, x + unit, y]);
    if (maze.walls[cell] & 8) lines.push([x, y, x, y + unit]);
    if (Math.floor(cell / maze.size) === maze.size - 1 && maze.walls[cell] & 4)
      lines.push([x, y + unit, x + unit, y + unit]);
    if (cell % maze.size === maze.size - 1 && maze.walls[cell] & 2)
      lines.push([x + unit, y, x + unit, y + unit]);
  }
  const path = lines
    .map(([x1, y1, x2, y2]) => `M${x1} ${y1}L${x2} ${y2}`)
    .join("");
  const [px, py] = center(position),
    [gx, gy] = center(maze.size ** 2 - 1);
  const animalSize = Math.min(77, unit * 0.78);
  return (
    <svg
      ref={svgRef}
      className="maze-svg"
      data-testid="maze"
      data-position={position}
      data-size={maze.size}
      viewBox="0 0 720 640"
      role="group"
      aria-label={`${maze.size}乘${maze.size}迷宫，使用方向键或拖动小动物前进`}
      onPointerDown={onPointerStart}
    >
      <defs>
        <pattern
          id="floor-dots"
          width="27"
          height="27"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="8" cy="9" r="1.2" fill="currentColor" opacity=".12" />
        </pattern>
        <filter id="hedge-shadow" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="3" stdDeviation="1" floodOpacity=".12" />
        </filter>
      </defs>
      <Scenery theme={theme} />
      <rect
        x="92"
        y="50"
        width="536"
        height="533"
        rx="15"
        className="maze-foundation"
      />
      <rect
        x="100"
        y="55"
        width="520"
        height="520"
        rx="8"
        className="maze-floor"
      />
      <rect
        x="100"
        y="55"
        width="520"
        height="520"
        rx="8"
        fill="url(#floor-dots)"
      />
      <circle
        cx={center(0)[0]}
        cy={center(0)[1]}
        r={unit * 0.29}
        className="start-circle"
      />
      <circle cx={gx} cy={gy} r={unit * 0.32} className="goal-circle" />
      {trail.length > 1 && (
        <polyline
          points={points(trail)}
          fill="none"
          className="trail"
          strokeWidth={Math.min(8, unit * 0.1)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 13"
        />
      )}
      {hint.length > 1 && (
        <polyline
          points={points(hint)}
          fill="none"
          className="hint-line"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 14"
        />
      )}
      <path
        d={path}
        className="hedge-shadow"
        strokeWidth="13"
        strokeLinecap="round"
        filter="url(#hedge-shadow)"
      />
      <path d={path} className="hedge" strokeWidth="8" strokeLinecap="round" />
      <g
        transform={`translate(${gx - animalSize / 2}, ${gy - animalSize / 2})`}
      >
        <svg width={animalSize} height={animalSize}>
          <Treat kind={character} />
        </svg>
      </g>
      <g
        data-testid="player"
        className="player"
        transform={`translate(${px - animalSize / 2}, ${py - animalSize / 2})`}
      >
        <ellipse
          cx={animalSize / 2}
          cy={animalSize * 0.92}
          rx={animalSize * 0.31}
          ry={animalSize * 0.06}
          fill="#53603b"
          opacity=".13"
        />
        <svg width={animalSize} height={animalSize}>
          <Animal kind={character} />
        </svg>
      </g>
      <text x={center(0)[0]} y="35" textAnchor="middle" className="map-label">
        从这里出发
      </text>
      <text x={gx} y="603" textAnchor="middle" className="map-label">
        美味在等你！
      </text>
    </svg>
  );
}

export default function App() {
  const [size, setSize] = useState(4);
  const [theme, setTheme] = useState<Theme>("forest");
  const [character, setCharacter] = useState<Character>("bunny");
  const [game, setGame] = useState<Game>(() => freshGame(4));
  const gameRef = useRef(game);
  const [hint, setHint] = useState<number[]>([]);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sound, setSound] = useState(
    () => readSaved("little-maze-muted", 0) !== 1,
  );
  const soundRef = useRef(sound);
  const audioRef = useRef<AudioContext | null>(null);
  const [completed, setCompleted] = useState(() =>
    readSaved("little-maze-completed", 0),
  );
  const completedRef = useRef(completed);
  const [showWin, setShowWin] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDialogElement>(null);
  const helpRef = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const critter = characters.find((c) => c.id === character)!;
  const landscape = themes.find((t) => t.id === theme)!;
  const difficulty = difficulties.find((d) => d.size === size)!;

  function commit(next: Game) {
    gameRef.current = next;
    setGame(next);
  }
  const tone = useCallback((win = false) => {
    if (!soundRef.current) return;
    try {
      const ctx = (audioRef.current ??= new AudioContext());
      void ctx.resume().catch(() => {});
      const notes = win ? [523.25, 659.25, 783.99, 1046.5] : [440];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator(),
          gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.13;
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(win ? 0.07 : 0.025, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.16);
      });
    } catch {
      /* Sound is optional when audio is unavailable. */
    }
  }, []);
  const move = useCallback(
    (direction: number) => {
      const current = gameRef.current;
      if (current.phase === "won") return;
      const position = neighbor(current.maze, current.position, direction);
      if (position === null) return;
      const previous = current.trail.indexOf(position);
      const trail =
        previous === -1
          ? [...current.trail, position]
          : current.trail.slice(0, previous + 1);
      const won = position === current.maze.size ** 2 - 1;
      commit({
        ...current,
        position,
        trail,
        steps: current.steps + 1,
        phase: won ? "won" : "playing",
      });
      setHint([]);
      if (won) {
        drag.current = null;
        const total = completedRef.current + 1;
        completedRef.current = total;
        setCompleted(total);
        try {
          localStorage.setItem("little-maze-completed", String(total));
        } catch {
          /* Play still works without storage. */
        }
        setShowWin(true);
      }
      tone(won);
    },
    [tone],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        winRef.current?.open ||
        helpRef.current?.open ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      if (
        event.target instanceof HTMLElement &&
        event.target.matches("input, textarea, select")
      )
        return;
      const direction = (
        {
          ArrowUp: 0,
          ArrowRight: 1,
          ArrowDown: 2,
          ArrowLeft: 3,
          w: 0,
          d: 1,
          s: 2,
          a: 3,
        } as Record<string, number>
      )[event.key];
      if (direction !== undefined) {
        event.preventDefault();
        move(direction);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);
  useEffect(() => {
    const dialog = winRef.current;
    if (showWin && dialog && !dialog.open) dialog.showModal();
    if (!showWin && dialog?.open) dialog.close();
  }, [showWin]);
  useEffect(() => {
    const dialog = helpRef.current;
    if (showHelp && dialog && !dialog.open) dialog.showModal();
    if (!showHelp && dialog?.open) dialog.close();
  }, [showHelp]);
  useEffect(
    () => () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      void audioRef.current?.close();
    },
    [],
  );

  function flash(message: string) {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 2600);
  }
  function newGame(nextSize = size, start = false) {
    drag.current = null;
    const next = freshGame(nextSize);
    if (start) next.phase = "playing";
    commit(next);
    setHint([]);
    setShowWin(false);
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }
  function start() {
    if (game.phase === "ready") commit({ ...game, phase: "playing" });
    else newGame(size, true);
    boardRef.current?.focus({ preventScroll: true });
    if (window.matchMedia("(max-width: 760px)").matches)
      boardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function showHint() {
    if (game.phase === "won") {
      flash("你已经找到宝藏啦，再来一局吧！");
      return;
    }
    setHint(solve(game.maze, game.position).slice(0, 4));
    flash("跟着金色的小光点，试着向前走吧！");
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint([]), 3500);
  }
  function point(event: { clientX: number; clientY: number }) {
    const matrix = svgRef.current?.getScreenCTM();
    return matrix
      ? new DOMPoint(event.clientX, event.clientY).matrixTransform(
          matrix.inverse(),
        )
      : null;
  }
  function pointerStart(event: React.PointerEvent<SVGSVGElement>) {
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      gameRef.current.phase === "won"
    )
      return;
    const p = point(event);
    if (!p) return;
    const current = gameRef.current,
      unit = 520 / current.maze.size;
    const cx = 100 + ((current.position % current.maze.size) + 0.5) * unit;
    const cy =
      55 + (Math.floor(current.position / current.maze.size) + 0.5) * unit;
    if (Math.hypot(p.x - cx, p.y - cy) > unit * 0.62) {
      flash("先按住小动物，再带它一起走吧！");
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    boardRef.current?.focus({ preventScroll: true });
    drag.current = { id: event.pointerId, x: p.x, y: p.y };
  }
  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const previous = drag.current;
    if (!previous || previous.id !== event.pointerId) return;
    const p = point(event);
    if (!p) return;
    const unit = 520 / gameRef.current.maze.size;
    const distance = Math.hypot(p.x - previous.x, p.y - previous.y);
    const samples = Math.min(
      150,
      Math.max(1, Math.ceil(distance / (unit / 5))),
    );
    // Sample the entire pointer segment so quick drags cannot skip a cell or tunnel through walls.
    for (let i = 1; i <= samples; i++) {
      if (gameRef.current.phase === "won") break;
      const x = previous.x + ((p.x - previous.x) * i) / samples;
      const y = previous.y + ((p.y - previous.y) * i) / samples;
      if (x < 100 || x >= 620 || y < 55 || y >= 575) continue;
      const col = Math.floor((x - 100) / unit),
        row = Math.floor((y - 55) / unit);
      const current = gameRef.current.position;
      const dr = row - Math.floor(current / gameRef.current.maze.size),
        dc = col - (current % gameRef.current.maze.size);
      if (Math.abs(dr) + Math.abs(dc) === 1)
        move(dr === -1 ? 0 : dc === 1 ? 1 : dr === 1 ? 2 : 3);
    }
    if (drag.current) drag.current = { id: event.pointerId, x: p.x, y: p.y };
  }
  function toggleSound() {
    const next = !sound;
    setSound(next);
    soundRef.current = next;
    try {
      localStorage.setItem("little-maze-muted", next ? "0" : "1");
    } catch {
      /* Optional setting persistence. */
    }
    if (next) tone();
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (boardRef.current?.requestFullscreen)
        await boardRef.current.requestFullscreen();
      else flash("转动手机横屏，也能获得更大的游戏画面哦");
    } catch {
      flash("当前浏览器暂不支持全屏，可以直接在这里玩哦");
    }
  }
  const cellPosition = {
    row: Math.floor(game.position / size) + 1,
    col: (game.position % size) + 1,
  };

  return (
    <div className={`app theme-${theme}`}>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#" aria-label="迷路小森林首页">
            <span className="brand-icon">
              <Animal />
            </span>
            <span>
              迷路<span className="brand-accent">小森林</span>
              <small>LITTLE MAZE, BIG ADVENTURE</small>
            </span>
          </a>
          <div className="header-actions">
            <span className="collection">
              <Star size={17} fill="currentColor" /> 我的星星{" "}
              <strong>{completed * 3}</strong>
            </span>
            <span className="header-divider" />
            <button
              className="icon-button"
              onClick={toggleSound}
              aria-label={sound ? "关闭音效" : "开启音效"}
              aria-pressed={sound}
            >
              {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button className="help-button" onClick={() => setShowHelp(true)}>
              <CircleHelp size={18} />
              <span>怎么玩</span>
            </button>
          </div>
        </div>
      </header>

      <main className="main-shell">
        <OfflineNotice />
        <section className="intro">
          <div>
            <div className="eyebrow">
              <span /> 每一次转弯，都是新发现
            </div>
            <h1>
              小小迷宫，大大冒险<span className="title-sparkle">✦</span>
            </h1>
            <p>带上好奇心，和小伙伴一起找到藏在终点的惊喜。</p>
          </div>
          <div className="journey" aria-label="冒险步骤">
            <span className="journey-active">
              <b>1</b>选一选
            </span>
            <ChevronRight />
            <span className={game.phase !== "ready" ? "journey-active" : ""}>
              <b>2</b>走迷宫
            </span>
            <ChevronRight />
            <span className={game.phase === "won" ? "journey-active" : ""}>
              <b>3</b>收获快乐
            </span>
          </div>
        </section>

        <div className="play-layout">
          <aside className="settings-card" aria-label="冒险设置">
            <div className="settings-heading">
              <span className="tiny-leaf">
                <Leaf size={19} />
              </span>
              <h2>准备好出发了吗？</h2>
            </div>
            <section className="setting-section">
              <div className="section-label">
                <span className="section-number">01</span>
                <h3>选一个难度</h3>
                <span className="subtle">慢慢来，也很棒</span>
              </div>
              <div className="difficulty-list">
                {difficulties.map((d) => (
                  <button
                    key={d.size}
                    className={`difficulty-option ${size === d.size ? "selected" : ""}`}
                    aria-pressed={size === d.size}
                    onClick={() => {
                      if (size !== d.size) {
                        setSize(d.size);
                        newGame(d.size);
                      }
                    }}
                  >
                    <span className="difficulty-icon">
                      <d.icon size={23} strokeWidth={1.7} />
                    </span>
                    <span className="difficulty-name">
                      {d.name}
                      <small>{d.detail} 格迷宫</small>
                    </span>
                    <span className="level-tag">{d.label}</span>
                    <span className="radio-mark">
                      {size === d.size && <Check size={11} strokeWidth={3} />}
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <section className="setting-section">
              <div className="section-label">
                <span className="section-number">02</span>
                <h3>想去哪里玩？</h3>
              </div>
              <div className="theme-options">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    className={`theme-option theme-tile-${t.id} ${theme === t.id ? "selected" : ""}`}
                    aria-pressed={theme === t.id}
                    onClick={() => setTheme(t.id)}
                  >
                    <span className="theme-illustration">
                      <t.icon size={30} strokeWidth={1.5} />
                      <i />
                      <i />
                    </span>
                    <span>{t.name}</span>
                    {theme === t.id && (
                      <span className="tile-check">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
            <section className="setting-section character-section">
              <div className="section-label">
                <span className="section-number">03</span>
                <h3>谁是你的小伙伴？</h3>
              </div>
              <div className="character-options">
                {characters.map((c) => (
                  <button
                    key={c.id}
                    className={`character-option ${character === c.id ? "selected" : ""}`}
                    aria-label={c.name}
                    aria-pressed={character === c.id}
                    onClick={() => setCharacter(c.id)}
                  >
                    <span className="character-portrait">
                      <Animal kind={c.id} />
                      {character === c.id && (
                        <span className="tile-check">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </section>
            <button className="start-button" onClick={start}>
              <span>
                {game.phase === "ready"
                  ? "开始冒险"
                  : game.phase === "won"
                    ? "再来一局"
                    : "开启新冒险"}
              </span>
              <ArrowRight size={20} />
            </button>
            <p className="settings-footnote">
              <Heart size={12} /> 不用着急，按自己的节奏来
            </p>
          </aside>

          <section
            className="game-card"
            ref={boardRef}
            tabIndex={-1}
            aria-label="迷宫游戏区"
            onPointerMove={pointerMove}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onLostPointerCapture={() => {
              drag.current = null;
            }}
          >
            <div className="game-topbar">
              <div className="game-theme-heading">
                <span className="game-theme-icon">
                  <landscape.icon size={21} />
                </span>
                <div>
                  <h2>
                    {landscape.name}
                    <span className="game-difficulty">{difficulty.label}</span>
                  </h2>
                  <p>{landscape.note}</p>
                </div>
              </div>
              <div className="game-tools">
                <button
                  className="icon-button"
                  aria-label="重新开始当前迷宫"
                  title="重新开始"
                  onClick={() => {
                    commit({
                      ...game,
                      position: 0,
                      trail: [0],
                      steps: 0,
                      phase: "ready",
                    });
                    setHint([]);
                    flash("回到起点啦，再试一次吧！");
                  }}
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  className="icon-button fullscreen-button"
                  aria-label="全屏游戏"
                  title="全屏游戏"
                  onClick={fullscreen}
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>
            <div className="board-scene">
              <div className="mission">
                <span>
                  <Animal kind={character} />
                </span>
                <p>
                  帮<strong>{critter.name}</strong>
                  {critter.verb}
                  <strong>{critter.treat}</strong>吧！
                </p>
                <Treat kind={character} />
              </div>
              <MazeBoard
                game={game}
                theme={theme}
                character={character}
                hint={hint}
                onPointerStart={pointerStart}
                svgRef={svgRef}
              />
              <div className="scene-caption">
                <span className="caption-dot" />
                {game.phase === "won"
                  ? "找到啦！你是了不起的小小探险家"
                  : game.steps === 0
                    ? "按住小伙伴，沿着小路慢慢走"
                    : "走过的路会留下足迹，继续探索吧"}
              </div>
            </div>
            <div className="game-bottom-bar">
              <div className="movement-status">
                <Footprints size={18} />
                <span>
                  已走 <strong>{game.steps}</strong> 步
                </span>
              </div>
              <div className="keyboard-tip">
                <span>↑</span>
                <span>↓</span>
                <span>←</span>
                <span>→</span>
                <small>方向键也可以玩</small>
              </div>
              <button className="hint-button" onClick={showHint}>
                <Lightbulb size={17} /> 给我一点提示
              </button>
            </div>
            <div className="touch-controls" aria-label="方向按钮">
              <button aria-label="向左走" onClick={() => move(3)}>
                <ArrowLeft />
              </button>
              <div>
                <button aria-label="向上走" onClick={() => move(0)}>
                  <ArrowUp />
                </button>
                <button aria-label="向下走" onClick={() => move(2)}>
                  <ArrowDown />
                </button>
              </div>
              <button aria-label="向右走" onClick={() => move(1)}>
                <ArrowRight />
              </button>
              <p>
                也可以点方向按钮
                <br />
                带小伙伴前进哦
              </p>
            </div>
            <span className="sr-only" role="status" aria-live="polite">
              {game.phase === "won"
                ? `通关成功！用了${game.steps}步，获得三颗星星。`
                : `小动物在第${cellPosition.row}行，第${cellPosition.col}列。已走${game.steps}步。`}
            </span>
          </section>
        </div>

        <section className="gentle-notes" aria-label="游戏特色">
          <div>
            <span className="note-icon">
              <Sprout size={21} />
            </span>
            <p>
              <strong>让好奇心带路</strong>
              <span>在探索中，练习观察与思考</span>
            </p>
          </div>
          <div>
            <span className="note-icon">
              <Heart size={20} />
            </span>
            <p>
              <strong>每一步都值得鼓励</strong>
              <span>没有倒计时，也没有失败</span>
            </p>
          </div>
          <div>
            <span className="note-icon">
              <Sparkles size={21} />
            </span>
            <p>
              <strong>每一次都是新冒险</strong>
              <span>随机生成，总有新的小惊喜</span>
            </p>
          </div>
        </section>
        <footer className="site-footer">
          <span>
            <Leaf size={13} /> 为小小探险家，留一片自由探索的森林
          </span>
          <span>适合 3–6 岁 · 亲子陪伴更有趣</span>
        </footer>
      </main>

      {notice && (
        <div className="toast" role="status">
          <Lightbulb size={18} />
          {notice}
        </div>
      )}
      <dialog
        ref={helpRef}
        className="help-dialog"
        onCancel={() => setShowHelp(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowHelp(false);
        }}
      >
        <button
          className="modal-close icon-button"
          onClick={() => setShowHelp(false)}
          aria-label="关闭玩法说明"
        >
          <X />
        </button>
        <span className="modal-symbol">
          <Leaf size={31} />
        </span>
        <h2>一起出发，探索迷宫！</h2>
        <p className="modal-subtitle">没有时间限制，慢慢找也没关系。</p>
        <ol className="help-steps">
          <li>
            <b>1</b>
            <p>
              <strong>选好你的冒险</strong>
              <span>挑一个难度、喜欢的场景和小动物。</span>
            </p>
          </li>
          <li>
            <b>2</b>
            <p>
              <strong>带着小伙伴走</strong>
              <span>
                按住小动物，沿小路拖动；也可以使用键盘方向键或页面下方的方向按钮。松手后可以接着走。
              </span>
            </p>
          </li>
          <li>
            <b>3</b>
            <p>
              <strong>找到终点的惊喜</strong>
              <span>
                带它找到心爱的宝藏，就能收获三颗星星。遇到岔路，点一下“给我一点提示”试试。
              </span>
            </p>
          </li>
        </ol>
        <button className="start-button" onClick={() => setShowHelp(false)}>
          我知道啦 <ArrowRight size={18} />
        </button>
      </dialog>
      <dialog
        ref={winRef}
        className="win-dialog"
        onCancel={() => setShowWin(false)}
      >
        <button
          className="modal-close icon-button"
          onClick={() => setShowWin(false)}
          aria-label="关闭通关庆祝"
        >
          <X />
        </button>
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 16 }, (_, i) => (
            <i key={i} style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>
        <div className="win-stars">
          <Star fill="currentColor" />
          <Star fill="currentColor" />
          <Star fill="currentColor" />
        </div>
        <div className="win-character">
          <Animal kind={character} />
          <Treat kind={character} />
        </div>
        <span className="win-eyebrow">冒险成功 · 做得真棒</span>
        <h2>找到{critter.treat}啦！</h2>
        <p>
          谢谢你，带{critter.name}找到了宝藏。
          <br />
          每一次尝试，都让你更勇敢一点。
        </p>
        <div className="win-reward">
          <Trophy size={18} /> 完成一次冒险{" "}
          <span>
            + 3 <Star size={15} fill="currentColor" />
          </span>
        </div>
        <button
          className="start-button"
          autoFocus
          onClick={() => {
            newGame(size, true);
            boardRef.current?.focus({ preventScroll: true });
          }}
        >
          再来一次冒险 <ArrowRight size={18} />
        </button>
        <button
          className="secondary-button"
          onClick={() => {
            setShowWin(false);
            document
              .querySelector(".settings-card")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          换个小伙伴试试
        </button>
      </dialog>
    </div>
  );
}
