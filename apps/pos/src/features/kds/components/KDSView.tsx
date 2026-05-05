import React from 'react';
import { useKdsEvents, KdsOrder } from '../hooks/useKdsEvents';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export const KDSView: React.FC = () => {
    const { orders, markAsDone } = useKdsEvents();

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white p-6">
            <header className="flex justify-between items-center mb-8 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                    <h1 className="text-2xl font-bold tracking-tight">Kitchen Display System</h1>
                </div>
                <div className="flex items-center gap-6 text-slate-400">
                    <div className="flex flex-col items-end">
                        <span className="text-xs uppercase font-semibold tracking-widest text-slate-500">Live Orders</span>
                        <span className="text-xl font-mono text-blue-400">{orders.length}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2 custom-scrollbar">
                {orders.map((order) => (
                    <KdsOrderCard 
                        key={order.id} 
                        order={order} 
                        onDone={() => markAsDone(order.id)} 
                    />
                ))}
                {orders.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-32 text-slate-600 bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-800">
                        <AlertCircle size={64} className="mb-4 opacity-20" />
                        <p className="text-xl font-medium">No pending orders</p>
                        <p className="text-sm opacity-50">Dapur sedang santai. Siap untuk pesanan baru!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const KdsOrderCard: React.FC<{ order: KdsOrder; onDone: () => void }> = ({ order, onDone }) => {
    const minutesElapsed = Math.floor((Date.now() - new Date(order.timestamp).getTime()) / 60000);
    
    // Aesthetic urgency levels
    const isUrgent = minutesElapsed >= 15;
    const isWarning = minutesElapsed >= 10 && minutesElapsed < 15;

    return (
        <div className={clsx(
            "flex flex-col bg-slate-800 rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-lg",
            isUrgent ? "border-rose-500/50 shadow-rose-900/20" : 
            isWarning ? "border-amber-500/50 shadow-amber-900/20" : 
            "border-slate-700/50"
        )}>
            {/* Card Header */}
            <div className={clsx(
                "p-4 flex justify-between items-start",
                isUrgent ? "bg-rose-500/10" : isWarning ? "bg-amber-500/10" : "bg-slate-700/30"
            )}>
                <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">Table / Info</span>
                    <h3 className="text-lg font-bold truncate leading-tight text-white">{order.customerInfo}</h3>
                    <div className="flex items-center gap-1 mt-1 text-slate-400">
                        <span className="text-xs font-mono">#{order.id}</span>
                        {order.type === 'ADDITION' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">ADD</span>
                        )}
                    </div>
                </div>
                <div className={clsx(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
                    isUrgent ? "bg-rose-500 text-white" : 
                    isWarning ? "bg-amber-500 text-slate-900" : 
                    "bg-slate-700 text-slate-300"
                )}>
                    <Clock size={12} />
                    {minutesElapsed}m
                </div>
            </div>

            {/* Items List */}
            <div className="p-4 flex-grow space-y-4">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-white shadow-inner">
                            {item.quantity}
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold text-slate-100 text-base leading-tight">{item.name}</p>
                            {item.notes && (
                                <p className="text-xs text-amber-400 mt-1 italic italic flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
                                    {item.notes}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="p-3 bg-slate-900/50 border-t border-slate-700/30">
                <button 
                    onClick={onDone}
                    className="w-full py-3 bg-green-600 hover:bg-green-500 active:scale-95 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                >
                    <CheckCircle size={18} />
                    Beri Tanda Selesai
                </button>
            </div>
        </div>
    );
};
