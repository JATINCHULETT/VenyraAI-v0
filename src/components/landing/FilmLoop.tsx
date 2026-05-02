"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Full-bleed ambient motion — reads like premium product film without a heavy video asset.
 * Drop `public/hero-ambient.webm` and set `useVideo` to prefer a real file when available.
 */
export function FilmLoop({
  className = "",
  useVideo = false,
}: {
  className?: string;
  useVideo?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const on = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (useVideo || reduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (t: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const u = t * 0.00006;

      ctx.clearRect(0, 0, w, h);

      const orbs = [
        { x: w * (0.35 + Math.sin(u) * 0.08), y: h * (0.25 + Math.cos(u * 0.9) * 0.06), r: w * 0.45, hue: 258 },
        { x: w * (0.72 + Math.cos(u * 0.85) * 0.1), y: h * (0.55 + Math.sin(u * 0.7) * 0.08), r: w * 0.38, hue: 232 },
        { x: w * (0.5 + Math.sin(u * 1.1 + 1) * 0.12), y: h * (0.75 + Math.cos(u * 0.95) * 0.05), r: w * 0.35, hue: 285 },
      ];

      for (const o of orbs) {
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `hsla(${o.hue}, 88%, 58%, 0.26)`);
        g.addColorStop(0.4, `hsla(${o.hue}, 75%, 48%, 0.1)`);
        g.addColorStop(0.7, `hsla(${o.hue}, 70%, 40%, 0.03)`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [useVideo, reduceMotion]);

  if (reduceMotion && !useVideo) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br from-[oklch(0.35_0.12_264/0.12)] via-transparent to-[oklch(0.4_0.1_290/0.08)] ${className}`}
        aria-hidden
      />
    );
  }

  if (useVideo) {
    return (
      <video
        ref={videoRef}
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-screen ${className}`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/hero-ambient.webm" type="video/webm" />
        <source src="/hero-ambient.mp4" type="video/mp4" />
      </video>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    />
  );
}
