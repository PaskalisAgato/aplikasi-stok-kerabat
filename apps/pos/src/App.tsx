import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';
import { getOptimizedImageUrl } from '@shared/supabase';
import { PrintService, PrintData } from '@shared/services/PrintService';
import TransactionHistory from './TransactionHistory';
import PrinterSettings from '@shared/components/PrinterSettings';

interface Recipe {
    id: number;
    name: string;
    price: number;
    category: string;
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
    const [view, setView] = useState<'pos' | 'history' | 'printer-settings'>('pos');
    const [sales, setSales] = useState<Record<number, number>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<Recipe[]>([]);
    const [meta, setMeta] = useState<ApiMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'CARD'>('CASH');
    const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [amountPaid, setAmountPaid] = useState<number>(0);

    const fetchRecipes = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.getRecipes() as ApiResponse<Recipe>;
            setItems(response.data);
            setMeta(response.meta);
        } catch (error) {
            console.error('Failed to load menu', error, meta); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();

        const handleOpenPrinterSettings = () => setView('printer-settings');
        window.addEventListener('open-printer-settings', handleOpenPrinterSettings);
        return () => window.removeEventListener('open-printer-settings', handleOpenPrinterSettings);
    }, []);

    const filteredRecipes = items.filter((r) => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || r.category?.toLowerCase() === selectedCategory.toLowerCase();
        return matchesSearch && matchesCategory;
    });

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

    const changeDue = Math.max(0, amountPaid - totalSalesValue);

    const handleCheckout = async (skipConfirm = false) => {
        console.log('🚀 Checkout triggered', { totalSalesValue, totalItems, paymentMethod, skipConfirm });
        if (totalSalesValue === 0) {
            console.warn('⚠️ Checkout aborted: totalSalesValue is 0');
            return;
        }
        
        if (!skipConfirm) {
            if (!confirm(`Selesaikan pesanan senilai Rp ${totalSalesValue.toLocaleString('id-ID')}?`)) return;
        }

        setIsCheckingOut(true);
        try {
            const checkoutData = {
                items: activeCartItems.map(item => ({
                    recipeId: item.id,
                    quantity: sales[item.id],
                    price: item.price,
                    subtotal: item.price * sales[item.id]
                })),
                paymentMethod,
                subTotal: totalSalesValue,
                totalAmount: totalSalesValue,
                taxAmount: 0
            };

            const response = await apiClient.checkoutCart(checkoutData) as { data: { id: number, createdAt: string } };
            
            // Generate print data with categories
            const printData: PrintData = {
                id: response.data?.id || Date.now(),
                date: response.data?.createdAt || new Date().toISOString(),
                paymentMethod,
                total: totalSalesValue,
                amountPaid: paymentMethod === 'CASH' ? amountPaid : totalSalesValue,
                changeDue: paymentMethod === 'CASH' ? changeDue : 0,
                items: activeCartItems.map(item => ({
                    name: item.name,
                    quantity: sales[item.id],
                    price: item.price,
                    subtotal: item.price * sales[item.id],
                    category: item.category
                }))
            };

            // Smart printing: Main Receipt + Prep Tickets (Kitchen/Bar)
            await PrintService.printOrder(printData);

            setSales({});
            setPaymentMethod('CASH');
            setAmountPaid(0);
            alert(`Transaksi Berhasil! Kembalian: Rp ${changeDue.toLocaleString('id-ID')}`);
        } catch (error) {
            console.error('Checkout failed', error);
            alert('Transaksi Gagal. Pastikan koneksi internet stabil.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const PosFooter = (
        <footer className="glass border-t border-white/5 p-4 md:p-6 shrink-0 space-y-4 md:space-y-6">
            {/* Payment Method Selector */}
            <div className="space-y-2 md:space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 px-2">Metode Pembayaran</p>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'CASH', label: 'Tunai', icon: 'payments' },
                        { id: 'QRIS', label: 'QRIS', icon: 'qr_code_2' },
                        { id: 'CARD', label: 'Kartu', icon: 'credit_card' }
                    ].map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id as any)}
                            className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl border-2 transition-all active:scale-95 ${
                                paymentMethod === method.id 
                                    ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/20' 
                                    : 'bg-[var(--border-dim)] border-[var(--border-dim)] text-[var(--text-muted)] hover:bg-black/5'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg font-black">{method.icon}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest">{method.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cash Payment Section */}
            {paymentMethod === 'CASH' && (
                <div className="space-y-3 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between px-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">Uang Bayar (Cash)</p>
                        <div className="flex gap-2">
                            {[20000, 50000, 100000].map(amount => (
                                <button 
                                    key={amount}
                                    onClick={() => setAmountPaid(amount)}
                                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black hover:bg-primary/20 hover:text-primary transition-all"
                                >
                                    {amount / 1000}k
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-xs md:text-sm">Rp</span>
                            <input 
                                type="number" 
                                value={amountPaid || ''}
                                onChange={(e) => setAmountPaid(parseInt(e.target.value) || 0)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 md:pl-12 pr-4 py-3 md:py-4 text-sm md:text-xl font-black text-[var(--text-main)] outline-none focus:border-primary/50 transition-all placeholder:text-[var(--text-muted)] placeholder:opacity-30"
                                placeholder="0"
                            />
                        </div>
                        <div className="flex-1 bg-primary/5 border border-primary/20 rounded-2xl px-5 py-2.5 flex flex-col justify-center">
                            <p className="text-[8px] font-black uppercase tracking-widest text-primary opacity-60">Kembalian</p>
                            <p className="text-sm md:text-lg font-black text-primary">
                                <span className="text-[9px] mr-1">Rp</span>
                                {changeDue.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4 md:space-y-6 text-[var(--text-main)]">
                <div className="flex items-end justify-between px-2">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">Total Bayar</p>
                        <p className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--text-main)]">
                            <span className="text-primary mr-1">Rp</span>
                            {totalSalesValue.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="bg-[var(--border-dim)] px-4 py-2 rounded-xl border border-[var(--border-dim)]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                            {totalItems} Items
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => handleCheckout(true)}
                    disabled={isCheckingOut || totalItems === 0}
                    className="w-full h-16 md:h-24 bg-primary text-slate-950 rounded-2xl md:rounded-[32px] font-black text-lg md:text-2xl uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-4"
                >
                    {isCheckingOut ? (
                        <>
                            <div className="size-6 border-4 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                            <span>Memproses...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-3xl font-black">shopping_bag</span>
                            <span>Checkout</span>
                        </>
                    )}
                </button>
            </div>
        </footer>
    );

    const PosHeaderExtras = (
        <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
            <div className="flex bg-white/5 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-white/5 scale-90 sm:scale-100">
                <button 
                    onClick={() => setView('pos')}
                    className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 ${view === 'pos' ? 'bg-primary text-[#0b1220] font-black shadow-lg shadow-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5 font-bold'}`}
                >
                    <span className="material-symbols-outlined text-[12px] sm:text-[14px]">point_of_sale</span>
                    <span className="hidden min-[380px]:inline text-[8px] sm:text-[9px] uppercase tracking-widest">POS</span>
                </button>
                <button 
                    onClick={() => setView('history')}
                    className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 ${view === 'history' ? 'bg-primary text-[#0b1220] font-black shadow-lg shadow-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5 font-bold'}`}
                >
                    <span className="material-symbols-outlined text-[12px] sm:text-[14px]">history</span>
                    <span className="hidden min-[380px]:inline text-[8px] sm:text-[9px] uppercase tracking-widest">History</span>
                </button>
            </div>

            <button 
                onClick={() => setIsPrinterSettingsOpen(true)}
                className="size-8 sm:size-10 glass rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-primary/10 active:scale-95 transition-all group border border-[var(--border-dim)]"
                title="Printer Settings"
            >
                <span className="material-symbols-outlined text-base sm:text-lg text-[var(--text-main)] opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all">print</span>
            </button>
        </div>
    );

    const pageTitle = view === 'history' ? 'Riwayat Penjualan' : view === 'printer-settings' ? 'Pengaturan Printer' : 'Input Penjualan';
    const pageSubtitle = view === 'history' ? 'Manajemen Transaksi' : view === 'printer-settings' ? 'Hardware & Koneksi' : 'Kasir & Stok';

    return (
        <Layout 
            currentPort={5186} 
            title={pageTitle}
            subtitle={pageSubtitle}
            maxWidth="100%"
            footer={view === 'pos' ? PosFooter : null}
            headerExtras={PosHeaderExtras}
            drawerOpen={drawerOpen}
            onDrawerOpen={() => setDrawerOpen(true)}
            onDrawerClose={() => setDrawerOpen(false)}
        >
            <div className="space-y-8">
                {view === 'pos' && (
                    <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                        {/* Left: Input & Menu */}
                        <div className="w-full md:w-3/5 space-y-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex flex-wrap gap-2">
                                    <button 
                                        onClick={() => setSelectedCategory(null)}
                                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${!selectedCategory ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20 accent-glow scale-105' : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10'}`}
                                    >
                                        Semua
                                    </button>
                                    {Array.from(new Set(items.map(i => i.category))).filter(Boolean).map(cat => (
                                        <button 
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${selectedCategory === cat ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20 accent-glow scale-105' : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                <div className="w-full sm:w-64 relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-primary transition-colors text-xl">search</span>
                                    <input 
                                        type="text" 
                                        placeholder="Cari Menu..." 
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold text-[var(--text-main)] outline-none focus:border-primary/50 transition-all placeholder:text-[var(--text-muted)] placeholder:opacity-50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {isLoading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="glass aspect-[4/5] rounded-[2rem] animate-pulse"></div>
                                    ))
                                ) : filteredRecipes.map((item) => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => updateQty(item.id, 1)}
                                        className="group relative glass rounded-[2rem] overflow-hidden cursor-pointer hover:translate-y--2 transition-all duration-500 border border-white/5 hover:border-primary/30"
                                    >
                                        <div className="aspect-[4/5] relative">
                                            <img 
                                                src={getOptimizedImageUrl(item.imageUrl || '', { width: 400 })} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60"></div>
                                            
                                            <div className="absolute top-4 right-4 h-8 px-3 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{item.category}</p>
                                            </div>

                                            <div className="absolute inset-x-0 bottom-0 p-6 space-y-1 transform transition-transform duration-500 group-hover:translate-y--2">
                                                <h3 className="font-black text-sm uppercase tracking-tight text-white leading-tight">{item.name}</h3>
                                                <p className="text-primary font-black text-xs">Rp {item.price.toLocaleString('id-ID')}</p>
                                            </div>

                                            {sales[item.id] > 0 && (
                                                <div className="absolute top-4 left-4 size-10 rounded-2xl bg-primary text-slate-950 flex items-center justify-center font-black text-sm shadow-xl shadow-primary/40 animate-in zoom-in">
                                                    {sales[item.id]}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Cart Review */}
                        <div className="w-full md:w-2/5 flex flex-col gap-6">
                            <div className="glass rounded-[2.5rem] p-8 border border-white/5 flex flex-col min-h-[400px] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <span className="material-symbols-outlined text-[120px] font-black tracking-tighter">shopping_basket</span>
                                </div>

                                <div className="flex items-center justify-between mb-8 relative">
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">Keranjang</h2>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{totalItems} Item terpilih</p>
                                    </div>
                                    <button 
                                        onClick={() => setSales({})}
                                        className="text-[10px] font-black text-red-400/60 uppercase tracking-widest hover:text-red-400 transition-colors"
                                    >
                                        Reset Item
                                    </button>
                                </div>

                                <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 relative">
                                    {activeCartItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full py-20 opacity-30">
                                            <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
                                            <p className="text-xs font-black uppercase tracking-widest">Belum ada pesanan</p>
                                        </div>
                                    ) : activeCartItems.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-xs uppercase tracking-tight truncate text-white">{item.name}</p>
                                                <p className="text-[10px] font-bold text-primary">Rp {(item.price * sales[item.id]).toLocaleString('id-ID')}</p>
                                            </div>
                                            <div className="flex items-center gap-4 bg-white/10 rounded-xl p-1.5 border border-white/10">
                                                <button 
                                                    onClick={() => updateQty(item.id, -1)}
                                                    className="size-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-red-300 transition-all font-black"
                                                >
                                                    -
                                                </button>
                                                <span className="text-xs font-black w-4 text-center text-white">{sales[item.id]}</span>
                                                <button 
                                                    onClick={() => updateQty(item.id, 1)}
                                                    className="size-7 rounded-lg flex items-center justify-center hover:bg-emerald-500/20 text-emerald-300 transition-all font-black"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'history' && (
                    <TransactionHistory onBack={() => setView('pos')} />
                )}

                {view === 'printer-settings' && (
                    <PrinterSettings 
                        isOpen={true} 
                        onClose={() => setView('pos')} 
                        isFullPage={true} 
                    />
                )}
            </div>

            <PrinterSettings 
                isOpen={isPrinterSettingsOpen}
                onClose={() => setIsPrinterSettingsOpen(false)}
            />
        </Layout>
    );
}

export default App;
