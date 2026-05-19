import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oeufwrtbbuvglosznxfr.supabase.co";
const SUPABASE_KEY = "sb_publishable_YDD6msqNKWfcFp4gGwjRkA_1MUoDI3E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
