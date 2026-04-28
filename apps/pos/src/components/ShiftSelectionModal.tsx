import React from 'react';

interface ShiftSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    shifts: any[];
    onSelect: (shift: any) => void;
}

export const ShiftSelectionModal: React.FC<ShiftSelectionModalProps> = ({ isOpen, onClose, shifts, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-[var(--secondary)] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl text-primary">account_tree</span>
                    </div>
                    <h2 className="text-xl font-black text-[#fefae0] uppercase tracking-wider">Pilih Kasir Berjalan</h2>
                    <p className="text-[var(--text-muted)] text-sm mt-2">Pilih shift kasir untuk mencatat transaksi ini sebagai Admin.</p>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {shifts.length === 0 ? (
                        <p className="text-center text-xs text-[var(--text-muted)] italic py-10">Tidak ada kasir aktif saat ini.</p>
                    ) : shifts.map((shift) => (
                        <button
                            key={shift.id}
                            onClick={() => {
                                onSelect(shift);
                                onClose();
                            }}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                            <div className="text-left">
                                <p className="font-black text-[#fefae0] uppercase text-sm group-hover:text-primary transition-colors">{shift.userName}</p>
                                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Shift ID: {shift.id} • Mulai: {new Date(shift.startTime).toLocaleTimeString()}</p>
                            </div>
                            <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-all">chevron_right</span>
                        </button>
                    ))}
                    <button
                        onClick={onClose}
                        className="w-full p-4 rounded-2xl bg-primary/10 text-primary font-black uppercase text-xs tracking-widest hover:bg-primary hover:text-white transition-all mt-4"
                    >
                        Batalkan
                    </button>
                </div>
            </div>
        </div>
    );
};
