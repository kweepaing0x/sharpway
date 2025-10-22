import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useCartStore } from '../../stores/useCartStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ShoppingBag, Clock, Copy, CheckCircle, AlertTriangle, ArrowLeft, MessageCircle } from 'lucide-react';
import MainHeader from '../../components/layout/MainHeader';
import PriceDisplay from '../../components/PriceDisplay';
import PaymentAmount from '../../components/PaymentAmount';
import { generateStoreOrderMessage, openTelegramLink } from '../../utils/telegram';

type PaymentMethod = 'kpay' | 'usdt' | 'cod';

const PAYMENT_METHODS = [
  { id: 'cod', name: 'Cash on Delivery', description: 'Pay when you receive' },
  { id: 'kpay', name: 'KPay', description: 'Pay with KPay' },
  { id: 'usdt', name: 'USDT', description: 'Pay with USDT' }
];

const COUNTDOWN_TIME = 15 * 60; // 15 minutes in seconds

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_TIME);
  const [store, setStore] = useState<any>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    telegramName: '',
    transactionNumber: '',
    shippingAddress: '',
    phoneNumber: '',
    remark: ''
  });

  useEffect(() => {
    // Only navigate to success if an order has been successfully placed
    if (showSuccess) {
      navigate('/success', { replace: true });
      return;
    }

    // If cart is empty and no order was placed or is being processed, redirect to home page
    if (items.length === 0 && !showSuccess && !isProcessingOrder) {
      navigate('/');
      return;
    }

    const fetchStore = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('id', items[0].storeId)
          .single();

        if (error) throw error;
        setStore(data);
      } catch (error) {
        console.error('Error fetching store:', error);
        setError('Failed to load payment information');
      }
    };

    if (items.length > 0) {
      fetchStore();
    }
  }, [items, navigate, showSuccess, isProcessingOrder]);

  useEffect(() => {
    if (!selectedPayment) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedPayment]);

  // Toast auto-hide
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    if (!store?.payment_methods[method]) {
      setError(`${method.toUpperCase()} is not available for this store`);
      return;
    }
    setSelectedPayment(method);
    setTimeLeft(COUNTDOWN_TIME);
    setError(null);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.telegramName.trim()) return 'Telegram name is required';
    if (selectedPayment !== 'cod' && !formData.transactionNumber.trim()) return 'Transaction number is required';
    if (!formData.shippingAddress.trim()) return 'Shipping address is required';
    if (selectedPayment !== 'cod' && formData.transactionNumber.length !== 6) {
      return 'Transaction number must be 6 digits';
    }
    return null;
  };

  const handleBackToStore = () => {
    if (store && store.username) {
      navigate(`/${store.username}`);
    } else {
      navigate('/');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmOrder = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError(null);
    setIsProcessingOrder(true);

    try {
      // Prepare order details for the notification
      const orderDetails = {
        storeId: store.id,
        telegramName: formData.telegramName,
        transactionNumber: formData.transactionNumber,
        shippingAddress: formData.shippingAddress,
        phoneNumber: formData.phoneNumber,
        remark: formData.remark,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: getTotal(),
        paymentMethod: selectedPayment
      };

      // Maximum retry attempts for notification
      const maxRetries = 2;
      let retryCount = 0;
      let notificationSuccess = false;
      let lastError = null;

      while (retryCount <= maxRetries && !notificationSuccess) {
        try {
          // If retrying, add a small delay
          if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
          
          // Send to Telegram notification endpoint
          const notifyResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-order`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(orderDetails),
            }
          );

          const responseData = await notifyResponse.json();

          if (!notifyResponse.ok) {
            lastError = responseData.error || 'Unknown error occurred';
            throw new Error(lastError);
          }
          
          notificationSuccess = true;
        } catch (retryError) {
          lastError = retryError.message;
          console.warn(`Notification attempt ${retryCount + 1} failed:`, lastError);
          retryCount++;
        }
      }

      // Even if notification fails, continue with order process
      if (!notificationSuccess) {
        console.error('All notification attempts failed:', lastError);
      }

      // Save store username to localStorage for the success page to redirect back to
      if (store && store.username) {
        localStorage.setItem('storeUsername', store.username);
      }

      // Show toast notification
      setShowToast(true);
      
      // Show success message
      setShowSuccess(true);
      clearCart();

      // Navigate immediately to success page
      navigate('/success', { replace: true });

    } catch (error: any) {
      console.error('Error processing order:', error);
      setError(`Failed to process order: ${error.message || 'Unknown error'}. Please contact support if the problem persists.`);
    } finally {
      setLoading(false);
      setIsProcessingOrder(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Order Successfully Sent!
              </h2>

              <p className="text-gray-600 mb-6">
                We'll notify you on Telegram when your order is confirmed.
              </p>

              <p className="text-xs text-gray-500 mb-6">
                Redirecting to homepage in 3 seconds...
              </p>

              <Button
                variant="primary"
                onClick={() => navigate('/', { replace: true })}
                fullWidth
                className="bg-green-600 hover:bg-green-700"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-secondary">
      <MainHeader />
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md animate-in fade-in slide-in-from-top duration-300 dark:bg-green-900/20 dark:border-green-400 dark:text-green-300">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Order successfully placed!</span>
          </div>
        </div>
      )}
      
      {/* Back to Store Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Button 
          variant="ghost" 
          onClick={handleBackToStore}
          className="mb-4 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Store
        </Button>
      </div>
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Order Summary */}
            <div className="order-2 md:order-1">
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <CardTitle className="text-2xl font-bold text-theme-primary flex items-center">
                    <ShoppingBag className="h-6 w-6 mr-3 text-blue-600" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 bg-theme-tertiary rounded-lg">
                        <div className="flex-shrink-0 w-16 h-16">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg shadow-sm"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-theme-primary">{item.name}</h3>
                          <p className="text-sm text-theme-secondary">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-blue-600">
                            ฿{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="border-t-2 border-theme pt-6">
                      <div className="flex justify-between text-xl font-bold text-theme-primary">
                        <p>Total</p>
                        <div className="text-2xl font-bold text-blue-600">
                          ฿{getTotal().toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods */}
            <div className="order-1 md:order-2">
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                  <CardTitle className="text-2xl font-bold text-theme-primary flex items-center">
                    <svg className="h-6 w-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {PAYMENT_METHODS.map((method) => (
                      <div
                        key={method.id}
                        className={`
                          relative rounded-lg border p-4 cursor-pointer
                          ${!store?.payment_methods[method.id] && 'opacity-50 cursor-not-allowed'}
                          ${selectedPayment === method.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-theme hover:border-blue-500'
                          }
                        `}
                        onClick={() => handlePaymentMethodSelect(method.id as PaymentMethod)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-theme-primary">
                              {method.name}
                            </h3>
                            <p className="text-sm text-theme-secondary">
                              {method.description}
                            </p>
                            {selectedPayment === method.id && (
                              <p className="text-sm font-medium text-blue-600 mt-1">
                                <PaymentAmount 
                                  amount={getTotal()} 
                                  paymentMethod={method.id as PaymentMethod} 
                                />
                              </p>
                            )}
                            {!store?.payment_methods[method.id] && (
                              <p className="text-xs text-red-500 mt-1">
                                Not available for this store
                              </p>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className={`
                              w-4 h-4 rounded-full border-2
                              ${selectedPayment === method.id
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-theme'
                              }
                            `} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedPayment && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-center space-x-2 text-lg font-medium">
                        <Clock className="h-5 w-5 text-yellow-500" />
                        <span>Time remaining: {formatTime(timeLeft)}</span>
                      </div>

                      <div className="space-y-4">
                        <Input
                          label="Telegram Name"
                          name="telegramName"
                          value={formData.telegramName}
                          onChange={handleInputChange}
                          placeholder="@yourusername"
                          required
                          fullWidth
                        />

                        <Input
                          label="Phone Number (Optional)"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="+95 9xxxxxxxxx"
                          fullWidth
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Shipping Address
                          </label>
                          <textarea
                            name="shippingAddress"
                            value={formData.shippingAddress}
                            onChange={handleInputChange}
                            placeholder="လိပ်စာ အတိအကျ ထည့်ပေးပါ"
                            className="mt-1 block w-full rounded-md border-theme bg-theme-input text-theme-primary placeholder:text-theme-tertiary shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={3}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Remark
                          </label>
                          <textarea
                            name="remark"
                            value={formData.remark}
                            onChange={handleInputChange}
                            placeholder="Additional information or special requests"
                            className="mt-1 block w-full rounded-md border-theme bg-theme-input text-theme-primary placeholder:text-theme-tertiary shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={2}
                          />
                        </div>

                        {selectedPayment !== 'cod' && (
                          <>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                              <h4 className="font-medium">Payment Instructions</h4>
                              <p className="text-sm text-gray-600">
                                Please send exactly <PaymentAmount amount={getTotal()} paymentMethod={selectedPayment} /> to:
                              </p>
                              
                              <div className="flex items-center justify-between bg-white p-3 rounded border">
                                <div className="flex-1 font-mono text-sm truncate">
                                  {store.payment_methods.wallet_addresses[selectedPayment]}
                                </div>
                                <button
                                  onClick={() => copyToClipboard(store.payment_methods.wallet_addresses[selectedPayment], selectedPayment)}
                                  className="ml-2 p-1 hover:bg-gray-100 rounded"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                {copiedAddress === selectedPayment && (
                                  <span className="text-xs text-green-600 ml-2">Copied!</span>
                                )}
                              </div>
                            </div>

                            <Input
                              label="Last 6 digits of Transaction Number"
                              name="transactionNumber"
                              value={formData.transactionNumber}
                              onChange={handleInputChange}
                              placeholder="123456"
                              maxLength={6}
                              pattern="\d{6}"
                              required
                              fullWidth
                            />
                          </>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Button
                          variant="primary"
                          onClick={handleConfirmPayment}
                          isLoading={loading}
                          disabled={timeLeft === 0}
                          fullWidth
                        >
                          Confirm Order
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() => {
                            if (store) {
                              const orderItems = items.map(item => ({
                                name: item.name,
                                quantity: item.quantity,
                                price: item.price
                              }));
                              const message = generateStoreOrderMessage(store.name, orderItems);
                              openTelegramLink(store.telegram_contact || store.username, message);
                            }
                          }}
                          fullWidth
                          className="flex items-center justify-center"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Order via Telegram
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="bg-blue-500 text-white p-4 rounded-t-lg flex items-center justify-center">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
              </svg>
            </div>
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 text-center">Confirm Order</h2>
              <div className="mt-4 text-sm text-gray-600 space-y-2">
                <p><strong>Store:</strong> {store?.name || 'Unknown Store'}</p>
                <p><strong>Items:</strong></p>
                <ul className="list-disc pl-5">
                  {items.map(item => (
                    <li key={item.id}>
                      {item.name} (x{item.quantity}) - ฿{(item.price * item.quantity).toFixed(2)}
                    </li>
                  ))}
                </ul>
                <p><strong>Total:</strong> ฿{getTotal().toFixed(2)}</p>
                <p><strong>Payment Method:</strong> {selectedPayment.toUpperCase()}</p>
                <p><strong>Telegram Name:</strong> {formData.telegramName}</p>
                <p><strong>Shipping Address:</strong> {formData.shippingAddress}</p>
                <p><strong>Phone Number:</strong> {formData.phoneNumber || 'Not provided'}</p>
                <p><strong>Remark:</strong> {formData.remark || 'None'}</p>
                {selectedPayment !== 'cod' && (
                  <p><strong>Transaction Number:</strong> {formData.transactionNumber}</p>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowConfirmModal(false)}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={confirmOrder}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  Okay
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;