import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';

import Layout from '@shared/Layout';

function App() {
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
        <Layout 
            currentPort={5186} 
            title="Kasir (POS)" 
            maxWidth="1024px"
        >
            <div className="relative flex min-h-[calc(100vh-200px)] w-full flex-col overflow-x-hidden pb-32">
                
                {/* Sales Summary Bar */}
                <div className="bg-surface p-6 rounded-2xl border border-border-dim mb-6 transition-all shadow-sm">
                    <div className="flex justify-between items-center px-1">
                        <div>
                            <p className="text-[10px] uppercase font-black text-muted tracking-widest mb-1">Total Pesanan</p>
                            <p className="text-3xl font-black text-primary">Rp {totalSalesValue.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-black text-muted tracking-widest mb-1">Item</p>
                            <p className="text-2xl font-black text-main">{totalItems}</p>
                        </div>
                    </div>
                </div>

                {/* Cart Action & Header */}
                <div className="mb-6 flex items-center justify-between px-1">
                    <h2 className="font-black text-sm uppercase tracking-widest text-muted">Item Keranjang</h2>
                    <button 
                        onClick={() => setShowAddMenu(true)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary font-black text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 active:scale-95 border border-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Tambah Menu
                    </button>
                </div>

                {/* Menu Grid / Cart Items */}
                <div className="flex-1 space-y-4">
                    {activeCartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center bg-surface rounded-2xl border border-border-dim border-dashed opacity-60">
                            <span className="material-symbols-outlined text-6xl text-muted/30 mb-4 block">shopping_cart</span>
                            <p className="text-muted font-bold tracking-tight">Keranjang masih kosong</p>
                            <p className="text-muted/60 text-xs mt-1">Tambahkan menu untuk memulai transaksi</p>
                        </div>
                    ) : (
                        activeCartItems.map(recipe => (
                            <div key={recipe.id} className="flex items-center gap-4 bg-surface p-4 rounded-2xl border border-border-dim shadow-sm hover:border-primary/30 transition-all">
                                <div
                                    className="size-20 rounded-xl bg-cover bg-center shrink-0 border border-border-dim shadow-inner"
                                    style={{ backgroundImage: `url('${recipe.imageUrl || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=200&auto=format&fit=crop"}')` }}
                                    loading="lazy"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-main text-base leading-tight truncate px-1">{recipe.name}</h3>
                                    <p className="text-primary font-black text-sm mt-1 px-1">Rp {recipe.price.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="flex items-center gap-2 bg-background-app p-1.5 rounded-xl border border-border-dim shrink-0 shadow-inner">
                                    <button
                                        onClick={() => updateQty(recipe.id, -1)}
                                        className="size-9 flex items-center justify-center rounded-lg bg-surface text-primary hover:bg-primary/10 transition-colors shadow-sm font-black"
                                    >-</button>
                                    <span className="w-8 text-center font-black text-base block text-main">{sales[recipe.id] || 0}</span>
                                    <button
                                        onClick={() => updateQty(recipe.id, 1)}
                                        className="size-9 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm font-black"
                                    >+</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Action */}
                <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1024px] bg-background-app/80 backdrop-blur-md border-t border-border-dim p-4 pb-10 z-[40] shadow-2xl px-6 lg:px-10">
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
                                alert('Berhasil! Pembelian telah direkam.');
                                setSales({});
                            } catch (e) {
                                console.error('Checkout error:', e);
                                alert('Transaksi kasir Gagal divalidasi API.');
                            }
                        }}
                        className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 
               ${totalItems > 0 ? 'bg-gradient-to-r from-primary to-[#b36a2b] shadow-primary/40' : 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'}`}
                    >
                        <span className="material-symbols-outlined text-[28px]">payments</span>
                        Catat Penjualan Hari Ini
                    </button>
                </div>
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
            </Layout>
        );
    }

export default App;

