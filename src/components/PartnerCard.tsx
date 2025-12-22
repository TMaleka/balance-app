import React from 'react';
import { Star, TrendingUp, MapPin } from 'lucide-react';
import { 
  getPartnerBranding,
  getPartnerCardStyle 
} from '../utils/partnerBranding';
import { 
  PartnerLogo, 
  CategoryBadge, 
  PointsMultiplierBadge
} from './PartnerBrandingComponents';

interface PartnerCardProps {
  partnerId: string;
  displayName: string;
  category: string;
  pointsRate: number;
  isActive?: boolean;
  onClick?: () => void;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function PartnerCard({
  partnerId,
  displayName,
  category,
  pointsRate,
  isActive = true,
  onClick,
  showDetails = false,
  size = 'md'
}: PartnerCardProps) {
  const branding = getPartnerBranding(partnerId);
  const cardStyle = getPartnerCardStyle(partnerId);
  
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div
      className={`rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
        onClick ? 'hover:scale-105' : ''
      } ${sizeClasses[size]} ${
        isActive ? 'opacity-100' : 'opacity-60'
      }`}
      style={{
        backgroundColor: cardStyle.backgroundColor,
        borderColor: cardStyle.borderColor
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="items-startmb-3">
        <PartnerLogo partnerId={partnerId} size={size} showName={size !== 'sm'} />
        
        {isActive && (
          <div className="items-end space-y-1">
            <PointsMultiplierBadge pointsRate={pointsRate} partnerId={partnerId} />
            {size !== 'sm' && (
              <div className="space-x-1 nedbank-text-small">
                <Star className="w-3 h-3 fill-current text-yellow-400" />
                <span>Active</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {size !== 'sm' && (
        <div className="space-y-2">
          {/* Category */}
          <CategoryBadge category={category} />
          
          {/* Description */}
          {branding && showDetails && (
            <p className="nedbank-text-small leading-relaxed">
              {branding.description}
            </p>
          )}
          
          {/* Earnings Info */}
          <div className="text-sm">
            <span className="">Earn per R1 spent:</span>
            <span 
              className="font-bold"
              style={{ color: cardStyle.accentColor }}
            >
              {pointsRate} points
            </span>
          </div>
          
          {/* Additional Info for large cards */}
          {size === 'lg' && showDetails && (
            <div className="pt-3-t border-gray-200 space-y-2">
              <div className="space-x-2 nedbank-text-small">
                <MapPin className="w-3 h-3" />
                <span>Available nationwide</span>
              </div>
              <div className="space-x-2 nedbank-text-small">
                <TrendingUp className="w-3 h-3" />
                <span>Popular choice</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact partner nedbank-list item for dropdowns/lists
export function PartnerListItem({
  partnerId,
  displayName,
  category,
  pointsRate,
  isSelected = false,
  onClick
}: {
  partnerId: string;
  displayName: string;
  category: string;
  pointsRate: number;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const cardStyle = getPartnerCardStyle(partnerId);
  
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
        isSelected 
          ? 'ring-2 ring-offset-2' 
          : 'hover:bg-gray-50'
      }`}
      style={{
        backgroundColor: isSelected ? cardStyle.backgroundColor : 'transparent',
        borderColor: isSelected ? cardStyle.accentColor : 'transparent',
        ringColor: isSelected ? cardStyle.accentColor : 'transparent'
      }}
      onClick={onClick}
    >
      <div className="space-x-3">
        <PartnerLogo partnerId={partnerId} size="sm" />
        <div>
          <p className="font-medium">{displayName}</p>
          <p className="nedbank-text-small">{pointsRate}x points per rand</p>
        </div>
      </div>
      
      <CategoryBadge category={category} />
    </div>
  );
}

