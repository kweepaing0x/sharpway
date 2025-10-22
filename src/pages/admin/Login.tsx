import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ShoppingBag, Shield, Smartphone } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, verifyMfaCode, is2FARequired, isSuperAdmin, signOut, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/admin';

  useEffect(() => {
    console.log('Login: Component mounted or isSuperAdmin changed. Current isSuperAdmin:', isSuperAdmin);
    console.log('Login: Current authLoading:', authLoading);
    // If not loading and isSuperAdmin is true, navigate to admin dashboard
    if (!authLoading && isSuperAdmin) {
      console.log('Login: isSuperAdmin is true, navigating to:', from);
      navigate(from, { replace: true });
    }
  }, [isSuperAdmin, authLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setLoading(true);
    console.log('Login: handleSubmit called. Attempting sign-in for:', email);

    try {
      const { error: signInError, userRole } = await signIn(email, password); // Capture userRole

      if (signInError) {
        console.error('Login: Sign-in error:', signInError);
        throw signInError;
      }

      console.log('Login: Sign-in successful. Checking userRole from signIn response:', userRole);
      // Use the userRole returned directly from the signIn function
      if (userRole !== 'superadmin') {
        console.log('Login: User is NOT superadmin based on signIn response. Signing out.');
        await signOut();
        setError('Access Denied: Only superadmins can access this portal.');
        return;
      }

      if (!is2FARequired) {
        console.log('Login: is2FARequired is false, navigating to:', from);
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
      console.log('Login: handleSubmit finished. Final isSuperAdmin (from state):', isSuperAdmin);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    console.log('Login: handleVerify2FA called. Attempting 2FA verification.');

    try {
      const { error: verifyError } = await verifyMfaCode(twoFACode);

      if (verifyError) {
        console.error('Login: 2FA verification error:', verifyError);
        throw verifyError;
      }

      console.log('Login: 2FA verification successful. Checking isSuperAdmin (from state):', isSuperAdmin);
      // After successful 2FA verification, re-check if the user is a superadmin
      // This is important because the AuthContext might have updated after 2FA
      if (!isSuperAdmin) {
        console.log('Login: User is NOT superadmin after 2FA. Signing out.');
        await signOut();
        setError('Access Denied: Only superadmins can access this portal.');
        return;
      }

      navigate(from, { replace: true });
    } catch (error: any) {
      setError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
      console.log('Login: handleVerify2FA finished. Final isSuperAdmin (from state):', isSuperAdmin);
    }
  };

  if (authLoading) {
    console.log('Login: AuthContext is still loading...');
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <p className="text-gray-600">Loading authentication state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-full">
            <ShoppingBag className="h-12 w-12 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Mall Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {is2FARequired
            ? 'Enter your two-factor authentication code'
            : 'Sign in to manage your mall\'s stores and products'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {!is2FARequired ? (
            // Email, Password Form
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={loading}
                disabled={!email || !password}
              >
                Sign in
              </Button>
            </form>
          ) : (
            // Two-Factor Authentication Form
            <form className="space-y-6" onSubmit={handleVerify2FA}>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Authentication Code"
                  type="text"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  fullWidth
                  className="text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                  autoComplete="one-time-code"
                />

                <div className="flex items-center text-sm text-gray-600">
                  <Smartphone className="h-4 w-4 mr-2" />
                  <span>Open your authenticator app to get the code</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={loading}
                  disabled={twoFACode.length !== 6}
                >
                  Verify Code
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setTwoFACode('');
                    setError(null);
                    window.location.reload();
                  }}
                >
                  Back to Login
                </Button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Having trouble? Contact your system administrator for help.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;


