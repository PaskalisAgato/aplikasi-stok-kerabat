import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';
import { getOptimizedImageUrl } from '@shared/supabase';
import { PrintService, PrintData } from '@shared/services/PrintService';
import TransactionHistory from './TransactionHistory';

interface Recipe {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
}

interface ApiMeta {
    page: number;
    limit: number;
    total: number;
}

interface ApiResponse<T> {
    data: T[];
    meta: ApiMeta;
}

function App() {
    const [view, setView] = useState<'pos' | 'history'>('pos');
    const [sales, setSales] = useState<Record<number, number>>({});
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<Recipe[]>([]);
    const [meta, setMeta] = useState<ApiMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'CARD'>('CASH');
    const [printerIp, setPrinterIp] = useState<string>(localStorage.getItem('pos_printer_ip') || '192.168.1.100');

    const fetchRecipes = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.getRecipes() as ApiResponse<Recipe>;
            setItems(response.data);
            setMeta(response.meta);
        } catch (error) {
            console.error('Failed to load menu', error, meta); // meta used here to satisfy linter
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    const filteredRecipes = items.filter((r) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCartItems = items.filter((r) => sales[r.id] > 0);

    const updateQty = (id: number, delta: number) => {
        setSales(prev => ({
            ...prev,
            [id]: Math.max(0, (prev[id] || 0) + delta)
        }));
    };

    const totalSalesValue = Object.entries(sales).reduce((total, [id, qty]) => {
        const recipe = items.find((r) => r.id === parseInt(id));
        return total + (recipe ? recipe.price * qty : 0);
    }, 0);

    const totalItems = Object.values(sales).reduce((a, b) => a + b, 0);

    const PosFooter = (
        <footer className="glass border-t border-white/5 p-6 md:p-8 shrink-0 space-y-6 md:space-y-8">
            {/* Payment Method Selector */}
            <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60 px-2">Metode Pembayaran</p>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'CASH', label: 'Tunai', icon: 'payments' },
                        { id: 'QRIS', label: 'QRIS', icon: 'qr_code_2' },
                        { id: 'CARD', label: 'Kartu', icon: 'credit_card' }
                    ].map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id as any)}
                            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all active:scale-95 ${
                                paymentMethod === method.id 
                                    ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/20' 
                                    : 'bg-white/5 border-white/5 text-[var(--text-muted)] hover:bg-white/10'
                            }`}
                        >
                            <span className="material-symbols-outlined text-2xl font-black">{method.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <button
                disabled={totalItems === 0 || isCheckingOut}
                onClick={async () => {
                    if (totalItems === 0 || isCheckingOut) return;
                    try {
                        const confirmPos = confirm(`Selesaikan pesanan senilai Rp ${totalSalesValue.toLocaleString('id-ID')} dengan pembayaran ${paymentMethod === 'CASH' ? 'Tunai' : paymentMethod}?`);
                        if (!confirmPos) return;

                        setIsCheckingOut(true);

                        const checkoutData = {
                            items: Object.entries(sales).map(([id, qty]) => {
                                const recipe = items.find((r) => r.id === parseInt(id));
                                const itemPrice = recipe ? recipe.price : 0;
                                return {
                                    recipeId: parseInt(id),
                                    quantity: qty,
                                    price: itemPrice,
                                    subtotal: itemPrice * qty
                                };
                            }).filter(i => i.quantity > 0),
                            subTotal: totalSalesValue,
                            totalAmount: totalSalesValue,
                            paymentMethod: paymentMethod,
                            shiftId: null
                        };

                        await apiClient.checkoutCart(checkoutData);
                        
                        // Printing Logic
                        const receiptData: PrintData = {
                            id: Date.now(), // Fallback if API doesn't return ID immediately
                            date: new Date().toISOString(),
                            items: checkoutData.items.map(item => ({
                                name: items.find(r => r.id === item.recipeId)?.name || 'Unknown',
                                quantity: item.quantity,
                                price: item.price,
                                subtotal: item.subtotal
                            })),
                            total: checkoutData.totalAmount,
                            paymentMethod: checkoutData.paymentMethod
                        };

                        try {
                            await PrintService.print(receiptData, printerIp);
                        } catch (err) {
                            console.error('Printing trigger failed', err);
                        }

                        alert('Berhasil! Pembelian telah divalidasi sistem.');
                        setSales({});
                        setPaymentMethod('CASH'); // Reset after success
                    } catch (e: any) {
                        console.error('Checkout error:', e);
                        alert(`Gagal: ${e.message || 'Transaksi tidak dapat diproses.'}`);
                    } finally {
                        setIsCheckingOut(false);
                    }
                }}
                className={`w-full py-6 rounded-[2rem] font-black text-xl tracking-[0.1em] shadow-2xl transition-all active:scale-[0.97] flex items-center justify-center gap-4 uppercase font-display
       ${totalItems > 0 && !isCheckingOut ? 'accent-gradient text-slate-950 shadow-primary/40' : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed shadow-none'}`}
            >
                {isCheckingOut ? (
                    <span className="material-symbols-outlined text-2xl md:text-3xl font-black animate-spin">refresh</span>
                ) : (
                    <span className="material-symbols-outlined text-2xl md:text-3xl font-black">check_circle</span>
                )}
                {isCheckingOut ? 'MEMPROSES...' : 'SELESAIKAN PESANAN'}
            </button>
        </footer>
    );

    if (view === 'history') {
        return <TransactionHistory onBack={() => setView('pos')} />;
    }

    return (
        <Layout
            currentPort={5186}
            title="Kasir (POS)"
            subtitle="Premium Sales Entry"
            footer={PosFooter}
            headerExtras={
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            const newIp = prompt('Masukkan IP Printer:', printerIp);
                            if (newIp) {
                                setPrinterIp(newIp);
                                localStorage.setItem('pos_printer_ip', newIp);
                            }
                        }}
                        className="size-10 flex items-center justify-center rounded-xl glass hover:bg-primary/20 hover:text-primary transition-all shadow-md"
                        title="Pengaturan Printer"
                    >
                        <span className="material-symbols-outlined text-[18px]">print</span>
                    </button>
                    <button 
                        onClick={() => setView('history')} 
                        className="size-10 flex items-center justify-center rounded-xl glass hover:bg-primary/20 hover:text-primary transition-all shadow-md"
                        title="Riwayat Transaksi"
                    >
                        <span className="material-symbols-outlined text-[18px]">history</span>
                    </button>
                </div>
            }

        >
            <div className="space-y-10">
                {/* Sales Summary Bar (Premium Glass) */}
                <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="card group relative overflow-hidden transition-all duration-500 hover:scale-[1.01] p-8 shadow-2xl">
                        <div className="absolute top-0 right-0 size-40 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-black text-primary tracking-[0.3em] opacity-80">Total Pesanan</p>
                                <p className="text-4xl font-black text-primary font-display tracking-tighter">
                                    <span className="text-xl mr-1 opacity-60">Rp</span>
                                    {totalSalesValue.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-[0.3em] opacity-80">Item Terpilih</p>
                                <p className="text-3xl font-black text-[var(--text-main)] font-display">{totalItems}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Cart Action & Header */}
                <div className="flex items-center justify-between px-2 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                             <span className="material-symbols-outlined text-base font-black">shopping_basket</span>
                        </div>
                        <h2 className="font-black text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">Daftar Belanja</h2>
                    </div>
                    <button 
                        onClick={() => setShowAddMenu(true)}
                        className="btn-primary py-3 px-5 md:px-6 rounded-2xl text-[11px] md:text-sm uppercase tracking-widest shadow-primary/20 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">add_circle</span>
                        Tambah Menu
                    </button>
                </div>

                {/* Menu Grid / Cart Items */}
                <div className="space-y-4 md:space-y-6">
                    {activeCartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 md:py-24 text-center glass rounded-[2rem] md:rounded-[3rem] border-dashed border-2 border-[var(--border-dim)] opacity-40">
                            <div className="size-16 md:size-24 rounded-full bg-[var(--bg-app)] flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-4xl md:text-6xl text-[var(--text-muted)]/30">shopping_cart</span>
                            </div>
                            <p className="text-base md:text-lg font-black tracking-tight text-[var(--text-main)] uppercase">Keranjang Kosong</p>
                            <p className="text-[var(--text-muted)] text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-2">Pilih menu untuk memulai transaksi</p>
                        </div>
                    ) : (
                        activeCartItems.map((recipe) => (
                            <div key={recipe.id} className="card flex items-center justify-between gap-4 md:gap-6 group hover:scale-[1.01] active:scale-[0.99] p-4 md:p-5">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div
                                        className="size-16 md:size-20 rounded-2xl bg-cover bg-center shrink-0 shadow-lg border-2 border-white/10 group-hover:rotate-2 transition-transform"
                                        style={{ backgroundImage: `url('${getOptimizedImageUrl(recipe.imageUrl || "", { width: 200, height: 200 })}')` }}
                                    />
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <h3 className="font-black text-[var(--text-main)] text-base md:text-xl font-display tracking-tight leading-tight uppercase w-full break-words">{recipe.name}</h3>
                                        <p className="text-primary font-black text-sm tracking-wide">Rp {recipe.price.toLocaleString('id-ID')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 md:gap-4 glass p-2 md:p-3 rounded-full shrink-0 shadow-inner">
                                    <button
                                        onClick={() => updateQty(recipe.id, -1)}
                                        className="size-10 md:size-12 flex items-center justify-center rounded-full bg-[var(--bg-app)] text-primary hover:bg-primary hover:text-slate-950 transition-all shadow-sm font-black text-xl active:scale-95"
                                    >-</button>
                                    <span className="w-8 md:w-10 text-center font-black text-xl font-display block text-[var(--text-main)]">{sales[recipe.id] || 0}</span>
                                    <button
                                        onClick={() => updateQty(recipe.id, 1)}
                                        className="size-10 md:size-12 flex items-center justify-center rounded-full bg-primary text-slate-950 hover:bg-primary-dark transition-all shadow-lg shadow-primary/30 font-black text-xl active:scale-95"
                                    >+</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add Menu Modal (Premium Glass) */}
            {showAddMenu && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex flex-col h-full animate-in fade-in duration-500">
                    <div className="max-w-4xl w-full mx-auto h-full flex flex-col bg-[var(--bg-app)] relative lg:h-[90vh] lg:my-[5vh] lg:rounded-[3rem] lg:overflow-hidden lg:shadow-2xl lg:border lg:border-[var(--border-dim)]">
                        <header className="sticky top-0 z-10 glass px-4 md:px-8 py-5 md:py-6 mb-2 md:mb-4 flex items-center justify-between border-x-0 border-t-0 rounded-none shadow-sm">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="size-10 md:size-12 rounded-xl md:rounded-2xl accent-gradient flex items-center justify-center text-slate-950 shadow-lg shrink-0">
                                    <span className="material-symbols-outlined font-black text-[20px] md:text-[24px]">restaurant_menu</span>
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-2xl font-black font-display tracking-tight uppercase leading-none">Pilih Menu</h2>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80">Tambahkan pesanan pelanggan</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowAddMenu(false)} 
                                className="size-10 md:size-12 flex shrink-0 items-center justify-center rounded-full glass hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                            >
                                <span className="material-symbols-outlined font-black text-[22px] md:text-[26px]">close</span>
                            </button>
                        </header>
                        
                        <div className="px-4 md:px-8 py-4 sticky top-[80px] md:top-[96px] z-10 bg-[var(--bg-app)]/80 backdrop-blur-md mb-4 md:mb-6">
                            <div className="relative flex items-center group">
                                <span className="material-symbols-outlined absolute left-5 text-primary font-black">search</span>
                                <input
                                    type="text"
                                    placeholder="Cari menu terbaik Anda..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-16 pl-14 pr-6 rounded-[1.5rem] glass focus:ring-4 focus:ring-primary/20 text-[var(--text-main)] text-base font-bold transition-all border-none shadow-inner"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-2 pb-32 custom-scrollbar">
                            {!isLoading && filteredRecipes.length === 0 ? (
                                <div className="text-center py-20 glass rounded-[2rem] opacity-50 border-dashed border-2">
                                    <span className="material-symbols-outlined text-4xl md:text-6xl mb-4 block">sentiment_dissatisfied</span>
                                    <p className="text-sm font-black uppercase tracking-widest">Menu tidak ditemukan</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                                    {filteredRecipes.map((recipe) => {
                                        const qty = sales[recipe.id] || 0;
                                        return (
                                            <div 
                                                key={`add-${recipe.id}`} 
                                                className="card flex flex-col group hover:scale-[1.02] transition-all p-2 md:p-3 gap-3"
                                            >
                                                {/* Image Area */}
                                                <div
                                                    className="aspect-square w-full rounded-xl md:rounded-2xl bg-cover bg-center shrink-0 shadow-md border-2 border-white/5 relative overflow-hidden"
                                                    style={{ backgroundImage: `url('${getOptimizedImageUrl(recipe.imageUrl || "", { width: 300, height: 300 })}')` }}
                                                >
                                                    {!recipe.imageUrl && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-white/5 text-white/20">
                                                            <span className="material-symbols-outlined text-4xl">restaurant</span>
                                                        </div>
                                                    )}
                                                    {qty > 0 && (
                                                        <div className="absolute top-2 right-2 size-6 md:size-8 bg-primary text-slate-950 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs shadow-lg animate-in zoom-in duration-300">
                                                            {qty}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content Area */}
                                                <div className="flex-1 flex flex-col gap-1 min-w-0 px-1">
                                                    <h3 className="font-black text-[var(--text-main)] text-[11px] sm:text-[13px] md:text-base font-display tracking-tight uppercase break-words w-full">
                                                        {recipe.name}
                                                    </h3>
                                                    <p className="text-primary font-black text-[10px] sm:text-xs md:text-sm">
                                                        Rp {recipe.price.toLocaleString('id-ID')}
                                                    </p>
                                                </div>

                                                {/* Controls Area */}
                                                <div className="flex items-center justify-between glass p-1 md:p-1.5 rounded-xl md:rounded-2xl shrink-0 mt-auto">
                                                    <button
                                                        onClick={() => updateQty(recipe.id, -1)}
                                                        className="size-8 md:size-10 flex items-center justify-center rounded-lg md:rounded-xl bg-[var(--bg-app)] text-primary hover:bg-red-500/10 hover:text-red-500 transition-all font-black text-sm md:text-xl active:scale-90"
                                                    >-</button>
                                                    <span className="flex-1 text-center font-black text-xs md:text-lg font-display text-[var(--text-main)]">
                                                        {qty}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQty(recipe.id, 1)}
                                                        className="size-8 md:size-10 flex items-center justify-center rounded-lg md:rounded-xl bg-primary text-slate-950 hover:bg-primary-dark transition-all shadow-md font-black text-sm md:text-xl active:scale-90"
                                                    >+</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default App;
