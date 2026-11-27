import React, { useState } from "react";

// ============================================
// SPLASH "CARTA CON SELLO"
// ============================================
// Pantalla de inicio con forma de sobre: foto de fondo lavada, enredaderas
// doradas a los costados, separadores con flor de lis, solapa de papel y un
// sello de lacre con las iniciales. Al tocar: el sello se parte, la solapa se
// abre hacia arriba y la carta se desvanece dejando ver la invitación.
//
// Las piezas (sello partido en dos mitades, enredaderas y separadores) salen
// de imágenes de la pareja (media.envelope en el config). Si alguna falta, se
// usa una versión dibujada con SVG en su lugar.

import type { EnvelopeArt } from "../config/types";

interface EnvelopeSplashProps {
  /** Imágenes del sello, enredaderas y separadores (media.envelope) */
  art?: EnvelopeArt;
  /** Foto de fondo (media.splash) */
  photo: string;
  couple: string;
  initials?: string;
  subtitle: string;
  dateText: string;
  /** Color del lacre (theme.primary) */
  sealColor: string;
  /** Se llama al tocar (para arrancar la música dentro del gesto del usuario) */
  onOpen: () => void;
  /** Se llama cuando termina la animación */
  onFinish: () => void;
}

/** Duración total de la animación de apertura (ms) */
const OPEN_DURATION = 2400;

/** Sombra suave para que el dorado de las imágenes se despegue del fondo */
const GOLD_SHADOW: React.CSSProperties = { filter: "drop-shadow(0 1px 1.5px rgba(40,25,5,0.45))" };

const FLAP_PATH = "M0 0 H100 V64 L50 100 L0 64 Z";
const FLAP_CLIP = "polygon(0 0, 100% 0, 100% 64%, 50% 100%, 0 64%)";
// Línea de quiebre del sello (las dos mitades comparten el mismo borde)
const SEAL_LEFT = "polygon(0 0, 53% 0, 47% 22%, 55% 41%, 46% 60%, 54% 79%, 49% 100%, 0 100%)";
const SEAL_RIGHT = "polygon(53% 0, 100% 0, 100% 100%, 49% 100%, 54% 79%, 46% 60%, 55% 41%, 47% 22%)";
const PAPER_NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.55 0 0 0 0 0.47 0 0 0 0 0.33 0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// --------------------------------------------
// Geometría de los adornos
// --------------------------------------------

type Pt = [number, number];
const f = (n: number): string => n.toFixed(2);
const toPath = (pts: Pt[]): string =>
  pts.map((p, i) => `${i ? "L" : "M"}${f(p[0])} ${f(p[1])}`).join(" ");

/**
 * Espiral que arranca en `start` y se enrolla alrededor de un centro ubicado
 * hacia `dir` (1 = derecha, -1 = izquierda). Devuelve los puntos.
 */
function spiralPoints(
  start: Pt,
  radius: number,
  dir: 1 | -1,
  up: 1 | -1,
  turns = 1.35,
): Pt[] {
  const center: Pt = [start[0] + dir * radius, start[1] - up * radius * 0.35];
  const a0 = Math.atan2(start[1] - center[1], start[0] - center[0]);
  const r0 = Math.hypot(start[0] - center[0], start[1] - center[1]);
  const steps = 48;
  const total = turns * Math.PI * 2;
  // sentido de giro: que la curva suba antes de enrollarse
  const sense = dir * up * -1;
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * total;
    const r = r0 * Math.exp(-0.55 * t);
    const a = a0 + sense * t;
    pts.push([center[0] + r * Math.cos(a), center[1] + r * Math.sin(a)]);
  }
  return pts;
}

/** Divide una lista de puntos en tramos con grosor decreciente (trazo "caligráfico") */
function TaperedStroke({
  pts,
  from,
  to,
  segments = 6,
}: {
  pts: Pt[];
  from: number;
  to: number;
  segments?: number;
}): React.JSX.Element {
  const per = Math.ceil(pts.length / segments);
  return (
    <>
      {Array.from({ length: segments }, (_, s) => {
        const part = pts.slice(s * per, (s + 1) * per + 1);
        if (part.length < 2) return null;
        const w = from + ((to - from) * s) / (segments - 1);
        return <path key={s} d={toPath(part)} strokeWidth={w} />;
      })}
    </>
  );
}

/** Hoja tipo gota entre dos puntos */
function leafPath(base: Pt, angle: number, length: number, width: number): string {
  const tip: Pt = [base[0] + Math.cos(angle) * length, base[1] + Math.sin(angle) * length];
  const mid: Pt = [(base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2];
  const px = -Math.sin(angle) * width;
  const py = Math.cos(angle) * width;
  return `M${f(base[0])} ${f(base[1])} Q${f(mid[0] + px)} ${f(mid[1] + py)} ${f(tip[0])} ${f(tip[1])} Q${f(mid[0] - px)} ${f(mid[1] - py)} ${f(base[0])} ${f(base[1])} Z`;
}

// Enredadera: se calcula una vez (es siempre igual)
const VINE_W = 90;
const VINE_H = 720;

/** Hoja que sale de un punto de la espiral, hacia afuera de la curva */
function leafOnCurve(pts: Pt[], k: number, length: number, width: number, bend = 0.5): string {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const p = pts[k];
  const q = pts[Math.min(k + 1, pts.length - 1)];
  const tx = q[0] - p[0];
  const ty = q[1] - p[1];
  let nx = -ty;
  let ny = tx;
  if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) {
    nx = -nx;
    ny = -ny;
  }
  // mezcla de normal y tangente: la hoja sale inclinada, como acanto
  const a = Math.atan2(ny + ty * bend, nx + tx * bend);
  return leafPath(p, a, length, width);
}

const vine = (() => {
  const phase = (y: number): number => Math.sin((y / VINE_H) * Math.PI * 2 * 2.5);
  const stemX = (y: number): number => 24 + 7 * phase(y);
  const stem: Pt[] = [];
  const twin: Pt[] = [];
  for (let y = 26; y <= VINE_H - 26; y += 5) {
    stem.push([stemX(y), y]);
    twin.push([24 - 6 * phase(y + 20), y]);
  }

  const spirals: { pts: Pt[]; w: number; end?: number }[] = [];
  const leaves: string[] = [];
  const dots: Pt[] = [];

  // Remates grandes arriba y abajo
  for (const [y, up] of [
    [26, 1],
    [VINE_H - 26, -1],
  ] as [number, 1 | -1][]) {
    const pts = spiralPoints([stemX(y), y], 22, 1, up, 1.6);
    spirals.push({ pts, w: 4 });
    leaves.push(leafOnCurve(pts, 6, 16, 5));
    leaves.push(leafPath([stemX(y), y], up === 1 ? -2.4 : 2.4, 18, 5));
  }

  // Ramas alternadas: grandes hacia adentro, chicas hacia afuera
  const branchCount = 13;
  for (let i = 0; i < branchCount; i++) {
    const y = 80 + i * ((VINE_H - 160) / (branchCount - 1));
    const inward = i % 2 === 0;
    const dir: 1 | -1 = inward ? 1 : -1;
    const up: 1 | -1 = i % 4 < 2 ? 1 : -1;
    const start: Pt = [stemX(y), y];
    if (inward) {
      const radius = 19 + (i % 3) * 3;
      const main = spiralPoints(start, radius, 1, up, 1.5);
      spirals.push({ pts: main, w: 3.4 });
      // contra-rulo chico que nace de la rama principal
      const sub = spiralPoints(main[9], 7, 1, (up * -1) as 1 | -1, 1.3);
      spirals.push({ pts: sub, w: 1.8 });
      // hojas de acanto
      leaves.push(leafPath(start, up === 1 ? 0.55 : -0.55, 20, 5.5));
      leaves.push(leafOnCurve(main, 4, 15, 4.5));
      leaves.push(leafOnCurve(main, 16, 11, 3.5));
      // racimo de bolitas
      const c: Pt = [start[0] + radius * 1.9, start[1] - up * radius * 0.25];
      dots.push(c, [c[0] + 3.5, c[1] + 3], [c[0] - 1, c[1] + 4.5]);
    } else {
      const pts = spiralPoints(start, 10, dir, up, 1.3);
      spirals.push({ pts, w: 2.4 });
      leaves.push(leafPath(start, up === 1 ? Math.PI - 0.6 : Math.PI + 0.6, 13, 4));
      leaves.push(leafOnCurve(pts, 5, 9, 3));
    }
  }
  return { stem, twin, spirals, leaves, dots };
})();

// Borde ondulado del lacre
const sealOutline = (() => {
  const pts: Pt[] = [];
  const n = 180;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r =
      90 + 3.6 * Math.sin(7 * a + 0.4) + 2.2 * Math.sin(12 * a + 1.3) + 1.4 * Math.sin(19 * a);
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return toPath(pts) + " Z";
})();

// --------------------------------------------
// Piezas SVG
// --------------------------------------------

/** Gradientes, filtros y la flor de lis (se definen una sola vez) */
function SvgDefs({ sealColor }: { sealColor: string }): React.JSX.Element {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id="env-gold" x1="0" y1="0" x2="30" y2="45" gradientUnits="userSpaceOnUse" spreadMethod="reflect">
          <stop offset="0" stopColor="#7d5a1e" />
          <stop offset="0.35" stopColor="#c9a04f" />
          <stop offset="0.55" stopColor="#f6e3a8" />
          <stop offset="0.75" stopColor="#c69a45" />
          <stop offset="1" stopColor="#8a6424" />
        </linearGradient>
        <linearGradient id="env-gold-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b08a3e" stopOpacity="0" />
          <stop offset="0.25" stopColor="#c9a04f" />
          <stop offset="0.5" stopColor="#f3dc9a" />
          <stop offset="0.75" stopColor="#c9a04f" />
          <stop offset="1" stopColor="#b08a3e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="env-gold-seal" x1="-60" y1="-60" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f8e7b0" />
          <stop offset="0.3" stopColor="#d4ac5a" />
          <stop offset="0.55" stopColor="#a87b2e" />
          <stop offset="0.8" stopColor="#e9cc80" />
          <stop offset="1" stopColor="#9a6f28" />
        </linearGradient>
        <radialGradient id="env-wax" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#3a5287" />
          <stop offset="0.45" stopColor={sealColor} />
          <stop offset="1" stopColor="#0a1124" />
        </radialGradient>
        <radialGradient id="env-wax-inner" cx="60%" cy="65%" r="70%">
          <stop offset="0" stopColor="#2b3f6b" />
          <stop offset="0.6" stopColor={sealColor} />
          <stop offset="1" stopColor="#0b1328" />
        </radialGradient>
        <filter id="env-emboss" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.7" dy="1" stdDeviation="0.6" floodColor="#2e1f05" floodOpacity="0.6" />
        </filter>
        <filter id="env-seal-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.45" />
        </filter>
        {/* Flor de lis, centrada en (0,0), ~100 de alto */}
        <g id="env-fleur">
          <path d="M0 -52 C 11 -38 14 -18 0 4 C -14 -18 -11 -38 0 -52 Z" />
          <path d="M3 3 C 6 -16 22 -34 38 -26 C 49 -20 45 -4 34 -6 C 27 -7 27 -16 33 -16 C 27 -22 14 -10 10 6 Z" />
          <path d="M-3 3 C -6 -16 -22 -34 -38 -26 C -49 -20 -45 -4 -34 -6 C -27 -7 -27 -16 -33 -16 C -27 -22 -14 -10 -10 6 Z" />
          <rect x="-17" y="4" width="34" height="7" rx="2.5" />
          <path d="M-4 11 C -6 22 -16 30 -26 26 C -18 25 -12 19 -10 11 Z" />
          <path d="M4 11 C 6 22 16 30 26 26 C 18 25 12 19 10 11 Z" />
          <path d="M0 11 C 5 19 4 27 0 33 C -4 27 -5 19 0 11 Z" />
        </g>
      </defs>
    </svg>
  );
}

/** Enredadera dorada (lado izquierdo; el derecho se espeja) */
function Vine({ mirrored }: { mirrored?: boolean }): React.JSX.Element {
  return (
    <svg
      viewBox={`0 0 ${VINE_W} ${VINE_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-auto"
      style={{ transform: mirrored ? "scaleX(-1)" : undefined, overflow: "visible" }}
      aria-hidden="true"
    >
      <g filter="url(#env-emboss)">
        <g fill="none" stroke="url(#env-gold)" strokeLinecap="round" strokeLinejoin="round">
          <TaperedStroke pts={vine.stem} from={4.2} to={4.2} segments={1} />
          <TaperedStroke pts={vine.twin} from={1.6} to={1.6} segments={1} />
          {vine.spirals.map((s, i) => (
            <TaperedStroke key={i} pts={s.pts} from={s.w} to={0.7} />
          ))}
        </g>
        <g fill="url(#env-gold)">
          {vine.leaves.map((d, i) => (
            <path key={i} d={d} />
          ))}
          {vine.dots.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={2.1} />
          ))}
        </g>
      </g>
    </svg>
  );
}

/** Línea dorada con flor de lis en el centro y rulitos a los costados */
function Divider({ fleur = true }: { fleur?: boolean }): React.JSX.Element {
  const curl = (dir: 1 | -1): string => toPath(spiralPoints([dir * 26, 0], 7, dir, 1, 1.3));
  return (
    <svg viewBox="-160 -22 320 44" className="w-full h-auto" aria-hidden="true" style={{ overflow: "visible" }}>
      <g filter="url(#env-emboss)">
        <rect x="-160" y="-0.8" width="320" height="1.6" fill="url(#env-gold-h)" />
        {fleur ? (
          <>
            <g fill="none" stroke="url(#env-gold)" strokeWidth="2" strokeLinecap="round">
              <path d={curl(1)} />
              <path d={curl(-1)} />
            </g>
            <use href="#env-fleur" transform="scale(0.42)" fill="url(#env-gold-seal)" />
          </>
        ) : (
          <path d="M0 -10 L3 0 L0 10 L-3 0 Z M-10 0 L0 -3 L10 0 L0 3 Z" fill="url(#env-gold-seal)" />
        )}
      </g>
    </svg>
  );
}

/** Sello de lacre con corona dorada y monograma */
function WaxSeal({ initials }: { initials: string }): React.JSX.Element {
  const ornaments = [0, 90, 180, 270];
  const scrolls = [45, 135, 225, 315];
  const scroll = toPath(spiralPoints([0, 0], 6, 1, 1, 1.3));
  const scrollMirror = toPath(spiralPoints([0, 0], 6, -1, 1, 1.3));
  return (
    <svg viewBox="-110 -110 220 220" className="w-full h-full" aria-hidden="true">
      <g filter="url(#env-seal-shadow)">
        <path d={sealOutline} fill="url(#env-wax)" />
      </g>
      {/* brillo del borde del lacre */}
      <path d={sealOutline} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      {/* zona hundida donde apoyó el sello */}
      <circle r="71" fill="url(#env-wax-inner)" />
      <circle r="71" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="2.5" />
      <circle r="73" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

      <g filter="url(#env-emboss)" fill="url(#env-gold-seal)" stroke="url(#env-gold-seal)">
        {/* aros */}
        <circle r="58" fill="none" strokeWidth="2.6" />
        <circle r="52" fill="none" strokeWidth="1" />
        {/* flores de lis en los puntos cardinales */}
        {ornaments.map((deg) => (
          <g key={deg} transform={`rotate(${deg}) translate(0 -61) scale(0.2)`} stroke="none">
            <use href="#env-fleur" />
          </g>
        ))}
        {/* rulos en diagonal */}
        {scrolls.map((deg) => (
          <g key={deg} transform={`rotate(${deg}) translate(0 -58)`} fill="none" strokeWidth="1.8" strokeLinecap="round">
            <path d={scroll} transform="translate(2 0)" />
            <path d={scrollMirror} transform="translate(-2 0)" />
            <circle r="1.8" cy="-4" stroke="none" fill="url(#env-gold-seal)" />
          </g>
        ))}
        {/* monograma */}
        <text
          x="0"
          y="2"
          textAnchor="middle"
          dominantBaseline="central"
          stroke="#5a3e10"
          strokeWidth="0.6"
          style={{ fontFamily: "'Cinzel', 'Playfair Display', serif", fontSize: initials.length > 3 ? 36 : 46, fontWeight: 600, letterSpacing: 1 }}
        >
          {initials}
        </text>
      </g>
    </svg>
  );
}

// --------------------------------------------
// Componente principal
// --------------------------------------------

export default function EnvelopeSplash({
  photo,
  couple,
  initials,
  subtitle,
  dateText,
  sealColor,
  art = {},
  onOpen,
  onFinish,
}: EnvelopeSplashProps): React.JSX.Element {
  const [opening, setOpening] = useState(false);
  const monogram = (initials || couple.split(/\s*&\s*/).map((n) => n.trim()[0]).join("&")).replace(/\s+/g, "");

  const handleOpen = (): void => {
    if (opening) return;
    setOpening(true);
    onOpen();
    setTimeout(onFinish, OPEN_DURATION);
  };

  // Transiciones de cada capa (los delays arman la secuencia)
  const t = (props: string, ms: number, delay: number, ease = "cubic-bezier(.55,.05,.3,1)") =>
    `${props} ${ms}ms ${ease} ${delay}ms`;

  return (
    <div
      onClick={handleOpen}
      role="button"
      aria-label="Abrir la invitación"
      className="fixed inset-0 z-[100] cursor-pointer select-none overflow-hidden"
      style={{
        backgroundColor: "#141B2D",
        opacity: opening ? 0 : 1,
        transition: t("opacity", 600, OPEN_DURATION - 650, "ease-in"),
      }}
    >
      <SvgDefs sealColor={sealColor} />

      {/* Fondo desenfocado para pantallas anchas (compu) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${photo}')`, filter: "blur(24px) sepia(0.4) brightness(0.55)", transform: "scale(1.15)" }}
      />

      {/* La carta: ocupa toda la pantalla en celular, centrada en compu */}
      <div
        className="relative mx-auto h-full"
        style={{
          width: "min(100vw, 62dvh)",
          containerType: "inline-size",
          perspective: "1400px",
          transformOrigin: "50% 100%",
          transform: opening ? "scale(0.8)" : "none",
          transition: t("transform", 650, 0, "cubic-bezier(.3,.7,.3,1)"),
        }}
      >
        {/* Contenido de la carta (se agranda y se desvanece al abrir) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            boxShadow: "0 10px 60px rgba(0,0,0,0.55)",
            transform: opening ? "translateY(-4%) scale(1.04)" : "none",
            opacity: opening ? 0 : 1,
            transition: `${t("transform", 1000, 1250)}, ${t("opacity", 800, 1350, "ease-in")}`,
          }}
        >
          {/* Foto lavada en tono papel */}
          <div
            className="absolute inset-0 bg-cover"
            style={{
              backgroundImage: `url('${photo}')`,
              backgroundPosition: "50% 30%",
              backgroundSize: "auto 112%",
              filter: "sepia(0.35) saturate(0.85) brightness(1.06) contrast(0.92)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(239,230,213,0.55) 0%, rgba(239,230,213,0.42) 40%, rgba(239,230,213,0.58) 100%)",
            }}
          />
          {/* textura de papel */}
          <div
            className="absolute inset-0 opacity-40 mix-blend-multiply"
            style={{
              backgroundImage: PAPER_NOISE,
            }}
          />
          {/* viñeta suave */}
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 55%, transparent 55%, rgba(60,45,20,0.28) 100%)" }}
          />

          {/* Enredaderas */}
          <div className="absolute left-[1%] top-[26%] bottom-[1.5%] flex items-stretch">
            {art.vineLeft ? <img src={art.vineLeft} alt="" className="h-full w-auto" style={GOLD_SHADOW} /> : <Vine />}
          </div>
          <div className="absolute right-[1%] top-[26%] bottom-[1.5%] flex items-stretch">
            {art.vineRight || art.vineLeft ? (
              <img
                src={art.vineRight || art.vineLeft}
                alt=""
                className="h-full w-auto"
                style={{ ...GOLD_SHADOW, transform: art.vineRight ? undefined : "scaleX(-1)" }}
              />
            ) : (
              <Vine mirrored />
            )}
          </div>

          {/* Textos */}
          <div
            className="absolute inset-x-0 top-[37%] bottom-[5%] flex flex-col items-center justify-between text-center"
            style={{ color: "#141B2D", padding: "0 17cqw" }}
          >
            <div className="w-full flex flex-col items-center">
              <div style={{ width: "100%" }}>
                {art.dividerTop ? <img src={art.dividerTop} alt="" className="w-full h-auto" style={GOLD_SHADOW} /> : <Divider />}
              </div>
              <h1
                className="leading-none whitespace-nowrap"
                style={{
                  fontFamily: "'Pinyon Script', 'Great Vibes', serif",
                  fontSize: "clamp(2.2rem, 13.5cqw, 5.5rem)",
                  margin: "3cqw 0 1cqw",
                  textShadow: "0 1px 0 rgba(255,255,255,0.6), 0 2px 8px rgba(239,230,213,0.9)",
                }}
              >
                {/* El "&" de Pinyon Script es poco legible: va en otra letra */}
                {couple.split("&").map((part, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <span style={{ fontFamily: "'Great Vibes', serif", fontSize: "0.9em", margin: "0 0.22em" }}>&amp;</span>
                    )}
                    {part.trim()}
                  </React.Fragment>
                ))}
              </h1>
              <div style={{ width: "88%" }}>
                {art.dividerBottom || art.dividerTop ? (
                  <img src={art.dividerBottom || art.dividerTop} alt="" className="w-full h-auto" style={GOLD_SHADOW} />
                ) : (
                  <Divider />
                )}
              </div>
            </div>

            <p
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "clamp(1.4rem, 7.6cqw, 3rem)",
                textShadow: "0 1px 6px rgba(239,230,213,0.95)",
              }}
            >
              {subtitle}
            </p>

            <p
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontWeight: 600,
                fontSize: "clamp(1.2rem, 6.4cqw, 2.5rem)",
                textShadow: "0 1px 6px rgba(239,230,213,0.95)",
              }}
            >
              {dateText}
            </p>

            <div className="w-full flex flex-col items-center">
              <div style={{ width: "100%" }}>
                {art.dividerSmall ? <img src={art.dividerSmall} alt="" className="w-full h-auto" style={GOLD_SHADOW} /> : <Divider fleur={false} />}
              </div>
              <p
                className="animate-pulse"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: "clamp(1rem, 5.4cqw, 2rem)",
                  marginTop: "3cqw",
                  textShadow: "0 1px 6px rgba(239,230,213,0.95)",
                }}
              >
                Toca para continuar
              </p>
            </div>
          </div>
        </div>

        {/* Solapa del sobre: se abre hacia arriba mostrando su cara interna */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: "22%",
            transformOrigin: "50% 0%",
            transformStyle: "preserve-3d",
            transform: opening ? "rotateX(-180deg)" : "rotateX(0deg)",
            opacity: opening ? 0 : 1,
            transition: `${t("transform", 1000, 420, "cubic-bezier(.45,.05,.35,1)")}, ${t("opacity", 600, 1350, "ease-in")}`,
            zIndex: opening ? 0 : 2,
          }}
        >
          {/* cara externa */}
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-full block"
              style={{ filter: "drop-shadow(0 5px 6px rgba(60,40,10,0.35))", overflow: "visible" }}
            >
              <defs>
                <linearGradient id="env-flap" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#e9dfcb" />
                  <stop offset="0.7" stopColor="#efe6d5" />
                  <stop offset="1" stopColor="#e3d6bd" />
                </linearGradient>
              </defs>
              <path d={FLAP_PATH} fill="url(#env-flap)" />
              <path d="M0 64 L50 100 L100 64" fill="none" stroke="rgba(150,120,70,0.35)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
            </svg>
            <div
              className="absolute inset-0 opacity-30 mix-blend-multiply pointer-events-none"
              style={{ clipPath: FLAP_CLIP, backgroundImage: PAPER_NOISE }}
            />
          </div>
          {/* cara interna (se ve cuando la solapa ya pasó la mitad del giro) */}
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full block">
              <defs>
                <linearGradient id="env-flap-in" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#d8c9ad" />
                  <stop offset="1" stopColor="#c9b894" />
                </linearGradient>
              </defs>
              <path d={FLAP_PATH} fill="url(#env-flap-in)" />
            </svg>
          </div>
        </div>

        {/* Sello: entero mientras espera; al abrir se parte en dos mitades */}
        <div
          className="absolute left-1/2"
          style={{ top: "20.5%", width: "50cqw", height: "50cqw", transform: "translate(-50%, -50%)", zIndex: 3 }}
        >
          {art.sealLeft && art.sealRight ? (
            // Sello en imágenes: las dos mitades encajan y forman el sello entero
            <div className={`w-full h-full ${opening ? "" : "env-seal-idle"}`}>
              {([
                [art.sealLeft, -1],
                [art.sealRight, 1],
              ] as const).map(([src, side]) => (
                <img
                  key={side}
                  src={src}
                  alt=""
                  className={`absolute inset-0 w-full h-full ${opening ? "env-seal-crack" : ""}`}
                  style={{
                    filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.45))",
                    ["--dx" as string]: `${side * 42}%`,
                    ["--rot" as string]: `${side * 26}deg`,
                  }}
                />
              ))}
            </div>
          ) : !opening ? (
            <div className="env-seal-idle w-full h-full">
              <WaxSeal initials={monogram} />
            </div>
          ) : (
            (["left", "right"] as const).map((side) => {
              const isLeft = side === "left";
              return (
                <div
                  key={side}
                  className="absolute inset-0 env-seal-crack"
                  style={{
                    clipPath: isLeft ? SEAL_LEFT : SEAL_RIGHT,
                    ["--dx" as string]: `${isLeft ? -40 : 40}%`,
                    ["--rot" as string]: `${isLeft ? -24 : 24}deg`,
                  }}
                >
                  <WaxSeal initials={monogram} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
