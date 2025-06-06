// lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// These environment variables must be set in your .env or Vercel project settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Named export to support modular imports
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
