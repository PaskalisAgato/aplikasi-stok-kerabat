import { useState } from 'react';
import { RECIPES } from '@shared/mockDatabase';
import NavDrawer from '@shared/NavDrawer';

function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [sales, setSales] = useState<Record<number, number>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRecipes = RECIPES.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const updateQty = (id: number, delta: number) => {
        setSales(prev => ({
            ...prev,
            [id]: Math.max(0, (prev[id] || 0) + delta)
        }));
    };

    const totalSalesValue = Object.entries(sales).reduce((total, [id, qty]) => {
        const recipe = RECIPES.find(r => r.id === parseInt(id));
        return total + (recipe ? recipe.price * qty : 0);
    }, 0);

    const totalItems = Object.values(sales).reduce((a, b) => a + b, 0);

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display antialiased">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5186} />

            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl border-x border-slate-800/10 dark:border-slate-800/30 overflow-x-hidden pb-32">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-primary/10 px-4 py-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setDrawerOpen(true)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors active:scale-95 text-primary">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h1 className="text-xl font-extrabold tracking-tight">Kasir (POS)</h1>
                    </div>
                </header>

                {/* Sales Summary Bar */}
                <div className="bg-primary/5 dark:bg-primary/10 p-4 border-b border-primary/10">
                    <div className="flex justify-between items-center px-1">
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Total Pesanan</p>
                            <p className="text-2xl font-black text-primary">Rp {totalSalesValue.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Item</p>
                            <p className="text-xl font-bold">{totalItems}</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative flex items-center group">
                        <span className="material-symbols-outlined absolute left-4 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Cari menu harian..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-primary/10 bg-white dark:bg-primary/5 focus:ring-2 focus:ring-primary/50 text-sm font-medium transition-all"
                        />
                    </div>
                </div>

                {/* Menu Grid */}
                <main className="flex-1 px-4 space-y-3">
                    {filteredRecipes.map(recipe => (
                        <div key={recipe.id} className="flex items-center gap-4 bg-white dark:bg-primary/5 p-3 rounded-2xl border border-slate-100 dark:border-primary/10 shadow-sm">
                            <div
                                className="size-16 rounded-xl bg-cover bg-center shrink-0"
                                style={{ backgroundImage: `url('${recipe.imageUrl || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=200&auto=format&fit=crop"}')` }}
                            />
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">{recipe.name}</h3>
                                <p className="text-primary font-black text-xs mt-1">Rp {recipe.price.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                                <button
                                    onClick={() => updateQty(recipe.id, -1)}
                                    className="size-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-primary hover:bg-primary/10 transition-colors"
                                >-</button>
                                <span className="w-6 text-center font-bold text-sm">{sales[recipe.id] || 0}</span>
                                <button
                                    onClick={() => updateQty(recipe.id, 1)}
                                    className="size-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                                >+</button>
                            </div>
                        </div>
                    ))}
                </main>

                {/* Footer Action */}
                <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-primary/10 p-4 pb-8 z-50 max-w-md mx-auto shadow-2xl">
                    <button
                        onClick={() => {
                            if (totalItems === 0) return;
                            alert('Penyimpanan ke Database Online dalam pengembangan (Silakan setup Supabase sesuai panduan).');
                            // Logika nanti: looping recipe, kurangi stok bahan baku di inventory
                        }}
                        className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 
               ${totalItems > 0 ? 'bg-gradient-to-r from-primary to-[#b36a2b] shadow-primary/30' : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500 shadow-none'}`}
                    >
                        <span className="material-symbols-outlined">payments</span>
                        Catat Penjualan Hari Ini
                    </button>
                </footer>
            </div>
        </div>
    );
}

export default App;
