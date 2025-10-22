import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import TwoFactorAuth from '../../../components/admin/TwoFactorAuth';
import { Shield, Key, Users, Clock, AlertTriangle } from 'lucide-react';

const SecuritySettings: React.FC = () => {
  const { user } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleTwoFactorStatusChange = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account security and authentication settings
        </p>
      </div>

      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${twoFactorEnabled ? 'bg-green-100' : 'bg-red-100'}`}>
                <Key className={`h-5 w-5 ${twoFactorEnabled ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="font-medium">Two-Factor Auth</p>
                <p className={`text-sm ${twoFactorEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Admin Role</p>
                <p className="text-sm text-blue-600">Active</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-green-100">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Session</p>
                <p className="text-sm text-green-600">Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      {user && (
        <TwoFactorAuth 
          userId={user.id} 
          onStatusChange={handleTwoFactorStatusChange}
        />
      )}

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className={`mt-1 w-2 h-2 rounded-full ${twoFactorEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <p className="font-medium">Enable Two-Factor Authentication</p>
                <p className="text-sm text-gray-600">
                  {twoFactorEnabled 
                    ? 'Great! Your account is protected with 2FA.' 
                    : 'Add an extra layer of security to your admin account.'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-1 w-2 h-2 rounded-full bg-green-500"></div>
              <div>
                <p className="font-medium">Use Strong Passwords</p>
                <p className="text-sm text-gray-600">
                  Your password should be at least 12 characters long and include a mix of letters, numbers, and symbols.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-1 w-2 h-2 rounded-full bg-green-500"></div>
              <div>
                <p className="font-medium">Regular Security Reviews</p>
                <p className="text-sm text-gray-600">
                  Review your security settings and active sessions regularly.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-1 w-2 h-2 rounded-full bg-yellow-500"></div>
              <div>
                <p className="font-medium">Backup Recovery Codes</p>
                <p className="text-sm text-gray-600">
                  Keep your 2FA backup codes in a secure location separate from your device.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Current Session</p>
                  <p className="text-sm text-gray-600">
                    {new Date().toLocaleDateString()} • {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser'}
                  </p>
                </div>
              </div>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;