import { LogOut, User } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface QuickLogoutProps {
  userEmail?: string;
}

export default function QuickLogout({ userEmail }: QuickLogoutProps) {
  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to sign out?');
    if (!confirmLogout) return;
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        alert('Failed to sign out');
        return;
      }
      
      if (typeof onLogout === 'function') {
        onLogout();
      }
      window.location.reload();
    } catch (error) {
      console.error('Error during logout:', error);
      alert('Failed to sign out');
    }
  };

  return (
    <div className="amex-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-3)' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--amex-blue-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User style={{ width: '20px', height: '20px', color: 'var(--amex-blue)' }} />
          </div>
          <div>
            <p style={{ fontSize: 'var(--amex-font-size-base)', fontWeight: 'var(--amex-font-weight-medium)', color: 'var(--amex-gray-900)' }}>
              {userEmail ? `Signed in as ${userEmail}` : 'Signed in'}
            </p>
            <p className="amex-card-subtitle">Manage your account in the Profile tab</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-2)', padding: 'var(--amex-space-2) var(--amex-space-4)', background: 'var(--amex-red)', color: 'white', border: 'none', borderRadius: 'var(--amex-radius-md)', cursor: 'pointer', transition: 'opacity var(--amex-transition-base)' }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <LogOut style={{ width: '16px', height: '16px' }} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

