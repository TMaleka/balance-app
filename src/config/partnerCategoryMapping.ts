/**
 * Partner to Budget Category Mapping
 * Maps partner categories to user budget category names
 */

import { PartnerCategory } from '../types/loyalty';

export interface CategoryMapping {
  partnerCategory: PartnerCategory;
  defaultBudgetCategory: string;
  alternativeNames: string[]; // Alternative budget category names to match
}

/**
 * Default mapping from partner categories to budget categories
 * This will attempt to match user's budget categories intelligently
 */
export const PARTNER_CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    partnerCategory: 'grocery',
    defaultBudgetCategory: 'Groceries',
    alternativeNames: ['groceries', 'food', 'supermarket', 'food & groceries']
  },
  {
    partnerCategory: 'fuel',
    defaultBudgetCategory: 'Petrol & Transport',
    alternativeNames: ['petrol', 'transport', 'fuel', 'petrol & transport', 'travel', 'gas']
  },
  {
    partnerCategory: 'restaurant',
    defaultBudgetCategory: 'Takeaways',
    alternativeNames: ['takeaways', 'dining', 'food', 'restaurants', 'eating out', 'fast food']
  },
  {
    partnerCategory: 'retail',
    defaultBudgetCategory: 'Shopping',
    alternativeNames: ['shopping', 'retail', 'clothes', 'clothing', 'fashion']
  },
  {
    partnerCategory: 'pharmacy',
    defaultBudgetCategory: 'Health & Pharmacy',
    alternativeNames: ['pharmacy', 'health', 'medical', 'healthcare', 'medicine']
  },
  {
    partnerCategory: 'entertainment',
    defaultBudgetCategory: 'Entertainment',
    alternativeNames: ['entertainment', 'movies', 'cinema', 'fun', 'leisure']
  },
  {
    partnerCategory: 'other',
    defaultBudgetCategory: 'Other',
    alternativeNames: ['other', 'miscellaneous', 'misc']
  }
];

/**
 * Find the best matching budget category for a partner category
 * @param partnerCategory - The category from the partner (e.g., 'grocery', 'fuel')
 * @param userBudgetCategories - Array of user's budget category names
 * @returns The matched budget category name or null if no match found
 */
export function findMatchingBudgetCategory(
  partnerCategory: PartnerCategory,
  userBudgetCategories: string[]
): string | null {
  // Find the mapping for this partner category
  const mapping = PARTNER_CATEGORY_MAPPINGS.find(
    m => m.partnerCategory === partnerCategory
  );

  if (!mapping) {
    return null;
  }

  // Normalize user categories for comparison (lowercase, trim)
  const normalizedUserCategories = userBudgetCategories.map(cat => ({
    original: cat,
    normalized: cat.toLowerCase().trim()
  }));

  // First, try to match the default category name
  const defaultMatch = normalizedUserCategories.find(
    cat => cat.normalized === mapping.defaultBudgetCategory.toLowerCase()
  );
  if (defaultMatch) {
    return defaultMatch.original;
  }

  // Then, try alternative names
  for (const altName of mapping.alternativeNames) {
    const match = normalizedUserCategories.find(
      cat => cat.normalized === altName.toLowerCase() || 
            cat.normalized.includes(altName.toLowerCase())
    );
    if (match) {
      return match.original;
    }
  }

  // No match found
  return null;
}

/**
 * Get the default budget category name for a partner category
 * @param partnerCategory - The category from the partner
 * @returns The default budget category name
 */
export function getDefaultBudgetCategory(partnerCategory: PartnerCategory): string {
  const mapping = PARTNER_CATEGORY_MAPPINGS.find(
    m => m.partnerCategory === partnerCategory
  );
  return mapping?.defaultBudgetCategory || 'Other';
}
