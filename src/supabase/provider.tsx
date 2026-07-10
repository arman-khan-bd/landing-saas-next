'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
} from 'react';
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

// ─── Context Shape ───────────────────────────────────────────────────────────

export interface SupabaseContextState {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  isUserLoading: boolean;
  userError: Error | null;
}

const SupabaseContext = createContext<SupabaseContextState | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

interface SupabaseProviderProps {
  children: ReactNode;
  supabase: SupabaseClient;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({
  children,
  supabase,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setUserError(error);
      } else {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
      setIsUserLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsUserLoading(false);
        setUserError(null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const contextValue = useMemo<SupabaseContextState>(
    () => ({ supabase, user, session, isUserLoading, userError }),
    [supabase, user, session, isUserLoading, userError]
  );

  return (
    <SupabaseContext.Provider value={contextValue}>
      {children}
    </SupabaseContext.Provider>
  );
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Access the full Supabase context (client + auth state). */
export function useSupabase(): SupabaseContextState {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within a SupabaseProvider.');
  return ctx;
}

/** Access the Supabase client instance. */
export function useSupabaseClient(): SupabaseClient {
  return useSupabase().supabase;
}

/** Access the authenticated user. */
export function useUser() {
  const { user, isUserLoading, userError } = useSupabase();
  return { user, isUserLoading, userError };
}
