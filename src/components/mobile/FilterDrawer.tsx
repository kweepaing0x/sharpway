import React from 'react';
import Button from '../ui/Button';
import BottomSheet from './BottomSheet';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  children: React.ReactNode;
  title?: string;
  showApply?: boolean;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  children,
  title = 'Filters',
  showApply = true
}) => {
  const handleApply = () => {
    onApply();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} maxHeight="80vh">
      <div className="space-y-4">
        {children}

        {showApply && (
          <div className="flex gap-3 pt-4 border-t border-theme">
            <Button
              variant="secondary"
              onClick={onReset}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={handleApply}
              className="flex-1 bg-accent-cyan hover:bg-accent-cyan/90 text-black"
            >
              Apply Filters
            </Button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default FilterDrawer;
