import React, { useState } from 'react';
import { Budget } from '../types';

interface ConfirmationScreenProps {
  merchant: string;
  amount: number;
  budgets: Budget[];
  onConfirm: (categoryId: number, amount: number) => void;
  onCancel: () => void;
}

export default function ConfirmationScreen({ merchant, amount, budgets, onConfirm, onCancel }: ConfirmationScreenProps) {
  const [categoryId, setCategoryId] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState(amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryId) {
      onConfirm(parseInt(categoryId, 10), currentAmount);
    }
  };

  return (
    <div className="">
      <div className="w-full max-w-mdshadow-xl">
        <h2 className="text-2xl font-bold text-center">Confirm Expense</h2>
        <div className="">
          <p><strong>Merchant:</strong> {merchant}</p>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium">Amount</label>
              <nedbank-input
                type="number"
                id="amount"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(parseFloat(e.target.value))}
                className="mt-1 block w-full px-3 py-2border-gray-300rounded-mdfocus:outline-none focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium">Category</label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 block w-full px-3 py-2border-gray-300rounded-mdfocus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="" disabled>Select a category</option>
                {budgets.map(budget => (
                  <option key={budget.id} value={budget.id as string}>{budget.name}</option>
                ))}
              </select>
            </div>
            <div className="justify-end space-x-2 pt-4">
              <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600">Confirm</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

