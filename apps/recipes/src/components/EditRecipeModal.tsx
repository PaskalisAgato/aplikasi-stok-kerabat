import { useState, useEffect } from 'react';
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
}

interface EditRecipeModalProps {
    recipe: Recipe;
    onClose: () => void;
}

function formatRp(n: number) {
    return 'Rp ' + n.toLocaleString('id-ID');
}

export default function EditRecipeModal({ recipe, onClose }: EditRecipeModalProps) {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [namaResep, setNamaResep] = useState(recipe.name || '');
    const [overhead, setOverhead] = useState(10); // Default overhead
    const [hargaJual, setHargaJual] = useState(recipe.price);
    const [showAddIngredient, setShowAddIngredient] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [inventoryData, setInventoryData] = useState<any[]>([]);

    useEffect(() => {
        apiClient.getInventory().then(data => {
            setInventoryData(data);
        }).catch(err => console.error("Failed to fetch inventory for recipe editing", err));
    }, []);

    // Inisialisasi data dari resep yang dipilih
    useEffect(() => {
        // Jika belum ada data inventori, tunggu dulu
        if (inventoryData.length === 0 && recipe.ingredients.length > 0) return;

        // Melakukan pemetaan bahan resep ke data inventori untuk mendapatkan harga mentah per unit
        const initialIngredients = recipe.ingredients.map(ing => {
            const inventoryItem = inventoryData.find(item => item.id === ing.ingredientId);
            
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
    }, [recipe, inventoryData]);

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
                    return { ...ing, purchasePrice: price, purchaseQty: amount, pricePerG: pricePerUnit };
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
        !ingredients.some(ing => ing.id === item.id) &&
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalBahan = ingredients.reduce((sum, ing) => sum + ing.pricePerG * ing.qty, 0);
    const totalHPP = Math.round(totalBahan * (1 + overhead / 100));
    const laba = hargaJual - totalHPP;
    const margin = hargaJual > 0 ? ((laba / hargaJual) * 100).toFixed(1) : '0.0';

    const handleSaveAPI = async () => {
        try {
            if(!namaResep) return alert("Nama resep tidak boleh kosong");
            const prepIngredients = ingredients.map(ing => ({
                ingredientId: ing.id,
                qty: ing.qty
            }));

            const payload = {
                name: namaResep,
                category: recipe.category,
                price: hargaJual,
                margin: parseFloat(margin),
                imageUrl: recipe.imageUrl,
                ingredients: prepIngredients
            };

            // If recipe.id is a real DB ID (positive integer from before ~2020 timestamp), update. Otherwise create.
            const isExisting = recipe.id && recipe.id < 1_000_000_000;
            if (isExisting) {
                await apiClient.updateRecipe(recipe.id, payload);
                alert('Resep berhasil diupdate!');
            } else {
                await apiClient.createRecipe(payload);
                alert('Resep baru berhasil disimpan!');
            }
            onClose();
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan resep!');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen antialiased overflow-y-auto">
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark pb-32">
                {/* Top App Bar */}
                <header className="sticky top-0 z-50 bg-background-light dark:bg-background-dark border-b border-primary/10 px-4 py-4 flex items-center gap-2 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
                    <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center p-2 hover:bg-primary/10 rounded-full transition-colors active:scale-95">
                                <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back</span>
                            </button>
                            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate w-[200px]">
                                {recipe.name ? `Edit: ${recipe.name}` : 'Tambah Resep'}
                            </h1>
                        </div>
                        <button
                            className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl active:scale-95 transition-all text-sm"
                            onClick={onClose}
                        >
                            Selesai
                        </button>
                    </div>
                </header>

                <main className="flex-1">
                    {/* Recipe Name Input */}
                    <div className="px-4 pt-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Nama Resep</label>
                        <input
                            type="text"
                            value={namaResep}
                            onChange={(e) => setNamaResep(e.target.value)}
                            placeholder="Masukkan nama resep..."
                            className="w-full bg-white dark:bg-primary/5 border border-primary/20 rounded-2xl py-4 px-5 text-lg font-extrabold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm dark:text-white"
                        />
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
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transform origin-top-right transition-all">
                                        <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                                            <input
                                                type="text"
                                                placeholder="Cari bahan..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-slate-100"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            {availableIngredients.length === 0 ? (
                                                <p className="p-4 text-center text-sm text-slate-500">Tidak ada bahan tersedia</p>
                                            ) : (
                                                availableIngredients.map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => addIngredient(item)}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700/50 last:border-0 flex justify-between items-center group transition-colors"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{item.name}</p>
                                                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{item.category} • Rp {parseFloat(item.pricePerUnit).toLocaleString('id-ID')}/{item.unit}</p>
                                                        </div>
                                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-[20px]">add_circle</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 relative z-10">
                            {ingredients.map(ing => (
                                <div key={ing.id} className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-3.5">
                                        <div>
                                            <p className="font-bold text-[15px] text-slate-900 dark:text-slate-100 tracking-tight">{ing.name}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-bold uppercase tracking-wider">
                                                Harga Unit: Rp {ing.pricePerG.toLocaleString('id-ID')} / {ing.unit}
                                            </p>
                                        </div>
                                        <button
                                            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-500/10 active:scale-90"
                                            onClick={() => deleteIng(ing.id)}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>

                                    {/* Price Calculator Section */}
                                    <div className="mb-4 p-3 bg-slate-50 dark:bg-primary/10 rounded-xl border border-primary/10">
                                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.1em] mb-2">Kalkulator Konversi Harga Beli</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-500 font-bold ml-1">Harga Beli (Rp)</label>
                                                <input
                                                    type="number"
                                                    value={ing.purchasePrice || 0}
                                                    onChange={e => updateCalculatedPrice(ing.id, parseFloat(e.target.value) || 0, ing.purchaseQty || 1000)}
                                                    placeholder="Contoh: 250000"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-500 font-bold ml-1">Total Berat/Vol ({ing.unit})</label>
                                                <input
                                                    type="number"
                                                    value={ing.purchaseQty || 1000}
                                                    onChange={e => updateCalculatedPrice(ing.id, ing.purchasePrice || 0, parseFloat(e.target.value) || 0)}
                                                    placeholder="Contoh: 1000"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-slate-400 mt-2 italic">* Input 1000 jika beli per 1kg/1L untuk mendapatkan harga per g/ml</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-1 border border-primary/15 shadow-inner">
                                            <button
                                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg hover:bg-primary/20 transition-colors active:scale-90"
                                                onClick={() => changeQty(ing.id, -1)}
                                            >-</button>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    className="w-12 text-center bg-transparent border-none focus:ring-0 p-0 font-extrabold text-base text-slate-900 dark:text-slate-100"
                                                    type="number"
                                                    value={ing.qty}
                                                    onChange={e => setIngredients(prev => prev.map(i => i.id === ing.id ? { ...i, qty: Math.max(0, parseInt(e.target.value) || 0) } : i))}
                                                    min={0}
                                                />
                                                <button
                                                    onClick={() => toggleUnit(ing.id)}
                                                    className="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-primary hover:text-white px-2 py-1 rounded font-bold transition-colors uppercase"
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
                                    <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">Overhead & Buffer (%)</h2>
                                </div>
                                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20 uppercase tracking-wider">Opsional</span>
                            </div>
                            <div className="relative">
                                <input
                                    className="w-full bg-white dark:bg-slate-800/50 border border-primary/20 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors pr-10 font-bold text-slate-900 dark:text-slate-100 shadow-sm"
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
                        <h2 className="text-base font-bold mb-4 border-l-4 border-primary pl-3 text-slate-900 dark:text-slate-100 tracking-tight">Analisa Margin</h2>

                        <div className="bg-white dark:bg-slate-800/40 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-primary/10">
                            <div className="space-y-4">

                                {/* Selling Price */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Harga Jual per Cup</span>
                                    <div className="flex items-center gap-1.5 border-b-2 border-primary/30 pb-1">
                                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Rp</span>
                                        <input
                                            className="bg-transparent border-none p-0 text-right font-extrabold text-lg focus:ring-0 w-24 text-slate-900 dark:text-slate-100"
                                            type="text"
                                            value={hargaJual.toLocaleString('id-ID')}
                                            onChange={e => setHargaJual(parseInt(e.target.value.replace(/\./g, '')) || 0)}
                                        />
                                    </div>
                                </div>

                                {/* Total HPP */}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-500 dark:text-slate-400">Total HPP (Bahan + Overhead)</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{formatRp(totalHPP)}</span>
                                </div>

                                <hr className="border-dashed border-primary/20" />

                                {/* Margin Result */}
                                <div className="flex justify-between items-center py-2.5 px-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10">
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-extrabold tracking-widest mb-0.5">Gross Profit Margin</p>
                                        <p className="text-3xl font-black text-primary tracking-tight">{margin}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-500 uppercase font-extrabold tracking-widest mb-0.5">Laba bersih</p>
                                        <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{formatRp(laba)}</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </section>
                </main>

                {/* Bottom Actions */}
                <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#110d08] border-t border-primary/10 p-4 pb-8 z-50 max-w-md mx-auto shadow-[0_-8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-[1] py-4 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-2xl transition-all active:scale-95 border border-primary/20 shadow-sm">
                            Batal
                        </button>
                        <button
                            onClick={handleSaveAPI}
                            className="flex-[3] py-4 bg-gradient-to-r from-primary to-[#b36a2b] hover:from-[#b36a2b] hover:to-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[22px]">save</span>
                            Simpan Resep
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
