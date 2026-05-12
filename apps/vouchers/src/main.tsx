import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryProvider } from '@shared/QueryProvider'
import { NotificationProvider } from '@shared/components/NotificationProvider'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </QueryProvider>
  </React.StrictMode>,
)
