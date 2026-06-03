import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
}

export default function WithdrawalRequestModal({
  isOpen,
  onClose,
  availableBalance,
}: WithdrawalModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bank' | 'upi'>('bank');
  const [bankDetails, setBankDetails] = useState<{ verified: boolean; method?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBankDetails();
    }
  }, [isOpen]);

  const fetchBankDetails = async () => {
    try {
      const wallet = await api.farmer.getWallet();
      setBankDetails({
        verified: wallet.bank_verified || false,
        method: wallet.upi_id ? 'upi' : 'bank',
      });
    } catch (err) {
      console.error('Failed to fetch bank details:', err);
    }
  };

  const validateAmount = (): boolean => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount)) {
      setError('Please enter a valid amount');
      return false;
    }
    if (numAmount < 100) {
      setError('Minimum withdrawal amount is ₹100');
      return false;
    }
    if (numAmount > availableBalance) {
      setError('Insufficient balance');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateAmount()) return;

    if (!bankDetails?.verified) {
      setError('Please verify your bank account details first');
      return;
    }

    setLoading(true);
    try {
      await api.farmer.requestWithdrawal({
        amount: parseFloat(amount),
        withdrawal_method: method,
      });
      setSuccess(true);
      setTimeout(() => {
        setAmount('');
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request withdrawal');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const minAmount = 100;
  const maxAmount = availableBalance;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">Request Withdrawal</h2>
          <p className="text-green-100 text-sm mt-1">Withdraw to your bank account or UPI</p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Bank Status */}
          {!bankDetails?.verified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 font-semibold">⚠ Bank account not verified</p>
              <p className="text-xs text-yellow-700 mt-1">
                Please update your bank details and verify before requesting a withdrawal
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              ✓ Withdrawal request submitted successfully! You'll receive the funds within 2-3 business days.
            </div>
          )}

          {/* Balance Info */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
              Available Balance
            </p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              ₹{availableBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* Withdrawal Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Withdrawal Method
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                  method === 'bank'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">Bank Transfer</p>
                <p className="text-xs text-gray-600">2-3 business days</p>
              </button>
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                  method === 'upi'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">UPI</p>
                <p className="text-xs text-gray-600">Instant</p>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-600 font-semibold">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                min={minAmount}
                max={maxAmount}
                step="100"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold text-lg"
                placeholder="0"
                disabled={!bankDetails?.verified || loading}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Min: ₹{minAmount}</span>
              <span>Max: ₹{maxAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          {bankDetails?.verified && availableBalance > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                Quick select
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  Math.min(1000, maxAmount),
                  Math.min(5000, maxAmount),
                  Math.min(10000, maxAmount),
                  maxAmount,
                ].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm font-semibold"
                  >
                    ₹{(quickAmount / 1000).toFixed(0)}K
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !bankDetails?.verified}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-colors"
            >
              {loading ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <p className="font-semibold mb-1">Processing Timeline</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Bank Transfer: 2-3 business days</li>
              <li>UPI: Instant (if available)</li>
              <li>Weekends & holidays may delay processing</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
