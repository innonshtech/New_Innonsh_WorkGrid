'use client';

import { useState, useEffect } from 'react';
import {
  Mail, Bell, Settings, Save, Loader2, RefreshCw,
  AlertTriangle, CheckCircle, Info, Shield, Package,
  Server, Lock, Send, Eye, EyeOff
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    attendanceReportEmail: '',
    attendanceThresholdEmail: '',
    documentReminderEmail: '',
    cronSecret: '',
    enableCron: true,
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCronSecret, setShowCronSecret] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/employee/notification-settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
      } else {
        toast.error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const response = await fetch('/api/v1/employee/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const testEmail = async (emailType) => {
    try {
      setTestEmailLoading(true);

      const response = await fetch('/api/v1/employee/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailType }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Test email sent successfully');
      } else {
        toast.error(data.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Error sending test email');
    } finally {
      setTestEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Loading Notification Settings</h3>
              <p className="text-sm text-slate-600 mt-1">Please wait while we fetch configuration data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Notification Settings</h1>
                <p className="text-slate-600 text-sm mt-0.5">Configure email notifications and system settings</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={fetchSettings}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border-2 border-slate-200 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Settings */}
          <div className="bg-white rounded-xl border-2 border-slate-200">
            <div className="p-6 border-b-2 border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Email Recipients</h2>
                  <p className="text-sm text-slate-600 mt-0.5">Configure email addresses for different types of notifications</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Attendance Report Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={settings.attendanceReportEmail}
                    onChange={(e) => handleInputChange('attendanceReportEmail', e.target.value)}
                    className="flex-1 px-4 py-2.5 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="attendance@example.com"
                  />
                  <button
                    type="button"
                    onClick={() => testEmail('attendance-report')}
                    disabled={testEmailLoading}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2 border-2 border-slate-200 font-medium transition-colors"
                  >
                    {testEmailLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Test
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Daily attendance reports will be sent to this email
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Attendance Threshold Alert Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={settings.attendanceThresholdEmail}
                    onChange={(e) => handleInputChange('attendanceThresholdEmail', e.target.value)}
                    className="flex-1 px-4 py-2.5 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="alerts@example.com"
                  />
                  <button
                    type="button"
                    onClick={() => testEmail('threshold-alert')}
                    disabled={testEmailLoading}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2 border-2 border-slate-200 font-medium transition-colors"
                  >
                    {testEmailLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Test
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Threshold exceeded alerts will be sent to this email
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Document Reminder Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={settings.documentReminderEmail}
                    onChange={(e) => handleInputChange('documentReminderEmail', e.target.value)}
                    className="flex-1 px-4 py-2.5 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="hr@example.com"
                  />
                  <button
                    type="button"
                    onClick={() => testEmail('document-reminder')}
                    disabled={testEmailLoading}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2 border-2 border-slate-200 font-medium transition-colors"
                  >
                    {testEmailLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Test
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Document submission reminders will be sent to this email
                </p>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-xl border-2 border-slate-200">
            <div className="p-6 border-b-2 border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Server className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">System Settings</h2>
                  <p className="text-sm text-slate-600 mt-0.5">Configure system-wide notification settings</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Cron Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showCronSecret ? "text" : "password"}
                    value={settings.cronSecret}
                    onChange={(e) => handleInputChange('cronSecret', e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="your-secret-key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCronSecret(!showCronSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCronSecret ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Secret key for cron job authentication
                </p>
              </div>

              <div className="flex items-center p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
                <input
                  type="checkbox"
                  id="enableCron"
                  checked={settings.enableCron}
                  onChange={(e) => handleInputChange('enableCron', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <label htmlFor="enableCron" className="ml-3 text-sm font-medium text-slate-700">
                  Enable automated cron jobs
                </label>
              </div>
            </div>
          </div>

          {/* SMTP Settings */}
          <div className="bg-white rounded-xl border-2 border-slate-200">
            <div className="p-6 border-b-2 border-slate-200 bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">SMTP Configuration</h2>
                  <p className="text-sm text-slate-600 mt-0.5">Configure email server settings for sending notifications</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => handleInputChange('smtpPort', e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="587"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={settings.smtpUser}
                  onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="your-email@gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  SMTP Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={settings.smtpPass}
                    onChange={(e) => handleInputChange('smtpPass', e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="your-app-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Use app password for Gmail accounts
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-orange-500 hover:from-indigo-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all hover: disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900 mb-3">Notification Types</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Attendance Reports:</span>
                    <span className="text-sm text-slate-700"> Daily summary sent automatically</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Threshold Alerts:</span>
                    <span className="text-sm text-slate-700"> Immediate notification when limits exceeded</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Bell className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Document Reminders:</span>
                    <span className="text-sm text-slate-700"> Scheduled reminders for missing documents</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}