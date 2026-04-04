import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryProvider } from '@shared/QueryProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryProvider>
            <App />
        </QueryProvider>
    </React.StrictMode>,
)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => {
                console.log('POS Service Worker registered', reg);
                
                // Auto-reload when new version takes control
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
                });
            })
            .catch(err => console.error('POS Service Worker registration failed', err));
    });
}


