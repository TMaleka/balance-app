import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wallet, ChevronRight, Calendar, TrendingDown } from 'lucide-react';
import { Budget } from '../types';
import { supabase } from '../supabaseClient';
import InlineAmountInput from './InlineAmountInput';
import RebalanceSheet from './RebalanceSheet';

interface TodayExpense {
  id: number;
  merchant: string;
  amount: number;
  categoryId: number;
  created_at: string;
}

interface TodayViewProps {
  budgets: Budget[];
  monthlyIncome: number;
  monthlySavings: number;
  ytdSavings: number;
  ytdExpenses: number;
  session: any;
  onUpdateIncome: (amount: number) => void;
  onUpdateSavings: (amount: number) => void;
  onRebalance: (fromId: number | string, toId: number | string, amount: number) => void;
  onShowMonthSummary: () => void;
}

export default function TodayView({
  budgets,
  monthlyIncome,
  monthlySavings,
  ytdSavings,
  ytdExpenses,
  session,
  onUpdateIncome,
  onUpdateSavings,
  onRebalance,
  onShowMonthSummary,
}: TodayViewProps) {
  const [userName, setUserName] = useState('User');
  const [todayExpenses, setTodayExpenses] = useState<TodayExpense[]>([]);
  const [showIncomeInput, setShowIncomeInput] = useState(false);
  const [showSavingsInput, setShowSavingsInput] = useState(false);
  const [showRebalance, setShowRebalance] = useState(false);
  const [rebalanceTarget, setRebalanceTarget] = useState<Budget | undefined>(undefined);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - dayOfMonth;

  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remainingBalance = monthlyIncome - totalSpent;
  const dailyBudget = daysLeft > 0 ? Math.max(0, remainingBalance / daysLeft) : remainingBalance;
  const daysElapsed = Math.max(dayOfMonth - 1, 1);
  const dailySpendRate = totalSpent / daysElapsed;

  const overspentBudgets = budgets.filter(b => b.spent > b.budget);
  const hasOverspend = overspentBudgets.length > 0;
  const totalOverspend = overspentBudgets.reduce((sum, b) => sum + (b.spent - b.budget), 0);

  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Fetch user name
  useEffect(() => {
    const fetchName = async () => {
      if (session?.user?.id) {
        try {
          const { data } = await supabase.from('users').select('full_name').eq('id', session.user.id).single();
          if (data?.full_name) setUserName(data.full_name.split(' ')[0]);
          else setUserName(session.user.email?.split('@')[0] || 'User');
        } catch { setUserName(session.user.email?.split('@')[0] || 'User'); }
      }
    };
    fetchName();
  }, [session]);

  // Fetch today's expenses
  useEffect(() => {
    const fetchToday = async () => {
      if (!session?.user?.id) return;
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
      const { data } = await supabase
        .from('expenses')
        .select('id, merchant, amount, categoryId, created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .order('created_at', { ascending: false });
      if (data) setTodayExpenses(data);
    };
    fetchToday();
  }, [session, budgets]); // re-fetch when budgets change (expense added)

  const getCategoryName = (categoryId: number) => {
    const b = budgets.find(b => b.id === categoryId);
    return b?.name || 'Unknown';
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  };

  const handleFixCategory = (budget: Budget) => {
    setRebalanceTarget(budget);
    setShowRebalance(true);
  };

  const todayStr = now.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      {/* Header */}
      <div className="amex-header">
        <div className="amex-header-greeting">{greeting}</div>
        <div className="amex-header-name">{userName}</div>
        <div style={{ fontSize: 'var(--amex-font-size-sm)', opacity: 0.85, marginTop: 'var(--amex-space-1)' }}>{todayStr}</div>
      </div>

      <div className="amex-content">

        {/* Daily Budget Card */}
        {monthlyIncome > 0 ? (
          <div className="amex-account-card">
            <div style={{ textAlign: 'center' }}>
              <div className="amex-account-label">You can spend today</div>
              <div className="amex-account-balance" style={{ margin: 'var(--amex-space-2) 0' }}>
                R{dailyBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: 'var(--amex-font-size-xs)', opacity: 0.8 }}>
                R{remainingBalance.toLocaleString()} left this month &bull; {daysLeft} day{daysLeft !== 1 ? 's' : ''} to go
              </div>
            </div>
          </div>
        ) : (
          <div className="amex-card" style={{ textAlign: 'center' }}>
            <Wallet style={{ width: '32px', height: '32px', color: 'var(--amex-blue)', margin: '0 auto var(--amex-space-3)' }} />
            <div className="amex-card-title" style={{ marginBottom: 'var(--amex-space-2)' }}>Set Your Monthly Income</div>
            <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)', marginBottom: 'var(--amex-space-3)' }}>
              See your daily budget and track how your money lasts.
            </p>
            <button onClick={() => setShowIncomeInput(true)} className="amex-btn amex-btn-primary">
              Set Income
            </button>
          </div>
        )}

        {/* Overspend Alerts */}
        {hasOverspend && (
          <div className="amex-card" style={{ border: '1px solid var(--amex-red)', background: '#fef2f2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-3)', marginBottom: 'var(--amex-space-4)' }}>
              <AlertTriangle style={{ width: '24px', height: '24px', color: 'var(--amex-red)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-red)', fontSize: 'var(--amex-font-size-base)' }}>
                  {overspentBudgets.length} budget{overspentBudgets.length > 1 ? 's' : ''} overspent
                </div>
                <div style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-600)' }}>
                  R{totalOverspend.toLocaleString()} over total
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-2)' }}>
              {overspentBudgets.map(b => {
                const over = b.spent - b.budget;
                return (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--amex-space-3)', background: 'white', borderRadius: 'var(--amex-radius-lg)' }}>
                    <div>
                      <div style={{ fontWeight: 'var(--amex-font-weight-semibold)', fontSize: 'var(--amex-font-size-sm)' }}>{b.name}</div>
                      <div style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-red)' }}>R{over.toLocaleString()} over budget</div>
                    </div>
                    <button
                      onClick={() => handleFixCategory(b)}
                      style={{
                        padding: 'var(--amex-space-2) var(--amex-space-4)',
                        borderRadius: 'var(--amex-radius-full)',
                        border: 'none',
                        background: 'var(--amex-red)',
                        color: 'white',
                        fontWeight: 'var(--amex-font-weight-semibold)',
                        fontSize: 'var(--amex-font-size-xs)',
                        cursor: 'pointer',
                        fontFamily: 'var(--amex-font-family)',
                      }}
                    >
                      Fix It
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Message */}
        {monthlyIncome > 0 && !hasOverspend && (
          <div className="amex-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-3)' }}>
              <Wallet style={{ width: '24px', height: '24px', color: '#16a34a', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 'var(--amex-font-weight-semibold)', color: '#15803d', fontSize: 'var(--amex-font-size-sm)' }}>
                  {remainingBalance <= 0
                    ? "You've used all your income this month."
                    : dailySpendRate > dailyBudget
                      ? "Spending is high \u2014 try to stay under your daily budget."
                      : "You're on track. Keep it up!"
                  }
                </div>
                <div style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-600)', marginTop: '2px' }}>
                  Avg. R{dailySpendRate.toFixed(0)}/day spent
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Spending */}
        <div className="amex-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--amex-space-3)' }}>
            <div className="amex-card-title">Today</div>
            <span style={{ fontSize: 'var(--amex-font-size-lg)', fontWeight: 'var(--amex-font-weight-bold)', color: todayTotal > dailyBudget && monthlyIncome > 0 ? 'var(--amex-red)' : 'var(--amex-gray-900)' }}>
              R{todayTotal.toLocaleString()}
            </span>
          </div>

          {todayExpenses.length === 0 ? (
            <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-500)', textAlign: 'center', padding: 'var(--amex-space-4) 0' }}>
              No expenses logged today. Tap + to add one.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-2)' }}>
              {todayExpenses.slice(0, 5).map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--amex-space-2) 0', borderBottom: '1px solid var(--amex-gray-100)' }}>
                  <div>
                    <div style={{ fontWeight: 'var(--amex-font-weight-medium)', fontSize: 'var(--amex-font-size-sm)' }}>{e.merchant}</div>
                    <div style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-500)' }}>{getCategoryName(e.categoryId)} &bull; {formatTime(e.created_at)}</div>
                  </div>
                  <span style={{ fontWeight: 'var(--amex-font-weight-semibold)', fontSize: 'var(--amex-font-size-sm)' }}>R{e.amount.toLocaleString()}</span>
                </div>
              ))}
              {todayExpenses.length > 5 && (
                <p style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-500)', textAlign: 'center', paddingTop: 'var(--amex-space-2)' }}>
                  +{todayExpenses.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>

        {/* Month Summary Link */}
        {monthlyIncome > 0 && (
          <div className="amex-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--amex-space-3)' }}>
              <div className="amex-card-title">This Month</div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--amex-space-3)', marginBottom: 'var(--amex-space-4)' }}>
              <div style={{ flex: 1, padding: 'var(--amex-space-3)', background: 'var(--amex-gray-50)', borderRadius: 'var(--amex-radius-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-500)' }}>Income</div>
                <div style={{ fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-blue)' }}>R{monthlyIncome.toLocaleString()}</div>
              </div>
              <div style={{ flex: 1, padding: 'var(--amex-space-3)', background: 'var(--amex-gray-50)', borderRadius: 'var(--amex-radius-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-500)' }}>Spent</div>
                <div style={{ fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-gray-900)' }}>R{totalSpent.toLocaleString()}</div>
              </div>
              <div style={{ flex: 1, padding: 'var(--amex-space-3)', background: 'var(--amex-gray-50)', borderRadius: 'var(--amex-radius-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-500)' }}>Saved</div>
                <div style={{ fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-green)' }}>R{monthlySavings.toLocaleString()}</div>
              </div>
            </div>

            {/* Spending progress bar */}
            <div style={{ marginBottom: 'var(--amex-space-3)' }}>
              <div className="amex-progress">
                <div
                  className="amex-progress-bar"
                  style={{
                    width: `${Math.min(100, monthlyIncome > 0 ? (totalSpent / monthlyIncome) * 100 : 0)}%`,
                    background: totalSpent > monthlyIncome ? 'var(--amex-red)' : totalSpent > monthlyIncome * 0.8 ? 'var(--amex-orange)' : 'linear-gradient(90deg, var(--amex-blue) 0%, var(--amex-teal) 100%)'
                  }}
                ></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--amex-space-1)', fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-600)' }}>
                <span>{monthlyIncome > 0 ? ((totalSpent / monthlyIncome) * 100).toFixed(0) : 0}% of income used</span>
                <button
                  onClick={() => setShowIncomeInput(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--amex-blue)', fontSize: 'var(--amex-font-size-xs)', cursor: 'pointer', fontFamily: 'var(--amex-font-family)', fontWeight: 'var(--amex-font-weight-medium)' }}
                >
                  Update income
                </button>
              </div>
            </div>

            <button
              onClick={onShowMonthSummary}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--amex-space-2)',
                width: '100%',
                padding: 'var(--amex-space-3)',
                background: 'var(--amex-blue-light)',
                color: 'var(--amex-blue)',
                border: 'none',
                borderRadius: 'var(--amex-radius-lg)',
                fontWeight: 'var(--amex-font-weight-semibold)',
                fontSize: 'var(--amex-font-size-sm)',
                cursor: 'pointer',
                fontFamily: 'var(--amex-font-family)',
              }}
            >
              <Calendar style={{ width: '16px', height: '16px' }} />
              View Full Month
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {/* Savings */}
        <div className="amex-card">
          <div className="amex-list">
            <div className="amex-list-item">
              <div className="amex-list-content">
                <div className="amex-list-title">R{monthlySavings.toLocaleString()}</div>
                <div className="amex-list-subtitle">Monthly Savings &bull; YTD: R{ytdSavings.toLocaleString()}</div>
              </div>
              <button onClick={() => setShowSavingsInput(true)} className="amex-btn amex-btn-sm amex-btn-outline">Update</button>
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}
      {showIncomeInput && (
        <InlineAmountInput
          title="Monthly Income"
          currentValue={monthlyIncome}
          onSave={onUpdateIncome}
          onClose={() => setShowIncomeInput(false)}
        />
      )}
      {showSavingsInput && (
        <InlineAmountInput
          title="Monthly Savings"
          currentValue={monthlySavings}
          onSave={onUpdateSavings}
          onClose={() => setShowSavingsInput(false)}
        />
      )}
      {showRebalance && (
        <RebalanceSheet
          budgets={budgets}
          targetBudget={rebalanceTarget}
          onRebalance={onRebalance}
          onClose={() => { setShowRebalance(false); setRebalanceTarget(undefined); }}
        />
      )}
    </div>
  );
}
