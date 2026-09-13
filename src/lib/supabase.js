import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dxgmsejxoznzpncpcxyh.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_fh-ioqimTmDpiiuvff3kcg_mYQE9Ko_'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)