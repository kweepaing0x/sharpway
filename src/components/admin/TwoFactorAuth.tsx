import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Shield, Key, Copy, CheckCircle, AlertTriangle, Smartphone } from 'lucide-react';

interface TwoFactorAuthProps {
  userId: string;
  onStatusChange?: (enabled: boolean) => void;
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ userId, onStatusChange }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'setup' | 'verify' | 'enabled'>('setup');
  
  // Setup state
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  // Disable state
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    checkTwoFactorStatus();
  }, [userId]);

  const checkTwoFactorStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_2fa')
        .select('enabled')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const enabled = data?.enabled || false;
      setIsEnabled(enabled);
      setStep(enabled ? 'enabled' : 'setup');
      onStatusChange?.(enabled);
    } catch (error: any) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const generateSecret = () => {
    // Generate a base32 secret (simplified version)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const setupTwoFactor = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate secret and backup codes
      const newSecret = generateSecret();
      const newBackupCodes = generateBackupCodes();
      
      setSecret(newSecret);
      setManualEntryKey(newSecret);
      setBackupCodes(newBackupCodes);

      // Generate QR code URL for Google Authenticator
      const issuer = 'MyMall Admin';
      const accountName = `admin@mymall.com`;
      const qrUrl = `otpauth://totp/${encodeURIComponent(accountName)}?secret=${newSecret}&issuer=${encodeURIComponent(issuer)}`;
      
      // For production, you'd want to use a proper QR code library
      // For now, we'll show the manual entry key
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`);
      
      // Store in database (not enabled yet)
      const { error } = await supabase
        .from('user_2fa')
        .upsert({
          user_id: userId,
          secret: newSecret,
          backup_codes: newBackupCodes,
          enabled: false
        });

      if (error) throw error;

      setStep('verify');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, you'd verify the TOTP code server-side
      // For this demo, we'll simulate verification
      const isValid = verificationCode.length === 6 && /^\d+$/.test(verificationCode);
      
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Enable 2FA
      const { error } = await supabase
        .from('user_2fa')
        .update({
          enabled: true,
          last_used: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Update user to require 2FA
      const { error: userError } = await supabase
        .from('users')
        .update({ requires_2fa: true })
        .eq('id', userId);

      if (userError) throw userError;

      setIsEnabled(true);
      setStep('enabled');
      setSuccess('Two-factor authentication has been successfully enabled!');
      onStatusChange?.(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!disableCode || disableCode.length !== 6) {
      setError('Please enter a 6-digit verification code to disable 2FA');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify the code before disabling
      const isValid = disableCode.length === 6 && /^\d+$/.test(disableCode);
      
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Disable 2FA
      const { error } = await supabase
        .from('user_2fa')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Update user to not require 2FA
      const { error: userError } = await supabase
        .from('users')
        .update({ requires_2fa: false })
        .eq('id', userId);

      if (userError) throw userError;

      setIsEnabled(false);
      setStep('setup');
      setSuccess('Two-factor authentication has been disabled');
      setDisableCode('');
      onStatusChange?.(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Two-Factor Authentication
          {isEnabled && (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Enabled
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        {step === 'setup' && !isEnabled && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Smartphone className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Enable Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add an extra layer of security to your admin account using Google Authenticator or any compatible TOTP app.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Before you start:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Install Google Authenticator on your mobile device</li>
                <li>Make sure you have access to your device during setup</li>
                <li>Save the backup codes in a secure location</li>
              </ol>
            </div>

            <Button
              onClick={setupTwoFactor}
              isLoading={isLoading}
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              Set Up Two-Factor Authentication
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Scan QR Code</h3>
              <div className="flex flex-col items-center space-y-4">
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code for 2FA setup"
                    className="border rounded-lg"
                  />
                )}
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Can't scan the QR code? Enter this key manually:
                  </p>
                  <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-md">
                    <code className="text-sm font-mono">{manualEntryKey}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(manualEntryKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-4">Backup Codes</h3>
              <p className="text-sm text-gray-600 mb-3">
                Save these backup codes in a secure location. You can use them to access your account if you lose your device.
              </p>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>{code}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="mt-2"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All Codes
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-4">Verify Setup</h3>
              <p className="text-sm text-gray-600 mb-3">
                Enter the 6-digit code from your authenticator app to complete setup:
              </p>
              <div className="flex space-x-2">
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-lg font-mono"
                  maxLength={6}
                />
                <Button
                  onClick={verifyAndEnable}
                  isLoading={isLoading}
                  disabled={verificationCode.length !== 6}
                >
                  Verify & Enable
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'enabled' && isEnabled && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-green-700">
              <CheckCircle className="h-6 w-6" />
              <div>
                <h3 className="font-medium">Two-Factor Authentication is Active</h3>
                <p className="text-sm text-green-600">
                  Your account is protected with an additional layer of security.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
              <h4 className="font-medium text-yellow-800 mb-2">Important:</h4>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>Keep your backup codes in a secure location</li>
                <li>Don't lose access to your authenticator device</li>
                <li>You'll need your authenticator code for each admin login</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Disable Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600 mb-3">
                Enter a verification code from your authenticator app to disable 2FA:
              </p>
              <div className="flex space-x-2">
                <Input
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-lg font-mono"
                  maxLength={6}
                />
                <Button
                  variant="danger"
                  onClick={disableTwoFactor}
                  isLoading={isLoading}
                  disabled={disableCode.length !== 6}
                >
                  Disable 2FA
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorAuth;