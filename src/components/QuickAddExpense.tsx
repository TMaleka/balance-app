import React, { useState } from 'react';
import { Plus, X, AlertTriangle } from 'lucide-react';
import { Budget } from '../types';

interface QuickAddExpenseProps {
  budgets: Budget[];
  onExpenseAdded: (merchant: string, amount: number, categoryId: number) => void;
  onRequestRebalance?: () => void;
}

export default function QuickAddExpense({ budgets, onExpenseAdded, onRequestRebalance }: QuickAddExpenseProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [step, setStep] = useState<'amount' | 'details'>('amount');

  const overspent = budgets.filter(b => b.spent > b.budget);
  const totalOverspend = overspent.reduce((sum, b) => sum + (b.spent - b.budget), 0);

  const handleFabClick = () => {
    if (overspent.length > 0) {
      setShowNudge(true);
    } else {
      setIsOpen(true);
    }
  };

  const handleLogAnyway = () => {
    setShowNudge(false);
    setIsOpen(true);
  };

  const handleFixNow = () => {
    setShowNudge(false);
    if (onRequestRebalance) onRequestRebalance();
  };

  const reset = () => {
    setAmount('');
    setMerchant('');
    setCategoryId('');
    setStep('amount');
    setIsOpen(false);
    setShowNudge(false);
  };

  const handleAmountNext = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    setStep('details');
  };

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || !merchant.trim() || !categoryId) return;
    onExpenseAdded(merchant.trim(), num, parseInt(categoryId));
    reset();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'amount') handleAmountNext();
      else handleSubmit();
    }
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={handleFabClick}
        style={{
          position: 'fixed',
          bottom: '88px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--amex-blue) 0%, var(--amex-blue-dark) 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0, 111, 207, 0.4)',
          zIndex: 100,
          transition: 'transform 150ms ease, box-shadow 150ms ease',
        }}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) scale(0.92)';
        }}
        onPointerUp={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) scale(1)';
        }}
        onPointerLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) scale(1)';
        }}
      >
        <Plus style={{ width: '28px', height: '28px' }} />
      </button>

      {/* Backdrop + Bottom Sheet */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={reset}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              animation: 'fadeIn 200ms ease',
            }}
          />

          {/* Sheet */}
          <div
            style={{
              position: 'relative',
              background: 'var(--amex-white)',
              borderRadius: 'var(--amex-radius-2xl) var(--amex-radius-2xl) 0 0',
              padding: 'var(--amex-space-6)',
              maxHeight: '85vh',
              animation: 'slideUp 250ms ease',
            }}
          >
            {/* Handle bar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--amex-space-4)' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--amex-gray-300)' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--amex-space-5)' }}>
              <h2 style={{ fontSize: 'var(--amex-font-size-xl)', fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-gray-900)' }}>
                {step === 'amount' ? 'How much?' : 'Details'}
              </h2>
              <button
                onClick={reset}
                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--amex-gray-100)', border: 'none', cursor: 'pointer' }}
              >
                <X style={{ width: '18px', height: '18px', color: 'var(--amex-gray-600)' }} />
              </button>
            </div>

            {step === 'amount' ? (
              /* Step 1: Amount */
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'var(--amex-space-8) 0',
                }}>
                  <span style={{ fontSize: 'var(--amex-font-size-3xl)', fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-gray-400)', marginRight: 'var(--amex-space-2)' }}>R</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="0.00"
                    autoFocus
                    step="0.01"
                    min="0"
                    style={{
                      fontSize: '3rem',
                      fontWeight: 'var(--amex-font-weight-bold)',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      width: '200px',
                      textAlign: 'center',
                      fontFamily: 'var(--amex-font-family)',
                      color: 'var(--amex-gray-900)',
                    }}
                  />
                </div>

                <button
                  onClick={handleAmountNext}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="amex-btn amex-btn-primary"
                  style={{
                    width: '100%',
                    marginTop: 'var(--amex-space-4)',
                    opacity: (!amount || parseFloat(amount) <= 0) ? 0.5 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            ) : (
              /* Step 2: Merchant + Category */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-4)' }}>
                {/* Amount summary */}
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--amex-space-3)',
                  background: 'var(--amex-blue-light)',
                  borderRadius: 'var(--amex-radius-lg)',
                }}>
                  <span style={{ fontSize: 'var(--amex-font-size-2xl)', fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-blue)' }}>
                    R{parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Merchant */}
                <div>
                  <label className="amex-label">Where did you spend?</label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pick n Pay, KFC, Shell..."
                    className="amex-input"
                    autoFocus
                  />
                </div>

                {/* Category - quick tap buttons */}
                <div>
                  <label className="amex-label">Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--amex-space-2)' }}>
                    {budgets.map(budget => (
                      <button
                        key={budget.id}
                        onClick={() => setCategoryId(String(budget.id))}
                        style={{
                          padding: 'var(--amex-space-2) var(--amex-space-4)',
                          borderRadius: 'var(--amex-radius-full)',
                          border: categoryId === String(budget.id) ? '2px solid var(--amex-blue)' : '2px solid var(--amex-gray-200)',
                          background: categoryId === String(budget.id) ? 'var(--amex-blue-light)' : 'var(--amex-white)',
                          color: categoryId === String(budget.id) ? 'var(--amex-blue)' : 'var(--amex-gray-700)',
                          fontWeight: 'var(--amex-font-weight-medium)',
                          fontSize: 'var(--amex-font-size-sm)',
                          cursor: 'pointer',
                          fontFamily: 'var(--amex-font-family)',
                          transition: 'all var(--amex-transition-fast)',
                        }}
                      >
                        {budget.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--amex-space-3)', marginTop: 'var(--amex-space-2)' }}>
                  <button
                    onClick={() => setStep('amount')}
                    className="amex-btn amex-btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!merchant.trim() || !categoryId}
                    className="amex-btn amex-btn-primary"
                    style={{
                      flex: 2,
                      opacity: (!merchant.trim() || !categoryId) ? 0.5 : 1,
                    }}
                  >
                    Add Expense
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Overspend Nudge */}
      {showNudge && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={reset} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', animation: 'fadeIn 200ms ease' }} />
          <div style={{ position: 'relative', background: 'var(--amex-white)', borderRadius: 'var(--amex-radius-2xl) var(--amex-radius-2xl) 0 0', padding: 'var(--amex-space-6)', animation: 'slideUp 250ms ease' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--amex-space-4)' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--amex-gray-300)' }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 'var(--amex-space-5)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--amex-space-3)' }}>
                <AlertTriangle style={{ width: '28px', height: '28px', color: 'var(--amex-red)' }} />
              </div>
              <h2 style={{ fontSize: 'var(--amex-font-size-xl)', fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-gray-900)', marginBottom: 'var(--amex-space-2)' }}>
                Stay in Control
              </h2>
              <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)', lineHeight: 1.5 }}>
                You're <strong style={{ color: 'var(--amex-red)' }}>R{totalOverspend.toLocaleString()}</strong> over in {overspent.length} categor{overspent.length > 1 ? 'ies' : 'y'}. Restore balance before adding more?
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-3)' }}>
              {onRequestRebalance && (
                <button onClick={handleFixNow} className="amex-btn amex-btn-primary" style={{ width: '100%' }}>
                  Restore Balance
                </button>
              )}
              <button onClick={handleLogAnyway} className="amex-btn amex-btn-secondary" style={{ width: '100%' }}>
                Continue Without Fixing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
