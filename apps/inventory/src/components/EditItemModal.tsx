import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import { compressImage } from '@shared/utils/image';
import { useContainers, type Container } from '@shared/hooks/useContainers';

interface EditItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: () => void;
    item: any;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, onUpdated, item }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Bar');
    const [unit, setUnit] = useState('g');
    const [minStock, setMinStock] = useState('');
    const [idealStock, setIdealStock] = useState('');
    const [imageBase64, setImageBase64] = useState('');
    const [currentStock, setCurrentStock] = useState('');
    const [containerWeight, setContainerWeight] = useState('0');
    const [containerId, setContainerId] = useState<number | undefined>(undefined);
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [discountPrice, setDiscountPrice] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmDelete, setIsConfirmDelete] = useState(false);
    const [isConfirmSave, setIsConfirmSave] = useState(false);
    const { data: containersList } = useContainers();
    const containers = (containersList || []) as unknown as Container[];

    // Image Picker State
    const [imageMenuOpen, setImageMenuOpen] = useState(false);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && item) {
            setName(item.name || '');
            setCategory(item.category || 'Bar');
            setUnit(item.unit || 'g');
            setMinStock(item.minStock?.toString() || '');
            setImageBase64(item.imageUrl || '');
            setCurrentStock(item.currentStock?.toString() || '0');
            setContainerWeight(item.containerWeight?.toString() || '0');
            setContainerId(item.containerId || undefined);
            setIdealStock(item.idealStock?.toString() || '0');
            setPricePerUnit(item.pricePerUnit?.toString() || '0');
            setDiscountPrice(item.discountPrice?.toString() || '0');
            
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
            reader.onloadend = async () => {
                const originalBase64 = reader.result as string;
                // Apply 300KB compression
                const compressedBlob = await compressImage(originalBase64, { maxSizeKB: 300 });
                const compressedBase64 = await new Promise<string>((resolve) => {
                    const r = new FileReader();
                    r.onloadend = () => resolve(r.result as string);
                    r.readAsDataURL(compressedBlob);
                });
                setImageBase64(compressedBase64);
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
        const p = parseFloat(pricePerUnit) || 0;
        const d = parseFloat(discountPrice) || 0;

        if (!name.trim()) {
            alert('Nama bahan baku tidak boleh kosong!');
            return;
        }
        if (p < 0) {
            alert('Harga beli tidak boleh negatif');
            return;
        }
        if (d < 0) {
            alert('Harga diskon tidak boleh negatif');
            return;
        }
        if (d > p) {
            alert('Harga diskon tidak boleh melebihi harga beli');
            return;
        }

        if (!isConfirmSave) {
            setIsConfirmSave(true);
            return;
        }

        setIsSaving(true);
        try {
            const updateData: any = {
                name,
                category,
                unit,
                minStock: minStock || '0',
                idealStock: idealStock || '0',
                imageUrl: imageBase64, // Pass Base64 directly
                containerWeight: containerWeight || '0',
                containerId: containerId,
                pricePerUnit: p,
                discountPrice: d
            };

            // Deduction logic: If user changed currentStock, we treat it as Physical (Gross) Stock
            // and the backend will subtract the container weight.
            const newStockVal = Math.max(0, parseFloat(currentStock));
            const oldStockVal = parseFloat(item.currentStock || '0');
            if (newStockVal !== oldStockVal) {
                updateData.physicalStock = newStockVal;
            }

            await apiClient.updateInventoryItem(item.id, updateData);
            // Show custom success Toast or Alert eventually, using alert for now
            alert('Berhasil memperbarui data!');
            if (onUpdated) onUpdated();
            onClose();
            setIsConfirmSave(false);
        } catch (err: any) {
            console.error('Failed to update item', err);
            alert(err.message || 'Gagal memperbarui data. Cek koneksi Anda.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleKotorChange = (val: string) => {
        const kotor = parseFloat(val) || 0;
        const wadah = parseFloat(containerWeight) || 0;
        setCurrentStock(Math.max(0, kotor - wadah).toString());
    };

    const handleBersihChange = (val: string) => {
        setCurrentStock(val);
    };

    const kotorDisplay = (parseFloat(currentStock) || 0) + (parseFloat(containerWeight) || 0);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center dark:bg-black bg-white/60 backdrop-blur-sm p-0 sm:p-4">
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
                        <div className="flex flex-col gap-8">
                            {/* Image Section */}
                            <div className="flex justify-center">
                                <div 
                                    className="size-40 rounded-3xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-primary/5 cursor-pointer relative overflow-hidden group hover:border-primary transition-all shadow-inner"
                                    onClick={() => setImageMenuOpen(true)}
                                >
                                    {imageBase64 ? (
                                        <>
                                            <img src={imageBase64} alt="Preview" className="size-full object-cover" />
                                            <div className="absolute inset-0 dark:bg-black bg-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined dark:text-white dark:text-white text-slate-900 text-4xl">edit</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center text-primary/40 group-hover:text-primary transition-colors flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Tukar Foto</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section: Informasi Bahan */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <span className="material-symbols-outlined text-primary text-xs font-black">info</span>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Informasi Bahan</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-muted uppercase ml-1 block">Nama Bahan</label>
                                        <input 
                                            type="text" 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nama bahan"
                                            className="w-full rounded-xl bg-background-app border border-border-dim focus:ring-4 focus:ring-primary/10 focus:border-primary h-12 px-4 text-main text-sm font-bold transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-muted uppercase ml-1 block">Kategori</label>
                                        <select 
                                            value={category} 
                                            onChange={(e) => setCategory(e.target.value)}
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
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 px-1">
                                    <span className="material-symbols-outlined text-primary text-xs font-black">settings</span>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Pengaturan Stok & Satuan</p>
                                </div>

                                {/* Primary Stock Fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-muted uppercase ml-1 block">Satuan</label>
                                        <select 
                                            value={unit} 
                                            onChange={(e) => setUnit(e.target.value)}
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
                                            value={minStock} 
                                            onChange={(e) => setMinStock(e.target.value)}
                                            placeholder="Alarm"
                                            min="0"
                                            className="w-full rounded-xl bg-background-app border border-border-dim focus:ring-4 focus:ring-primary/10 focus:border-primary h-12 px-4 text-main text-sm font-bold transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-primary uppercase ml-1 block font-display">Ideal Prod</label>
                                        <input 
                                            type="number" 
                                            value={idealStock} 
                                            onChange={(e) => setIdealStock(e.target.value)}
                                            placeholder="Target"
                                            className="w-full rounded-xl bg-primary/10 border-2 border-primary/20 focus:ring-4 focus:ring-primary/10 focus:border-primary h-12 px-4 text-main text-sm font-black transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Weight Calculation Section */}
                                <div className="p-4 bg-background-app sm:bg-surface rounded-2xl border border-border-dim/50 space-y-6 shadow-sm">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-rose-500 uppercase ml-1 block font-display">Wadah (Master Data)</label>
                                        <select 
                                            value={containerId || ''} 
                                            onChange={(e) => {
                                                const id = e.target.value ? parseInt(e.target.value) : undefined;
                                                const container = containers.find(c => c.id === id);
                                                setContainerId(id);
                                                if (container) setContainerWeight(container.tareWeight);
                                            }}
                                            className="w-full rounded-xl bg-rose-500/10 border-2 border-rose-500/20 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 h-12 px-4 text-main text-sm font-bold transition-all appearance-none"
                                        >
                                            <option value="">-- Manual / Tanpa Master --</option>
                                            {containers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} ({c.tareWeight}g)</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-rose-500 uppercase ml-1 block font-display">Berat Wadah (g)</label>
                                            <input 
                                                type="number" 
                                                value={containerWeight} 
                                                onChange={(e) => setContainerWeight(e.target.value)}
                                                placeholder="Wadah"
                                                disabled={!!containerId}
                                                className={`w-full rounded-xl ${containerId ? 'bg-muted/10 opacity-50 cursor-not-allowed' : 'bg-rose-500/10 border-2 border-rose-500/20'} focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 h-12 px-4 text-main text-sm font-black transition-all font-display shadow-sm`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-emerald-500 uppercase ml-1 block font-display">Berat Kotor</label>
                                            <input 
                                                type="number" 
                                                value={kotorDisplay.toString()} 
                                                onChange={(e) => handleKotorChange(e.target.value)}
                                                placeholder="Kotor"
                                                className="w-full rounded-xl bg-emerald-500/5 border-2 border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 h-12 px-4 text-main text-sm font-bold transition-all font-display shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-blue-500 uppercase ml-1 block font-display">Berat Bersih</label>
                                            <div className="relative group">
                                                <input 
                                                    type="number" 
                                                    value={currentStock} 
                                                    onChange={(e) => handleBersihChange(e.target.value)}
                                                    placeholder="Bersih"
                                                    className="w-full rounded-xl bg-blue-500/5 border-2 border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 h-12 px-4 text-main text-sm font-bold transition-all font-display shadow-sm"
                                                />
                                                {parseFloat(currentStock) > 0 && (
                                                    <div className="mt-2 ml-1">
                                                        <p className="text-[8px] font-black text-blue-600 uppercase tracking-tighter opacity-80">
                                                            NET WEIGHT: {Number(parseFloat(currentStock).toFixed(2))} {unit}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="text-[9px] font-medium text-muted italic ml-1">
                                    * Mengubah "Stok Fisik" akan otomatis mencatat riwayat penyesuaian (Adjustment).
                                </p>
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
                                <span className="material-symbols-outlined absolute dark:text-white dark:text-white text-slate-900 text-sm opacity-0 peer-checked:opacity-100 pointer-events-none left-1/2 -translate-x-1/2 font-bold">check</span>
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center dark:bg-black bg-white/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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

            {/* Confirmation Save Overlay */}
            {isConfirmSave && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center dark:bg-black bg-white/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background-app w-full max-w-xs rounded-2xl p-6 shadow-2xl border border-border-dim space-y-4">
                        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-primary text-3xl">help</span>
                        </div>
                        <h3 className="text-center font-bold text-main text-lg">Konfirmasi Perubahan</h3>
                        <p className="text-center text-muted text-xs leading-relaxed px-2">
                            Apakah Anda yakin ingin memperbarui harga dan data bahan baku ini?
                        </p>
                        <div className="flex flex-col gap-3 pt-4">
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 flex items-center justify-center gap-2"
                            >
                                {isSaving ? <span className="material-symbols-outlined animate-spin">refresh</span> : null}
                                Ya, Simpan
                            </button>
                            <button 
                                onClick={() => setIsConfirmSave(false)}
                                disabled={isSaving}
                                className="w-full py-3 text-muted font-bold hover:text-main transition-colors"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditItemModal;

