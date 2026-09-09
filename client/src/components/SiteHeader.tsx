import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/cn';
import { Wordmark } from './Wordmark';
import { Button } from './Button';
import { MobileNavDrawer } from './MobileNavDrawer';
import type { SessionUser } from '../types';

type Props = { user: SessionUser | null; cartCount: number; onLogout: () => void };

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn('font-sans text-step--1 text-plaster/80 hover:text-plaster', isActive && 'text-plaster underline');

export function SiteHeader({ user, cartCount, onLogout }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <header className="bg-najd text-plaster">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <button className="font-sans text-step--1 text-plaster sm:hidden" onClick={() => setDrawerOpen(true)}
          aria-label="Open menu">Menu</button>
        <NavLink to="/" className="mx-auto sm:mx-0"><Wordmark /></NavLink>
        <nav className="hidden items-center gap-6 sm:flex">
          <NavLink to="/" end className={linkClass}>Shop</NavLink>
          <NavLink to="/products" className={linkClass}>Products</NavLink>
          {user && (
            <NavLink to="/cart" className={linkClass}>
              Cart <span aria-label={`${cartCount} items`} className="tabular-nums">{cartCount}</span>
            </NavLink>
          )}
          {user && <NavLink to="/orders" className={linkClass}>Orders</NavLink>}
          {user && <NavLink to="/admin/products" className={linkClass}>Admin</NavLink>}
          {user
            ? <Button size="sm" variant="secondary" onClick={onLogout}>Log out</Button>
            : <><NavLink to="/login" className={linkClass}>Log in</NavLink><NavLink to="/register" className={linkClass}>Register</NavLink></>}
        </nav>
      </div>
      <div className="rule-reveal h-px bg-gold-leaf" />
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        user={user} cartCount={cartCount} onLogout={onLogout} />
    </header>
  );
}
