import React, { useState, useEffect } from 'react';
import { useKdsEvents, KdsOrder } from '../hooks/useKdsEvents';
import { Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

export const KDSView: React.FC = () => {
    const { orders, loading, error, markAsDone, refresh } = useKdsEvents();
    const [, setNow] = useState<number>(Date.now());

    // Ticker to automatically update order duration timers every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white p-6">
            <header className="flex justify-between items-center mb-8 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                    <h1 className="text-2xl font-bold tracking-tight">Kitchen Display System (KDS)</h1>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                    <button 
                        onClick={refresh}
                        disabled={loading}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 text-xs font-bold"
                        title="Muat Ulang Pesanan"
                    >
                        <RefreshCw size={16} className={clsx(loading && "animate-spin")} />
                        Refresh
                    </button>
                    <div className="h-6 w-px bg-slate-700" />
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-semibold tracking-widest text-slate-400">Pesanan Aktif</span>
                        <span className="text-xl font-mono text-blue-400 font-bold">{orders.length}</span>
                    </div>
                </div>
            </header>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                    <button onClick={refresh} className="underline font-bold text-xs">Coba Lagi</button>
                </div>
            )}

            {loading && orders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <RefreshCw size={40} className="animate-spin mb-4 text-blue-400" />
                    <p className="text-sm font-medium">Memuat data pesanan dapur...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {orders.map((order) => (
                        <KdsOrderCard 
                            key={order.id} 
                            order={order} 
                            onDone={() => markAsDone(order.id)} 
                        />
                    ))}
                    {orders.length === 0 && !loading && (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 text-slate-500 bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-800">
                            <AlertCircle size={64} className="mb-4 opacity-30" />
                            <p className="text-xl font-bold text-slate-400">Tidak ada pesanan aktif</p>
                            <p className="text-sm opacity-60">Dapur sedang santai. Siap untuk pesanan baru!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const KdsOrderCard: React.FC<{ order: KdsOrder; onDone: () => void }> = ({ order, onDone }) => {
    const minutesElapsed = Math.max(0, Math.floor((Date.now() - new Date(order.timestamp).getTime()) / 60000));
    
    // Urgency levels
    const isUrgent = minutesElapsed >= 15;
    const isWarning = minutesElapsed >= 10 && minutesElapsed < 15;

    return (
        <div className={clsx(
            "flex flex-col bg-slate-800 rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl",
            isUrgent ? "border-rose-500/70 shadow-rose-900/30" : 
            isWarning ? "border-amber-500/70 shadow-amber-900/30" : 
            "border-slate-700/60"
        )}>
            {/* Card Header */}
            <div className={clsx(
                "p-4 flex justify-between items-start border-b border-slate-700/40",
                isUrgent ? "bg-rose-500/15" : isWarning ? "bg-amber-500/15" : "bg-slate-700/40"
            )}>
                <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Meja / Pemesan</span>
                    <h3 className="text-lg font-extrabold truncate leading-tight text-white">{order.customerInfo || 'Pelanggan'}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                        <span className="text-xs font-mono font-bold text-slate-300">#{order.id}</span>
                        {order.type === 'ADDITION' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse">ADDITION</span>
                        )}
                    </div>
                </div>
                <div className={clsx(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-md",
                    isUrgent ? "bg-rose-500 text-white animate-bounce" : 
                    isWarning ? "bg-amber-500 text-slate-950" : 
                    "bg-slate-700 text-slate-200"
                )}>
                    <Clock size={14} />
                    {minutesElapsed}m
                </div>
            </div>

            {/* Items List */}
            <div className="p-4 flex-grow space-y-4">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center font-extrabold text-white text-sm shadow-inner">
                            {item.quantity}
                        </div>
                        <div className="flex-grow">
                            <p className="font-bold text-slate-100 text-base leading-tight">{item.name}</p>
                            {item.notes && (
                                <div className="mt-1 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                    <span>Catatan: {item.notes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="p-3 bg-slate-900/60 border-t border-slate-700/40">
                <button 
                    onClick={onDone}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 text-sm"
                >
                    <CheckCircle size={18} />
                    Beri Tanda Selesai
                </button>
            </div>
        </div>
    );
};
