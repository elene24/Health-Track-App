// This file is now manually corrected to bypass .env issues
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcoded values to fix the "Uncaught Error: supabaseUrl is required"
const SUPABASE_URL = "https://uzhlnpmsnqzjrvkjafbi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGxucG1zbnF6anJ2a2phZmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzMxODgsImV4cCI6MjA4MjQwOTE4OH0.DX1jHm99p4fyRAJ69Pc7QDUbSZsCOJ-wch-7eu9eMSc";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});