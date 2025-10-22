import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore';
import Button from '../ui/Button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmptyCart = () => (
  <div className="text-center py-8">
    <ShoppingCart className="h-12 w-12 text-theme-tertiary mx-auto mb-4" />
    <p className="text-theme-secondary">Your cart is empty</p>
  </div>
);

const CartItem = ({ item, removeItem, updateQuantity }: any) => (
  <div className="flex items-center space-x-4 bg-theme-card p-4 rounded-lg border border-theme">
    <div className="flex-shrink-0 w-16 h-16">
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover rounded"
        />
      ) : (
        <div className="w-full h-full bg-theme-tertiary rounded flex items-center justify-center">
          <ShoppingCart className="h-6 w-6 text-theme-tertiary" />
        </div>
      )}
    </div>
    <div className="flex-1">
      <h3 className="text-sm font-medium">{item.name}</h3>
      <p className="text-sm text-theme-secondary">
        THB {item.price.toFixed(2)}
      </p>
    </div>
    <div className="flex items-center space-x-2">
      <button
        onClick={() => updateQuantity(item.productId, Math.max(0, item.quantity - 1))}
        className="p-1 hover:bg-theme-tertiary rounded"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center">{item.quantity}</span>
      <button
        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
        className="p-1 hover:bg-theme-tertiary rounded"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        onClick={() => removeItem(item.productId)}
        className="p-1 hover:bg-red-100 rounded text-red-600 dark:hover:bg-red-900/20"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-theme-card shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <div className="flex items-center">
            <ShoppingCart className="h-6 w-6 text-theme-secondary mr-2" />
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-theme-tertiary rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem 
                  key={item.id} 
                  item={item} 
                  removeItem={removeItem} 
                  updateQuantity={updateQuantity} 
                />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-theme p-4 space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>THB {getTotal().toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={clearCart}
                fullWidth
              >
                Clear Cart
              </Button>
              <Button
                variant="primary"
                onClick={handleCheckout}
                fullWidth
              >
                Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;