import { useId } from "react";
import yiyiAvatar from "./assets/yiyi-avatar.png";

export type Character = "bunny" | "cat" | "bear" | "yiyi";
export type Theme = "forest" | "ocean" | "space";

export function Animal({
  kind = "bunny",
  className = "",
}: {
  kind?: Character;
  className?: string;
}) {
  const clipId = `yiyi-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (kind === "yiyi") {
    return (
      <svg
        className={className}
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
        data-character="yiyi"
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r="44" />
          </clipPath>
        </defs>
        <circle cx="50" cy="50" r="48" fill="#fff9ed" />
        <image
          href={yiyiAvatar}
          x="6"
          y="6"
          width="88"
          height="88"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
          pointerEvents="none"
        />
        <circle cx="50" cy="50" r="45" stroke="#c99b9c" strokeWidth="2.5" />
      </svg>
    );
  }
  const color = {
    bunny: "#fff9ed",
    cat: "#f5bf78",
    bear: "#bc906d",
  }[kind];
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      {kind === "bunny" && (
        <>
          <path
            d="M30 48C16 25 19 4 29 5c11 1 13 28 14 40M58 45C59 21 65 2 75 6c10 5 1 31-9 44"
            fill={color}
            stroke="#675842"
            strokeWidth="2.5"
          />
          <path
            d="M30 37c-6-13-5-23-2-23s7 13 7 23M65 36c2-13 6-21 8-20s-1 14-4 23"
            stroke="#edb4a8"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "cat" && (
        <path
          d="m19 50-1-32 27 17h11l26-17-1 34"
          fill={color}
          stroke="#675842"
          strokeWidth="2.5"
        />
      )}
      {kind === "bear" && (
        <>
          <circle
            cx="23"
            cy="34"
            r="17"
            fill={color}
            stroke="#675842"
            strokeWidth="2.5"
          />
          <circle
            cx="77"
            cy="34"
            r="17"
            fill={color}
            stroke="#675842"
            strokeWidth="2.5"
          />
          <circle cx="23" cy="34" r="9" fill="#dfb99a" />
          <circle cx="77" cy="34" r="9" fill="#dfb99a" />
        </>
      )}

      <ellipse
        cx="50"
        cy="62"
        rx="37"
        ry="30"
        fill={color}
        stroke="#675842"
        strokeWidth="2.5"
      />
      {kind === "cat" && (
        <>
          <path
            d="m40 34 3 10m8-10v9m9-9-3 10"
            stroke="#d79552"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="m8 62 16 3M8 72l16-2m52-5 16-3M76 70l16 2"
            stroke="#675842"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "bear" && (
        <ellipse cx="50" cy="73" rx="17" ry="12" fill="#eed7b7" />
      )}
      <ellipse cx="29" cy="70" rx="7" ry="4" fill="#eab2a0" opacity=".7" />
      <ellipse cx="71" cy="70" rx="7" ry="4" fill="#eab2a0" opacity=".7" />
      <ellipse cx="36" cy="58" rx="3" ry="4" fill="#463f34" />
      <ellipse cx="64" cy="58" rx="3" ry="4" fill="#463f34" />
      <path
        d="m46 69 4 4 4-4M50 73v4m-7 0q4 4 7 0 3 4 7 0"
        stroke="#675842"
        strokeWidth="2"
        fill="#d99b91"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Treat({
  kind,
  className = "",
}: {
  kind: Character;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {kind === "bunny" && (
        <>
          <path
            d="M57 37C28 25 24 71 17 88c21-4 62-25 48-44"
            fill="#f2a14d"
            stroke="#b5783d"
            strokeWidth="3"
          />
          <path
            d="m56 41 0-24q10-8 10 4l-5 19M62 42l13-24q12-3 7 9L66 44m0 0 21-11q12 3 1 10l-20 5"
            fill="#82a961"
            stroke="#60834b"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="m35 49 9 6m-17 7 9 5m10-31 7 6"
            stroke="#d68c3e"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "cat" && (
        <>
          <circle
            cx="49"
            cy="54"
            r="30"
            fill="#d2a6d6"
            stroke="#98729e"
            strokeWidth="3"
          />
          <path
            d="M24 40q36-4 48 23M21 53q30-5 47 20M35 27q-5 36 22 56M50 26q-7 26 29 28M20 63C-3 79 17 97 37 86"
            stroke="#f5dcf1"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "bear" && (
        <>
          <path
            d="M30 41h42l8 39q-27 16-56 0z"
            fill="#e8b657"
            stroke="#b58c3f"
            strokeWidth="3"
          />
          <rect x="28" y="31" width="47" height="14" rx="5" fill="#b8926b" />
          <path d="M39 60h24v18H39z" fill="#fff3c7" />
          <path d="m45 67 6-5 6 5-6 6z" fill="#daa149" />
        </>
      )}
      {kind === "yiyi" && (
        <>
          <path
            d="M43 42q-24-32-32-9-4 17 32 14M57 42q24-32 32-9 4 17-32 14"
            fill="#f8d6b0"
            stroke="#ca9d79"
            strokeWidth="3"
          />
          <path
            d="M50 46C35 4 17 2 17 20c0 19 30 29 33 26M50 46C65 4 83 2 83 20c0 19-30 29-33 26"
            fill="#efb47b"
            stroke="#ca9d79"
            strokeWidth="3"
          />
          <path
            d="M50 36v37m0-36-7-10m7 10 7-10"
            stroke="#7f8060"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

function Tree({
  x,
  y,
  scale = 1,
  light = false,
}: {
  x: number;
  y: number;
  scale?: number;
  light?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M0 24v34"
        stroke="#a59671"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M-25 30Q-38 10-17 0q-4-27 17-27T17 0q25 6 13 26-9 14-30 9-17 9-25-5"
        fill={light ? "#b7c997" : "#91ad7c"}
      />
      <path
        d="M0 14v26m0-12-12-9M0 20 12 9"
        stroke={light ? "#9fb583" : "#7e9d6c"}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
}

export function Scenery({ theme }: { theme: Theme }) {
  return (
    <g className="scenery" aria-hidden="true">
      {theme === "forest" && (
        <>
          <path
            d="M-1000 550Q-500 480 0 535T350 560t370-20 1000 20v110H-1000"
            fill="#dbe5c9"
          />
          <path
            d="M-1000 605q500-48 1000-20t360 0 360 0 1000 0v80H-1000"
            fill="#d0dfba"
          />
          <Tree x={50} y={152} scale={1.15} />
          <Tree x={669} y={112} scale={0.8} light />
          <Tree x={51} y={426} scale={0.8} light />
          <Tree x={670} y={402} scale={1.1} />
          <Tree x={58} y={555} scale={1.3} />
          <Tree x={649} y={568} scale={1.05} light />
          <g transform="translate(41 270)">
            <path d="M0 14v18m21-18v18" stroke="#d4b68d" strokeWidth="7" />
            <path d="M-13 15q12-31 27 0M9 16q12-28 25 0" fill="#d68e73" />
            <circle cx="-2" cy="7" r="2.5" fill="#fdf7df" />
            <circle cx="21" cy="8" r="2" fill="#fdf7df" />
          </g>
          {[
            [35, 355],
            [665, 245],
            [643, 480],
            [77, 600],
            [594, 608],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <path
                d="M0 0v12m0-4-6-4m6 4 5-5"
                stroke="#8da675"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cy="-3" r="5" fill={i % 2 ? "#edc96d" : "#f5e2b4"} />
            </g>
          ))}
          <path
            d="M288 614q9-16 18 0m-2 0q9-16 18 0"
            stroke="#9ab57f"
            strokeWidth="3"
            fill="none"
          />
        </>
      )}
      {theme === "ocean" && (
        <>
          <path
            d="M-1000 550q500-35 1000-20t180 0 180 0 180 0 180 0 1000 0v110H-1000"
            fill="#cce5e1"
          />
          <path
            d="M-1000 606q500-30 1000-15t310 5 410-5 1000 5v65H-1000"
            fill="#e6d8b7"
          />
          {[
            [42, 170, 16],
            [660, 110, 22],
            [55, 350, 9],
            [666, 320, 14],
            [52, 460, 20],
            [648, 492, 10],
          ].map(([x, y, r], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={r}
                fill="none"
                stroke="#b0d7d5"
                strokeWidth="3"
              />
              <path
                d={`M${x - r / 2} ${y - r / 2}l3-2`}
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          ))}
          {[45, 665].map((x, i) => (
            <g key={x} transform={`translate(${x} 587)`}>
              <path
                d="M0 0q-25-20-10-42t-4-40M12 0q30-30 10-50t8-43M-12 0q-30-20-20-46"
                stroke="#89b8a2"
                strokeWidth="9"
                fill="none"
                strokeLinecap="round"
              />
              <ellipse cx="0" cy="5" rx="37" ry="10" fill="#d5c6a6" />
            </g>
          ))}
          <path
            d="m670 215 6 12 14 1-10 10 3 14-13-7-13 7 3-14-10-10 14-1z"
            fill="#efbd92"
          />
          <g transform="translate(62 73)">
            <ellipse rx="19" ry="10" fill="#f0c38c" />
            <path d="m-16 0-16-12v24z" fill="#e8af78" />
            <circle cx="10" cy="-2" r="2" fill="#80715a" />
          </g>
        </>
      )}
      {theme === "space" && (
        <>
          <path
            d="M-1000 592q500-30 1000-20t280 15 440-5 1000 5v70H-1000"
            fill="#ddd9ea"
          />
          {[
            [39, 90],
            [665, 76],
            [61, 230],
            [655, 307],
            [40, 478],
            [674, 550],
            [167, 609],
            [525, 610],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <path
                d="m0-9 3 6 6 3-6 3-3 6-3-6-6-3 6-3z"
                fill={i % 2 ? "#e8c87d" : "#bcb2d3"}
              />
            </g>
          ))}
          <g transform="translate(662 175) rotate(-25)">
            <circle r="23" fill="#c8b4cf" />
            <ellipse rx="36" ry="9" stroke="#e1c9aa" strokeWidth="7" />
            <path d="M-20-9q20-25 40 0" fill="#c8b4cf" />
          </g>
          <g transform="translate(48 378)">
            <circle r="24" fill="#e9d7a5" />
            <circle cx="-8" cy="-9" r="6" fill="#d8c594" />
            <circle cx="8" cy="10" r="8" fill="#d8c594" />
          </g>
          <ellipse cx="637" cy="608" rx="28" ry="7" fill="#c6c0d7" />
        </>
      )}
      <g opacity=".65" fill="white">
        <path d="M22 43q0-10 11-9 5-17 18-6 14-4 17 9 14 6 7 14H26q-8 0-4-8" />
        <path d="M609 42q0-10 11-9 5-17 18-6 14-4 17 9 14 6 7 14h-49q-8 0-4-8" />
      </g>
    </g>
  );
}
