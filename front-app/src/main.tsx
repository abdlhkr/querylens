import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './i18n/index';
import './index.css';
import AppRouter from './router/index';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#131c30',
          color: '#f1f5f9',
          border: '1px solid rgba(148,163,184,0.2)',
          borderRadius: '12px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
        },
      }}
    />
  </StrictMode>
);
