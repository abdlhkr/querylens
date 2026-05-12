import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute, PublicOnlyRoute } from './guards';

// Stale chunk sonrası otomatik reload
function lazyWithReload<T extends React.ComponentType>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch(() => {
      window.location.reload();
      return new Promise<{ default: T }>(() => {});
    })
  );
}

const Landing = lazyWithReload(() => import('../pages/Landing'));
const Login = lazyWithReload(() => import('../pages/auth/Login'));
const Register = lazyWithReload(() => import('../pages/auth/Register'));
const VerifyCode = lazyWithReload(() => import('../pages/auth/VerifyCode'));
const ForgotPassword = lazyWithReload(() => import('../pages/auth/ForgotPassword'));
const Onboarding = lazyWithReload(() => import('../pages/Onboarding'));
const AppLayout = lazyWithReload(() => import('../components/layout/AppLayout'));
const Dashboard = lazyWithReload(() => import('../pages/app/Dashboard'));
const Databases = lazyWithReload(() => import('../pages/app/Databases'));
const Query = lazyWithReload(() => import('../pages/app/Query'));
const Settings = lazyWithReload(() => import('../pages/app/Settings'));

const PageLoader = () => (
  <div className="loading-screen">
    <div className="spinner" />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Landing />
      </Suspense>
    ),
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: '/auth/login',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: '/auth/register',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Register />
          </Suspense>
        ),
      },
      {
        path: '/auth/verify',
        element: (
          <Suspense fallback={<PageLoader />}>
            <VerifyCode />
          </Suspense>
        ),
      },
      {
        path: '/auth/forgot-password',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ForgotPassword />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/onboarding',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Onboarding />
      </Suspense>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: (
          <Suspense fallback={<PageLoader />}>
            <AppLayout />
          </Suspense>
        ),
        children: [
          { path: '/app', element: <Suspense fallback={<PageLoader />}><Dashboard /></Suspense> },
          { path: '/app/databases', element: <Suspense fallback={<PageLoader />}><Databases /></Suspense> },
          { path: '/app/query', element: <Suspense fallback={<PageLoader />}><Query /></Suspense> },
          { path: '/app/settings', element: <Suspense fallback={<PageLoader />}><Settings /></Suspense> },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
