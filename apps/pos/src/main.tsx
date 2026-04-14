import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryProvider } from '@shared/QueryProvider'

import { NotificationProvider } from './components/NotificationProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryProvider>
            <NotificationProvider>
                <App />
            </NotificationProvider>
        </QueryProvider>
    </React.StrictMode>,
)


