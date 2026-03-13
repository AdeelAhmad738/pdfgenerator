import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = "https://gcxmfwvuqbykpghebdfn.supabase.co"
export const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjeG1md3Z1cWJ5a3BnaGViZGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTcwMzEsImV4cCI6MjA4NzU3MzAzMX0.YMyVcs50KvtdysrEfu3NfBmnWQ0X2Q954R-9qvEPDro"

export const supabase = createClient(supabaseUrl, supabaseKey)
