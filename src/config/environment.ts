/**
 * Environment Configuration
 * Centralizes all environment variables and provides fallbacks
 */

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://qmyznjnfweolvgwiqqak.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFteXpuam5md2VvbHZnd2lxcWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjY0ODQsImV4cCI6MjA3NDc0MjQ4NH0.GlUUAxlMh9pb8pC4da48NZck91VbBLGiXAUR3QskJZc'
};

// Partner API Keys (for testing)
export const TEST_API_KEYS = {
  'ptr_checkers_01': import.meta.env.VITE_TEST_API_KEY_CHECKERS || 'test_api_key_123',
  'ptr_shoprite_01': import.meta.env.VITE_TEST_API_KEY_SHOPRITE || 'test_api_key_456',
  'ptr_shell_01': import.meta.env.VITE_TEST_API_KEY_SHELL || 'test_api_key_789',
  'ptr_engen_01': import.meta.env.VITE_TEST_API_KEY_ENGEN || 'test_api_key_abc',
  'ptr_kfc_01': import.meta.env.VITE_TEST_API_KEY_KFC || 'test_api_key_def',
  'ptr_mcdonald_01': import.meta.env.VITE_TEST_API_KEY_MCDONALD || 'test_api_key_ghi'
};

// App Configuration
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Balance Loyalty',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0-beta',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
};

// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3')
};

// Feature Flags
export const FEATURE_FLAGS = {
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  enableTesting: import.meta.env.VITE_ENABLE_TESTING !== 'false',
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true' || APP_CONFIG.isDevelopment
};

// Validation
const validateConfig = () => {
  const errors: string[] = [];
  
  if (!SUPABASE_CONFIG.url) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!SUPABASE_CONFIG.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  if (errors.length > 0) {
    console.error('Environment configuration errors:', errors);
    if (APP_CONFIG.isProduction) {
      throw new Error(`Invalid environment configuration: ${errors.join(', ')}`);
    }
  }
};

// Validate on import
validateConfig();

// Helper function to get API key for partner
export const getPartnerApiKey = (partnerId: string): string => {
  return TEST_API_KEYS[partnerId as keyof typeof TEST_API_KEYS] || TEST_API_KEYS['ptr_checkers_01'];
};

// Export all config as default
export default {
  supabase: SUPABASE_CONFIG,
  app: APP_CONFIG,
  api: API_CONFIG,
  features: FEATURE_FLAGS,
  testApiKeys: TEST_API_KEYS,
  getPartnerApiKey
};
