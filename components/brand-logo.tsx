"use client";

import { useId } from "react";

/*
 * VOOSITA WORK logo.
 * Letter shapes and circuit traces come from the VOSITA loading-screen design:
 * faceted block letters with slots, glowing green traces, green accent.
 * The geometry is built once at module load with a fixed seed, so the logo
 * looks the same on every visit and on the server and in the browser.
 */

type Pt = [number, number];
type Glyph = { w: number; p: Pt[][]; s: Pt[][] };

const GLY: Record<string, Glyph> = {
  V: { w: 14.5, p: [[[0, 0], [4.4, 0], [7.25, 4.56], [10.1, 0], [14.5, 0], [9.5, 8], [5, 8]]], s: [[[2.2, 0.5], [2.2, 3], [4.4, 3], [4.4, 6], [7.25, 6], [7.25, 7.3]], [[12.3, 0.5], [12.3, 3], [10.1, 3], [10.1, 6], [7.25, 6]]] },
  O: { w: 12.5, p: [[[2.2, 0], [10.3, 0], [12.5, 2.2], [12.5, 5.8], [10.3, 8], [2.2, 8], [0, 5.8], [0, 2.2]], [[3.2, 3.1], [9.3, 3.1], [9.8, 3.55], [9.8, 4.45], [9.3, 4.9], [3.2, 4.9], [2.7, 4.45], [2.7, 3.55]]], s: [[[2.5, 1.5], [11.2, 1.5], [11.2, 6.5], [1.3, 6.5], [1.3, 1.5], [2.5, 1.5]]] },
  S: { w: 11.5, p: [[[2, 0], [11.5, 0], [11.5, 2.4], [2.6, 2.4], [2.6, 3], [11.5, 3], [11.5, 6], [9.5, 8], [0, 8], [0, 5.6], [8.9, 5.6], [8.9, 5], [0, 5], [0, 2]]], s: [[[10.5, 1.2], [1.3, 1.2], [1.3, 4], [10.2, 4], [10.2, 6.8], [1.3, 6.8]]] },
  I: { w: 3.4, p: [[[0.9, 0], [3.4, 0], [3.4, 7.1], [2.5, 8], [0, 8], [0, 0.9]]], s: [[[1.7, 0.9], [1.7, 7.1]]] },
  T: { w: 11.5, p: [[[1.5, 0], [10, 0], [11.5, 1.5], [11.5, 3], [7.9, 3], [7.9, 8], [3.6, 8], [3.6, 3], [0, 3], [0, 1.5]]], s: [[[0.8, 1.5], [10.7, 1.5]], [[5.75, 1.5], [5.75, 7.2]], [[4.5, 3.6], [4.5, 7], [7, 7]]] },
  A: { w: 12, p: [[[2.2, 0], [9.8, 0], [12, 2.2], [12, 8], [8.2, 8], [8.2, 5.6], [3.8, 5.6], [3.8, 8], [0, 8], [0, 2.2]], [[3.6, 2.4], [8.4, 2.4], [8.8, 2.8], [8.8, 3.6], [8.4, 4], [3.6, 4], [3.2, 3.6], [3.2, 2.8]]], s: [[[1.9, 7.2], [1.9, 1.2], [10.1, 1.2], [10.1, 7.2]], [[1.9, 4.8], [10.1, 4.8]]] },
};

const U = 14.25; // size of one grid unit in the logo
const GAP = 1.1; // space between letters, in grid units
const H = 8 * U; // logo height in the same units
const WORD = "VOOSITA";

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function polyPath(pts: Pt[]) {
  return pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join("");
}

function build() {
  const rnd = rng(20261022);
  const dirs: Pt[] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  let ox = 0;
  let fill = "";
  const traces: { d: string; end: Pt }[] = [];

  for (const ch of WORD) {
    const g = GLY[ch];
    const X = (a: number) => (ox + a) * U;
    const Y = (a: number) => a * U;

    for (const poly of g.p) {
      fill += polyPath(poly.map(([x, y]) => [X(x), Y(y)] as Pt)) + "Z";
    }

    for (const sk of g.s) {
      for (let k = 0; k < 6; k++) {
        const n = sk.length;
        const i = Math.floor(rnd() * (n - 1));
        const j = Math.min(n - 1, i + 1 + Math.floor(rnd() * 3));
        const t = sk.slice(i, j + 1).map(([x, y]) => [X(x), Y(y)] as Pt);
        traces.push({ d: polyPath(t), end: t[t.length - 1] });
        if (rnd() < 0.55) {
          const a = t[Math.floor(rnd() * t.length)];
          const q = dirs[Math.floor(rnd() * 4)];
          const l = U * (0.7 + rnd() * 0.7);
          const b: Pt = [a[0] + q[0] * l, a[1] + q[1] * l];
          traces.push({ d: polyPath([a, b]), end: b });
        }
      }
    }
    ox += g.w + GAP;
  }
  return { fill, traces, width: (ox - GAP) * U };
}

const BUILT = build();

export default function BrandLogo({
  height = 44,
  work = true,
  className = "",
}: {
  height?: number;
  work?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const pad = 14;
  const vb = `${-pad} ${-pad} ${BUILT.width + pad * 2} ${H + pad * 2}`;

  return (
    <span className={`brand ${className}`} style={{ height }} role="img" aria-label="VOOSITA WORK">
      <svg viewBox={vb} className="brand-svg" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#232823" />
            <stop offset="0.2" stopColor="#0a0c0b" />
            <stop offset="0.62" stopColor="#040505" />
            <stop offset="0.88" stopColor="#06190d" />
            <stop offset="1" stopColor="#0b2c18" />
          </linearGradient>
          <linearGradient id={`light-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4f8f5" />
            <stop offset="0.5" stopColor="#d9e4dd" />
            <stop offset="1" stopColor="#b9cbc0" />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path className="brand-body-dark" d={BUILT.fill} fill={`url(#body-${uid})`} fillRule="evenodd" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
        <path className="brand-body-light" d={BUILT.fill} fill={`url(#light-${uid})`} fillRule="evenodd" stroke="rgba(10,40,25,0.35)" strokeWidth="1" />
        <g fill="none" stroke="#1ef07a" strokeWidth="1.6" strokeLinecap="square" filter={`url(#glow-${uid})`}>
          {BUILT.traces.map((t, i) => (
            <path key={i} d={t.d} className="brand-trace" style={{ animationDelay: `${(i % 9) * 0.37}s` }} />
          ))}
        </g>
        <g fill="#7dffb0" filter={`url(#glow-${uid})`}>
          {BUILT.traces.map((t, i) => (
            <circle key={`e${i}`} cx={t.end[0]} cy={t.end[1]} r="2.2" className="brand-trace" style={{ animationDelay: `${(i % 9) * 0.37}s` }} />
          ))}
        </g>
      </svg>
      {work && <span className="brand-work">WORK</span>}
    </span>
  );
}
