import { useState } from 'react';
import { db } from '@shared/services/db';
import { syncEngine } from '@shared/services/SyncEngine';
import { PrintService, PrintData } from '@shared/services/PrintService';
import { useNotification } from '@shared/components/NotificationProvider';

export function useCheckout() {
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const { showNotification } = useNotification();

    const handleCheckout = async (params: {
        totalSalesValue: number;
        finalTotal: number;
        paymentMethod: 'CASH' | 'QRIS' | 'CARD';
        amountPaid: number;
        activeCartItems: any[];
        sales: Record<number, number>;
        customerInfo: string;
        currentBillId: string | number | null;
        selectedMember: any;
        selectedDiscounts: any[];
        pointsToRedeem: number;
        itemNotes: Record<number, string>;
        activeShift: any;
        selectedShiftForAdmin?: any;
        isEmployee?: boolean;
        attendance?: any;
        orderSource: string;
        voucherCode?: string;
    }) => {
        const {
            totalSalesValue, finalTotal, paymentMethod, amountPaid,
            activeCartItems, sales, customerInfo, currentBillId,
            selectedMember, selectedDiscounts, pointsToRedeem,
            itemNotes, activeShift, selectedShiftForAdmin, isEmployee, attendance, orderSource,
            voucherCode
        } = params;

        if (totalSalesValue === 0) return;

        // Security Check: Employee must have checked in
        if (isEmployee && !attendance?.checkIn) {
            showNotification('Gagal! Anda wajib melakukan absensi masuk (Check-In) terlebih dahulu.', 'error');
            return;
        }

        // Shift Selection: Admin must have a shift or have selected an active one
        const effectiveShiftId = activeShift?.id || selectedShiftForAdmin?.id;
        if (!effectiveShiftId) {
            showNotification('Gagal! Transaksi membutuhkan shift aktif. Silahkan buka shift atau pilih kasir berjalan.', 'error');
            return;
        }

        setIsCheckingOut(true);
        try {
            const transactionId = crypto.randomUUID();
            const pointsEarned = selectedMember ? Math.floor(finalTotal / 10000) : 0;
            const newPointBalance = selectedMember ? (selectedMember.points - pointsToRedeem + pointsEarned) : undefined;

            const checkoutData = {
                id: transactionId, 
                shiftId: effectiveShiftId, // Ensure it's linked
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
                memberId: selectedMember?.id || null,
                discountId: selectedDiscounts?.length === 1 ? selectedDiscounts[0].id : null,
                discountIds: selectedDiscounts?.length > 0 ? selectedDiscounts.map(d => d.id) : null,
                discountTotal: (totalSalesValue - finalTotal),
                pointsUsed: pointsToRedeem,
                pointsEarned,
                sourceId: currentBillId,
                orderSource,
                voucherCode: voucherCode || null,
                voucherRuleCode: selectedDiscounts?.find(d => typeof d.id === 'string')?.name || null,
                createdAt: new Date().toISOString(),
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
                tableNumber: customerInfo,
                customerName: selectedMember?.name,
                memberPoints: newPointBalance,
                pointsUsed: pointsToRedeem,
                pointsEarned: pointsEarned
            };

            PrintService.printTransaction(printData, { skipChecker: !!currentBillId });
            const syncResult = await syncEngine.enqueue('CHECKOUT', { ...checkoutData, status: 'PAID', customerInfo });

            await db.auditLog.add({
                action: 'CHECKOUT',
                entity: 'Transaction',
                entityId: transactionId,
                timestamp: new Date().toISOString(),
                userId: activeShift?.userName || 'Kasir',
                deviceId: 'POS-01'
            });

            syncEngine.forceSync().catch(console.error);
            showNotification(`Transaksi Berhasil! Kembalian: Rp ${(paymentMethod === 'CASH' ? Math.max(0, amountPaid - finalTotal) : 0).toLocaleString('id-ID')}`, "success");
            
            // Fetch voucher directly from API (independent of SyncEngine response)
            console.log('[Voucher Debug] syncResult =', JSON.stringify(syncResult));
            let generatedVoucher = (syncResult as any)?.voucher || null;
            console.log('[Voucher Debug] voucher from syncResult =', generatedVoucher);
            if (!generatedVoucher) {
                try {
                    const { apiClient } = await import('@shared/apiClient');
                    // Wait briefly for backend to finish generating the voucher
                    await new Promise(r => setTimeout(r, 1000));
                    const transactionNumericId = (syncResult as any)?.data?.transactionId;
                    console.log('[Voucher Debug] transactionNumericId =', transactionNumericId);
                    if (transactionNumericId) {
                        const vRes = await apiClient.get(`/vouchers/by-transaction/${transactionNumericId}`) as any;
                        console.log('[Voucher Debug] vRes =', JSON.stringify(vRes));
                        if (vRes?.voucher) {
                            generatedVoucher = vRes.voucher;
                        }
                    }
                } catch (vFetchErr) {
                    console.warn('[Voucher Fetch] Failed to fetch voucher post-checkout:', vFetchErr);
                }
            }
            
            console.log('[Voucher Debug] Final generatedVoucher =', generatedVoucher);
            return { success: true, ...syncResult, voucher: generatedVoucher };
        } catch (error) {
            console.error('Checkout failed', error);
            showNotification('Gagal menyimpan transaksi.', "error");
            return { success: false };
        } finally {
            setIsCheckingOut(false);
        }
    };

    return {
        isCheckingOut,
        handleCheckout
    };
}
