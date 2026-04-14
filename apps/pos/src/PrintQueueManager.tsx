import { useState, useEffect, useCallback } from 'react';
import { PrintService } from '@shared/services/PrintService';
import type { OfflinePrintJob } from '@shared/services/db';

export default function PrintQueueManager({ onBack }: { onBack: () => void }) {
    const [jobs, setJobs] = useState<OfflinePrintJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [printingId, setPrintingId] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const loadJobs = useCallback(async () => {
        setIsLoading(true);
        const pending = await PrintService.getPendingJobs();
        setJobs(pending);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadJobs();
        // Auto-refresh every 5s
        const interval = setInterval(loadJobs, 5000);
        return () => clearInterval(interval);
    }, [loadJobs]);

    const handlePrint = async (jobId: string) => {
        setPrintingId(jobId);
        const success = await PrintService.printFromQueue(jobId);
        if (success) {
            // Remove from list after successful print
            setJobs(prev => prev.filter(j => j.id !== jobId));
        } else {
            // Reload to get updated status
            await loadJobs();
        }
        setPrintingId(null);
    };

    const handleDelete = async (jobId: string) => {
        await PrintService.deleteJob(jobId);
        setJobs(prev => prev.filter(j => j.id !== jobId));
    };

    const handleClearAll = async () => {
        await PrintService.clearQueue();
        setJobs([]);
        setShowClearConfirm(false);
    };

    const handleBrowserPrint = (job: OfflinePrintJob) => {
        if (job.data) {
            PrintService.browserPrint(job.data as any);
        }
    };

    const pendingCount = jobs.filter(j => j.status === 'PENDING').length;

    return (
        <div className="p-2 md:p-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 px-2 gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="size-10 md:size-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-xl md:text-2xl">receipt_long</span>
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-black text-lg md:text-xl uppercase tracking-widest text-[var(--text-main)] truncate">Antrean Cetak</h2>
                        <p className="text-[9px] md:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5 truncate">
                            {pendingCount} struk menunggu
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3 w-full md:w-auto">
                    {jobs.length > 0 && (
                        <>
                            {!showClearConfirm ? (
                                <button 
                                    onClick={() => setShowClearConfirm(true)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-sm">delete_sweep</span>
                                    Hapus <span className="hidden xs:inline">Semua</span>
                                </button>
                            ) : (
                                <div className="flex-1 md:flex-none flex items-center gap-1 animate-in zoom-in duration-300 w-full md:w-auto">
                                    <button 
                                        onClick={() => setShowClearConfirm(false)}
                                        className="flex-1 md:flex-none px-2 md:px-4 py-2.5 md:py-3 rounded-xl hover:bg-[var(--border-dim)] text-[var(--text-muted)] transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center justify-center"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        onClick={handleClearAll}
                                        className="flex-[2] md:flex-none flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2.5 md:py-3 rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/20 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest active:scale-95 animate-pulse"
                                    >
                                        <span className="material-symbols-outlined text-sm">check</span>
                                        Yakin<span className="hidden xs:inline"> Hapus?</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    <button 
                        onClick={onBack}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-3 px-3 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl glass hover:bg-primary/20 text-primary transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest active:scale-95 shadow-lg border border-[var(--border-dim)]"
                    >
                        <span className="material-symbols-outlined text-[16px] md:text-[18px]">arrow_back</span>
                        Kembali
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {isLoading ? (
                    <div className="card p-20 text-center text-[var(--text-muted)] animate-pulse shadow-xl">
                        Memuat antrean cetak...
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="card p-20 text-center shadow-xl">
                        <div className="size-20 rounded-3xl bg-primary/5 flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl text-primary/30">print_disabled</span>
                        </div>
                        <p className="font-black text-lg text-[var(--text-muted)] uppercase tracking-widest">Antrean Kosong</p>
                        <p className="text-xs text-[var(--text-muted)] mt-2 opacity-60">Semua struk sudah dicetak atau dihapus.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {jobs.map((job) => {
                            const data = job.data as any;
                            const isPrinting = printingId === job.id;
                            const statusColor = job.status === 'PENDING' ? 'amber' 
                                : job.status === 'DONE' ? 'emerald' 
                                : 'red';

                            return (
                                <div 
                                    key={job.id} 
                                    className={`card p-0 overflow-hidden shadow-xl border transition-all ${
                                        isPrinting ? 'border-primary/40 accent-glow' : 'border-white/5 hover:border-white/10'
                                    }`}
                                >
                                    {/* Card Header */}
                                    <div className="p-5 flex items-center justify-between border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-10 rounded-xl bg-${statusColor}-500/10 flex items-center justify-center`}>
                                                <span className={`material-symbols-outlined text-${statusColor}-500`}>
                                                    {job.status === 'PENDING' ? 'schedule' : job.status === 'DONE' ? 'check_circle' : 'error'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-black text-xs text-[var(--text-main)] uppercase tracking-widest">
                                                    Struk #{String(data?.id || job.id).slice(-8)}
                                                </p>
                                                <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">
                                                    {new Date(job.created_at).toLocaleString('id-ID', { 
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit' 
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-${statusColor}-500/10 text-${statusColor}-500`}>
                                            {job.status}
                                        </span>
                                    </div>

                                    {/* Card Body - Transaction Details */}
                                    <div className="p-5 space-y-3">
                                        {data?.items?.slice(0, 3).map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                <span className="text-[var(--text-muted)] font-medium truncate max-w-[60%]">
                                                    {item.quantity}x {item.name}
                                                </span>
                                                <span className="text-[var(--text-main)] font-bold">
                                                    Rp {(item.subtotal || 0).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        ))}
                                        {data?.items?.length > 3 && (
                                            <p className="text-[10px] text-[var(--text-muted)] italic">
                                                +{data.items.length - 3} item lainnya...
                                            </p>
                                        )}
                                        <div className="h-px bg-white/5 my-2" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                                {data?.paymentMethod || '—'}
                                            </span>
                                            <span className="font-black text-lg text-primary">
                                                Rp {(data?.total || 0).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Footer - Actions */}
                                    {job.status !== 'DONE' && (
                                        <div className="p-3 bg-white/[0.02] border-t border-white/5 grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => handlePrint(job.id)}
                                                disabled={isPrinting}
                                                className="h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-slate-950 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    {isPrinting ? 'hourglass_top' : 'print'}
                                                </span>
                                                {isPrinting ? '...' : 'Cetak'}
                                            </button>
                                            <button
                                                onClick={() => handleBrowserPrint(job)}
                                                className="h-10 rounded-xl glass border-white/5 hover:bg-white/10 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] transition-all active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                                                Browser
                                            </button>
                                            <button
                                                onClick={() => handleDelete(job.id)}
                                                className="h-10 rounded-xl glass border-white/5 text-red-500 hover:bg-red-500/10 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                Hapus
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
