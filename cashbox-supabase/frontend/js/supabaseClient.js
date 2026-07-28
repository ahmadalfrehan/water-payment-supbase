// Fill these in from your Supabase project:
// Dashboard → Project Settings → API → "Project URL" and "anon public" key.
//
// The anon key is safe to put in frontend code — it's meant to be public.
// Real access control happens via the Row Level Security policies in
// database/supabase_schema.sql, not by hiding this key.

const SUPABASE_URL = "https://pqehgxybeboulrkijwpj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ld157QnPQyPAjzJOaiweBQ_qF2jdgh_";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
