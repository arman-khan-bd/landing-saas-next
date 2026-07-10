'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/supabase/error-emitter';
import { SupabasePermissionError } from '@/supabase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It throws any received error to be caught by Next.js's global-error.tsx.
 */
export function SupabaseErrorListener() {
  const [error, setError] = useState<SupabasePermissionError | null>(null);

  useEffect(() => {
    const handleError = (error: SupabasePermissionError) => {
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  if (error) {
    throw error;
  }

  return null;
}

// Keep backward-compatible alias
export { SupabaseErrorListener as FirebaseErrorListener };
