/**
 * Environment Configuration
 * Centralizes all environment variables and provides fallbacks
 */

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
};

// Partner API Keys (for testing)
// Note: In production, these should be fetched from a secure backend API
export const TEST_API_KEYS = {
  'ptr_checkers_01': import.meta.env.VITE_TEST_API_KEY_CHECKERS || '',
  'ptr_shoprite_01': import.meta.env.VITE_TEST_API_KEY_SHOPRITE || '',
  'ptr_shell_01': import.meta.env.VITE_TEST_API_KEY_SHELL || '',
  'ptr_engen_01': import.meta.env.VITE_TEST_API_KEY_ENGEN || '',
  'ptr_kfc_01': import.meta.env.VITE_TEST_API_KEY_KFC || '',
  'ptr_mcdonald_01': import.meta.env.VITE_TEST_API_KEY_MCDONALD || ''
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

// Validation - log errors but don't crash the app
export let envConfigErrors: string[] = [];

const validateConfig = () => {
  const errors: string[] = [];
  
  if (!SUPABASE_CONFIG.url) {
    errors.push('VITE_SUPABASE_URL is missing');
  }
  
  if (!SUPABASE_CONFIG.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is missing');
  }
  
  if (errors.length > 0) {
    console.error('Environment configuration errors:', errors);
    envConfigErrors = errors;
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
