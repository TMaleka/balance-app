-- =====================================================
-- ADD LOYALTY INTEGRATION TO EXPENSES TABLE
-- =====================================================
-- This migration adds fields to link expenses with loyalty transactions

-- Add loyalty tracking columns to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS loyalty_transaction_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_loyalty_purchase BOOLEAN DEFAULT false;

-- Create index for loyalty transaction lookups
CREATE INDEX IF NOT EXISTS idx_expenses_loyalty_transaction 
ON expenses(loyalty_transaction_id) 
WHERE loyalty_transaction_id IS NOT NULL;

-- Create index for filtering loyalty purchases
CREATE INDEX IF NOT EXISTS idx_expenses_is_loyalty 
ON expenses(is_loyalty_purchase) 
WHERE is_loyalty_purchase = true;

-- Add foreign key constraint (optional, for data integrity)
-- Note: This assumes loyalty_transactions.id is an integer
-- If it's a different type, adjust accordingly
-- ALTER TABLE expenses 
-- ADD CONSTRAINT fk_expenses_loyalty_transaction 
-- FOREIGN KEY (loyalty_transaction_id) 
-- REFERENCES loyalty_transactions(id) 
-- ON DELETE SET NULL;

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- View all loyalty-linked expenses
-- SELECT e.*, lt.partner_id, lt.points_earned
-- FROM expenses e
-- JOIN loyalty_transactions lt ON e.loyalty_transaction_id = lt.id::text
-- WHERE e.is_loyalty_purchase = true
-- ORDER BY e.created_at DESC;

-- View expenses by source (manual vs loyalty)
-- SELECT 
--   is_loyalty_purchase,
--   COUNT(*) as count,
--   SUM(amount) as total_amount
-- FROM expenses
-- GROUP BY is_loyalty_purchase;

-- Find expenses without matching loyalty transactions (data integrity check)
-- SELECT * FROM expenses
-- WHERE is_loyalty_purchase = true 
-- AND loyalty_transaction_id NOT IN (SELECT id::text FROM loyalty_transactions);
