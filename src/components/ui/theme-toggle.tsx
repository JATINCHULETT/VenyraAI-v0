"use client";

import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const reduce = useReducedMotion();
  const isDark = resolved === "dark";

  return (
    <motion.button
      type="button"
      onClick={toggle}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--border)_70%,transparent)] bg-[color-mix(in_oklch,var(--card)_80%,transparent)] text-[var(--fg-muted)] backdrop-blur-md glow-border-hover ${className}`}
      whileTap={{ scale: 0.96 }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <motion.span
        className="flex items-center justify-center"
        initial={false}
        animate={{ rotate: reduce ? 0 : isDark ? 0 : 180, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <FontAwesomeIcon icon={isDark ? faMoon : faSun} className="h-[1.05rem] w-[1.05rem]" />
      </motion.span>
    </motion.button>
  );
}
