import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatting';
import { CreditCard, TrendingUp, DollarSign, Download, Filter, Search, Eye } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_type: string;
  status: string;
  amount: number;
  description: string;
  created_at: string;
  commission_percentage?: number;
  commission_amount?: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  method: string;
  created_at: string;
  completed_at?: string;
}

interface EarningsSummary {
  total_earned: number;
  available_balance: number;
  pending_balance: number;
  withdrawn_amount: number;
  commission_rate: number;
}

export default function FarmerTransactionsPage() {
  const [activeTab, setActiveTab] = useState<'earnings' | 'transactions' | 'withdrawals'>('earnings');
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'earnings') {
        const data = await api.farmer.getEarningsSummary();
        setEarnings(data);
      } else if (activeTab === 'transactions') {
        const data = await api.farmer.getTransactions();
        setTransactions(data.transactions || []);
      } else if (activeTab === 'withdrawals') {
        const data = await api.farmer.getTransactions();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = activeTab === 'transactions' ? transactions : withdrawals;
      const csv = generateCSV(data, activeTab);
      downloadCSV(csv, `${activeTab}-history.csv`);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesSearch = w.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Transaction & Earnings</h1>
          <p className="text-gray-600">Track your earnings, commissions, and withdrawal history</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {['earnings', 'transactions', 'withdrawals'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all capitalize ${
                activeTab === tab
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            {/* EARNINGS TAB */}
            {activeTab === 'earnings' && earnings && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-semibold">Total Earned</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {formatCurrency(earnings.total_earned)}
                        </p>
                      </div>
                      <TrendingUp className="w-10 h-10 text-green-600 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-semibold">Available Balance</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {formatCurrency(earnings.available_balance)}
                        </p>
                      </div>
                      <DollarSign className="w-10 h-10 text-blue-600 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-semibold">Pending Balance</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {formatCurrency(earnings.pending_balance)}
                        </p>
                      </div>
                      <CreditCard className="w-10 h-10 text-yellow-600 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-semibold">Total Withdrawn</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {formatCurrency(earnings.withdrawn_amount)}
                        </p>
                      </div>
                      <Download className="w-10 h-10 text-purple-600 opacity-20" />
                    </div>
                  </div>
                </div>

                {/* Earnings Details */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Earnings Breakdown</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="border-l-4 border-green-500 pl-4">
                      <p className="text-sm text-gray-600">Subscription Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(earnings.total_earned * 0.7)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">From active tree adoptions</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <p className="text-sm text-gray-600">Commission Rate</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{earnings.commission_rate}%</p>
                      <p className="text-xs text-gray-500 mt-2">Of all adoption payments</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TRANSACTIONS TAB */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                    <button
                      onClick={handleExport}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
                    >
                      <Download className="w-4 h-4" /> Export
                    </button>
                  </div>
                </div>

                {/* Transactions Table */}
                {filteredTransactions.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-500 text-lg">No transactions found</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Transaction ID</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Commission</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTransactions.map((tx) => (
                            <tr key={tx.id} className="border-b hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-mono text-gray-600 truncate">{tx.id.slice(0, 8)}...</td>
                              <td className="px-6 py-4 text-sm">
                                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                                  {tx.transaction_type.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                {formatCurrency(tx.amount)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {tx.commission_amount ? formatCurrency(tx.commission_amount) : '-'}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    tx.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : tx.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {tx.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{formatDate(tx.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WITHDRAWALS TAB */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search withdrawals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                    <button
                      onClick={handleExport}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
                    >
                      <Download className="w-4 h-4" /> Export
                    </button>
                  </div>
                </div>

                {/* Withdrawals Table */}
                {filteredWithdrawals.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-500 text-lg">No withdrawals found</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Withdrawal ID</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Method</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Requested</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Completed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredWithdrawals.map((w) => (
                            <tr key={w.id} className="border-b hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-mono text-gray-600 truncate">{w.id.slice(0, 8)}...</td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                {formatCurrency(w.amount)}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
                                  {w.method}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    w.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : w.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {w.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{formatDate(w.created_at)}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {w.completed_at ? formatDate(w.completed_at) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Helper functions
function generateCSV(data: any[], type: string): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers.map((header) => {
      const value = item[header];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    })
  );

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
