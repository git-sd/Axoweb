"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

const BODY = "#f9cdd2";
const BELLY = "#fde4e6";
const GILL = "#e2557a";
const INK = "#3a0f1f";
const LINE = { stroke: INK, strokeWidth: 5, strokeLinejoin: "round" as const };

// Three gills a side, fanned out from the back of the head. Angles are in degrees,
// measured from pointing right; the left side mirrors the right.
const GILLS = [
  { x: 172, y: 74, a: -42, len: 62 },
  { x: 184, y: 96, a: -12, len: 68 },
  { x: 182, y: 120, a: 18, len: 56 },
];

function Gill({ len, i, excited }: { len: number; i: number; excited: boolean }) {
  const frills = Array.from({ length: 5 }, (_, k) => 10 + k * ((len - 14) / 4));
  return (
    <motion.g
      style={{ originX: 0, originY: 0.5 }}
      animate={{ rotate: excited ? [0, 16, -10, 12, 0] : [0, 7, 0, -5, 0] }}
      transition={{ duration: excited ? 0.7 : 2.4, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
    >
      {frills.map((fx) => (
        <g key={fx} stroke={INK} strokeWidth="9" strokeLinecap="round">
          <line x1={fx} y1="-4" x2={fx + 6} y2="-17" />
          <line x1={fx} y1="4" x2={fx + 6} y2="17" />
        </g>
      ))}
      {frills.map((fx) => (
        <g key={`f${fx}`} stroke={GILL} strokeWidth="4" strokeLinecap="round">
          <line x1={fx} y1="-4" x2={fx + 6} y2="-17" />
          <line x1={fx} y1="4" x2={fx + 6} y2="17" />
        </g>
      ))}
      <rect x="0" y="-7" width={len} height="14" rx="7" fill={GILL} {...LINE} />
    </motion.g>
  );
}

// A front-facing axolotl that bobs, blinks, waves its gills and watches the cursor.
// `excited` speeds the gills up and adds a hop (e.g. while the URL box has focus).
export default function Axolotl({ excited = false, size = 220 }: { excited?: boolean; size?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const px = useSpring(useMotionValue(0), { stiffness: 220, damping: 14 });
  const py = useSpring(useMotionValue(0), { stiffness: 220, damping: 14 });

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.55);
      const d = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, d / 300) * 4;
      px.set((dx / d) * reach);
      py.set((dy / d) * reach);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [px, py]);

  const eye = (cx: number) => (
    <motion.g
      style={{ originX: 0.5, originY: 0.5 }}
      animate={{ scaleY: [1, 1, 0.1, 1] }}
      transition={{ duration: 0.25, times: [0, 0.4, 0.6, 1], repeat: Infinity, repeatDelay: 3.2 }}
    >
      <circle cx={cx} cy="112" r="11" fill={INK} />
      <motion.circle cx={cx - 2} cy="109" r="4" fill="#fff" style={{ x: px, y: py }} />
    </motion.g>
  );

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 300 220"
      width={size}
      height={(size * 220) / 300}
      role="img"
      aria-label="A pink axolotl waving its gills"
      animate={excited ? { y: [0, -14, 0] } : { y: [0, -8, 0] }}
      transition={{ duration: excited ? 0.6 : 3, repeat: Infinity, ease: "easeInOut" }}
      style={{ overflow: "visible", display: "block", margin: "0 auto" }}
    >
      {/* tail, tucked behind */}
      <motion.path
        d="M190 170 C 240 175, 270 160, 285 135 C 270 175, 235 195, 185 188 Z"
        fill={BODY}
        {...LINE}
        style={{ originX: 0, originY: 0.5 }}
        animate={{ rotate: [0, -6, 0, 4, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* gills: right side, then mirrored left */}
      {GILLS.map((g, i) => (
        <g key={`r${i}`} transform={`translate(${g.x} ${g.y}) rotate(${g.a})`}>
          <Gill len={g.len} i={i} excited={excited} />
        </g>
      ))}
      {GILLS.map((g, i) => (
        <g key={`l${i}`} transform={`translate(${300 - g.x} ${g.y}) rotate(${180 - g.a})`}>
          <Gill len={g.len} i={i + 3} excited={excited} />
        </g>
      ))}
      {/* front legs */}
      <ellipse cx="108" cy="182" rx="14" ry="20" fill={BODY} {...LINE} transform="rotate(20 108 182)" />
      <ellipse cx="192" cy="182" rx="14" ry="20" fill={BODY} {...LINE} transform="rotate(-20 192 182)" />
      {/* head */}
      <ellipse cx="150" cy="118" rx="78" ry="62" fill={BODY} {...LINE} />
      <ellipse cx="150" cy="140" rx="52" ry="30" fill={BELLY} />
      {/* cheeks */}
      <ellipse cx="102" cy="134" rx="12" ry="8" fill={GILL} opacity="0.5" />
      <ellipse cx="198" cy="134" rx="12" ry="8" fill={GILL} opacity="0.5" />
      {eye(118)}
      {eye(182)}
      {/* smile */}
      <motion.path
        d="M128 136 Q150 152 172 136"
        fill="none"
        stroke={INK}
        strokeWidth="5"
        strokeLinecap="round"
        animate={excited ? { d: "M124 134 Q150 162 176 134" } : { d: "M128 136 Q150 152 172 136" }}
        transition={{ type: "spring", stiffness: 300, damping: 12 }}
      />
    </motion.svg>
  );
}
