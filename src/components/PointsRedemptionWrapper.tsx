import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getUserLoyaltyCard } from '../utils/loyaltyCardUtils';
import PointsRedemption from './PointsRedemption';

export default function PointsRedemptionWrapper() {
  const [user, setUser] = useState<any>(null);
  const [currentPoints, setCurrentPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Get user's loyalty nedbank-card data
      const loyaltyCard = await getUserLoyaltyCard(currentUser.id);
      if (loyaltyCard) {
        setCurrentPoints(loyaltyCard.pointsBalance);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const handlePointsUpdated = (newBalance: number) => {
    setCurrentPoints(newBalance);
    // Trigger a refresh of the loyalty nedbank-card component by dispatching a custom event
    window.dispatchEvent(new CustomEvent('loyaltyPointsUpdated', { detail: { newBalance } }));
  };

  if (loading) {
    return (
      <div className="amex-card" style={{ padding: 'var(--amex-space-12)' }}>
        <div className="amex-text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--amex-blue)] border-t-transparent mx-auto"></div>
          <p className="amex-card-subtitle" style={{ marginTop: 'var(--amex-space-3)' }}>Loading redemption options...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-sm mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="nedbank-card text-center">
          <p className="text-sm text-gray-500">Please log in to redeem points</p>
        </div>
      </div>
    );
  }

  return (
    <PointsRedemption
      userId={user.id}
      currentPoints={currentPoints}
      onPointsUpdated={handlePointsUpdated}
    />
  );
}

