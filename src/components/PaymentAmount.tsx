import React from 'react';
import { useCurrencyStore } from '../stores/useCurrencyStore';

interface PaymentAmountProps {
  amount: number;
  paymentMethod: 'kpay' | 'usdt' | 'cod';
  className?: string;
}

const PaymentAmount: React.FC<PaymentAmountProps> = ({ amount, paymentMethod, className = '' }) => {
  const { convertFromTHB, formatAmount } = useCurrencyStore();
  
  const getPaymentAmount = () => {
    switch (paymentMethod) {
      case 'kpay':
        return formatAmount(convertFromTHB(amount, 'MMK'), 'MMK');
      case 'usdt':
        return formatAmount(amount, 'THB');
      case 'cod':
        return formatAmount(amount, 'THB');
      default:
        return formatAmount(amount, 'THB');
    }
  };

  return (
    <div className={`font-bold ${className}`}>
      {getPaymentAmount()}
    </div>
  );
};

export default PaymentAmount;