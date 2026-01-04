import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const persister = {
  persistClient: (client) => {
    window.localStorage.setItem(
      'reactQuery',
      JSON.stringify(client, (key, value) => 
        key === 'cache' ? undefined : value
      )
    )
  },
  restoreClient: () => {
    const value = window.localStorage.getItem('reactQuery')
    if (value) {
      return JSON.parse(value)
    }
    return undefined
  },
  removeClient: () => {
    window.localStorage.removeItem('reactQuery')
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ 
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        buster: '1.0.0' // Cache version - increment when data structure changes
      }}>
      <BrowserRouter>
        <App />
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </PersistQueryClientProvider>
  </React.StrictMode>
);