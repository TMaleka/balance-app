import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config/environment';

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
