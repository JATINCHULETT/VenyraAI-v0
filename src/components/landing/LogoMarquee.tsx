"use client";

import { motion, useReducedMotion } from "framer-motion";

const LOGOS = [
  "Northwind",
  "Lattice",
  "Helio",
  "Vanta·co",
  "Kepler",
  "Atlas Labs",
  "Stoic",
  "Quanta",
  "Voyage",
  "Parallel",
];

export function LogoMarquee() {
  const reduce = useReducedMotion();
  const items = [...LOGOS, ...LOGOS];

  return (
    <div className="marquee-mask relative w-full overflow-hidden">
      <motion.div
        className="flex w-max items-center gap-12 sm:gap-16"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
      >
        {items.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="select-none whitespace-nowrap text-base font-semibold tracking-tight text-[color-mix(in_oklch,var(--fg)_60%,transparent)] sm:text-lg"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {name}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
