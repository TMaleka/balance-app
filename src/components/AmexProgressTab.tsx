import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { Budget } from '../types';
import { supabase } from '../supabaseClient';

interface AmexProgressTabProps {
  budgets: Budget[];
  rebalanceCount: number;
  savings: number;
  ytdSavings: number;
  selectedDate: Date;
  annualizedExpenses: number;
  ytdExpenses: number;
  session?: any;
  onManageBudget: () => void;
  onAddSpend: (budgetId: number) => void;
  onRemoveSpend: (budgetId: number) => void;
  onUpdateSavings: (amount: number) => void;
  onDateChange: (date: Date) => void;
  showBudgetBreakdown?: boolean;
}

export default function AmexProgressTab({ 
  budgets, 
  rebalanceCount, 
  savings, 
  ytdSavings, 
  selectedDate, 
  annualizedExpenses, 
  ytdExpenses, 
  session,
  onManageBudget, 
  onAddSpend, 
  onRemoveSpend, 
  onUpdateSavings, 
  onDateChange, 
  showBudgetBreakdown = true 
}: AmexProgressTabProps) {
  const [withdrawalRate, setWithdrawalRate] = useState(4);
  const [userName, setUserName] = useState<string>('User');

  // Fetch user's full name from database
  useEffect(() => {
    const fetchUserName = async () => {
      if (session?.user?.id) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', session.user.id)
            .single();

          if (!error && data?.full_name) {
            setUserName(data.full_name);
          } else {
            // Fallback to email username
            const emailName = session.user.email?.split('@')[0] || 'User';
            setUserName(emailName);
          }
        } catch (err) {
          console.error('Error fetching user name:', err);
          const emailName = session.user.email?.split('@')[0] || 'User';
          setUserName(emailName);
        }
      }
    };

    fetchUserName();
  }, [session]);
  
  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const [year, month] = event.target.value.split('-').map(Number);
    onDateChange(new Date(year, month));
  };

  const handleUpdateSavings = () => {
    const amountStr = prompt('Enter savings amount:');
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        onUpdateSavings(amount);
      }
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const fuGoal = withdrawalRate > 0 ? annualizedExpenses / (withdrawalRate / 100) : 0;
  const fuProgress = fuGoal > 0 ? (ytdSavings / fuGoal) * 100 : 0;
  
  // Format current month and year
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  
  // Generate year options (current year and 2 years back/forward)
  const yearOptions = [];
  for (let i = -2; i <= 2; i++) {
    yearOptions.push(currentYear + i);
  }
  
  // Month/Year change handlers
  const handleMonthYearChange = (month: number, year: number) => {
    const newDate = new Date(year, month, 1);
    onDateChange(newDate);
  };

  return (
    <div>
      {/* Amex Header */}
      <div className="amex-header">
        <div className="amex-header-greeting">Good day</div>
        <div className="amex-header-name">{userName}</div>
      </div>

      <div className="amex-content">

        {/* Account Card */}
        <div className="amex-account-card">
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', marginBottom: 'var(--amex-space-3)' }}>
            <select 
              value={currentMonth}
              onChange={(e) => handleMonthYearChange(parseInt(e.target.value), currentYear)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index} style={{ background: '#006FCF', color: 'white' }}>
                  {month}
                </option>
              ))}
            </select>
            <select 
              value={currentYear}
              onChange={(e) => handleMonthYearChange(currentMonth, parseInt(e.target.value))}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year} style={{ background: '#006FCF', color: 'white' }}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="amex-account-balance">R{totalRemaining.toLocaleString()}</div>
            <div className="amex-account-label">Available to spend</div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="amex-card">
          <div className="amex-section-title">Summary</div>
          <div className="amex-list">
            <div className="amex-list-item">
              <div className="amex-list-content">
                <div className="amex-list-title">R{totalSpent.toLocaleString()}</div>
                <div className="amex-list-subtitle">Month Expenses • YTD: R{ytdExpenses.toLocaleString()}</div>
              </div>
            </div>
            <div className="amex-list-item">
              <div className="amex-list-content">
                <div className="amex-list-title">R{savings.toLocaleString()}</div>
                <div className="amex-list-subtitle">Monthly Savings • YTD: R{ytdSavings.toLocaleString()}</div>
              </div>
              <button onClick={handleUpdateSavings} className="amex-btn amex-btn-sm amex-btn-outline">Update</button>
            </div>
          </div>
        </div>

        {/* FI Goal Card */}
        <div className="amex-card">
          <div className="amex-card-header">
            <div>
              <div className="amex-card-title">FI Goal</div>
              <div className="amex-card-subtitle" style={{ fontSize: 'var(--amex-font-size-2xl)', fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-blue)', marginTop: 'var(--amex-space-2)' }}>
                R{fuGoal.toLocaleString()}
              </div>
            </div>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              background: 'var(--amex-blue-light)', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award style={{ width: '24px', height: '24px', color: 'var(--amex-blue)' }} />
            </div>
          </div>
          
          {/* Progress Bar */}
          <div style={{ marginBottom: 'var(--amex-space-4)' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: 'var(--amex-space-2)',
              fontSize: 'var(--amex-font-size-sm)',
              color: 'var(--amex-gray-600)'
            }}>
              <span>{fuProgress.toFixed(1)}% Complete</span>
              <span>{withdrawalRate}% Rule</span>
            </div>
            <div className="amex-progress">
              <div 
                className="amex-progress-bar"
                style={{ width: `${Math.min(100, fuProgress)}%` }}
              ></div>
            </div>
          </div>

          {/* Withdrawal Rate Slider */}
          <div>
            <label className="amex-label">
              Withdrawal Rate
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-3)' }}>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={withdrawalRate}
                onChange={(e) => setWithdrawalRate(Number(e.target.value))}
                style={{
                  flex: 1,
                  height: '4px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ 
                fontSize: 'var(--amex-font-size-base)', 
                fontWeight: 'var(--amex-font-weight-semibold)',
                minWidth: '48px',
                textAlign: 'right',
                color: 'var(--amex-blue)'
              }}>
                {withdrawalRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Budget Categories */}
        {showBudgetBreakdown && (
          <div className="amex-card">
            <div className="amex-card-header">
              <h3 className="amex-card-title">Categories</h3>
              <button 
                onClick={onManageBudget}
                className="amex-btn amex-btn-sm amex-btn-outline"
              >
                Manage
              </button>
            </div>
            
            <div className="amex-list">
              {budgets.map((budget) => {
                const percentage = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;
                const remaining = budget.budget - budget.spent;
                const isOverspent = budget.spent > budget.budget;
                
                return (
                  <div key={budget.id} className="amex-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--amex-space-2)' }}>
                      <span style={{ fontSize: 'var(--amex-font-size-base)', fontWeight: 'var(--amex-font-weight-semibold)' }}>{budget.name}</span>
                      <span style={{ fontSize: 'var(--amex-font-size-base)', fontWeight: 'var(--amex-font-weight-semibold)', color: isOverspent ? 'var(--amex-red)' : 'var(--amex-gray-900)' }}>
                        R{remaining.toLocaleString()}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--amex-space-2)' }}>
                      <span style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)' }}>
                        R{budget.spent.toLocaleString()} of R{budget.budget.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 'var(--amex-font-size-xs)', fontWeight: 'var(--amex-font-weight-medium)', color: isOverspent ? 'var(--amex-red)' : 'var(--amex-gray-600)' }}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="amex-progress" style={{ width: '100%' }}>
                      <div 
                        className="amex-progress-bar"
                        style={{ 
                          width: `${Math.min(100, percentage)}%`,
                          background: isOverspent ? 'var(--amex-red)' : percentage > 80 ? 'var(--amex-orange)' : 'linear-gradient(90deg, var(--amex-blue) 0%, var(--amex-teal) 100%)'
                        }}
                      ></div>
                    </div>
                    
                    {isOverspent && (
                      <p style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-red)', marginTop: 'var(--amex-space-1)' }}>
                        Overspent by R{(budget.spent - budget.budget).toLocaleString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Achievement Badge */}
        {rebalanceCount > 0 && (
          <div className="amex-card" style={{ background: 'linear-gradient(135deg, #E8F8F2 0%, #D4F4E8 100%)', border: '1px solid var(--amex-green)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', background: 'var(--amex-green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--amex-space-3)' }}>
                <Award style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <h3 style={{ fontSize: 'var(--amex-font-size-base)', fontWeight: 'var(--amex-font-weight-semibold)', color: 'var(--amex-green)', marginBottom: 'var(--amex-space-1)' }}>Budget Master</h3>
              <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-700)' }}>
                {rebalanceCount} successful rebalance{rebalanceCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

