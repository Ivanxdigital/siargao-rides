import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

// Create a single supabase client for interacting with your database
export const supabase = createClientComponentClient<Database>()

// Export the URL for use in other parts of the app
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL 