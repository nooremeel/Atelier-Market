import { NavLink } from 'react-router-dom';
import { Drawer } from './Drawer';
import { Button } from './Button';
import type { SessionUser } from '../types';

type Props = {
  open: boolean; onClose: () => void;
  user: SessionUser | null; cartCount: number; onLogout: () => void;
};

export function MobileNavDrawer({ open, onClose, user, cartCount, onLogout }: Props) {
  const item = 'block py-2 font-sans text-step-0 text-ink';
  return (
    <Drawer open={open} onClose={onClose} side="start" title="Menu">
      <nav className="flex flex-col" onClick={onClose}>
        <NavLink to="/" end className={item}>Shop</NavLink>
        <NavLink to="/products" className={item}>Products</NavLink>
        {user && <NavLink to="/cart" className={item}>Cart <span className="tabular-nums">{cartCount}</span></NavLink>}
        {user && <NavLink to="/orders" className={item}>Orders</NavLink>}
        {user && <NavLink to="/admin/products" className={item}>Admin</NavLink>}
        {!user && <NavLink to="/login" className={item}>Log in</NavLink>}
        {!user && <NavLink to="/register" className={item}>Register</NavLink>}
        {user && <Button className="mt-4" variant="secondary" onClick={onLogout}>Log out</Button>}
      </nav>
    </Drawer>
  );
}
