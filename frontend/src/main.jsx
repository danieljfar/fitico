import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { App } from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#101828',
          color: '#f8fafc',
          border: '1px solid rgba(255,255,255,0.08)',
        },
      }}
    />
  </React.StrictMode>
);