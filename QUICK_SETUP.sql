-- Quick Database Setup for Balance App Loyalty System
-- Copy and paste this into Supabase SQL Editor

-- First, create the users table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- Profile columns
  full_name VARCHAR(255),
  phone_number VARCHAR(15),
  -- Loyalty system columns
  card_id VARCHAR(20) UNIQUE,
  points_balance INTEGER DEFAULT 0,
  loyalty_activated BOOLEAN DEFAULT false,
  loyalty_created_at TIMESTAMP
);

-- Create index for card_id lookups
CREATE INDEX IF NOT EXISTS idx_users_card_id ON users(card_id);

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  partner_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  points_rate DECIMAL(4,2) NOT NULL,
  logo_url TEXT,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for partners
CREATE INDEX IF NOT EXISTS idx_partners_partner_id ON partners(partner_id);
CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(is_active);

-- Create loyalty transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id VARCHAR(20) NOT NULL REFERENCES partners(partner_id),
  card_id VARCHAR(20) NOT NULL,
  sale_amount DECIMAL(10,2) NOT NULL,
  points_earned INTEGER NOT NULL,
  transaction_timestamp TIMESTAMP NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'completed',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_card_id ON loyalty_transactions(card_id);

-- Insert sample partners
INSERT INTO partners (partner_id, name, display_name, points_rate, category) VALUES
('ptr_checkers_01', 'Checkers', 'Checkers', 2.00, 'grocery'),
('ptr_shoprite_01', 'Shoprite', 'Shoprite', 1.50, 'grocery'),
('ptr_shell_01', 'Shell', 'Shell', 3.00, 'fuel'),
('ptr_kfc_01', 'KFC', 'KFC', 4.00, 'restaurant')
ON CONFLICT (partner_id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Everyone can view partners" ON partners FOR SELECT USING (true);
CREATE POLICY "Users can view own transactions" ON loyalty_transactions FOR ALL USING (auth.uid() = user_id);
