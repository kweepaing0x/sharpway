import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { Globe, LayoutGrid, CreditCard, Link as LinkIcon } from 'lucide-react';
import { useAppSettingsStore } from '../../../stores/useAppSettingsStore';
import Input from '../../../components/ui/Input';

const WebsiteSettings: React.FC = () => {
  const { homePageMode, setHomePageMode, contactLink, setContactLink } = useAppSettingsStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [contactLinkValue, setContactLinkValue] = useState(contactLink);

  const handleHomePageModeChange = (newMode: 'stores' | 'marketing') => {
    setHomePageMode(newMode);
    showSuccessMessage();
  };

  const handleContactLinkSave = () => {
    setLoading(true);
    
    try {
      setContactLink(contactLinkValue);
      showSuccessMessage();
    } catch (error) {
      console.error('Error updating contact link:', error);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Homepage Display Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md animate-in fade-in duration-200">
              Settings updated successfully!
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium mb-3">Homepage Display Mode</h3>
            <p className="text-sm text-gray-500 mb-4">
              Choose how the homepage appears to visitors
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Store List Mode */}
              <div 
                className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${homePageMode === 'stores' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'}
                `}
                onClick={() => handleHomePageModeChange('stores')}
              >
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-blue-100 mr-3">
                    <LayoutGrid className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Store Directory</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Show a list of all active stores. Visitors can browse and search stores directly.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Marketing Mode */}
              <div 
                className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${homePageMode === 'marketing' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'}
                `}
                onClick={() => handleHomePageModeChange('marketing')}
              >
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-blue-100 mr-3">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Marketing Landing Page</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Show a promotional page about the mall management system with features and benefits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LinkIcon className="h-5 w-5 mr-2" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-3">Contact Link</h3>
            <p className="text-sm text-gray-500 mb-4">
              Set the contact link for the "Contact US" button on the marketing homepage
            </p>

            <div className="flex items-end gap-4">
              <Input
                label="Telegram Link"
                value={contactLinkValue}
                onChange={(e) => setContactLinkValue(e.target.value)}
                fullWidth
              />
              
              <Button
                variant="primary"
                onClick={handleContactLinkSave}
                isLoading={loading}
              >
                Save Link
              </Button>
            </div>
            
            <p className="mt-2 text-sm text-gray-500">
              Current link: <a href={contactLink.startsWith('http') ? contactLink : `https://${contactLink}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{contactLink}</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteSettings;