import { getSupabaseClient } from '@/supabase/client';

/**
 * Convenience export for the Supabase browser client.
 * Use this anywhere you need direct Supabase access outside of React components.
 */
const supabase = getSupabaseClient();

export { supabase };
export default supabase;
