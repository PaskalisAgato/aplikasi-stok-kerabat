import { useState, useEffect } from 'react';
import { INVENTORY } from '@shared/mockDatabase';
import type { Recipe } from '@shared/mockDatabase';

interface Ingredient {
    id: number;
    name: string;
    pricePerG: number;
    unit: string;
    qty: number;
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
    const [overhead, setOverhead] = useState(10); // Default overhead
    const [hargaJual, setHargaJual] = useState(recipe.price);
    const [showAddIngredient, setShowAddIngredient] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Inisialisasi data dari resep yang dipilih
    useEffect(() => {
        // Melakukan pemetaan bahan resep ke data inventori untuk mendapatkan harga mentah per unit
        const initialIngredients = recipe.ingredients.map(ing => {
            const inventoryItem = INVENTORY.find(item => item.id === ing.ingredientId);
            return {
                id: ing.ingredientId,
                name: ing.name,
                pricePerG: inventoryItem ? inventoryItem.pricePerUnit : 0,
                unit: ing.unit,
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
    }, [recipe]);

    const changeQty = (id: number, delta: number) => {
        setIngredients(prev =>
            prev.map(ing =>
                ing.id === id ? { ...ing, qty: Math.max(0, ing.qty + delta) } : ing
            )
        );
    };

    const deleteIng = (id: number) => {
        setIngredients(prev => prev.filter(ing => ing.id !== id));
    };

    const addIngredient = (item: typeof INVENTORY[0]) => {
        // Prevent dupes
        if (ingredients.some(ing => ing.id === item.id)) {
            setShowAddIngredient(false);
            return;
        }
        setIngredients(prev => [...prev, {
            id: item.id,
            name: item.name,
            pricePerG: item.pricePerUnit,
            unit: item.unit,
            qty: 1
        }]);
        setShowAddIngredient(false);
        setSearchTerm('');
    };

    const availableIngredients = INVENTORY.filter(item =>
        !ingredients.some(ing => ing.id === item.id) &&
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalBahan = ingredients.reduce((sum, ing) => sum + ing.pricePerG * ing.qty, 0);
    const totalHPP = Math.round(totalBahan * (1 + overhead / 100));
    const laba = hargaJual - totalHPP;
    const margin = hargaJual > 0 ? ((laba / hargaJual) * 100).toFixed(1) : '0.0';

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
                                {recipe.name ? `Edit: ${recipe.name}` : 'Tambah Resep Baru'}
                            </h1>
                        </div>
                        <button
                            className="text-primary font-semibold px-3 py-1 rounded-lg hover:bg-primary/10 transition-colors active:scale-95"
                            onClick={() => {
                                // Reset back to props
                                setHargaJual(recipe.price);
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </header>

                <main className="flex-1">
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
                                                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{item.category} • Rp {item.pricePerUnit.toLocaleString('id-ID')}/{item.unit}</p>
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
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                                Harga: Rp {ing.pricePerG.toLocaleString('id-ID')} / {ing.unit}
                                            </p>
                                        </div>
                                        <button
                                            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-500/10 active:scale-90"
                                            onClick={() => deleteIng(ing.id)}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
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
                                                <span className="text-sm text-slate-400 font-medium pr-1">{ing.unit}</span>
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
                            onClick={onClose}
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
