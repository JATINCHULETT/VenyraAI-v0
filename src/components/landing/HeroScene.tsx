"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Cinematic hero atmosphere — gradient sky, light beam, drifting horizon haze, stardust.
 * Pure CSS/SVG, no images. Reads like Elysian / Redacted hero photography.
 */
export function HeroScene() {
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* base sky */}
      <div className="absolute inset-0 aurora-sky" />

      {/* SVG horizon — distant ridges */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[55%] w-full opacity-90"
        viewBox="0 0 1600 600"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="ridge1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sky-horizon)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="ridge2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sky-mid)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="ridge3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sky-top)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="1" />
          </linearGradient>
          <filter id="haze" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* far ridge */}
        <path
          d="M0 320 C 200 280, 360 360, 540 320 S 880 240, 1080 320 S 1420 360, 1600 300 L 1600 600 L 0 600 Z"
          fill="url(#ridge3)"
          filter="url(#haze)"
        />
        {/* mid ridge */}
        <path
          d="M0 400 C 200 380, 380 440, 600 400 S 980 320, 1180 410 S 1460 460, 1600 400 L 1600 600 L 0 600 Z"
          fill="url(#ridge2)"
          filter="url(#haze)"
        />
        {/* near ridge */}
        <path
          d="M0 500 C 220 460, 420 520, 660 490 S 1040 440, 1280 500 S 1500 540, 1600 510 L 1600 600 L 0 600 Z"
          fill="url(#ridge1)"
        />
      </svg>

      {/* god rays (animated sway) */}
      {!reduce && <div className="god-rays animate-ray-sway" aria-hidden />}

      {/* central spotlight */}
      <div className="light-beam" aria-hidden />

      {/* drifting bloom orbs for life */}
      {!reduce && (
        <>
          <motion.div
            className="absolute left-[8%] top-[18%] h-[28vw] w-[28vw] max-h-[420px] max-w-[420px] rounded-full bg-[oklch(0.7_0.18_330_/_0.18)] blur-[110px] dark:bg-[oklch(0.55_0.18_290_/_0.4)]"
            animate={{ y: [0, 24, 0], opacity: [0.7, 0.95, 0.7] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.div
            className="absolute right-[5%] top-[28%] h-[26vw] w-[26vw] max-h-[400px] max-w-[400px] rounded-full bg-[oklch(0.78_0.14_60_/_0.18)] blur-[110px] dark:bg-[oklch(0.5_0.18_30_/_0.35)]"
            animate={{ y: [0, -20, 0], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            aria-hidden
          />
          <motion.div
            className="absolute left-1/2 top-[5%] h-[36vw] w-[36vw] max-h-[520px] max-w-[520px] -translate-x-1/2 rounded-full bg-[var(--accent)] opacity-25 blur-[140px] dark:opacity-40"
            animate={{ scale: [1, 1.06, 1], opacity: [0.18, 0.34, 0.18] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        </>
      )}

      {/* stardust (dark hero) */}
      <div className="stardust absolute inset-0 hidden dark:block" aria-hidden />

      {/* floating motes — light + dark */}
      {!reduce && (
        <>
          <div className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden" aria-hidden>
            {[...Array(14)].map((_, i) => (
              <motion.span
                key={`l-${i}`}
                className="absolute h-1 w-1 rounded-full bg-[color-mix(in_oklch,var(--accent)_55%,transparent)] shadow-[0_0_12px_var(--glow-soft)]"
                style={{
                  left: `${8 + ((i * 17) % 84)}%`,
                  top: `${12 + ((i * 23) % 70)}%`,
                }}
                animate={{
                  y: [0, -18, 0],
                  opacity: [0.25, 0.7, 0.25],
                  scale: [1, 1.35, 1],
                }}
                transition={{
                  duration: 5 + (i % 5),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.35,
                }}
              />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 hidden overflow-hidden dark:block" aria-hidden>
            {[...Array(12)].map((_, i) => (
              <motion.span
                key={`d-${i}`}
                className="absolute h-[3px] w-[3px] rounded-full bg-[oklch(0.78_0.14_180_/_0.5)] shadow-[0_0_14px_oklch(0.72_0.14_180_/_0.45)]"
                style={{
                  left: `${10 + ((i * 19) % 80)}%`,
                  top: `${15 + ((i * 29) % 65)}%`,
                }}
                animate={{
                  y: [0, -22, 0],
                  x: [0, i % 2 === 0 ? 8 : -8, 0],
                  opacity: [0.2, 0.85, 0.2],
                }}
                transition={{
                  duration: 6 + (i % 4),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.42,
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* horizon vignette */}
      <div className="horizon-fade" aria-hidden />
    </div>
  );
}
