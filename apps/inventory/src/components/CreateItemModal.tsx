import React, { useState, useRef } from 'react';
import { apiClient } from '@shared/apiClient';
import { compressImage } from '@shared/utils/image';

interface DraftItem {
    id: string; // Internal local ID for mapping
    name: string;
    category: string;
    unit: string;
    minStock: string;
    price: string;
    discount: string;
    idealStock: string;
    containerWeight: string;
    currentStock: string;
    imageBase64: string;
}

interface CreateItemModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateItemModal: React.FC<CreateItemModalProps> = ({ isOpen, onClose }) => {
    const [drafts, setDrafts] = useState<DraftItem[]>([createEmptyDraft()]);
    const [isSaving, setIsSaving] = useState(false);
    
    const activeDraftId = useRef<string | null>(null);

    function createEmptyDraft(): DraftItem {
        return {
            id: Math.random().toString(36).substring(7),
            name: '',
            category: 'Bar',
            unit: 'g',
            minStock: '',
            price: '',
            discount: '',
            idealStock: '',
            containerWeight: '',
            currentStock: '',
            imageBase64: ''
        };
    }

    // Image Picker State
    const [imageMenuOpen, setImageMenuOpen] = useState(false);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleAddRow = () => {
        setDrafts(prev => [...prev, createEmptyDraft()]);
    };

    const handleRemoveRow = (id: string) => {
        if (drafts.length === 1) {
            setDrafts([createEmptyDraft()]);
            return;
        }
        setDrafts(prev => prev.filter(d => d.id !== id));
    };

    const handleFieldChange = (id: string, field: keyof DraftItem, value: string) => {
        setDrafts(prev => prev.map(draft => 
            draft.id === id ? { ...draft, [field]: value } : draft
        ));
    };

    const handleImageTrigger = (id: string, source: 'gallery' | 'camera') => {
        activeDraftId.current = id;
        setImageMenuOpen(false);
        if (source === 'gallery') {
            galleryInputRef.current?.click();
        } else {
            cameraInputRef.current?.click();
        }
    };

    const handleOpenImageMenu = (id: string) => {
        activeDraftId.current = id;
        setImageMenuOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const draftId = activeDraftId.current;
        if (file && draftId) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const originalBase64 = reader.result as string;
                // Apply 300KB compression
                const compressedBlob = await compressImage(originalBase64, { maxSizeKB: 300 });
                const compressedBase64 = await new Promise<string>((resolve) => {
                    const r = new FileReader();
                    r.onloadend = () => resolve(r.result as string);
                    r.readAsDataURL(compressedBlob);
                });
                handleFieldChange(draftId, 'imageBase64', compressedBase64);
                e.target.value = ''; 
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSaveAll = async () => {
        const validDrafts = drafts.filter(d => d.name.trim() !== '');
        
        if (validDrafts.length === 0) {
            alert('Masukkan setidaknya satu nama bahan baku!');
            return;
        }

        setIsSaving(true);
        let successCount = 0;
        let failCount = 0;
        let lastError = '';

        try {
            for (const item of validDrafts) {
                try {
                    // Backend middleware validateBase64Image('imageUrl') will handle Cloudinary
                    await apiClient.addInventoryItem({
                        name: item.name,
                        category: item.category,
                        unit: item.unit,
                        minStock: item.minStock || '0',
                        pricePerUnit: item.price || '0',
                        discountPrice: item.discount || '0',
                        idealStock: item.idealStock || '0',
                        containerWeight: item.containerWeight || '0',
                        currentStock: item.currentStock || '0', 
                        imageUrl: item.imageBase64 // Pass Base64 directly
                    });
                    successCount++;
                } catch (err: any) {
                    console.error(`Failed to save ${item.name}`, err);
                    failCount++;
                    lastError = err.message || 'Koneksi terputus';
                }
            }

            if (failCount === 0) {
                alert(`Berhasil menambahkan ${successCount} bahan baku baru!`);
                setDrafts([createEmptyDraft()]);
                onClose();
            } else {
                alert(`Selesai! ${successCount} Berhasil, ${failCount} Gagal.\n\nKeterangan: ${lastError}\n\nSilakan cek data atau koneksi Anda.`);
                // Keep only failed ones? For now just reset if at least some succeeded to avoid double creation on retry
                if (successCount > 0) {
                    setDrafts([createEmptyDraft()]);
                    onClose();
                }
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full max-w-md bg-background-app rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] border border-border-dim overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b border-border-dim bg-background-app sticky top-0 z-10">
                    <button onClick={onClose} className="text-primary flex size-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined font-bold">close</span>
                    </button>
                    <div className="flex-1 text-center">
                        <h2 className="text-main text-lg font-bold">Tambah Bahan Baku ({drafts.length})</h2>
                        <p className="text-[10px] text-muted uppercase tracking-widest font-semibold">Mode Banyak Barang</p>
                    </div>
                    <button onClick={handleAddRow} className="text-primary flex size-10 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined font-bold">add_box</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                    <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleImageChange} className="hidden" />
                    <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageChange} className="hidden" />

                    {drafts.map((draft, index) => (
                        <div key={draft.id} className="bg-surface rounded-2xl border border-border-dim p-4 relative shadow-sm hover:border-primary/50 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">Item #{index + 1}</span>
                                <button onClick={() => handleRemoveRow(draft.id)} className="text-red-500 hover:bg-red-50 flex size-8 items-center justify-center rounded-full transition-colors">
                                    <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-4">
                                {/* Image Cell */}
                                <div 
                                    className="size-24 sm:size-[100px] mx-auto sm:mx-0 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-primary/5 cursor-pointer relative overflow-hidden group hover:border-primary transition-colors"
                                    onClick={() => handleOpenImageMenu(draft.id)}
                                >
                                    {draft.imageBase64 ? (
                                        <>
                                            <img src={draft.imageBase64} alt="Preview" className="size-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined text-white">edit</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center text-primary/40 group-hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                                        </div>
                                    )}
                                </div>

                                {/* Inputs Grid */}
                                <div className="space-y-6">
                                    {/* Section: Informasi Dasar */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="material-symbols-outlined text-primary text-xs font-black">info</span>
                                            <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">Informasi Dasar</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-muted uppercase ml-1 block">Nama Bahan</label>
                                                <input 
                                                    type="text" 
                                                    value={draft.name} 
                                                    onChange={(e) => handleFieldChange(draft.id, 'name', e.target.value)}
                                                    placeholder="Nama bahannya"
                                                    className="w-full rounded-xl bg-background-app border border-border-dim focus:ring-4 focus:ring-primary/10 focus:border-primary h-12 px-4 text-main text-sm font-bold transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-muted uppercase ml-1 block">Kategori</label>
                                                <select 
                                                    value={draft.category} 
                                                    onChange={(e) => handleFieldChange(draft.id, 'category', e.target.value)}
                                                    className="w-full rounded-xl bg-background-app border border-border-dim focus:ring-4 focus:ring-primary/10 focus:border-primary h-12 px-4 text-main text-sm font-bold transition-all appearance-none"
                                                >
                                                    <option value="Bar">Bar</option>
                                                    <option value="Dapur">Dapur</option>
                                                    <option value="Frezer">Frezer</option>
                                                    <option value="Showcase">Showcase</option>
                                                    <option value="Lainnya">Lainnya</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Pengaturan Stok */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="material-symbols-outlined text-primary text-xs font-black">settings</span>
                                            <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">Pengaturan Stok</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-muted uppercase ml-1 block">Satuan</label>
                                                <select 
                                                    value={draft.unit} 
                                                    onChange={(e) => handleFieldChange(draft.id, 'unit', e.target.value)}
                                                    className="w-full rounded-xl bg-background-app border border-border-dim focus:ring-4 focus:ring-primary/10 focus:border-primary h-12 px-4 text-main text-sm font-bold transition-all appearance-none"
                                                >
                                                    <option value="g">Gram (g)</option>
                                                    <option value="Kg">Kilogram (Kg)</option>
                                                    <option value="L">Liter (lt/L)</option>
                                                    <option value="mL">MiliLiter (ml/mL)</option>
                                                    <option value="pcs">Pieces (pcs)</option>
                                                    <option value="pack">Pack (pack)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-muted uppercase ml-1 block">Min. Stok</label>
                                                <input 
                                                    type="number" 
                                                    value={draft.minStock} 
                                                    onChange={(e) => handleFieldChange(draft.id, 'minStock', e.target.value)}
                                                    placeholder="100"
                                                    min="0"
                                                    className="w-full rounded-xl bg-background-app border border-border-dim focus:ring-4 focus:ring-primary/10 focus:border-primary h-12 px-4 text-main text-sm font-bold transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-primary uppercase ml-1 block font-display">Ideal Prod</label>
                                                <input 
                                                    type="number" 
                                                    value={draft.idealStock} 
                                                    onChange={(e) => handleFieldChange(draft.id, 'idealStock', e.target.value)}
                                                    placeholder="Target"
                                                    min="0"
                                                    className="w-full rounded-xl bg-primary/10 border-2 border-primary/20 focus:ring-4 focus:ring-primary/10 focus:border-primary h-12 px-4 text-main text-sm font-black transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                                <label className="text-[10px] font-black text-rose-500 uppercase ml-1 block">Berat Wadah</label>
                                                <input 
                                                    type="number" 
                                                    value={draft.containerWeight} 
                                                    onChange={(e) => handleFieldChange(draft.id, 'containerWeight', e.target.value)}
                                                    placeholder="Ex: 100"
                                                    min="0"
                                                    className="w-full rounded-xl bg-rose-500/5 border border-rose-500/20 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 h-12 px-4 text-main text-sm font-bold transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-emerald-500 uppercase ml-1 block">Berat Kotor</label>
                                                <input 
                                                    type="number" 
                                                    value={((parseFloat(draft.currentStock) || 0) + (parseFloat(draft.containerWeight) || 0)).toString()} 
                                                    onChange={(e) => {
                                                        const kotor = parseFloat(e.target.value) || 0;
                                                        const wadah = parseFloat(draft.containerWeight) || 0;
                                                        handleFieldChange(draft.id, 'currentStock', Math.max(0, kotor - wadah).toString());
                                                    }}
                                                    placeholder="Kotor"
                                                    min="0"
                                                    className="w-full rounded-xl bg-emerald-500/5 border border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 h-12 px-4 text-main text-sm font-bold transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-blue-500 uppercase ml-1 block">Berat Bersih</label>
                                                <input 
                                                    type="number" 
                                                    value={draft.currentStock} 
                                                    onChange={(e) => handleFieldChange(draft.id, 'currentStock', e.target.value)}
                                                    placeholder="Bersih"
                                                    min="0"
                                                    className="w-full rounded-xl bg-blue-500/5 border border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 h-12 px-4 text-main text-sm font-bold transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-border-dim bg-background-app/80 backdrop-blur-md absolute bottom-0 left-0 right-0">
                    <button 
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className={`w-full ${isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30'} text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all`}
                    >
                        {isSaving ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">save</span>
                                <span>Simpan Semua ({drafts.filter(d=>d.name.trim()!=='').length}) Bahan</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Image Menu Overlay */}
            {imageMenuOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-surface rounded-2xl border border-border-dim p-4 shadow-sm space-y-4">
                        <h3 className="text-center font-bold text-main text-lg mb-4">Pilih Sumber Foto</h3>
                        <button 
                            onClick={() => handleImageTrigger(activeDraftId.current!, 'camera')}
                            className="w-full flex items-center justify-center gap-3 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                        >
                            <span className="material-symbols-outlined">photo_camera</span>
                            Kamera Langsung
                        </button>
                        <button 
                            onClick={() => handleImageTrigger(activeDraftId.current!, 'gallery')}
                            className="w-full flex items-center justify-center gap-3 bg-surface text-main py-3 rounded-xl font-bold hover:bg-primary/10 transition-colors"
                        >
                            <span className="material-symbols-outlined">photo_library</span>
                            Pilih dari Galeri
                        </button>
                        <button 
                            onClick={() => setImageMenuOpen(false)}
                            className="w-full py-3 mt-4 text-muted font-semibold hover:text-main transition-colors"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateItemModal;

