import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';

interface EditItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: () => void;
    item: any;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, onUpdated, item }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Biji Kopi');
    const [unit, setUnit] = useState('g');
    const [minStock, setMinStock] = useState('');
    const [imageBase64, setImageBase64] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmDelete, setIsConfirmDelete] = useState(false);

    // Image Picker State
    const [imageMenuOpen, setImageMenuOpen] = useState(false);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && item) {
            setName(item.name || '');
            setCategory(item.category || 'Biji Kopi');
            setUnit(item.unit || 'g');
            setMinStock(item.minStock?.toString() || '');
            setImageBase64(item.imageUrl || '');
        }
    }, [isOpen, item]);

    if (!isOpen || !item) return null;

    const handleImageTrigger = (source: 'gallery' | 'camera') => {
        setImageMenuOpen(false);
        if (source === 'gallery') {
            galleryInputRef.current?.click();
        } else {
            cameraInputRef.current?.click();
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageBase64(reader.result as string);
                e.target.value = ''; // Reset
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDelete = async () => {
        if (!isConfirmDelete) return;
        
        setIsDeleting(true);
        try {
            await apiClient.deleteInventoryItem(item.id);
            alert('Bahan baku berhasil dihapus!');
            if (onUpdated) onUpdated();
            onClose();
        } catch (err) {
            console.error('Failed to delete item', err);
            alert('Gagal menghapus bahan baku. Cek koneksi Anda.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Nama bahan baku tidak boleh kosong!');
            return;
        }

        setIsSaving(true);
        try {
            await apiClient.updateInventoryItem(item.id, {
                name,
                category,
                unit,
                minStock: minStock || '0',
                imageUrl: imageBase64
            });
            alert('Berhasil memperbarui data bahan baku!');
            if (onUpdated) onUpdated();
            onClose();
        } catch (err) {
            console.error('Failed to update item', err);
            alert('Gagal memperbarui data. Cek koneksi Anda.');
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
                    <h2 className="text-main text-lg font-bold">Ubah Data Bahan</h2>
                    <div className="size-10" /> {/* Balancer */}
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                    <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleImageChange} className="hidden" />
                    <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageChange} className="hidden" />

                    <div className="bg-surface rounded-2xl border border-border-dim p-4 shadow-sm">
                        <div className="flex flex-col gap-4">
                            {/* Image Section */}
                            <div className="flex justify-center p-2">
                                <div 
                                    className="size-32 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-primary/5 cursor-pointer relative overflow-hidden group hover:border-primary transition-colors"
                                    onClick={() => setImageMenuOpen(true)}
                                >
                                    {imageBase64 ? (
                                        <>
                                            <img src={imageBase64} alt="Preview" className="size-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined text-white text-3xl">edit</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center text-primary/40 group-hover:text-primary transition-colors flex flex-col items-center">
                                            <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                                            <span className="text-xs font-semibold">Tukar Foto</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase ml-1 block mb-1">Nama Bahan</label>
                                    <input 
                                        type="text" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Nama bahan"
                                        className="w-full rounded-xl bg-slate-100  border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary h-12 px-4 text-slate-900  text-sm font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-muted uppercase ml-1 block mb-1">Kategori</label>
                                    <select 
                                        value={category} 
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full rounded-xl bg-background-app border border-border-dim focus:border-primary/50 focus:ring-1 focus:ring-primary h-12 px-4 text-main text-sm font-medium appearance-none"
                                    >
                                        <option value="Biji Kopi">Biji Kopi</option>
                                        <option value="Susu & Krimer">Susu & Krimer</option>
                                        <option value="Sirup & Perasa">Sirup & Perasa</option>
                                        <option value="Packaging">Packaging</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase ml-1 block mb-1">Satuan</label>
                                        <select 
                                            value={unit} 
                                            onChange={(e) => setUnit(e.target.value)}
                                            className="w-full rounded-xl bg-background-app border border-border-dim focus:border-primary/50 focus:ring-1 focus:ring-primary h-12 px-4 text-main text-sm font-medium appearance-none"
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
                                        <label className="text-xs font-bold text-muted uppercase ml-1 block mb-1">Min. Stok</label>
                                        <input 
                                            type="number" 
                                            value={minStock} 
                                            onChange={(e) => setMinStock(e.target.value)}
                                            placeholder="Batas peringatan"
                                            min="0"
                                            className="w-full rounded-xl bg-background-app border border-border-dim focus:border-primary/50 focus:ring-1 focus:ring-primary h-12 px-4 text-main text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="mt-8 bg-red-50/50 rounded-2xl border border-red-200 p-6 space-y-4 mb-20">
                        <div className="flex items-center gap-3 text-red-600">
                            <span className="material-symbols-outlined font-bold">warning</span>
                            <h3 className="font-bold uppercase tracking-wider text-xs">Zona Bahaya</h3>
                        </div>
                        <p className="text-[11px] text-red-800 font-medium leading-relaxed">
                            Menghapus bahan baku akan menghilangkan semua riwayat stok terkait. Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={isConfirmDelete}
                                    onChange={(e) => setIsConfirmDelete(e.target.checked)}
                                    className="peer appearance-none size-5 rounded-md border-2 border-red-200 checked:bg-red-500 checked:border-red-500 transition-all cursor-pointer"
                                />
                                <span className="material-symbols-outlined absolute text-white text-sm opacity-0 peer-checked:opacity-100 pointer-events-none left-1/2 -translate-x-1/2 font-bold">check</span>
                            </div>
                            <span className="text-[11px] font-bold text-red-700 select-none group-hover:text-red-500 transition-colors">Saya yakin ingin menghapus bahan ini</span>
                        </label>
                        <button 
                            onClick={handleDelete}
                            disabled={!isConfirmDelete || isDeleting}
                            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                isConfirmDelete && !isDeleting
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-200 active:scale-[0.98]' 
                                    : 'bg-red-100 text-red-300 cursor-not-allowed'
                            }`}
                        >
                            {isDeleting ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                                    <span>Menghapus...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                                    <span>Hapus Bahan Baku</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-border-dim bg-background-app/80 backdrop-blur-md absolute bottom-0 left-0 right-0">
                    <button 
                        onClick={handleSave}
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
                                <span>Simpan Perubahan</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Image Menu Overlay */}
            {imageMenuOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background-app w-full max-w-xs rounded-2xl p-6 shadow-2xl border border-border-dim space-y-4">
                        <h3 className="text-center font-bold text-main text-lg mb-4">Pilih Sumber Foto</h3>
                        <button 
                            onClick={() => handleImageTrigger('camera')}
                            className="w-full flex items-center justify-center gap-3 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                        >
                            <span className="material-symbols-outlined">photo_camera</span>
                            Kamera Langsung
                        </button>
                        <button 
                            onClick={() => handleImageTrigger('gallery')}
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

export default EditItemModal;

