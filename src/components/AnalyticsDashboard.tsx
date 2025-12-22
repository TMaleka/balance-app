import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  AlertCircle, 
  Lightbulb,
  BarChart3,
  PieChart,
  Calendar,
  Star,
  Zap,
  Gift
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getUserAnalytics, AnalyticsDashboard as AnalyticsData, SpendingInsight, PartnerRecommendation } from '../api/analytics';
import { PartnerLogo, CategoryBadge } from './PartnerBrandingComponents';
import { getCategoryConfig } from '../utils/partnerBranding';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'trends' | 'recommendations'>('insights');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const analyticsData = await getUserAnalytics(user.id);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="amex-card" style={{ padding: 'var(--amex-space-12)' }}>
        <div className="amex-text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--amex-blue)] border-t-transparent mx-auto"></div>
          <p className="amex-card-subtitle" style={{ marginTop: 'var(--amex-space-3)' }}>Analyzing your spending patterns...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-4xl mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="nedbank-card text-center">
          <AlertCircle className="w-12 h-12 mx-autotext-gray-300" />
          <p className="text-gray-500">Unable to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="nedbank-card">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-fullmx-auto">
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="nedbank-text-large mb-2">Analytics Dashboard</h3>
          <p className="text-gray-500">Insights into your spending and rewards</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 ga">
          <div className="bg-green-50text-centerborder-green-200">
            <p className="text-2xl font-bold text-green-900">R{analytics.summary.totalSpent.toFixed(2)}</p>
            <p className="text-sm text-green-600">Total Spent</p>
          </div>
          <div className="bg-blue-50text-centerborder-blue-200">
            <p className="text-2xl font-bold text-blue-900">{analytics.summary.totalPointsEarned.toLocaleString()}</p>
            <p className="text-sm text-blue-600">Points Earned</p>
          </div>
          <div className="bg-purple-50text-centerborder-purple-200">
            <p className="text-2xl font-bold text-purple-900">{analytics.summary.totalPointsRedeemed.toLocaleString()}</p>
            <p className="text-sm text-purple-600">Points Redeemed</p>
          </div>
          <div className="bg-amber-50text-centerborder-amber-200">
            <p className="text-2xl font-bold text-amber-900">{analytics.summary.pointsEfficiency.toFixed(1)}x</p>
            <p className="text-sm text-amber-600">Avg Efficiency</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="p-1">
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'insights'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Insights</span>
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'trends'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Trends</span>
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'recommendations'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Recommendations</span>
          </button>
        </div>
      </div>

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="">
          {analytics.insights.length === 0 ? (
            <div className="p-8text-center">
              <Lightbulb className="w-12 h-12 mx-autotext-gray-300" />
              <p className="text-gray-500">No insights available yet. Make some purchases to see personalized insights!</p>
            </div>
          ) : (
            analytics.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="">
          {/* Monthly Trends */}
          {analytics.monthlyTrends.length > 0 && (
            <div className="nedbank-card">
              <h4 className="text-basespace-x-2">
                <Calendar className="w-5 h-5" />
                <span>Monthly Trends</span>
              </h4>
              <div className="">
                {analytics.monthlyTrends.map((trend, index) => (
                  <div key={trend.period} className="">
                    <div>
                      <p className="font-medium">{formatMonth(trend.period)}</p>
                      <p className="text-sm text-gray-500">{trend.transactionCount} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R{trend.totalSpent.toFixed(2)}</p>
                      <p className="text-sm text-blue-600">{trend.pointsEarned} points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Analysis */}
          {analytics.categoryAnalysis.length > 0 && (
            <div className="nedbank-card">
              <h4 className="text-basespace-x-2">
                <PieChart className="w-5 h-5" />
                <span>Category Breakdown</span>
              </h4>
              <div className="">
                {analytics.categoryAnalysis.map((category) => (
                  <div key={category.category} className="">
                    <div className="space-x-3">
                      <CategoryBadge category={category.category} />
                      <div>
                        <p className="font-medium">{getCategoryConfig(category.category).name}</p>
                        <p className="text-sm text-gray-500">{category.transactionCount} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R{category.totalSpent.toFixed(2)}</p>
                      <p className="text-sm text-green-600">{category.pointsEarned} points</p>
                      <p className="nedbank-text-small">{category.efficiency.toFixed(1)}x efficiency</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="">
          {analytics.recommendations.length === 0 ? (
            <div className="p-8text-center">
              <Target className="w-12 h-12 mx-autotext-gray-300" />
              <p className="text-gray-500">No recommendations available yet. Build your spending history to get personalized suggestions!</p>
            </div>
          ) : (
            analytics.recommendations.map((recommendation, index) => (
              <RecommendationCard key={index} recommendation={recommendation} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Helper Components
function InsightCard({ insight }: { insight: SpendingInsight }) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'recommendation': return Lightbulb;
      case 'achievement': return Award;
      case 'warning': return AlertCircle;
      default: return Lightbulb;
    }
  };

  const getInsightColor = (type: string, priority: string) => {
    if (type === 'achievement') return 'green';
    if (type === 'warning') return 'red';
    if (priority === 'high') return 'blue';
    return 'gray';
  };

  const IconComponent = getInsightIcon(insight.type);
  const color = getInsightColor(insight.type, insight.priority);

  return (
    <div className={`nedbank-card border-l-4 border-l-${color}-500`}>
      <div className="items-start space-x-4">
        <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
          <IconComponent className={`w-5 h-5 text-${color}-600`} />
        </div>
        <div className="-1">
          <h4 className="font-mediummb-1">{insight.title}</h4>
          <p className="mb-2">{insight.description}</p>
          <div className="">
            <span className="text-sm text-gray-500">{insight.period}</span>
            {insight.value && (
              <span className={`font-bold text-${color}-600`}>{insight.value}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: PartnerRecommendation }) {
  const priorityColors = {
    high: 'red',
    medium: 'yellow',
    low: 'gray'
  };
  
  const color = priorityColors[recommendation.priority];

  return (
    <div className="nedbank-card">
      <div className="items-start space-x-4">
        <PartnerLogo partnerId={recommendation.partnerId} size="md" />
        <div className="-1">
          <div className="mb-2">
            <h4 className="font-medium">{recommendation.partnerName}</h4>
            <div className={`px-2 py-1 bg-${color}-100 text-${color}-800 text-xs font-medium rounded-full`}>
              {recommendation.priority} priority
            </div>
          </div>
          
          <CategoryBadge category={recommendation.category} />
          
          <p className="mt-2 mb-3">{recommendation.reason}</p>
          
          <div className="grid grid-cols-2 gatext-sm">
            <div>
              <p className="text-gray-500">Potential Points</p>
              <p className="font-bold text-green-600">{recommendation.potentialPoints} points</p>
            </div>
            <div>
              <p className="text-gray-500">Points Rate</p>
              <p className="font-bold text-blue-600">{recommendation.pointsRate}x</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatMonth(monthString: string): string {
  const [year, month] = monthString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

