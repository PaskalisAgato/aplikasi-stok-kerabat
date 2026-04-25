import React from 'react';

interface POSFooterProps {
    paymentMethod: 'CASH' | 'QRIS' | 'CARD';
    setPaymentMethod: (method: 'CASH' | 'QRIS' | 'CARD') => void;
    totalSalesValue: number;
    finalTotal: number;
    discountAmount: number;
    pointsDiscountAmount: number;
    pointsToRedeem: number;
    amountPaid: number;
    setAmountPaid: (amount: number) => void;
    changeDue: number;
    isCheckingOut: boolean;
    totalItems: number;
    handleCheckout: (skipConfirm?: boolean) => void;
    handleUpdateBill: () => void;
    handleSaveBill: () => void;
    currentBillId: string | number | null;
    setMobileTab: (tab: 'menu' | 'cart' | 'bills') => void;
    orderSource: 'DIRECT' | 'GRABFOOD' | 'GOFOOD' | 'SHOPEEFOOD';
    setOrderSource: (source: 'DIRECT' | 'GRABFOOD' | 'GOFOOD' | 'SHOPEEFOOD') => void;
}

export const POSFooter: React.FC<POSFooterProps> = ({
    paymentMethod, setPaymentMethod,
    totalSalesValue, finalTotal,
    discountAmount, pointsDiscountAmount, pointsToRedeem,
    amountPaid, setAmountPaid,
    changeDue, isCheckingOut, totalItems,
    handleCheckout, handleUpdateBill, handleSaveBill,
    currentBillId, setMobileTab, orderSource, setOrderSource
}) => {
    return (
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

            {/* Order Source Selector */}
            <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 px-1">Sumber Order</p>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { id: 'DIRECT', label: 'Langsung', icon: 'person' },
                        { id: 'GRABFOOD', label: 'Grab', icon: 'delivery_dining' },
                        { id: 'GOFOOD', label: 'Gojek', icon: 'delivery_dining' },
                        { id: 'SHOPEEFOOD', label: 'Shopee', icon: 'delivery_dining' }
                    ].map((source) => (
                        <button
                            key={source.id}
                            onClick={() => setOrderSource(source.id as any)}
                            className={`flex flex-col items-center justify-center py-2 rounded-md border transition-all active:scale-95 ${
                                orderSource === source.id 
                                    ? 'bg-primary/20 border-primary text-primary shadow-sm' 
                                    : 'bg-[var(--bg-app)] border-[var(--border-dim)] text-[var(--text-muted)] hover:bg-white/5'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm font-black mb-1">{source.icon}</span>
                            <span className="text-[9px] font-bold uppercase tracking-tighter">{source.label}</span>
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
                        if (window.innerWidth < 1024) {
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
};
