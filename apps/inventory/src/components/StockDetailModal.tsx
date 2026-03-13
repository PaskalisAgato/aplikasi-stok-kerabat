import React from 'react'; // Final deploy trigger
import { apiClient } from '@shared/apiClient';

interface StockDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItem?: any;
    onEditClick?: () => void;
}

const StockDetailModal: React.FC<StockDetailModalProps> = ({ isOpen, onClose, selectedItem, onEditClick }) => {
    const [movements, setMovements] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (isOpen && selectedItem?.id) {
            fetchHistory();
        }
    }, [isOpen, selectedItem]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await apiClient.getItemMovements(selectedItem.id);
            setMovements(data);
        } catch (err) {
            console.error('Failed to fetch movements', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        /* Full-screen overlay */
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            {/* Bottom Sheet */}
            <div className="w-full bg-background-light dark:bg-background-dark rounded-t-xl shadow-2xl flex flex-col max-h-[92vh] border-t border-primary/20">

                {/* Drag Handle Area (Click to close for now) */}
                <button
                    onClick={onClose}
                    className="flex h-6 w-full items-center justify-center cursor-pointer hover:bg-black/5 rounded-t-xl transition-colors"
                >
                    <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-primary/30" />
                </button>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Header Item Detail */}
                    <div className="flex p-4">
                        <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-between items-start">
                            <div className="flex gap-4 items-center">
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl min-h-[6rem] w-24 bg-primary/10 border border-primary/20"
                                    style={{ backgroundImage: `url('${selectedItem?.imageUrl || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=200&auto=format&fit=crop"}')` }}
                                />
                                <div className="flex flex-col">
                                    <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold leading-tight">{selectedItem?.name || 'Item Name'}</h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`inline-block w-2 h-2 rounded-full ${selectedItem?.status === 'KRITIS' ? 'bg-red-500' : selectedItem?.status === 'HABIS' ? 'bg-slate-500' : 'bg-primary'}`} />
                                        <p className="text-primary font-semibold text-lg">{selectedItem?.currentStock || 0}{selectedItem?.unit || 'kg'} tersisa</p>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Update terakhir: {new Date(selectedItem?.updatedAt || Date.now()).toLocaleDateString('id-ID')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recipe Usage Section */}
                    {/* [Optional Hidden for now until backend support for recipe calculation is ready] */}

                    {/* Stock History Section */}
                    <div className="px-4 py-4 mt-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold tracking-tight">Riwayat Stok</h3>
                            <button onClick={fetchHistory} className="text-primary text-sm font-medium hover:underline">Refresh</button>
                        </div>

                        <div className="space-y-4 pb-20">
                            {isLoading ? (
                                <div className="flex justify-center py-10">
                                    <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                                </div>
                            ) : movements.length > 0 ? (
                                movements.map((m) => (
                                    <div key={m.id} className="flex items-start gap-3">
                                        <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                            m.type === 'IN' ? 'bg-green-500/10' : 'bg-red-500/10'
                                        }`}>
                                            <span className={`material-symbols-outlined text-lg ${
                                                m.type === 'IN' ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                                {m.type === 'IN' ? 'add' : 'remove'}
                                            </span>
                                        </div>
                                        <div className="flex-1 border-b border-slate-200 dark:border-primary/10 pb-3">
                                            <div className="flex justify-between items-center">
                                                <p className="text-slate-900 dark:text-slate-100 font-medium">
                                                    {m.type === 'IN' ? `Restok: ${m.supplierName || 'General'}` : 
                                                     m.type === 'OUT' ? 'Penjualan' : 
                                                     m.type === 'WASTE' ? 'Waste/Rusak' : 'Penyesuaian'}
                                                </p>
                                                <p className={`font-bold ${m.type === 'IN' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {m.type === 'IN' ? '+' : '-'}{m.quantity} {selectedItem?.unit}
                                                </p>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                                {new Date(m.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {m.reason && <p className="text-[10px] italic text-slate-400 mt-1">{m.reason}</p>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-slate-400 text-sm">
                                    Belum ada pergerakan stok tercatat.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sticky Bottom Actions */}
                <div className="p-4 flex gap-3 sticky bottom-0 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-primary/10">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-lg active:scale-95 transition-transform">
                        <span className="material-symbols-outlined">inventory</span>
                        Update Stock
                    </button>
                    <button 
                        onClick={onEditClick}
                        className="flex h-auto px-4 items-center justify-center bg-slate-100 dark:bg-primary/20 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-primary/30 hover:bg-slate-200 dark:hover:bg-primary/30 transition-colors"
                        title="Ubah Data Stok"
                    >
                        <span className="material-symbols-outlined">edit</span>
                    </button>
                </div>

                {/* Bottom Padding for iOS safe area */}
                <div className="h-6 bg-background-light dark:bg-background-dark" />
            </div>
        </div>
    );
};

export default StockDetailModal;
