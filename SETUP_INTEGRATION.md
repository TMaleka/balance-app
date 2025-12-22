# Quick Setup Guide: Loyalty-Expense Integration

## Step 1: Apply Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add loyalty tracking columns to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS loyalty_transaction_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_loyalty_purchase BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_loyalty_transaction 
ON expenses(loyalty_transaction_id) 
WHERE loyalty_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_is_loyalty 
ON expenses(is_loyalty_purchase) 
WHERE is_loyalty_purchase = true;
```

## Step 2: Verify Installation

Check that the new columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND column_name IN ('loyalty_transaction_id', 'is_loyalty_purchase');
```

Expected output:
```
column_name              | data_type
-------------------------|-----------
loyalty_transaction_id   | character varying
is_loyalty_purchase      | boolean
```

## Step 3: Test the Integration

### Option A: Using Existing Test Data

If you have test partners and API keys set up:

```typescript
// In your browser console or test file
import { processPartnerTransaction } from './src/api/partnerTransactions';

const testTransaction = {
  partnerId: 'ptr_checkers_01',
  apiKey: 'YOUR_API_KEY_HERE', // Get from partner_api_keys table
  cardId: 'YOUR_CARD_ID_HERE', // Your test user's card_id
  saleAmount: 50.00,
  transactionId: 'TEST_' + Date.now(),
  timestamp: new Date().toISOString()
};

const result = await processPartnerTransaction(testTransaction);
console.log('Transaction result:', result);
```

### Option B: Manual Database Test

Insert a test loyalty transaction and see if expense is created:

```sql
-- 1. Get your user's card_id
SELECT id, card_id, points_balance FROM users WHERE email = 'your@email.com';

-- 2. Insert a test loyalty transaction
INSERT INTO loyalty_transactions (
  transaction_id, user_id, partner_id, card_id, 
  sale_amount, points_earned, transaction_timestamp, status
) VALUES (
  'TEST_' || NOW()::text,
  'YOUR_USER_ID',
  'ptr_checkers_01',
  'YOUR_CARD_ID',
  75.50,
  151,
  NOW(),
  'completed'
);

-- 3. Check if expense was created (it won't be via SQL insert - needs API)
-- This is just to verify the schema is ready
```

## Step 4: Verify in UI

1. **Open the app** and log in
2. **Navigate to Expense Overview** tab
3. **Scan your loyalty card** at a test merchant (or simulate via API)
4. **Check the category** that matches the merchant type
5. **Look for the blue "Loyalty" badge** on the expense

## Step 5: Monitor Logs

Watch the browser console for these messages:

✅ **Success:**
```
✅ Created expense record for Checkers: R125.50 in Groceries
```

⚠️ **Warnings (non-critical):**
```
No matching budget category found for partner category: grocery
User has no budget categories, skipping expense creation
```

❌ **Errors:**
```
Error creating expense: [error details]
```

## Rollback (if needed)

If you need to undo the changes:

```sql
-- Remove the new columns
ALTER TABLE expenses 
DROP COLUMN IF EXISTS loyalty_transaction_id,
DROP COLUMN IF EXISTS is_loyalty_purchase;

-- Drop the indexes
DROP INDEX IF EXISTS idx_expenses_loyalty_transaction;
DROP INDEX IF EXISTS idx_expenses_is_loyalty;
```

## Troubleshooting

### Issue: Expenses not being created

**Solution 1:** Ensure user has budget categories
```sql
SELECT * FROM budgets WHERE user_id = 'YOUR_USER_ID';
```
If empty, complete the onboarding flow to create default categories.

**Solution 2:** Check category names match
- Partner category: `grocery`
- User needs a budget with name containing: "Groceries", "Food", "Supermarket", etc.

### Issue: Wrong category selected

Edit the mapping in `src/config/partnerCategoryMapping.ts`:

```typescript
{
  partnerCategory: 'grocery',
  defaultBudgetCategory: 'Groceries',
  alternativeNames: ['groceries', 'food', 'supermarket', 'YOUR_CUSTOM_NAME']
}
```

## Next Steps

- ✅ Integration is complete and ready to use
- 📖 Read `LOYALTY_EXPENSE_INTEGRATION.md` for detailed documentation
- 🧪 Test with various partner types (grocery, fuel, restaurant, etc.)
- 📊 Monitor expense tracking accuracy
- 🎨 Customize category mappings if needed

## Support

Check these files for more information:
- `LOYALTY_EXPENSE_INTEGRATION.md` - Full documentation
- `database/add_loyalty_to_expenses.sql` - Database migration
- `src/config/partnerCategoryMapping.ts` - Category mapping logic
- `src/api/partnerTransactions.ts` - Integration code
