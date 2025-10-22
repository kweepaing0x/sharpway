import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { CheckCircle, ShoppingBag, ArrowLeft } from 'lucide-react';

const SuccessPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Get the store username from localStorage
    const storeUsername = localStorage.getItem('storeUsername');

    // Auto-redirect back to the store page after 10 seconds
    const timer = setTimeout(() => {
      if (storeUsername) {
        navigate(`/${storeUsername}`, { replace: true });
        // Clean up localStorage after navigation
        localStorage.removeItem('storeUsername');
      } else {
        // If no store username is found, navigate to the homepage
        navigate('/', { replace: true });
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleReturnToStore = () => {
    const storeUsername = localStorage.getItem('storeUsername');
    if (storeUsername) {
      navigate(`/${storeUsername}`, { replace: true });
      localStorage.removeItem('storeUsername');
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-theme-primary to-purple-50 dark:from-blue-900/20 dark:via-theme-primary dark:to-purple-900/20 flex items-center justify-center p-4">
      <div className="max-w-lg w-full mx-auto">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardContent className="p-0">
            {/* Success Icon with animated background */}
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 bg-theme-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle className="h-16 w-16 text-green-500 animate-bounce" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  🎉 Success!
                </h2>
                <p className="text-green-100 text-lg">
                  Your order has been sent successfully
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 text-center">
              <p className="text-theme-secondary mb-6 text-lg leading-relaxed">
                We'll notify you on Telegram when your order is confirmed by the store.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700 font-medium">
                  📱 Keep an eye on your Telegram for updates
                </p>
              </div>

              <p className="text-sm text-theme-tertiary mb-8">
                Returning to store page in 10 seconds...
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="primary"
                  onClick={handleReturnToStore}
                  fullWidth
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <ArrowLeft className="h-5 w-5 mr-3" />
                  Return to Store
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={() => navigate('/', { replace: true })}
                  fullWidth
                >
                  <ShoppingBag className="h-5 w-5 mr-3" />
                  Browse More Stores
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuccessPage;