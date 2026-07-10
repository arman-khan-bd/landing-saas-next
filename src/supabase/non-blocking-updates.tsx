'use client';

import { getSupabaseClient } from '@/supabase/client';
import { errorEmitter } from '@/supabase/error-emitter';
import { SupabasePermissionError } from '@/supabase/errors';

const supabase = getSupabaseClient();

/**
 * Upsert (insert or replace) a row in a table.
 * Non-blocking — does NOT await internally.
 */
export function setRowNonBlocking(table: string, data: Record<string, any>) {
  supabase.from(table).upsert(data).then(({ error }: { error: any }) => {
    if (error) {
      errorEmitter.emit(
        'permission-error',
        new SupabasePermissionError({ table, operation: 'write', data })
      );
    }
  });
}

/**
 * Insert a new row into a table.
 * Returns a Promise for the new row, but typically not awaited by caller.
 */
export function addRowNonBlocking(table: string, data: Record<string, any>) {
  return supabase.from(table).insert(data).select().single().then(({ data: row, error }: { data: any; error: any }) => {
    if (error) {
      errorEmitter.emit(
        'permission-error',
        new SupabasePermissionError({ table, operation: 'create', data })
      );
    }
    return row;
  });
}

/**
 * Update a row by id.
 * Non-blocking — does NOT await internally.
 */
export function updateRowNonBlocking(
  table: string,
  id: string,
  data: Record<string, any>
) {
  supabase.from(table).update(data).eq('id', id).then(({ error }: { error: any }) => {
    if (error) {
      errorEmitter.emit(
        'permission-error',
        new SupabasePermissionError({ table, operation: 'update', data })
      );
    }
  });
}

/**
 * Delete a row by id.
 * Non-blocking — does NOT await internally.
 */
export function deleteRowNonBlocking(table: string, id: string) {
  supabase.from(table).delete().eq('id', id).then(({ error }: { error: any }) => {
    if (error) {
      errorEmitter.emit(
        'permission-error',
        new SupabasePermissionError({ table, operation: 'delete' })
      );
    }
  });
}
