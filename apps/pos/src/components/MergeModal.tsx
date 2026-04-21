import React from 'react';

interface MergeModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetBill: any;
    openBills: any[];
    selectedSourceIds: number[];
    toggleSourceSelection: (id: number) => void;
    performMerge: () => void;
    isCheckingOut: boolean;
}

export const MergeModal: React.FC<MergeModalProps> = ({
    isOpen, onClose, targetBill, openBills,
    selectedSourceIds, toggleSourceSelection,
    performMerge, isCheckingOut
}) => {
    if (!isOpen || !targetBill) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="card max-w-lg w-full max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-white/10">
                <header className="glass p-6 flex justify-between items-center border-b border-white/5">
                    <div>
                        <h3 className="font-black text-xl text-[var(--text-main)] uppercase tracking-widest">Gabung Meja</h3>
                        <p className="text-xs text-primary font-bold mt-1">Menggabungkan ke: {targetBill.customerInfo}</p>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-xl glass hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>
                
                <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-2">Pilih Meja yang Akan Digabung</p>
                    {openBills.filter(b => b.id !== targetBill.id).length === 0 ? (
                        <div className="text-center py-10 opacity-30">
                            <span className="material-symbols-outlined text-4xl mb-2">info</span>
                            <p className="text-xs font-black uppercase tracking-widest">Tidak ada meja lain untuk digabung</p>
                        </div>
                    ) : (
                        openBills.filter(b => b.id !== targetBill.id).map(bill => (
                            <div 
                                key={bill.id}
                                onClick={() => toggleSourceSelection(bill.id)}
                                className={`p-4 rounded-2xl cursor-pointer transition-all group flex items-center justify-between border-2 ${
                                    selectedSourceIds.includes(bill.id)
                                        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10'
                                        : 'bg-[var(--bg-app)] border-[var(--border-dim)] hover:border-primary/50'
                                }`}
                            >
                                <div>
                                    <p className={`text-[11px] font-black uppercase ${selectedSourceIds.includes(bill.id) ? 'text-primary' : 'text-[var(--text-main)]'}`}>
                                        {bill.customerInfo}
                                    </p>
                                    <p className="text-[10px] font-black opacity-60">Rp {parseFloat(bill.totalAmount).toLocaleString('id-ID')}</p>
                                </div>
                                <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    selectedSourceIds.includes(bill.id)
                                        ? 'bg-primary border-primary text-slate-950'
                                        : 'border-[var(--border-dim)]'
                                }`}>
                                    {selectedSourceIds.includes(bill.id) && <span className="material-symbols-outlined font-black text-sm">check</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                <footer className="glass p-6 border-t border-white/5 flex gap-3 shrink-0">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 rounded-xl glass text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest active:scale-95"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={performMerge}
                        disabled={selectedSourceIds.length === 0 || isCheckingOut}
                        className="flex-[2] py-4 bg-primary text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-base">call_merge</span>
                        {isCheckingOut ? 'Memproses...' : `Gabungkan ${selectedSourceIds.length} Meja`}
                    </button>
                </footer>
            </div>
        </div>
    );
};
