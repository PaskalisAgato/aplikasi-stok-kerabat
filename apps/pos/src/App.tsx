import { useState, useEffect } from 'react';
import ThemeToggle from '@shared/ThemeToggle';
import { apiClient } from '@shared/apiClient';
import NavDrawer from '@shared/NavDrawer';

function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [sales, setSales] = useState<Record<number, number>>({});
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [recipesList, setRecipesList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRecipes = async () => {
        try {
            setIsLoading(true);
            const data = await apiClient.getRecipes();
            setRecipesList(data);
        } catch (error) {
            console.error('Failed to load menu', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    const filteredRecipes = recipesList.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCartItems = recipesList.filter(r => sales[r.id] > 0);

    const updateQty = (id: number, delta: number) => {
        setSales(prev => ({
            ...prev,
            [id]: Math.max(0, (prev[id] || 0) + delta)
        }));
    };

    const totalSalesValue = Object.entries(sales).reduce((total, [id, qty]) => {
        const recipe = recipesList.find(r => r.id === parseInt(id));
        return total + (recipe ? recipe.price * qty : 0);
    }, 0);

    const totalItems = Object.values(sales).reduce((a, b) => a + b, 0);

    return (
        <div className="bg-background-app text-main min-h-screen flex flex-col font-display antialiased transition-colors duration-300">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5186} />

            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-4xl mx-auto shadow-2xl border-x border-border-dim overflow-x-hidden pb-32">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-background-app/90 backdrop-blur-md border-b border-border-dim px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setDrawerOpen(true)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary active:scale-95">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <h1 className="text-xl font-extrabold tracking-tight">Kasir (POS)</h1>
                        </div>
                        <ThemeToggle />
                    </div>
                </header>

                {/* Sales Summary Bar */}
                <div className="bg-background-app transition-colors duration-300 p-4 border-b border-primary/10">
                    <div className="flex justify-between items-center px-1">
                        <div>
                            <p className="text-[10px] uppercase font-black text-muted tracking-widest">Total Pesanan</p>
                            <p className="text-2xl font-black text-primary">Rp {totalSalesValue.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-black text-muted tracking-widest">Item</p>
                            <p className="text-xl font-bold text-main">{totalItems}</p>
                        </div>
                    </div>
                </div>

                {/* Cart Action & Header */}
                <div className="p-4 flex items-center justify-between">
                    <h2 className="font-bold text-lg">Keranjang</h2>
                    <button 
                        onClick={() => setShowAddMenu(true)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm px-4 py-2 rounded-xl transition-colors flex items-center gap-1 active:scale-95 border border-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Tambah Menu
                    </button>
                </div>

                {/* Menu Grid / Cart Items */}
                <main className="flex-1 px-4 space-y-3">
                    {activeCartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-surface rounded-2xl border border-border-dim border-dashed">
                            <span className="material-symbols-outlined text-5xl text-muted/30 mb-3 block">shopping_cart</span>
                            <p className="text-muted font-medium text-sm">Keranjang masih kosong.</p>
                            <p className="text-muted/60 text-xs mt-1">Klik Tambah Menu untuk memulai.</p>
                        </div>
                    ) : (
                        activeCartItems.map(recipe => (
                            <div key={recipe.id} className="flex items-center gap-4 bg-surface p-3 rounded-2xl border border-border-dim shadow-sm transition-all">
                                <div
                                    className="size-16 rounded-xl bg-cover bg-center shrink-0 border border-border-dim"
                                    style={{ backgroundImage: `url('${recipe.imageUrl || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=200&auto=format&fit=crop"}')` }}
                                    loading="lazy"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-main text-sm leading-tight truncate">{recipe.name}</h3>
                                    <p className="text-primary font-black text-xs mt-1">Rp {recipe.price.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="flex items-center gap-2 bg-background-app p-1 rounded-xl border border-border-dim shrink-0 shadow-inner">
                                    <button
                                        onClick={() => updateQty(recipe.id, -1)}
                                        className="size-8 flex items-center justify-center rounded-lg bg-surface text-primary hover:bg-primary/10 transition-colors shadow-sm"
                                    >-</button>
                                    <span className="w-6 text-center font-bold text-sm block text-main">{sales[recipe.id] || 0}</span>
                                    <button
                                        onClick={() => updateQty(recipe.id, 1)}
                                        className="size-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                                    >+</button>
                                </div>
                            </div>
                        ))
                    )}
                </main>

                {/* Footer Action */}
                <footer className="fixed bottom-0 left-0 right-0 bg-background-app/80 backdrop-blur-md border-t border-border-dim p-4 pb-8 z-50 max-w-4xl mx-auto shadow-2xl">
                    <button
                        onClick={async () => {
                            if (totalItems === 0) return;
                            try {
                                const confirmPos = confirm(`Selesaikan pesanan senilai Rp ${totalSalesValue.toLocaleString('id-ID')}?`);
                                if (!confirmPos) return;

                                const checkoutData = {
                                    items: Object.entries(sales).map(([id, qty]) => {
                                        const recipe = recipesList.find(r => r.id === parseInt(id));
                                        return {
                                            recipeId: parseInt(id),
                                            quantity: qty,
                                            price: recipe ? recipe.price : 0
                                        };
                                    }).filter(i => i.quantity > 0),
                                    totalAmount: totalSalesValue,
                                    paymentMethod: 'CASH',
                                    shiftId: null
                                };

                                await apiClient.checkoutCart(checkoutData);
                                alert('Berhasil! Pembelian telah direkam, dan stok bahan digudang otomatis terpotong (BOM)!');
                                setSales({});
                            } catch (e) {
                                console.error('Checkout error:', e);
                                alert('Transaksi kasir Gagal divalidasi API.');
                            }
                        }}
                        className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 
               ${totalItems > 0 ? 'bg-gradient-to-r from-primary to-[#b36a2b] shadow-primary/30' : 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'}`}
                    >
                        <span className="material-symbols-outlined">payments</span>
                        Catat Penjualan Hari Ini
                    </button>
                </footer>
            </div>

            {/* Add Menu Modal */}
            {showAddMenu && (
                <div className="fixed inset-0 z-[100] bg-background-app font-display flex flex-col max-w-4xl mx-auto h-full shadow-2xl">
                    <header className="sticky top-0 z-10 bg-background-app border-b border-border-dim px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowAddMenu(false)} className="flex items-center justify-center p-2 rounded-full hover:bg-primary/10 text-primary active:scale-95">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                            <h2 className="text-lg font-bold text-main">Pilih Menu</h2>
                        </div>
                    </header>
                    
                    <div className="p-4 border-b border-border-dim sticky top-[73px] bg-background-app z-10">
                        <div className="relative flex items-center group">
                            <span className="material-symbols-outlined absolute left-4 text-muted">search</span>
                            <input
                                type="text"
                                placeholder="Cari dari daftar resep/HPP..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 rounded-xl border border-border-dim bg-surface focus:ring-2 focus:ring-primary/50 text-main text-sm font-medium transition-all"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                        {isLoading && (
                             <div className="flex justify-center items-center py-6">
                                <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                             </div>
                        )}
                        {!isLoading && filteredRecipes.length === 0 ? (
                            <p className="text-center text-muted py-4">Menu tidak ditemukan.</p>
                        ) : filteredRecipes.map(recipe => {
                            const inCart = sales[recipe.id] > 0;
                            return (
                                <div key={`add-${recipe.id}`} className="flex items-center gap-4 bg-surface p-3 rounded-2xl border border-border-dim shadow-sm">
                                    <div
                                        className="size-16 rounded-xl bg-cover bg-center shrink-0 border border-border-dim"
                                        style={{ backgroundImage: `url('${recipe.imageUrl || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=200&auto=format&fit=crop"}')` }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-main text-sm truncate">{recipe.name}</h3>
                                        <p className="text-[10px] text-muted font-medium mb-1 truncate">{recipe.category}</p>
                                        <p className="text-primary font-black text-xs">Rp {recipe.price.toLocaleString('id-ID')}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!inCart) updateQty(recipe.id, 1);
                                        }}
                                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all focus:outline-none flex items-center gap-1 ${
                                            inCart 
                                            ? 'bg-background-app text-muted cursor-not-allowed border border-transparent opacity-50' 
                                            : 'bg-primary/10 text-primary hover:bg-primary/20 hover:scale-95 active:scale-90 border border-primary/20'
                                        }`}
                                    >
                                        {inCart ? 'Ditambahkan' : (
                                            <>
                                              <span className="material-symbols-outlined text-[16px]">add</span>
                                              Tambah
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;

