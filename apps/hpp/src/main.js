import { jsx as _jsx } from "react/jsx-runtime";
import { QueryProvider } from '@shared/QueryProvider';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(QueryProvider, { children: _jsx(App, {}) }) }));
