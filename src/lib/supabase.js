import { createClient } from '@supabase/supabase-js'

// Para propósitos de desarrollo, dejamos estas variables de entorno en blanco o con placeholders si no hay Supabase aún.
// El usuario deberá configurar su archivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
