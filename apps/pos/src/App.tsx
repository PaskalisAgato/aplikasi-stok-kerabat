import { useState, useEffect, memo, useCallback, useMemo, useRef } from 'react';
import { useKeyboardCashier } from './hooks/useKeyboardCashier';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';
import { PrintService, PrintData } from '@shared/services/PrintService';
import TransactionHistory from './TransactionHistory';
import PrinterSettings from '@shared/components/PrinterSettings';
import { db } from '@shared/services/db';
import { syncEngine } from '@shared/services/SyncEngine';
import { PerformanceSettings } from '@shared/services/performance';

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

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const MemoizedProductCard = memo(({ item, saleCount, isHighlighted, onUpdateQty }: { item: Recipe, saleCount: number, isHighlighted: boolean, onUpdateQty: (id: number, delta: number) => void }) => {
    return (
        <div 
            onClick={() => onUpdateQty(item.id, 1)}
            className={`cursor-pointer transition-all border p-2.5 sm:p-3 flex flex-col justify-between ${isHighlighted ? 'border-primary ring-2 ring-primary/50 bg-primary/10 scale-[1.02] shadow-md z-10' : 'border-[var(--border-dim)] bg-[var(--bg-app)] hover:bg-[var(--glass-bg)] shadow-sm hover:shadow-md hover:-translate-y-0.5'} rounded-xl h-[72px]`}
        >
            <div className="flex justify-between items-start gap-1">
                <h3 className="font-black text-[10px] sm:text-[11px] leading-[1.1] text-[var(--text-main)] line-clamp-2 uppercase tracking-tight">{item.name}</h3>
                {saleCount > 0 && (
                    <span className="bg-primary text-slate-900 font-black text-[9px] px-1.5 py-0.5 rounded-md shadow-sm shrink-0">
                        x{saleCount}
                    </span>
                )}
            </div>
            
            <div className="flex items-end justify-between mt-1">
                <p className="text-primary font-black text-[10px]">
                    Rp {item.price.toLocaleString('id-ID')}
                </p>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
            </div>
        </div>
    );
}, (prev, next) => prev.item.id === next.item.id && prev.saleCount === next.saleCount && prev.isHighlighted === next.isHighlighted);

const MemoizedCartItem = memo(({ item, salesCount, updateQty }: { item: Recipe & { qty?: number }, salesCount: number, updateQty: (id: number, delta: number) => void }) => {
    return (
        <div className="flex items-center justify-between group py-1.5 border-b border-[var(--border-dim)] last:border-0 hover:bg-[var(--glass-bg)] -mx-1 px-1 rounded-lg transition-colors">
            <div className="flex-1 min-w-0 pr-2">
                <p className="font-black text-[10px] sm:text-[11px] uppercase tracking-tight truncate text-[var(--text-main)] leading-none mb-0.5">{item.name}</p>
                <p className="text-[9px] font-bold text-primary leading-none">Rp {(item.price * salesCount).toLocaleString('id-ID')}</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[var(--bg-app)] rounded-lg p-0.5 sm:p-1 border border-[var(--border-dim)]">
                <button 
                    onClick={() => updateQty(item.id, -1)}
                    className="size-5 sm:size-6 rounded flex items-center justify-center hover:bg-red-500/20 text-red-500 transition-colors font-black text-[10px] sm:text-xs"
                >
                    -
                </button>
                <span className="text-[9px] sm:text-[10px] font-black w-4 text-center text-[var(--text-main)]">{salesCount}</span>
                <button 
                    onClick={() => updateQty(item.id, 1)}
                    className="size-5 sm:size-6 rounded flex items-center justify-center hover:bg-emerald-500/20 text-emerald-500 transition-colors font-black text-[10px] sm:text-xs"
                >
                    +
                </button>
            </div>
        </div>
    );
});

function App() {
    const [view, setView] = useState<'pos' | 'history' | 'printer-settings'>('pos');
    const [sales, setSales] = useState<Record<number, number>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'CARD'>('CASH');
    const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [openBills, setOpenBills] = useState<any[]>([]);
    const [currentBillId, setCurrentBillId] = useState<string | number | null>(null);
    const [customerInfo, setCustomerInfo] = useState('');
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [sourceBillToMerge, setSourceBillToMerge] = useState<any>(null);

    const fetchRecipes = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.getRecipes() as ApiResponse<Recipe>;
            setItems(response.data);
            
            // Cache menu items for offline access
            await db.inventoryCache.bulkPut(response.data.map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                unit: 'pcs', // Default
                currentStock: '0',
                minStock: '0',
                pricePerUnit: item.price.toString(),
                status: 'NORMAL',
                version: 1, // Phase 8: Data drift protection
                updatedAt: new Date().toISOString()
            })));
        } catch (error) {
            console.error('Failed to load menu, trying local cache...', error);
            const cachedItems = await db.inventoryCache.toArray();
            if (cachedItems.length > 0) {
                setItems(cachedItems.map(c => ({
                    id: c.id,
                    name: c.name,
                    price: parseFloat(c.pricePerUnit),
                    category: c.category
                })));
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();

        // Load persisted cart
        db.cart.get('current_cart').then(savedCart => {
            if (savedCart && savedCart.items.length > 0) {
                const initialSales: Record<number, number> = {};
                savedCart.items.forEach(item => {
                    initialSales[item.id] = item.qty;
                });
                setSales(initialSales);
            }
        });

        const handleOpenPrinterSettings = () => setView('printer-settings');
        window.addEventListener('open-printer-settings', handleOpenPrinterSettings);

        // Syncing & Offline-First Persistence (Phase 6 & 7)
        syncEngine.start();
        
        // Recovery Phase (Phase 7)
        PrintService.recover();
        
        // Initial Pull Sync
        syncEngine.pullInventory();

        const unsubscribe = syncEngine.onChange((count) => {
            setPendingSyncCount(count);
        });

        const unsubscribeState = syncEngine.onStateChange((state) => {
            setIsSyncing(state.isPulling);
            setIsPushing(state.isPushing);
        });

        // Online Status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Fetch Open Bills
        const fetchOpenBills = async () => {
            try {
                const response = await apiClient.get('/transactions/open-bills') as any;
                if (response && response.data) setOpenBills(response.data);
            } catch (error) {
                console.error('Failed to fetch open bills');
            }
        };
        fetchOpenBills();

        return () => {
            window.removeEventListener('open-printer-settings', handleOpenPrinterSettings);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubscribe();
            unsubscribeState();
            syncEngine.stop();
        };
    }, []);

    // Persist cart on change
    useEffect(() => {
        const cartItems = Object.entries(sales)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => ({ id: parseInt(id), qty }));
        
        db.cart.put({ id: 'current_cart', items: cartItems, updatedAt: new Date().toISOString() });
    }, [sales]);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const filteredRecipes = useMemo(() => items.filter((r) => {
        const matchesSearch = r.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || r.category?.toLowerCase() === selectedCategory.toLowerCase();
        return matchesSearch && matchesCategory;
    }), [items, debouncedSearchTerm, selectedCategory]);

    const activeCartItems = useMemo(() => items.filter((r) => sales[r.id] > 0), [items, sales]);

    const updateQty = useCallback((id: number, delta: number) => {
        setSales(prev => ({
            ...prev,
            [id]: Math.max(0, (prev[id] || 0) + delta)
        }));
    }, []);

    // --- PHASE 9: KEYBOARD-FIRST CASHIER UX ---
    // Handle Checkout directly
    const triggerCheckout = useCallback(() => {
        const _sales = Object.values(sales).reduce((a, b) => a + b, 0);
        if (_sales > 0) {
            const btn = document.getElementById('btn-checkout');
            if (btn) btn.click();
        }
    }, [sales]);

    const { highlightedIndex, setHighlightedIndex } = useKeyboardCashier({
        maxIndex: filteredRecipes.length,
        onSearchFocus: () => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
                // Select all text for easy replacement
                searchInputRef.current.select();
            }
        },
        onCheckout: triggerCheckout,
        onClearCart: () => {
            if (confirm('Apakah Anda yakin ingin mereset keranjang? (Ctrl+Delete)')) {
                setSales({});
                if (searchInputRef.current) searchInputRef.current.focus();
            }
        },
        onAddHighlightedItem: (index) => {
            if (filteredRecipes[index]) {
                updateQty(filteredRecipes[index].id, 1);
            }
        }
    });

    // Reset highlighted index when filtering
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [debouncedSearchTerm, selectedCategory, setHighlightedIndex]);

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
            const transactionId = crypto.randomUUID();
            const checkoutData = {
                id: transactionId, // Idempotency key / Device ID
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

            // 1. Generate print data FIRST to retain Chrome User-Gesture token
            const printData: PrintData = {
                id: transactionId as any,
                date: new Date().toISOString(),
                paymentMethod,
                total: totalSalesValue,
                amountPaid: paymentMethod === 'CASH' ? amountPaid : totalSalesValue,
                change_due: paymentMethod === 'CASH' ? changeDue : 0,
                items: activeCartItems.map(item => ({
                    name: item.name,
                    quantity: sales[item.id],
                    price: item.price,
                    subtotal: item.price * sales[item.id],
                    category: item.category
                }))
            };

            // 2. Print (Background task) - Call IMMEDIATELY before yielding to DB
            PrintService.printOrder(printData).catch(err => {
                console.error('Printing failed', err);
            });

            // 3. Save to Offline DB
            await db.transactions.add({
                id: transactionId,
                receipt_number: `TRX-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}-${Math.floor(1000 + Math.random() * 9000)}`,
                total_amount: totalSalesValue,
                payment_method: paymentMethod as any,
                items: checkoutData.items,
                created_at: new Date().toISOString(),
                sync_status: 'PENDING',
                retry_count: 0,
                // Phase 8: Multi-outlet ready
                outlet_id: 'OUTLET-001', // Example
                device_id: 'POS-01',
                cashier_id: 'CASHIER-A'
            });

            // Phase 8: Audit Log
            await db.auditLog.add({
                action: 'CHECKOUT',
                entity: 'Transaction',
                entityId: transactionId,
                timestamp: new Date().toISOString(),
                userId: 'CASHIER-A',
                deviceId: 'POS-01'
            });

            // 4. Reset UI state immediately (Optimistic Response)
            setSales({});
            setPaymentMethod('CASH');
            setAmountPaid(0);
            
            // 5. Try to sync in background (Phase 6.2 will have a more robust engine)
            // 5. Try to sync in background (Phase 6.2 will have a more robust engine)
            const payload = { ...checkoutData, status: 'PAID', customerInfo };
            apiClient.post('/transactions', payload)
                .then(() => db.transactions.update(transactionId, { sync_status: 'SYNCED' }))
                .catch(err => console.log('Sync will be retried later', err));

            alert(`Transaksi Berhasil! Simpan Offline. Kembalian: Rp ${changeDue.toLocaleString('id-ID')}`);
            setCustomerInfo('');
            setCurrentBillId(null);
        } catch (error) {
            console.error('Checkout failed', error);
            alert('Gagal menyimpan transaksi ke database lokal.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleSaveBill = async () => {
        let info: string | null = customerInfo;
        if (!info) {
            const table = prompt('Masukkan Nomor Meja / Nama Pelanggan:');
            if (table === null || table === '') return;
            info = table;
        }

        // Duplicate Check for OPEN bills
        if (openBills.some(b => b.customerInfo?.toLowerCase() === info.toLowerCase())) {
            alert(`Tagihan untuk "${info}" sudah ada di Daftar Bill Aktif. Silakan pilih meja tersebut jika ingin menambahkan item.`);
            return;
        }

        setCustomerInfo(info);
        setIsCheckingOut(true);
        try {
            const checkoutData = {
                id: crypto.randomUUID(),
                items: activeCartItems.map(item => ({
                    recipeId: item.id,
                    quantity: sales[item.id],
                    price: item.price,
                    subtotal: (item.price || 0) * (sales[item.id] || 0)
                })),
                status: 'OPEN',
                customerInfo: info,
                paymentMethod: 'CASH',
                subTotal: totalSalesValue,
                totalAmount: totalSalesValue
            };

            await apiClient.post('/transactions', checkoutData);
            alert('Bill berhasil disimpan!');
            setSales({});
            setCustomerInfo('');
            setCurrentBillId(null);
            
            // Refresh open bills
            const response = await apiClient.get('/transactions/open-bills') as any;
            if (response && response.data) setOpenBills(response.data);
        } catch (error) {
            alert('Gagal menyimpan bill');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleUpdateBill = async () => {
        if (!currentBillId) return;
        setIsCheckingOut(true);
        try {
            const items = activeCartItems.map(item => ({
                recipeId: item.id,
                quantity: sales[item.id],
                price: item.price
            }));

            await apiClient.addItemsToBill(currentBillId, items);
            alert('Bill berhasil diperbarui!');
            
            // Refresh
            const response = await apiClient.get('/transactions/open-bills') as any;
            if (response && response.data) setOpenBills(response.data);
        } catch (error) {
            alert('Gagal memperbarui bill');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const loadBill = (bill: any) => {
        const newSales: Record<number, number> = {};
        bill.items.forEach((item: any) => {
            newSales[item.recipeId] = item.quantity;
        });
        setSales(newSales);
        setCurrentBillId(bill.id);
        setCustomerInfo(bill.customerInfo);
        alert(`Memuat Bill: ${bill.customerInfo}`);
    };

    const handleDeleteBill = async (e: React.MouseEvent, bill: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`Hapus/Batalkan Bill untuk "${bill.customerInfo}"? Stok yang sudah dipotong tidak akan otomatis kembali.`)) return;
        
        try {
            await apiClient.deleteTransaction(bill.id);
            alert('Bill berhasil dibatalkan');
            // Refresh
            const response = await apiClient.get('/transactions/open-bills') as any;
            if (response && response.data) setOpenBills(response.data);
            if (currentBillId === bill.id) {
                setCurrentBillId(null);
                setCustomerInfo('');
                setSales({});
            }
        } catch (error) {
            alert('Gagal menghapus bill');
        }
    };

    const handleMergeClick = (e: React.MouseEvent, bill: any) => {
        e.preventDefault();
        e.stopPropagation();
        setSourceBillToMerge(bill);
        setIsMergeModalOpen(true);
    };

    const performMerge = async (targetBill: any) => {
        if (!sourceBillToMerge) return;
        if (!confirm(`Gabungkan bill "${sourceBillToMerge.customerInfo}" ke dalam bill "${targetBill.customerInfo}"?`)) return;
        
        setIsCheckingOut(true);
        try {
            await apiClient.mergeBills(sourceBillToMerge.id, targetBill.id);
            alert('Bill berhasil digabungkan!');
            setIsMergeModalOpen(false);
            setSourceBillToMerge(null);
            
            // Refresh
            const response = await apiClient.get('/transactions/open-bills') as any;
            if (response && response.data) setOpenBills(response.data);
            
            // If current bill was the source, clear it
            if (currentBillId === sourceBillToMerge.id) {
                setCurrentBillId(null);
                setCustomerInfo('');
                setSales({});
            }
        } catch (error: any) {
            alert('Gagal menggabungkan bill: ' + error.message);
        } finally {
            setIsCheckingOut(false);
        }
    };

    const PosFooter = (
        <footer className={`${PerformanceSettings.getGlassClass()} border-t border-white/5 p-4 md:p-6 shrink-0 space-y-4 md:space-y-6`}>
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
                <div className={`space-y-3 ${PerformanceSettings.shouldUseLiteMode() ? "" : "animate-in slide-in-from-top-4 duration-300"}`}>
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
                    id="btn-checkout"
                    onClick={() => handleCheckout(true)}
                    disabled={isCheckingOut || totalItems === 0 || isSyncing}
                    className="w-full h-16 md:h-24 bg-primary text-slate-950 rounded-2xl md:rounded-[32px] font-black text-lg md:text-2xl uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100 flex flex-col items-center justify-center gap-1"
                >
                    <div className="flex items-center gap-4">
                        {isCheckingOut ? (
                            <>
                                <div className="size-6 border-4 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                                <span>Memproses...</span>
                            </>
                        ) : isSyncing ? (
                             <>
                                <div className="size-6 border-4 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                                <span>Update Menu...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-3xl font-black">shopping_bag</span>
                                <span>Checkout</span>
                            </>
                        )}
                    </div>
                    <span className="text-[10px] font-black opacity-50 hidden md:block">Atau tekan Ctrl + Enter</span>
                </button>

                {currentBillId && totalItems > 0 && (
                    <button 
                        onClick={handleUpdateBill}
                        className="w-full py-4 bg-primary text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-base">add_circle</span>
                        Simpan Perubahan ke Bill
                    </button>
                )}

                {!currentBillId && totalItems > 0 && (
                    <button 
                        onClick={handleSaveBill}
                        className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-base">save</span>
                        Simpan sebagai Bill Baru
                    </button>
                )}
            </div>
        </footer>
    );

    const PosHeaderExtras = (
        <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
            {/* Sync Status Dot */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                !isOnline ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                isPushing ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                pendingSyncCount > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            }`}>
                <div className={`size-2 rounded-full ${
                    !isOnline ? 'bg-red-500 animate-pulse' :
                    isPushing ? 'bg-blue-500 animate-spin' :
                    pendingSyncCount > 0 ? 'bg-amber-500 animate-bounce' :
                    'bg-emerald-500'
                }`} />
                <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline">
                    {!isOnline ? 'Offline' : isPushing ? 'Syncing...' : pendingSyncCount > 0 ? `${pendingSyncCount} Pending` : 'Synced'}
                </span>
            </div>

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
                className={`size-8 sm:size-10 ${PerformanceSettings.getGlassClass()} rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-primary/10 active:scale-95 transition-all group border border-[var(--border-dim)]`}
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
            footer={view === 'pos' ? <div className="md:hidden landscape:hidden">{PosFooter}</div> : null}
            headerExtras={PosHeaderExtras}
            drawerOpen={drawerOpen}
            onDrawerOpen={() => setDrawerOpen(true)}
            onDrawerClose={() => setDrawerOpen(false)}
        >
            <div className="space-y-8">
                {view === 'pos' && (
                    <>
                        {/* SECTION: OPEN BILLS (TOP PRIORITY) */}
                        {openBills.length > 0 && !currentBillId && (
                            <div className="bg-primary/5 border border-primary/20 p-4 rounded-3xl space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">receipt_long</span>
                                        <h3 className="font-black uppercase tracking-tighter text-sm text-[var(--text-main)]">Daftar Bill Aktif (Running Order)</h3>
                                    </div>
                                    <span className="bg-primary text-slate-950 text-[10px] px-3 py-1 rounded-full font-black uppercase shadow-lg shadow-primary/20">{openBills.length} Meja</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {openBills.map(bill => (
                                        <div 
                                            key={bill.id}
                                            onClick={() => loadBill(bill)}
                                            className="bg-[var(--bg-app)] border border-[var(--border-dim)] p-3 rounded-2xl hover:border-primary/50 cursor-pointer transition-all group relative overflow-hidden shadow-sm"
                                        >
                                            <button 
                                                onClick={(e) => handleDeleteBill(e, bill)}
                                                className="absolute top-1 right-1 size-7 rounded-lg flex items-center justify-center bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-red-500/10 z-30"
                                                title="Hapus Bill"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                            <button 
                                                onClick={(e) => handleMergeClick(e, bill)}
                                                className="absolute top-1 right-9 size-7 rounded-lg flex items-center justify-center bg-primary/20 text-primary hover:bg-primary hover:text-slate-950 transition-all active:scale-95 shadow-lg shadow-primary/10 z-30"
                                                title="Gabung Meja"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">call_merge</span>
                                            </button>
                                            <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-0.5">Meja / Nama</p>
                                            <p className="text-[11px] font-black text-[var(--text-main)] truncate uppercase">{bill.customerInfo}</p>
                                            <p className="text-[10px] font-black text-primary mt-2">Rp {parseFloat(bill.totalAmount).toLocaleString('id-ID')}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row landscape:flex-row gap-6 md:gap-10 h-full">
                        {/* Left: Input & Menu */}
                        <div className="w-full md:w-3/5 landscape:w-3/5 space-y-8">
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
                                        ref={searchInputRef}
                                        type="text" 
                                        placeholder="Cari Menu... (Tekan '/')" 
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold text-[var(--text-main)] outline-none focus:border-primary/50 transition-all placeholder:text-[var(--text-muted)] placeholder:opacity-50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                                {isLoading ? (
                                    Array.from({ length: 15 }).map((_, i) => (
                                        <div key={i} className="bg-[var(--glass-bg)] border border-[var(--border-dim)] rounded-xl h-[72px] animate-pulse"></div>
                                    ))
                                ) : filteredRecipes.map((item, index) => (
                                        <MemoizedProductCard 
                                            key={item.id} 
                                            item={item} 
                                            saleCount={sales[item.id] || 0} 
                                            isHighlighted={index === highlightedIndex}
                                            onUpdateQty={updateQty} 
                                        />
                                ))}
                            </div>
                        </div>

                        {/* Right: Cart Review */}
                        <div className="w-full md:w-2/5 landscape:w-2/5 flex flex-col gap-4 lg:gap-6 md:max-h-[calc(100vh-200px)] landscape:max-h-[calc(100vh-200px)]">
                            <div className={`${PerformanceSettings.getGlassClass()} rounded-[2.5rem] p-6 lg:p-8 border border-[var(--border-dim)] flex flex-col flex-1 shadow-2xl relative overflow-hidden min-h-[300px]`}>
                                <div className="absolute top-0 right-0 p-6 lg:p-8 opacity-5 text-[var(--text-main)] pointer-events-none select-none">
                                    <span className="material-symbols-outlined text-[120px] font-black tracking-tighter">shopping_basket</span>
                                </div>

                                <div className="flex items-center justify-between mb-8 relative">
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--text-main)]">Keranjang</h2>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{totalItems} Item terpilih</p>
                                    </div>
                                    <button 
                                        onClick={() => setSales({})}
                                        className="text-[10px] font-black text-red-400/60 uppercase tracking-widest hover:text-red-400 transition-colors"
                                    >
                                        Reset Item
                                    </button>
                                </div>

                                {currentBillId && (
                                    <div className="flex items-center gap-2 mb-4 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl relative z-20">
                                        <span className="material-symbols-outlined text-primary text-sm">room_service</span>
                                        <span className="text-[10px] font-black text-primary uppercase">{customerInfo}</span>
                                        <button 
                                            onClick={(e) => { 
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setCurrentBillId(null); 
                                                setCustomerInfo(''); 
                                                setSales({}); 
                                            }} 
                                            className="ml-auto text-primary/50 hover:text-primary p-1 hover:bg-primary/20 rounded-md transition-all active:scale-90"
                                            title="Clear Table / Start New"
                                        >
                                            <span className="material-symbols-outlined text-xs">close</span>
                                        </button>
                                    </div>
                                )}

                                <div className="flex-1 space-y-0 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 relative">
                                    {activeCartItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full py-20 opacity-30 text-[var(--text-main)]">
                                            <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
                                            <p className="text-xs font-black uppercase tracking-widest">Belum ada pesanan</p>
                                        </div>
                                    ) : activeCartItems.map((item) => (
                                        <MemoizedCartItem
                                            key={item.id}
                                            item={item}
                                            salesCount={sales[item.id]}
                                            updateQty={updateQty}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="hidden md:block landscape:block shrink-0 mt-auto w-full">
                                {view === 'pos' && PosFooter}
                            </div>
                        </div>
                    </div>
                </>
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

            {/* MERGE MODAL */}
            {isMergeModalOpen && sourceBillToMerge && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                    <div className="card max-w-lg w-full max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-white/10">
                        <header className="glass p-6 flex justify-between items-center border-b border-white/5">
                            <div>
                                <h3 className="font-black text-xl text-[var(--text-main)] uppercase tracking-widest">Gabung Meja</h3>
                                <p className="text-xs text-primary font-bold mt-1">Pilih meja tujuan untuk: {sourceBillToMerge.customerInfo}</p>
                            </div>
                            <button onClick={() => setIsMergeModalOpen(false)} className="size-10 rounded-xl glass hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>
                        
                        <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-2">Daftar Meja Aktif Lainnya</p>
                            {openBills.filter(b => b.id !== sourceBillToMerge.id).length === 0 ? (
                                <div className="text-center py-10 opacity-30">
                                    <span className="material-symbols-outlined text-4xl mb-2">info</span>
                                    <p className="text-xs font-black uppercase tracking-widest">Tidak ada meja lain untuk digabung</p>
                                </div>
                            ) : (
                                openBills.filter(b => b.id !== sourceBillToMerge.id).map(bill => (
                                    <div 
                                        key={bill.id}
                                        onClick={() => performMerge(bill)}
                                        className="bg-[var(--bg-app)] border border-[var(--border-dim)] p-4 rounded-2xl hover:border-primary cursor-pointer transition-all group flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-[11px] font-black text-[var(--text-main)] uppercase">{bill.customerInfo}</p>
                                            <p className="text-[10px] font-black text-primary">Rp {parseFloat(bill.totalAmount).toLocaleString('id-ID')}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-all font-black">login</span>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <footer className="glass p-6 border-t border-white/5 flex justify-end shrink-0">
                            <button 
                                onClick={() => setIsMergeModalOpen(false)}
                                className="px-6 py-3 rounded-xl glass text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest active:scale-95"
                            >
                                Batal
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default App;
