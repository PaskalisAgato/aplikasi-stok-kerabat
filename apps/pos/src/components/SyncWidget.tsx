import { useState, useEffect } from 'react';
import { syncEngine } from '@shared/services/SyncEngine';

export default function SyncWidget() {
    const [pendingCount, setPendingCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isPushing, setIsPushing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    useEffect(() => {
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
    let color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    let label = 'Online (0)';

    if (!isOnline) {
        icon = 'cloud_off';
        color = 'text-red-400 bg-red-500/10 border-red-500/20';
        label = `Offline (${pendingCount})`;
    } else if (lastError && pendingCount > 0) {
        icon = 'sync_problem';
        color = 'text-red-400 bg-red-500/10 border-red-500/20';
        label = `Error (${pendingCount})`;
    } else if (pendingCount > 0) {
        icon = isPushing ? 'cloud_sync' : 'cloud_upload';
        color = isPushing ? 'text-primary bg-primary/10 border-primary/20 animate-pulse' : 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        label = isPushing ? `Syncing (${pendingCount})...` : `Queued (${pendingCount})`;
    } else if (isPulling) {
        icon = 'sync';
        color = 'text-sky-400 bg-sky-500/10 border-sky-500/20 animate-spin-slow';
        label = 'Downloading...';
    }

    const handleClick = () => {
        window.dispatchEvent(new CustomEvent('open-sync-queue'));
    };

    return (
        <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${color}`}
            title={
                !isOnline ? "Koneksi terputus. Data disimpan aman secara offline." : 
                lastError ? `Gagal Sinkron: ${lastError}. Klik untuk detail.` :
                pendingCount > 0 ? "Klik untuk melihat antrean sinkronisasi." : 
                "Sistem terhubung dan sinkron."
            }
            onClick={handleClick}
        >
            <span className="material-symbols-outlined text-sm">{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
        </div>
    );
}
