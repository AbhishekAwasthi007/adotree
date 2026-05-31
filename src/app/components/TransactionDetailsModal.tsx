import React from 'react';
import { X, DollarSign, Calendar, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '../utils/formatting';

interface TransactionDetails {
  id: string;
  transaction_type: string;
  status: string;
  amount: number;
  commission_amount?: number;
  commission_percentage?: number;
  from_user?: { name: string; email: string };
  to_user?: { name: string; email: string };
  description: string;
  notes?: string;
  created_at: string;
  completed_at?: string;
}

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: TransactionDetails | null;
}

export default function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailsModalProps) {
  if (!isOpen || !transaction) return null;

  const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    completed: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-5 h-5" /> },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <AlertCircle className="w-5 h-5" /> },
    failed: { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertCircle className="w-5 h-5" /> },
  };

  const statusColor = statusColors[transaction.status] || statusColors.pending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Transaction Details</h2>
            <p className="text-green-100 text-sm mt-1">ID: {transaction.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className={`${statusColor.bg} rounded-lg p-4 flex items-center gap-3`}>
            <div className={statusColor.text}>{statusColor.icon}</div>
            <div>
              <p className={`font-semibold ${statusColor.text} capitalize`}>{transaction.status}</p>
              {transaction.completed_at && (
                <p className={`text-sm ${statusColor.text}`}>
                  Completed on {formatDate(transaction.completed_at)}
                </p>
              )}
            </div>
          </div>

          {/* Main Details */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Amount */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-600 font-semibold">Amount</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                ₹{transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Type */}
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600 font-semibold mb-2">Transaction Type</p>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                {transaction.transaction_type.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Date */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-gray-600 font-semibold">Created Date</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">{formatDate(transaction.created_at)}</p>
            </div>

            {/* Commission */}
            {transaction.commission_amount && (
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 font-semibold mb-2">Commission</p>
                <p className="text-lg font-semibold text-gray-900">
                  ₹{transaction.commission_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">{transaction.commission_percentage}% of amount</p>
              </div>
            )}
          </div>

          {/* Users */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Parties Involved</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {transaction.from_user && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-semibold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" /> From
                  </p>
                  <p className="font-semibold text-gray-900">{transaction.from_user.name}</p>
                  <p className="text-sm text-gray-600">{transaction.from_user.email}</p>
                </div>
              )}
              {transaction.to_user && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-semibold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" /> To
                  </p>
                  <p className="font-semibold text-gray-900">{transaction.to_user.name}</p>
                  <p className="text-sm text-gray-600">{transaction.to_user.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="border-t pt-6">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-3">
              <FileText className="w-5 h-5" /> Description
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <p className="text-gray-700">{transaction.description}</p>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-900 mb-3">Additional Notes</h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-blue-900">{transaction.notes}</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="border-t pt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                // TODO: Implement download/print functionality
                console.log('Download receipt');
              }}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              Download Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
