import React, { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Budget } from '../types';

interface AmexBudgetSettingsProps {
  budgets: Budget[];
  onSave: (updatedBudgets: Budget[]) => void;
  onCancel: () => void;
}

export default function AmexBudgetSettings({ budgets: initialBudgets, onSave, onCancel }: AmexBudgetSettingsProps) {
  const [budgets, setBudgets] = useState(initialBudgets);

  const updateBudget = (id: number | string, field: 'name' | 'budget', value: string | number) => {
    setBudgets(budgets.map(budget => 
      budget.id === id 
        ? { ...budget, [field]: field === 'budget' ? Number(value) : value }
        : budget
    ));
  };

  const addBudget = () => {
    const newBudget: Budget = {
      id: `new-${Date.now()}`,
      name: '',
      budget: 0,
      spent: 0,
      user_id: ''
    };
    setBudgets([...budgets, newBudget]);
  };

  const removeBudget = (id: number | string) => {
    const budgetToDelete = budgets.find(b => b.id === id);
    if (budgetToDelete) {
      const confirmDelete = window.confirm(`Are you sure you want to delete "${budgetToDelete.name}"?`);
      if (confirmDelete) {
        setBudgets(budgets.filter(budget => budget.id !== id));
      }
    }
  };

  const handleSave = () => {
    onSave(budgets);
  };

  return (
    <div className="amex-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--amex-space-4)' }}>
        <h1 className="amex-section-title">Budget Settings</h1>
        <button 
          onClick={onCancel} 
          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background var(--amex-transition-fast)' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="amex-card-subtitle" style={{ marginBottom: 'var(--amex-space-6)' }}>Manage your budget categories</p>

      {/* Budget List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-4)', marginBottom: 'var(--amex-space-6)' }}>
        {budgets.map((budget) => (
          <div key={budget.id} className="amex-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--amex-space-4)' }}>
              <input
                type="text"
                value={budget.name}
                onChange={(e) => updateBudget(budget.id, 'name', e.target.value)}
                className="amex-input"
                style={{ flex: 1, marginRight: 'var(--amex-space-3)' }}
                placeholder="Category name"
              />
              {budgets.length > 1 && (
                <button
                  onClick={() => removeBudget(budget.id)}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--amex-red-light)', color: 'var(--amex-red)', border: 'none', cursor: 'pointer', transition: 'background var(--amex-transition-fast)' }}
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <label className="amex-label">Monthly Budget</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--amex-gray-300)', borderRadius: 'var(--amex-radius-md)', padding: 'var(--amex-space-3) var(--amex-space-4)' }}>
                <span style={{ fontSize: 'var(--amex-font-size-lg)', fontWeight: 'var(--amex-font-weight-light)', color: 'var(--amex-gray-500)', marginRight: 'var(--amex-space-2)' }}>R</span>
                <input
                  type="number"
                  value={budget.budget}
                  onChange={(e) => updateBudget(budget.id, 'budget', parseFloat(e.target.value) || 0)}
                  style={{ flex: 1, border: 0, outline: 'none', fontSize: 'var(--amex-font-size-lg)', fontWeight: 'var(--amex-font-weight-light)', fontFamily: 'var(--amex-font-family)', background: 'transparent' }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-3)' }}>
        <button
          onClick={addBudget}
          className="amex-btn amex-btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--amex-space-2)' }}
        >
          <Plus className="w-5 h-5" />
          <span>Add Category</span>
        </button>

        <button
          onClick={handleSave}
          className="amex-btn amex-btn-primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--amex-space-2)' }}
        >
          <Save className="w-5 h-5" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}
