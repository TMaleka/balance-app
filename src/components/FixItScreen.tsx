import { AlertCircle, ArrowLeft, Zap } from 'lucide-react';
import { Budget, Expense } from '../types';

interface FixItScreenProps {
  budget: Budget;
  expense: Expense | null;
  overspentAmount: number;
  onRebalance: () => void;
  onBack: () => void;
}

export default function FixItScreen({ budget, expense, overspentAmount, onRebalance, onBack }: FixItScreenProps) {
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
          <div className="amex-header-greeting">Budget Alert</div>
          <div className="amex-header-name">Action Required</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="amex-content" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        paddingTop: 'var(--amex-space-8)',
        paddingBottom: 'var(--amex-space-8)'
      }}>
        <div style={{ maxWidth: '500px', width: '100%' }}>
          {/* Alert Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #FDECEA 0%, #FEE)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--amex-space-6)',
            boxShadow: '0 4px 12px rgba(230, 57, 70, 0.2)'
          }}>
            <AlertCircle style={{ width: '48px', height: '48px', color: 'var(--amex-red)' }} />
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'var(--amex-font-size-3xl)',
            fontWeight: 'var(--amex-font-weight-bold)',
            color: 'var(--amex-gray-900)',
            marginBottom: 'var(--amex-space-4)'
          }}>
            Budget Exceeded
          </h1>
          
          {/* Details Card */}
          <div className="amex-card" style={{ marginBottom: 'var(--amex-space-6)', textAlign: 'left' }}>
            <div style={{ marginBottom: 'var(--amex-space-4)' }}>
              <div style={{ 
                fontSize: 'var(--amex-font-size-sm)', 
                color: 'var(--amex-gray-600)',
                marginBottom: 'var(--amex-space-2)'
              }}>
                Recent Transaction
              </div>
              <div style={{ 
                fontSize: 'var(--amex-font-size-lg)', 
                fontWeight: 'var(--amex-font-weight-semibold)',
                color: 'var(--amex-gray-900)',
                marginBottom: 'var(--amex-space-1)'
              }}>
                {expense?.merchant || 'Manual Entry'}
              </div>
              <div style={{ 
                fontSize: 'var(--amex-font-size-2xl)', 
                fontWeight: 'var(--amex-font-weight-bold)',
                color: 'var(--amex-red)'
              }}>
                R{expense?.amount.toFixed(2)}
              </div>
            </div>

            <div className="amex-divider"></div>

            <div style={{ marginTop: 'var(--amex-space-4)' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: 'var(--amex-space-2)'
              }}>
                <span style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)' }}>
                  Category
                </span>
                <span style={{ fontSize: 'var(--amex-font-size-base)', fontWeight: 'var(--amex-font-weight-semibold)' }}>
                  {budget.name}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: 'var(--amex-space-2)'
              }}>
                <span style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)' }}>
                  Over Budget By
                </span>
                <span style={{ 
                  fontSize: 'var(--amex-font-size-lg)', 
                  fontWeight: 'var(--amex-font-weight-bold)',
                  color: 'var(--amex-red)'
                }}>
                  R{overspentAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Reassurance Message */}
          <p style={{
            fontSize: 'var(--amex-font-size-base)',
            color: 'var(--amex-gray-700)',
            marginBottom: 'var(--amex-space-6)',
            lineHeight: '1.6'
          }}>
            No worries! We can automatically rebalance your budget by adjusting other categories.
          </p>
          
          {/* Rebalance Button */}
          <button
            onClick={onRebalance}
            className="amex-btn amex-btn-lg"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--amex-blue) 0%, var(--amex-blue-dark) 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--amex-space-3)',
              boxShadow: 'var(--amex-shadow-lg)'
            }}
          >
            <Zap style={{ width: '24px', height: '24px' }} />
            <span>Rebalance My Budget</span>
          </button>
        </div>
      </div>
    </div>
  );
}
