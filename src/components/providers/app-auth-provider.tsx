"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { signOut as nextAuthSignOut, useSession } from "next-auth/react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export type AppAuthUser = {
  email: string | null;
  name: string | null;
  image: string | null;
  source: "nextauth" | "supabase";
};

type AppAuthContextValue = {
  user: AppAuthUser | null;
  loading: boolean;
  signOutAll: () => Promise<void>;
};

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

function mapSupabaseUser(u: SupabaseUser): AppAuthUser {
  const meta = u.user_metadata as Record<string, string | undefined> | undefined;
  return {
    email: u.email ?? null,
    name: (meta?.full_name as string | undefined) ?? u.email ?? null,
    image: (meta?.avatar_url as string | undefined) ?? null,
    source: "supabase",
  };
}

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [supabaseUser, setSupabaseUser] = useState<AppAuthUser | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      setSupabaseUser(data.session?.user ? mapSupabaseUser(data.session.user) : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSupabaseUser(sess?.user ? mapSupabaseUser(sess.user) : null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AppAuthContextValue>(() => {
    const loading = status === "loading";
    if (session?.user?.email || session?.user?.name) {
      return {
        user: {
          email: session.user.email ?? null,
          name: session.user.name ?? null,
          image: session.user.image ?? null,
          source: "nextauth",
        },
        loading,
        signOutAll: async () => {
          await nextAuthSignOut({ redirect: false });
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.signOut();
        },
      };
    }
    if (supabaseUser) {
      return {
        user: supabaseUser,
        loading,
        signOutAll: async () => {
          await nextAuthSignOut({ redirect: false });
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.signOut();
        },
      };
    }
    return {
      user: null,
      loading,
      signOutAll: async () => {
        await nextAuthSignOut({ redirect: false });
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signOut();
      },
    };
  }, [session?.user, status, supabaseUser]);

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function useAppAuth() {
  const ctx = useContext(AppAuthContext);
  if (!ctx) {
    throw new Error("useAppAuth must be used within AppAuthProvider");
  }
  return ctx;
}
