// backend/supabaseClient.js
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Supabase service key kullanıyoruz (backend için)
const supabaseUrl = "https://hvybwicevmfuozjpixyx.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
