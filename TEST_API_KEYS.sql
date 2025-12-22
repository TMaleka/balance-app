-- Create test API keys for partner transaction testing
-- Run this in Supabase SQL Editor

-- Insert test API keys for each partner
INSERT INTO partner_api_keys (partner_id, api_key, key_name, is_active, expires_at) VALUES
('ptr_checkers_01', 'test_api_key_123', 'Test Key - Checkers', true, '2025-12-31 23:59:59'),
('ptr_shoprite_01', 'test_api_key_456', 'Test Key - Shoprite', true, '2025-12-31 23:59:59'),
('ptr_shell_01', 'test_api_key_789', 'Test Key - Shell', true, '2025-12-31 23:59:59'),
('ptr_engen_01', 'test_api_key_abc', 'Test Key - Engen', true, '2025-12-31 23:59:59'),
('ptr_kfc_01', 'test_api_key_def', 'Test Key - KFC', true, '2025-12-31 23:59:59'),
('ptr_mcdonald_01', 'test_api_key_ghi', 'Test Key - McDonalds', true, '2025-12-31 23:59:59')
ON CONFLICT (api_key) DO NOTHING;

-- Verify the keys were created
SELECT 
  pak.partner_id,
  pak.api_key,
  pak.key_name,
  p.display_name,
  p.points_rate
FROM partner_api_keys pak
JOIN partners p ON pak.partner_id = p.partner_id
WHERE pak.is_active = true
ORDER BY p.display_name;
