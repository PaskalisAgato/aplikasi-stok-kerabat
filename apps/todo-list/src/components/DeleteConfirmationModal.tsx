// No React import needed

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

export default function DeleteConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title,
    message
}: DeleteConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            
            <div className="relative w-full max-w-sm bg-surface rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                <div className="p-8 text-center space-y-6">
                    <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-inner">
                        <span className="material-symbols-outlined text-red-500 text-4xl font-black animate-pulse">delete_forever</span>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-main uppercase tracking-tight">{title}</h3>
                        <p className="text-xs font-bold text-muted uppercase tracking-widest leading-relaxed opacity-60 px-2">
                            {message}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="h-14 rounded-2xl glass text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:bg-white/5 transition-all active:scale-95"
                        >
                            Batal
                        </button>
                        <button
                            onClick={onConfirm}
                            className="h-14 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95"
                        >
                            HAPUS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
