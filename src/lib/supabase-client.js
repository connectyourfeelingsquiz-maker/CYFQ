import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client — uses anon key only
// Subject to Row Level Security policies
let supabaseClient = null;

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase client configuration');
  }

  supabaseClient = createClient(supabaseUrl, anonKey);
  return supabaseClient;
}
