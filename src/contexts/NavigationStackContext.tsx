import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface NavigationLayer {
  id: string;
  onClose: () => void;
  priority: number;
}

interface NavigationStackContextType {
  pushLayer: (id: string, onClose: () => void, priority?: number) => void;
  popLayer: (id: string) => void;
  clearStack: () => void;
  getStackSize: () => number;
}

const NavigationStackContext = createContext<NavigationStackContextType | undefined>(undefined);

export const useNavigationStack = (): NavigationStackContextType => {
  const context = useContext(NavigationStackContext);
  if (!context) {
    throw new Error('useNavigationStack must be used within a NavigationStackProvider');
  }
  return context;
};

export const useEscapeKey = (onEscape: () => void, enabled: boolean = true) => {
  const { pushLayer, popLayer } = useNavigationStack();
  const layerId = React.useId();

  useEffect(() => {
    if (enabled) {
      pushLayer(layerId, onEscape);
      return () => {
        popLayer(layerId);
      };
    }
  }, [enabled, layerId, onEscape, pushLayer, popLayer]);
};

interface NavigationStackProviderProps {
  children: ReactNode;
}

export const NavigationStackProvider: React.FC<NavigationStackProviderProps> = ({ children }) => {
  const [stack, setStack] = useState<NavigationLayer[]>([]);

  const pushLayer = useCallback((id: string, onClose: () => void, priority: number = 0) => {
    setStack((prev) => {
      const filtered = prev.filter((layer) => layer.id !== id);
      return [...filtered, { id, onClose, priority }].sort((a, b) => a.priority - b.priority);
    });
  }, []);

  const popLayer = useCallback((id: string) => {
    setStack((prev) => prev.filter((layer) => layer.id !== id));
  }, []);

  const clearStack = useCallback(() => {
    setStack([]);
  }, []);

  const getStackSize = useCallback(() => stack.length, [stack.length]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && stack.length > 0) {
        event.preventDefault();
        event.stopPropagation();

        const topLayer = stack[stack.length - 1];
        if (topLayer && topLayer.onClose) {
          topLayer.onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleEscape, { capture: true });
    };
  }, [stack]);

  const value: NavigationStackContextType = {
    pushLayer,
    popLayer,
    clearStack,
    getStackSize,
  };

  return (
    <NavigationStackContext.Provider value={value}>
      {children}
    </NavigationStackContext.Provider>
  );
};

export default NavigationStackContext;
