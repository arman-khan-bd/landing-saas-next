'use client';

import { useState, useEffect, useRef } from 'react';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { useSupabaseClient } from '@/supabase/provider';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
}

export interface CollectionOptions {
  /** Supabase table name */
  table: string;
  /** Optional: column=value filter e.g. { owner_id: uid } */
  filters?: Record<string, any>;
  /** Optional: column to order by */
  orderBy?: { column: string; ascending?: boolean };
  /** Enable Supabase Realtime subscription */
  realtime?: boolean;
}

/**
 * React hook to subscribe to a Supabase table — with optional real-time updates.
 * Replaces Firestore useCollection.
 */
export function useCollection<T = any>(
  options: CollectionOptions | null | undefined
): UseCollectionResult<T> {
  const supabase = useSupabaseClient();
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const optionsKey = options ? JSON.stringify(options) : null;

  useEffect(() => {
    if (!options) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const { table, filters, orderBy, realtime } = options;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      let query = supabase.from(table).select('*');

      if (filters) {
        for (const [col, val] of Object.entries(filters)) {
          query = query.eq(col, val);
        }
      }
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      const { data: rows, error: fetchError } = await query;
      if (fetchError) {
        setError(new Error(fetchError.message));
        setData(null);
      } else {
        setData((rows ?? []) as WithId<T>[]);
      }
      setIsLoading(false);
    };

    fetchData();

    // Real-time subscription
    if (realtime) {
      channelRef.current = supabase
        .channel(`realtime:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          fetchData();
        })
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
