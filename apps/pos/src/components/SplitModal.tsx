import React from 'react';

interface SplitModalProps {
    isOpen: boolean;
    onClose: () => void;
    splitSourceBill: any;
    splitMode: 'table' | 'pay';
    splitTargetInfo: string;
    setSplitTargetInfo: (info: string) => void;
    selectedSplitItems: Record<number, number>;
    setSelectedSplitItems: React.Dispatch<React.SetStateAction<Record<number, number>>>;
    performSplit: () => void;
    isCheckingOut: boolean;
}

export const SplitModal: React.FC<SplitModalProps> = ({
    isOpen, onClose, splitSourceBill, splitMode,
    splitTargetInfo, setSplitTargetInfo,
    selectedSplitItems, setSelectedSplitItems,
    performSplit, isCheckingOut
}) => {
    if (!isOpen || !splitSourceBill) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="card max-w-xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-white/10">
                <header className="glass p-6 flex justify-between items-center border-b border-white/5">
                    <div>
                        <h3 className="font-black text-xl text-[var(--text-main)] uppercase tracking-widest">
                            {splitMode === 'pay' ? 'Pisah Bayar' : 'Pisah Meja'}
                        </h3>
                        <p className="text-xs text-primary font-bold mt-1">Sumber: {splitSourceBill.customerInfo}</p>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-xl glass hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>
                
                <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
                            {splitMode === 'pay' ? 'Keterangan Pembayaran' : 'Nama Meja Baru'}
                        </label>
                        <input 
                            type="text"
                            value={splitTargetInfo}
                            onChange={(e) => setSplitTargetInfo(e.target.value)}
                            className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] p-4 rounded-xl text-sm font-bold focus:border-primary outline-none transition-all uppercase"
                            placeholder="Contoh: Meja 1A / Split"
                        />
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">Pilih Item & Jumlah</p>
                    <div className="space-y-2">
                        {splitSourceBill.items && splitSourceBill.items.map((item: any) => {
                            const maxQty = parseInt(item.quantity);
                            const selectedQty = selectedSplitItems[item.id] || 0;
                            
                            return (
                                <div key={item.id} className="bg-[var(--bg-app)] border border-[var(--border-dim)] p-4 rounded-2xl flex items-center justify-between">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <p className="text-[11px] font-black text-[var(--text-main)] truncate uppercase">{item.recipeName}</p>
                                        <p className="text-[10px] font-black opacity-50">Rp {parseFloat(item.recipePrice).toLocaleString('id-ID')} x {maxQty}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setSelectedSplitItems(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                                            className="size-8 rounded-lg glass flex items-center justify-center hover:bg-primary/20 transition-all font-black"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center font-black text-sm">{selectedQty}</span>
                                        <button 
                                            onClick={() => setSelectedSplitItems(prev => ({ ...prev, [item.id]: Math.min(maxQty, (prev[item.id] || 0) + 1) }))}
                                            className="size-8 rounded-lg glass flex items-center justify-center hover:bg-primary/20 transition-all font-black"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <footer className="glass p-6 border-t border-white/5 flex gap-3 shrink-0">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 rounded-xl glass text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest active:scale-95"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={performSplit}
                        disabled={isCheckingOut || Object.values(selectedSplitItems).every(q => q === 0)}
                        className="flex-[2] py-4 bg-primary text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-base">content_cut</span>
                        {isCheckingOut ? 'Memproses...' : splitMode === 'pay' ? 'Pilih & Lanjut Bayar' : 'Pisah Meja'}
                    </button>
                </footer>
            </div>
        </div>
    );
};
