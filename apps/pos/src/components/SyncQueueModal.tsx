import { useState, useEffect } from 'react';
import { syncEngine } from '@shared/services/SyncEngine';
import type { OfflineAction } from '@shared/services/db';

interface SyncQueueModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SyncQueueModal({ isOpen, onClose }: SyncQueueModalProps) {
    const [actions, setActions] = useState<OfflineAction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadActions = async () => {
        setIsLoading(true);
        const all = await syncEngine.getAllActions();
        setActions(all);
        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            loadActions();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCancel = async (id: string) => {
        if (confirm('Batalkan sinkronisasi untuk transaksi ini? Data ini akan dihapus dari antrean dan tidak akan terkirim ke server.')) {
            await syncEngine.cancelAction(id);
            await loadActions();
        }
    };

    const handleRetry = async () => {
        await syncEngine.forceSync();
        await loadActions();
    };

    return (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="card max-w-2xl w-full max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-white/10">
                {/* Header */}
                <header className="glass p-6 flex justify-between items-center border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-amber-500 text-2xl animate-pulse">cloud_sync</span>
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-[var(--text-main)] uppercase tracking-widest">Antrean Cloud</h3>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
                                {actions.filter(a => a.sync_status === 'PENDING').length} Transaksi Menunggu
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="size-10 rounded-xl glass hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar bg-[var(--bg-app)]">
                    {isLoading ? (
                        <div className="py-20 text-center text-[var(--text-muted)] animate-pulse uppercase font-black tracking-widest text-xs">
                            Memuat antrean...
                        </div>
                    ) : actions.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="size-20 rounded-[2rem] bg-emerald-500/5 flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-4xl text-emerald-500/30">cloud_done</span>
                            </div>
                            <p className="font-black text-lg text-[var(--text-muted)] uppercase tracking-widest">Semua Terkirim</p>
                            <p className="text-xs text-[var(--text-muted)] mt-2 opacity-60">Tidak ada transaksi yang menunggu sinkronisasi.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {actions.map((action) => {
                                const statusColor = action.sync_status === 'PENDING' ? 'amber' 
                                    : action.sync_status === 'REJECTED' ? 'red' 
                                    : action.sync_status === 'FAILED_PERMANENT' ? 'red' 
                                    : 'emerald';

                                return (
                                    <div key={action.id} className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`size-10 rounded-xl bg-${statusColor}-500/10 flex items-center justify-center shrink-0`}>
                                                <span className={`material-symbols-outlined text-${statusColor}-500`}>
                                                    {action.type === 'CHECKOUT' ? 'shopping_cart' : action.type === 'VOID' ? 'cancel' : 'receipt_long'}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="font-black text-xs text-[var(--text-main)] uppercase tracking-widest truncate">
                                                        {action.type} #{action.id.slice(0, 8)}
                                                    </p>
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-${statusColor}-500/10 text-${statusColor}-500`}>
                                                        {action.sync_status === 'PENDING' ? `${action.retry_count} Retries` : action.sync_status}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] text-[var(--text-muted)] font-medium">
                                                    {new Date(action.created_at).toLocaleString('id-ID')}
                                                </p>
                                                {action.failure_reason && (
                                                    <p className="text-[9px] text-red-500 mt-1 font-bold italic truncate max-w-[250px]">
                                                        Err: {action.failure_reason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleCancel(action.id)}
                                            className="size-9 rounded-xl glass text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100"
                                            title="Batalkan Sync"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="glass p-6 border-t border-white/5 flex gap-4 shrink-0">
                    <button 
                        onClick={handleRetry}
                        disabled={actions.length === 0}
                        className="flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                        <span className="material-symbols-outlined text-lg">sync</span>
                        Paksa Sinkron Sekarang
                    </button>
                </footer>
            </div>
            </div>
        </div>
    );
}
