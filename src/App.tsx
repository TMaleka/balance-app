import React, { useState, useEffect, useCallback } from 'react';
import AmexOnboardingFlow from './components/AmexOnboardingFlow';
import FixItScreen from './components/FixItScreen';
import RebalanceScreen from './components/RebalanceScreen';
import SuccessScreen from './components/SuccessScreen';
import MainTabbedInterface from './components/MainTabbedInterface';
import GeneralRebalanceScreen from './components/GeneralRebalanceScreen';
import Auth from './components/Auth';
import LoadingScreen from './components/LoadingScreen';
import { Budget, Expense } from './types';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { NotificationProvider } from './components/NotificationSystem';
import SystemHealthMonitor from './components/SystemHealthMonitor';
import { errorLogger, setUserId } from './utils/errorLogging';
import { performanceMonitor } from './utils/performanceMonitoring';
import { analytics, setAnalyticsUserId, trackPageView } from './utils/analytics';
import { envConfigErrors } from './config/environment';
import './styles/amex-design.css';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [monthlyBudgets, setMonthlyBudgets] = useState<Budget[]>([]);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [overspentBudget, setOverspentBudget] = useState<Budget | null>(null);
  const [rebalanceAmount, setRebalanceAmount] = useState(0);
  const [rebalanceCount, setRebalanceCount] = useState(0);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [ytdSavings, setYtdSavings] = useState(0);
  const [newExpense, setNewExpense] = useState<{ merchant: string; amount: number; } | null>(null);
  const [view, setView] = useState<'tabs' | 'fixIt' | 'rebalance' | 'success' | 'generalRebalance' | 'camera'>('tabs');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [annualizedExpenses, setAnnualizedExpenses] = useState(0);
  const [ytdExpenses, setYtdExpenses] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  const isFirstTime = !isLoading && budgets.length === 0;

  const fetchData = useCallback(async (): Promise<Budget[]> => {
    // If there is no user session, do nothing.
    if (!session) {
      setIsLoading(false);
      return [];
    }
    setIsLoading(true);

    // --- Step 1: Fetch Budgets ---
    // This is the master list of all budget categories for the user.
    const { data: budgetsData, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', session.user.id);

    // If we can't get the budgets, we can't do anything else.
    if (budgetsError || !budgetsData) {
      console.error("CRITICAL: Could not fetch budgets.", budgetsError);
      setIsLoading(false);
      return;
    }

    // --- Step 1a: Hard deduplication of categories by name ---
    // Normalize by trimmed, lowercased name; keep first, remove the rest.
    const seenNames = new Set<string>();
    const dedupedBudgets: Budget[] = [];
    const duplicateIds: number[] = [];

    for (const b of budgetsData as Budget[]) {
      const normalizedName = (b.name || '').trim().toLowerCase();
      if (!normalizedName) {
        dedupedBudgets.push(b);
        continue;
      }

      if (seenNames.has(normalizedName)) {
        if (typeof b.id === 'number') {
          duplicateIds.push(b.id);
        }
        continue;
      }

      seenNames.add(normalizedName);
      dedupedBudgets.push(b);
    }

    if (duplicateIds.length > 0) {
      try {
        console.log('[Budget Dedup] Removing duplicate budget IDs:', duplicateIds);
        const deleteResult = await supabase
          .from('budgets')
          .delete()
          .in('id', duplicateIds);
        if (deleteResult.error) {
          console.error('[Budget Dedup] Failed to delete duplicates:', deleteResult.error);
        }
      } catch (err) {
        console.error('[Budget Dedup] Unexpected error while deleting duplicates:', err);
      }
    }

    setBudgets(dedupedBudgets);

    // --- Step 2: Fetch YTD Expenses ---
    // Get all expenses from the start of the current year until now.
    const now = new Date();
    const startOfYear = new Date(Date.UTC(now.getFullYear(), 0, 1)).toISOString();
    const { data: ytdExpensesData, error: ytdExpensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', session.user.id)
      .gte('created_at', startOfYear);

    if (ytdExpensesError) {
      console.error("CRITICAL: Could not fetch YTD expenses.", ytdExpensesError);
      // We can still proceed, YTD will just be 0.
    }

    // Calculate and set the total YTD expenses.
    const totalYtdExpenses = ytdExpensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    setYtdExpenses(totalYtdExpenses);

    // --- Step 3: Fetch Monthly Expenses ---
    // Get all expenses for the currently selected month.
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const startDate = new Date(Date.UTC(year, month, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).toISOString();
    const { data: monthlyExpensesData, error: monthlyExpensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (monthlyExpensesError) {
        console.error("CRITICAL: Could not fetch monthly expenses.", monthlyExpensesError);
    }
    
    // Using the master budget list, calculate the "spent" amount for each budget this month.
    const calculatedMonthlyBudgets = dedupedBudgets.map(budget => {
      const spent = monthlyExpensesData
        ?.filter(expense => Number(expense.categoryId) === Number(budget.id))
        .reduce((sum, expense) => sum + expense.amount, 0) || 0;
      return { ...budget, spent };
    });
    setMonthlyBudgets(calculatedMonthlyBudgets);

    // --- Step 4: Fetch Savings Data (YTD and Monthly) ---
    // This is separate and can fail without stopping the main expense display.
    const { data: ytdSavingsData } = await supabase
        .from('monthly_savings')
        .select('amount')
        .eq('user_id', session.user.id)
        .gte('month', startOfYear);
    const totalYtdSavings = ytdSavingsData?.reduce((sum, s) => sum + s.amount, 0) || 0;
    setYtdSavings(totalYtdSavings);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
    const { data: monthlySavingsData } = await supabase
        .from('monthly_savings')
        .select('amount')
        .eq('user_id', session.user.id)
        .eq('month', firstDayOfMonth)
        .limit(1)
        .maybeSingle();
    setMonthlySavings(monthlySavingsData ? monthlySavingsData.amount : 0);

    // --- Step 5: Fetch Monthly Income ---
    const { data: monthlyIncomeData } = await supabase
        .from('monthly_income')
        .select('amount')
        .eq('user_id', session.user.id)
        .eq('month', firstDayOfMonth)
        .limit(1)
        .maybeSingle();
    setMonthlyIncome(monthlyIncomeData ? monthlyIncomeData.amount : 0);

    // --- Final Calculations ---
    const currentMonthNumber = new Date().getMonth() + 1;
    setAnnualizedExpenses((totalYtdExpenses / currentMonthNumber) * 12);

    setIsLoading(false);
    return calculatedMonthlyBudgets;
  }, [session, selectedDate]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      // Initialize monitoring systems when user is authenticated
      if (session?.user) {
        setUserId(session.user.id);
        setAnalyticsUserId(session.user.id);
        trackPageView('/app');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // Update monitoring systems on auth state change
      if (session?.user) {
        setUserId(session.user.id);
        setAnalyticsUserId(session.user.id);
        trackPageView('/app');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchData();
  }, [session, selectedDate, fetchData]);

  useEffect(() => {
    if (!currentExpense || monthlyBudgets.length === 0) {
      return;
    }

    const affectedBudget = monthlyBudgets.find(b => b.id === currentExpense.categoryId);
    if (affectedBudget && affectedBudget.spent > affectedBudget.budget) {
        const overspent = affectedBudget.spent - affectedBudget.budget;
        setOverspentBudget(affectedBudget);
        setRebalanceAmount(overspent);
        setView('fixIt');
    } else {
        setView('success');
        setTimeout(() => setView('camera'), 2000);
    }
  }, [monthlyBudgets]); // ONLY depend on monthlyBudgets to prevent the race condition.


  const handleOnboardingComplete = useCallback(async (customBudgets: Omit<Budget, 'id' | 'spent'>[]) => {
    if (!session) return;
    const budgetsToInsert = customBudgets.map(b => ({ ...b, spent: 0, user_id: session.user.id }));
    const { data, error } = await supabase.from('budgets').insert(budgetsToInsert).select();
    if (error) {
      console.error('Error saving budgets:', error);
    } else if (data) {
      setBudgets(data);
    }
  }, [session]);

  const handleExpenseAdded = async (merchant: string, amount: number, categoryId: number) => {
    if (!session) return;
    
    const expenseToSave = { 
      merchant, 
      amount, 
      categoryId, 
      user_id: session.user.id, 
      created_at: new Date().toISOString() 
    };
    
    const { data: newExpense, error: expenseError } = await supabase
      .from('expenses')
      .insert(expenseToSave)
      .select()
      .single();
      
    if (expenseError || !newExpense) {
      console.error('Error saving expense:', expenseError);
      alert('Could not save expense.');
      return;
    }
    
    setCurrentExpense(newExpense);
    const updatedBudgets = await fetchData();
    
    // Check if any budget is overspent after this expense
    const overspent = updatedBudgets.find(b => b.spent > b.budget);
    if (overspent) {
      setOverspentBudget(overspent);
      setRebalanceAmount(overspent.spent - overspent.budget);
      setView('fixIt');
    }
  };

  const handleRebalance = () => {
    if (!overspentBudget) return;
    setView('rebalance');
  };

  const handleRebalanceConfirm = async (newBudgets: Budget[]) => {
    const { error } = await supabase.from('budgets').upsert(newBudgets);
    if (error) {
      console.error('Error rebalancing budgets:', error);
    } else {
      await fetchData();
      setRebalanceCount(rebalanceCount + 1);
      setView('success');
      // After success screen, go to progress tab to show updated budgets
      setTimeout(() => {
        setView('tabs');
      }, 3000);
    }
  };


  const handleBackToTabs = () => {
    setView('tabs');
    setNewExpense(null);
    setCurrentExpense(null);
    setOverspentBudget(null);
  };

  const handleManageBudget = () => {
    setView('generalRebalance');
  };

  const handleSaveBudgetSettings = async (updatedBudgets: Budget[]) => {
    console.log('[Budget Settings] Starting save with updatedBudgets:', updatedBudgets);
    console.log('[Budget Settings] Current budgets:', budgets);

    if (!session) return;

    // --- Step 0: Remove duplicate categories by name (case-insensitive, trimmed) ---
    const seenNames = new Set<string>();
    const dedupedBudgets: Budget[] = [];
    const removedDuplicates: string[] = [];

    for (const b of updatedBudgets) {
      const normalizedName = (b.name || '').trim().toLowerCase();
      if (!normalizedName) {
        // Allow empty names to be handled by existing validation / UX later
        dedupedBudgets.push(b);
        continue;
      }

      if (seenNames.has(normalizedName)) {
        removedDuplicates.push(b.name);
        continue;
      }

      seenNames.add(normalizedName);
      dedupedBudgets.push(b);
    }

    if (removedDuplicates.length > 0) {
      console.log('[Budget Settings] Removed duplicate categories (keeping first occurrence):', removedDuplicates);
    }

    const originalIds = new Set(budgets.map(b => b.id));
    console.log('[Budget Settings] Original IDs:', Array.from(originalIds));

    const toDelete = budgets
      .filter(b => !dedupedBudgets.find(ub => ub.id === b.id))
      .map(b => b.id)
      .filter(id => typeof id === 'number');
    console.log('[Budget Settings] To delete:', toDelete);

    const toUpdate = dedupedBudgets
      .filter(b => typeof b.id === 'number' && originalIds.has(b.id))
      .map(ub => {
        const originalBudget = budgets.find(b => b.id === ub.id);
        return { ...ub, spent: originalBudget ? originalBudget.spent : 0 };
      });
    console.log('[Budget Settings] To update:', toUpdate);

    const toInsert = dedupedBudgets
      .filter(b => typeof b.id === 'string')
      .map(({ name, budget }) => ({ name, budget, spent: 0, user_id: session.user.id }));
    console.log('[Budget Settings] To insert:', toInsert);
    
    try {
      // IMPORTANT: Execute operations in sequence to ensure data consistency
      
      // Step 1: Delete first
      if (toDelete.length > 0) {
        console.log('[Budget Settings] Deleting budgets with IDs:', toDelete);
        const deleteResult = await supabase
          .from('budgets')
          .delete()
          .in('id', toDelete);
        console.log('[Budget Settings] Delete result:', deleteResult);
        if (deleteResult.error) {
          console.error('[Budget Settings] Delete error:', deleteResult.error);
          alert(`Failed to delete budgets: ${deleteResult.error.message}`);
          return;
        }
      }
      
      // Step 2: Update existing
      if (toUpdate.length > 0) {
        console.log('[Budget Settings] Updating budgets...');
        const updateResult = await supabase
          .from('budgets')
          .upsert(toUpdate);
        console.log('[Budget Settings] Update result:', updateResult);
        if (updateResult.error) {
          console.error('[Budget Settings] Update error:', updateResult.error);
          alert(`Failed to update budgets: ${updateResult.error.message}`);
          return;
        }
      }
      
      // Step 3: Insert new
      if (toInsert.length > 0) {
        console.log('[Budget Settings] Inserting new budgets...');
        const insertResult = await supabase
          .from('budgets')
          .insert(toInsert);
        console.log('[Budget Settings] Insert result:', insertResult);
        if (insertResult.error) {
          console.error('[Budget Settings] Insert error:', insertResult.error);
          alert(`Failed to insert budgets: ${insertResult.error.message}`);
          return;
        }
      }
      
      // Step 4: Wait a moment for database to settle, then refresh
      console.log('[Budget Settings] All operations completed, waiting before fetchData...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[Budget Settings] Calling fetchData...');
      await fetchData();
      console.log('[Budget Settings] fetchData completed, navigating to tabs');
      setView('tabs');
    } catch (error) {
      console.error('[Budget Settings] Error during save:', error);
      alert('An error occurred while saving budget settings. Please try again.');
    }
  };


  const handleManualAddSpend = async (budgetId: number) => {
    console.log('[Manual Add] Starting with budgetId:', budgetId);
    if (!session) return;
    const amountStr = prompt('Enter amount to add:');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    
    console.log('[Manual Add] Inserting expense:', { amount, categoryId: budgetId, user_id: session.user.id });
    const { data: newExpense, error } = await supabase.from('expenses').insert({ merchant: 'Manual Entry', amount, categoryId: budgetId, user_id: session.user.id, created_at: new Date().toISOString() }).select().single();
    if (error || !newExpense) {
      console.error('Error adding manual spend:', error);
      return;
    }
    
    console.log('[Manual Add] Successfully inserted expense:', newExpense);
    setCurrentExpense(newExpense);
    console.log('[Manual Add] Calling fetchData...');
    await fetchData();
    console.log('[Manual Add] fetchData completed');
  };

  const handleManualRemoveSpend = async (budgetId: number) => {
    console.log('[Manual Remove] Starting with budgetId:', budgetId);
    if (!session) return;
    const amountStr = prompt('Enter amount to remove:');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    
    console.log('[Manual Remove] Inserting negative expense:', { amount: -amount, categoryId: budgetId, user_id: session.user.id });
    const { error } = await supabase.from('expenses').insert({ merchant: 'Manual Correction', amount: -amount, categoryId: budgetId, user_id: session.user.id, created_at: new Date().toISOString() });
    if (error) {
      console.error('Error removing spend:', error);
      return;
    }
    
    console.log('[Manual Remove] Successfully inserted correction, calling fetchData...');
    await fetchData();
    console.log('[Manual Remove] fetchData completed');
  };

  const handleDateChange = async (date: Date) => {
    setSelectedDate(date);
  };

  const handleLogout = () => {
    setSession(null);
  };

  const handleUpdateMonthlyIncome = async () => {
    if (!session) return;
    const amountStr = prompt('Enter your monthly income:');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount < 0) return;

    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString().substring(0, 10);
    const previousIncome = monthlyIncome;
    setMonthlyIncome(amount);

    try {
      const { error } = await supabase
        .from('monthly_income')
        .upsert({ user_id: session.user.id, month: firstDayOfMonth, amount }, {
          onConflict: 'user_id, month'
        });
      if (error) throw error;
    } catch (error: any) {
      console.error('Database Error:', error);
      setMonthlyIncome(previousIncome);
      alert(`Database Error: ${error.message}`);
    }
  };

  const handleUpdateMonthlySavings = async () => {
    if (!session) return;
    const amountStr = prompt('Enter savings for this month:');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount < 0) return;

    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString().substring(0, 10);
    const currentMonthlySavings = monthlySavings;

    setMonthlySavings(amount);
    setYtdSavings(ytdSavings - currentMonthlySavings + amount);

    try {
      const { error } = await supabase
        .from('monthly_savings')
        .upsert({ user_id: session.user.id, month: firstDayOfMonth, amount: amount }, { 
          onConflict: 'user_id, month' 
        });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Database Error:', error);
      setMonthlySavings(currentMonthlySavings);
      setYtdSavings(ytdSavings);
      alert(`Database Error: ${error.message}`);
    }
  };

  const renderContent = () => {
    if (envConfigErrors.length > 0) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px' }}>Configuration Error</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', lineHeight: 1.5 }}>The app is missing required environment variables. Please contact the administrator.</p>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', textAlign: 'left' }}>
              {envConfigErrors.map((err, i) => (
                <p key={i} style={{ fontSize: '13px', color: '#dc2626', margin: i > 0 ? '8px 0 0' : '0' }}>• {err}</p>
              ))}
            </div>
          </div>
        </div>
      );
    }
    if (!session) return <Auth />;
    if (isLoading) return <LoadingScreen />;
    if (isFirstTime) return <AmexOnboardingFlow onComplete={handleOnboardingComplete} />;

    switch (view) {
      case 'fixIt':
        return overspentBudget && <FixItScreen budget={overspentBudget} expense={currentExpense} overspentAmount={rebalanceAmount} onRebalance={handleRebalance} onBack={handleBackToTabs} />;
      case 'rebalance':
        return overspentBudget && <RebalanceScreen budgets={monthlyBudgets} overspentBudget={overspentBudget} overspentAmount={rebalanceAmount} onConfirm={handleRebalanceConfirm} onBack={() => setView('fixIt')} />;
      case 'success':
        return <SuccessScreen onBack={handleBackToTabs} />;
      case 'generalRebalance':
        return <GeneralRebalanceScreen budgets={monthlyBudgets} onSave={handleRebalanceConfirm} onCancel={handleBackToTabs} />;
      default:
        return (
          <MainTabbedInterface
            budgets={budgets}
            monthlyBudgets={monthlyBudgets}
            rebalanceCount={rebalanceCount}
            monthlySavings={monthlySavings}
            ytdSavings={ytdSavings}
            monthlyIncome={monthlyIncome}
            selectedDate={selectedDate}
            annualizedExpenses={annualizedExpenses}
            ytdExpenses={ytdExpenses}
            session={session}
            onExpenseAdded={handleExpenseAdded}
            onManageBudget={handleManageBudget}
            onAddSpend={handleManualAddSpend}
            onRemoveSpend={handleManualRemoveSpend}
            onUpdateSavings={handleUpdateMonthlySavings}
            onUpdateIncome={handleUpdateMonthlyIncome}
            onDateChange={handleDateChange}
            onSaveBudgetSettings={handleSaveBudgetSettings}
            onLogout={handleLogout}
          />
        );
    }
  };

  return (
    <NotificationProvider>
      {renderContent()}
      <SystemHealthMonitor />
    </NotificationProvider>
  );
}

export default App;