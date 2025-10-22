import React, { useState, useEffect } from 'react';
import { useAppSettingsStore } from '../../stores/useAppSettingsStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Search, Globe, BarChart3, Eye, EyeOff, Save } from 'lucide-react';

const GoogleIndexingSettings: React.FC = () => {
  const { settings, loading, error, fetchSettings, updateSettings } = useAppSettingsStore();
  const [formData, setFormData] = useState({
    enable_google_indexing: true,
    indexed_pages: ['home', 'store'] as ('home' | 'store')[],
    google_analytics_measurement_id: ''
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        enable_google_indexing: settings.enable_google_indexing || true,
        indexed_pages: settings.indexed_pages || ['home', 'store'],
        google_analytics_measurement_id: settings.google_analytics_measurement_id || ''
      });
    }
  }, [settings]);

  const handleToggleIndexing = () => {
    setFormData(prev => ({
      ...prev,
      enable_google_indexing: !prev.enable_google_indexing
    }));
  };

  const handlePageToggle = (page: 'home' | 'store') => {
    setFormData(prev => ({
      ...prev,
      indexed_pages: prev.indexed_pages.includes(page)
        ? prev.indexed_pages.filter(p => p !== page)
        : [...prev.indexed_pages, page]
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);

    try {
      await updateSettings({
        enable_google_indexing: formData.enable_google_indexing,
        indexed_pages: formData.indexed_pages,
        google_analytics_measurement_id: formData.google_analytics_measurement_id.trim() || null
      });
      
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error updating settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Google Indexing & Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Control how Google indexes your site and configure Google Analytics tracking.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global Indexing Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Google Indexing Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  formData.enable_google_indexing 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {formData.enable_google_indexing ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {formData.enable_google_indexing ? 'Indexing Enabled' : 'Indexing Disabled'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formData.enable_google_indexing 
                      ? 'Your site can be indexed by Google search engines'
                      : 'Your site will not be indexed by Google search engines'
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleIndexing}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  formData.enable_google_indexing ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.enable_google_indexing ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {formData.enable_google_indexing && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Select Pages to Index</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.indexed_pages.includes('home')}
                      onChange={() => handlePageToggle('home')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Home Page</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.indexed_pages.includes('store')}
                      onChange={() => handlePageToggle('store')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Store Pages</span>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  Selected pages will be allowed to be indexed by Google. Unselected pages will have "noindex" meta tags.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Google Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Google Analytics Measurement ID"
              name="google_analytics_measurement_id"
              type="text"
              value={formData.google_analytics_measurement_id}
              onChange={handleInputChange}
              placeholder="G-XXXXXXXXXX"
              fullWidth
              helperText="Enter your Google Analytics 4 Measurement ID (e.g., G-XXXXXXXXXX)"
            />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">How to find your Measurement ID:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to Google Analytics (analytics.google.com)</li>
                <li>Select your property</li>
                <li>Click "Admin" in the bottom left</li>
                <li>Under "Property", click "Data Streams"</li>
                <li>Click on your web stream</li>
                <li>Copy the "Measurement ID" (starts with G-)</li>
              </ol>
            </div>

            {formData.google_analytics_measurement_id && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  ✓ Google Analytics will be enabled with ID: <code className="font-mono bg-green-100 px-1 rounded">{formData.google_analytics_measurement_id}</code>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </Button>
        </div>
      </form>

      {/* Current Status Summary */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Indexing Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  settings.enable_google_indexing
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {settings.enable_google_indexing ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Indexed Pages:</span>
                <span className="ml-2 text-gray-600">
                  {(settings.indexed_pages || []).length > 0 ? (settings.indexed_pages || []).join(', ') : 'None'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Analytics:</span>
                <span className="ml-2 text-gray-600">
                  {settings.google_analytics_measurement_id ? 'Configured' : 'Not configured'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(settings.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleIndexingSettings;