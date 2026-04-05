import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable] = useState(true); // Always show download button

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            console.log('✅ PWA beforeinstallprompt fired');
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            console.log('🎉 PWA was successfully installed');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        // 1. Check if already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            toast.error('Aplikasi sudah terinstal di HP ini!', {
                icon: '📱',
                style: {
                    borderRadius: '16px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-dim)'
                }
            });
            return;
        }

        // 2. Try to use the PWA prompt if available
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            // 3. Fallback for iOS/Mozilla/Other browsers that don't support beforeinstallprompt
            toast('Instalasi Manual: Klik ikon "Share" lalu pilih "Add to Home Screen" (Safari) atau "Install" (Mozilla)', {
                duration: 6000,
                icon: '💡',
                style: {
                    borderRadius: '16px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-dim)'
                }
            });
        }
    };

    return { isInstallable, deferredPrompt, handleInstall };
};
