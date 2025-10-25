// frontend/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hvybwicevmfuozjpixyx.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)
