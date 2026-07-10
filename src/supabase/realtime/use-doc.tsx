'use client';

import { useState, useEffect, useRef } from 'react';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { useSupabaseClient } from '@/supabase/provider';

type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: Error | null;
}

export interface DocOptions {
  table: string;
  id: string | null | undefined;
  /** Enable Supabase Realtime subscription */
  realtime?: boolean;
}

/**
 * React hook to subscribe to a single Supabase row by id.
 * Replaces Firestore useDoc/onSnapshot pattern.
 */
export function useDoc<T = any>(
  options: DocOptions | null | undefined
): UseDocResult<T> {
  const supabase = useSupabaseClient();
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const optionsKey = options ? JSON.stringify(options) : null;

  useEffect(() => {
    if (!options || !options.id) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const { table, id, realtime } = options;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const { data: row, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Row not found
          setData(null);
        } else {
          setError(new Error(fetchError.message));
          setData(null);
        }
      } else {
        setData(row as WithId<T>);
      }
      setIsLoading(false);
    };

    fetchData();

    if (realtime) {
      channelRef.current = supabase
        .channel(`realtime:${table}:${id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: `id=eq.${id}` },
          () => { fetchData(); }
        )
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  return { data, isLoading, error };
}
