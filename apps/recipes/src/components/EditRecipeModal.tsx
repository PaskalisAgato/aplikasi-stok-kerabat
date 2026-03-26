"use client";

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@shared/apiClient';
import type { Recipe } from '@shared/mockDatabase';

interface Ingredient {
    id: number;
    name: string;
    pricePerG: number;
    unit: string;
    qty: number;
    purchasePrice?: number;
    purchaseQty?: number;
    isPriceModified?: boolean;
}

interface EditRecipeModalProps {
    recipe: Recipe;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

function formatRp(n: number) {
    return 'Rp ' + n.toLocaleString('id-ID');
}

export default function EditRecipeModal({ recipe, onClose, onSave }: EditRecipeModalProps) {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [namaResep, setNamaResep] = useState(recipe.name || '');
    const [category, setCategory] = useState(recipe.category || 'Minuman');
    const [overhead, setOverhead] = useState(10); // Default overhead
    const [hargaJual, setHargaJual] = useState(recipe.price);
    const [showAddIngredient, setShowAddIngredient] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [inventoryData, setInventoryData] = useState<any[]>([]); // Results from search
    const [initialInventoryData, setInitialInventoryData] = useState<any[]>([]); // Data for current recipe ingredients
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch initial ingredients data for the current recipe
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!recipe.ingredients || recipe.ingredients.length === 0) return;
            
            try {
                const ids = recipe.ingredients.map(ing => ing.ingredientId).join(',');
                const res = await apiClient.getInventory(100, 0, '', '', ids);
                setInitialInventoryData(res.data || []);
            } catch (err) {
                console.error("Failed to fetch initial inventory data", err);
            }
        };

        fetchInitialData();
    }, [recipe.ingredients]); // Only run if ingredients list changes

    // Fetch inventory results based on search term or initial open
    useEffect(() => {
        const fetchSearchResults = async () => {
            // If search is too short, but we want to show "initial" items when search is empty
            if (debouncedSearch && debouncedSearch.trim().length < 2) {
                setInventoryData([]);
                setSearchError(null);
                return;
            }

            // Race Condition Guard
            abortControllerRef.current?.abort();
            const controller = new AbortController();
            abortControllerRef.current = controller;

            setIsSearching(true);
            setSearchError(null);
            
            try {
                // If no search, fetch first 20 items as "default" list
                const res = await apiClient.getInventory(20, 0, debouncedSearch || '', '', '', controller.signal);
                setInventoryData(res.data || []);
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error("Search failed", err);
                setSearchError("Gagal mencari bahan baku.");
                setInventoryData([]);
            } finally {
                if (abortControllerRef.current === controller) {
                    setIsSearching(false);
                }
            }
        };

        // We fetch if searching OR if the modal/dropdown is shown and we have no data
        if (showAddIngredient || debouncedSearch) {
            fetchSearchResults();
        }

        return () => abortControllerRef.current?.abort();
    }, [debouncedSearch, showAddIngredient]);

    // Inisialisasi data dari resep yang dipilih
    useEffect(() => {
        // Gabungkan data awal dangan data hasil search untuk lookup harga/unit
        const allReferenceData = [...initialInventoryData, ...inventoryData];
        
        // Pemetaan bahan resep ke data inventori untuk mendapatkan harga mentah per unit
        const initialIngredients = recipe.ingredients.map(ing => {
            const inventoryItem = allReferenceData.find(item => item.id === ing.ingredientId);
            
            let pricePerG = 0;
            let displayUnit = ing.unit;
            
            if (inventoryItem) {
                const rawPrice = parseFloat(inventoryItem.pricePerUnit);
                if (inventoryItem.unit === 'Kg' || inventoryItem.unit === 'L') {
                    pricePerG = rawPrice / 1000;
                    displayUnit = inventoryItem.unit === 'Kg' ? 'g' : 'mL';
                } else {
                    pricePerG = rawPrice;
                    displayUnit = inventoryItem.unit;
                }
            }
            
            return {
                id: ing.ingredientId,
                name: ing.name,
                pricePerG: pricePerG,
                unit: displayUnit,
                qty: ing.qty
            };
        });
        setIngredients(initialIngredients);
        setHargaJual(recipe.price);

        // Coba estimasi overhead berdasarkan HPP
        const rawMaterialsCost = initialIngredients.reduce((sum, ing) => sum + (ing.pricePerG * ing.qty), 0);
        if (rawMaterialsCost > 0) {
            const calculatedOverhead = Math.round(((recipe.hpp / rawMaterialsCost) - 1) * 100);
            setOverhead(Math.max(0, calculatedOverhead));
        } else {
            setOverhead(10);
        }
    }, [recipe, initialInventoryData]); // Removed inventoryData to avoid unwanted resets during search

    const changeQty = (id: number, delta: number) => {
        setIngredients(prev =>
            prev.map(ing =>
                ing.id === id ? { ...ing, qty: Math.max(0, ing.qty + delta) } : ing
            )
        );
    };

    const toggleUnit = (id: number) => {
        setIngredients(prev =>
            prev.map(ing =>
                ing.id === id ? { ...ing, unit: ing.unit === 'g' || ing.unit === 'gram' ? 'ml' : 'g' } : ing
            )
        );
    };

    const updateCalculatedPrice = (id: number, price: number, amount: number) => {
        setIngredients(prev =>
            prev.map(ing => {
                if (ing.id === id) {
                    const pricePerUnit = amount > 0 ? price / amount : 0;
                    return { ...ing, purchasePrice: price, purchaseQty: amount, pricePerG: pricePerUnit, isPriceModified: true };
                }
                return ing;
            })
        );
    };

    const deleteIng = (id: number) => {
        setIngredients(prev => prev.filter(ing => ing.id !== id));
    };

    const addIngredient = (item: any) => {
        // Prevent dupes
        if (ingredients.some(ing => ing.id === item.id)) {
            setShowAddIngredient(false);
            return;
        }
        
        const isBulk = item.unit === 'Kg' || item.unit === 'L';
        const pricePerG = isBulk ? parseFloat(item.pricePerUnit) / 1000 : parseFloat(item.pricePerUnit);
        const displayUnit = item.unit === 'Kg' ? 'g' : item.unit === 'L' ? 'mL' : item.unit;

        setIngredients(prev => [...prev, {
            id: item.id,
            name: item.name,
            pricePerG: pricePerG,
            unit: displayUnit,
            qty: 1
        }]);
        setShowAddIngredient(false);
        setSearchTerm('');
    };

    const availableIngredients = inventoryData.filter(item =>
        !ingredients.some(ing => ing.id === item.id)
    );

    const totalBahan = ingredients.reduce((sum, ing) => sum + ing.pricePerG * ing.qty, 0);
    const totalHPP = Math.round(totalBahan * (1 + overhead / 100));
    const laba = hargaJual - totalHPP;
    const margin = hargaJual > 0 ? ((laba / hargaJual) * 100).toFixed(1) : '0.0';

    const handleSaveAPI = async () => {
        try {
            if(!namaResep) return alert("Nama resep tidak boleh kosong");
            
            // Validasi: Tidak boleh tanpa bahan
            if (ingredients.length === 0) {
                return alert("Resep harus memiliki minimal satu bahan baku!");
            }

            // Validasi: Quantity > 0
            const invalidIng = ingredients.find(ing => ing.qty <= 0);
            if (invalidIng) {
                return alert(`Jumlah untuk bahan "${invalidIng.name}" harus lebih dari 0!`);
            }

            const prepIngredients = ingredients.map(ing => ({
                ingredientId: ing.id,
                qty: ing.qty
            }));

            const payload = {
                name: namaResep,
                category: category,
                price: hargaJual,
                margin: parseFloat(margin),
                imageUrl: recipe.imageUrl,
                ingredients: prepIngredients
            };

            // If recipe.id is a real DB ID (positive integer from before ~2020 timestamp), update. Otherwise create.
            const isExisting = recipe.id && recipe.id < 1_000_000_000;
            if (isExisting) {
                await apiClient.updateRecipe(recipe.id, payload);
            } else {
                await apiClient.createRecipe(payload);
            }

            // Sync modified prices back to inventory
            const modifiedIngredients = ingredients.filter(ing => ing.isPriceModified);
            const allReferenceData = [...initialInventoryData, ...inventoryData];
            
            for (const ing of modifiedIngredients) {
                // Adjust back if it was Kg/L (inventory stores as price per Kg/L)
                const inventoryItem = allReferenceData.find(item => item.id === ing.id);
                let priceToSave = ing.pricePerG;
                if (inventoryItem && (inventoryItem.unit === 'Kg' || inventoryItem.unit === 'L')) {
                    priceToSave = ing.pricePerG * 1000;
                }
                
                await apiClient.updateInventoryItem(ing.id, { 
                    pricePerUnit: priceToSave 
                });
            }

            alert('Resep berhasil disimpan dan harga bahan diperbarui!');
            onSave();
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan resep!');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex justify-center items-center sm:p-4 animate-in fade-in duration-300">
            <div className="relative flex h-full max-h-screen sm:max-h-[90vh] sm:min-h-[500px] w-full flex-col max-w-md mx-auto shadow-2xl bg-background-app sm:rounded-[2.5rem] border-x sm:border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Top App Bar */}
                <header className="sticky top-0 z-50 bg-background-app border-b border-primary/10 px-4 py-4 flex items-center gap-2 backdrop-blur-md bg-opacity-95">
                    <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center p-2 hover:bg-primary/10 rounded-full transition-colors active:scale-95">
                                <span className="material-symbols-outlined text-slate-900 ">arrow_back</span>
                            </button>
                            <h1 className="text-lg font-bold tracking-tight text-slate-900  truncate w-[200px]">
                                {recipe.name ? `Edit: ${recipe.name}` : 'Tambah Resep'}
                            </h1>
                        </div>
                        <button
                            className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl active:scale-95 transition-all text-sm"
                            onClick={handleSaveAPI}
                        >
                            Selesai
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Recipe Name Input */}
                    <div className="px-4 pt-6">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Nama Resep</label>
                        <input
                            type="text"
                            value={namaResep}
                            onChange={(e) => setNamaResep(e.target.value)}
                            placeholder="Masukkan nama resep..."
                            className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 text-lg font-extrabold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm "
                        />
                    </div>

                    {/* Category Selection */}
                    <div className="px-4 pt-6">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 text-center">Kategori Menu</label>
                        <div className="flex gap-2 justify-center">
                            {['Minuman', 'Makanan', 'Snack'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat as 'Minuman' | 'Makanan' | 'Snack')}
                                    className={`px-6 py-2.5 rounded-full text-xs font-black transition-all active:scale-90 border-2 ${
                                        category === cat 
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                                        : 'bg-white text-slate-400 border-slate-100 hover:border-primary/30'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Ingredients Section */}
                    <section className="p-4">
                        <div className="flex items-center justify-between mb-4 relative z-20">
                            <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Bahan Baku Inventori</h2>
                            <div className="relative">
                                <button
                                    onClick={() => setShowAddIngredient(!showAddIngredient)}
                                    className="flex items-center gap-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full font-semibold transition-colors active:scale-95 border border-primary/20"
                                >
                                    <span className="material-symbols-outlined text-[16px]">{showAddIngredient ? 'close' : 'add'}</span>
                                    {showAddIngredient ? 'Batal' : 'Tambah Bahan'}
                                </button>

                                {showAddIngredient && (
                                    <div className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-primary/20 overflow-hidden transform origin-top-right animate-in slide-in-from-top-4 fade-in duration-300 z-[60]">
                                        <div className="p-4 border-b border-primary/5 bg-primary/5">
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary font-black text-lg">search</span>
                                                <input
                                                    type="text"
                                                    placeholder="Cari bahan baku..."
                                                    value={searchTerm}
                                                    onChange={e => setSearchTerm(e.target.value)}
                                                    className="w-full bg-white border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary shadow-inner"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[350px] overflow-y-auto scrollbar-none">
                                            {isSearching ? (
                                                <div className="p-10 text-center">
                                                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-[3px] border-primary/20 border-t-primary mb-4"></div>
                                                    <p className="text-[10px] font-black text-primary/50 uppercase tracking-[0.3em]">Menyelaraskan Data...</p>
                                                </div>
                                            ) : searchError ? (
                                                <div className="p-6 text-center">
                                                    <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
                                                    <p className="text-xs text-red-500 font-black uppercase tracking-widest">{searchError}</p>
                                                </div>
                                            ) : searchTerm && searchTerm.trim().length < 2 ? (
                                                <div className="p-8 text-center opacity-40">
                                                    <span className="material-symbols-outlined text-3xl mb-1">keyboard</span>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ketik Minimal 2 Karakter</p>
                                                </div>
                                            ) : searchTerm && availableIngredients.length === 0 ? (
                                                <div className="p-10 text-center opacity-40">
                                                    <span className="material-symbols-outlined text-3xl mb-1">sentiment_dissatisfied</span>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Bahan Tidak Ditemukan</p>
                                                </div>
                                            ) : (
                                                <div className="py-2">
                                                    {!searchTerm && (
                                                        <div className="px-5 py-3 flex items-center justify-between bg-primary/5 mb-2">
                                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Rekomendasi Bahan</p>
                                                            <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest">Inventory List</span>
                                                        </div>
                                                    )}
                                                    {availableIngredients.map(item => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => addIngredient(item)}
                                                            className="w-full text-left px-5 py-4 hover:bg-primary/5 border-b border-primary/5 last:border-0 flex justify-between items-center group transition-all active:bg-primary/10"
                                                        >
                                                            <div className="space-y-0.5">
                                                                <p className="font-black text-sm text-slate-900 group-hover:text-primary transition-colors">{item.name}</p>
                                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider opacity-60">{item.category} • {formatRp(parseFloat(item.pricePerUnit))}/{item.unit}</p>
                                                            </div>
                                                            <span className="material-symbols-outlined text-primary/30 group-hover:text-primary group-hover:scale-110 transition-all text-2xl font-black">add_circle</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 relative z-10">
                            {ingredients.map(ing => (
                                <div key={ing.id} className="bg-white  border border-slate-200  rounded-2xl p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-3.5">
                                        <div>
                                            <p className="font-bold text-[15px] text-slate-900  tracking-tight">{ing.name}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Harga Unit: Rp </p>
                                                <input 
                                                    type="number"
                                                    value={ing.pricePerG === 0 ? '' : ing.pricePerG}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        const newPrice = val === '' ? 0 : parseFloat(val) || 0;
                                                        setIngredients(prev => prev.map(i => i.id === ing.id ? { ...i, pricePerG: newPrice, isPriceModified: true } : i));
                                                    }}
                                                    className="w-16 bg-primary/5 border-none focus:ring-0 p-0 text-[10px] font-bold text-primary underline decoration-dotted"
                                                />
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider"> / {ing.unit}</p>
                                            </div>
                                        </div>
                                        <button
                                            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-500/10 active:scale-90"
                                            onClick={() => deleteIng(ing.id)}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>

                                    {/* Price Calculator Section */}
                                    <div className="mb-4 p-3 bg-slate-50  rounded-xl border border-primary/10">
                                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.1em] mb-2">Kalkulator Konversi Harga Beli</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-500 font-bold ml-1">Harga Beli (Rp)</label>
                                                <input
                                                    type="number"
                                                    value={ing.purchasePrice || ''}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        updateCalculatedPrice(ing.id, val === '' ? 0 : parseFloat(val) || 0, ing.purchaseQty || 1000);
                                                    }}
                                                    placeholder="Contoh: 250000"
                                                    className="w-full bg-white  border border-slate-200  rounded-lg py-1.5 px-3 text-sm font-bold text-slate-900  focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-500 font-bold ml-1">Total Berat/Vol ({ing.unit})</label>
                                                <input
                                                    type="number"
                                                    value={ing.purchaseQty || ''}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        updateCalculatedPrice(ing.id, ing.purchasePrice || 0, val === '' ? 0 : parseFloat(val) || 0);
                                                    }}
                                                    placeholder="Contoh: 1000"
                                                    className="w-full bg-white  border border-slate-200  rounded-lg py-1.5 px-3 text-sm font-bold text-slate-900  focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-slate-400 mt-2 italic">* Input 1000 jika beli per 1kg/1L untuk mendapatkan harga per g/ml</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 bg-slate-50  rounded-xl p-1 border border-primary/15 shadow-inner">
                                            <button
                                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg hover:bg-primary/20 transition-colors active:scale-90"
                                                onClick={() => changeQty(ing.id, -1)}
                                            >-</button>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    className="w-12 text-center bg-transparent border-none focus:ring-0 p-0 font-extrabold text-base text-slate-900 "
                                                    type="number"
                                                    value={ing.qty === 0 ? '' : ing.qty}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setIngredients(prev => prev.map(i => i.id === ing.id ? { ...i, qty: val === '' ? 0 : Math.max(0, parseInt(val) || 0) } : i));
                                                    }}
                                                    min={0}
                                                />
                                                <button
                                                    onClick={() => toggleUnit(ing.id)}
                                                    className="text-xs bg-slate-200  hover:bg-primary hover:text-white px-2 py-1 rounded font-bold transition-colors uppercase"
                                                >
                                                    {ing.unit}
                                                </button>
                                            </div>
                                            <button
                                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-colors active:scale-90 shadow-sm"
                                                onClick={() => changeQty(ing.id, 1)}
                                            >+</button>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Subtotal</p>
                                            <p className="font-extrabold text-primary text-base tracking-tight">
                                                {formatRp(ing.pricePerG * ing.qty)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Overhead & Buffer */}
                        <div className="mt-6 border-t border-primary/10 pt-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                                    <h2 className="text-sm font-bold tracking-tight text-slate-900 ">Overhead & Buffer (%)</h2>
                                </div>
                                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20 uppercase tracking-wider">Opsional</span>
                            </div>
                            <div className="relative">
                                <input
                                    className="w-full bg-white  border border-primary/20 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors pr-10 font-bold text-slate-900  shadow-sm"
                                    placeholder="Biaya tambahan"
                                    type="number"
                                    value={overhead}
                                    onChange={e => setOverhead(Math.max(0, parseFloat(e.target.value) || 0))}
                                    min={0}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">%</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 px-1 font-medium leading-relaxed">
                                Biasanya digunakan untuk biaya listrik, kemasan, atau penyusutan alat (estimasi).
                            </p>
                        </div>
                    </section>

                    {/* Margin Analysis Section */}
                    <section className="p-4 mt-2 mb-10">
                        <h2 className="text-base font-bold mb-4 border-l-4 border-primary pl-3 text-slate-900  tracking-tight">Analisa Margin</h2>

                        <div className="bg-white  rounded-2xl p-5 shadow-sm border border-slate-200 ">
                            <div className="space-y-4">

                                {/* Selling Price */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-500 ">Harga Jual per Cup</span>
                                    <div className="flex items-center gap-1.5 border-b-2 border-primary/30 pb-1">
                                        <span className="text-xs font-extrabold text-slate-700 ">Rp</span>
                                        <input
                                            className="bg-transparent border-none p-0 text-right font-extrabold text-lg focus:ring-0 w-24 text-slate-900 "
                                            type="text"
                                            value={hargaJual.toLocaleString('id-ID')}
                                            onChange={e => setHargaJual(parseInt(e.target.value.replace(/\./g, '')) || 0)}
                                        />
                                    </div>
                                </div>

                                {/* Total HPP */}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-500 ">Total HPP (Bahan + Overhead)</span>
                                    <span className="font-bold text-slate-900 ">{formatRp(totalHPP)}</span>
                                </div>

                                <hr className="border-dashed border-primary/20" />

                                {/* Margin Result */}
                                <div className="flex justify-between items-center py-2.5 px-4 bg-primary/5  rounded-xl border border-primary/10">
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-extrabold tracking-widest mb-0.5">Gross Profit Margin</p>
                                        <p className="text-3xl font-black text-primary tracking-tight">{margin}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-500 uppercase font-extrabold tracking-widest mb-0.5">Laba bersih</p>
                                        <p className="text-xl font-extrabold text-slate-900  tracking-tight">{formatRp(laba)}</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </section>
                </main>

                {/* Bottom Actions (Non-fixed, always at bottom of flex container) */}
                <footer className="bg-white border-t border-primary/10 p-5 pb-10 z-50 max-w-md mx-auto shadow-[0_-15px_40px_rgba(0,0,0,0.05)] w-full">
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-[1] py-5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-[2rem] transition-all active:scale-95 border border-slate-200">
                            Batal
                        </button>
                        <button
                            onClick={handleSaveAPI}
                            className="flex-[2.5] py-5 bg-gradient-to-r from-primary to-amber-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[2rem] shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 active:scale-95 group">
                            <span className="material-symbols-outlined text-[20px] font-black group-hover:rotate-12 transition-transform">save</span>
                            Simpan Resep
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}

