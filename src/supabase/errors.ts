'use client';

import { getSupabaseClient } from '@/supabase/client';

type SecurityRuleContext = {
  table: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  data?: any;
};

interface SupabaseAuthObject {
  uid: string;
  email: string | null;
}

interface SecurityRuleRequest {
  auth: SupabaseAuthObject | null;
  method: string;
  table: string;
  resource?: { data: any };
}

function buildAuthObject(): SupabaseAuthObject | null {
  try {
    // Synchronously get from local storage cache if available
    const supabase = getSupabaseClient();
    // Note: getSession is async; for error context we use a best-effort approach
    const stored = Object.keys(localStorage || {}).find(k => k.includes('supabase.auth.token'));
    if (stored) {
      const parsed = JSON.parse(localStorage.getItem(stored) || '{}');
      const user = parsed?.currentSession?.user;
      if (user) return { uid: user.id, email: user.email ?? null };
    }
  } catch {
    // Ignore — may run in SSR or without localStorage
  }
  return null;
}

function buildRequestObject(context: SecurityRuleContext): SecurityRuleRequest {
  return {
    auth: buildAuthObject(),
    method: context.operation,
    table: `public.${context.table}`,
    resource: context.data ? { data: context.data } : undefined,
  };
}

function buildErrorMessage(req: SecurityRuleRequest): string {
  return `Missing or insufficient permissions: The following request was denied by Supabase RLS:\n${JSON.stringify(req, null, 2)}`;
}

/**
 * Custom error class for Supabase RLS permission errors.
 * Drop-in replacement for FirestorePermissionError.
 */
export class SupabasePermissionError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext) {
    const req = buildRequestObject(context);
    super(buildErrorMessage(req));
    this.name = 'SupabasePermissionError';
    this.request = req;
  }
}
