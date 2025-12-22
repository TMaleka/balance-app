import React, { useState } from 'react';
import { Budget } from '../types';

interface BudgetSettingsProps {
  budgets: Budget[];
  onSave: (updatedBudgets: Budget[]) => void;
  onCancel: () => void;
}

export default function BudgetSettings({ budgets: initialBudgets, onSave, onCancel }: BudgetSettingsProps) {
  const [budgets, setBudgets] = useState(initialBudgets);

  const handleBudgetChange = (index: number, field: 'name' | 'budget', value: string) => {
    const newBudgets = [...budgets];
    if (field === 'budget') {
      newBudgets[index] = { ...newBudgets[index], budget: parseFloat(value) || 0 };
    } else {
      newBudgets[index] = { ...newBudgets[index], name: value };
    }
    setBudgets(newBudgets);
  };

  const handleAddBudget = () => {
    const newBudget: Budget = { id: `new-${Date.now()}`, name: '', budget: 0, spent: 0, user_id: '' }; // Temp ID
    setBudgets([...budgets, newBudget]);
  };

  const handleRemoveBudget = (id: number | string) => {
    setBudgets(budgets.filter(b => b.id !== id));
  };

  return (
    <div className="" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="px-4 py-8-b">
        <div className="max-w-sm mx-auto">
          <div className="">
            <h1 className="nedbank-text-large">Budget Settings</h1>
            <button onClick={onCancel} className="w-8 h-8rounded-fullhover:bg-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="text-sm text-gray-500">Manage your categories</p>
        </div>
      </div>
      <div className="shadow-md">
        {budgets.map((budget, index) => (
          <div key={budget.id} className="space-x-2">
            <nedbank-input
              type="text"
              value={budget.name}
              onChange={(e) => handleBudgetChange(index, 'name', e.target.value)}
              className="-grow p-2"
              placeholder="Category Name"
            />
            <nedbank-input
              type="number"
              value={budget.budget}
              onChange={(e) => handleBudgetChange(index, 'budget', e.target.value)}
              className="w-24 p-2"
              placeholder="Amount"
            />
            <button onClick={() => handleRemoveBudget(budget.id)} className="p-2 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
        <button
          onClick={handleAddBudget}
          className="w-full nedbank-nedbank-btn nedbank-nedbank-nedbank-btn-primary font-medium hover:bg-gray-800 transition-colorsspace-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span>Add Category</span>
        </button>
      </div>
      <div className="justify-end space-x-2">
        <button onClick={onCancel} className="px-4 py-2 bg-gray-300">Cancel</button>
        <button onClick={() => onSave(budgets)} className="px-4 py-2 bg-blue-600">Save Changes</button>
      </div>
    </div>
  );
}

