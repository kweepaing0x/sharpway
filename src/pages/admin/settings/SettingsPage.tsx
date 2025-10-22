import React, { useState, lazy, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Bell, CreditCard, Globe, Lock, Mail, Shield, Clock } from 'lucide-react';

// Lazy load settings components
const CurrencySettings = lazy(() => import('./CurrencySettings'));
const WebsiteSettings = lazy(() => import('./WebsiteSettings'));
const TimeZoneSettings = lazy(() => import('./TimeZoneSettings'));
const SecuritySettings = lazy(() => import('./SecuritySettings'));

// Loading component for Suspense
const SettingsSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'MyMall',
    siteDescription: 'Your one-stop shopping destination',
    supportEmail: 'support@mymall.com',
    timezone: 'UTC+0',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    orderUpdates: true,
    marketingEmails: false,
    securityAlerts: true,
  });

  const handleGeneralSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationToggle = (setting: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    // Here you would implement the actual settings save logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'website', label: 'Website', icon: Globe },
    { id: 'timezone', label: 'Time Zone', icon: Clock },
    { id: 'currency', label: 'Currency', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your mall's settings and preferences
        </p>
      </div>

      {/* Settings Navigation */}
      <div className="mb-6">
        <nav className="flex flex-wrap gap-2" aria-label="Settings navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center px-3 py-2 text-sm font-medium rounded-md
                ${activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Site Name"
              name="siteName"
              value={generalSettings.siteName}
              onChange={handleGeneralSettingsChange}
              fullWidth
            />
            <Input
              label="Site Description"
              name="siteDescription"
              value={generalSettings.siteDescription}
              onChange={handleGeneralSettingsChange}
              fullWidth
            />
            <Input
              label="Support Email"
              name="supportEmail"
              type="email"
              value={generalSettings.supportEmail}
              onChange={handleGeneralSettingsChange}
              fullWidth
            />
            <Input
              label="Timezone"
              name="timezone"
              value={generalSettings.timezone}
              onChange={handleGeneralSettingsChange}
              fullWidth
            />
            <div className="pt-4">
              <Button
                variant="primary"
                onClick={handleSaveSettings}
                isLoading={loading}
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Website Settings */}
      {activeTab === 'website' && (
        <Suspense fallback={<SettingsSkeleton />}>
          <WebsiteSettings />
        </Suspense>
      )}

      {/* Time Zone Settings */}
      {activeTab === 'timezone' && (
        <Suspense fallback={<SettingsSkeleton />}>
          <TimeZoneSettings />
        </Suspense>
      )}

      {/* Currency Settings */}
      {activeTab === 'currency' && (
        <Suspense fallback={<SettingsSkeleton />}>
          <CurrencySettings />
        </Suspense>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries({
                emailNotifications: 'Email Notifications',
                pushNotifications: 'Push Notifications',
                orderUpdates: 'Order Updates',
                marketingEmails: 'Marketing Emails',
                securityAlerts: 'Security Alerts',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notificationSettings[key as keyof typeof notificationSettings]}
                      onChange={() => handleNotificationToggle(key)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
              <div className="pt-4">
                <Button
                  variant="primary"
                  onClick={handleSaveSettings}
                  isLoading={loading}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <Suspense fallback={<SettingsSkeleton />}>
          <SecuritySettings />
        </Suspense>
      )}
    </div>
  );
};

export default SettingsPage;