'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

/** Sign up with email and password. Returns { data, error }. */
export async function signUpWithEmail(
  supabase: SupabaseClient,
  email: string,
  password: string,
  metadata?: Record<string, any>
) {
  return supabase.auth.signUp({
    email,
    password,
    options: metadata ? { data: metadata } : undefined,
  });
}

/** Sign in with email and password. Returns { data, error }. */
export async function signInWithEmail(
  supabase: SupabaseClient,
  email: string,
  password: string
) {
  return supabase.auth.signInWithPassword({ email, password });
}

/** Sign out the current user. */
export async function signOutUser(supabase: SupabaseClient) {
  return supabase.auth.signOut();
}
