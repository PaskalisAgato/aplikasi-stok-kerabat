import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';
import { getOptimizedImageUrl } from '@shared/supabase';
import { PrintService, PrintData } from '@shared/services/PrintService';
import TransactionHistory from './TransactionHistory';
import PrinterSettings from './components/PrinterSettings';
import ThemeToggle from '@shared/ThemeToggle';
import { usePWAInstall } from '@shared/hooks/usePWAInstall';

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
    const [view, setView] = useState<'pos' | 'history'>('pos');
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
    const { isInstallable, deferredPrompt, handleInstall } = usePWAInstall();

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
            alert('Transaksi Berhasil & Struk Dicetak!');
        } catch (error) {
            console.error('Checkout failed', error);
            alert('Transaksi Gagal. Pastikan koneksi internet stabil.');
        } finally {
            setIsCheckingOut(false);
        }
    };

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
                                    : 'bg-[var(--border-dim)] border-[var(--border-dim)] text-[var(--text-muted)] hover:bg-black/5'
                            }`}
                        >
                            <span className="material-symbols-outlined text-2xl font-black">{method.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                        </button>
                    ))}
                </div>
            </div>

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

    return (
        <Layout 
            currentPort={5186} 
            title="Kerabat POS"
            subtitle="Premium Sales Entry"
            footer={PosFooter}
            hideHeader={true}
            hideTitle={true}
            drawerOpen={drawerOpen}
            onDrawerOpen={() => setDrawerOpen(true)}
            onDrawerClose={() => setDrawerOpen(false)}
        >
            <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-500">
                {/* Header Section */}
                <header className="glass border-b border-white/5 p-6 md:p-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 md:gap-8">
                        {/* Hamburger Menu (New Location) */}
                        <button 
                            onClick={() => setDrawerOpen(true)}
                            className="size-10 md:size-14 glass rounded-2xl md:rounded-3xl flex items-center justify-center hover:bg-primary/10 active:scale-95 transition-all text-[var(--text-main)] border border-[var(--border-dim)]"
                        >
                            <span className="material-symbols-outlined text-xl md:text-2xl font-black">menu</span>
                        </button>

                        <div className="size-10 md:size-14 bg-primary rounded-2xl md:rounded-3xl flex items-center justify-center rotate-3 shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-white text-2xl md:text-4xl font-black">coffee</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl md:text-3xl font-black tracking-tighter text-[var(--text-main)]">KERABAT POS</h1>
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-primary opacity-80">Premium Brew</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                            <button 
                                onClick={() => setView('pos')}
                                className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl transition-all flex items-center gap-2 ${view === 'pos' ? 'bg-primary text-[#0b1220] font-black shadow-lg shadow-primary/20 scale-105' : 'text-[var(--text-muted)] hover:bg-white/5 font-bold'}`}
                            >
                                <span className="material-symbols-outlined text-xs md:text-lg">point_of_sale</span>
                                <span className="hidden xs:inline text-[10px] md:text-xs uppercase tracking-widest">POS</span>
                            </button>
                            <button 
                                onClick={() => setView('history')}
                                className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl transition-all flex items-center gap-2 ${view === 'history' ? 'bg-primary text-[#0b1220] font-black shadow-lg shadow-primary/20 scale-105' : 'text-[var(--text-muted)] hover:bg-white/5 font-bold'}`}
                            >
                                <span className="material-symbols-outlined text-xs md:text-lg">history</span>
                                <span className="hidden xs:inline text-[10px] md:text-xs uppercase tracking-widest">History</span>
                            </button>
                        </div>

                        <div className="h-10 w-px border-r border-[var(--border-dim)] mx-1 hidden sm:block"></div>

                        {/* PWA Install Button (Universal Download Button) */}
                        {isInstallable && (
                            <button 
                                onClick={handleInstall}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl md:rounded-[1.5rem] bg-primary/10 text-primary hover:bg-primary hover:text-slate-950 transition-all border border-primary/20 shadow-lg shadow-primary/10 animate-in zoom-in duration-300 active:scale-90 group"
                            >
                                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">{deferredPrompt ? 'download_for_offline' : 'install_mobile'}</span>
                                <span className="hidden xs:inline text-[10px] font-black uppercase tracking-widest">Download App</span>
                            </button>
                        )}

                        {/* Theme Toggle (New Location) */}
                        <div className="scale-90 md:scale-100">
                            <ThemeToggle />
                        </div>

                        <button 
                            onClick={() => setIsPrinterSettingsOpen(true)}
                            className="size-10 md:size-14 glass rounded-2xl md:rounded-3xl flex items-center justify-center hover:bg-primary/10 active:scale-95 transition-all group border border-[var(--border-dim)]"
                        >
                            <span className="material-symbols-outlined text-xl md:text-2xl text-[var(--text-main)] opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all">print</span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden">
                    {view === 'pos' ? (
                        <div className="flex h-full overflow-hidden flex-col md:flex-row">
                            {/* Product List */}
                            <div className="flex-1 overflow-hidden flex flex-col border-r border-white/5">
                                <div className="p-6 md:p-8 shrink-0">
                                    <div className="relative group mb-6">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-[var(--text-muted)] opacity-40 group-focus-within:text-primary group-focus-within:opacity-100 transition-all font-black">search</span>
                                        <input 
                                            type="text" 
                                            placeholder="Cari Menu / Barcode..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-white/5 border-2 border-white/5 rounded-2xl md:rounded-[2rem] pl-16 pr-8 py-4 md:py-6 text-sm md:text-base text-[var(--text-main)] focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-bold placeholder:text-[var(--text-muted)] placeholder:opacity-30 shadow-inner"
                                        />
                                    </div>

                                    {/* Category Selector */}
                                    <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar sticky top-0 z-10 py-2">
                                        {[
                                            { id: null, label: 'Semua', icon: 'apps' },
                                            { id: 'makanan', label: 'Makanan', icon: 'lunch_dining' },
                                            { id: 'minuman', label: 'Minuman', icon: 'local_cafe' },
                                            { id: 'snack', label: 'Snack', icon: 'cookie' }
                                        ].map((cat) => (
                                            <button
                                                key={cat.label}
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl md:rounded-[1.5rem] whitespace-nowrap transition-all active:scale-95 border-2 font-black text-[10px] uppercase tracking-widest ${
                                                    selectedCategory === cat.id 
                                                        ? 'bg-primary border-primary text-slate-950 shadow-lg shadow-primary/20 scale-105' 
                                                        : 'glass border-transparent text-[var(--text-muted)] hover:border-primary/30 hover:text-primary'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8 custom-scrollbar">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-8">
                                            {filteredRecipes.map((item) => (
                                                <button 
                                                    key={item.id}
                                                    onClick={() => updateQty(item.id, 1)}
                                                    className="group relative bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-[32px] overflow-hidden transition-all duration-500 hover:-translate-y-2 active:scale-95 flex flex-col items-center p-2"
                                                >
                                                    <div className="aspect-square w-full rounded-[24px] overflow-hidden mb-4 relative shadow-2xl">
                                                        {item.imageUrl ? (
                                                            <img 
                                                                src={getOptimizedImageUrl(item.imageUrl, { width: 400 })} 
                                                                alt={item.name}
                                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-4xl text-white/10">image</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-app)]/80 via-transparent to-transparent opacity-60"></div>
                                                        
                                                        {sales[item.id] > 0 && (
                                                            <div className="absolute top-4 right-4 size-10 bg-primary text-slate-950 rounded-2xl flex items-center justify-center font-black animate-in zoom-in duration-300 shadow-xl shadow-primary/20">
                                                                {sales[item.id]}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="w-full px-4 pb-4 text-center">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 opacity-60">{item.category}</p>
                                                        <h3 className="text-sm font-bold text-[var(--text-main)] mb-2 line-clamp-1 group-hover:text-primary transition-colors uppercase">{item.name}</h3>
                                                        <p className="text-lg font-black text-[var(--text-main)]/90">
                                                            <span className="text-[10px] text-primary mr-0.5">Rp</span>
                                                            {item.price.toLocaleString('id-ID')}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cart Section */}
                            <div className="w-full md:w-[400px] lg:w-[480px] xl:w-[540px] flex flex-col glass overflow-hidden animate-in slide-in-from-right duration-500">
                                <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tighter text-[var(--text-main)]">Keranjang</h2>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">Review Order</p>
                                    </div>
                                    <button 
                                        onClick={() => setSales({})}
                                        className="size-12 rounded-2xl hover:bg-red-500/10 text-red-500/40 hover:text-red-500 transition-all flex items-center justify-center active:scale-90"
                                    >
                                        <span className="material-symbols-outlined text-2xl">delete_sweep</span>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
                                    {activeCartItems.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                                            <span className="material-symbols-outlined text-8xl mb-6">shopping_basket</span>
                                            <p className="text-lg font-black uppercase tracking-widest">Belum Ada Item</p>
                                            <p className="text-xs font-bold mt-2">Pilih menu di sebelah kiri untuk memulai</p>
                                        </div>
                                    ) : (
                                        activeCartItems.map((item) => (
                                            <div key={item.id} className="group flex items-center gap-6 animate-in slide-in-from-right duration-300">
                                                <div className="size-16 md:size-20 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-lg group-hover:border-primary/30 transition-all">
                                                    {item.imageUrl ? (
                                                        <img src={getOptimizedImageUrl(item.imageUrl, { width: 200 })} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-white/10">image</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm md:text-base font-bold text-[var(--text-main)] mb-1 truncate uppercase">{item.name}</h4>
                                                    <p className="text-xs md:text-sm font-black text-primary">
                                                        <span>Rp</span>
                                                        {(item.price * sales[item.id]).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center bg-[var(--border-dim)] p-1.5 rounded-2xl border border-[var(--border-dim)] backdrop-blur-md">
                                                    <button onClick={() => updateQty(item.id, -1)} className="size-8 md:size-10 rounded-xl hover:bg-black/5 flex items-center justify-center transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]">
                                                        <span className="material-symbols-outlined text-lg font-black">remove</span>
                                                    </button>
                                                    <span className="w-8 md:w-12 text-center text-sm md:text-base font-black text-[var(--text-main)]">{sales[item.id]}</span>
                                                    <button onClick={() => updateQty(item.id, 1)} className="size-8 md:size-10 rounded-xl bg-primary text-slate-950 flex items-center justify-center transition-all shadow-lg shadow-primary/20 active:scale-90">
                                                        <span className="material-symbols-outlined text-lg font-black">add</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <TransactionHistory onBack={() => setView('pos')} />
                    )}
                </main>

                <PrinterSettings 
                    isOpen={isPrinterSettingsOpen}
                    onClose={() => setIsPrinterSettingsOpen(false)}
                />
            </div>
        </Layout>
    );
}

export default App;
