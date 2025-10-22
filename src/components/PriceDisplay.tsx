import React from 'react';
import { useCurrencyStore } from '../stores/useCurrencyStore';

interface PriceDisplayProps {
  amount: number | null | undefined;
  className?: string;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ amount, className = '' }) => {
  const { formatAmount } = useCurrencyStore();
  
  // Handle undefined, null, or invalid prices
  if (amount === null || amount === undefined || isNaN(amount)) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="text-lg font-bold text-gray-400">
          Price not available
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-lg font-bold text-blue-600">
        {formatAmount(amount, 'THB')}
      </div>
    </div>
  );
};

export default PriceDisplay;

