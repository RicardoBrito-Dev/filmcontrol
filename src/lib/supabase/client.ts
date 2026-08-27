import { createBrowserClient } from '@supabase/ssr'

const DEFAULT_SUPABASE_URL = 'https://jkqvyudttonrdmsmyabx.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXZ5dWR0dG9ucmRtc215YWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3ODk2NjYsImV4cCI6MjEwMzM2NTY2Nn0.KmmhGpUh869NZOG5ANCdKWZyuF4aj38nwHDYq3tfNnA'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

  return createBrowserClient(url, key)
}
