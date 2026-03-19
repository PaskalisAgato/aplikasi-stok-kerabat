import { useState } from 'react';
import { INVENTORY } from '@shared/mockDatabase';
import Layout from '@shared/Layout';

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
        <Layout
            currentPort={5187}
            title="Edit Resep"
            subtitle="Recipe Engineering"
            footer={
                <footer className="p-8 glass border-t border-white/10 shrink-0 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
                    <div className="flex gap-6">
                        <button 
                            className="flex-[1] py-5 glass border-white/10 text-primary font-black text-[10px] uppercase tracking-widest rounded-3xl hover:bg-primary/10 transition-all active:scale-95"
                            onClick={() => { setIngredients(initialIngredients); setOverhead(10); setHargaJual(15000); }}
                        >
                            Reset
                        </button>
                        <button className="flex-[3] py-5 bg-gradient-to-r from-primary to-amber-600 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
                            <span className="material-symbols-outlined font-black text-lg">verified</span>
                            Simpan Resep Strategis
                        </button>
                    </div>
                </footer>
            }
        >
            <div className="space-y-12">
                {/* Ingredients Section */}
                <section className="space-y-8 animate-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center justify-between px-2">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">Komposisi</h3>
                            <p className="text-xl font-black font-display tracking-tight text-[var(--text-main)] uppercase">Bahan Baku</p>
                        </div>
                        <button className="flex items-center gap-3 bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.05] transition-all active:scale-95 border-none">
                            <span className="material-symbols-outlined text-[18px] font-black">add_circle</span>
                            Tambah
                        </button>
                    </div>

                    <div className="space-y-6">
                        {ingredients.map((ing, idx) => (
                            <div 
                                key={ing.id} 
                                className="card group p-6 border-white/5 hover:scale-[1.01] active:scale-[0.99] transition-all relative overflow-hidden"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-black font-display tracking-tight text-[var(--text-main)] uppercase leading-none truncate group-hover:text-primary transition-colors">{ing.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[10px] text-primary font-black">sell</span>
                                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">
                                                HARTON: Rp {ing.pricePerG.toLocaleString('id-ID')} / {ing.unit}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        className="size-10 glass rounded-xl text-red-500 hover:bg-red-500/20 active:scale-90 transition-all border-red-500/10 flex items-center justify-center"
                                        onClick={() => deleteIng(ing.id)}
                                    >
                                        <span className="material-symbols-outlined text-[20px] font-black">delete_forever</span>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3 glass rounded-2xl p-1.5 border-white/5 shadow-inner">
                                        <button
                                            className="size-11 glass rounded-xl text-primary font-black text-xl hover:bg-primary/20 active:scale-90 transition-all border-white/10"
                                            onClick={() => changeQty(ing.id, -1)}
                                        >-</button>
                                        <div className="flex items-center gap-2 px-4">
                                            <input
                                                className="w-16 text-center bg-transparent border-none focus:ring-0 p-0 font-black text-xl text-[var(--text-main)] placeholder:opacity-20"
                                                type="number"
                                                value={ing.qty}
                                                onChange={e => setIngredients(prev => prev.map(i => i.id === ing.id ? { ...i, qty: Math.max(0, parseInt(e.target.value) || 0) } : i))}
                                                min={0}
                                            />
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{ing.unit}</span>
                                        </div>
                                        <button
                                            className="size-11 bg-primary text-white rounded-xl font-black text-xl hover:bg-primary/90 active:scale-90 transition-all shadow-xl shadow-primary/20"
                                            onClick={() => changeQty(ing.id, 1)}
                                        >+</button>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 mb-1">Subtotal Cost</p>
                                        <p className="text-xl font-black text-primary font-display tracking-tight">
                                            {formatRp(ing.pricePerG * ing.qty)}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Decoration */}
                                <div className="absolute right-0 bottom-0 size-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mb-12 group-hover:bg-primary/10 transition-colors"></div>
                            </div>
                        ))}
                    </div>

                    {/* Overhead & Buffer */}
                    <div className="p-8 glass rounded-[2.5rem] border-white/5 space-y-6 relative overflow-hidden group">
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="size-10 glass rounded-xl flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined font-black">bolt</span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Overhead & Buffer</h3>
                                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">Biaya Tambahan (%)</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative z-10 group">
                            <input
                                className="w-full glass border-white/10 rounded-2xl py-5 px-8 focus:ring-4 focus:ring-primary/20 focus:border-primary/40 transition-all text-2xl font-black text-primary outline-none text-center bg-primary/5"
                                type="number"
                                value={overhead}
                                onChange={e => setOverhead(Math.max(0, parseFloat(e.target.value) || 0))}
                                min={0}
                            />
                            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-primary font-black text-2xl opacity-40">%</span>
                        </div>
                        <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] leading-relaxed opacity-60 text-center relative z-10">
                            Mencakup pemeliharaan alat, biaya operasional, dan margin keamanan bahan.
                        </p>
                        <div className="absolute -left-12 -top-12 size-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                    </div>
                </section>

                {/* Margin Analysis Section */}
                <section className="space-y-8 pb-10">
                    <div className="flex items-center gap-4 px-2">
                        <div className="size-1.5 rounded-full bg-primary animate-pulse"></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Profit Engineering</h3>
                    </div>

                    <div className="card p-8 border-white/5 space-y-10 relative overflow-hidden group">
                        <div className="space-y-8 relative z-10">
                            {/* Selling Price */}
                            <div className="flex justify-between items-center group/item">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Harga Jual per Cup</span>
                                    <p className="text-xs font-black text-primary uppercase tracking-widest">Target Revenue</p>
                                </div>
                                <div className="flex items-center gap-3 border-b-4 border-primary/20 group-focus-within/item:border-primary/60 transition-all pb-2">
                                    <span className="text-lg font-black text-primary opacity-40">Rp</span>
                                    <input
                                        className="bg-transparent border-none p-0 text-right font-black text-3xl focus:ring-0 w-32 text-[var(--text-main)] tracking-tight outline-none"
                                        type="text"
                                        value={hargaJual.toLocaleString('id-ID')}
                                        onChange={e => setHargaJual(parseInt(e.target.value.replace(/\./g, '')) || 0)}
                                    />
                                </div>
                            </div>

                            {/* Total HPP */}
                            <div className="flex justify-between items-center px-4 py-4 glass rounded-2xl border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Production Cost (HPP)</span>
                                <span className="text-lg font-black text-[var(--text-main)] font-display tracking-tight">{formatRp(totalHPP)}</span>
                            </div>

                            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                            {/* Margin Result */}
                            <div className="p-8 glass rounded-[3rem] border-primary/10 shadow-3xl shadow-primary/10 flex items-center justify-between bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden">
                                <div className="space-y-2 relative z-10">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Gross Margin</p>
                                    <p className="text-5xl font-black text-primary font-display tracking-tighter leading-none">{margin}%</p>
                                </div>
                                <div className="text-right space-y-2 relative z-10">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60 mb-2">Profit per Unit</p>
                                    <p className="text-2xl font-black text-[var(--text-main)] font-display tracking-tight leading-none">{formatRp(laba)}</p>
                                </div>
                                
                                {/* Icon Background */}
                                <span className="absolute -right-4 -bottom-4 material-symbols-outlined text-[100px] text-primary/5 font-black rotate-12">trending_up</span>
                            </div>
                        </div>
                        
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/40"></div>
                    </div>
                </section>
            </div>
        </Layout>
    );
}

export default App;
