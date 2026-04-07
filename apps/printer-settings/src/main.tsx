import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@shared/global.css'
import { QueryProvider } from '@shared/QueryProvider.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </React.StrictMode>,
)
