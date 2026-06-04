import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './context/StoreContext';
import { NotificationProvider } from './context/NotificationContext';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </StoreProvider>
  </StrictMode>
);
