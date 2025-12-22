import React, { useState } from 'react';
import { Camera, TrendingUp, Award } from 'lucide-react';
import { Budget } from '../types';

interface ProgressTabProps {
  budgets: Budget[];
  rebalanceCount: number;
  savings: number;
  ytdSavings: number;
  selectedDate: Date;
  annualizedExpenses: number;
  ytdExpenses: number;
  onTabChange: () => void;
  onManageBudget: () => void;
  onNavigateToSettings: () => void;
  onAddSpend: (budgetId: number) => void;
  onRemoveSpend: (budgetId: number) => void;
  onUpdateSavings: () => void;
  onDateChange: (date: Date) => void;
  showBudgetBreakdown?: boolean;
}

export default function ProgressTab({ budgets, rebalanceCount, savings, ytdSavings, selectedDate, annualizedExpenses, ytdExpenses, onTabChange, onManageBudget, onNavigateToSettings, onAddSpend, onRemoveSpend, onUpdateSavings, onDateChange, showBudgetBreakdown = true }: ProgressTabProps) {
  const [withdrawalRate, setWithdrawalRate] = useState(4);
  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const [year, month] = event.target.value.split('-').map(Number);
    onDateChange(new Date(year, month));
  };
  const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const fuGoal = withdrawalRate > 0 ? annualizedExpenses / (withdrawalRate / 100) : 0;
  const fuProgress = fuGoal > 0 ? (ytdSavings / fuGoal) * 100 : 0;
    
  return (
    <div className="">
      {/* Header */}
      <div className="px-4 py-6-b">
        <div className="">
          <select 
            onChange={handleMonthChange} 
            value={`${selectedDate.getFullYear()}-${selectedDate.getMonth()}`}
            className="rounded-md px-3 py-2 font-medium text-baseborder-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              return (
                <option key={i} value={`${date.getFullYear()}-${date.getMonth()}`}>
                  {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </option>
              );
            })}
          </select>
        </div>

        <div className="text-center">
          <p className="text-sm font-mediumuppercase tracking-wide">Total Remaining</p>
          <p className="text-3xl font-lightmt-1">R{totalRemaining.toFixed(0)}</p>
          <p className="nedbank-text-small mt-1">of R{totalBudget} monthly budget</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4">
        <div className="space-y-3">
          <div className="">
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</p>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <p className="nedbank-text-large">R{totalSpent.toFixed(0)}</p>
            <p className="nedbank-text-small mt-1">This Month</p>
          </div>
          <p className="text-sm text-gray-500 mt-1">YTD: R{ytdExpenses.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</p>

          
          <div className="shadow-md">
            <div className="space-x-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <p className="nedbank-text-small">Savings (This Month)</p>
              <div className="space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <p className="nedbank-text-small">Savings (This Month)</p>
              </div>
              <button onClick={onUpdateSavings} className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-md">Update</button>
            </div>
            <p className="text-2xl font-bold">R{savings.toFixed(0)}</p>
            <p className="text-sm text-gray-500 mt-1">YTD: R{ytdSavings.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</p>
          </div>

          <div className="bg-gray-800shadow-md">
            {/* Card Header */}
            <div className="space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>
              <p className="text-sm text-gray-300">Sabbatical Fund Goal</p>
            </div>

            {/* Goal Amount as Main Number */}
            <p className="text-2xl font-bold">R{fuGoal.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</p>

            {/* Progress Bar */}
            <div>
              <div className="text-xs text-gray-400 mb-1">
                <span>{fuProgress.toFixed(1)}% Complete</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full" style={{ width: `${Math.min(100, fuProgress)}%` }}></div>
              </div>
            </div>

            {/* Calculator Inputs */}
            <div className="space-x-4 text-sm">
              <div className="-1">
                <label className="block text-xs text-gray-400">Annualized Expenses</label>
                <p className="text-lg font-bold">R{annualizedExpenses.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="w-20">
                <label htmlFor="withdrawalRate" className="block text-xs text-gray-400">Withdrawal %</label>
                <nedbank-input 
                  type="number" 
                  id="withdrawalRate" 
                  value={withdrawalRate} 
                  onChange={(e) => setWithdrawalRate(Number(e.target.value))}
                  className="w-full bg-gray-700rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Budget Breakdown */}
        {showBudgetBreakdown && (
        <div className="shadow-md">
          <div className="">
            <h2 className="text-xl font-bold">Budget Breakdown</h2>
            <button 
              onClick={onManageBudget}
              className="bg-blue-600px-4 py-2text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Rebalance
            </button>
          </div>
          
          <div className="">
            {budgets.map((budget) => {
              const percentage = budget.budget > 0 ? Math.min(100, (budget.spent / budget.budget) * 100) : 0;
              const isOverspent = budget.spent > budget.budget;
              
              return (
                <div key={budget.id} className="space-y-2">
                  <div className="">
                    <div className="space-x-2">
                      <button onClick={() => onRemoveSpend(budget.id)} className="w-6 h-6 bg-red-100 text-red-600 rounded-full">-</button>
                      <span className="font-medium">{budget.name}</span>
                      <button onClick={() => onAddSpend(budget.id)} className="w-6 h-6 bg-green-100 text-green-600 rounded-full">+</button>
                    </div>
                    <span className={`text-sm font-medium ${
                      isOverspent ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      R{budget.spent.toFixed(0)} / R{budget.budget}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        isOverspent 
                          ? 'bg-gradient-to-r from-red-500 to-red-600' 
                          : percentage > 80
                          ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                          : 'bg-gradient-to-r from-blue-500 to-teal-500'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    ></div>
                  </div>
                  
                  {isOverspent && (
                    <p className="text-xs text-red-600">
                      Overspent by R{(budget.spent - budget.budget).toFixed(2)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Achievement Section */}
        {rebalanceCount > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-teal-50">
            <div className="text-center">
              <Award className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-boldmb-2">Budget Master!</h3>
              <p className="text-sm">
                You've successfully rebalanced your budget {rebalanceCount} time{rebalanceCount !== 1 ? 's' : ''}. 
                Keep up the great financial habits!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
