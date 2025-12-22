import React, { useState, useRef } from 'react';
import { TrendingUp, Receipt, Settings, CreditCard, User } from 'lucide-react';
import AmexProgressTab from './AmexProgressTab';
import ExpenseOverview from './ExpenseOverview';
import AmexBudgetSettings from './AmexBudgetSettings';
import LoyaltyCard from './LoyaltyCard';
import QuickTest from './QuickTest';
import PartnerApiTest from './PartnerApiTest';
import PointsRedemptionWrapper from './PointsRedemptionWrapper';
import PartnerDirectory from './PartnerDirectory';
import AnalyticsDashboard from './AnalyticsDashboard';
import UserProfile from './UserProfile';
import QuickLogout from './QuickLogout';
import { Budget } from '../types';

interface MainTabbedInterfaceProps {
  budgets: Budget[];
  monthlyBudgets: Budget[];
  rebalanceCount: number;
  monthlySavings: number;
  ytdSavings: number;
  selectedDate: Date;
  annualizedExpenses: number;
  ytdExpenses: number;
  session: any;
  onExpenseAdded: (merchant: string, amount: number, categoryId: number) => void;
  onManageBudget: () => void;
  onAddSpend: (budgetId: number) => void;
  onRemoveSpend: (budgetId: number) => void;
  onUpdateSavings: () => void;
  onDateChange: (date: Date) => void;
  onSaveBudgetSettings: (budgets: Budget[]) => void;
  onLogout: () => void;
}

export default function MainTabbedInterface({
  budgets,
  monthlyBudgets,
  rebalanceCount,
  monthlySavings,
  ytdSavings,
  selectedDate,
  annualizedExpenses,
  ytdExpenses,
  session,
  onExpenseAdded,
  onManageBudget,
  onAddSpend,
  onRemoveSpend,
  onUpdateSavings,
  onDateChange,
  onSaveBudgetSettings,
  onLogout
}: MainTabbedInterfaceProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 0, name: 'Progress', icon: TrendingUp },
    { id: 1, name: 'Expenses', icon: Receipt },
    { id: 2, name: 'Loyalty', icon: CreditCard },
    { id: 3, name: 'Settings', icon: Settings },
    { id: 4, name: 'Profile', icon: User }
  ];

  // Handle touch events for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't handle swipes if user is touching a button, nedbank-input, or other interactive element
    const target = e.target as HTMLElement;
    if (target.closest('button, nedbank-input, select, textarea, a')) {
      return;
    }
    
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't handle swipes if we didn't start tracking
    if (touchStart === null) return;
    
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && activeTab < tabs.length - 1) {
      setActiveTab(activeTab + 1);
    }
    if (isRightSwipe && activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
    
    // Reset touch tracking
    setTouchStart(null);
    setTouchEnd(null);
  };

  const renderTabContent = (tabIndex: number) => {
    switch (tabIndex) {
      case 0:
        return (
          <AmexProgressTab
            budgets={monthlyBudgets}
            rebalanceCount={rebalanceCount}
            session={session}
            onManageBudget={onManageBudget}
            onAddSpend={onAddSpend}
            onRemoveSpend={onRemoveSpend}
            savings={monthlySavings}
            ytdSavings={ytdSavings}
            onUpdateSavings={onUpdateSavings}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            annualizedExpenses={annualizedExpenses}
            ytdExpenses={ytdExpenses}
            showBudgetBreakdown={false} // Remove budget breakdown
          />
        );
      case 1:
        return (
          <ExpenseOverview
            budgets={monthlyBudgets}
            selectedDate={selectedDate}
            session={session}
            onExpenseAdded={onExpenseAdded}
          />
        );
      case 2:
        return (
          <div>
            <LoyaltyCard />
            <PointsRedemptionWrapper />
            <AnalyticsDashboard />
            <PartnerDirectory />
          </div>
        );
      case 3:
        return (
          <AmexBudgetSettings
            budgets={budgets}
            onSave={onSaveBudgetSettings}
            onCancel={() => setActiveTab(0)} // Go back to Progress tab
          />
        );
      case 4:
        return (
          <UserProfile session={session} onLogout={onLogout} />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--amex-gray-50)' }}>
      {/* Tab Content */}
      <div
        ref={containerRef}
        style={{ paddingBottom: '72px', minHeight: '100vh' }}
        onTouchStart={activeTab === 1 ? undefined : handleTouchStart}
        onTouchMove={activeTab === 1 ? undefined : handleTouchMove}
        onTouchEnd={activeTab === 1 ? undefined : handleTouchEnd}
      >
        {renderTabContent(activeTab)}
      </div>

      {/* Bottom Navigation - Amex Style */}
      <nav className="amex-nav">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`amex-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="amex-nav-icon" />
              <span className="amex-nav-label">{tab.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

