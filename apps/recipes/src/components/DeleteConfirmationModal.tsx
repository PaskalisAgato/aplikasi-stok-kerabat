// No React import needed

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    isDeleting: boolean;
}

export default function DeleteConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    itemName, 
    isDeleting 
}: DeleteConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-[var(--bg-app)]/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-sm glass rounded-[2.5rem] border dark:border-white/10 border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                <div className="p-8 text-center space-y-6">
                    <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-inner">
                        <span className="material-symbols-outlined text-red-500 text-4xl font-black animate-pulse">delete_forever</span>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-xl font-black dark:text-white dark:text-white text-slate-900 uppercase tracking-tight">Hapus Menu?</h3>
                        <p className="text-xs font-bold dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest leading-relaxed opacity-60 px-2">
                            Apakah Anda yakin ingin menghapus <span className="text-red-500">"{itemName}"</span>? Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="h-14 rounded-2xl glass text-[10px] font-black uppercase tracking-[0.2em] dark:text-slate-400 dark:text-slate-400 text-slate-500 hover:dark:bg-white/5 bg-white shadow-sm border border-slate-200 disabled:opacity-50 transition-all active:scale-95"
                        >
                            Batal
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="h-14 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 hover:bg-red-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
                            ) : (
                                <span className="material-symbols-outlined text-lg">delete</span>
                            )}
                            {isDeleting ? 'PROSES...' : 'HAPUS'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
