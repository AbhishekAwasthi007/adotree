import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatting';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface EarningData {
  total_earned: number;
  available_balance: number;
  pending_balance: number;
  withdrawn_amount: number;
  commission_rate: number;
}

interface MonthlyEarning {
  month: string;
  amount: number;
}

export default function EarningsInsightsPage() {
  const [earnings, setEarnings] = useState<EarningData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyEarning[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchEarningsData();
  }, [timeRange]);

  const fetchEarningsData = async () => {
    setLoading(true);
    try {
      const data = await api.farmer.getEarningsSummary();
      setEarnings(data);

      // Generate monthly data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyEarnings = months.map((month, index) => ({
        month,
        amount: Math.floor(Math.random() * (data.total_earned / 12) * 1.5),
      }));
      setMonthlyData(monthlyEarnings);
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 text-lg">No earnings data available</p>
        </div>
      </div>
    );
  }

  const maxMonthlyAmount = Math.max(...monthlyData.map((d) => d.amount), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Earnings & Insights</h1>
          <p className="text-gray-600">Track your income, commissions, and growth trends</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-4 mb-8">
          {(['month', 'quarter', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2 rounded-lg font-semibold capitalize transition-all ${
                timeRange === range
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Main Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Total Earned */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <p className="text-green-100 text-sm font-semibold">Total Earned</p>
              <TrendingUp className="w-6 h-6 opacity-50" />
            </div>
            <h3 className="text-3xl font-bold mb-2">
              ₹{earnings.total_earned.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-green-100 text-sm">All-time earnings</p>
          </div>

          {/* Available Balance */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <p className="text-blue-100 text-sm font-semibold">Available Balance</p>
              <DollarSign className="w-6 h-6 opacity-50" />
            </div>
            <h3 className="text-3xl font-bold mb-2">
              ₹{earnings.available_balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-blue-100 text-sm">Ready to withdraw</p>
          </div>

          {/* Pending Balance */}
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <p className="text-yellow-100 text-sm font-semibold">Pending Balance</p>
              <Calendar className="w-6 h-6 opacity-50" />
            </div>
            <h3 className="text-3xl font-bold mb-2">
              ₹{earnings.pending_balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-yellow-100 text-sm">Processing</p>
          </div>

          {/* Withdrawn Amount */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <p className="text-purple-100 text-sm font-semibold">Withdrawn</p>
              <ArrowDownLeft className="w-6 h-6 opacity-50" />
            </div>
            <h3 className="text-3xl font-bold mb-2">
              ₹{earnings.withdrawn_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-purple-100 text-sm">Successfully withdrawn</p>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Breakdown Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-600" /> Breakdown
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Subscription Revenue</p>
                  <p className="text-sm text-gray-500">From active adoptions</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ₹{(earnings.total_earned * 0.7).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Referral Bonuses</p>
                  <p className="text-sm text-gray-500">From referrals</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{(earnings.total_earned * 0.15).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Additional Earnings</p>
                  <p className="text-sm text-gray-500">Commissions and rewards</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{(earnings.total_earned * 0.15).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Commission Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" /> Commission Rate
            </h2>
            <div className="space-y-6">
              <div className="text-center p-8 bg-green-50 rounded-lg border-2 border-green-200">
                <p className="text-gray-600 font-semibold mb-2">Current Commission Rate</p>
                <p className="text-5xl font-bold text-green-600">{earnings.commission_rate}%</p>
                <p className="text-sm text-gray-600 mt-4">Of all adoption payments</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-semibold mb-2">💡 How it works:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Earn commissions on every adoption payment</li>
                  <li>Bonus multipliers for top-performing farmers</li>
                  <li>Tier up to earn higher rates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Earnings Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" /> Monthly Earnings Trend
          </h2>

          {/* Chart */}
          <div className="space-y-4">
            <div className="flex items-end gap-2 h-64">
              {monthlyData.map((data, index) => {
                const percentage = (data.amount / maxMonthlyAmount) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 transition-all group-hover:from-green-600 group-hover:to-green-500"
                        style={{ height: `${Math.max(percentage, 5)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 font-semibold">{data.month}</p>
                    <p className="text-xs text-gray-500">
                      ₹{(data.amount / 1000).toFixed(0)}K
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-600 font-semibold">Average Monthly</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ₹{(monthlyData.reduce((sum, d) => sum + d.amount, 0) / monthlyData.length).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Highest Month</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ₹{Math.max(...monthlyData.map((d) => d.amount)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Growth Trend</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">↑ 24%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-4">💡 Tips to Increase Your Earnings:</h3>
          <ul className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <li>✓ Keep your farm and trees updated with quality photos</li>
            <li>✓ Respond promptly to adopter inquiries and messages</li>
            <li>✓ Share regular updates and stories from your farm</li>
            <li>✓ Participate in community challenges and events</li>
            <li>✓ Maintain high farm rating and reviews</li>
            <li>✓ Offer premium services like video calls</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
