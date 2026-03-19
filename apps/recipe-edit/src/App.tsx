import { useState } from 'react';
import { INVENTORY } from '@shared/mockDatabase';


import NavDrawer from '@shared/NavDrawer';




interface Ingredient {
    id: number;
    name: string;
    pricePerG: number;
    unit: string;
    qty: number;
}

const initialIngredients: Ingredient[] = INVENTORY.slice(0, 2).map(item => ({
    id: item.id,
    name: item.name,
    pricePerG: 150, // Mock price
    unit: item.unit,
    qty: item.currentStock
}));

function formatRp(n: number) {
    return 'Rp ' + n.toLocaleString('id-ID');
}

function App() {
    const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [overhead, setOverhead] = useState(10);
    const [hargaJual, setHargaJual] = useState(15000);


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

    const totalBahan = ingredients.reduce((sum, ing) => sum + ing.pricePerG * ing.qty, 0);
    const totalHPP = Math.round(totalBahan * (1 + overhead / 100));
    const laba = hargaJual - totalHPP;
    const margin = hargaJual > 0 ? ((laba / hargaJual) * 100).toFixed(1) : '0.0';

    return (
        <div className="bg-background-app  font-display text-slate-900  min-h-screen antialiased">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5185} />
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl border-x border-slate-800/10 ">

                {/* Top App Bar */}
                <header className="sticky top-0 z-50 bg-background-app  border-b border-primary/10 px-4 py-4 flex items-center gap-2 backdrop-blur-md bg-opacity-90 ">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="size-9 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors active:scale-95 text-primary shrink-0"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button className="flex items-center justify-center p-2 hover:bg-primary/10 rounded-full transition-colors active:scale-95">
                                <span className="material-symbols-outlined text-slate-900 ">arrow_back</span>
                            </button>
                            <h1 className="text-lg font-bold tracking-tight text-slate-900 ">Detail Resep: Kopi O</h1>
                        </div>
                        <button
                            className="text-primary font-semibold px-3 py-1 rounded-lg hover:bg-primary/10 transition-colors active:scale-95"
                            onClick={() => { setIngredients(initialIngredients); setOverhead(10); setHargaJual(15000); }}
                        >
                            Reset
                        </button>
                    </div>
                </header>

                <main className="flex-1">
                    {/* Ingredients Section */}
                    <section className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Bahan Baku Inventori</h2>
                            <button className="flex items-center gap-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full font-semibold transition-colors active:scale-95 border border-primary/20">
                                <span className="material-symbols-outlined text-[16px]">add</span> Tambah Bahan
                            </button>
                        </div>

                        <div className="space-y-3">
                            {ingredients.map(ing => (
                                <div key={ing.id} className="bg-white  border border-slate-200  rounded-2xl p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-3.5">
                                        <div>
                                            <p className="font-bold text-[15px] text-slate-900  tracking-tight">{ing.name}</p>
                                            <p className="text-xs text-slate-500  mt-0.5 font-medium">
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
                                        <div className="flex items-center gap-2 bg-slate-50  rounded-xl p-1 border border-primary/15 shadow-inner">
                                            <button
                                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg hover:bg-primary/20 transition-colors active:scale-90"
                                                onClick={() => changeQty(ing.id, -1)}
                                            >-</button>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    className="w-12 text-center bg-transparent border-none focus:ring-0 p-0 font-extrabold text-base text-slate-900 "
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
                    <section className="p-4 mt-2">
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
                                        <p className="text-[9px] text-slate-500 uppercase font-extrabold tracking-widest mb-0.5">Laba per Cup</p>
                                        <p className="text-xl font-extrabold text-slate-900  tracking-tight">{formatRp(laba)}</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </section>
                </main>

                {/* Bottom Actions */}
                <footer className="fixed bottom-0 left-0 right-0 bg-white [#110d08] border-t border-primary/10 p-4 pb-8 z-50 max-w-md mx-auto shadow-[0_-8px_32px_rgba(0,0,0,0.12)] [0_-8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex gap-3">
                        <button className="flex-[1] py-4 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-2xl transition-all active:scale-95 border border-primary/20 shadow-sm">
                            Draft
                        </button>
                        <button className="flex-[3] py-4 bg-gradient-to-r from-primary to-[#b36a2b] hover:from-[#b36a2b] hover:to-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[22px]">save</span>
                            Simpan Resep
                        </button>
                    </div>
                </footer>

            </div>
        </div>
    );
}

export default App;

