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
        selectedDiscount: any;
        pointsToRedeem: number;
        itemNotes: Record<number, string>;
        activeShift: any;
    }) => {
        const {
            totalSalesValue, finalTotal, paymentMethod, amountPaid,
            activeCartItems, sales, customerInfo, currentBillId,
            selectedMember, selectedDiscount, pointsToRedeem,
            itemNotes, activeShift
        } = params;

        if (totalSalesValue === 0) return;

        setIsCheckingOut(true);
        try {
            const transactionId = crypto.randomUUID();
            const pointsEarned = selectedMember ? Math.floor(finalTotal / 10000) : 0;
            const newPointBalance = selectedMember ? (selectedMember.points - pointsToRedeem + pointsEarned) : undefined;

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
                memberId: selectedMember?.id || null,
                discountId: selectedDiscount?.id || null,
                discountTotal: (totalSalesValue - finalTotal),
                pointsUsed: pointsToRedeem,
                pointsEarned,
                sourceId: currentBillId,
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
            await syncEngine.enqueue('CHECKOUT', { ...checkoutData, status: 'PAID', customerInfo });

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
            
            return { success: true };
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
