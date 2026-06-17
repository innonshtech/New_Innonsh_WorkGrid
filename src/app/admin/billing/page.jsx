'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export default function BillingDashboard() {
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const res = await fetch('/api/v1/admin/billing');
      const data = await res.json();
      if (data.success) {
        setBillingData(data);
      } else {
        setError(data.error?.message || 'Failed to fetch billing details');
      }
    } catch (err) {
      setError('Network error loading billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planTier) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/v1/admin/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier })
      });
      const data = await res.json();
      
      if (data.success && data.checkout_url) {
        // Redirect to Razorpay checkout page
        window.location.href = data.checkout_url;
      } else {
        alert(data.error?.message || 'Failed to initiate checkout');
      }
    } catch (err) {
      alert('Error connecting to payment gateway');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading billing data...</div>;
  if (error) return <div className="p-8 text-red-500 bg-red-50 rounded-lg">{error}</div>;
  if (!billingData) return null;

  const { subscription, limits } = billingData;
  const isTrial = subscription.plan === 'trial';
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-500">Manage your subscription, view invoices, and upgrade your plan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Current Plan</p>
              <h2 className="text-3xl font-bold text-gray-900 mt-1 capitalize">{subscription.plan}</h2>
              <div className="mt-2 flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                  subscription.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {subscription.status.toUpperCase()}
                </span>
                {subscription.currentPeriodEnd && (
                  <span className="text-sm text-gray-500">
                    {isTrial ? 'Expires on' : 'Renews on'} {formatDate(subscription.currentPeriodEnd)}
                  </span>
                )}
              </div>
            </div>
            {isTrial && (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-start max-w-xs">
                <AlertTriangle className="text-orange-500 h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-orange-800">
                  Your trial is active. Upgrade to a paid plan to prevent service interruption.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Limits & Usage</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Employee Capacity</span>
                <span className="text-gray-500">Limit: {limits.maxEmployees >= 999999 ? 'Unlimited' : limits.maxEmployees}</span>
              </div>
              {/* Note: Actual usage progress bar would be calculated here */}
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Actions */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl text-white p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Ready to Upgrade?</h3>
            <p className="text-indigo-100 text-sm mb-6">
              Unlock recruitment, finance modules, and support for more employees.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-sm"><CheckCircle className="h-4 w-4 mr-2 text-indigo-300" /> Starter: ₹999/mo</li>
              <li className="flex items-center text-sm"><CheckCircle className="h-4 w-4 mr-2 text-indigo-300" /> Growth: ₹2,999/mo</li>
              <li className="flex items-center text-sm"><CheckCircle className="h-4 w-4 mr-2 text-indigo-300" /> Enterprise: ₹9,999/mo</li>
            </ul>
          </div>
          <button 
            onClick={() => handleUpgrade('growth')}
            disabled={processing}
            className="w-full py-3 px-4 bg-white text-indigo-700 font-bold rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Upgrade to Growth'}
          </button>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Invoice History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(!subscription.invoices || subscription.invoices.length === 0) ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No invoice history available.
                  </td>
                </tr>
              ) : (
                subscription.invoices.map((inv, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(inv.paidAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{inv.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Paid
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 hover:text-indigo-900">
                      <a href={inv.invoiceUrl || '#'} className="flex items-center" target="_blank" rel="noopener noreferrer">
                        Download <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
