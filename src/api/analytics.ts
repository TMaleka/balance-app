/**
 * Advanced Analytics Engine
 * Provides spending insights, partner recommendations, and trend analysis
 */

import { supabase } from '../supabaseClient';
import { getPartnerBranding, getCategoryConfig } from '../utils/partnerBranding';

// Analytics Types
export interface SpendingInsight {
  type: 'trend' | 'recommendation' | 'achievement' | 'warning';
  title: string;
  description: string;
  value?: string;
  change?: number;
  period: string;
  category?: string;
  partnerId?: string;
  actionable?: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface PartnerRecommendation {
  partnerId: string;
  partnerName: string;
  category: string;
  pointsRate: number;
  reason: string;
  potentialPoints: number;
  estimatedSpending: number;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SpendingTrend {
  period: string;
  totalSpent: number;
  pointsEarned: number;
  transactionCount: number;
  averageTransaction: number;
  topCategory: string;
  topPartner: string;
  growth: number;
}

export interface CategoryAnalysis {
  category: string;
  totalSpent: number;
  pointsEarned: number;
  transactionCount: number;
  averageSpending: number;
  topPartner: string;
  efficiency: number; // Points per rand
  trend: 'up' | 'down' | 'stable';
}

export interface AnalyticsDashboard {
  insights: SpendingInsight[];
  recommendations: PartnerRecommendation[];
  monthlyTrends: SpendingTrend[];
  categoryAnalysis: CategoryAnalysis[];
  summary: {
    totalSpent: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    averagePointsPerTransaction: number;
    mostUsedPartner: string;
    favoriteCategory: string;
    pointsEfficiency: number;
  };
}

/**
 * Get user's spending analytics dashboard
 */
export async function getUserAnalytics(userId: string): Promise<AnalyticsDashboard> {
  try {
    const [transactions, redemptions, partners] = await Promise.all([
      getUserTransactions(userId),
      getUserRedemptions(userId),
      getActivePartners()
    ]);

    const insights = generateSpendingInsights(transactions, redemptions);
    const recommendations = generatePartnerRecommendations(transactions, partners);
    const monthlyTrends = calculateMonthlyTrends(transactions);
    const categoryAnalysis = analyzeCategorySpending(transactions);
    const summary = calculateSummaryStats(transactions, redemptions);

    return {
      insights,
      recommendations,
      monthlyTrends,
      categoryAnalysis,
      summary
    };

  } catch (error) {
    console.error('Error generating analytics:', error);
    return getEmptyAnalytics();
  }
}

/**
 * Get user transactions with partner data
 */
async function getUserTransactions(userId: string) {
  const { data, error } = await supabase
    .from('loyalty_transactions')
    .select(`
      *,
      partners(partner_id, display_name, category, points_rate)
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('transaction_timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user redemptions
 */
async function getUserRedemptions(userId: string) {
  const { data, error } = await supabase
    .from('points_redemptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching redemptions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get active partners
 */
async function getActivePartners() {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching partners:', error);
    return [];
  }

  return data || [];
}

/**
 * Generate spending insights
 */
function generateSpendingInsights(transactions: any[], redemptions: any[]): SpendingInsight[] {
  const insights: SpendingInsight[] = [];
  
  if (transactions.length === 0) {
    return [{
      type: 'recommendation',
      title: 'Start Your Journey',
      description: 'Make your first purchase at a partner store to start earning points!',
      period: 'now',
      actionable: true,
      priority: 'high'
    }];
  }

  // Recent activity insight
  const recentTransactions = transactions.filter(t => 
    new Date(t.transaction_timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  if (recentTransactions.length > 0) {
    const weeklySpent = recentTransactions.reduce((sum, t) => sum + t.sale_amount, 0);
    const weeklyPoints = recentTransactions.reduce((sum, t) => sum + t.points_earned, 0);
    
    insights.push({
      type: 'trend',
      title: 'Weekly Activity',
      description: `You've earned ${weeklyPoints} points from R${weeklySpent.toFixed(2)} in purchases this week`,
      value: `${weeklyPoints} points`,
      period: 'This week',
      priority: 'medium'
    });
  }

  // Category spending analysis
  const categorySpending = transactions.reduce((acc: any, t) => {
    const category = t.partners?.category || 'other';
    acc[category] = (acc[category] || 0) + t.sale_amount;
    return acc;
  }, {});

  const topCategory = Object.entries(categorySpending)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];

  if (topCategory) {
    const [category, amount] = topCategory;
    const categoryConfig = getCategoryConfig(category);
    
    insights.push({
      type: 'trend',
      title: 'Top Spending Category',
      description: `${categoryConfig.name} accounts for R${(amount as number).toFixed(2)} of your spending`,
      category,
      period: 'All time',
      priority: 'low'
    });
  }

  // Points efficiency insight
  const totalSpent = transactions.reduce((sum, t) => sum + t.sale_amount, 0);
  const totalPoints = transactions.reduce((sum, t) => sum + t.points_earned, 0);
  const efficiency = totalPoints / totalSpent;

  if (efficiency < 2) {
    insights.push({
      type: 'recommendation',
      title: 'Boost Your Points',
      description: 'Shop at higher-rate partners like Shell (3x points) to maximize your rewards',
      period: 'Next purchase',
      actionable: true,
      priority: 'high'
    });
  }

  // Redemption opportunity
  const totalRedeemed = redemptions.reduce((sum, r) => sum + r.points_redeemed, 0);
  const availablePoints = totalPoints - totalRedeemed;

  if (availablePoints >= 1000) {
    insights.push({
      type: 'achievement',
      title: 'Redemption Ready!',
      description: `You have ${availablePoints} points available for cashback (R${(availablePoints/100).toFixed(2)})`,
      value: `R${(availablePoints/100).toFixed(2)}`,
      period: 'Available now',
      actionable: true,
      priority: 'high'
    });
  }

  return insights;
}

/**
 * Generate partner recommendations
 */
function generatePartnerRecommendations(transactions: any[], partners: any[]): PartnerRecommendation[] {
  const recommendations: PartnerRecommendation[] = [];
  
  // Analyze user's spending patterns
  const categorySpending = transactions.reduce((acc: any, t) => {
    const category = t.partners?.category || 'other';
    acc[category] = (acc[category] || 0) + t.sale_amount;
    return acc;
  }, {});

  const userPartners = new Set(transactions.map(t => t.partner_id));
  const totalSpending = transactions.reduce((sum, t) => sum + t.sale_amount, 0);

  // Recommend unused partners in user's favorite categories
  Object.entries(categorySpending)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 2) // Top 2 categories
    .forEach(([category, spending]) => {
      const categoryPartners = partners.filter(p => 
        p.category === category && !userPartners.has(p.partner_id)
      );

      categoryPartners
        .sort((a, b) => b.points_rate - a.points_rate)
        .slice(0, 2) // Top 2 partners per category
        .forEach(partner => {
          const estimatedSpending = (spending as number) * 0.3; // 30% of category spending
          const potentialPoints = Math.floor(estimatedSpending * partner.points_rate);
          
          recommendations.push({
            partnerId: partner.partner_id,
            partnerName: partner.display_name,
            category: partner.category,
            pointsRate: partner.points_rate,
            reason: `Based on your ${getCategoryConfig(category).name.toLowerCase()} spending`,
            potentialPoints,
            estimatedSpending,
            confidence: 0.8,
            priority: partner.points_rate >= 3 ? 'high' : 'medium'
          });
        });
    });

  // Recommend high-rate partners if user hasn't used them
  const highRatePartners = partners
    .filter(p => p.points_rate >= 3 && !userPartners.has(p.partner_id))
    .sort((a, b) => b.points_rate - a.points_rate)
    .slice(0, 2);

  highRatePartners.forEach(partner => {
    const avgTransaction = totalSpending / transactions.length || 100;
    const potentialPoints = Math.floor(avgTransaction * partner.points_rate);
    
    recommendations.push({
      partnerId: partner.partner_id,
      partnerName: partner.display_name,
      category: partner.category,
      pointsRate: partner.points_rate,
      reason: `Highest points rate available (${partner.points_rate}x)`,
      potentialPoints,
      estimatedSpending: avgTransaction,
      confidence: 0.6,
      priority: 'high'
    });
  });

  return recommendations.slice(0, 5); // Top 5 recommendations
}

/**
 * Calculate monthly trends
 */
function calculateMonthlyTrends(transactions: any[]): SpendingTrend[] {
  const monthlyData: { [key: string]: any } = {};
  
  transactions.forEach(t => {
    const date = new Date(t.transaction_timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        period: monthKey,
        totalSpent: 0,
        pointsEarned: 0,
        transactionCount: 0,
        partners: {},
        categories: {}
      };
    }
    
    monthlyData[monthKey].totalSpent += t.sale_amount;
    monthlyData[monthKey].pointsEarned += t.points_earned;
    monthlyData[monthKey].transactionCount += 1;
    
    // Track partners and categories
    const partnerId = t.partner_id;
    const category = t.partners?.category || 'other';
    
    monthlyData[monthKey].partners[partnerId] = (monthlyData[monthKey].partners[partnerId] || 0) + t.sale_amount;
    monthlyData[monthKey].categories[category] = (monthlyData[monthKey].categories[category] || 0) + t.sale_amount;
  });

  return Object.values(monthlyData)
    .map((data: any) => ({
      period: data.period,
      totalSpent: data.totalSpent,
      pointsEarned: data.pointsEarned,
      transactionCount: data.transactionCount,
      averageTransaction: data.totalSpent / data.transactionCount,
      topCategory: Object.entries(data.categories).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'none',
      topPartner: Object.entries(data.partners).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'none',
      growth: 0 // Calculate growth compared to previous month
    }))
    .sort((a, b) => b.period.localeCompare(a.period))
    .slice(0, 6); // Last 6 months
}

/**
 * Analyze category spending
 */
function analyzeCategorySpending(transactions: any[]): CategoryAnalysis[] {
  const categoryData: { [key: string]: any } = {};
  
  transactions.forEach(t => {
    const category = t.partners?.category || 'other';
    
    if (!categoryData[category]) {
      categoryData[category] = {
        category,
        totalSpent: 0,
        pointsEarned: 0,
        transactionCount: 0,
        partners: {}
      };
    }
    
    categoryData[category].totalSpent += t.sale_amount;
    categoryData[category].pointsEarned += t.points_earned;
    categoryData[category].transactionCount += 1;
    categoryData[category].partners[t.partner_id] = (categoryData[category].partners[t.partner_id] || 0) + t.sale_amount;
  });

  return Object.values(categoryData)
    .map((data: any) => ({
      category: data.category,
      totalSpent: data.totalSpent,
      pointsEarned: data.pointsEarned,
      transactionCount: data.transactionCount,
      averageSpending: data.totalSpent / data.transactionCount,
      topPartner: Object.entries(data.partners).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'none',
      efficiency: data.pointsEarned / data.totalSpent,
      trend: 'stable' as const // Would need historical data for real trend analysis
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Calculate summary statistics
 */
function calculateSummaryStats(transactions: any[], redemptions: any[]) {
  const totalSpent = transactions.reduce((sum, t) => sum + t.sale_amount, 0);
  const totalPointsEarned = transactions.reduce((sum, t) => sum + t.points_earned, 0);
  const totalPointsRedeemed = redemptions.reduce((sum, r) => sum + r.points_redeemed, 0);
  
  // Find most used partner
  const partnerUsage: { [key: string]: number } = {};
  transactions.forEach(t => {
    partnerUsage[t.partner_id] = (partnerUsage[t.partner_id] || 0) + 1;
  });
  const mostUsedPartner = Object.entries(partnerUsage)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

  // Find favorite category
  const categorySpending: { [key: string]: number } = {};
  transactions.forEach(t => {
    const category = t.partners?.category || 'other';
    categorySpending[category] = (categorySpending[category] || 0) + t.sale_amount;
  });
  const favoriteCategory = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

  return {
    totalSpent,
    totalPointsEarned,
    totalPointsRedeemed,
    averagePointsPerTransaction: transactions.length > 0 ? totalPointsEarned / transactions.length : 0,
    mostUsedPartner,
    favoriteCategory,
    pointsEfficiency: totalSpent > 0 ? totalPointsEarned / totalSpent : 0
  };
}

/**
 * Get empty analytics for new users
 */
function getEmptyAnalytics(): AnalyticsDashboard {
  return {
    insights: [{
      type: 'recommendation',
      title: 'Welcome to Balance Loyalty!',
      description: 'Start earning points by making purchases at partner stores',
      period: 'Get started',
      actionable: true,
      priority: 'high'
    }],
    recommendations: [],
    monthlyTrends: [],
    categoryAnalysis: [],
    summary: {
      totalSpent: 0,
      totalPointsEarned: 0,
      totalPointsRedeemed: 0,
      averagePointsPerTransaction: 0,
      mostUsedPartner: 'none',
      favoriteCategory: 'none',
      pointsEfficiency: 0
    }
  };
}
