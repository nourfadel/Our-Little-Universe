"use client";
import { motion, useReducedMotion } from "motion/react";

const HEART =
  "M100 168 C 40 122, 10 86, 10 52 C 10 24, 32 8, 56 8 C 76 8, 92 20, 100 36 C 108 20, 124 8, 144 8 C 168 8, 190 24, 190 52 C 190 86, 160 122, 100 168 Z";

const TIMES = [0, 0.42, 0.55, 0.88, 1];
const CYCLE = 9;

export function AnimatedHeart({ initials }: { initials: string }) {
  const reduce = useReducedMotion();
  const loop = { duration: CYCLE, times: TIMES, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <svg
      viewBox="0 0 200 180"
      role="img"
      aria-label={`Heart with the initials ${initials}`}
      className="h-auto w-52 sm:w-64 overflow-visible"
    >
      <defs>
        <radialGradient id="heart-fill" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#A83245" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#A83245" stopOpacity="0" />
        </radialGradient>
        <filter id="heart-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {reduce ? (
        <>
          <path d={HEART} fill="url(#heart-fill)" stroke="#A83245" strokeWidth="2.5" filter="url(#heart-glow)" />
          <InitialsText initials={initials} opacity={1} />
        </>
      ) : (
        <>
          <motion.path
            d={HEART}
            fill="url(#heart-fill)"
            fillOpacity={0}
            stroke="#A83245"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#heart-glow)"
            animate={{ pathLength: [0, 1, 1, 1, 1], strokeOpacity: [1, 1, 1, 1, 0], fillOpacity: [0, 0, 1, 1, 0] }}
            transition={loop}
          />
          <motion.g
            animate={{ opacity: [0, 0, 1, 1, 0] }}
            transition={loop}
          >
            <motion.g
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <InitialsText initials={initials} opacity={1} />
            </motion.g>
          </motion.g>
        </>
      )}
    </svg>
  );
}

function InitialsText({ initials, opacity }: { initials: string; opacity: number }) {
  return (
    <text
      x="100"
      y="72"
      textAnchor="middle"
      dominantBaseline="middle"
      fill="#fff"
      opacity={opacity}
      style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 34, fontWeight: 300, letterSpacing: "0.08em", filter: "drop-shadow(0 0 6px rgba(168,50,69,.8))" }}
    >
      {initials}
    </text>
  );
}
