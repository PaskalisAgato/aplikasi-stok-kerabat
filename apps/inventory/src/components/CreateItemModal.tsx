import React, { useState, useRef } from 'react';
import { apiClient } from '@shared/apiClient';

interface DraftItem {
    id: string; // Internal local ID for mapping
    name: string;
    category: string;
    unit: string;
    minStock: string;
    price: string;
    discount: string;
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
            category: 'Biji Kopi',
            unit: 'g',
            minStock: '',
            price: '',
            discount: '',
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
            reader.onloadend = () => {
                handleFieldChange(draftId, 'imageBase64', reader.result as string);
                e.target.value = ''; // Reset input to allow same file again if needed
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

        try {
            for (const item of validDrafts) {
                try {
                    await apiClient.addInventoryItem({
                        name: item.name,
                        category: item.category,
                        unit: item.unit,
                        minStock: item.minStock || '0',
                        pricePerUnit: item.price || '0',
                        discountPrice: item.discount || '0',
                        imageUrl: item.imageBase64
                    });
                    successCount++;
                } catch (err) {
                    console.error(`Failed to save ${item.name}`, err);
                    failCount++;
                }
            }

            if (failCount === 0) {
                alert(`Berhasil menambahkan ${successCount} bahan baku baru!`);
                setDrafts([createEmptyDraft()]);
                onClose();
            } else {
                alert(`Selesai! ${successCount} Berhasil, ${failCount} Gagal. Silakan cek koneksi Anda.`);
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
            <div className="w-full max-w-2xl bg-background-light  rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col h-[92vh] sm:h-auto sm:max-h-[85vh] border border-primary/20 overflow-hidden">
                <header className="flex items-center p-4 border-b border-slate-200  bg-background-light  sticky top-0 z-10">
                    <button onClick={onClose} className="text-primary flex size-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined font-bold">close</span>
                    </button>
                    <div className="flex-1 text-center">
                        <h2 className="text-slate-900  text-lg font-bold">Tambah Bahan Baku ({drafts.length})</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Mode Banyak Barang</p>
                    </div>
                    <button onClick={handleAddRow} className="text-primary flex size-10 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined font-bold">add_box</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                    <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleImageChange} className="hidden" />
                    <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageChange} className="hidden" />

                    {drafts.map((draft, index) => (
                        <div key={draft.id} className="bg-white  rounded-2xl border border-slate-200  p-4 relative shadow-sm hover:border-primary/30 transition-colors">
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
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400  uppercase ml-1 block mb-1">Nama Bahan</label>
                                        <input 
                                            type="text" 
                                            value={draft.name} 
                                            onChange={(e) => handleFieldChange(draft.id, 'name', e.target.value)}
                                            placeholder="Nama bahannya apa?"
                                            className="w-full rounded-xl bg-slate-100  border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary h-11 px-4 text-slate-900  text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400  uppercase ml-1 block mb-1">Kategori</label>
                                            <select 
                                                value={draft.category} 
                                                onChange={(e) => handleFieldChange(draft.id, 'category', e.target.value)}
                                                className="w-full rounded-xl bg-slate-100  border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary h-11 px-3 text-slate-900  text-sm appearance-none"
                                            >
                                                <option value="Biji Kopi">Biji Kopi</option>
                                                <option value="Susu & Krimer">Susu & Krimer</option>
                                                <option value="Sirup & Perasa">Sirup & Perasa</option>
                                                <option value="Packaging">Packaging</option>
                                                <option value="Lainnya">Lainnya</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400  uppercase ml-1 block mb-1">Satuan</label>
                                            <select 
                                                value={draft.unit} 
                                                onChange={(e) => handleFieldChange(draft.id, 'unit', e.target.value)}
                                                className="w-full rounded-xl bg-slate-100  border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary h-11 px-3 text-slate-900  text-sm appearance-none"
                                            >
                                                <option value="g">Gram (g)</option>
                                                <option value="Kg">Kilogram (Kg)</option>
                                                <option value="L">Liter (lt/L)</option>
                                                <option value="mL">MiliLiter (ml/mL)</option>
                                                <option value="pcs">Pieces (pcs)</option>
                                                <option value="pack">Pack (pack)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400  uppercase ml-1 block mb-1">Minimum Stok</label>
                                            <input 
                                                type="number" 
                                                value={draft.minStock} 
                                                onChange={(e) => handleFieldChange(draft.id, 'minStock', e.target.value)}
                                                placeholder="Batas peringatan"
                                                min="0"
                                                className="w-full rounded-xl bg-slate-100  border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary h-11 px-4 text-slate-900  text-sm"
                                            />
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-200  bg-white/80  backdrop-blur-md absolute bottom-0 left-0 right-0">
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
                    <div className="bg-white  w-full max-w-xs rounded-2xl p-6 shadow-2xl border border-slate-200  space-y-4">
                        <h3 className="text-center font-bold text-slate-900  text-lg mb-4">Pilih Sumber Foto</h3>
                        <button 
                            onClick={() => handleImageTrigger(activeDraftId.current!, 'camera')}
                            className="w-full flex items-center justify-center gap-3 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                        >
                            <span className="material-symbols-outlined">photo_camera</span>
                            Kamera Langsung
                        </button>
                        <button 
                            onClick={() => handleImageTrigger(activeDraftId.current!, 'gallery')}
                            className="w-full flex items-center justify-center gap-3 bg-slate-100  text-slate-700  py-3 rounded-xl font-bold hover:bg-slate-200  transition-colors"
                        >
                            <span className="material-symbols-outlined">photo_library</span>
                            Pilih dari Galeri
                        </button>
                        <button 
                            onClick={() => setImageMenuOpen(false)}
                            className="w-full py-3 mt-4 text-slate-400 font-semibold hover:text-slate-500 transition-colors"
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

