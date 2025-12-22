import React, { useEffect } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

interface SuccessScreenProps {
  onBack: () => void;
}

export default function SuccessScreen({ onBack }: SuccessScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onBack();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onBack]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #E8F8F2 0%, #D4F4E8 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--amex-space-6)'
    }}>
      <div style={{ 
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Success Icon */}
        <div style={{ 
          position: 'relative', 
          marginBottom: 'var(--amex-space-8)',
          display: 'inline-block'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            background: 'linear-gradient(135deg, var(--amex-green) 0%, var(--amex-teal) 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 195, 137, 0.3)',
            animation: 'amex-fade-in 0.5s ease-out'
          }}>
            <CheckCircle style={{ width: '64px', height: '64px', color: 'white' }} />
          </div>
          
          {/* Sparkle effects */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '25%',
            animation: 'sparkle-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
          }}>
            <Sparkles style={{ width: '24px', height: '24px', color: '#FFD700' }} />
          </div>
          <div style={{
            position: 'absolute',
            top: '25%',
            right: '0',
            animation: 'sparkle-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.2s'
          }}>
            <Sparkles style={{ width: '16px', height: '16px', color: '#FFD700' }} />
          </div>
          <div style={{
            position: 'absolute',
            bottom: '25%',
            left: '0',
            animation: 'sparkle-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.4s'
          }}>
            <Sparkles style={{ width: '20px', height: '20px', color: '#FFD700' }} />
          </div>
        </div>

        {/* Success Messages */}
        <h1 style={{
          fontSize: 'var(--amex-font-size-3xl)',
          fontWeight: 'var(--amex-font-weight-bold)',
          color: 'var(--amex-gray-900)',
          marginBottom: 'var(--amex-space-4)',
          animation: 'amex-fade-in 0.6s ease-out 0.2s both'
        }}>
          You're Back on Track!
        </h1>
        
        <p style={{
          fontSize: 'var(--amex-font-size-lg)',
          color: 'var(--amex-gray-700)',
          marginBottom: 'var(--amex-space-8)',
          lineHeight: '1.6',
          animation: 'amex-fade-in 0.6s ease-out 0.3s both'
        }}>
          Your budgets have been successfully rebalanced
        </p>

        {/* Auto-redirect message */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--amex-space-2)',
          animation: 'amex-fade-in 0.6s ease-out 0.4s both'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: 'var(--amex-green)',
            borderRadius: '50%',
            animation: 'pulse-dot 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}></div>
          <p style={{
            fontSize: 'var(--amex-font-size-sm)',
            color: 'var(--amex-gray-600)',
            fontWeight: 'var(--amex-font-weight-medium)'
          }}>
            Showing your updated budgets...
          </p>
        </div>
      </div>

      <style>{`
        @keyframes sparkle-ping {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }

        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.3);
          }
        }
      `}</style>
    </div>
  );
}
