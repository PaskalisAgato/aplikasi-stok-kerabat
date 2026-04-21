import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@shared/Layout';
import { useNotification } from '@shared/components/NotificationProvider';
import { syncEngine } from '@shared/services/SyncEngine';
import { PrintService } from '@shared/services/PrintService';
import { apiClient } from '@shared/apiClient';

// Hooks
import { usePOSData } from './hooks/usePOSData';
import { useCart } from './hooks/useCart';
import { useBillManagement } from './hooks/useBillManagement';
import { useLoyalty } from './hooks/useLoyalty';
import { useCheckout } from './hooks/useCheckout';

// Components
import { ProductGrid } from './components/ProductGrid';
import { CartItem } from './components/CartItem';
import { POSFooter } from './components/POSFooter';
import { POSHeaderExtras } from './components/POSHeaderExtras';
import { MergeModal } from './components/MergeModal';
import { SplitModal } from './components/SplitModal';
import { OpenShiftModal, CloseShiftModal, HandoverShiftModal } from './components/ShiftModals';

// Lazy Loaded Pages
const TransactionHistory = React.lazy(() => import('./TransactionHistory'));
const PrinterSettings = React.lazy(() => import('@shared/components/PrinterSettings'));
const PrintQueueManager = React.lazy(() => import('./PrintQueueManager'));
const SyncQueuePage = React.lazy(() => import('./SyncQueuePage'));

export default function App() {
    const { showNotification } = useNotification();
    
    // Core State Hooks
    const { 
        items, isLoading, categories, selectedCategory, setSelectedCategory, 
        searchTerm, setSearchTerm, filteredRecipes 
    } = usePOSData();

    const { 
        sales, setSales, itemNotes, updateQty, onNoteChange, 
        activeCartItems, totalSalesValue, totalItems, resetCart 
    } = useCart(items);

    const {
        openBills, currentBillId, setCurrentBillId, customerInfo, setCustomerInfo,
        handleSaveBill: saveBillLogic, handleUpdateBill, handleDeleteBill,
        performMerge, performSplit
    } = useBillManagement();

    const {
        selectedMember, setSelectedMember, memberSearch, setMemberSearch,
        memberSearchResults, showMemberPanel, setShowMemberPanel,
        isAddingMember, setIsAddingMember, newMemberName, setNewMemberName,
        newMemberPhone, setNewMemberPhone, isCreatingMember,
        pointsToRedeem, setPointsToRedeem, selectedDiscount, setSelectedDiscount,
        availableDiscounts, showDiscountPanel, setShowDiscountPanel,
        loyaltySettings, searchMembers, loadDiscounts, handleCreateMember, resetLoyaltyState
    } = useLoyalty(activeCartItems, totalSalesValue);

    const { isCheckingOut, handleCheckout: checkoutLogic } = useCheckout();

    // UI View State
    const [view, setView] = useState<'pos' | 'history' | 'printer-settings' | 'print-queue' | 'sync-queue'>('pos');
    const [mobileTab, setMobileTab] = useState<'menu' | 'cart' | 'bills'>('menu');
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'CARD'>('CASH');
    const [amountPaid, setAmountPaid] = useState(0);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    
    // Shift State
    const [activeShift, setActiveShift] = useState<any>(null);
    const [isHandoverShiftOpen, setIsHandoverShiftOpen] = useState(false);
    const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
    const [shiftSummaryData, setShiftSummaryData] = useState<any>(null);

    // Sync & Print State
    const [pendingSyncs, setPendingSyncs] = useState(0);
    const [printQueueCount, setPrintQueueCount] = useState(0);
    const [printAlertMsg, setPrintAlertMsg] = useState<{ message: string; data?: any } | null>(null);

    // Modal State
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [targetBillForMerge, setTargetBillForMerge] = useState<any>(null);
    const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
    
    const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
    const [splitSourceBill, setSplitSourceBill] = useState<any>(null);
    const [splitMode, setSplitMode] = useState<'table' | 'pay'>('table');
    const [splitTargetInfo, setSplitTargetInfo] = useState('');
    const [selectedSplitItems, setSelectedSplitItems] = useState<Record<number, number>>({});

    // Initialization
    useEffect(() => {
        apiClient.get('/cashier-shifts/active').then((res: any) => {
            if (res && res.data) setActiveShift(res.data);
        }).catch(console.error);

        const unsubSync = syncEngine.onChange(setPendingSyncs);
        const unsubPrint = PrintService.onQueueChange((jobs: any[]) => {
            setPrintQueueCount(jobs.filter((j: any) => j.status === 'PENDING').length);
        });
        
        const handlePrintAlert = (e: any) => {
            const data = e.detail;
            setPrintAlertMsg(data);
            showNotification(data.message || 'Printer Error', 'warning');
        };
        window.addEventListener('print-failed-alert', handlePrintAlert);

        return () => {
            unsubSync(); unsubPrint();
            window.removeEventListener('print-failed-alert', handlePrintAlert);
        };
    }, []);

    // Derived Values
    const discountAmount = useMemo(() => {
        if (!selectedDiscount) return 0;
        return selectedDiscount.type === 'PERCENTAGE' 
            ? (totalSalesValue * (selectedDiscount.value / 100)) 
            : selectedDiscount.value;
    }, [selectedDiscount, totalSalesValue]);

    const pointsDiscountAmount = useMemo(() => {
        return pointsToRedeem * (loyaltySettings.pointValue || 100);
    }, [pointsToRedeem, loyaltySettings]);

    const finalTotal = useMemo(() => {
        return Math.max(0, totalSalesValue - discountAmount - pointsDiscountAmount);
    }, [totalSalesValue, discountAmount, pointsDiscountAmount]);

    const changeDue = useMemo(() => {
        if (paymentMethod !== 'CASH') return 0;
        return Math.max(0, amountPaid - finalTotal);
    }, [paymentMethod, amountPaid, finalTotal]);

    // Handlers
    const handleCheckout = async () => {
        const result = await checkoutLogic({
            totalSalesValue, finalTotal, paymentMethod, amountPaid,
            activeCartItems, sales, customerInfo, currentBillId,
            selectedMember, selectedDiscount, pointsToRedeem,
            itemNotes, activeShift
        });

        if (result?.success) {
            resetCart();
            resetLoyaltyState();
            setAmountPaid(0);
            setCurrentBillId(null);
            setCustomerInfo('');
        }
    };

    const onSaveBill = async () => {
        const result = await saveBillLogic(activeCartItems, totalSalesValue, itemNotes);
        if (result?.success) {
            resetCart();
            setCustomerInfo('');
        }
    };

    const onUpdateBillHandle = async () => {
        const result = await handleUpdateBill(activeCartItems, itemNotes);
        if (result?.clearCart) resetCart();
    };

    const navigateTo = (newView: any) => {
        setView(newView);
        setIsActionMenuOpen(false);
    };

    return (
        <Layout 
            title="Point of Sale"
            currentPort={3000}
            headerExtras={
                <POSHeaderExtras 
                    {...{
                        showMemberPanel, setShowMemberPanel, selectedMember, setSelectedMember,
                        setPointsToRedeem, searchMembers, memberSearch, setMemberSearch,
                        memberSearchResults, isAddingMember, setIsAddingMember,
                        newMemberName, setNewMemberName, newMemberPhone, setNewMemberPhone,
                        handleCreateMember, isCreatingMember, showDiscountPanel, setShowDiscountPanel,
                        selectedDiscount, setSelectedDiscount, loadDiscounts, availableDiscounts,
                        activeShift, pendingSyncs, setIsHandoverShiftOpen, setIsCloseShiftOpen,
                        getSummary: (id) => apiClient.get(`/cashier-shifts/summary/${id}`),
                        setShiftSummaryData, showNotification, isActionMenuOpen, setIsActionMenuOpen,
                        navigateTo, view, printQueueCount, pointsToRedeem
                    }}
                />
            }
        >
            <div className="flex-1 flex flex-col min-h-0 relative">
                {view === 'pos' ? (
                    <>
                        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
                            {/* Column 1: Bill List */}
                            <div className={`w-full lg:w-[20%] flex-col h-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-2xl p-4 overflow-hidden ${mobileTab === 'bills' ? 'flex' : 'hidden lg:flex'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Daftar Bill</h3>
                                    <button onClick={() => { setCurrentBillId(null); setCustomerInfo(''); setSales({}); }} className="text-[10px] font-bold text-primary hover:underline">Bill Baru</button>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                                    {openBills.length === 0 ? (
                                        <p className="text-[10px] text-[var(--text-muted)] text-center py-10 italic">Belum ada bill aktif</p>
                                    ) : openBills.map(bill => (
                                        <div 
                                            key={bill.id} 
                                            onClick={() => {
                                                setCurrentBillId(bill.id);
                                                setCustomerInfo(bill.customerInfo);
                                                const newSales: Record<number, number> = {};
                                                bill.items?.forEach((i: any) => newSales[i.recipeId] = i.quantity);
                                                setSales(newSales);
                                            }}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all ${currentBillId === bill.id ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' : 'bg-black/10 border-white/5 hover:border-primary/30'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className="text-[11px] font-black uppercase text-[var(--text-main)] truncate max-w-[120px]">{bill.customerInfo}</p>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteBill(bill); }} className="text-red-500/50 hover:text-red-500">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                            <p className="text-[10px] font-bold text-primary mt-1">Rp {parseFloat(bill.totalAmount).toLocaleString('id-ID')}</p>
                                            <div className="flex gap-1 mt-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setTargetBillForMerge(bill); setSelectedSourceIds([]); setIsMergeModalOpen(true); }}
                                                    className="flex-1 py-1 bg-white/5 hover:bg-primary/20 rounded-md text-[8px] font-black uppercase text-[var(--text-muted)] hover:text-primary transition-all"
                                                >Merge</button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSplitSourceBill(bill); setSplitMode('table'); setSplitTargetInfo(''); setSelectedSplitItems({}); setIsSplitModalOpen(true); }}
                                                    className="flex-1 py-1 bg-white/5 hover:bg-emerald-500/20 rounded-md text-[8px] font-black uppercase text-[var(--text-muted)] hover:text-emerald-500 transition-all"
                                                >Split</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Column 2: Product Menu */}
                            <div className={`w-full lg:flex-1 flex flex-col h-full min-h-0 ${mobileTab === 'menu' ? 'flex' : 'hidden lg:flex'}`}>
                                <div className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0 px-1">
                                    <div className="flex-1 relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-lg">search</span>
                                        <input 
                                            placeholder="Cari menu (Alt+S)..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-[var(--text-main)] outline-none focus:border-primary/50 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar shrink-0 no-scrollbar">
                                    <button 
                                        onClick={() => setSelectedCategory(null)}
                                        className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${!selectedCategory ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20' : 'bg-[var(--bg-app)] border border-[var(--border-dim)] text-[var(--text-muted)] hover:bg-white/5'}`}
                                    >Semua</button>
                                    {categories.map(cat => (
                                        <button 
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20' : 'bg-[var(--bg-app)] border border-[var(--border-dim)] text-[var(--text-muted)] hover:bg-white/5'}`}
                                        >{cat}</button>
                                    ))}
                                </div>

                                {isLoading ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <div key={i} className="bg-[var(--glass-bg)] border border-[var(--border-dim)] rounded-xl h-[72px] animate-pulse"></div>
                                        ))}
                                    </div>
                                ) : (
                                    <ProductGrid 
                                        items={filteredRecipes}
                                        sales={sales}
                                        updateQty={updateQty}
                                    />
                                )}
                            </div>

                            {/* Column 3: Cart */}
                            <div className={`w-full lg:w-[35%] flex-col h-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-2xl shadow-xl overflow-hidden ${mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
                                <div className="p-4 border-b border-[var(--border-dim)] shrink-0 bg-white/5 flex items-center justify-between">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-xl text-primary">shopping_cart</span>
                                        Keranjang
                                    </h2>
                                    <button onClick={() => setSales({})} className="text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-2 flex items-center gap-1.5 rounded-xl border border-red-500/20">
                                        <span className="material-symbols-outlined text-base">delete_sweep</span>
                                    </button>
                                </div>
                                
                                {currentBillId && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border-b border-primary/20 shrink-0">
                                        <span className="material-symbols-outlined text-primary text-xs">room_service</span>
                                        <span className="text-[10px] font-black text-primary uppercase flex-1 truncate">{customerInfo}</span>
                                        <button onClick={() => { setCurrentBillId(null); setCustomerInfo(''); setSales({}); }} className="text-primary/60 hover:text-primary">
                                            <span className="material-symbols-outlined text-xs">close</span>
                                        </button>
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                                    {activeCartItems.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                                            <span className="material-symbols-outlined text-4xl mb-2">remove_shopping_cart</span>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Kosong</p>
                                        </div>
                                    ) : activeCartItems.map((item) => (
                                        <CartItem 
                                            key={item.id} 
                                            item={item} 
                                            salesCount={sales[item.id]} 
                                            updateQty={updateQty} 
                                            note={itemNotes[item.id]}
                                            onNoteChange={onNoteChange}
                                        />
                                    ))}
                                </div>

                                <div className="shrink-0 p-0 border-t border-[var(--border-dim)] bg-black/20 block pb-24 lg:pb-0">
                                    <POSFooter 
                                        {...{
                                            paymentMethod, setPaymentMethod, totalSalesValue, finalTotal,
                                            discountAmount, pointsDiscountAmount, pointsToRedeem, amountPaid, setAmountPaid,
                                            changeDue, isCheckingOut, totalItems, handleCheckout,
                                            handleUpdateBill: onUpdateBillHandle, handleSaveBill: onSaveBill,
                                            currentBillId, setMobileTab
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mobile Navigation Bar */}
                        <div className="lg:hidden fixed bottom-5 left-5 right-5 z-50 flex items-center justify-between gap-3 bg-[var(--bg-app)]/80 backdrop-blur-xl border border-white/10 p-2 rounded-[2.5rem] shadow-2xl">
                            <button 
                                onClick={() => setMobileTab('menu')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full transition-all active:scale-95 ${mobileTab === 'menu' ? 'bg-primary text-slate-900 shadow-xl shadow-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5'}`}
                            >
                                <span className="material-symbols-outlined text-xl">restaurant_menu</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">{mobileTab === 'menu' ? 'Menu' : ''}</span>
                            </button>
                            <button 
                                onClick={() => setMobileTab('cart')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full transition-all active:scale-95 relative ${mobileTab === 'cart' ? 'bg-primary text-slate-900 shadow-xl shadow-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5'}`}
                            >
                                <span className="material-symbols-outlined text-xl">shopping_cart</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">{mobileTab === 'cart' ? 'Cart' : ''}</span>
                                {totalItems > 0 && mobileTab !== 'cart' && (
                                    <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[var(--bg-app)] shadow-lg">{totalItems}</span>
                                )}
                            </button>
                            <button 
                                onClick={() => setMobileTab('bills')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full transition-all active:scale-95 ${mobileTab === 'bills' ? 'bg-primary text-slate-900 shadow-xl shadow-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5'}`}
                            >
                                <span className="material-symbols-outlined text-xl">receipt_long</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">{mobileTab === 'bills' ? 'Bills' : ''}</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <React.Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>}>
                        {view === 'history' && <TransactionHistory onBack={() => navigateTo('pos')} />}
                        {view === 'printer-settings' && <PrinterSettings isOpen={true} onClose={() => navigateTo('pos')} isFullPage={true} />}
                        {view === 'print-queue' && <PrintQueueManager onBack={() => navigateTo('pos')} />}
                        {view === 'sync-queue' && <SyncQueuePage onBack={() => navigateTo('pos')} />}
                    </React.Suspense>
                )}
            </div>

            <MergeModal 
                isOpen={isMergeModalOpen}
                onClose={() => setIsMergeModalOpen(false)}
                targetBill={targetBillForMerge}
                openBills={openBills}
                selectedSourceIds={selectedSourceIds}
                toggleSourceSelection={(id) => setSelectedSourceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                performMerge={async () => {
                    const res = await performMerge(targetBillForMerge.id, selectedSourceIds);
                    if (res?.success) setIsMergeModalOpen(false);
                }}
                isCheckingOut={isCheckingOut}
            />

            <SplitModal 
                isOpen={isSplitModalOpen}
                onClose={() => setIsSplitModalOpen(false)}
                splitSourceBill={splitSourceBill}
                splitMode={splitMode}
                splitTargetInfo={splitTargetInfo}
                setSplitTargetInfo={setSplitTargetInfo}
                selectedSplitItems={selectedSplitItems}
                setSelectedSplitItems={setSelectedSplitItems}
                performSplit={async () => {
                    const payload = {
                        sourceTransactionId: splitSourceBill.id,
                        targetCustomerInfo: splitTargetInfo,
                        splitItems: Object.entries(selectedSplitItems).filter(([_, q]) => q > 0).map(([id, q]) => ({ recipeId: parseInt(id), quantity: q }))
                    };
                    const res = await performSplit(payload);
                    if (res?.success) setIsSplitModalOpen(false);
                }}
                isCheckingOut={isCheckingOut}
            />

            <OpenShiftModal 
                isOpen={!activeShift && view === 'pos'} 
                onOpen={async (initialCash) => {
                    const res = await apiClient.post('/cashier-shifts/open', { initialCash });
                    if (res?.data) setActiveShift(res.data);
                }} 
            />

            <CloseShiftModal 
                isOpen={isCloseShiftOpen}
                shift={activeShift}
                summary={shiftSummaryData}
                onClose={async (data) => {
                    await apiClient.post(`/cashier-shifts/close/${activeShift.id}`, data);
                    setIsCloseShiftOpen(false);
                    setActiveShift(null);
                    window.location.reload();
                }}
                onCancel={() => setIsCloseShiftOpen(false)}
            />

            <HandoverShiftModal 
                isOpen={isHandoverShiftOpen}
                shift={activeShift}
                onHandover={async (data) => {
                    await apiClient.post('/cashier-shifts/handover', data);
                    setIsHandoverShiftOpen(false);
                    setActiveShift(null);
                    window.location.reload();
                }}
                onCancel={() => setIsHandoverShiftOpen(false)}
            />
        </Layout>
    );
}
