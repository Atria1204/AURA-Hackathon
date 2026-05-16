import { createClient } from '@supabase/supabase-js';

// Variabel ini dibaca dari file .env di root /frontend
// Pastikan prefix VITE_ agar Vite meng-expose ke browser
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.error(
    '[A.U.R.A] Supabase URL/Key belum dikonfigurasi. ' +
    'Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di frontend/.env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon);
