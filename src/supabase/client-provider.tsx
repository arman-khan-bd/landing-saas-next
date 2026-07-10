'use client';

import React, { useMemo, type ReactNode } from 'react';
import { SupabaseProvider } from '@/supabase/provider';
import { getSupabaseClient } from '@/supabase/client';

interface SupabaseClientProviderProps {
  children: ReactNode;
}

/**
 * Initializes the Supabase browser client once and wraps children
 * in the SupabaseProvider context.
 *
 * Drop-in replacement for FirebaseClientProvider.
 */
export function SupabaseClientProvider({ children }: SupabaseClientProviderProps) {
  const supabase = useMemo(() => getSupabaseClient(), []);

  return (
    <SupabaseProvider supabase={supabase}>
      {children}
    </SupabaseProvider>
  );
}
