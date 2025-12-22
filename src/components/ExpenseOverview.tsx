import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Calendar, Receipt, Plus, X, CreditCard } from 'lucide-react';
import { Budget } from '../types';
import { supabase } from '../supabaseClient';

interface Expense {
  id: number;
  merchant: string;
  amount: number;
  categoryId: number;
  created_at: string;
  user_id: string;
  loyalty_transaction_id?: string;
  is_loyalty_purchase?: boolean;
}

interface ExpenseOverviewProps {
  budgets: Budget[];
  selectedDate: Date;
  session: any;
  onExpenseAdded: (merchant: string, amount: number, categoryId: number) => void;
}

export default function ExpenseOverview({ budgets, selectedDate, session, onExpenseAdded }: ExpenseOverviewProps) {
  const [selectedCategory, setSelectedCategory] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');

  useEffect(() => {
    if (selectedCategory && session) {
      loadCategoryExpenses(selectedCategory.id);
    }
  }, [selectedCategory, selectedDate, session]);

  const loadCategoryExpenses = async (categoryId: number | string) => {
    if (!session) return;
    
    setLoading(true);
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const startDate = new Date(Date.UTC(year, month, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).toISOString();
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('categoryId', categoryId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading expenses:', error);
    } else {
      setExpenses(data || []);
    }
    
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!merchant.trim() || !amount || !categoryId) {
      alert('Please fill in all fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    onExpenseAdded(merchant.trim(), numAmount, parseInt(categoryId));
    
    setMerchant('');
    setAmount('');
    setCategoryId('');
    setShowAddModal(false);
    
    if (selectedCategory) {
      loadCategoryExpenses(selectedCategory.id);
    }
  };

  const renderModal = () => (
    showAddModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center" style={{ zIndex: 9999 }}>
        <div className="amex-card" style={{ borderRadius: 'var(--amex-radius-2xl) var(--amex-radius-2xl) 0 0', width: '100%', maxWidth: '28rem', padding: 'var(--amex-space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--amex-space-6)' }}>
            <h2 className="amex-card-title">Add Expense</h2>
            <button
              onClick={() => setShowAddModal(false)}
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-4)' }}>
            <div>
              <label className="amex-label">Merchant</label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Pick n Pay, KFC, Shell..."
                className="amex-input"
                required
              />
            </div>

            <div>
              <label className="amex-label">Amount</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--amex-gray-300)', borderRadius: 'var(--amex-radius-md)', padding: 'var(--amex-space-3) var(--amex-space-4)' }}>
                <span style={{ color: 'var(--amex-gray-500)', marginRight: 'var(--amex-space-2)' }}>R</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={{ flex: 1, border: 0, outline: 'none', fontSize: 'var(--amex-font-size-base)', fontFamily: 'var(--amex-font-family)' }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="amex-label">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="amex-input"
                required
              >
                <option value="">Select category</option>
                {budgets.map(budget => (
                  <option key={budget.id} value={budget.id}>
                    {budget.name} (R{(budget.budget - budget.spent).toLocaleString()} left)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="amex-btn amex-btn-primary"
              style={{ width: '100%' }}
            >
              Add Expense
            </button>
          </form>
        </div>
      </div>
    )
  );

  if (!selectedCategory) {
    return (
      <>
        <div className="amex-content">
          <div style={{ textAlign: 'center', marginBottom: 'var(--amex-space-6)' }}>
            <h1 className="amex-section-title">Expense Overview</h1>
            <p className="amex-card-subtitle">
              {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            type="button"
            style={{ touchAction: 'manipulation', pointerEvents: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--amex-space-2)' }}
            className="amex-btn amex-btn-primary"
          >
            <Plus className="w-5 h-5" />
            <span>Add Expense</span>
          </button>

          <div style={{ marginTop: 'var(--amex-space-6)' }}>
            {budgets.length === 0 ? (
              <div className="amex-card amex-text-center" style={{ padding: 'var(--amex-space-12)' }}>
                <Receipt style={{ width: '48px', height: '48px', color: 'var(--amex-gray-400)', margin: '0 auto var(--amex-space-4)' }} />
                <p className="amex-card-subtitle">No budget categories yet</p>
              </div>
            ) : (
              budgets.map(budget => {
                const percentage = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;
                const isOverspent = budget.spent > budget.budget;
                
                return (
                  <button
                    key={budget.id}
                    onClick={() => setSelectedCategory(budget)}
                    className="amex-card"
                    style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none', transition: 'all var(--amex-transition-base)', marginBottom: 'var(--amex-space-3)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--amex-space-3)' }}>
                      <div style={{ flex: 1 }}>
                        <h3 className="amex-card-title" style={{ marginBottom: 'var(--amex-space-1)' }}>{budget.name}</h3>
                        <p className="amex-card-subtitle">
                          R{budget.spent.toLocaleString()} of R{budget.budget.toLocaleString()}
                        </p>
                      </div>
                      <ChevronRight style={{ width: '20px', height: '20px', color: 'var(--amex-gray-400)' }} />
                    </div>
                    
                    <div className="amex-progress">
                      <div 
                        className="amex-progress-bar"
                        style={{ 
                          width: `${Math.min(100, percentage)}%`,
                          background: isOverspent ? 'var(--amex-red)' : percentage > 80 ? 'var(--amex-orange)' : 'linear-gradient(90deg, var(--amex-blue) 0%, var(--amex-teal) 100%)'
                        }}
                      ></div>
                    </div>
                    
                    {isOverspent && (
                      <p style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-red)', marginTop: 'var(--amex-space-2)' }}>
                        Overspent by R{(budget.spent - budget.budget).toLocaleString()}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
        {renderModal()}
      </>
    );
  }

  return (
    <>
      <div className="amex-content">
        <button
          onClick={() => setSelectedCategory(null)}
          className="amex-btn amex-btn-secondary"
          style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--amex-space-4)' }}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Back to Categories</span>
        </button>
        
        <h1 className="amex-section-title" style={{ marginBottom: 'var(--amex-space-2)' }}>{selectedCategory.name}</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--amex-space-4)' }}>
          <p className="amex-card-subtitle">
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
          <p className="amex-card-title">
            R{selectedCategory.spent.toLocaleString()}
          </p>
        </div>
        
        <button
          onClick={() => {
            setCategoryId(String(selectedCategory.id));
            setShowAddModal(true);
          }}
          type="button"
          style={{ touchAction: 'manipulation', pointerEvents: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--amex-space-2)' }}
          className="amex-btn amex-btn-primary"
        >
          <Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </button>

        <div style={{ marginTop: 'var(--amex-space-6)' }}>
          {loading ? (
            <div className="amex-card amex-text-center" style={{ padding: 'var(--amex-space-12)' }}>
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--amex-blue)] border-t-transparent mx-auto"></div>
              <p className="amex-card-subtitle" style={{ marginTop: 'var(--amex-space-3)' }}>Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="amex-card amex-text-center" style={{ padding: 'var(--amex-space-12)' }}>
              <Receipt style={{ width: '48px', height: '48px', color: 'var(--amex-gray-400)', margin: '0 auto var(--amex-space-4)' }} />
              <p className="amex-card-subtitle">No expenses in this category</p>
            </div>
          ) : (
            <>
              {expenses.map(expense => (
                <div key={expense.id} className="amex-card" style={{ marginBottom: 'var(--amex-space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--amex-space-2)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 'var(--amex-space-1)' }}>
                        <h3 className="amex-card-title" style={{ display: 'inline' }}>
                          {expense.merchant}
                        </h3>
                        {expense.is_loyalty_purchase && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '9999px', fontSize: 'var(--amex-font-size-xs)', fontWeight: 'var(--amex-font-weight-medium)', background: 'var(--amex-blue-light)', color: 'var(--amex-blue)', marginLeft: 'var(--amex-space-2)' }}>
                            <CreditCard style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                            Loyalty
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-500)' }}>
                        <Calendar style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                        {formatDate(expense.created_at)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="amex-card-title">
                        R{expense.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="amex-card" style={{ marginTop: 'var(--amex-space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--amex-font-size-sm)', fontWeight: 'var(--amex-font-weight-medium)', color: 'var(--amex-gray-600)' }}>
                    Total ({expenses.length} expenses)
                  </span>
                  <span style={{ fontSize: 'var(--amex-font-size-xl)', fontWeight: 'var(--amex-font-weight-light)' }}>
                    R{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {renderModal()}
    </>
  );
}
