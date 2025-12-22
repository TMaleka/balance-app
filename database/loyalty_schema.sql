-- =====================================================
-- BALANCE APP - LOYALTY CARD SYSTEM DATABASE SCHEMA
-- =====================================================

-- Step 1: Extend users table for loyalty features
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS card_id VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS points_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(15),
ADD COLUMN IF NOT EXISTS loyalty_activated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS loyalty_created_at TIMESTAMP;

-- Create index for card_id lookups (critical for POS performance)
CREATE INDEX IF NOT EXISTS idx_users_card_id ON users(card_id);

-- Step 2: Partners table
CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  partner_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL, -- For user-facing display
  points_rate DECIMAL(4,2) NOT NULL, -- points per ZAR 1 (e.g., 2.00 = 2 points per R1)
  logo_url TEXT, -- Partner logo for UI
  category VARCHAR(50), -- grocery, fuel, restaurant, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for partner lookups
CREATE INDEX IF NOT EXISTS idx_partners_partner_id ON partners(partner_id);
CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(is_active);

-- Step 3: Loyalty transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(50) UNIQUE NOT NULL, -- Partner's transaction ID
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id VARCHAR(20) NOT NULL REFERENCES partners(partner_id),
  card_id VARCHAR(20) NOT NULL, -- Denormalized for faster lookups
  sale_amount DECIMAL(10,2) NOT NULL,
  points_earned INTEGER NOT NULL,
  transaction_timestamp TIMESTAMP NOT NULL, -- When the purchase happened
  processed_at TIMESTAMP DEFAULT NOW(), -- When we processed it
  status VARCHAR(20) DEFAULT 'completed', -- completed, pending, failed, reversed
  metadata JSONB, -- Store additional transaction data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for transaction queries
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_card_id ON loyalty_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_partner_id ON loyalty_transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_timestamp ON loyalty_transactions(transaction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_status ON loyalty_transactions(status);

-- Step 4: Partner API keys table
CREATE TABLE IF NOT EXISTS partner_api_keys (
  id SERIAL PRIMARY KEY,
  partner_id VARCHAR(20) NOT NULL REFERENCES partners(partner_id),
  api_key VARCHAR(64) UNIQUE NOT NULL,
  key_name VARCHAR(100), -- e.g., "Production Key", "Test Key"
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP, -- Optional expiration
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for API key lookups (critical for authentication)
CREATE INDEX IF NOT EXISTS idx_partner_api_keys_api_key ON partner_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_partner_api_keys_partner_active ON partner_api_keys(partner_id, is_active);

-- Step 5: Points redemptions table (for future use)
CREATE TABLE IF NOT EXISTS points_redemptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_redeemed INTEGER NOT NULL,
  redemption_type VARCHAR(50), -- discount, cashback, reward, etc.
  redemption_value DECIMAL(10,2), -- monetary value of redemption
  partner_id VARCHAR(20) REFERENCES partners(partner_id), -- if partner-specific
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_redemptions_user_id ON points_redemptions(user_id);

-- Step 6: Audit log for points changes
CREATE TABLE IF NOT EXISTS points_audit_log (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id VARCHAR(20) NOT NULL,
  points_change INTEGER NOT NULL, -- positive for earned, negative for redeemed
  points_balance_before INTEGER NOT NULL,
  points_balance_after INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- earned, redeemed, adjusted, expired
  reference_id VARCHAR(100), -- loyalty_transaction_id, redemption_id, etc.
  partner_id VARCHAR(20) REFERENCES partners(partner_id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_audit_user_id ON points_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_points_audit_card_id ON points_audit_log(card_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate unique card ID
CREATE OR REPLACE FUNCTION generate_card_id()
RETURNS VARCHAR(20) AS $$
DECLARE
  new_card_id VARCHAR(20);
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
  random_char VARCHAR(1);
BEGIN
  LOOP
    new_card_id := 'bal_usr_';
    
    -- Generate 8 random characters
    FOR i IN 1..8 LOOP
      random_char := substr(chars, floor(random() * length(chars) + 1)::integer, 1);
      new_card_id := new_card_id || random_char;
    END LOOP;
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE card_id = new_card_id) THEN
      RETURN new_card_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update points balance and create audit log
CREATE OR REPLACE FUNCTION update_user_points(
  p_user_id UUID,
  p_card_id VARCHAR(20),
  p_points_change INTEGER,
  p_transaction_type VARCHAR(50),
  p_reference_id VARCHAR(100) DEFAULT NULL,
  p_partner_id VARCHAR(20) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT points_balance INTO current_balance 
  FROM users 
  WHERE id = p_user_id;
  
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance + p_points_change;
  
  -- Prevent negative balance for redemptions
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient points balance. Current: %, Requested: %', current_balance, ABS(p_points_change);
  END IF;
  
  -- Update user balance
  UPDATE users 
  SET points_balance = new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Create audit log entry
  INSERT INTO points_audit_log (
    user_id, card_id, points_change, points_balance_before, 
    points_balance_after, transaction_type, reference_id, partner_id
  ) VALUES (
    p_user_id, p_card_id, p_points_change, current_balance,
    new_balance, p_transaction_type, p_reference_id, p_partner_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate card_id when user activates loyalty
CREATE OR REPLACE FUNCTION auto_generate_card_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if loyalty_activated is being set to true and card_id is null
  IF NEW.loyalty_activated = true AND OLD.loyalty_activated = false AND NEW.card_id IS NULL THEN
    NEW.card_id := generate_card_id();
    NEW.loyalty_created_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_card_id
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_card_id();

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample partners
INSERT INTO partners (partner_id, name, display_name, points_rate, category) VALUES
('ptr_checkers_01', 'Checkers', 'Checkers', 2.00, 'grocery'),
('ptr_shoprite_01', 'Shoprite', 'Shoprite', 1.50, 'grocery'),
('ptr_shell_01', 'Shell', 'Shell', 3.00, 'fuel'),
('ptr_engen_01', 'Engen', 'Engen', 2.50, 'fuel'),
('ptr_kfc_01', 'KFC', 'KFC', 4.00, 'restaurant'),
('ptr_mcdonald_01', 'McDonalds', 'McDonald''s', 3.50, 'restaurant')
ON CONFLICT (partner_id) DO NOTHING;

-- Generate API keys for partners
INSERT INTO partner_api_keys (partner_id, api_key, key_name) VALUES
('ptr_checkers_01', 'ck_live_' || encode(gen_random_bytes(24), 'hex'), 'Production Key'),
('ptr_shoprite_01', 'sr_live_' || encode(gen_random_bytes(24), 'hex'), 'Production Key'),
('ptr_shell_01', 'sh_live_' || encode(gen_random_bytes(24), 'hex'), 'Production Key'),
('ptr_engen_01', 'en_live_' || encode(gen_random_bytes(24), 'hex'), 'Production Key'),
('ptr_kfc_01', 'kfc_live_' || encode(gen_random_bytes(24), 'hex'), 'Production Key'),
('ptr_mcdonald_01', 'mc_live_' || encode(gen_random_bytes(24), 'hex'), 'Production Key')
ON CONFLICT (api_key) DO NOTHING;

-- =====================================================
-- USEFUL QUERIES FOR TESTING
-- =====================================================

-- View all partners with their API keys
-- SELECT p.partner_id, p.display_name, p.points_rate, pak.api_key 
-- FROM partners p 
-- JOIN partner_api_keys pak ON p.partner_id = pak.partner_id 
-- WHERE pak.is_active = true;

-- View user loyalty status
-- SELECT id, email, card_id, points_balance, loyalty_activated, loyalty_created_at 
-- FROM users 
-- WHERE loyalty_activated = true;

-- View transaction history for a user
-- SELECT lt.*, p.display_name as partner_name
-- FROM loyalty_transactions lt
-- JOIN partners p ON lt.partner_id = p.partner_id
-- WHERE lt.user_id = 'USER_ID_HERE'
-- ORDER BY lt.transaction_timestamp DESC;
