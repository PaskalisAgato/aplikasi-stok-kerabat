import React, { useState } from 'react';
import { useContainers, type Container } from '@shared/hooks/useContainers';

interface ContainerManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ContainerManagementModal: React.FC<ContainerManagementModalProps> = ({ isOpen, onClose }) => {
    const { data: containersList, isLoading, createContainer, updateContainer } = useContainers();
    const containers = (containersList || []) as unknown as Container[];
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState<Container | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({ name: '', tareWeight: '', qrCode: '' });

    if (!isOpen) return null;

    const filtered = containers.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.qrCode && c.qrCode.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSave = async () => {
        try {
            if (isEditing) {
                await updateContainer({ id: isEditing.id, data: formData });
            } else {
                await createContainer(formData);
            }
            resetForm();
        } catch (err) {
            alert('Gagal menyimpan wadah: ' + (err as any).message);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', tareWeight: '', qrCode: '' });
        setIsEditing(null);
        setIsAdding(false);
    };

    const startEdit = (c: Container) => {
        setFormData({ name: c.name, tareWeight: c.tareWeight, qrCode: c.qrCode || '' });
        setIsEditing(c);
        setIsAdding(true);
    };

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background-app text-main overflow-hidden antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-background-app/80 backdrop-blur-md p-4 border-b border-border-dim justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-main">Master Wadah</h1>
                </div>
                {!isAdding && (
                     <button 
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        TAMBAH
                    </button>
                )}
            </header>

            <main className="flex-1 overflow-y-auto w-full max-w-md mx-auto p-4 space-y-4 pb-24">
                {isAdding ? (
                    <div className="bg-surface border border-border-dim rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-lg font-black text-primary uppercase font-display">
                            {isEditing ? 'Ubah Data Wadah' : 'Wadah Baru'}
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-primary uppercase ml-1 block">Nama Wadah</label>
                                <input 
                                    className="w-full bg-background-app/50 border border-border-dim rounded-xl px-4 h-12 text-sm font-bold text-main focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder="Contoh: Botol Sirup A"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-rose-500 uppercase ml-1 block">Berat Wadah (Tara)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 h-12 text-sm font-bold text-main focus:ring-2 focus:ring-rose-500/50 outline-none"
                                    placeholder="Ex: 250"
                                    value={formData.tareWeight}
                                    onChange={e => setFormData({...formData, tareWeight: e.target.value})}
                                />
                                {isEditing?.isLocked && (
                                    <p className="text-[8px] text-rose-500 font-bold uppercase mt-1 ml-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[10px]">lock</span>
                                        Wadah ini terkunci oleh Admin
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted uppercase ml-1 block">QR Code / RFID (Opsional)</label>
                                <input 
                                    className="w-full bg-background-app/50 border border-border-dim rounded-xl px-4 h-12 text-sm font-bold text-main focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder="Scan container label..."
                                    value={formData.qrCode}
                                    onChange={e => setFormData({...formData, qrCode: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={resetForm} className="flex-1 h-12 rounded-xl bg-muted/10 text-muted font-bold text-sm hover:bg-muted/20 transition-all">
                                BATAL
                            </button>
                            <button onClick={handleSave} className="flex-[2] h-12 rounded-xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all">
                                SIMPAN DATA
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-muted">search</span>
                            <input 
                                className="w-full pl-12 pr-4 h-12 bg-surface border border-border-dim rounded-xl text-sm text-main focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="Cari wadah..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-3">
                            {isLoading ? (
                                <div className="p-12 text-center text-muted animate-pulse font-bold uppercase text-xs tracking-widest">Memuat database wadah...</div>
                            ) : filtered.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => startEdit(c)}
                                    className="bg-surface border border-border-dim p-4 rounded-2xl flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group hover:border-primary/50"
                                >
                                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">{c.qrCode ? 'barcode_scanner' : 'database'}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-main">{c.name}</h3>
                                        <p className="text-xs text-rose-500 font-black tracking-tight">{c.tareWeight}g</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {c.isLocked && <span className="material-symbols-outlined text-rose-500 text-sm">lock</span>}
                                        <span className="material-symbols-outlined text-muted group-hover:text-primary transition-colors">chevron_right</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ContainerManagementModal;
