import React, { useState } from 'react';
import { CreditCard, Phone, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { activateLoyaltyCard, isValidPhoneNumber, formatPhoneNumber } from '../utils/loyaltyCardUtils';

interface LoyaltyActivationProps {
  userId: string;
  onActivationComplete: (cardId: string) => void;
}

export default function LoyaltyActivation({ userId, onActivationComplete }: LoyaltyActivationProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'phone' | 'activating' | 'success'>('info');
  const [generatedCardId, setGeneratedCardId] = useState<string>('');

  const handleStartActivation = () => {
    setStep('phone');
    setError(null);
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Please enter a valid South African phone number');
      return;
    }

    setIsActivating(true);
    setError(null);
    setStep('activating');

    try {
      const result = await activateLoyaltyCard(userId, phoneNumber);
      
      if (result.success && result.cardId) {
        setGeneratedCardId(result.cardId);
        setStep('success');
        setTimeout(() => {
          onActivationComplete(result.cardId);
        }, 2000);
      } else {
        setError(result.error || 'Failed to activate loyalty nedbank-card');
        setStep('phone');
      }
    } catch (err: any) {
      setError(err.message || 'Activation failed');
      setStep('phone');
    } finally {
      setIsActivating(false);
    }
  };

  const formatCardIdDisplay = (cardId: string) => {
    const parts = cardId.split('_');
    if (parts.length === 3) {
      const suffix = parts[2];
      return `${parts[0]} ${parts[1]} ${suffix.substring(0, 4)} ${suffix.substring(4)}`;
    }
    return cardId;
  };

  if (step === 'success') {
    return (
      <div className="max-w-sm mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="nedbank-card text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-light mb-2">Card Activated!</h3>
          <p className="text-sm text-gray-500">Your loyalty card is ready to use</p>
          
          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Your Card ID</p>
            <p className="text-lg font-mono">{formatCardIdDisplay(generatedCardId)}</p>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">Loading your new card...</p>
        </div>
      </div>
    );
  }

  if (step === 'activating') {
    return (
      <div className="amex-card" style={{ padding: 'var(--amex-space-12)' }}>
        <div className="amex-text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--amex-blue)] border-t-transparent mx-auto"></div>
          <h3 className="amex-card-title" style={{ marginTop: 'var(--amex-space-4)', marginBottom: 'var(--amex-space-2)' }}>Activating Your Card</h3>
          <p className="amex-card-subtitle">Generating your unique card ID...</p>
        </div>
      </div>
    );
  }

  if (step === 'phone') {
    return (
      <div className="max-w-sm mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="nedbank-card">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-light mb-2">Enter Your Phone Number</h3>
            <p className="text-sm text-gray-500">This will be used for manual entry at checkout</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="082 123 4567"
                className="nedbank-input text-lg"
                disabled={isActivating}
              />
              <p className="text-xs text-gray-500 mt-2">South African mobile or landline number</p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep('info')}
                className="nedbank-btn nedbank-btn-secondary flex-1"
                disabled={isActivating}
              >
                Back
              </button>
              <button
                onClick={handlePhoneSubmit}
                disabled={isActivating || !phoneNumber.trim()}
                className="nedbank-btn nedbank-btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>Activate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default info step
  return (
    <div className="max-w-sm mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="nedbank-card">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-light mb-2">Join Balance Loyalty</h3>
          <p className="text-sm text-gray-500">Start earning points at partner stores</p>
        </div>

        <div className="space-y-4 my-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-green-600">1</span>
            </div>
            <div>
              <p className="font-medium text-sm">Earn Points</p>
              <p className="text-xs text-gray-500">Get 1.5-4x points per rand spent at partners</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-green-600">2</span>
            </div>
            <div>
              <p className="font-medium text-sm">Easy Checkout</p>
              <p className="text-xs text-gray-500">Show QR code or give phone number</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-green-600">3</span>
            </div>
            <div>
              <p className="font-medium text-sm">Redeem Rewards</p>
              <p className="text-xs text-gray-500">Convert points to cashback and discounts</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartActivation}
          className="nedbank-btn nedbank-btn-primary w-full flex items-center justify-center space-x-2"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Free to join • No monthly fees • Cancel anytime
        </p>
      </div>
    </div>
  );
}

