"use client";

import "@/lib/fontawesome";
import { SessionProvider } from "next-auth/react";
import { AppAuthProvider } from "./app-auth-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppAuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AppAuthProvider>
    </SessionProvider>
  );
}
