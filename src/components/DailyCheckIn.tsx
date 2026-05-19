import React, { useState, useEffect } from 'react';
import { Shield, Flame, AlertTriangle, CheckCircle } from 'lucide-react';
import { Budget } from '../types';
import { supabase } from '../supabaseClient';
import { trackCheckIn } from '../utils/betaTracking';

type StatusLevel = 'green' | 'amber' | 'red';

interface DailyCheckInProps {
  budgets: Budget[];
  monthlyIncome: number;
  session: any;
  streak: number;
  onComplete: () => void;
  onRestoreBalance: () => void;
}

export default function DailyCheckIn({
  budgets,
  monthlyIncome,
  session,
  streak,
  onComplete,
  onRestoreBalance,
}: DailyCheckInProps) {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
  const overspent = budgets.filter(b => b.spent > b.budget);
  const totalOverspend = overspent.reduce((sum, b) => sum + (b.spent - b.budget), 0);
  const spendRatio = totalBudget > 0 ? totalSpent / totalBudget : 0;

  // Determine status
  let status: StatusLevel = 'green';
  let statusMessage = "You're in control. Keep it up.";
  let statusDetail = '';

  if (overspent.length > 0) {
    status = 'red';
    statusMessage = `${overspent.length} budget${overspent.length > 1 ? 's' : ''} need attention`;
    statusDetail = `R${totalOverspend.toLocaleString()} over across ${overspent.map(b => b.name).join(', ')}`;
  } else if (spendRatio > 0.8) {
    status = 'amber';
    statusMessage = "You're approaching your limits.";
    statusDetail = `${(spendRatio * 100).toFixed(0)}% of total budget used`;
  } else {
    statusDetail = `R${(totalBudget - totalSpent).toLocaleString()} remaining in budgets`;
  }

  const statusColors: Record<StatusLevel, { bg: string; border: string; text: string; icon: string }> = {
    green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', icon: '#16a34a' },
    amber: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '#f59e0b' },
    red: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: 'var(--amex-red)' },
  };

  const colors = statusColors[status];

  const saveCheckIn = async () => {
    if (!session?.user?.id) return;
    const today = new Date().toISOString().substring(0, 10);
    try {
      await supabase.from('daily_checkins').upsert({
        user_id: session.user.id,
        check_date: today,
        status,
        had_overspend: overspent.length > 0,
        resolved_overspend: false,
      }, { onConflict: 'user_id, check_date' });
    } catch (err) {
      console.error('Failed to save check-in:', err);
    }
  };

  const handleCheckIn = async () => {
    setIsCheckedIn(true);
    await saveCheckIn();
    const isFirst = streak === 0;
    trackCheckIn(status, streak + 1, isFirst);
    setTimeout(() => onComplete(), 600);
  };

  // Hold-to-dismiss for red status (escalation level 2)
  const startHold = () => {
    if (status !== 'red') return;
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        handleCheckIn();
      }
    }, 30);
    setHoldTimer(interval);
  };

  const cancelHold = () => {
    if (holdTimer) {
      clearInterval(holdTimer);
      setHoldTimer(null);
    }
    setHoldProgress(0);
  };

  useEffect(() => {
    return () => { if (holdTimer) clearInterval(holdTimer); };
  }, [holdTimer]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: 'var(--amex-white)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--amex-space-8)',
      animation: 'fadeIn 300ms ease',
    }}>
      {/* Streak badge */}
      {streak > 0 && (
        <div style={{
          position: 'absolute',
          top: 'var(--amex-space-6)',
          right: 'var(--amex-space-6)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--amex-space-2)',
          padding: 'var(--amex-space-2) var(--amex-space-4)',
          background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
          borderRadius: 'var(--amex-radius-full)',
          color: 'white',
        }}>
          <Flame style={{ width: '16px', height: '16px' }} />
          <span style={{ fontWeight: 'var(--amex-font-weight-bold)', fontSize: 'var(--amex-font-size-sm)', fontFamily: 'var(--amex-font-family)' }}>
            {streak} day{streak !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Greeting */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--amex-space-8)' }}>
        <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-500)', marginBottom: 'var(--amex-space-2)', fontFamily: 'var(--amex-font-family)' }}>
          {greeting}
        </p>
        <h1 style={{ fontSize: 'var(--amex-font-size-2xl)', fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-gray-900)', fontFamily: 'var(--amex-font-family)' }}>
          Are you in control today?
        </h1>
      </div>

      {/* Status indicator */}
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: colors.bg,
        border: `3px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--amex-space-6)',
        transition: 'all 300ms ease',
      }}>
        {status === 'green' && <CheckCircle style={{ width: '48px', height: '48px', color: colors.icon }} />}
        {status === 'amber' && <Shield style={{ width: '48px', height: '48px', color: colors.icon }} />}
        {status === 'red' && <AlertTriangle style={{ width: '48px', height: '48px', color: colors.icon }} />}
      </div>

      {/* Status text */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--amex-space-8)', maxWidth: '300px' }}>
        <h2 style={{
          fontSize: 'var(--amex-font-size-lg)',
          fontWeight: 'var(--amex-font-weight-bold)',
          color: colors.text,
          marginBottom: 'var(--amex-space-2)',
          fontFamily: 'var(--amex-font-family)',
        }}>
          {statusMessage}
        </h2>
        <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)', lineHeight: 1.5, fontFamily: 'var(--amex-font-family)' }}>
          {statusDetail}
        </p>
      </div>

      {/* Actions */}
      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-3)' }}>
        {status === 'red' ? (
          <>
            {/* Primary: Restore Balance */}
            <button
              onClick={onRestoreBalance}
              className="amex-btn amex-btn-primary"
              style={{ width: '100%', padding: 'var(--amex-space-4)' }}
            >
              Restore Balance
            </button>

            {/* Secondary: hold-to-dismiss */}
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--amex-radius-lg)' }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${holdProgress}%`,
                background: 'var(--amex-gray-200)',
                transition: holdProgress === 0 ? 'width 200ms ease' : 'none',
                borderRadius: 'var(--amex-radius-lg)',
              }} />
              <button
                onPointerDown={startHold}
                onPointerUp={cancelHold}
                onPointerLeave={cancelHold}
                className="amex-btn amex-btn-secondary"
                style={{ width: '100%', position: 'relative', padding: 'var(--amex-space-4)', userSelect: 'none' }}
              >
                {holdProgress > 0 ? 'Hold...' : 'Continue Without Fixing'}
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-400)', fontFamily: 'var(--amex-font-family)' }}>
              Hold the button to continue without restoring balance
            </p>
          </>
        ) : (
          <button
            onClick={handleCheckIn}
            className="amex-btn amex-btn-primary"
            style={{
              width: '100%',
              padding: 'var(--amex-space-4)',
              opacity: isCheckedIn ? 0.7 : 1,
              transform: isCheckedIn ? 'scale(0.97)' : 'scale(1)',
              transition: 'all 200ms ease',
            }}
          >
            {isCheckedIn ? 'Checked In!' : status === 'amber' ? 'Stay in Control' : "I'm in Control"}
          </button>
        )}
      </div>
    </div>
  );
}
