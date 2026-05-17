import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, LogOut, Edit3, Save, X, Key, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Settings, Trash2 } from 'lucide-react';
import { Budget } from '../types';
import AmexBudgetSettings from './AmexBudgetSettings';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import { useNotificationHelpers } from './NotificationSystem';
import { safeAsync } from '../utils/errorHandling';

interface UserProfileProps {
  session: Session;
  onLogout: () => void;
  budgets?: Budget[];
  onSaveBudgetSettings?: (budgets: Budget[]) => void;
}

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  phone_number?: string;
  full_name?: string;
  loyalty_activated: boolean;
  card_id?: string;
  points_balance: number;
}

export default function UserProfile({ session, onLogout, budgets, onSaveBudgetSettings }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { showSuccess, showError, showWarning } = useNotificationHelpers();
  
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    loadProfile();
  }, [session]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);

    const result = await safeAsync(async () => {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw new Error(`Failed to load profile: ${userError.message}`);
      }

      const profileData: UserProfile = {
        id: session.user.id,
        email: session.user.email || '',
        created_at: session.user.created_at || '',
        phone_number: userData?.phone_number || '',
        full_name: userData?.full_name || '',
        loyalty_activated: userData?.loyalty_activated || false,
        card_id: userData?.card_id || '',
        points_balance: userData?.points_balance || 0
      };

      return profileData;
    }, undefined, 'loadProfile');

    setLoading(false);

    if (result) {
      setProfile(result);
      setFullName(result.full_name || '');
      setPhoneNumber(result.phone_number || '');
      setRetryCount(0);
    } else {
      setError('Failed to load profile data');
      if (retryCount > 0) {
        showError('Loading Failed', 'Unable to load your profile. Please try again.');
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    const trimmedFullName = fullName.trim();
    const trimmedPhoneNumber = phoneNumber.trim();
    
    if (trimmedFullName && trimmedFullName.length < 2) {
      showWarning('Invalid Name', 'Full name must be at least 2 characters long');
      return;
    }
    
    if (trimmedPhoneNumber && !/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(trimmedPhoneNumber)) {
      showWarning('Invalid Phone', 'Please enter a valid phone number');
      return;
    }
    
    setSaving(true);
    
    const result = await safeAsync(async () => {
      // Check if phone number is already taken by another user
      if (trimmedPhoneNumber && trimmedPhoneNumber !== profile.phone_number) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('phone_number', trimmedPhoneNumber)
          .neq('id', profile.id)
          .single();
        
        if (existingUser) {
          throw new Error('This phone number is already registered to another account');
        }
      }

      const { error } = await supabase
        .from('users')
        .update({
          full_name: trimmedFullName || null,
          phone_number: trimmedPhoneNumber || null
        })
        .eq('id', profile.id);

      if (error) {
        if (error.code === '23505') {
          throw new Error('This phone number is already registered to another account');
        }
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      return {
        full_name: trimmedFullName,
        phone_number: trimmedPhoneNumber
      };
    }, undefined, 'handleSaveProfile');
    
    setSaving(false);
    
    if (result) {
      setProfile({
        ...profile,
        full_name: result.full_name,
        phone_number: result.phone_number
      });
      
      setEditing(false);
      showSuccess('Profile Updated', 'Your profile information has been saved successfully');
    } else {
      showError('Save Failed', 'Unable to save your profile changes. Please try again.');
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadProfile();
  };

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        session.user.email || '',
        {
          redirectTo: window.location.origin
        }
      );

      if (error) {
        alert('Failed to send password reset email');
        return;
      }

      setPasswordResetSent(true);
      setShowPasswordReset(false);
      
    } catch (error) {
      alert('Failed to send password reset email');
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to sign out?');
    if (!confirmLogout) return;
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert('Failed to sign out');
        return;
      }
      
      onLogout();
    } catch (error) {
      alert('Failed to sign out');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="amex-content">
        <div className="amex-card amex-text-center" style={{ padding: 'var(--amex-space-12)' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--amex-blue)] border-t-transparent mx-auto"></div>
          <p className="amex-card-subtitle" style={{ marginTop: 'var(--amex-space-3)' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="amex-content">
        <div className="amex-card" style={{ background: 'var(--amex-red-light)', borderColor: 'var(--amex-red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-3)', marginBottom: 'var(--amex-space-3)' }}>
            <AlertCircle style={{ width: '24px', height: '24px', color: 'var(--amex-red)' }} />
            <h3 className="amex-card-title" style={{ color: 'var(--amex-red)' }}>Unable to Load Profile</h3>
          </div>
          <p style={{ color: 'var(--amex-red)', marginBottom: 'var(--amex-space-4)' }}>{error || 'Failed to load profile data'}</p>
          <div style={{ display: 'flex', gap: 'var(--amex-space-3)' }}>
            <button 
              onClick={handleRetry}
              disabled={loading}
              className="amex-btn amex-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-2)' }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Try Again</span>
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="amex-btn amex-btn-secondary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="amex-content">
      {/* Header */}
      <div className="amex-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-4)' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--amex-blue-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User style={{ width: '32px', height: '32px', color: 'var(--amex-blue)' }} />
            </div>
            <div>
              <h3 className="amex-section-title" style={{ marginBottom: 'var(--amex-space-1)' }}>
                {profile.full_name || 'Your Profile'}
              </h3>
              <p className="amex-card-subtitle">Manage your account settings</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-2)', padding: 'var(--amex-space-2) var(--amex-space-4)', background: 'var(--amex-red-light)', color: 'var(--amex-red)', border: 'none', borderRadius: 'var(--amex-radius-md)', cursor: 'pointer', transition: 'background var(--amex-transition-fast)' }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {passwordResetSent && (
          <div style={{ marginTop: 'var(--amex-space-4)', padding: 'var(--amex-space-3)', background: 'var(--amex-green-light)', borderRadius: 'var(--amex-radius-md)' }}>
            <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-green)' }}>
              Password reset email sent! Check your inbox.
            </p>
          </div>
        )}
      </div>

      {/* Profile Information */}
      <div className="amex-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--amex-space-4)' }}>
          <h4 className="amex-card-title">Profile Information</h4>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="amex-btn amex-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-2)' }}
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--amex-space-2)' }}>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-2)', padding: 'var(--amex-space-2) var(--amex-space-3)', background: 'var(--amex-green-light)', color: 'var(--amex-green)', border: 'none', borderRadius: 'var(--amex-radius-md)', cursor: 'pointer', transition: 'background var(--amex-transition-fast)' }}
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFullName(profile.full_name || '');
                  setPhoneNumber(profile.phone_number || '');
                }}
                className="amex-btn amex-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-2)' }}
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-4)' }}>
          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--amex-space-3)' }}>
            <Mail style={{ width: '20px', height: '20px', color: 'var(--amex-gray-400)', marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <p className="amex-label">Email</p>
              <p className="amex-card-title">{profile.email}</p>
            </div>
          </div>

          {/* Full Name */}
          <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--amex-space-3)' }}>
            <User style={{ width: '20px', height: '20px', color: 'var(--amex-gray-400)', marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <p className="amex-label">Full Name</p>
              {editing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="amex-input"
                />
              ) : (
                <p className="amex-card-title">{profile.full_name || 'Not set'}</p>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--amex-space-3)' }}>
            <span style={{ width: '20px', height: '20px', color: 'var(--amex-gray-400)', fontSize: 'var(--amex-font-size-sm)' }}>📱</span>
            <div style={{ flex: 1 }}>
              <p className="amex-label">Phone Number</p>
              {editing ? (
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="amex-input"
                />
              ) : (
                <p className="amex-card-title">{profile.phone_number || 'Not set'}</p>
              )}
            </div>
          </div>

          {/* Member Since */}
          <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--amex-space-3)' }}>
            <Calendar style={{ width: '20px', height: '20px', color: 'var(--amex-gray-400)', marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <p className="amex-label">Member Since</p>
              <p className="amex-card-title">{formatDate(profile.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loyalty Status */}
      {profile.loyalty_activated && (
        <div className="amex-card">
          <h4 className="amex-card-title" style={{ marginBottom: 'var(--amex-space-4)' }}>Loyalty Program</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-3)' }}>
            <div style={{ padding: 'var(--amex-space-3)', background: 'var(--amex-green-light)', borderRadius: 'var(--amex-radius-md)', display: 'flex', alignItems: 'center', gap: 'var(--amex-space-3)' }}>
              <Shield style={{ width: '20px', height: '20px', color: 'var(--amex-green)' }} />
              <div style={{ flex: 1 }}>
                <p className="amex-label" style={{ color: 'var(--amex-green)' }}>Status</p>
                <p style={{ color: 'var(--amex-green)', fontWeight: 'var(--amex-font-weight-semibold)' }}>Active Member</p>
              </div>
            </div>
            
            {profile.card_id && (
              <div style={{ padding: 'var(--amex-space-3)', background: 'var(--amex-blue-light)', borderRadius: 'var(--amex-radius-md)', display: 'flex', alignItems: 'center', gap: 'var(--amex-space-3)' }}>
                <span style={{ width: '20px', height: '20px', color: 'var(--amex-blue)', fontSize: 'var(--amex-font-size-sm)' }}>💳</span>
                <div style={{ flex: 1 }}>
                  <p className="amex-label" style={{ color: 'var(--amex-blue)' }}>Card ID</p>
                  <p style={{ color: 'var(--amex-blue)', fontWeight: 'var(--amex-font-weight-semibold)', fontFamily: 'monospace' }}>{profile.card_id}</p>
                </div>
              </div>
            )}
            
            <div style={{ padding: 'var(--amex-space-3)', background: 'linear-gradient(135deg, var(--amex-blue-light) 0%, var(--amex-teal-light) 100%)', borderRadius: 'var(--amex-radius-md)', display: 'flex', alignItems: 'center', gap: 'var(--amex-space-3)' }}>
              <span style={{ width: '20px', height: '20px', fontSize: 'var(--amex-font-size-sm)' }}>⭐</span>
              <div style={{ flex: 1 }}>
                <p className="amex-label" style={{ color: 'var(--amex-blue)' }}>Points Balance</p>
                <p style={{ color: 'var(--amex-blue)', fontWeight: 'var(--amex-font-weight-bold)', fontSize: 'var(--amex-font-size-lg)' }}>{profile.points_balance.toLocaleString()} points</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Settings */}
      {budgets && onSaveBudgetSettings && (
        <div className="amex-card">
          <button
            onClick={() => setShowBudgetSettings(!showBudgetSettings)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-3)' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--amex-blue-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings style={{ width: '20px', height: '20px', color: 'var(--amex-blue)' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h4 className="amex-card-title">Budget Settings</h4>
                <p className="amex-card-subtitle">{budgets.length} categor{budgets.length === 1 ? 'y' : 'ies'}</p>
              </div>
            </div>
            {showBudgetSettings ? (
              <ChevronUp style={{ width: '20px', height: '20px', color: 'var(--amex-gray-400)' }} />
            ) : (
              <ChevronDown style={{ width: '20px', height: '20px', color: 'var(--amex-gray-400)' }} />
            )}
          </button>

          {showBudgetSettings && (
            <div style={{ marginTop: 'var(--amex-space-4)', borderTop: '1px solid var(--amex-gray-200)', paddingTop: 'var(--amex-space-4)' }}>
              <AmexBudgetSettings
                budgets={budgets}
                onSave={(updated) => {
                  onSaveBudgetSettings(updated);
                  setShowBudgetSettings(false);
                }}
                onCancel={() => setShowBudgetSettings(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* Security */}
      <div className="amex-card">
        <h4 className="amex-card-title" style={{ marginBottom: 'var(--amex-space-4)' }}>Security</h4>
        
        {!showPasswordReset ? (
          <button
            onClick={() => setShowPasswordReset(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-3)', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: 'var(--amex-space-3)', borderRadius: 'var(--amex-radius-md)', cursor: 'pointer', transition: 'background var(--amex-transition-fast)' }}
          >
            <Key style={{ width: '20px', height: '20px', color: 'var(--amex-gray-400)' }} />
            <div>
              <p className="amex-label">Password</p>
              <p className="amex-card-subtitle">Reset your password</p>
            </div>
          </button>
        ) : (
          <div style={{ padding: 'var(--amex-space-4)', background: 'var(--amex-orange-light)', borderRadius: 'var(--amex-radius-md)' }}>
            <p style={{ color: 'var(--amex-orange)', marginBottom: 'var(--amex-space-3)', fontSize: 'var(--amex-font-size-sm)' }}>
              This will send a password reset link to your email address.
            </p>
            <div style={{ display: 'flex', gap: 'var(--amex-space-2)' }}>
              <button
                onClick={handlePasswordReset}
                className="amex-btn amex-btn-primary"
              >
                Send Reset Email
              </button>
              <button
                onClick={() => setShowPasswordReset(false)}
                className="amex-btn amex-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reset Account (for testing) */}
      <div className="amex-card">
        <h4 className="amex-card-title" style={{ marginBottom: 'var(--amex-space-4)' }}>Reset Account</h4>
        <p className="amex-card-subtitle" style={{ marginBottom: 'var(--amex-space-4)' }}>
          Delete all your budgets, expenses, and data. You will be taken back to the onboarding screen.
        </p>
        <button
          onClick={async () => {
            const confirmed = window.confirm('This will delete ALL your budgets, expenses, savings, and check-in data. Are you sure?');
            if (!confirmed) return;
            setResetting(true);
            try {
              const uid = session.user.id;
              // Delete in dependency order (expenses reference budgets)
              const tables = ['expenses', 'daily_checkins', 'monthly_savings', 'monthly_income', 'budgets'] as const;
              for (const table of tables) {
                const { error } = await supabase.from(table).delete().eq('user_id', uid);
                if (error) console.warn(`[Reset] ${table} delete error:`, error.message);
              }
              // Verify budgets are actually gone
              const { data: remaining } = await supabase.from('budgets').select('id').eq('user_id', uid);
              if (remaining && remaining.length > 0) {
                showError(
                  'Delete Blocked by Database',
                  'Your Supabase "budgets" table is missing a DELETE policy. Run this in the Supabase SQL Editor: CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);'
                );
                setResetting(false);
                return;
              }
              localStorage.removeItem('balance_onboarding_intent');
              localStorage.removeItem('balance_onboarding_spend_range');
              showSuccess('Account Reset', 'All data cleared. Reloading...');
              setTimeout(() => window.location.reload(), 1000);
            } catch (err: any) {
              showError('Reset Failed', err?.message || 'Could not reset account.');
              setResetting(false);
            }
          }}
          disabled={resetting}
          className="amex-btn"
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--amex-space-2)',
            background: 'var(--amex-red-light)', color: 'var(--amex-red)',
            border: '1px solid var(--amex-red)', cursor: resetting ? 'wait' : 'pointer',
            opacity: resetting ? 0.6 : 1,
          }}
        >
          <Trash2 style={{ width: 16, height: 16 }} />
          {resetting ? 'Resetting...' : 'Reset All Data'}
        </button>
      </div>
    </div>
  );
}
