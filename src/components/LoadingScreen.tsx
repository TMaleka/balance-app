import React from 'react';
import { Wallet } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--amex-blue) 0%, var(--amex-teal) 100%)',
      padding: 'var(--amex-space-4)'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        {/* Loading Icon */}
        <div style={{ position: 'relative', marginBottom: 'var(--amex-space-8)' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'rgba(255, 255, 255, 0.2)', 
            borderRadius: '50%', 
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Wallet style={{ width: '40px', height: '40px', color: 'white' }} />
          </div>
          
          {/* Spinning loader ring */}
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            width: '80px', 
            height: '80px', 
            margin: '0 auto'
          }}>
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-white border-t-transparent"></div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 style={{
          fontSize: 'var(--amex-font-size-2xl)',
          fontWeight: 'var(--amex-font-weight-semibold)',
          color: 'white',
          marginBottom: 'var(--amex-space-2)'
        }}>
          Loading Balance
        </h2>
        
        <p style={{
          fontSize: 'var(--amex-font-size-base)',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: 'var(--amex-space-8)'
        }}>
          Preparing your financial overview
        </p>

        {/* Loading dots animation */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%' }} className="animate-bounce"></div>
          <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%', animationDelay: '0.1s' }} className="animate-bounce"></div>
          <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%', animationDelay: '0.2s' }} className="animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}

