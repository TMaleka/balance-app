import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Budget } from '../types';

interface RebalanceSheetProps {
  budgets: Budget[];
  targetBudget?: Budget; // pre-selected overspent category
  onRebalance: (fromId: number | string, toId: number | string, amount: number) => void;
  onClose: () => void;
}

export default function RebalanceSheet({ budgets, targetBudget, onRebalance, onClose }: RebalanceSheetProps) {
  const overspent = budgets.filter(b => b.spent > b.budget);
  const withSurplus = budgets.filter(b => b.budget - b.spent > 0);

  const [selectedTarget, setSelectedTarget] = useState<Budget | null>(targetBudget || overspent[0] || null);
  const [selectedSource, setSelectedSource] = useState<Budget | null>(null);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'pick' | 'amount'>('pick');

  const overAmount = selectedTarget ? selectedTarget.spent - selectedTarget.budget : 0;
  const maxFromSource = selectedSource ? selectedSource.budget - selectedSource.spent : 0;
  const suggestedAmount = Math.min(overAmount, maxFromSource);

  const handleConfirm = () => {
    if (!selectedSource || !selectedTarget || !amount) return;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    onRebalance(selectedSource.id, selectedTarget.id, num);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', animation: 'fadeIn 200ms ease' }} />
      <div style={{ position: 'relative', background: 'var(--amex-white)', borderRadius: 'var(--amex-radius-2xl) var(--amex-radius-2xl) 0 0', padding: 'var(--amex-space-6)', maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp 250ms ease' }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--amex-space-4)' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--amex-gray-300)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--amex-space-5)' }}>
          <h2 style={{ fontSize: 'var(--amex-font-size-xl)', fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-gray-900)' }}>
            Fix Overspend
          </h2>
          <button onClick={onClose} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--amex-gray-100)', border: 'none', cursor: 'pointer' }}>
            <X style={{ width: '18px', height: '18px', color: 'var(--amex-gray-600)' }} />
          </button>
        </div>

        {step === 'pick' ? (
          <>
            {/* Target: overspent category */}
            {overspent.length > 0 && (
              <div style={{ marginBottom: 'var(--amex-space-5)' }}>
                <label className="amex-label">Overspent category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--amex-space-2)' }}>
                  {overspent.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedTarget(b)}
                      style={{
                        padding: 'var(--amex-space-3) var(--amex-space-4)',
                        borderRadius: 'var(--amex-radius-lg)',
                        border: selectedTarget?.id === b.id ? '2px solid var(--amex-red)' : '2px solid var(--amex-gray-200)',
                        background: selectedTarget?.id === b.id ? '#fef2f2' : 'var(--amex-white)',
                        cursor: 'pointer',
                        fontFamily: 'var(--amex-font-family)',
                        transition: 'all var(--amex-transition-fast)',
                      }}
                    >
                      <div style={{ fontWeight: 'var(--amex-font-weight-semibold)', fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-900)' }}>{b.name}</div>
                      <div style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-red)', marginTop: '2px' }}>R{(b.spent - b.budget).toLocaleString()} over</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Source: category with surplus */}
            <div style={{ marginBottom: 'var(--amex-space-5)' }}>
              <label className="amex-label">Move budget from</label>
              {withSurplus.length === 0 ? (
                <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-500)' }}>No categories with remaining budget.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-2)' }}>
                  {withSurplus.map(b => {
                    const surplus = b.budget - b.spent;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelectedSource(b)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 'var(--amex-space-3) var(--amex-space-4)',
                          borderRadius: 'var(--amex-radius-lg)',
                          border: selectedSource?.id === b.id ? '2px solid var(--amex-blue)' : '2px solid var(--amex-gray-200)',
                          background: selectedSource?.id === b.id ? 'var(--amex-blue-light)' : 'var(--amex-white)',
                          cursor: 'pointer',
                          fontFamily: 'var(--amex-font-family)',
                          transition: 'all var(--amex-transition-fast)',
                        }}
                      >
                        <span style={{ fontWeight: 'var(--amex-font-weight-medium)', fontSize: 'var(--amex-font-size-sm)' }}>{b.name}</span>
                        <span style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-green)' }}>R{surplus.toLocaleString()} left</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => { setAmount(String(suggestedAmount > 0 ? suggestedAmount : '')); setStep('amount'); }}
              disabled={!selectedSource || !selectedTarget}
              className="amex-btn amex-btn-primary"
              style={{ width: '100%', opacity: (!selectedSource || !selectedTarget) ? 0.5 : 1 }}
            >
              Next
            </button>
          </>
        ) : (
          <>
            {/* Summary */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--amex-space-3)', marginBottom: 'var(--amex-space-5)', padding: 'var(--amex-space-4)', background: 'var(--amex-gray-50)', borderRadius: 'var(--amex-radius-lg)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-500)' }}>From</div>
                <div style={{ fontWeight: 'var(--amex-font-weight-semibold)', fontSize: 'var(--amex-font-size-sm)' }}>{selectedSource?.name}</div>
              </div>
              <ArrowRight style={{ width: '20px', height: '20px', color: 'var(--amex-blue)', flexShrink: 0 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-500)' }}>To</div>
                <div style={{ fontWeight: 'var(--amex-font-weight-semibold)', fontSize: 'var(--amex-font-size-sm)' }}>{selectedTarget?.name}</div>
              </div>
            </div>

            {/* Amount */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--amex-space-6) 0' }}>
              <span style={{ fontSize: 'var(--amex-font-size-3xl)', fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-gray-400)', marginRight: 'var(--amex-space-2)' }}>R</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
                placeholder="0"
                autoFocus
                step="0.01"
                min="0"
                style={{ fontSize: '3rem', fontWeight: 'var(--amex-font-weight-bold)', border: 'none', outline: 'none', background: 'transparent', width: '180px', textAlign: 'center', fontFamily: 'var(--amex-font-family)', color: 'var(--amex-gray-900)' }}
              />
            </div>

            {suggestedAmount > 0 && (
              <button
                onClick={() => setAmount(String(suggestedAmount))}
                style={{ display: 'block', margin: '0 auto var(--amex-space-4)', padding: 'var(--amex-space-2) var(--amex-space-4)', borderRadius: 'var(--amex-radius-full)', border: '1px solid var(--amex-blue)', background: 'var(--amex-blue-light)', color: 'var(--amex-blue)', fontSize: 'var(--amex-font-size-xs)', fontWeight: 'var(--amex-font-weight-medium)', cursor: 'pointer', fontFamily: 'var(--amex-font-family)' }}
              >
                Suggested: R{suggestedAmount.toLocaleString()}
              </button>
            )}

            <div style={{ display: 'flex', gap: 'var(--amex-space-3)' }}>
              <button onClick={() => setStep('pick')} className="amex-btn amex-btn-secondary" style={{ flex: 1 }}>Back</button>
              <button
                onClick={handleConfirm}
                disabled={!amount || parseFloat(amount) <= 0}
                className="amex-btn amex-btn-primary"
                style={{ flex: 2, opacity: (!amount || parseFloat(amount) <= 0) ? 0.5 : 1 }}
              >
                Rebalance
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
