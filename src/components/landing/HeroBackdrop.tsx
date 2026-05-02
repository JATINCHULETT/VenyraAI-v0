"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FilmLoop } from "./FilmLoop";

/**
 * Cinematic stack: animated film loop + soft bloom orbs + frame + light vignette.
 * Add `public/hero-ambient.webm` (or .mp4) for an extra layer — enable below.
 */
export function HeroBackdrop({ enableAmbientVideo = false }: { enableAmbientVideo?: boolean }) {
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 scale-[1.02]">
        <FilmLoop />
      </div>

      {enableAmbientVideo && (
        <div className="absolute inset-0 opacity-40 mix-blend-screen dark:opacity-50">
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          >
            <source src="/hero-ambient.webm" type="video/webm" />
            <source src="/hero-ambient.mp4" type="video/mp4" />
          </video>
        </div>
      )}

      {!reduce && (
        <>
          <motion.div
            className="absolute left-1/2 top-[14%] h-[min(110vw,780px)] w-[min(110vw,780px)] -translate-x-1/2 rounded-full bg-[var(--accent)] blur-[128px] dark:opacity-90"
            style={{ opacity: 0.22 }}
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.18, 0.32, 0.18],
            }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.div
            className="absolute right-[-12%] top-[38%] h-[min(75vw,520px)] w-[min(75vw,520px)] rounded-full bg-[oklch(0.62_0.2_290)] blur-[108px]"
            style={{ opacity: 0.16 }}
            animate={{
              x: [0, -28, 0],
              y: [0, 20, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.div
            className="absolute bottom-0 left-[-18%] h-[min(90vw,560px)] w-[min(90vw,560px)] rounded-full bg-[oklch(0.52_0.14_232)] blur-[118px]"
            style={{ opacity: 0.12 }}
            animate={{
              x: [0, 40, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        </>
      )}

      <div
        className="absolute inset-6 rounded-[1.75rem] border border-[color-mix(in_oklch,var(--accent)_18%,transparent)] opacity-50 shadow-[0_0_100px_-30px_var(--glow-soft),inset_0_0_80px_-50px_var(--glow-soft)] sm:inset-8 dark:opacity-[0.65]"
        aria-hidden
      />

      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_125%_80%_at_50%_-5%,transparent_0%,color-mix(in_oklch,var(--bg)_35%,transparent)_50%,var(--bg)_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,transparent_50%,var(--bg)_100%)] opacity-90"
        aria-hidden
      />
    </div>
  );
}
