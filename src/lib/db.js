import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
   // @ts-ignore
   import.meta.env.VITE_SUPABASE_URL,
   // @ts-ignore
   import.meta.env.VITE_SUPABASE_ANON_KEY
)
export default supabase