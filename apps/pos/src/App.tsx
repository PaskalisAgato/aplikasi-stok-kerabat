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
import { useCashierShift } from '@shared/hooks/useCashierShift';
import { OpenShiftModal, CloseShiftModal, HandoverShiftModal } from './components/ShiftModals';

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
    const { 
        activeShift, isActiveLoading, 
        openShift, closeShift, handoverShift, getSummary, 
        refreshActiveShift 
    } = useCashierShift();

    // Auth gate: Only show shift modal when user is logged in
    const isAuthenticated = !!(localStorage.getItem('kerabat_auth_token'));

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
    const [targetBillForMerge, setTargetBillForMerge] = useState<any>(null);
    const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
    const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
    const [splitMode, setSplitMode] = useState<'table' | 'pay'>('table');
    const [splitSourceBill, setSplitSourceBill] = useState<any>(null);
    const [selectedSplitItems, setSelectedSplitItems] = useState<Record<number, number>>({});
    const [splitTargetInfo, setSplitTargetInfo] = useState('');
    const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
    const [isHandoverShiftOpen, setIsHandoverShiftOpen] = useState(false);
    const [shiftSummaryData, setShiftSummaryData] = useState<any>(null);
    const [pendingSyncs, setPendingSyncs] = useState<number>(0);
    const [printAlert, setPrintAlert] = useState<{ message: string, type: 'WARN' | 'ERROR', data?: PrintData } | null>(null);

    // Track pending syncs for Shift blocking
    useEffect(() => {
        const unsubscribe = syncEngine.onChange((count) => {
            setPendingSyncs(count);
        });

        const handlePrintAlert = (e: any) => {
            setPrintAlert({ 
                message: e.detail.message, 
                type: e.detail.type, 
                data: e.detail.data 
            });
        };
        window.addEventListener('print-alert', handlePrintAlert);

        return () => {
            unsubscribe();
            window.removeEventListener('print-alert', handlePrintAlert);
        };
    }, []);

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
        
        // Handle Session Expiry from SyncEngine
        const handleSyncAuthFailed = () => {
             alert("Sesi kamu telah berakhir (Unauthorized). Harap refresh halaman dan login kembali agar data tersinkronisasi.");
        };
        window.addEventListener('sync-auth-failed', handleSyncAuthFailed);
        
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

        fetchOpenBills();

        return () => {
            window.removeEventListener('sync-auth-failed', handleSyncAuthFailed);
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
                id: transactionId, 
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

            // 1. Decoupled Printing: Fire and forget (don't block checkout success)
            PrintService.printOrder(printData).catch(err => {
                console.error('Initial printing attempt failed', err);
                // PrintService.printOrder internal logic already emits print-alert if it fails
            });

            // 2. Save to Offline Queue (Local Source of Truth)
            // Use transactionid as both ID and idempotency key foundation
            await db.offlineActions.add({
                id: transactionId,
                idempotency_key: `req_checkout_${transactionId}`,
                type: 'CHECKOUT',
                payload: { ...checkoutData, status: 'PAID', customerInfo },
                created_at: new Date().toISOString(),
                sync_status: 'PENDING',
                retry_count: 0
            });

            // 3. UI Optimistic Success
            setSales({});
            setPaymentMethod('CASH');
            setAmountPaid(0);
            setCustomerInfo('');
            setCurrentBillId(null);
            
            // 4. Trace Log
            await db.auditLog.add({
                action: 'CHECKOUT',
                entity: 'Transaction',
                entityId: transactionId,
                timestamp: new Date().toISOString(),
                userId: activeShift?.userName || 'Kasir',
                deviceId: 'POS-01'
            });

            // 5. Trigger sync in background
            syncEngine.forceSync().catch(console.error);

            alert(`Transaksi Berhasil! Simpan Offline. Kembalian: Rp ${changeDue.toLocaleString('id-ID')}`);
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
        setTargetBillForMerge(bill);
        setSelectedSourceIds([]);
        setIsMergeModalOpen(true);
    };

    const toggleSourceSelection = (id: number) => {
        setSelectedSourceIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const performMerge = async () => {
        // ... (previous code)
    };

    const handleSplitClick = async (e: React.MouseEvent, bill: any, mode: 'table' | 'pay' = 'table') => {
        e.preventDefault();
        e.stopPropagation();
        
        // Fetch full bill details to get items
        try {
            const response = await apiClient.get(`/transactions/${bill.id}`) as any;
            if (response && response.data) {
                setSplitSourceBill(response.data);
                setSplitMode(mode);
                setSelectedSplitItems({});
                setSplitTargetInfo(mode === 'pay' ? `${bill.customerInfo} (Partial Pay)` : `${bill.customerInfo} (Split)`);
                setIsSplitModalOpen(true);
            }
        } catch (error) {
            alert('Gagal mengambil detail bill');
        }
    };

    const performSplit = async () => {
        console.log('--- performSplit started ---', { splitMode, splitSourceBill, selectedSplitItems });
        if (!splitSourceBill) return;
        const itemsToMove = Object.entries(selectedSplitItems)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => ({ saleItemId: parseInt(id), quantity: qty }));

        console.log('Items to move:', itemsToMove);
        if (itemsToMove.length === 0) {
            alert('Pilih minimal satu item untuk dipisah');
            return;
        }

        setIsCheckingOut(true);
        try {
            console.log('Sending splitBill request...');
            const result = await apiClient.splitBill({
                sourceId: splitSourceBill.id,
                targetInfo: splitTargetInfo,
                items: itemsToMove
            });
            console.log('splitBill request result:', result);

            if (result.success) {
                setIsSplitModalOpen(false);
                
                console.log('Refreshing open bills list...');
                const response = await apiClient.get('/transactions/open-bills') as any;
                if (response && response.data) {
                    console.log('New open bills list:', response.data);
                    setOpenBills(response.data);
                }

                if (splitMode === 'pay') {
                    console.log('Processing pay mode split...');
                    const newBillId = result.data.targetId;
                    setCurrentBillId(newBillId);
                    const newBillRes = await apiClient.get(`/transactions/${newBillId}`) as any;
                    if (newBillRes && newBillRes.data) {
                        const salesData: Record<number, number> = {};
                        newBillRes.data.items.forEach((it: any) => {
                            salesData[it.recipeId] = parseInt(it.quantity);
                        });
                        setSales(salesData);
                        setCustomerInfo(newBillRes.data.customerInfo);
                        alert('Item berhasil dipisah untuk pembayaran. Silakan klik Checkout.');
                    }
                } else {
                    console.log('Processing table mode split...');
                    alert('Bill berhasil dipisah!');
                    if (currentBillId === splitSourceBill.id) {
                        console.log('Reloading current bill as it was the source...');
                        const reloadRes = await apiClient.get(`/transactions/${splitSourceBill.id}`) as any;
                        if (reloadRes && reloadRes.data) {
                            const salesData: Record<number, number> = {};
                            reloadRes.data.items.forEach((it: any) => {
                                salesData[it.recipeId] = parseInt(it.quantity);
                            });
                            setSales(salesData);
                        }
                    }
                }
            } else {
                console.error('Split failed:', result.message);
                alert('Gagal memisah bill (Server): ' + (result.message || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Split exception:', error);
            alert('Gagal memisah bill: ' + error.message);
        } finally {
            setIsCheckingOut(false);
            console.log('--- performSplit finished ---');
        }
    };

    const handleOpenShift = async (initialCash: number) => {
        await openShift(initialCash);
        refreshActiveShift();
    };

    const handleCloseShift = async (data: { actualCash: number, actualNonCash: number, notes: string, denominations: Record<string, number>, nonCashVerified: boolean }) => {
        await closeShift({ id: activeShift.id, data });
        setIsCloseShiftOpen(false);
        refreshActiveShift();
        alert('Shift berhasil ditutup! Ringkasan telah disimpan.');
    };

    const handleHandoverShift = async (data: { currentShiftId: number; cashAmount: number; nextCashierName: string; adminPin: string }) => {
        await handoverShift(data);
        setIsHandoverShiftOpen(false);
        alert('Shift berhasil dipindahtangankan. Aplikasi akan dimuat ulang.');
        window.location.reload(); 
    };

    const PosFooter = (
        <footer className="bg-transparent p-3 shrink-0 flex flex-col gap-3">
            {/* Payment Method Selector */}
            <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 px-1">Pembayaran</p>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'CASH', label: 'Tunai', icon: 'payments' },
                        { id: 'QRIS', label: 'QRIS', icon: 'qr_code_2' },
                        { id: 'CARD', label: 'Kartu', icon: 'credit_card' }
                    ].map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id as any)}
                            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-all active:scale-95 ${
                                paymentMethod === method.id 
                                    ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                                    : 'bg-[var(--bg-app)] border-[var(--border-dim)] text-[var(--text-muted)] hover:bg-black/5'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[14px] font-black">{method.icon}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest">{method.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cash Payment Section */}
            {paymentMethod === 'CASH' && (
                <div className="bg-black/10 rounded-xl p-2 border border-white/5 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                        {[10000, 20000, 50000, 100000, totalSalesValue].map((amount, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setAmountPaid(amount)}
                                className={`flex-1 min-w-[50px] py-2 rounded-lg border font-black text-[9px] transition-all active:scale-95 ${
                                    amountPaid === amount 
                                        ? 'bg-primary border-primary text-slate-900 shadow-md' 
                                        : 'bg-[var(--bg-app)] border-[var(--border-dim)] text-[var(--text-main)] hover:bg-white/5'
                                }`}
                            >
                                {amount === totalSalesValue ? 'PAS' : `${amount / 1000}k`}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-[1.5] relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-black text-[10px]">Bayar:</span>
                            <input 
                                type="number" 
                                value={amountPaid || ''}
                                onChange={(e) => setAmountPaid(parseInt(e.target.value) || 0)}
                                className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl pl-12 pr-4 py-3 text-sm font-black text-[var(--text-main)] outline-none focus:border-primary/50 transition-all"
                                placeholder="0"
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                        <div className={`flex-1 rounded-xl px-3 py-1.5 flex flex-col justify-center border transition-colors ${changeDue > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Kembalian</p>
                            <p className={`text-sm font-black leading-none mt-1 ${changeDue > 0 ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                                Rp {changeDue.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                <div className="flex items-end justify-between px-1">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Total Penjualan</p>
                        <p className="text-3xl font-black tracking-tighter text-[var(--text-main)] leading-none">
                            <span className="text-primary mr-1 text-sm">Rp</span>
                            {totalSalesValue.toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        id="btn-checkout"
                        onClick={() => handleCheckout(true)}
                        disabled={isCheckingOut || totalItems === 0 || isSyncing || (paymentMethod === 'CASH' && amountPaid < totalSalesValue)}
                        className={`flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                            (paymentMethod === 'CASH' && amountPaid >= totalSalesValue) || paymentMethod !== 'CASH'
                                ? 'bg-primary text-slate-950 shadow-primary/20' 
                                : 'bg-white/5 text-[var(--text-muted)] border border-white/5'
                        }`}
                    >
                        {isCheckingOut ? (
                            <>
                                <div className="size-5 border-3 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                                <span className="animate-pulse">Memproses...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-xl">payments</span>
                                {paymentMethod === 'CASH' && amountPaid < totalSalesValue ? 'Uang Kurang' : 'Bayar Sekarang'}
                            </>
                        )}
                    </button>
                </div>

                <div className="flex gap-2">
                    {currentBillId && totalItems > 0 && (
                        <button 
                            onClick={handleUpdateBill}
                            className="flex-1 py-3 bg-primary/20 text-primary rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-slate-950 transition-all flex items-center justify-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-sm">add_circle</span> Simpan ke Bill
                        </button>
                    )}
                    {!currentBillId && totalItems > 0 && (
                        <button 
                            onClick={handleSaveBill}
                            className="flex-1 py-3 bg-[var(--bg-app)] border border-[var(--border-dim)] text-[var(--text-main)] rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-sm">save</span> Simpan Bill Baru
                        </button>
                    )}
                </div>
            </div>
        </footer>
    );

    const PosHeaderExtras = (
        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            {/* Shift Status */}
            {activeShift && (
                <div className="hidden min-[1100px]:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                    <div className="size-8 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                        <span className="material-symbols-outlined text-sm text-primary">person</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-primary tracking-[0.2em] leading-none mb-1">Shift Aktif</span>
                        <span className="text-[10px] font-bold text-white leading-none whitespace-nowrap">{activeShift.userName || 'Kasir'}</span>
                    </div>
                    <button
                        onClick={() => setIsHandoverShiftOpen(true)}
                        className="ml-2 size-8 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                        title="Oper Shift (Handover)"
                    >
                        <span className="material-symbols-outlined text-sm">sync_alt</span>
                    </button>
                    <button 
                        onClick={async () => {
                            if (pendingSyncs > 0) {
                                alert(`Gagal Menutup Shift! Masih ada ${pendingSyncs} data transaksi yang belum tersinkronisasi ke server. 

Kemungkinan penyebab:
1. Koneksi internet sedang lambat/terputus.
2. Sesi login kamu berakhir (Unauthorized). 
3. Ada error teknis pada salah satu transaksi.

Harap cek widget "Cloud Sync" di pojok kanan atas untuk detail error atau coba refresh halaman.`);
                                return;
                            }
                            const summary = await getSummary(activeShift.id);
                            setShiftSummaryData(summary.data);
                            setIsCloseShiftOpen(true);
                        }}
                        className={`ml-2 size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            pendingSyncs > 0 ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed' : 'bg-red-500/10 hover:bg-red-500/20 text-red-500'
                        }`}
                        title={pendingSyncs > 0 ? "Tunggu Sync Selesai" : "Tutup Shift"}
                    >
                        <span className="material-symbols-outlined text-sm">{pendingSyncs > 0 ? 'cloud_sync' : 'logout'}</span>
                    </button>
                </div>
            )}

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

            {/* Clear stuck queue button — only visible when there are stuck PENDING items */}
            {pendingSyncCount > 0 && !isPushing && (
                <button
                    onClick={async () => {
                        if (confirm(`Bersihkan ${pendingSyncCount} transaksi yang macet dari antrean? Transaksi yang belum terkirim akan dibatalkan.`)) {
                            await syncEngine.clearAllPending();
                            setPendingSyncCount(0);
                        }
                    }}
                    className="size-8 rounded-lg flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-all border border-amber-500/20"
                    title="Bersihkan antrean yang macet"
                >
                    <span className="material-symbols-outlined text-sm">delete_sweep</span>
                </button>
            )}


            <div className="flex bg-white/5 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-white/5 scale-90 sm:scale-100">
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
        <>
            <OpenShiftModal 
                isOpen={isAuthenticated && !activeShift && !isActiveLoading && view === 'pos'} 
                onOpen={handleOpenShift} 
            />

            {activeShift && (
                <CloseShiftModal 
                    isOpen={isCloseShiftOpen}
                    shift={activeShift}
                    summary={shiftSummaryData}
                    onCancel={() => setIsCloseShiftOpen(false)}
                    onClose={handleCloseShift}
                />
            )}

            {activeShift && (
                <HandoverShiftModal
                    isOpen={isHandoverShiftOpen}
                    shift={activeShift}
                    onHandover={handleHandoverShift}
                    onCancel={() => setIsHandoverShiftOpen(false)}
                />
            )}

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
                        {/* SECTION: OPEN BILLS */}
                        {openBills.length > 0 && !currentBillId && (
                            <div className="bg-primary/5 border border-primary/20 p-3 rounded-2xl flex flex-col gap-3 shrink-0">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-sm">receipt_long</span>
                                        <h3 className="font-black uppercase tracking-tighter text-xs text-[var(--text-main)]">Daftar Bill Aktif (Running Order)</h3>
                                    </div>
                                    <span className="bg-primary text-slate-950 text-[9px] px-2 py-0.5 rounded-full font-black uppercase shadow-sm">{openBills.length} Meja</span>
                                </div>
                                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 snap-x">
                                    {openBills.map(bill => (
                                        <div 
                                            key={bill.id}
                                            onClick={() => loadBill(bill)}
                                            className="bg-[var(--bg-app)] border border-[var(--border-dim)] p-3 rounded-xl hover:border-primary/50 cursor-pointer transition-all shrink-0 w-[200px] snap-start flex flex-col justify-between"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-[12px] font-black text-[var(--text-main)] truncate uppercase leading-tight mb-2">{bill.customerInfo}</p>
                                                <div className="flex gap-1.5">
                                                    <button onClick={(e) => handleSplitClick(e, bill, 'table')} className="size-6 rounded flex items-center justify-center bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white transition-all text-xs" title="Pisah Meja"><span className="material-symbols-outlined text-[14px]">call_split</span></button>
                                                    <button onClick={(e) => handleMergeClick(e, bill)} className="size-6 rounded flex items-center justify-center bg-primary/20 text-primary hover:bg-primary hover:text-slate-950 transition-all text-xs" title="Gabung Meja"><span className="material-symbols-outlined text-[14px]">call_merge</span></button>
                                                    <button onClick={(e) => handleDeleteBill(e, bill)} className="size-6 rounded flex items-center justify-center bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs ml-auto" title="Hapus Bill"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                                                </div>
                                            </div>
                                            <div className="pt-2 mt-2 border-t border-white/5">
                                                <p className="text-[10px] font-black text-primary">Rp {parseFloat(bill.totalAmount).toLocaleString('id-ID')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ULTRA-FAST 1-SCREEN 3-COLUMN LAYOUT */}
                        <div className="flex flex-col md:flex-row h-[calc(100vh-180px)] min-h-[600px] gap-4 w-full">
                            
                            {/* Column 1: Kategori (Left - 15%) */}
                            <div className="hidden lg:flex w-[15%] flex-col gap-2 shrink-0 bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-2xl p-3 overflow-y-auto custom-scrollbar">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 mb-2 px-1">Kategori</h4>
                                <button 
                                    onClick={() => setSelectedCategory(null)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${!selectedCategory ? 'bg-primary text-slate-950 shadow-md' : 'text-[var(--text-muted)] hover:bg-white/5 border border-transparent'}`}
                                >
                                    Semua Menu
                                </button>
                                {Array.from(new Set(items.map(i => i.category))).filter(Boolean).map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-primary text-slate-950 shadow-md' : 'text-[var(--text-muted)] hover:bg-white/5 border border-transparent overflow-hidden text-ellipsis'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Column 2: Daftar Menu (Center - 55%) */}
                            <div className="w-full lg:w-[50%] flex flex-col gap-4">
                                <div className="relative group shrink-0">
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
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 content-start">
                                    {isLoading ? (
                                        Array.from({ length: 12 }).map((_, i) => (
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

                            {/* Column 3: Cart & Quick Pay (Right - 30%) */}
                            <div className="w-full lg:w-[35%] flex flex-col h-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-2xl shadow-xl overflow-hidden">
                                {/* Cart Header */}
                                <div className="p-4 border-b border-[var(--border-dim)] shrink-0 bg-white/5 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-base">shopping_cart</span>
                                            Keranjang
                                        </h2>
                                        <p className="text-[9px] font-bold text-primary uppercase mt-1">{totalItems} Item terpilih</p>
                                    </div>
                                    <button onClick={() => setSales({})} className="text-[9px] font-black text-red-500 opacity-60 hover:opacity-100 uppercase transition-all bg-red-500/10 px-2 py-1 flex items-center gap-1 rounded-md">
                                        <span className="material-symbols-outlined text-[10px]">delete</span> Riset
                                    </button>
                                </div>
                                
                                {/* Active Table Bar */}
                                {currentBillId && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border-b border-primary/20 shrink-0">
                                        <span className="material-symbols-outlined text-primary text-xs">room_service</span>
                                        <span className="text-[10px] font-black text-primary uppercase flex-1 truncate">{customerInfo}</span>
                                        <button onClick={(e) => { e.stopPropagation(); setCurrentBillId(null); setCustomerInfo(''); setSales({}); }} className="text-primary/60 hover:text-primary transition-all">
                                            <span className="material-symbols-outlined text-xs">close</span>
                                        </button>
                                    </div>
                                )}

                                {/* Cart Items List */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                                    {activeCartItems.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                                            <span className="material-symbols-outlined text-4xl mb-2">remove_shopping_cart</span>
                                            <p className="text-[10px] font-black uppercase tracking-widest">Kosong</p>
                                        </div>
                                    ) : activeCartItems.map((item) => (
                                        <MemoizedCartItem key={item.id} item={item} salesCount={sales[item.id]} updateQty={updateQty} />
                                    ))}
                                </div>

                                {/* Compact Embedded PosFooter */}
                                <div className="shrink-0 p-0 border-t border-[var(--border-dim)] bg-black/20">
                                    {PosFooter}
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

            {/* MERGE MODAL (Multi-Selection Ready) */}
            {isMergeModalOpen && targetBillForMerge && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                    <div className="card max-w-lg w-full max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-white/10">
                        <header className="glass p-6 flex justify-between items-center border-b border-white/5">
                            <div>
                                <h3 className="font-black text-xl text-[var(--text-main)] uppercase tracking-widest">Gabung Meja</h3>
                                <p className="text-xs text-primary font-bold mt-1">Menggabungkan ke: {targetBillForMerge.customerInfo}</p>
                            </div>
                            <button onClick={() => setIsMergeModalOpen(false)} className="size-10 rounded-xl glass hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>
                        
                        <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-2">Pilih Meja yang Akan Digabung</p>
                            {openBills.filter(b => b.id !== targetBillForMerge.id).length === 0 ? (
                                <div className="text-center py-10 opacity-30">
                                    <span className="material-symbols-outlined text-4xl mb-2">info</span>
                                    <p className="text-xs font-black uppercase tracking-widest">Tidak ada meja lain untuk digabung</p>
                                </div>
                            ) : (
                                openBills.filter(b => b.id !== targetBillForMerge.id).map(bill => (
                                    <div 
                                        key={bill.id}
                                        onClick={() => toggleSourceSelection(bill.id)}
                                        className={`p-4 rounded-2xl cursor-pointer transition-all group flex items-center justify-between border-2 ${
                                            selectedSourceIds.includes(bill.id)
                                                ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10'
                                                : 'bg-[var(--bg-app)] border-[var(--border-dim)] hover:border-primary/50'
                                        }`}
                                    >
                                        <div>
                                            <p className={`text-[11px] font-black uppercase ${selectedSourceIds.includes(bill.id) ? 'text-primary' : 'text-[var(--text-main)]'}`}>
                                                {bill.customerInfo}
                                            </p>
                                            <p className="text-[10px] font-black opacity-60">Rp {parseFloat(bill.totalAmount).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                            selectedSourceIds.includes(bill.id)
                                                ? 'bg-primary border-primary text-slate-950'
                                                : 'border-[var(--border-dim)]'
                                        }`}>
                                            {selectedSourceIds.includes(bill.id) && <span className="material-symbols-outlined font-black text-sm">check</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <footer className="glass p-6 border-t border-white/5 flex gap-3 shrink-0">
                            <button 
                                onClick={() => setIsMergeModalOpen(false)}
                                className="flex-1 py-4 rounded-xl glass text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest active:scale-95"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={performMerge}
                                disabled={selectedSourceIds.length === 0 || isCheckingOut}
                                className="flex-[2] py-4 bg-primary text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">call_merge</span>
                                {isCheckingOut ? 'Memproses...' : `Gabungkan ${selectedSourceIds.length} Meja`}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
            {/* SPLIT MODAL (Pisah Meja / Pisah Bayar) */}
            {isSplitModalOpen && splitSourceBill && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                    <div className="card max-w-xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-white/10">
                        <header className="glass p-6 flex justify-between items-center border-b border-white/5">
                            <div>
                                <h3 className="font-black text-xl text-[var(--text-main)] uppercase tracking-widest">
                                    {splitMode === 'pay' ? 'Pisah Bayar' : 'Pisah Meja'}
                                </h3>
                                <p className="text-xs text-primary font-bold mt-1">Sumber: {splitSourceBill.customerInfo}</p>
                            </div>
                            <button onClick={() => setIsSplitModalOpen(false)} className="size-10 rounded-xl glass hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>
                        
                        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
                                    {splitMode === 'pay' ? 'Keterangan Pembayaran' : 'Nama Meja Baru'}
                                </label>
                                <input 
                                    type="text"
                                    value={splitTargetInfo}
                                    onChange={(e) => setSplitTargetInfo(e.target.value)}
                                    className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] p-4 rounded-xl text-sm font-bold focus:border-primary outline-none transition-all uppercase"
                                    placeholder="Contoh: Meja 1A / Split"
                                />
                            </div>

                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">Pilih Item & Jumlah</p>
                            <div className="space-y-2">
                                {splitSourceBill.items && splitSourceBill.items.map((item: any) => {
                                    const maxQty = parseInt(item.quantity);
                                    const selectedQty = selectedSplitItems[item.id] || 0;
                                    
                                    return (
                                        <div key={item.id} className="bg-[var(--bg-app)] border border-[var(--border-dim)] p-4 rounded-2xl flex items-center justify-between">
                                            <div className="flex-1 min-w-0 mr-4">
                                                <p className="text-[11px] font-black text-[var(--text-main)] truncate uppercase">{item.recipeName}</p>
                                                <p className="text-[10px] font-black opacity-50">Rp {parseFloat(item.recipePrice).toLocaleString('id-ID')} x {maxQty}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => setSelectedSplitItems(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                                                    className="size-8 rounded-lg glass flex items-center justify-center hover:bg-primary/20 transition-all font-black"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-black text-sm">{selectedQty}</span>
                                                <button 
                                                    onClick={() => setSelectedSplitItems(prev => ({ ...prev, [item.id]: Math.min(maxQty, (prev[item.id] || 0) + 1) }))}
                                                    className="size-8 rounded-lg glass flex items-center justify-center hover:bg-primary/20 transition-all font-black"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <footer className="glass p-6 border-t border-white/5 flex gap-3 shrink-0">
                            <button 
                                onClick={() => setIsSplitModalOpen(false)}
                                className="flex-1 py-4 rounded-xl glass text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest active:scale-95"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={performSplit}
                                disabled={isCheckingOut || Object.values(selectedSplitItems).every(q => q === 0)}
                                className="flex-[2] py-4 bg-primary text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">content_cut</span>
                                {isCheckingOut ? 'Memproses...' : splitMode === 'pay' ? 'Pilih & Lanjut Bayar' : 'Pisah Meja'}
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* PRINT ALERT / FALLBACK UI */}
            {printAlert && (
                <div className="fixed bottom-6 right-6 z-[200] w-full max-w-sm animate-in slide-in-from-bottom-4 duration-500">
                    <div className="glass border-amber-500/30 overflow-hidden shadow-2xl rounded-2xl">
                        <div className="p-4 bg-amber-500/10 flex gap-3">
                            <div className="size-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined">print_disabled</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-xs text-amber-500 uppercase tracking-widest">Printer Bermasalah</h4>
                                <p className="text-[11px] font-bold text-[var(--text-main)] mt-1 leading-relaxed">
                                    {printAlert.message}
                                </p>
                            </div>
                            <button onClick={() => setPrintAlert(null)} className="size-6 rounded-lg hover:bg-white/5 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                        <div className="p-3 bg-white/5 grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => {
                                    if (printAlert.data) PrintService.browserPrint(printAlert.data);
                                    else alert('Data struk tidak tersedia untuk print browser.');
                                }}
                                className="h-10 rounded-xl glass border-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                                Browser
                            </button>
                            <button 
                                onClick={() => {
                                    if (printAlert.data) PrintService.downloadPdfReceipt(printAlert.data);
                                    else alert('Data struk tidak tersedia untuk download.');
                                }}
                                className="h-10 rounded-xl glass border-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                Unduh (TXT)
                            </button>
                        </div>
                        <div className="px-4 py-2 bg-slate-950/20 text-[9px] font-bold text-[var(--text-muted)] italic text-center">
                            Transaksi tetap tersimpan meskipun cetak gagal.
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    </>
);
}

export default App;
