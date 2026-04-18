import React from 'react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    itemName,
    isDeleting = false 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center dark:bg-black bg-white/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background-app w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border-dim space-y-6 flex flex-col items-center text-center">
                <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-red-500 animate-pulse">warning</span>
                </div>
                
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-main uppercase tracking-tight">Hapus Bahan Baku?</h3>
                    <p className="text-sm text-muted font-medium leading-relaxed px-2">
                        Anda akan menghapus <span className="text-main font-bold">"{itemName}"</span> secara permanen beserta seluruh riwayat stoknya.
                    </p>
                </div>

                <div className="flex flex-col w-full gap-3 pt-2">
                    <button 
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                            isDeleting ? 'bg-slate-200 text-slate-400' : 'bg-red-500 text-white shadow-xl shadow-red-500/20 active:scale-95'
                        }`}
                    >
                        {isDeleting ? (
                            <span className="material-symbols-outlined animate-spin text-lg font-black">refresh</span>
                        ) : (
                            <span className="material-symbols-outlined text-lg font-black">delete_forever</span>
                        )}
                        {isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
                    </button>
                    
                    <button 
                        onClick={onClose}
                        disabled={isDeleting}
                        className="w-full py-4 text-muted font-black text-[10px] uppercase tracking-widest hover:text-main transition-colors active:scale-95 disabled:opacity-50"
                    >
                        Batalkan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
