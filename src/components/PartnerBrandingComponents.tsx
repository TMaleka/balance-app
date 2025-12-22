import React from 'react';
import { Store, Gift } from 'lucide-react';
import { getPartnerBranding, getCategoryConfig, getPartnerLogoStyle } from '../utils/partnerBranding';

/**
 * Partner Logo Component
 */
export function PartnerLogo({ 
  partnerId, 
  size = 'md',
  showName = false 
}: { 
  partnerId: string; 
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}) {
  const { branding, sizeClasses, iconSize, containerStyle, iconStyle } = getPartnerLogoStyle(partnerId, size);
  
  if (!branding) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-gray-100 ${sizeClasses}`}>
        <Store className={`text-gray-400 ${iconSize}`} />
      </div>
    );
  }

  const IconComponent = branding.icon;

  return (
    <div className="space-x-3">
      <div 
        className={`flex items-center justify-center rounded-lg ${sizeClasses}`}
        style={containerStyle}
      >
        <IconComponent 
          className={iconSize}
          style={iconStyle}
        />
      </div>
      {showName && (
        <div>
          <p className="font-medium">{branding.displayName}</p>
          <p className="nedbank-text-small">{getCategoryConfig(branding.category).name}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Category Badge Component
 */
export function CategoryBadge({ category }: { category: string }) {
  const config = getCategoryConfig(category);
  const IconComponent = config.icon;
  
  return (
    <div 
      className="inline-space-x-1 px-2 py-1 rounded-full text-xs font-medium"
      style={{ 
        backgroundColor: config.backgroundColor,
        color: config.color
      }}
    >
      <IconComponent className="w-3 h-3" />
      <span>{config.name}</span>
    </div>
  );
}

/**
 * Points Multiplier Badge Component
 */
export function PointsMultiplierBadge({ 
  pointsRate, 
  partnerId 
}: { 
  pointsRate: number; 
  partnerId: string;
}) {
  const branding = getPartnerBranding(partnerId);
  
  return (
    <div 
      className="inline-space-x-1 px-2 py-1 rounded-full text-xs font-bold"
      style={{ 
        backgroundColor: branding?.primaryColor || '#6B7280',
        color: 'white'
      }}
    >
      <Gift className="w-3 h-3" />
      <span>{pointsRate}x Points</span>
    </div>
  );
}

