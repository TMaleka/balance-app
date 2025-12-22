/**
 * Partner Branding and Visual Identity System
 * Provides logos, colors, and styling for partner brands
 */

import { ShoppingCart, Fuel, Coffee, Utensils, Car, Store, Gift, CreditCard } from 'lucide-react';

export interface PartnerBranding {
  partnerId: string;
  displayName: string;
  category: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  icon: any; // Lucide icon component
  logoUrl?: string;
  description: string;
}

// Partner branding configuration
export const PARTNER_BRANDING: Record<string, PartnerBranding> = {
  'ptr_checkers_01': {
    partnerId: 'ptr_checkers_01',
    displayName: 'Checkers',
    category: 'grocery',
    primaryColor: '#E31837', // Checkers red
    secondaryColor: '#FFE5E8',
    backgroundColor: '#FFF5F6',
    textColor: '#8B0000',
    icon: ShoppingCart,
    description: 'South Africa\'s leading supermarket chain'
  },
  'ptr_shoprite_01': {
    partnerId: 'ptr_shoprite_01',
    displayName: 'Shoprite',
    category: 'grocery',
    primaryColor: '#FF6B35', // Shoprite orange
    secondaryColor: '#FFE5DB',
    backgroundColor: '#FFF8F5',
    textColor: '#CC4400',
    icon: ShoppingCart,
    description: 'Africa\'s largest food retailer'
  },
  'ptr_shell_01': {
    partnerId: 'ptr_shell_01',
    displayName: 'Shell',
    category: 'fuel',
    primaryColor: '#FFD320', // Shell yellow
    secondaryColor: '#FFF9E5',
    backgroundColor: '#FFFCF0',
    textColor: '#B8860B',
    icon: Fuel,
    description: 'Global energy and petrochemical company'
  },
  'ptr_engen_01': {
    partnerId: 'ptr_engen_01',
    displayName: 'Engen',
    category: 'fuel',
    primaryColor: '#E31837', // Engen red
    secondaryColor: '#FFE5E8',
    backgroundColor: '#FFF5F6',
    textColor: '#8B0000',
    icon: Fuel,
    description: 'Leading fuel and convenience retailer'
  },
  'ptr_kfc_01': {
    partnerId: 'ptr_kfc_01',
    displayName: 'KFC',
    category: 'restaurant',
    primaryColor: '#E4002B', // KFC red
    secondaryColor: '#FFE5EA',
    backgroundColor: '#FFF5F6',
    textColor: '#8B0000',
    icon: Utensils,
    description: 'World\'s second-largest restaurant chain'
  },
  'ptr_mcdonald_01': {
    partnerId: 'ptr_mcdonald_01',
    displayName: 'McDonald\'s',
    category: 'restaurant',
    primaryColor: '#FFC72C', // McDonald's yellow
    secondaryColor: '#FFF4D6',
    backgroundColor: '#FFFAF0',
    textColor: '#CC9900',
    icon: Utensils,
    description: 'World\'s largest restaurant chain'
  }
};

// Category configurations
export const CATEGORY_CONFIG = {
  grocery: {
    name: 'Grocery & Retail',
    color: '#10B981', // Green
    backgroundColor: '#ECFDF5',
    icon: ShoppingCart,
    description: 'Supermarkets and retail stores'
  },
  fuel: {
    name: 'Fuel & Energy',
    color: '#F59E0B', // Amber
    backgroundColor: '#FFFBEB',
    icon: Fuel,
    description: 'Petrol stations and energy services'
  },
  restaurant: {
    name: 'Food & Dining',
    color: '#EF4444', // Red
    backgroundColor: '#FEF2F2',
    icon: Utensils,
    description: 'Restaurants and food services'
  },
  retail: {
    name: 'Retail & Shopping',
    color: '#8B5CF6', // Purple
    backgroundColor: '#F5F3FF',
    icon: Store,
    description: 'General retail and shopping'
  },
  automotive: {
    name: 'Automotive',
    color: '#06B6D4', // Cyan
    backgroundColor: '#ECFEFF',
    icon: Car,
    description: 'Car services and automotive'
  }
};

/**
 * Get partner branding information
 */
export function getPartnerBranding(partnerId: string): PartnerBranding | null {
  return PARTNER_BRANDING[partnerId] || null;
}

/**
 * Get category configuration
 */
export function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.retail;
}

/**
 * Get all partners by category
 */
export function getPartnersByCategory(): Record<string, PartnerBranding[]> {
  const partnersByCategory: Record<string, PartnerBranding[]> = {};
  
  Object.values(PARTNER_BRANDING).forEach(partner => {
    if (!partnersByCategory[partner.category]) {
      partnersByCategory[partner.category] = [];
    }
    partnersByCategory[partner.category].push(partner);
  });
  
  return partnersByCategory;
}

/**
 * Get partner logo styling information
 */
export function getPartnerLogoStyle(partnerId: string, size: 'sm' | 'md' | 'lg' = 'md') {
  const branding = getPartnerBranding(partnerId);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return {
    branding,
    sizeClasses: sizeClasses[size],
    iconSize: iconSizes[size],
    containerStyle: branding ? {
      backgroundColor: branding.backgroundColor,
      border: `2px solid ${branding.secondaryColor}`
    } : {},
    iconStyle: branding ? { color: branding.primaryColor } : {}
  };
}

/**
 * Get partner card styling
 */
export function getPartnerCardStyle(partnerId: string) {
  const branding = getPartnerBranding(partnerId);
  
  if (!branding) {
    return {
      backgroundColor: '#F9FAFB',
      borderColor: '#E5E7EB',
      accentColor: '#6B7280'
    };
  }
  
  return {
    backgroundColor: branding.backgroundColor,
    borderColor: branding.secondaryColor,
    accentColor: branding.primaryColor
  };
}
