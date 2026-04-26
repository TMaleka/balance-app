import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config/environment';

export const supabase = createClient(
  SUPABASE_CONFIG.url || 'https://placeholder.supabase.co',
  SUPABASE_CONFIG.anonKey || 'placeholder'
);
