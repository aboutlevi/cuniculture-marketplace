import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://iazefyiwaibowglwbldm.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_CSi0nBVALlkix5WrBD0bOA_0pBZCsWO'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
