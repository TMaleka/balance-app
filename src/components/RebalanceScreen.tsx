import React, { useMemo } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Budget } from '../types';

interface RebalanceScreenProps {
  budgets: Budget[];
  overspentBudget: Budget;
  overspentAmount: number;
  onConfirm: (newBudgets: Budget[]) => void;
  onBack: () => void;
}

export default function RebalanceScreen({ 
  budgets, 
  overspentBudget, 
  overspentAmount, 
  onConfirm, 
  onBack 
}: RebalanceScreenProps) {
  const rebalancePlan = useMemo(() => {
    const otherBudgets = budgets.filter(b => b.id !== overspentBudget.id);
    const totalAvailableToReduce = otherBudgets.reduce((sum, budget) => {
      const available = Math.max(0, budget.budget - budget.spent - 100); // Keep at least R100 buffer
      return sum + available;
    }, 0);

    if (totalAvailableToReduce < overspentAmount) {
      // Fallback: distribute proportionally
      return otherBudgets.map(budget => {
        const proportion = (budget.budget - budget.spent) / (budgets.reduce((sum, b) => sum + (b.budget - b.spent), 0) - (overspentBudget.budget - overspentBudget.spent));
        const reduction = Math.min(budget.budget - budget.spent - 5, overspentAmount * proportion);
        return {
          ...budget,
          originalBudget: budget.budget,
          reduction: Math.max(0, reduction),
          newBudget: budget.budget - Math.max(0, reduction)
        };
      });
    }

    // Smart rebalancing: prioritize budgets with more room
    const plan = otherBudgets.map(budget => {
      const available = Math.max(0, budget.budget - budget.spent - 10);
      return {
        ...budget,
        originalBudget: budget.budget,
        available,
        reduction: 0,
        newBudget: budget.budget
      };
    }).sort((a, b) => b.available - a.available);

    let remainingToReduce = overspentAmount;
    
    plan.forEach(budget => {
      if (remainingToReduce > 0 && budget.available > 0) {
        const reduction = Math.min(budget.available, remainingToReduce);
        budget.reduction = reduction;
        budget.newBudget = budget.budget - reduction;
        remainingToReduce -= reduction;
      }
    });

    return plan.filter(p => p.reduction > 0);
  }, [budgets, overspentBudget, overspentAmount]);

  const handleConfirm = () => {
    const newBudgets = budgets.map(budget => {
      if (budget.id === overspentBudget.id) {
        return budget; // Keep the overspent budget as-is
      }
      
      const planItem = rebalancePlan.find(p => p.id === budget.id);
      return planItem ? { ...budget, budget: planItem.newBudget } : budget;
    });

    onConfirm(newBudgets);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--amex-gray-50)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div className="amex-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-4)' }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: 'var(--amex-radius-lg)',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all var(--amex-transition-base)'
          }}
        >
          <ArrowLeft style={{ width: '20px', height: '20px', color: 'white' }} />
        </button>
        <div>
          <div className="amex-header-greeting">Budget Rebalance</div>
          <div className="amex-header-name">Review Changes</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="amex-content">
        <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--amex-space-6)' }}>
            <h1 style={{
              fontSize: 'var(--amex-font-size-2xl)',
              fontWeight: 'var(--amex-font-weight-bold)',
              color: 'var(--amex-gray-900)',
              marginBottom: 'var(--amex-space-2)'
            }}>
              Your Rebalance Plan
            </h1>
            <p style={{
              fontSize: 'var(--amex-font-size-base)',
              color: 'var(--amex-gray-600)'
            }}>
              We'll adjust your flexible budgets to cover the R{overspentAmount.toFixed(2)}
            </p>
          </div>

          {/* Rebalance Details */}
          <div className="amex-card" style={{ marginBottom: 'var(--amex-space-6)' }}>
            <div style={{
              fontSize: 'var(--amex-font-size-base)',
              fontWeight: 'var(--amex-font-weight-semibold)',
              color: 'var(--amex-gray-900)',
              marginBottom: 'var(--amex-space-4)'
            }}>
              Budget Adjustments
            </div>
            
            <div className="amex-list">
              {rebalancePlan.map((budget) => (
                <div key={budget.id} className="amex-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--amex-space-2)' }}>
                    <span style={{ 
                      fontSize: 'var(--amex-font-size-base)', 
                      fontWeight: 'var(--amex-font-weight-semibold)',
                      color: 'var(--amex-gray-900)'
                    }}>
                      {budget.name}
                    </span>
                    <span style={{ 
                      fontSize: 'var(--amex-font-size-base)', 
                      fontWeight: 'var(--amex-font-weight-bold)',
                      color: 'var(--amex-red)'
                    }}>
                      -R{budget.reduction.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: 'var(--amex-font-size-sm)', 
                    color: 'var(--amex-gray-600)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--amex-space-2)'
                  }}>
                    <span>R{budget.originalBudget.toFixed(0)}</span>
                    <span>→</span>
                    <span style={{ fontWeight: 'var(--amex-font-weight-semibold)' }}>
                      R{budget.newBudget.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total */}
            <div style={{ 
              paddingTop: 'var(--amex-space-4)',
              borderTop: '2px solid var(--amex-gray-200)',
              marginTop: 'var(--amex-space-4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: 'var(--amex-font-size-base)', 
                  fontWeight: 'var(--amex-font-weight-semibold)',
                  color: 'var(--amex-gray-900)'
                }}>
                  Total Freed Up:
                </span>
                <span style={{ 
                  fontSize: 'var(--amex-font-size-xl)', 
                  fontWeight: 'var(--amex-font-weight-bold)',
                  color: 'var(--amex-green)'
                }}>
                  R{rebalancePlan.reduce((sum, p) => sum + p.reduction, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Confirmation Button */}
          <button
            onClick={handleConfirm}
            className="amex-btn amex-btn-lg"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--amex-blue) 0%, var(--amex-blue-dark) 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--amex-space-3)',
              boxShadow: 'var(--amex-shadow-lg)',
              marginBottom: 'var(--amex-space-4)'
            }}
          >
            <Check style={{ width: '24px', height: '24px' }} />
            <span>Confirm & Rebalance</span>
          </button>

          {/* Reassurance */}
          <p style={{
            fontSize: 'var(--amex-font-size-sm)',
            color: 'var(--amex-gray-600)',
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            Your spending is automatically balanced. You can adjust these budgets anytime in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
