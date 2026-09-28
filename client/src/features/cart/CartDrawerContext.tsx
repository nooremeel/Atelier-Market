import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

type CartDrawerContextType = {
  isOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  toggleCartDrawer: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextType>({
  isOpen: false,
  openCartDrawer: () => {},
  closeCartDrawer: () => {},
  toggleCartDrawer: () => {},
});

export function CartDrawerProvider({
  children,
  initialOpen = false,
}: {
  children: ReactNode;
  initialOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const location = useLocation();
  const prevPathname = useRef(location.pathname);

  // Close drawer upon route changes to avoid blocking new view
  useEffect(() => {
    if (prevPathname.current !== location.pathname) {
      prevPathname.current = location.pathname;
      setIsOpen(false);
    }
  }, [location.pathname]);

  const openCartDrawer = useCallback(() => setIsOpen(true), []);
  const closeCartDrawer = useCallback(() => setIsOpen(false), []);
  const toggleCartDrawer = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <CartDrawerContext.Provider value={{ isOpen, openCartDrawer, closeCartDrawer, toggleCartDrawer }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  return useContext(CartDrawerContext);
}
