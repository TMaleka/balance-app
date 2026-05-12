import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useNotificationHelpers } from './NotificationSystem';
// errorHandling utils available if needed
import BalanceLogo from '../assets/BalanceLogo';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { showSuccess, showError, showWarning } = useNotificationHelpers();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      showWarning('Email Required', 'Please enter your email address');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showWarning('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    setLoading(false);
    
    if (error) {
      setError(error.message);
      showError('Reset Failed', error.message);
    } else {
      setMessage('Check your email for a password reset link');
      showSuccess('Email Sent', 'Check your email for a password reset link');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedPhoneNumber = phoneNumber.trim();
    
    if (!trimmedEmail) {
      showWarning('Email Required', 'Please enter your email address');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showWarning('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    if (isSignUp && !trimmedPhoneNumber) {
      showWarning('Phone Number Required', 'Please enter your phone number');
      return;
    }
    
    if (isSignUp && !/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(trimmedPhoneNumber)) {
      showWarning('Invalid Phone Number', 'Please enter a valid phone number (10-15 digits)');
      return;
    }
    
    if (!trimmedPassword) {
      showWarning('Password Required', 'Please enter your password');
      return;
    }
    
    if (isSignUp && trimmedPassword.length < 6) {
      showWarning('Password Too Short', 'Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let response;
      if (isSignUp) {
        response = await supabase.auth.signUp({ 
          email: trimmedEmail, 
          password: trimmedPassword,
          options: {
            data: {
              phone_number: trimmedPhoneNumber
            }
          }
        });
        if (response.error) throw response.error;
        showSuccess('Account Created', 'Welcome to Balance! Your account is ready.');
      } else {
        response = await supabase.auth.signInWithPassword({ 
          email: trimmedEmail, 
          password: trimmedPassword 
        });
        if (response.error) throw response.error;
        showSuccess('Welcome Back', 'You have been signed in successfully');
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please try again.';
      setError(msg);
      showError('Authentication Failed', msg);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--amex-blue) 0%, var(--amex-navy) 100%)', padding: 'var(--amex-space-4)' }}>
      {/* Balance Logo */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--amex-space-8)' }}>
        <div style={{ fontSize: 'var(--amex-font-size-sm)', marginBottom: 'var(--amex-space-2)', color: 'white', opacity: 0.9 }}>
          Welcome to
        </div>
        <div style={{ fontSize: 'var(--amex-font-size-4xl)', fontWeight: 'var(--amex-font-weight-bold)', color: 'white', letterSpacing: '0.1em' }}>
          BALANCE
        </div>
      </div>

      {/* Balance Logo */}
      <div style={{ marginBottom: 'var(--amex-space-8)' }}>
        <BalanceLogo size={80} />
      </div>

      {/* Auth Form Card */}
      <div style={{ 
        background: 'white', 
        borderRadius: 'var(--amex-radius-xl)', 
        padding: 'var(--amex-space-6)',
        width: '100%',
        maxWidth: '400px',
        boxShadow: 'var(--amex-shadow-xl)'
      }}>
        <h2 style={{ 
          fontSize: 'var(--amex-font-size-2xl)', 
          fontWeight: 'var(--amex-font-weight-bold)',
          color: 'var(--amex-gray-900)',
          marginBottom: 'var(--amex-space-2)',
          textAlign: 'center'
        }}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>
        <p style={{ 
          fontSize: 'var(--amex-font-size-sm)', 
          color: 'var(--amex-gray-600)',
          marginBottom: 'var(--amex-space-6)',
          textAlign: 'center'
        }}>
          {isSignUp ? 'Join Balance and start managing your money' : 'Welcome back to Balance'}
        </p>

        {/* Alerts */}
        {error && (
          <div style={{
            background: 'rgba(230, 57, 70, 0.1)',
            padding: 'var(--amex-space-3)',
            borderRadius: 'var(--amex-radius-md)',
            marginBottom: 'var(--amex-space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--amex-space-2)'
          }}>
            <AlertCircle style={{ width: '20px', height: '20px', color: 'var(--amex-red)', flexShrink: 0 }} />
            <div style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-red)' }}>{error}</div>
          </div>
        )}
        {message && (
          <div style={{
            background: 'rgba(0, 195, 137, 0.1)',
            padding: 'var(--amex-space-3)',
            borderRadius: 'var(--amex-radius-md)',
            marginBottom: 'var(--amex-space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--amex-space-2)'
          }}>
            <CheckCircle style={{ width: '20px', height: '20px', color: 'var(--amex-green)', flexShrink: 0 }} />
            <div style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-green)' }}>{message}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: 'var(--amex-space-4)' }}>
            <label htmlFor="email" className="amex-label">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="amex-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {isSignUp && (
            <div style={{ marginBottom: 'var(--amex-space-4)' }}>
              <label htmlFor="phoneNumber" className="amex-label">Phone Number</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                required
                className="amex-input"
                placeholder="+27 12 345 6789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          )}

          <div style={{ marginBottom: 'var(--amex-space-4)' }}>
            <label htmlFor="password" className="amex-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="amex-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isSignUp && (
            <div style={{ 
              textAlign: 'right', 
              marginBottom: 'var(--amex-space-4)'
            }}>
              <span 
                onClick={() => setIsForgotPassword(true)}
                style={{ 
                  color: 'var(--amex-blue)', 
                  fontSize: 'var(--amex-font-size-sm)',
                  cursor: 'pointer'
                }}
              >
                Forgot Password?
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="amex-btn amex-btn-primary"
            style={{ width: '100%' }}
          >
            {loading ? (
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}></div>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        {/* Toggle */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: 'var(--amex-space-4)',
          fontSize: 'var(--amex-font-size-sm)',
          color: 'var(--amex-gray-600)'
        }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ 
              color: 'var(--amex-blue)', 
              fontWeight: 'var(--amex-font-weight-semibold)',
              cursor: 'pointer'
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--amex-space-4)',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--amex-radius-xl)',
            padding: 'var(--amex-space-6)',
            width: '100%',
            maxWidth: '400px',
            boxShadow: 'var(--amex-shadow-xl)'
          }}>
            <h2 style={{
              fontSize: 'var(--amex-font-size-2xl)',
              fontWeight: 'var(--amex-font-weight-bold)',
              color: 'var(--amex-gray-900)',
              marginBottom: 'var(--amex-space-2)',
              textAlign: 'center'
            }}>
              Reset Password
            </h2>
            <p style={{
              fontSize: 'var(--amex-font-size-sm)',
              color: 'var(--amex-gray-600)',
              marginBottom: 'var(--amex-space-6)',
              textAlign: 'center'
            }}>
              Enter your email and we'll send you a link to reset your password
            </p>

            {/* Alerts */}
            {error && (
              <div style={{
                background: 'rgba(230, 57, 70, 0.1)',
                padding: 'var(--amex-space-3)',
                borderRadius: 'var(--amex-radius-md)',
                marginBottom: 'var(--amex-space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--amex-space-2)'
              }}>
                <AlertCircle style={{ width: '20px', height: '20px', color: 'var(--amex-red)', flexShrink: 0 }} />
                <div style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-red)' }}>{error}</div>
              </div>
            )}
            {message && (
              <div style={{
                background: 'rgba(0, 195, 137, 0.1)',
                padding: 'var(--amex-space-3)',
                borderRadius: 'var(--amex-radius-md)',
                marginBottom: 'var(--amex-space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--amex-space-2)'
              }}>
                <CheckCircle style={{ width: '20px', height: '20px', color: 'var(--amex-green)', flexShrink: 0 }} />
                <div style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-green)' }}>{message}</div>
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div style={{ marginBottom: 'var(--amex-space-6)' }}>
                <label htmlFor="reset-email" className="amex-label">Email Address</label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="amex-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="amex-btn amex-btn-primary"
                style={{ width: '100%', marginBottom: 'var(--amex-space-3)' }}
              >
                {loading ? (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}></div>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setMessage(null);
                }}
                className="amex-btn"
                style={{ 
                  width: '100%', 
                  background: 'var(--amex-gray-100)',
                  color: 'var(--amex-gray-700)'
                }}
              >
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

