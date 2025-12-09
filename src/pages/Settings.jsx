import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Modal } from '../components/common';
import {
  Bell,
  Globe,
  Palette,
  Clock,
  Mail,
  MessageSquare,
  Shield,
  Database,
  HelpCircle,
  FileText,
  Download,
  Upload,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { isAdmin } = useAuth();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    membershipAlerts: true,
    paymentReminders: true,
    appointmentReminders: true,
    marketingEmails: false,

    // General
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',

    // Appearance
    theme: 'light',
    compactMode: false,
    sidebarPosition: 'left',

    // Privacy
    showOnlineStatus: true,
    allowAnalytics: true,
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const SettingToggle = ({ label, description, settingKey, icon: Icon }) => (
    <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Icon className="w-5 h-5 text-primary-500" />
          </div>
        )}
        <div>
          <h4 className="font-medium text-dark-800">{label}</h4>
          {description && <p className="text-sm text-dark-500">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => handleToggle(settingKey)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          settings[settingKey] ? 'bg-primary-500' : 'bg-dark-300'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            settings[settingKey] ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <Layout title="Settings" subtitle="Manage your application preferences">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notification Settings */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Bell className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-dark-800">Notifications</h3>
            </div>
            <div className="space-y-4">
              <SettingToggle
                label="Email Notifications"
                description="Receive notifications via email"
                settingKey="emailNotifications"
                icon={Mail}
              />
              <SettingToggle
                label="SMS Notifications"
                description="Receive notifications via SMS"
                settingKey="smsNotifications"
                icon={MessageSquare}
              />
              <SettingToggle
                label="Push Notifications"
                description="Receive browser push notifications"
                settingKey="pushNotifications"
                icon={Bell}
              />
              <SettingToggle
                label="Membership Alerts"
                description="Alerts for expiring memberships"
                settingKey="membershipAlerts"
              />
              <SettingToggle
                label="Payment Reminders"
                description="Reminders for pending payments"
                settingKey="paymentReminders"
              />
              <SettingToggle
                label="Appointment Reminders"
                description="Reminders for upcoming appointments"
                settingKey="appointmentReminders"
              />
              {isAdmin && (
                <SettingToggle
                  label="Marketing Emails"
                  description="Receive promotional emails and updates"
                  settingKey="marketingEmails"
                />
              )}
            </div>
          </div>

          {/* General Settings */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-success-100 rounded-lg">
                <Globe className="w-5 h-5 text-success-600" />
              </div>
              <h3 className="text-lg font-semibold text-dark-800">General</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="input"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>
              <div>
                <label className="label">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="input"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>
              <div>
                <label className="label">Date Format</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                  className="input"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="label">Time Format</label>
                <select
                  value={settings.timeFormat}
                  onChange={(e) => handleChange('timeFormat', e.target.value)}
                  className="input"
                >
                  <option value="12h">12-hour (AM/PM)</option>
                  <option value="24h">24-hour</option>
                </select>
              </div>
              {isAdmin && (
                <div>
                  <label className="label">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="input"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent-100 rounded-lg">
                <Palette className="w-5 h-5 text-accent-600" />
              </div>
              <h3 className="text-lg font-semibold text-dark-800">Appearance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Theme</label>
                <div className="flex gap-3">
                  {['light', 'dark', 'system'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => handleChange('theme', theme)}
                      className={`flex-1 p-3 rounded-xl border-2 transition-colors ${
                        settings.theme === theme
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-dark-200 hover:border-primary-300'
                      }`}
                    >
                      <span className="capitalize font-medium text-dark-800">{theme}</span>
                    </button>
                  ))}
                </div>
              </div>
              <SettingToggle
                label="Compact Mode"
                description="Use compact layout for dense information"
                settingKey="compactMode"
              />
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Shield className="w-5 h-5 text-warning-600" />
              </div>
              <h3 className="text-lg font-semibold text-dark-800">Privacy</h3>
            </div>
            <div className="space-y-4">
              <SettingToggle
                label="Show Online Status"
                description="Let others see when you're online"
                settingKey="showOnlineStatus"
              />
              <SettingToggle
                label="Allow Analytics"
                description="Help us improve by sending anonymous usage data"
                settingKey="allowAnalytics"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn-primary flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Default
              </button>
            </div>
          </div>

          {/* Data Management - Admin Only */}
          {isAdmin && (
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-dark-500" />
                <h3 className="text-lg font-semibold text-dark-800">Data Management</h3>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setShowExportModal(true)}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
                <button className="w-full btn-secondary flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  Import Data
                </button>
              </div>
            </div>
          )}

          {/* Help & Support */}
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Help & Support</h3>
            <div className="space-y-3">
              <a
                href="#"
                className="flex items-center gap-3 p-3 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="font-medium text-dark-800">Help Center</p>
                  <p className="text-sm text-dark-500">Get help and support</p>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 p-3 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors"
              >
                <FileText className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="font-medium text-dark-800">Documentation</p>
                  <p className="text-sm text-dark-500">Read the docs</p>
                </div>
              </a>
            </div>
          </div>

          {/* App Info */}
          <div className="card bg-dark-50">
            <p className="text-sm text-dark-500 text-center">
              FitPro Gym Management
              <br />
              Version 1.0.0
              <br />
              <span className="text-xs">© 2025 All rights reserved</span>
            </p>
          </div>
        </div>
      </div>

      {/* Reset Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Settings"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="w-8 h-8 text-warning-600" />
          </div>
          <p className="text-dark-600 mb-6">
            Are you sure you want to reset all settings to their default values? This action cannot
            be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowResetModal(false)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Reset logic here
                setShowResetModal(false);
              }}
              className="flex-1 btn-primary bg-warning-500 hover:bg-warning-600"
            >
              Reset Settings
            </button>
          </div>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Data"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-dark-600">
            Select the data you want to export. The export will be downloaded as a CSV file.
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-dark-50 rounded-xl cursor-pointer hover:bg-dark-100">
              <input type="checkbox" className="w-4 h-4 rounded text-primary-500" defaultChecked />
              <span className="font-medium text-dark-800">Members</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-dark-50 rounded-xl cursor-pointer hover:bg-dark-100">
              <input type="checkbox" className="w-4 h-4 rounded text-primary-500" defaultChecked />
              <span className="font-medium text-dark-800">Payments</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-dark-50 rounded-xl cursor-pointer hover:bg-dark-100">
              <input type="checkbox" className="w-4 h-4 rounded text-primary-500" defaultChecked />
              <span className="font-medium text-dark-800">Appointments</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-dark-50 rounded-xl cursor-pointer hover:bg-dark-100">
              <input type="checkbox" className="w-4 h-4 rounded text-primary-500" />
              <span className="font-medium text-dark-800">Expenses</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowExportModal(false)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button className="flex-1 btn-primary flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Settings;
