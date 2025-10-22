import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useCurrencyStore } from '../../../stores/useCurrencyStore';
import { RefreshCw } from 'lucide-react';

const CurrencySettings: React.FC = () => {
  const { rates, loading, error, fetchRates, updateRates } = useCurrencyStore();
  const [formData, setFormData] = useState({
    THB_USD: '',
    THB_MMK: '',
    USD_MMK: '',
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch rates from database on component mount
    fetchRates();
  }, [fetchRates]);

  useEffect(() => {
    // Update form data when rates change
    setFormData({
      THB_USD: rates?.THB_USD?.toString() ?? '',
      THB_MMK: rates?.THB_MMK?.toString() ?? '',
      USD_MMK: rates?.USD_MMK?.toString() ?? '',
    });
  }, [rates]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    setFormError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const newRates = {
        THB_USD: parseFloat(formData.THB_USD),
        THB_MMK: parseFloat(formData.THB_MMK),
        USD_MMK: parseFloat(formData.USD_MMK),
      };

      // Validation
      if (Object.values(newRates).some(rate => isNaN(rate))) {
        throw new Error('Please enter valid numbers for all exchange rates');
      }

      if (Object.values(newRates).some(rate => rate <= 0)) {
        throw new Error('Exchange rates must be greater than 0');
      }

      // Additional validation for reasonable rates
      if (newRates.THB_USD > 1 || newRates.THB_USD < 0.001) {
        throw new Error('THB to USD rate seems unrealistic (should be between 0.001 and 1)');
      }

      if (newRates.THB_MMK > 10000 || newRates.THB_MMK < 1) {
        throw new Error('THB to MMK rate seems unrealistic (should be between 1 and 10,000)');
      }

      if (newRates.USD_MMK > 100000 || newRates.USD_MMK < 100) {
        throw new Error('USD to MMK rate seems unrealistic (should be between 100 and 100,000)');
      }

      await updateRates(newRates);
      setSuccessMessage('Exchange rates updated successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    await fetchRates();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Currency Exchange Rates</CardTitle>
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !saving && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading exchange rates...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              <strong>Database Error:</strong> {error}
            </div>
          )}
          
          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              <strong>Validation Error:</strong> {formError}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
              <strong>Success:</strong> {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="THB to USD Rate"
              name="THB_USD"
              type="number"
              step="0.0001"
              min="0"
              value={formData.THB_USD}
              onChange={handleInputChange}
              helperText="1 THB = ? USD (e.g., 0.028)"
              required
              fullWidth
              disabled={loading}
            />

            <Input
              label="THB to MMK Rate"
              name="THB_MMK"
              type="number"
              step="0.01"
              min="0"
              value={formData.THB_MMK}
              onChange={handleInputChange}
              helperText="1 THB = ? MMK (e.g., 136)"
              required
              fullWidth
              disabled={loading}
            />

            <Input
              label="USD to MMK Rate"
              name="USD_MMK"
              type="number"
              step="0.01"
              min="0"
              value={formData.USD_MMK}
              onChange={handleInputChange}
              helperText="1 USD = ? MMK (e.g., 3300)"
              required
              fullWidth
              disabled={loading}
            />
          </div>

          {/* Current Rates Display */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Current Exchange Rates</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">1 THB =</span>
                <span className="font-medium">${rates.THB_USD?.toFixed(4) || '0.0000'} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">1 THB =</span>
                <span className="font-medium">{rates.THB_MMK?.toFixed(2) || '0.00'} MMK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">1 USD =</span>
                <span className="font-medium">{rates.USD_MMK?.toFixed(2) || '0.00'} MMK</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              disabled={loading || saving}
            >
              {saving ? 'Updating Exchange Rates...' : 'Update Exchange Rates'}
            </Button>
          </div>
        </form>

        {/* Last Updated Info */}
        <div className="mt-4 text-xs text-gray-500">
          <p>
            <strong>Note:</strong> Exchange rates are now stored in the database and will be available across all sessions.
            These rates are used throughout the application for currency conversions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencySettings;

