import { useState, useEffect, useCallback } from 'react';
import { syncEngine } from '@shared/services/SyncEngine';
import type { OfflineAction } from '@shared/services/db';

export default function SyncQueuePage({ onBack }: { onBack: () => void }) {
    const [actions, setActions] = useState<OfflineAction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadActions = useCallback(async () => {
        setIsLoading(true);
        const all = await syncEngine.getAllActions();
        setActions(all);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadActions();
        // Auto-refresh every 5s
        const interval = setInterval(loadActions, 5000);
        return () => clearInterval(interval);
    }, [loadActions]);

    const handleCancel = async (id: string) => {
        if (confirm('Batalkan sinkronisasi untuk transaksi ini? Data ini akan dihapus dari antrean dan tidak akan terkirim ke server.')) {
            await syncEngine.cancelAction(id);
            await loadActions();
        }
    };

    const handleClearAll = async () => {
        if (confirm('YAKIN HAPUS SEMUA ANTREAN? Semua data transaksi yang belum terkirim ke server akan DIHAPUS PERMANEN dari perangkat ini.')) {
            await syncEngine.clearAllActions();
            await loadActions();
        }
    };

    const handleRetryItem = async (id: string) => {
        await syncEngine.retryAction(id);
        await loadActions();
    };

    const handleRetry = async () => {
        await syncEngine.forceSync();
        await loadActions();
    };

    const pendingCount = actions.filter(a => a.sync_status === 'PENDING').length;

    return (
        <div className="p-2 md:p-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 px-2 gap-4">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-500 text-2xl animate-pulse">cloud_sync</span>
                    </div>
                    <div>
                        <h2 className="font-black text-xl uppercase tracking-widest text-[var(--text-main)]">Antrean Cloud</h2>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
                            {pendingCount} transaksi menunggu
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {actions.length > 0 && (
                        <button 
                            onClick={handleClearAll}
                            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 border border-red-500/20"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                            Hapus Semua
                        </button>
                    )}
                    <button 
                        onClick={handleRetry}
                        disabled={actions.length === 0}
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[18px]">sync</span>
                        Paksa Sinkron
                    </button>
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl glass hover:bg-primary/20 text-primary transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-lg border border-[var(--border-dim)]"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Kembali
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {isLoading && actions.length === 0 ? (
                    <div className="card p-20 text-center text-[var(--text-muted)] animate-pulse shadow-xl uppercase font-black tracking-widest text-xs">
                        Memuat antrean...
                    </div>
                ) : actions.length === 0 ? (
                    <div className="card p-20 text-center shadow-xl">
                        <div className="size-20 rounded-[2rem] bg-emerald-500/5 flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl text-emerald-500/30">cloud_done</span>
                        </div>
                        <p className="font-black text-lg text-[var(--text-muted)] uppercase tracking-widest">Semua Terkirim</p>
                        <p className="text-xs text-[var(--text-muted)] mt-2 opacity-60">Tidak ada transaksi yang menunggu sinkronisasi.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {actions.map((action) => {
                            const statusColor = action.sync_status === 'PENDING' ? 'amber' 
                                : action.sync_status === 'REJECTED' ? 'red' 
                                : action.sync_status === 'FAILED_PERMANENT' ? 'red' 
                                : 'emerald';

                            return (
                                <div key={action.id} className="card p-5 group hover:border-white/10 transition-all shadow-xl">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-10 rounded-xl bg-${statusColor}-500/10 flex items-center justify-center`}>
                                                <span className={`material-symbols-outlined text-${statusColor}-500 text-xl`}>
                                                    {action.type === 'CHECKOUT' ? 'shopping_cart' : action.type === 'VOID' ? 'cancel' : action.type === 'DELETE_TRANSACTION' ? 'delete' : 'receipt_long'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-black text-xs text-[var(--text-main)] uppercase tracking-widest">
                                                    {action.type}
                                                </p>
                                                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">#{action.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-${statusColor}-500/10 text-${statusColor}-500`}>
                                            {action.sync_status}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-6 bg-black/10 p-4 rounded-2xl border border-white/5">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                            <span>Waktu</span>
                                            <span className="text-[var(--text-main)]">{new Date(action.created_at).toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                            <span>Percobaan</span>
                                            <span className={`px-2 py-0.5 rounded-full ${action.retry_count > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'}`}>
                                                {action.retry_count} / 3
                                            </span>
                                        </div>
                                        {action.last_attempt_at && (
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                                <span>Terakhir</span>
                                                <span className="text-[var(--text-main)]/60">{new Date(action.last_attempt_at).toLocaleTimeString('id-ID')}</span>
                                            </div>
                                        )}
                                        {action.failure_reason && (
                                            <div className="mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/10">
                                                <div className="flex items-center gap-2 mb-1 text-red-500">
                                                    <span className="material-symbols-outlined text-xs">error</span>
                                                    <p className="text-[9px] font-black uppercase tracking-widest">Detail Error</p>
                                                </div>
                                                <p className="text-[10px] text-red-200/50 leading-relaxed italic">
                                                    {action.failure_reason}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <button 
                                            onClick={() => handleRetryItem(action.id)}
                                            className="py-2.5 rounded-xl bg-amber-500/10 text-amber-500 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-slate-950 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">sync</span>
                                            Coba Lagi
                                        </button>
                                        <button 
                                            onClick={() => handleCancel(action.id)}
                                            className="py-2.5 rounded-xl bg-red-500/10 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                            Batal
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
