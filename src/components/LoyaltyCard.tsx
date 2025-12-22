import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { QrCode, RefreshCw, AlertCircle, Star } from 'lucide-react';
import QRCode from 'react-qr-code';
import { getUserLoyaltyCard } from '../utils/loyaltyCardUtils';
import { supabase } from '../supabaseClient';
import LoyaltyActivation from './LoyaltyActivation';
import { useNotificationHelpers } from './NotificationSystem';
import { safeAsync } from '../utils/errorHandling';
import { cacheLoyaltyData, getCachedLoyaltyData, invalidateUserCache } from '../utils/caching';
import { usePerformanceMonitor } from '../utils/performance';
import JsBarcode from 'jsbarcode';

interface LoyaltyCardProps {
  // No props needed - will fetch user data automatically
}

export default function LoyaltyCard({}: LoyaltyCardProps) {
  const [showQR, setShowQR] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyCardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { showError, showSuccess } = useNotificationHelpers();
  const { measure } = usePerformanceMonitor('LoyaltyCard');
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadUserLoyaltyData();

    // Listen for points updates from redemption
    const handlePointsUpdate = () => {
      loadUserLoyaltyData(true);
    };

    window.addEventListener('loyaltyPointsUpdated', handlePointsUpdate);
    
    return () => {
      window.removeEventListener('loyaltyPointsUpdated', handlePointsUpdate);
    };
  }, []);

  // Generate barcode when card ID changes
  useEffect(() => {
    if (barcodeRef.current && loyaltyData?.cardId) {
      try {
        JsBarcode(barcodeRef.current, loyaltyData.cardId, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [loyaltyData?.cardId]);

  const handleRefresh = useCallback(() => {
    loadUserLoyaltyData(true);
  }, []);

  const loadUserLoyaltyData = useCallback(async (forceRefresh = false) => {
    return measure(async () => {
      setLoading(true);
      setError(null);

      const result = await safeAsync(async () => {
        // Get current user
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw new Error(`Authentication error: ${authError.message}`);
        }
        
        if (!currentUser) {
          throw new Error('Please log in to view your loyalty nedbank-card');
        }

        setUser(currentUser);

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
          const cachedData = getCachedLoyaltyData<LoyaltyCardType>(currentUser.id);
          if (cachedData) {
            console.log('🚀 Using cached loyalty data');
            return cachedData;
          }
        }

        // Add a small delay if this is a refresh after activation to ensure DB is updated
        if (forceRefresh) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Invalidate cache on force refresh
          invalidateUserCache(currentUser.id);
        }

        // Get user's loyalty nedbank-card data from database
        const loyaltyCard = await getUserLoyaltyCard(currentUser.id);
        
        if (!loyaltyCard) {
          throw new Error('Unable to load loyalty nedbank-card data');
        }

        // Cache the result for 5 minutes
        cacheLoyaltyData(currentUser.id, loyaltyCard, 5 * 60 * 1000);

        return loyaltyCard;
      }, undefined, 'loadUserLoyaltyData');

      setLoading(false);

      if (result) {
        setLoyaltyData(result);
        setRetryCount(0); // Reset retry count on success
        
        if (forceRefresh) {
          showSuccess('Loyalty Card Updated', 'Your points balance has been refreshed');
        }
      } else {
        setError('Failed to load loyalty nedbank-card data');
        
        // Only show error notification if this isn't the initial load
        if (retryCount > 0) {
          showError('Loading Failed', 'Unable to load your loyalty nedbank-card. Please try again.');
        }
      }
    });
  }, [measure, retryCount, showError, showSuccess]);

  const formatCardId = useCallback((id: string) => {
    // Format: bal usr ABC1 2345
    const parts = id.split('_');
    if (parts.length === 3) {
      const suffix = parts[2];
      return `${parts[0]} ${parts[1]} ${suffix.substring(0, 4)} ${suffix.substring(4)}`;
    }
    return id;
  }, []);

  const formatPoints = useCallback((points: number) => {
    return points.toLocaleString();
  }, []);

  // Memoize formatted values
  const formattedCardId = useMemo(() => {
    return loyaltyData?.cardId ? formatCardId(loyaltyData.cardId) : '';
  }, [loyaltyData?.cardId, formatCardId]);

  const formattedPoints = useMemo(() => {
    return loyaltyData?.pointsBalance ? formatPoints(loyaltyData.pointsBalance) : '0';
  }, [loyaltyData?.pointsBalance, formatPoints]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadUserLoyaltyData();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="amex-card">
        <div className="amex-text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--amex-blue)] border-t-transparent mx-auto"></div>
          <p className="amex-mt-2">Loading your loyalty card...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="amex-card">
        <div className="amex-text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="amex-card-title amex-mb-2">Unable to Load Card</h3>
          <p className="amex-card-subtitle amex-mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="amex-btn amex-btn-primary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show activation needed state
  if (!loyaltyData?.loyaltyActivated && user) {
    return (
      <LoyaltyActivation 
        userId={user.id} 
        onActivationComplete={(cardId) => {
          console.log('Activation completed, refreshing data...', cardId);
          // Force refresh with delay to ensure DB is updated
          loadUserLoyaltyData(true);
        }} 
      />
    );
  }

  // Extract real data with fallbacks
  const cardId = loyaltyData?.cardId || 'Not activated';
  const pointsBalance = loyaltyData?.pointsBalance || 0;
  const phoneNumber = loyaltyData?.phoneNumber || 'Not provided';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';

  return (
    <div className="amex-content">
      {/* Balance Loyalty Card */}
      <div className="amex-account-card" style={{ marginBottom: 'var(--amex-space-4)' }}>
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--amex-space-4)' }}>
          <div>
            <svg
              width={60}
              height={60}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="50" r="48" fill="url(#balanceGradient)" />
              <g transform="translate(15, 20) scale(1.4)">
                <rect x="23" y="0" width="4" height="35" fill="white" opacity="0.9" />
                <rect x="15" y="35" width="20" height="3" rx="1.5" fill="white" opacity="0.9" />
                <line x1="10" y1="15" x2="20" y2="15" stroke="white" strokeWidth="2.5" opacity="0.9" />
                <line x1="15" y1="15" x2="15" y2="10" stroke="white" strokeWidth="2.5" opacity="0.9" />
                <ellipse cx="15" cy="17" rx="8" ry="3" fill="white" opacity="0.8" />
                <line x1="30" y1="15" x2="40" y2="15" stroke="white" strokeWidth="2.5" opacity="0.9" />
                <line x1="35" y1="15" x2="35" y2="10" stroke="white" strokeWidth="2.5" opacity="0.9" />
                <ellipse cx="35" cy="17" rx="8" ry="3" fill="white" opacity="0.8" />
                <line x1="10" y1="10" x2="40" y2="10" stroke="white" strokeWidth="3" opacity="0.9" />
                <line x1="25" y1="10" x2="25" y2="5" stroke="white" strokeWidth="2.5" opacity="0.9" />
                <circle cx="25" cy="3" r="2.5" fill="white" opacity="0.9" />
              </g>
              <defs>
                <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00A859" />
                  <stop offset="100%" stopColor="#007A3D" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div style={{ fontSize: 'var(--amex-font-size-lg)', fontWeight: 'var(--amex-font-weight-bold)', opacity: 0.9 }}>Balance Loyalty</div>
        </div>

        {/* User Name */}
        <div style={{ fontSize: 'var(--amex-font-size-base)', fontWeight: 'var(--amex-font-weight-medium)', opacity: 0.9, marginTop: 'var(--amex-space-4)' }}>
          {userName}
        </div>
      </div>

      {/* Barcode */}
      <div className="amex-card" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--amex-space-3)' }}>
        <svg ref={barcodeRef}></svg>
      </div>

      {/* Action Buttons */}
      <div className="amex-flex amex-gap-4 amex-mb-4">
        <button
          onClick={() => setShowQR(!showQR)}
          className="amex-btn amex-btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <QrCode className="w-5 h-5 mr-2" />
          {showQR ? 'Hide QR' : 'Show QR'}
        </button>
        <button
          onClick={handleRefresh}
          className="amex-btn amex-btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* QR Code Section */}
      {showQR && (
        <div className="amex-card amex-text-center amex-mb-4">
          <p className="amex-card-subtitle amex-mb-4">Scan at participating merchants</p>
          <div style={{ background: 'white', padding: 'var(--amex-space-4)', display: 'inline-block' }}>
            <QRCode value={formattedCardId} size={200} />
          </div>
          <p style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-500)', marginTop: 'var(--amex-space-4)' }}>{formattedCardId}</p>
        </div>
      )}

      {/* Points Balance */}
      <div className="amex-card amex-mb-4">
        <div className="amex-flex amex-items-center amex-justify-between">
          <div>
            <p className="amex-card-subtitle">Available Points</p>
            <p style={{ fontSize: 'var(--amex-font-size-3xl)', fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-blue)' }}>{formattedPoints}</p>
          </div>
          <div style={{ width: '48px', height: '48px', background: 'var(--amex-blue-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star style={{ width: '24px', height: '24px', color: 'var(--amex-blue)' }} />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="amex-card">
        <div className="amex-text-center">
          <div style={{ width: '64px', height: '64px', background: 'var(--amex-blue-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--amex-space-4)' }}>
            <Star style={{ width: '32px', height: '32px', color: 'var(--amex-blue)' }} />
          </div>
          <h3 className="amex-card-title amex-mb-2">Earn Rewards</h3>
          <p className="amex-card-subtitle amex-mb-2">
            Show your QR code at participating merchants to earn points on every purchase.
          </p>
          <p className="amex-card-subtitle">
            Points are automatically added to your balance and can be redeemed for rewards.
          </p>
        </div>
      </div>
    </div>
  );
}

