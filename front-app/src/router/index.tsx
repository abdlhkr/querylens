import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute, PublicOnlyRoute } from './guards';

// Lazy load sayfaları
const Landing = lazy(() => import('../pages/Landing'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const VerifyCode = lazy(() => import('../pages/auth/VerifyCode'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const Onboarding = lazy(() => import('../pages/Onboarding'));
const AppLayout = lazy(() => import('../components/layout/AppLayout'));
const Dashboard = lazy(() => import('../pages/app/Dashboard'));
const Databases = lazy(() => import('../pages/app/Databases'));
const Query = lazy(() => import('../pages/app/Query'));
const Settings = lazy(() => import('../pages/app/Settings'));

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
