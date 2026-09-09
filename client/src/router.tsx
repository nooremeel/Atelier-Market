import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { RequireAuth } from './auth/RequireAuth';
import { Styleguide } from './design-system/Styleguide';
import { Home } from './features/products/Home';
import { Catalog } from './features/products/Catalog';
import { ProductDetail } from './features/products/ProductDetail';
import { CartPage } from './features/cart/CartPage';
import { CheckoutPage } from './features/orders/CheckoutPage';
import { OrdersPage } from './features/orders/OrdersPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { RequestResetPage } from './features/auth/RequestResetPage';
import { SetPasswordPage } from './features/auth/SetPasswordPage';

// Placeholder screens — each is replaced with a real import by a later task.
function AdminListPage() { return <p>Admin list</p>; }
function AdminFormPage({ mode }: { mode: 'create' | 'edit' }) { return <p>Admin form: {mode}</p>; }
function NotFound() { return <p>Not found</p>; }

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/products', element: <Catalog /> },
      { path: '/products/:id', element: <ProductDetail /> },
      { path: '/cart', element: <RequireAuth><CartPage /></RequireAuth> },
      { path: '/checkout', element: <RequireAuth><CheckoutPage /></RequireAuth> },
      { path: '/orders', element: <RequireAuth><OrdersPage /></RequireAuth> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/reset-password', element: <RequestResetPage /> },
      { path: '/reset-password/:token', element: <SetPasswordPage /> },
      { path: '/admin/products', element: <RequireAuth><AdminListPage /></RequireAuth> },
      { path: '/admin/products/new', element: <RequireAuth><AdminFormPage mode="create" /></RequireAuth> },
      { path: '/admin/products/:id/edit', element: <RequireAuth><AdminFormPage mode="edit" /></RequireAuth> },
      { path: '/styleguide', element: <Styleguide /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
