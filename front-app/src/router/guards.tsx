import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { usersApi } from '../api/users';
import { useUserStore } from '../store/userStore';

/** Giriş yapmış kullanıcı gerekir. Yoksa /auth/login'e yönlendir. */
export function ProtectedRoute() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'no-profile' | 'unauthorized'>('loading');
  const { setProfile, profile, isProfileLoaded } = useUserStore();
  const location = useLocation();

  useEffect(() => {
    // Zaten yüklüyse tekrar fetch etme
    if (isProfileLoaded && profile) {
      setStatus('ok');
      return;
    }

    usersApi.getMe()
      .then((res) => {
        if (res.data.data) {
          setProfile(res.data.data);
          setStatus('ok');
        } else {
          setStatus('no-profile');
        }
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setStatus('no-profile');
        } else {
          setStatus('unauthorized');
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'loading') {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }
  if (status === 'unauthorized') return <Navigate to="/auth/login" state={{ from: location }} replace />;
  if (status === 'no-profile') return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

/** Giriş yapmış kullanıcının auth sayfalarına erişimini engeller */
export function PublicOnlyRoute() {
  const { profile, isProfileLoaded } = useUserStore();
  if (isProfileLoaded && profile) return <Navigate to="/app" replace />;
  return <Outlet />;
}
