import { useState, useEffect } from 'react';
import { Brain, Zap, TrendingUp, Target, Gift, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getUserAnalytics, SpendingInsight } from '../api/analytics';
import { PartnerLogo } from './PartnerBrandingComponents';

interface SmartInsightsProps {
  userId?: string;
  compact?: boolean;
}

export default function SmartInsights({ userId, compact = false }: SmartInsightsProps) {
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentInsight, setCurrentInsight] = useState(0);

  useEffect(() => {
    loadInsights();
    
    // Auto-rotate insights every 5 seconds if not compact
    if (!compact && insights.length > 1) {
      const interval = setInterval(() => {
        setCurrentInsight(prev => (prev + 1) % insights.length);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [compact, insights.length]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        currentUserId = user.id;
      }

      const analytics = await getUserAnalytics(currentUserId);
      
      // Filter for high-priority actionable insights
      const actionableInsights = analytics.insights
        .filter(insight => insight.actionable && insight.priority === 'high')
        .slice(0, 3);
      
      setInsights(actionableInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="amex-card" style={{ padding: compact ? 'var(--amex-space-4)' : 'var(--amex-space-6)' }}>
        <div className="amex-text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--amex-blue)] border-t-transparent mx-auto"></div>
          <p className="amex-card-subtitle" style={{ marginTop: 'var(--amex-space-3)' }}>Loading smart insights...</p>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className={`nedbank-card ${compact ? 'p-4' : 'p-6'}`}>
        <div className="space-x-3">
          <div className="w-10 h-10 bg-blue-100">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium">Smart Insights</h4>
            <p className="text-sm text-gray-500">Make some purchases to get personalized insights</p>
          </div>
        </div>
      </div>
    );
  }

  const insight = insights[currentInsight];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return Zap;
      case 'achievement': return Gift;
      case 'trend': return TrendingUp;
      case 'warning': return AlertTriangle;
      default: return Target;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'recommendation': return 'blue';
      case 'achievement': return 'green';
      case 'trend': return 'purple';
      case 'warning': return 'red';
      default: return 'gray';
    }
  };

  const IconComponent = getInsightIcon(insight.type);
  const color = getInsightColor(insight.type);

  if (compact) {
    return (
      <div className="">
        <div className="space-x-3">
          <div className={`w-8 h-8 bg-${color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
            <IconComponent className={`w-4 h-4 text-${color}-600`} />
          </div>
          <div className="-1 min-w-0">
            <p className="font-mediumtext-sm truncate">{insight.title}</p>
            <p className="nedbank-text-small truncate">{insight.description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nedbank-card">
      <div className="items-start">
        <div className="space-x-3">
          <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center`}>
            <IconComponent className={`w-6 h-6 text-${color}-600`} />
          </div>
          <div>
            <h4 className="font-medium">Smart Insight</h4>
            <p className="text-sm text-gray-500">AI-powered recommendation</p>
          </div>
        </div>
        
        {insights.length > 1 && (
          <div className="space-x-1">
            {insights.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentInsight(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentInsight ? `bg-${color}-600` : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h5 className="nedbank-text-base">{insight.title}</h5>
        <p className="leading-relaxed">{insight.description}</p>
        
        <div className="pt-3-t">
          <span className="text-sm text-gray-500">{insight.period}</span>
          {insight.value && (
            <span className={`font-bold text-${color}-600`}>{insight.value}</span>
          )}
        </div>

        {insight.actionable && (
          <div className={`bg-${color}-50 rounded-xl p-3 border border-${color}-200`}>
            <div className="space-x-2">
              <Zap className={`w-4 h-4 text-${color}-600`} />
              <span className={`text-sm font-medium text-${color}-800`}>
                Take Action
              </span>
            </div>
            <p className={`text-sm text-${color}-700 mt-1`}>
              {insight.type === 'recommendation' 
                ? 'Try shopping at recommended partners to maximize your points'
                : 'Review your spending patterns and optimize your rewards'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for embedding in other components
export function SmartInsightsBanner({ userId }: { userId?: string }) {
  return <SmartInsights userId={userId} compact={true} />;
}

