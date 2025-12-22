import React, { useState } from 'react';
import { Plus, TrendingUp, Receipt } from 'lucide-react';
import { Budget } from '../types';

interface ManualExpenseEntryProps {
  budgets: Budget[];
  onExpenseAdded: (merchant: string, amount: number, categoryId: number) => void;
  onTabChange: () => void;
}

export default function ManualExpenseEntry({ budgets, onExpenseAdded, onTabChange }: ManualExpenseEntryProps) {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!merchant.trim() || !amount || !categoryId) {
      nedbank-alert('Please fill in all fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      nedbank-alert('Please enter a valid amount');
      return;
    }

    onExpenseAdded(merchant.trim(), numAmount, parseInt(categoryId));
    
    // Reset form
    setMerchant('');
    setAmount('');
    setCategoryId('');
  };

  return (
    <div className="" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="px-4 py-8-b">
        <div className="max-w-sm mx-auto text-center">
          <h1 className="nedbank-text-large mb-2">Add Expense</h1>
          <p className="text-sm text-gray-500">Track your spending</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="max-w-sm mx-auto">

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Merchant Name */}
            <div className="nedbank-card">
              <label htmlFor="merchant" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Merchant
              </label>
              <nedbank-input
                type="text"
                id="merchant"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Pick n Pay, KFC, Shell..."
                className="w-full text-lg font-lightbg-transparent-none focus:outline-none placeholder-gray-400"
                required
              />
            </div>

            {/* Amount */}
            <div className="nedbank-card">
              <label htmlFor="amount" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Amount
              </label>
              <div className="">
                <span className="text-lg font-light text-gray-500 mr-2">R</span>
                <nedbank-input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="-1 text-lg font-lightbg-transparent-none focus:outline-none placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="nedbank-card">
              <label htmlFor="category" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-lg font-lightbg-transparent-none focus:outline-none"
                required
              >
                <option value="" className="text-gray-400">Select category</option>
                {budgets.map(budget => {
                  const remaining = budget.budget - budget.spent;
                  return (
                    <option key={budget.id} value={budget.id}>
                      {budget.name} (R{remaining.toLocaleString()} left)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full nedbank-nedbank-btn nedbank-nedbank-nedbank-btn-primary font-medium hover:bg-gray-800 transition-colorsspace-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Expense</span>
            </button>
          </form>

          {/* Quick Stats */}
          <div className="nedbank-card">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Budget Overview</h3>
            <div className="">
              {budgets.slice(0, 3).map(budget => {
                const remaining = budget.budget - budget.spent;
                const percentage = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;
                
                return (
                  <div key={budget.id} className="-bpb-3 last:border-b-0 last:pb-0">
                    <div className="mb-2">
                      <span className="text-sm font-medium">{budget.name}</span>
                      <span className={`text-sm font-medium ${remaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        R{remaining.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-fullrounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

