import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { RequireAuth } from './auth/RequireAuth';
import { Styleguide } from './design-system/Styleguide';
import { Home } from './features/products/Home';
import { Catalog } from './features/products/Catalog';
import { ProductDetail } from './features/products/ProductDetail';
import { ArtisanMapPage } from './features/map/ArtisanMapPage';
import { SellerPublicPage } from './features/seller/SellerPublicPage';
import { FavouritesPage } from './features/products/FavouritesPage';
import { CartPage } from './features/cart/CartPage';
import { CheckoutPage } from './features/orders/CheckoutPage';
import { OrdersPage } from './features/orders/OrdersPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { RequestResetPage } from './features/auth/RequestResetPage';
import { SetPasswordPage } from './features/auth/SetPasswordPage';
import { AdminListPage } from './features/admin/AdminListPage';
import { AdminFormPage } from './features/admin/AdminFormPage';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { AdminOrdersPage } from './features/admin/AdminOrdersPage';
import { AdminArtisansPage } from './features/admin/AdminArtisansPage';
import { SellerDashboard } from './features/seller/SellerDashboard';
import { SellerOrdersPage } from './features/seller/SellerOrdersPage';
import { SellerProfilePage } from './features/seller/SellerProfilePage';
import { SellerDiscountsPage } from './features/seller/SellerDiscountsPage';
import { AccountLayout } from './features/account/AccountLayout';
import { ProfilePage } from './features/account/ProfilePage';
import { AddressBook } from './features/account/AddressBook';
import { NotFound } from './pages/NotFound';
import { RouteError } from './pages/RouteError';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      // ── Public ──────────────────────────────────────────────────────────
      { path: '/',             element: <Home /> },
      { path: '/products',     element: <Catalog /> },
      { path: '/products/:id', element: <ProductDetail /> },
      { path: '/map',          element: <ArtisanMapPage /> },
      { path: '/sellers/:id',  element: <SellerPublicPage /> },

      // ── Auth ─────────────────────────────────────────────────────────────
      { path: '/login',             element: <LoginPage /> },
      { path: '/register',          element: <RegisterPage /> },
      { path: '/reset-password',    element: <RequestResetPage /> },
      { path: '/reset-password/:token', element: <SetPasswordPage /> },

      // ── Customer (authenticated) ──────────────────────────────────────────
      { path: '/cart',       element: <RequireAuth role="customer"><CartPage /></RequireAuth> },
      { path: '/checkout',   element: <RequireAuth role="customer"><CheckoutPage /></RequireAuth> },
      { path: '/orders',     element: <RequireAuth role="customer"><OrdersPage /></RequireAuth> },
      { path: '/favourites', element: <RequireAuth><FavouritesPage /></RequireAuth> },
      {
        path: '/account',
        element: <RequireAuth role={['customer', 'admin']}><AccountLayout /></RequireAuth>,
        children: [
          { index: true, element: <Navigate to="/account/profile" replace /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'addresses', element: <AddressBook /> },
          { path: 'orders', element: <OrdersPage /> },
        ],
      },

      // ── Seller Studio ───────────────────────────────────────────────────
      { path: '/seller',                 element: <Navigate to="/seller/dashboard" replace /> },
      { path: '/seller/dashboard',       element: <RequireAuth role={['seller', 'admin']}><SellerDashboard /></RequireAuth> },
      { path: '/seller/orders',          element: <RequireAuth role={['seller', 'admin']}><SellerOrdersPage /></RequireAuth> },
      { path: '/seller/discounts',       element: <RequireAuth role={['seller', 'admin']}><SellerDiscountsPage /></RequireAuth> },
      { path: '/seller/profile',         element: <RequireAuth role={['seller', 'admin']}><SellerProfilePage /></RequireAuth> },
      { path: '/seller/products',        element: <RequireAuth role={['seller', 'admin']}><AdminListPage /></RequireAuth> },

      // ── Platform Admin ───────────────────────────────────────────────────
      { path: '/admin',                  element: <Navigate to="/admin/dashboard" replace /> },
      { path: '/admin/dashboard',        element: <RequireAuth role="admin"><AdminDashboard /></RequireAuth> },
      { path: '/admin/orders',           element: <RequireAuth role="admin"><AdminOrdersPage /></RequireAuth> },
      { path: '/admin/artisans',         element: <RequireAuth role="admin"><AdminArtisansPage /></RequireAuth> },
      { path: '/admin/products',         element: <RequireAuth role={['seller', 'admin']}><AdminListPage /></RequireAuth> },
      { path: '/admin/products/new',     element: <RequireAuth role={['seller', 'admin']}><AdminFormPage mode="create" /></RequireAuth> },
      { path: '/admin/products/:id/edit', element: <RequireAuth role={['seller', 'admin']}><AdminFormPage mode="edit" /></RequireAuth> },

      // ── Dev / Design ─────────────────────────────────────────────────────
      { path: '/styleguide', element: <Styleguide /> },

      // ── Fallback ─────────────────────────────────────────────────────────
      { path: '*', element: <NotFound /> },
    ],
  },
]);
