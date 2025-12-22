import React, { useState } from 'react';
import { TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { Budget } from '../types';
import BalanceLogo from '../assets/BalanceLogo';

interface AmexOnboardingFlowProps {
  onComplete: (budgets: Omit<Budget, 'id' | 'spent'>[]) => void;
}

export const SUGGESTED_BUDGETS: Omit<Budget, 'id' | 'spent'>[] = [
  { name: 'Groceries', budget: 2500 },
  { name: 'Takeaways', budget: 1200 },
  { name: 'Shopping', budget: 1500 },
  { name: 'Petrol & Transport', budget: 1800 },
  { name: 'Airtime & Data', budget: 500 },
];

export default function AmexOnboardingFlow({ onComplete }: AmexOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [budgets, setBudgets] = useState(SUGGESTED_BUDGETS);

  const steps = [
    {
      title: "Welcome to Balance",
      subtitle: "Your financial companion",
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--amex-space-8)'
          }}>
            <BalanceLogo size={100} />
          </div>
          <div style={{ marginBottom: 'var(--amex-space-6)' }}>
            <h3 style={{
              fontSize: 'var(--amex-font-size-2xl)',
              fontWeight: 'var(--amex-font-weight-bold)',
              color: 'var(--amex-gray-900)',
              marginBottom: 'var(--amex-space-3)'
            }}>
              Track → Balance → Thrive
            </h3>
            <p style={{
              fontSize: 'var(--amex-font-size-base)',
              color: 'var(--amex-gray-600)',
              lineHeight: '1.6',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              Add expenses manually to track spending. When you go over, we'll help you rebalance instantly.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "How It Works",
      subtitle: "Three simple steps",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-4)' }}>
          <div className="amex-card" style={{ padding: 'var(--amex-space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--amex-space-4)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'var(--amex-blue-light)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{
                  fontSize: 'var(--amex-font-size-lg)',
                  fontWeight: 'var(--amex-font-weight-bold)',
                  color: 'var(--amex-blue)'
                }}>1</span>
              </div>
              <div>
                <h4 style={{
                  fontSize: 'var(--amex-font-size-base)',
                  fontWeight: 'var(--amex-font-weight-semibold)',
                  color: 'var(--amex-gray-900)',
                  marginBottom: 'var(--amex-space-2)'
                }}>Add Your Expenses</h4>
                <p style={{
                  fontSize: 'var(--amex-font-size-sm)',
                  color: 'var(--amex-gray-600)',
                  lineHeight: '1.5'
                }}>Manually enter your purchases with merchant name, amount, and category.</p>
              </div>
            </div>
          </div>
          
          <div className="amex-card" style={{ padding: 'var(--amex-space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--amex-space-4)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'var(--amex-blue-light)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{
                  fontSize: 'var(--amex-font-size-lg)',
                  fontWeight: 'var(--amex-font-weight-bold)',
                  color: 'var(--amex-blue)'
                }}>2</span>
              </div>
              <div>
                <h4 style={{
                  fontSize: 'var(--amex-font-size-base)',
                  fontWeight: 'var(--amex-font-weight-semibold)',
                  color: 'var(--amex-gray-900)',
                  marginBottom: 'var(--amex-space-2)'
                }}>Track Your Spending</h4>
                <p style={{
                  fontSize: 'var(--amex-font-size-sm)',
                  color: 'var(--amex-gray-600)',
                  lineHeight: '1.5'
                }}>Monitor your progress across categories with real-time budget tracking.</p>
              </div>
            </div>
          </div>
          
          <div className="amex-card" style={{ padding: 'var(--amex-space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--amex-space-4)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'var(--amex-blue-light)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{
                  fontSize: 'var(--amex-font-size-lg)',
                  fontWeight: 'var(--amex-font-weight-bold)',
                  color: 'var(--amex-blue)'
                }}>3</span>
              </div>
              <div>
                <h4 style={{
                  fontSize: 'var(--amex-font-size-base)',
                  fontWeight: 'var(--amex-font-weight-semibold)',
                  color: 'var(--amex-gray-900)',
                  marginBottom: 'var(--amex-space-2)'
                }}>Stay Balanced</h4>
                <p style={{
                  fontSize: 'var(--amex-font-size-sm)',
                  color: 'var(--amex-gray-600)',
                  lineHeight: '1.5'
                }}>When you exceed a budget, easily rebalance across other categories.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Set Your Budgets",
      subtitle: "Customize your monthly spending limits",
      content: (
        <div>
          <p style={{
            fontSize: 'var(--amex-font-size-sm)',
            color: 'var(--amex-gray-600)',
            textAlign: 'center',
            marginBottom: 'var(--amex-space-6)'
          }}>
            Set your monthly budgets for spending categories. You can adjust these anytime.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-3)' }}>
            {budgets.map((budget, index) => (
              <div key={index} className="amex-card" style={{ padding: 'var(--amex-space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: 'var(--amex-font-size-base)',
                    fontWeight: 'var(--amex-font-weight-semibold)',
                    color: 'var(--amex-gray-900)'
                  }}>{budget.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-2)' }}>
                    <span style={{
                      fontSize: 'var(--amex-font-size-base)',
                      color: 'var(--amex-gray-600)'
                    }}>R</span>
                    <input
                      type="number"
                      value={budget.budget}
                      onChange={(e) => {
                        const newBudgets = [...budgets];
                        newBudgets[index] = { ...newBudgets[index], budget: parseInt(e.target.value) || 0 };
                        setBudgets(newBudgets);
                      }}
                      className="amex-input"
                      style={{
                        width: '100px',
                        textAlign: 'right',
                        padding: 'var(--amex-space-2) var(--amex-space-3)'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(budgets);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--amex-gray-50)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div className="amex-header">
        <div className="amex-header-greeting">Welcome</div>
        <div className="amex-header-name">Let's Get Started</div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--amex-space-6)',
        maxWidth: '600px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Progress Indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--amex-space-2)',
          marginBottom: 'var(--amex-space-8)'
        }}>
          {steps.map((_, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: index === currentStep 
                  ? 'var(--amex-blue)' 
                  : index < currentStep 
                  ? 'var(--amex-blue-light)' 
                  : 'var(--amex-gray-300)',
                transition: 'all var(--amex-transition-base)'
              }}
            />
          ))}
        </div>

        {/* Step Content */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--amex-space-6)' }}>
          <h1 style={{
            fontSize: 'var(--amex-font-size-2xl)',
            fontWeight: 'var(--amex-font-weight-bold)',
            color: 'var(--amex-gray-900)',
            marginBottom: 'var(--amex-space-2)'
          }}>
            {steps[currentStep].title}
          </h1>
          <p style={{
            fontSize: 'var(--amex-font-size-sm)',
            color: 'var(--amex-gray-600)'
          }}>
            {steps[currentStep].subtitle}
          </p>
        </div>

        <div style={{ marginBottom: 'var(--amex-space-8)', flex: 1 }}>
          {steps[currentStep].content}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 'var(--amex-space-4)' }}>
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="amex-btn amex-btn-secondary"
            style={{
              flex: 1,
              opacity: currentStep === 0 ? 0.5 : 1,
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="amex-btn amex-btn-primary"
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, var(--amex-blue) 0%, var(--amex-blue-dark) 100%)'
            }}
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

