import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface BankDetails {
  bank_account_holder?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  upi_id?: string;
  bank_verified?: boolean;
  bank_verified_at?: string;
}

interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function BankAccountModal({ isOpen, onClose, onSave }: BankAccountModalProps) {
  const [formData, setFormData] = useState<BankDetails>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bankMethod, setBankMethod] = useState<'bank' | 'upi'>('bank');

  useEffect(() => {
    if (isOpen) {
      fetchBankDetails();
    }
  }, [isOpen]);

  const fetchBankDetails = async () => {
    try {
      const wallet = await api.farmer.getWallet();
      if (wallet) {
        setFormData({
          bank_account_holder: wallet.bank_account_holder || '',
          bank_name: wallet.bank_name || '',
          bank_account_number: wallet.bank_account_number || '',
          bank_ifsc_code: wallet.bank_ifsc_code || '',
          upi_id: wallet.upi_id || '',
          bank_verified: wallet.bank_verified,
          bank_verified_at: wallet.bank_verified_at,
        });
      }
    } catch (err) {
      console.error('Failed to fetch bank details:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.farmer.updateBankDetails(formData);
      setSuccess(true);
      setTimeout(() => {
        onSave?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 border-b">
          <h2 className="text-2xl font-bold">Bank Account Details</h2>
          <p className="text-green-100 text-sm mt-1">Add or update your bank information for payments</p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status */}
          {formData.bank_verified && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="text-green-600">✓</div>
              <div>
                <p className="font-semibold text-green-900">Bank Account Verified</p>
                <p className="text-sm text-green-700">
                  Verified on {new Date(formData.bank_verified_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Bank details saved successfully!
            </div>
          )}

          {/* Bank Method Tabs */}
          <div className="flex gap-4 border-b">
            <button
              type="button"
              onClick={() => setBankMethod('bank')}
              className={`pb-3 px-4 font-semibold border-b-2 transition-colors ${
                bankMethod === 'bank'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Bank Transfer
            </button>
            <button
              type="button"
              onClick={() => setBankMethod('upi')}
              className={`pb-3 px-4 font-semibold border-b-2 transition-colors ${
                bankMethod === 'upi'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              UPI
            </button>
          </div>

          {/* Bank Transfer Form */}
          {bankMethod === 'bank' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  name="bank_account_holder"
                  value={formData.bank_account_holder || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Name as per bank account"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., HDFC Bank"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    name="bank_account_number"
                    value={formData.bank_account_number || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Account number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    name="bank_ifsc_code"
                    value={formData.bank_ifsc_code || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., HDFC0001234"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <p className="font-semibold mb-1">Safe & Secure</p>
                <p>Your bank details are encrypted and stored securely. They will only be used for payments.</p>
              </div>
            </div>
          )}

          {/* UPI Form */}
          {bankMethod === 'upi' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  UPI ID *
                </label>
                <input
                  type="text"
                  name="upi_id"
                  value={formData.upi_id || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., yourname@upi"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <p className="font-semibold mb-1">UPI Tips</p>
                <p>Make sure your UPI ID is active and registered with your bank.</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-colors"
            >
              {loading ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
