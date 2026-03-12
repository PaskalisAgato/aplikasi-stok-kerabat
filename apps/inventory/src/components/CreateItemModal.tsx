import React, { useState, useRef } from 'react';
import { apiClient } from '@shared/apiClient';

interface CreateItemModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateItemModal: React.FC<CreateItemModalProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Biji Kopi');
    const [unit, setUnit] = useState('g');
    const [price, setPrice] = useState('');
    const [discount, setDiscount] = useState('');
    const [imageBase64, setImageBase64] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Explicitly type the ref to avoid TypeScript errors
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Convert to Base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Nama bahan wajib diisi!');
            return;
        }

        setIsSaving(true);
        try {
            await apiClient.addInventoryItem({
                name,
                category,
                unit,
                pricePerUnit: price || '0',
                discountPrice: discount || '0',
                imageUrl: imageBase64 // Sending base64 string
            });

            alert('Bahan baru berhasil ditambahkan!');
            
            // Reset form
            setName('');
            setCategory('Biji Kopi');
            setUnit('g');
            setPrice('');
            setDiscount('');
            setImageBase64('');
            
            onClose();
        } catch (error) {
            console.error('Save failed', error);
            alert('Gagal menyimpan bahan: ' + (error as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-background-light dark:bg-background-dark rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border border-primary/20 overflow-hidden">
                <header className="flex items-center p-4 border-b border-slate-200 dark:border-primary/20">
                    <button onClick={onClose} className="text-primary flex size-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold flex-1 ml-2 text-center mr-10">Buat Bahan Baru</h2>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Image Upload Area */}
                    <div className="flex flex-col items-center gap-2">
                        <div 
                            className="size-32 rounded-xl border-2 border-dashed border-primary/40 flex items-center justify-center bg-primary/5 cursor-pointer relative overflow-hidden group hover:border-primary transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {imageBase64 ? (
                                <>
                                    <img src={imageBase64} alt="Preview" className="size-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-white">edit</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-primary/60 group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                                    <p className="text-xs font-semibold mt-1">Upload Foto</p>
                                </div>
                            )}
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            onChange={handleImageChange} 
                            className="hidden" 
                        />
                    </div>

                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-primary/70 uppercase ml-1 block mb-1">Nama Bahan</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contoh: Kopi Arabika Gayo"
                                className="w-full rounded-xl bg-slate-100 dark:bg-primary/10 border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary h-12 px-4 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-primary/70 uppercase ml-1 block mb-1">Kategori</label>
                                <select 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full rounded-xl bg-slate-100 dark:bg-primary/10 border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary h-12 px-4 text-slate-900 dark:text-slate-100 appearance-none"
                                >
                                    <option value="Biji Kopi">Biji Kopi</option>
                                    <option value="Susu & Krimer">Susu & Krimer</option>
                                    <option value="Sirup & Perasa">Sirup & Perasa</option>
                                    <option value="Packaging">Packaging</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-primary/70 uppercase ml-1 block mb-1">Satuan</label>
                                <select 
                                    value={unit} 
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-full rounded-xl bg-slate-100 dark:bg-primary/10 border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary h-12 px-4 text-slate-900 dark:text-slate-100 appearance-none"
                                >
                                    <option value="g">Gram (g)</option>
                                    <option value="Kg">Kilogram (Kg)</option>
                                    <option value="L">Liter (L)</option>
                                    <option value="mL">MiliLiter (mL)</option>
                                    <option value="pcs">Pcs</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-primary/70 uppercase ml-1 block mb-1">Harga Beli (Rp)</label>
                                <input 
                                    type="number" 
                                    value={price} 
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0"
                                    className="w-full rounded-xl bg-slate-100 dark:bg-primary/10 border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary h-12 px-4 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-primary/70 uppercase ml-1 block mb-1">Harga Diskon (Rp)</label>
                                <input 
                                    type="number" 
                                    value={discount} 
                                    onChange={(e) => setDiscount(e.target.value)}
                                    placeholder="0 (Opsional)"
                                    className="w-full rounded-xl bg-slate-100 dark:bg-primary/10 border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary h-12 px-4 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-primary/20 bg-background-light dark:bg-background-dark">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className={`w-full ${isSaving || !name.trim() ? 'bg-slate-400' : 'bg-primary hover:bg-primary/90'} text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all`}
                    >
                        {isSaving ? (
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                        ) : (
                            <span className="material-symbols-outlined">add_circle</span>
                        )}
                        {isSaving ? 'Menyimpan...' : 'Simpan Bahan Baru'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateItemModal;
