"use client";

import "@/lib/fontawesome";
import type { Session } from "@auth/core/types";
import { SessionProvider } from "next-auth/react";
import { AppAuthProvider } from "./app-auth-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider
      session={session ?? undefined}
      refetchOnWindowFocus
      refetchInterval={5 * 60}
    >
      <AppAuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AppAuthProvider>
    </SessionProvider>
  );
}
