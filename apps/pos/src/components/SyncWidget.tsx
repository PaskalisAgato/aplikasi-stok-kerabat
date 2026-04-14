import { useState, useEffect } from 'react';
import { syncEngine } from '@shared/services/SyncEngine';
import SyncQueueModal from './SyncQueueModal';

export default function SyncWidget() {
    const [pendingCount, setPendingCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isPushing, setIsPushing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // ... (existing listeners remain same)
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const unsubCount = syncEngine.onChange((count) => {
            setPendingCount(count);
        });

        const unsubState = syncEngine.onStateChange((state) => {
            setIsPushing(state.isPushing);
            setIsPulling(state.isPulling);
            setLastError(state.lastError);
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubCount();
            unsubState();
        };
    }, []);

    // Warn before close if pending
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (pendingCount > 0) {
                e.preventDefault();
                e.returnValue = ''; 
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [pendingCount]);

    let icon = 'cloud_done';
    let color = 'text-green-500 bg-green-500/10';
    let label = 'Online (0)';

    if (!isOnline) {
        icon = 'cloud_off';
        color = 'text-red-500 bg-red-500/10';
        label = `Offline (${pendingCount})`;
    } else if (lastError && pendingCount > 0) {
        icon = 'sync_problem';
        color = 'text-red-500 bg-red-500/10';
        label = `Error (${pendingCount})`;
    } else if (pendingCount > 0) {
        icon = isPushing ? 'cloud_sync' : 'cloud_upload';
        color = isPushing ? 'text-amber-500 bg-amber-500/10 animate-pulse' : 'text-orange-500 bg-orange-500/10';
        label = isPushing ? `Syncing (${pendingCount})...` : `Queued (${pendingCount})`;
    } else if (isPulling) {
        icon = 'sync';
        color = 'text-blue-500 bg-blue-500/10 animate-spin-slow';
        label = 'Downloading...';
    }

    return (
        <>
            <div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 transition-all cursor-pointer ${color}`}
                title={
                    !isOnline ? "Koneksi terputus. Data disimpan aman secara offline." : 
                    lastError ? `Gagal Sinkron: ${lastError}. Klik untuk detail.` :
                    pendingCount > 0 ? "Klik untuk melihat antrean sinkronisasi." : 
                    "Sistem terhubung dan sinkron."
                }
                onClick={() => setIsModalOpen(true)}
            >
                <span className="material-symbols-outlined text-sm">{icon}</span>
                <span className="text-xs font-bold whitespace-nowrap">{label}</span>
            </div>

            <SyncQueueModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </>
    );
}
