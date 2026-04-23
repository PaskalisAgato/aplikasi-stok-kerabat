import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@shared/apiClient';
import { db } from '@shared/services/db';
import { syncEngine } from '@shared/services/SyncEngine';
import { useNotification } from '@shared/components/NotificationProvider';

export function useBillManagement() {
    const [openBills, setOpenBills] = useState<any[]>([]);
    const [currentBillId, setCurrentBillId] = useState<string | number | null>(null);
    const [customerInfo, setCustomerInfo] = useState('');
    const { showNotification } = useNotification();

    const fetchOpenBills = useCallback(async () => {
        try {
            const response = await apiClient.get('/transactions/open-bills') as any;
            if (response && response.data) setOpenBills(response.data);
        } catch (error) {
            console.error('Failed to fetch open bills');
        }
    }, []);

    useEffect(() => {
        fetchOpenBills();
    }, [fetchOpenBills]);

    const handleSaveBill = async (activeCartItems: any[], totalSalesValue: number, itemNotes: Record<number, string>) => {
        let info: string | null = customerInfo;
        if (!info) {
            const table = prompt('Masukkan Nomor Meja / Nama Pelanggan:');
            if (table === null || table === '') return;
            info = table;
        }

        if (openBills.some(b => b.customerInfo?.toLowerCase() === info?.toLowerCase())) {
            showNotification(`Tagihan untuk "${info}" sudah ada di Daftar Bill Aktif.`, "warning");
            return;
        }

        setCustomerInfo(info);
        try {
            const checkoutData = {
                id: crypto.randomUUID(),
                items: activeCartItems.map(item => ({
                    recipeId: item.id,
                    quantity: item.qty,
                    price: item.price,
                    subtotal: (item.price || 0) * (item.qty || 0),
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
            fetchOpenBills();
            return { success: true };
        } catch (error) {
            showNotification('Gagal menyimpan bill', "error");
            return { success: false };
        }
    };

    const handleDeleteBill = async (bill: any) => {
        if (!confirm(`Hapus/Batalkan Bill untuk "${bill.customerInfo}"? Stok yang sudah dipotong tidak akan otomatis kembali.`)) return;
        
        const adminPin = prompt('OTORISASI DIPERLUKAN: Masukkan PIN Admin/Supervisor untuk menghapus bill:');
        if (!adminPin) {
            showNotification('Penghapusan dibatalkan. PIN Admin wajib diisi.', 'warning');
            return { resetCart: false };
        }

        try {
            await db.offlineActions.add({
                id: `del-${bill.id}-${Date.now()}`,
                idempotency_key: `req_del_${bill.id}_${Date.now()}`,
                type: 'DELETE_TRANSACTION',
                payload: { id: bill.id, adminPin },
                created_at: new Date().toISOString(),
                sync_status: 'PENDING',
                retry_count: 0
            });

            syncEngine.forceSync().catch(console.error);
            showNotification('Penghapusan telah masuk antrean.', "info");

            setOpenBills(prev => prev.filter(b => b.id !== bill.id));
            if (currentBillId === bill.id) {
                setCurrentBillId(null);
                setCustomerInfo('');
                return { resetCart: true };
            }
        } catch (error: any) {
            showNotification(`Gagal menghapus: ${error.message}`, "error");
        }
        return { resetCart: false };
    };

    const handleUpdateBill = async (activeCartItems: any[], itemNotes: Record<number, string>) => {
        if (!currentBillId) return;
        try {
            const items = activeCartItems.map(item => ({
                recipeId: item.id,
                quantity: item.qty,
                price: item.price,
                notes: itemNotes[item.id]
            }));

            await syncEngine.enqueue('ADD_ITEMS_TO_BILL', { id: currentBillId, items });
            showNotification('Permintaan update bill disimpan ke antrean!', "success");
            fetchOpenBills();
            return { clearCart: true };
        } catch (error) {
            showNotification('Gagal memperbarui bill', "error");
        }
        return { clearCart: false };
    };

    const performMerge = async (targetBillId: string | number, selectedSourceIds: number[]) => {
        try {
            // Simplified for brevity, same logic as in App.tsx
            await syncEngine.enqueue('MERGE_BILLS', { 
                targetId: targetBillId, 
                sourceIds: selectedSourceIds 
            });
            showNotification('Permintaan gabung bill disimpan ke antrean!', "info");
            fetchOpenBills();
            return { success: true };
        } catch (error) {
            showNotification('Gagal menggabungkan bill', "error");
            return { success: false };
        }
    };

    const performSplit = async (payload: any) => {
        try {
            if (navigator.onLine) {
                const result = await apiClient.splitBill(payload);
                if (result.success) {
                    fetchOpenBills();
                    return { success: true, result };
                }
            }
            await syncEngine.enqueue('SPLIT_BILL', payload);
            showNotification('Permintaan pisah bill disimpan ke antrean.', "info");
            return { success: true, queued: true };
        } catch (error: any) {
            showNotification(`Gagal memisah bill: ${error.message}`, "error");
            return { success: false };
        }
    };

    return {
        openBills,
        setOpenBills,
        currentBillId,
        setCurrentBillId,
        customerInfo,
        setCustomerInfo,
        fetchOpenBills,
        handleSaveBill,
        handleUpdateBill,
        handleDeleteBill,
        performMerge,
        performSplit
    };
}
