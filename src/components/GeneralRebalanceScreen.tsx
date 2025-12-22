import React, { useState } from 'react';
import { Budget } from '../types';

interface GeneralRebalanceScreenProps {
  budgets: Budget[];
  onSave: (updatedBudgets: Budget[]) => void;
  onCancel: () => void;
}

export default function GeneralRebalanceScreen({ budgets, onSave, onCancel }: GeneralRebalanceScreenProps) {
  const [fromId, setFromId] = useState<number | ''>('');
  const [toId, setToId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');

  const handleRebalance = () => {
    if (!fromId || !toId || !amount || amount <= 0 || fromId === toId) {
      nedbank-alert('Please select valid from/to categories and a positive amount.');
      return;
    }

    const fromBudget = budgets.find(b => b.id === fromId);
    if (fromBudget && fromBudget.budget < amount) {
        nedbank-alert('The amount to rebalance exceeds the available budget in the source category.');
        return;
    }

    const updatedBudgets = budgets.map(b => {
      if (b.id === fromId) {
        return { ...b, budget: b.budget - amount };
      }
      if (b.id === toId) {
        return { ...b, budget: b.budget + amount };
      }
      return b;
    });

    onSave(updatedBudgets);
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold">Rebalance Budgets</h2>
        <div className="">
          <div>
            <label className="block text-sm font-medium">From</label>
            <select
              value={fromId}
              onChange={(e) => setFromId(Number(e.target.value))}
              className="mt-1 block w-full p-2border-gray-300 rounded-md"
            >
              <option value="" disabled>Select a category</option>
              {budgets.map(b => (
                <option key={b.id} value={b.id}>{b.name} (R{b.budget.toFixed(2)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">To</label>
            <select
              value={toId}
              onChange={(e) => setToId(Number(e.target.value))}
              className="mt-1 block w-full p-2border-gray-300 rounded-md"
            >
              <option value="" disabled>Select a category</option>
              {budgets.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Amount</label>
            <nedbank-input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-1 block w-full p-2border-gray-300 rounded-md"
              placeholder="R0.00"
            />
          </div>
        </div>
        <div className="justify-end space-x-4">
          <button onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md">Cancel</button>
          <button onClick={handleRebalance} className="bg-blue-600px-4 py-2 rounded-md">Confirm</button>
        </div>
      </div>
    </div>
  );
}

