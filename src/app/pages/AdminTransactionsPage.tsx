import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatting';
import { Search, Filter, Download, TrendingUp, Users, DollarSign } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_type: string;
  status: string;
  amount: number;
  from_user_id?: string;
  to_user_id?: string;
  description: string;
  created_at: string;
}

interface Commission {
  id: string;
  farmer_id: string;
  amount: number;
  status: string;
  percentage: number;
  created_at: string;
  released_at?: string;
}

export default function AdminTransactionsPage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'commissions'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'transactions') {
        const data = await api.admin.getTransactions();
        setTransactions(data.transactions || []);
      } else {
        const data = await api.admin.getPendingCommissions();
        setCommissions(data.commissions || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async (commissionId: string) => {
    try {
      await api.admin.releasePayment(commissionId);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release payment');
    }
  };

  const handleExport = async () => {
    try {
      const data = activeTab === 'transactions' ? transactions : commissions;
      const csv = generateCSV(data, activeTab);
      downloadCSV(csv, `${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.transaction_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredCommissions = commissions.filter((c) => {
    const matchesSearch = c.farmer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Management</h1>
          <p className="text-gray-600">Track all transactions and manage farmer commissions</p>
        </div>

        {/* Summary Cards */}
        {activeTab === 'transactions' && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Total Transactions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{transactions.length}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Total Amount</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(transactions.reduce((sum, tx) => sum + tx.amount, 0))}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {transactions.filter((tx) => tx.status === 'completed').length}
                  </p>
                </div>
                <Users className="w-10 h-10 text-yellow-600 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => {
              setActiveTab('transactions');
              setSearchQuery('');
              setStatusFilter('all');
              setTypeFilter('all');
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'transactions'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => {
              setActiveTab('commissions');
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'commissions'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending Commissions
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : activeTab === 'transactions' ? (
          <TransactionsTable
            transactions={filteredTransactions}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            onExport={handleExport}
          />
        ) : (
          <CommissionsTable
            commissions={filteredCommissions}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onRelease={handleReleasePayment}
            onExport={handleExport}
          />
        )}
      </div>
    </div>
  );
}

function TransactionsTable({
  transactions,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  onExport,
}: {
  transactions: Transaction[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  onExport: () => void;
}) {
  const transactionTypes = Array.from(new Set(transactions.map((tx) => tx.transaction_type)));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Types</option>
            {transactionTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
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
            onClick={onExport}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      {transactions.length === 0 ? (
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
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
                    <td className="px-6 py-4 text-sm text-gray-600 truncate">{tx.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CommissionsTable({
  commissions,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onRelease,
  onExport,
}: {
  commissions: Commission[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onRelease: (id: string) => void;
  onExport: () => void;
}) {
  const [releasing, setReleasing] = useState<string | null>(null);

  const handleRelease = async (id: string) => {
    setReleasing(id);
    try {
      await onRelease(id);
    } finally {
      setReleasing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Farmer ID or Commission ID..."
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
            <option value="pending">Pending</option>
            <option value="released">Released</option>
          </select>
          <button
            onClick={onExport}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-600">
          <p className="text-sm text-gray-600 font-semibold">Pending Commissions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {commissions.filter((c) => c.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-600">
          <p className="text-sm text-gray-600 font-semibold">Pending Amount</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(commissions.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
          <p className="text-sm text-gray-600 font-semibold">Total Released</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(commissions.filter((c) => c.status === 'released').reduce((sum, c) => sum + c.amount, 0))}
          </p>
        </div>
      </div>

      {/* Table */}
      {commissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No commissions found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Commission ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Farmer ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Commission %</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Released</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((commission) => (
                  <tr key={commission.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 truncate">{commission.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 truncate">{commission.farmer_id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(commission.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-semibold">{commission.percentage}%</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          commission.status === 'released'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {commission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(commission.created_at)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {commission.released_at ? formatDate(commission.released_at) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {commission.status === 'pending' ? (
                        <button
                          onClick={() => handleRelease(commission.id)}
                          disabled={releasing === commission.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-semibold"
                        >
                          {releasing === commission.id ? 'Releasing...' : 'Release'}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm font-semibold">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Export utility functions for CSV
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
