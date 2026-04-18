import { useState, useEffect, memo, useCallback, useMemo, useRef } from 'react';
import { useKeyboardCashier } from './hooks/useKeyboardCashier';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';
import PrintQueueManager from './PrintQueueManager';
import SyncQueuePage from './SyncQueuePage';
import { PrintService, PrintData } from '@shared/services/PrintService';
import { useNotification } from '@shared/components/NotificationProvider';
import TransactionHistory from './TransactionHistory';
import PrinterSettings from '@shared/components/PrinterSettings';
import { db } from '@shared/services/db';
import { syncEngine } from '@shared/services/SyncEngine';
import { PerformanceSettings } from '@shared/services/performance';
import { useCashierShift } from '@shared/hooks/useCashierShift';
import { OpenShiftModal, CloseShiftModal, HandoverShiftModal } from './components/ShiftModals';
import ShiftRequired from './components/ShiftRequired';
import SyncWidget from './components/SyncWidget';

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

const MemoizedCartItem = memo(({ item, salesCount, updateQty, note, onNoteChange }: { item: Recipe & { qty?: number }, salesCount: number, updateQty: (id: number, delta: number) => void, note?: string, onNoteChange: (id: number, note: string) => void }) => {
    const [showNoteInput, setShowNoteInput] = useState(false);
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
            
            <button 
                onClick={() => setShowNoteInput(!showNoteInput)}
                className={`size-6 rounded flex items-center justify-center transition-all ${note ? 'bg-amber-500/20 text-amber-500' : 'text-[var(--text-muted)] hover:bg-white/10'}`}
                title="Serta Catatan"
            >
                <span className="material-symbols-outlined text-xs">notes</span>
            </button>

            {showNoteInput && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 p-2 glass rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
                    <input 
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-[var(--text-main)] focus:outline-none focus:border-primary transition-all"
                        placeholder="Catatan pesanan (contoh: Pedas, No MSG)..."
                        value={note || ''}
                        onChange={(e) => onNoteChange(item.id, e.target.value)}
                        autoFocus
                    />
                </div>
            )}
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
    const { showNotification } = useNotification();
    
    // 1. Navigation State based on URL Hash for History Support
    const [view, setView] = useState<'pos' | 'history' | 'printer-settings' | 'print-queue' | 'sync-queue'>(() => {
        const hash = window.location.hash.replace('#', '') as any;
        return ['pos', 'history', 'printer-settings', 'print-queue', 'sync-queue'].includes(hash) ? hash : 'pos';
    });

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '') as any;
            if (['pos', 'history', 'printer-settings', 'print-queue', 'sync-queue'].includes(hash)) {
                setView(hash);
            } else {
                setView('pos');
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const navigateTo = (newView: typeof view) => {
        window.location.hash = newView;
    };
    const [sales, setSales] = useState<Record<number, number>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'CARD'>('CASH');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [amountPaid, setAmountPaid] = useState<number>(0);
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
    const [printQueueCount, setPrintQueueCount] = useState<number>(0);
    const [mobileTab, setMobileTab] = useState<'menu' | 'cart' | 'bills'>('menu');
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [itemNotes, setItemNotes] = useState<Record<number, string>>({});
    // ── Loyalty / Member State ────────────────────────────────────────────────
    const [selectedMember, setSelectedMember] = useState<{ id: number; name: string; phone: string; points: number; level: string } | null>(null);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
    const [showMemberPanel, setShowMemberPanel] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);
    const [selectedDiscount, setSelectedDiscount] = useState<{ id: number; name: string; value: number; type: string } | null>(null);
    const [availableDiscounts, setAvailableDiscounts] = useState<any[]>([]);
    const [showDiscountPanel, setShowDiscountPanel] = useState(false);
    const [loyaltySettings, setLoyaltySettings] = useState({ pointRatio: 10000, pointValue: 100 });

    const resetLoyaltyState = () => {
        setSelectedMember(null); setMemberSearch(''); setMemberSearchResults([]);
        setPointsToRedeem(0); setSelectedDiscount(null); setAvailableDiscounts([]);
        setShowMemberPanel(false); setShowDiscountPanel(false);
    };

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

        // Load initial print queue count
        PrintService.getPendingJobs().then(jobs => {
            setPrintQueueCount(jobs.filter(j => j.status === 'PENDING').length);
        });

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
        const handleOpenSyncQueue = () => {
            navigateTo('sync-queue');
        };
        window.addEventListener('open-printer-settings', handleOpenPrinterSettings);
        window.addEventListener('open-sync-queue', handleOpenSyncQueue);

        // Syncing & Offline-First Persistence (Phase 6 & 7)
        syncEngine.start();
        
        // Handle Session Expiry from SyncEngine
        const handleSyncAuthFailed = () => {
             showNotification("Sesi kamu telah berakhir (Unauthorized). Harap refresh halaman dan login kembali.", "error");
        };
        window.addEventListener('sync-auth-failed', handleSyncAuthFailed);
        
        // Recovery Phase (Phase 7)
        PrintService.recover();
        
        // Initial Pull Sync
        syncEngine.pullInventory();

        // Listen for sync changes (needed for shift-blocking logic)
        const unsubscribe = syncEngine.onChange((count) => {
            setPendingSyncs(count);
        });

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

        // Fetch Loyalty Settings
        apiClient.get('/loyalty/settings').then((res: any) => {
            if (res) setLoyaltySettings({ 
                pointRatio: parseFloat(res.pointRatio) || 10000, 
                pointValue: parseFloat(res.pointValue) || 100 
            });
        }).catch(console.error);

        return () => {
            window.removeEventListener('sync-auth-failed', handleSyncAuthFailed);
            window.removeEventListener('open-printer-settings', handleOpenPrinterSettings);
            window.removeEventListener('open-sync-queue', handleOpenSyncQueue);
            unsubscribe();
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

    // Loyalty computed values (after totalSalesValue & activeCartItems)
    const pointsDiscountAmount = pointsToRedeem * loyaltySettings.pointValue;
    
    // Find calculated amount from available discounts if possible
    const currentDiscountData = availableDiscounts.find(d => d.id === selectedDiscount?.id);
    const discountAmount = currentDiscountData 
        ? currentDiscountData.discountAmount 
        : (selectedDiscount
            ? (selectedDiscount.type === 'percent'
                ? Math.round(totalSalesValue * selectedDiscount.value / 100)
                : selectedDiscount.value)
            : 0);
    const finalTotal = Math.max(0, totalSalesValue - discountAmount - pointsDiscountAmount);

    const searchMembers = useCallback(async (query: string) => {
        if (!query) { setMemberSearchResults([]); return; }
        try {
            const res = await apiClient.get(`/members?search=${encodeURIComponent(query)}`) as any;
            setMemberSearchResults(res?.data || []);
        } catch { setMemberSearchResults([]); }
    }, []);

    const loadDiscounts = useCallback(async () => {
        try {
            const cartItems = activeCartItems.map(item => ({ recipeId: item.id, quantity: sales[item.id], price: item.price }));
            const res = await apiClient.post('/discounts/evaluate', { items: cartItems, memberLevel: selectedMember?.level }) as any;
            const fetched = res?.data || [];
            setAvailableDiscounts(fetched);
            
            // If currently selected discount is no longer applicable, clear it
            if (selectedDiscount && !fetched.some((d: any) => d.id === selectedDiscount.id)) {
                setSelectedDiscount(null);
            }
        } catch { setAvailableDiscounts([]); }
    }, [activeCartItems, sales, selectedMember, selectedDiscount]);

    // Auto-refresh discounts on cart change
    useEffect(() => {
        loadDiscounts();
    }, [totalSalesValue, selectedMember?.id]);

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
                totalAmount: finalTotal,
                taxAmount: 0,
                // Loyalty fields
                memberId: selectedMember?.id || null,
                discountId: selectedDiscount?.id || null,
                discountTotal: discountAmount + pointsDiscountAmount,
                pointsUsed: pointsToRedeem,
                sourceId: currentBillId, // Correctly link to the open bill being PAID
            };

            const printData: PrintData = {
                id: transactionId as any,
                date: new Date().toISOString(),
                paymentMethod,
                total: finalTotal,
                amountPaid: paymentMethod === 'CASH' ? amountPaid : finalTotal,
                change_due: paymentMethod === 'CASH' ? Math.max(0, amountPaid - finalTotal) : 0,
                items: activeCartItems.map(item => ({
                    name: item.name,
                    quantity: sales[item.id],
                    price: item.price,
                    subtotal: item.price * sales[item.id],
                    category: item.category,
                    notes: itemNotes[item.id]
                })),
                tableNumber: customerInfo
            };

            // 1. Trigger Auto-Print
            // If this is an existing Open Bill being finalized, skip the checker
            // (it was already printed when the bill was first saved/updated)
            PrintService.printTransaction(printData, { skipChecker: !!currentBillId });

            // Refresh badge counter (non-blocking)
            PrintService.getPendingJobs().then(jobs => {
                setPrintQueueCount(jobs.filter(j => j.status === 'PENDING').length);
            }).catch(() => {});

            // 2. Save to Offline Queue & Trigger Sync
            await syncEngine.enqueue('CHECKOUT', { ...checkoutData, status: 'PAID', customerInfo });

            // 3. UI Optimistic Success
            if (currentBillId) {
                setOpenBills(prev => prev.filter(b => b.id !== currentBillId));
            }
            setSales({});
            setItemNotes({});
            setPaymentMethod('CASH');
            setAmountPaid(0);
            setCustomerInfo('');
            setCurrentBillId(null);
            resetLoyaltyState();
            
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

            showNotification(`Transaksi Berhasil! Simpan Offline. Kembalian: Rp ${changeDue.toLocaleString('id-ID')}`, "success");
        } catch (error) {
            console.error('Checkout failed', error);
            showNotification('Gagal menyimpan transaksi ke database lokal.', "error");
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
            showNotification(`Tagihan untuk "${info}" sudah ada di Daftar Bill Aktif.`, "warning");
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
                    subtotal: (item.price || 0) * (sales[item.id] || 0),
                    notes: itemNotes[item.id]
                })),
                status: 'OPEN',
                customerInfo: info,
                paymentMethod: 'CASH',
                subTotal: totalSalesValue,
                totalAmount: totalSalesValue
            };

            await apiClient.post('/transactions', checkoutData);
            showNotification('Bill berhasil disimpan!', "success");

            // --- AUTO PRINT CHECKER FOR NEW BILL ---
            const printDataForChecker = {
                id: checkoutData.id,
                date: new Date().toISOString(),
                paymentMethod: 'CASH',
                total: totalSalesValue,
                items: activeCartItems.map(item => ({
                    name: item.name,
                    quantity: sales[item.id],
                    price: item.price,
                    subtotal: item.price * sales[item.id],
                    category: item.category,
                    notes: itemNotes[item.id]
                })),
                tableNumber: info
            };
            PrintService.printChecker(printDataForChecker).catch(err => console.error('Checker print failed:', err));

            setSales({});
            setItemNotes({});
            setCustomerInfo('');
            setCurrentBillId(null);
            
            // Refresh open bills
            const response = await apiClient.get('/transactions/open-bills') as any;
            if (response && response.data) setOpenBills(response.data);
        } catch (error) {
            showNotification('Gagal menyimpan bill', "error");
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
                price: item.price,
                notes: itemNotes[item.id]
            }));

            await syncEngine.enqueue('ADD_ITEMS_TO_BILL', { id: currentBillId, items });
            showNotification('Permintaan update bill disimpan ke antrean!', "success");
            
            // Optimistic refresh (still fetch open bills to get other updates, but don't wait for sync)
            apiClient.get('/transactions/open-bills').then((response: any) => {
                if (response && response.data) setOpenBills(response.data);
            }).catch(() => {});

            // --- AUTO PRINT CHECKER FOR UPDATED ITEMS ---
            // Note: Ideally we only print the NEW items, but for now we print the whole consolidated checker
            const printDataUpdate = {
                id: currentBillId,
                date: new Date().toISOString(),
                paymentMethod: 'CASH',
                total: totalSalesValue,
                items: activeCartItems.map(item => ({
                    name: item.name,
                    quantity: sales[item.id],
                    price: item.price,
                    subtotal: item.price * sales[item.id],
                    category: item.category,
                    notes: itemNotes[item.id]
                })),
                tableNumber: customerInfo
            };
            PrintService.printChecker(printDataUpdate).catch(err => console.error('Checker print failed (update):', err));

            setSales({});
            setItemNotes({});
        } catch (error) {
            showNotification('Gagal memperbarui bill', "error");
        } finally {
            setIsCheckingOut(false);
        }
    };

    const loadBill = (bill: any) => {
        const newSales: Record<number, number> = {};
        const newNotes: Record<number, string> = {};
        bill.items.forEach((item: any) => {
            newSales[item.recipeId] = item.quantity;
            if (item.notes) newNotes[item.recipeId] = item.notes;
        });
        setSales(newSales);
        setItemNotes(newNotes);
        setCurrentBillId(bill.id);
        setCustomerInfo(bill.customerInfo);
        showNotification(`Memuat Bill: ${bill.customerInfo}`, "info");
    };

    const handleDeleteBill = async (e: React.MouseEvent, bill: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`Hapus/Batalkan Bill untuk "${bill.customerInfo}"? Stok yang sudah dipotong tidak akan otomatis kembali.`)) return;
        
        try {
            // Enterprise Hardening: Use Sync Queue for deletion
            await db.offlineActions.add({
                id: `del-${bill.id}-${Date.now()}`,
                idempotency_key: `req_del_${bill.id}_${Date.now()}`,
                type: 'DELETE_TRANSACTION',
                payload: { id: bill.id },
                created_at: new Date().toISOString(),
                sync_status: 'PENDING',
                retry_count: 0
            });

            syncEngine.forceSync().catch(console.error);
            showNotification('Penghapusan telah masuk antrean.', "info");

            // Optimistic Update: Remove from local list or refresh
            setOpenBills(prev => prev.filter(b => b.id !== bill.id));
            if (currentBillId === bill.id) {
                setCurrentBillId(null);
                setCustomerInfo('');
                setSales({});
            }
        } catch (error: any) {
            showNotification(`Gagal menghapus: ${error.message}`, "error");
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
            showNotification('Gagal mengambil detail bill', "error");
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
            showNotification('Pilih minimal satu item untuk dipisah', "warning");
            return;
        }

        setIsCheckingOut(true);
        try {
            console.log('Enqueuing splitBill request...');
            const payload = {
                sourceId: splitSourceBill.id,
                targetInfo: splitTargetInfo,
                items: itemsToMove
            };

            if (navigator.onLine) {
                // If online, we try to do it normally to support immediate redirection for "pay" mode
                try {
                    const result = await apiClient.splitBill(payload);
                    if (result.success) {
                        setIsSplitModalOpen(false);
                        
                        // Local Refresh
                        apiClient.get('/transactions/open-bills').then((res: any) => {
                            if (res && res.data) setOpenBills(res.data);
                        }).catch(() => {});

                        if (splitMode === 'pay') {
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
                                showNotification('Item berhasil dipisah. Silakan klik Checkout.', "success");
                            }
                        } else {
                            showNotification('Bill berhasil dipisah!', "success");
                        }
                        return;
                    }
                } catch (err) {
                    console.log('Direct split failed, falling back to queue...', err);
                }
            }

            // QUEUE PATH: If offline or direct failed
            await syncEngine.enqueue('SPLIT_BILL', payload);
            setIsSplitModalOpen(false);
            showNotification('Permintaan pisah bill disimpan ke antrean.', "info");
            
            // Optimistically update the UI by removing the bill from list if it was a total move?
            // (Hard to do perfectly without knowing server state, so we just inform the user)
            
        } catch (error: any) {
            console.error('Split exception:', error);
            showNotification(`Gagal memisah bill: ${error.message}`, "error");
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleOpenShift = async (initialCash: number) => {
        await openShift(initialCash);
        refreshActiveShift();
    };

    const handleCloseShift = async (data: { actualCash: number, actualNonCash: number, notes: string, denominations: Record<string, number>, nonCashVerified: boolean }) => {
        // Transform denominations record to array of objects for backend
        const formattedDenominations = Object.entries(data.denominations).map(([nominal, qty]) => ({
            nominal: parseInt(nominal),
            qty
        }));

        await closeShift({ 
            id: activeShift.id, 
            data: {
                ...data,
                denominations: formattedDenominations
            } as any
        });
        setIsCloseShiftOpen(false);
        refreshActiveShift();
        showNotification('Shift berhasil ditutup! Ringkasan telah disimpan.', "success");
    };

    const handleHandoverShift = async (data: { currentShiftId: number; cashAmount: number; nextCashierName: string; adminPin: string }) => {
        await handoverShift(data);
        setIsHandoverShiftOpen(false);
        showNotification('Shift berhasil pindahtangan. Aplikasi dimuat ulang.', "success");
        setTimeout(() => window.location.reload(), 2000); 
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
                            className={`flex items-center justify-center gap-2 py-1.5 rounded-md border transition-all active:scale-95 ${
                                paymentMethod === method.id 
                                    ? 'bg-primary/20 border-primary text-primary shadow-sm' 
                                    : 'bg-[var(--bg-app)] border-[var(--border-dim)] text-[var(--text-muted)] hover:bg-white/5'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base font-black">{method.icon}</span>
                            <span className="text-[13px] font-bold uppercase tracking-tight">{method.label}</span>
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
                                className={`flex-1 min-w-[60px] py-1.5 rounded-md border font-bold text-[13px] transition-all active:scale-95 ${
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
                <div 
                    className="flex items-end justify-between px-1 cursor-pointer group active:opacity-60 transition-all md:cursor-default md:active:opacity-100"
                    onClick={() => {
                        if (window.innerWidth < 1024) { // lg breakpoint
                            setMobileTab('cart');
                        }
                    }}
                >
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Total Penjualan</p>
                            <span className="lg:hidden px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-black uppercase tracking-tighter animate-pulse">Lihat Detail</span>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-[var(--text-main)] leading-none">
                            <span className="text-primary mr-1 text-sm">Rp</span>
                            {totalSalesValue.toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>

                {/* Updated Transaction Summary */}
                {(discountAmount > 0 || pointsDiscountAmount > 0) && (
                    <div className="bg-[var(--bg-app)] rounded-xl border border-[var(--border-dim)] p-2.5 space-y-1">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-[var(--text-muted)]">Subtotal</span>
                            <span className="text-[var(--text-main)] font-bold">Rp {totalSalesValue.toLocaleString('id-ID')}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-[10px]">
                                <span className="text-emerald-400">Diskon</span>
                                <span className="text-emerald-400 font-bold">-Rp {discountAmount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        {pointsDiscountAmount > 0 && (
                            <div className="flex justify-between text-[10px]">
                                <span className="text-amber-400">Poin ({pointsToRedeem} pts)</span>
                                <span className="text-amber-400 font-bold">-Rp {pointsDiscountAmount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs font-black pt-1 border-t border-[var(--border-dim)]">
                            <span className="text-[var(--text-main)]">Total Bayar</span>
                            <span className="text-primary">Rp {finalTotal.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    <button 
                        id="btn-checkout"
                        onClick={() => handleCheckout(true)}
                        disabled={isCheckingOut || totalItems === 0 || (paymentMethod === 'CASH' && amountPaid < totalSalesValue)}
                        className={`flex-1 h-12 rounded-lg font-bold text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
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
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0">

            {/* Loyalty Nav Dropdowns */}
            <div className="flex items-center gap-2">
                {/* Member Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => { 
                            setShowMemberPanel(!showMemberPanel); 
                            setShowDiscountPanel(false); 
                            setIsActionMenuOpen(false); 
                            if (!showMemberPanel) searchMembers('');
                        }}
                        className={`h-10 px-3 rounded-xl flex items-center justify-center gap-2 ${showMemberPanel || selectedMember ? 'bg-primary text-[#0b1220] font-black' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold'} active:scale-95 transition-all shadow-lg`}
                        title="Pilih Member"
                    >
                        <span className="material-symbols-outlined text-lg">person_search</span>
                        <span className="text-[10px] hidden sm:inline uppercase tracking-widest">{selectedMember ? selectedMember.name.substring(0,10) : 'Member'}</span>
                    </button>
                    {showMemberPanel && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMemberPanel(false)} />
                            <div className={`absolute right-0 mt-3 w-[280px] sm:w-80 ${PerformanceSettings.getGlassClass()} border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-in slide-in-from-top-2 fade-in duration-200`}>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                        <h4 className="font-black text-sm uppercase tracking-widest text-[var(--text-main)]">Pilih Member</h4>
                                        {selectedMember && (
                                            <button onClick={() => { setSelectedMember(null); setPointsToRedeem(0); }} className="text-[10px] text-red-400 font-bold hover:text-red-300">Hapus</button>
                                        )}
                                    </div>
                                    {!selectedMember ? (
                                        <div className="space-y-2">
                                            <input
                                                autoFocus
                                                placeholder="Cari nama / No HP..."
                                                value={memberSearch}
                                                onChange={e => { setMemberSearch(e.target.value); searchMembers(e.target.value); }}
                                                onKeyDown={e => e.key === 'Escape' && setShowMemberPanel(false)}
                                                className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] outline-none focus:border-primary/40"
                                            />
                                            {memberSearchResults.length > 0 && (
                                                <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                                    {memberSearchResults.map((m) => (
                                                        <button key={m.id} onClick={() => {
                                                            setSelectedMember({ id: m.id, name: m.name, phone: m.phone, points: m.points, level: m.level });
                                                            setShowMemberPanel(false); setMemberSearch(''); setMemberSearchResults([]);
                                                        }} className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20">
                                                            <div className="text-left">
                                                                <p className="font-bold text-[11px] text-[var(--text-main)]">{m.name}</p>
                                                                <p className="text-[9px] text-[var(--text-muted)]">{m.phone}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-[10px] text-primary font-black">{m.points} pts</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-dim)] flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-black text-[var(--text-main)]">{selectedMember.name}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)]">{selectedMember.phone}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Total Poin</p>
                                                    <p className="text-sm font-black text-primary">{selectedMember.points.toLocaleString('id-ID')}</p>
                                                </div>
                                            </div>
                                            {selectedMember.points > 0 && (
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Tukar Poin</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number" min={0} max={selectedMember.points}
                                                            value={pointsToRedeem || ''}
                                                            onChange={e => setPointsToRedeem(Math.min(selectedMember.points, Math.max(0, parseInt(e.target.value) || 0)))}
                                                            className="flex-1 bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] outline-none"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <button onClick={() => setShowMemberPanel(false)} className="w-full py-2 bg-primary text-[#0b1220] font-black tracking-widest uppercase text-[10px] rounded-xl hover:opacity-90">Selesai</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Discount Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => { setShowDiscountPanel(!showDiscountPanel); setShowMemberPanel(false); loadDiscounts(); setIsActionMenuOpen(false); }}
                        className={`h-10 px-3 rounded-xl flex items-center justify-center gap-2 ${showDiscountPanel || selectedDiscount ? 'bg-emerald-500 text-[#0b1220] font-black' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold'} active:scale-95 transition-all shadow-lg`}
                        title="Pilih Diskon"
                    >
                        <span className="material-symbols-outlined text-lg">local_offer</span>
                        <span className="text-[10px] hidden sm:inline uppercase tracking-widest">{selectedDiscount ? 'Diskon Aktif' : 'Diskon'}</span>
                    </button>
                    {showDiscountPanel && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowDiscountPanel(false)} />
                            <div className={`absolute right-0 mt-3 w-[280px] sm:w-80 ${PerformanceSettings.getGlassClass()} border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-in slide-in-from-top-2 fade-in duration-200`}>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                        <h4 className="font-black text-sm uppercase tracking-widest text-[var(--text-main)]">Pilih Diskon</h4>
                                        {selectedDiscount && (
                                            <button onClick={() => { setSelectedDiscount(null); setShowDiscountPanel(false); }} className="text-[10px] text-red-400 font-bold hover:text-red-300">Hapus</button>
                                        )}
                                    </div>
                                    <div className="max-h-56 overflow-y-auto space-y-2 custom-scrollbar">
                                        {availableDiscounts.length === 0 ? (
                                            <p className="text-[10px] text-[var(--text-muted)] text-center py-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-dim)]">Tidak ada diskon yang berlaku saat ini</p>
                                        ) : availableDiscounts.map((d) => (
                                            <button key={d.id} onClick={() => { setSelectedDiscount({ id: d.id, name: d.name, value: parseFloat(d.value), type: d.type }); setShowDiscountPanel(false); }} className={`w-full text-left p-3 rounded-xl transition-all border ${selectedDiscount?.id === d.id ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-[var(--bg-app)] border-[var(--border-dim)] hover:border-emerald-500/30'}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`font-black text-[11px] ${selectedDiscount?.id === d.id ? 'text-emerald-400' : 'text-[var(--text-main)]'}`}>{d.name}</span>
                                                    <span className="text-[11px] text-emerald-400 font-black">-Rp {d.discountAmount?.toLocaleString('id-ID')}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Shift Status */}
            {activeShift && (
                <div className="hidden min-[1100px]:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                    <div className="size-8 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                        <span className="material-symbols-outlined text-sm text-primary">person</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-primary tracking-[0.2em] leading-none mb-1">Shift Aktif</span>
                        <span className="text-[10px] font-bold text-[var(--text-main)] leading-none whitespace-nowrap">{activeShift.userName || 'Kasir'}</span>
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
                                showNotification(`Gagal Menutup Shift! Masih ada ${pendingSyncs} antrean cloud.`, "error");
                                return;
                            }
                            try {
                                const summary = await getSummary(activeShift.id);
                                setShiftSummaryData(summary.data);
                                setIsCloseShiftOpen(true);
                            } catch (error: any) {
                                console.error('Failed to load shift summary:', error);
                                showNotification('Gagal memuat ringkasan shift. Cek koneksi internet.', 'error');
                            }
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

            {/* Consolidated Action Menu (3 Dots) */}
            <div className="relative">
                <button 
                    onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                    className={`size-10 rounded-xl flex items-center justify-center ${isActionMenuOpen ? 'bg-primary text-[#0b1220]' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'} active:scale-95 transition-all shadow-lg`}
                    title="Menu Aksi"
                >
                    <span className="material-symbols-outlined text-2xl font-black">more_vert</span>
                </button>

                {/* Dropdown Menu */}
                {isActionMenuOpen && (
                    <>
                        {/* Backdrop for closing */}
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsActionMenuOpen(false)}
                        />
                        
                        <div className={`absolute right-0 mt-3 w-64 ${PerformanceSettings.getGlassClass()} border border-white/10 rounded-2xl p-3 shadow-2xl z-50 animate-in slide-in-from-top-2 fade-in duration-200`}>
                            <div className="space-y-3">
                                {activeShift && (
                                    <>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60 ml-2">Kasir Aktif</p>
                                            <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-sm text-primary">person</span>
                                                    </div>
                                                    <span className="text-[11px] font-black text-[var(--text-main)] truncate max-w-[120px]">{activeShift.userName || 'Kasir'}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setIsActionMenuOpen(false); setIsHandoverShiftOpen(true); }}
                                                        className="size-8 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center transition-all"
                                                        title="Oper Shift"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">sync_alt</span>
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            setIsActionMenuOpen(false);
                                                            if (pendingSyncs > 0) {
                                                                showNotification(`Gagal Menutup Shift! Masih ada ${pendingSyncs} antrean cloud.`, "error");
                                                                return;
                                                            }
                                                            try {
                                                                const summary = await getSummary(activeShift.id);
                                                                setShiftSummaryData(summary.data);
                                                                setIsCloseShiftOpen(true);
                                                            } catch (error: any) {
                                                                console.error('Failed to load shift summary:', error);
                                                                showNotification('Gagal memuat ringkasan shift.', 'error');
                                                            }
                                                        }}
                                                        className={`size-8 rounded-lg flex items-center justify-center transition-all ${
                                                            pendingSyncs > 0 ? 'bg-gray-500/10 text-gray-500' : 'bg-red-500/10 hover:bg-red-500/20 text-red-500'
                                                        }`}
                                                        title="Tutup Shift"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">{pendingSyncs > 0 ? 'cloud_sync' : 'logout'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-px bg-white/5 mx-2"></div>
                                    </>
                                )}

                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60 ml-2">Sinkronisasi</p>
                                    <div className="bg-black/20 rounded-xl p-2">
                                        <SyncWidget />
                                    </div>
                                </div>

                                <div className="h-px bg-white/5 mx-2"></div>

                                {/* Section: Navigasi */}
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60 ml-2 mb-2">Navigasi</p>
                                    <button 
                                        onClick={() => { navigateTo('pos'); setIsActionMenuOpen(false); }}
                                        className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all ${view === 'pos' ? 'bg-primary/20 text-primary font-black border border-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5 font-bold'}`}
                                    >
                                        <span className="material-symbols-outlined text-base">point_of_sale</span>
                                        <span className="text-xs uppercase tracking-widest">Input Penjualan</span>
                                    </button>
                                    <button 
                                        onClick={() => { navigateTo('history'); setIsActionMenuOpen(false); }}
                                        className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all ${view === 'history' ? 'bg-primary/20 text-primary font-black border border-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5 font-bold'}`}
                                    >
                                        <span className="material-symbols-outlined text-base">history</span>
                                        <span className="text-xs uppercase tracking-widest">Riwayat Kasir</span>
                                    </button>
                                    <button 
                                        onClick={() => { navigateTo('print-queue'); setIsActionMenuOpen(false); }}
                                        className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 relative transition-all ${view === 'print-queue' ? 'bg-primary/20 text-primary font-black border border-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5 font-bold'}`}
                                    >
                                        <span className="material-symbols-outlined text-base">receipt_long</span>
                                        <span className="text-xs uppercase tracking-widest">Antrean Struk</span>
                                        {printQueueCount > 0 && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 size-5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                                                {printQueueCount}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                <div className="h-px bg-white/5 mx-2"></div>

                                {/* Section: Settings */}
                                <button 
                                    onClick={() => { navigateTo('printer-settings'); setIsActionMenuOpen(false); }}
                                    className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all ${view === 'printer-settings' ? 'bg-primary/20 text-primary font-black border border-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5 font-bold'}`}
                                >
                                    <span className="material-symbols-outlined text-base">print</span>
                                    <span className="text-xs uppercase tracking-widest">Pengaturan Printer</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const pageTitle = view === 'history' ? 'Riwayat Penjualan' : view === 'printer-settings' ? 'Pengaturan Printer' : view === 'print-queue' ? 'Antrean Cetak' : view === 'sync-queue' ? 'Antrean Cloud' : 'Input Penjualan';
    const pageSubtitle = view === 'history' ? 'Daftar semua transaksi yang telah selesai' : view === 'printer-settings' ? 'Konfigurasi bluetooth dan thermal printer' : view === 'print-queue' ? 'Cetak ulang struk yang tertunda' : view === 'sync-queue' ? 'Manajemen sinkronisasi data ke cloud' : 'Input pesanan pelanggan baru';

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
                footer={view === 'pos' ? <div className="lg:hidden">{PosFooter}</div> : null}
                headerExtras={PosHeaderExtras}
                drawerOpen={drawerOpen}
                onDrawerOpen={() => setDrawerOpen(true)}
                onDrawerClose={() => setDrawerOpen(false)}
            >
            <div className="space-y-4 md:space-y-8">
                {view === 'pos' && !isActiveLoading && (
                    <>
                        {!activeShift ? (
                            <ShiftRequired onOpenShift={() => setView('pos')} />
                        ) : (
                            <>
                                {/* MOBILE ACTION BUTTONS (REPLACES OLD TAB SWITCHER) */}
                                <div className="!flex lg:!hidden gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 mb-4 shrink-0">
                                    <button
                                        onClick={() => setMobileTab('menu')}
                                        className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                                            mobileTab === 'menu' ? 'bg-primary text-slate-950 font-black shadow-lg shadow-primary/20' : 'text-[var(--text-main)] hover:bg-white/5 font-bold'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
                                        <span className="uppercase tracking-widest text-[10px]">Menu</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => setMobileTab('cart')}
                                        className={`flex-[1.2] py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                                            mobileTab === 'cart' ? 'bg-primary text-slate-950 font-black shadow-lg shadow-primary/20' : 'text-[var(--text-main)] hover:bg-white/5 font-bold'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                                        <span className="uppercase tracking-widest text-[10px]">Keranjang</span>
                                        {totalItems > 0 && (
                                            <span className={`ml-1 size-5 rounded-full text-[9px] flex items-center justify-center font-black ${
                                                mobileTab === 'cart' ? 'bg-slate-950 text-primary' : 'bg-primary text-slate-950'
                                            }`}>
                                                {totalItems}
                                            </span>
                                        )}
                                    </button>
                                </div>
                                
                                {/* SECTION: OPEN BILLS (Only in Menu/Bills tab on mobile) */}
                                {(mobileTab === 'menu' || mobileTab === 'bills') && openBills.length > 0 && !currentBillId && (
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
                                    <div className={`w-full lg:w-[50%] flex-col gap-4 ${mobileTab === 'menu' ? 'flex' : 'hidden lg:flex'}`}>
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

                                        {/* HORIZONTAL CATEGORIES (Mobile Only) */}
                                        <div className="!flex lg:!hidden gap-2 overflow-x-auto pb-2 px-1 custom-scrollbar shrink-0">
                                            <button 
                                                onClick={() => setSelectedCategory(null)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${!selectedCategory ? 'bg-primary text-slate-950 border-primary' : 'text-[var(--text-muted)] bg-white/5 border-white/5'}`}
                                            >
                                                Semua
                                            </button>
                                            {Array.from(new Set(items.map(i => i.category))).filter(Boolean).map(cat => (
                                                <button 
                                                    key={cat}
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === cat ? 'bg-primary text-slate-950 border-primary' : 'text-[var(--text-muted)] bg-white/5 border-white/5'}`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
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
                                    <div className={`w-full lg:w-[35%] flex-col h-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-2xl shadow-xl overflow-hidden ${mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
                                        {/* Cart Header */}
                                        <div className="p-4 border-b border-[var(--border-dim)] shrink-0 bg-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-all shrink-0">
                                                    <span className="material-symbols-outlined text-xl">shopping_cart</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] flex items-center gap-2 truncate">
                                                        Keranjang
                                                    </h2>
                                                    <p className="text-[10px] font-bold text-primary uppercase mt-0.5">{totalItems} Item</p>
                                                </div>
                                            </div>
                                            
                                            <button onClick={() => setSales({})} className="text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-2.5 flex items-center gap-1.5 rounded-xl shrink-0 transition-all active:scale-95 border border-red-500/20">
                                                <span className="material-symbols-outlined text-base">delete_sweep</span> 
                                                <span className="xs:inline hidden">Riset</span>
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
                                                <MemoizedCartItem 
                                                    key={item.id} 
                                                    item={item} 
                                                    salesCount={sales[item.id]} 
                                                    updateQty={updateQty} 
                                                    note={itemNotes[item.id]}
                                                    onNoteChange={(id, note) => setItemNotes(prev => ({ ...prev, [id]: note }))}
                                                />
                                            ))}
                                        </div>

                                        {/* Compact Embedded PosFooter (Desktop Only) */}
                                        <div className="shrink-0 p-0 border-t border-[var(--border-dim)] bg-black/20 hidden lg:block">
                                            {PosFooter}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                </>
            )}

                {view === 'history' && (
                    <TransactionHistory onBack={() => navigateTo('pos')} />
                )}

                {view === 'printer-settings' && (
                    <PrinterSettings 
                        isOpen={true} 
                        onClose={() => navigateTo('pos')} 
                        isFullPage={true} 
                    />
                )}

                {view === 'print-queue' && (
                    <PrintQueueManager onBack={() => {
                        navigateTo('pos');
                        PrintService.getPendingJobs().then(jobs => {
                            setPrintQueueCount(jobs.filter(j => j.status === 'PENDING').length);
                        });
                    }} />
                )}

                {view === 'sync-queue' && (
                    <SyncQueuePage onBack={() => navigateTo('pos')} />
                )}
            </div>



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
