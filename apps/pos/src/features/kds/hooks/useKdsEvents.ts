import { useEffect, useState, useCallback } from 'react';
import { useOutletStore } from '../../../store/useOutletStore';
import { apiClient, API_BASE_URL } from '@shared/apiClient';

export interface KdsOrder {
    id: number;
    customerInfo: string;
    type?: 'ADDITION';
    items: {
        recipeId: number;
        name: string;
        quantity: number;
        notes?: string;
    }[];
    status?: string;
    kdsStatus?: string;
    timestamp: string;
}

export const useKdsEvents = () => {
    const [orders, setOrders] = useState<KdsOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const currentOutlet = useOutletStore(state => state.currentOutlet);

    // Initial fetch of active orders
    const fetchActiveOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const outletId = currentOutlet?.id || 1;
            const res = await apiClient.getKdsOrders(outletId);
            if (res && res.success && Array.isArray(res.data)) {
                setOrders(res.data);
            }
        } catch (err: any) {
            console.error('[KDS] Failed to fetch initial orders:', err);
            setError('Gagal memuat pesanan aktif dapur.');
        } finally {
            setLoading(false);
        }
    }, [currentOutlet?.id]);

    useEffect(() => {
        fetchActiveOrders();
    }, [fetchActiveOrders]);

    // SSE Connection setup
    useEffect(() => {
        const outletId = currentOutlet?.id || 1;
        const sseUrl = `${API_BASE_URL}/kds/events?outletId=${outletId}`;

        console.log('[KDS] Connecting SSE stream to:', sseUrl);
        const eventSource = new EventSource(sseUrl);

        eventSource.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                
                if (payload.type === 'NEW_ORDER') {
                    setOrders(prev => {
                        const exists = prev.some(o => o.id === payload.data.id);
                        if (exists) return prev;
                        return [payload.data, ...prev];
                    });
                    
                    // Audio notification
                    new Audio('/assets/sounds/order-notification.mp3').play().catch(() => {});
                } else if (payload.type === 'ORDER_UPDATE') {
                    if (payload.data.kdsStatus === 'DONE' || payload.data.status === 'DONE') {
                        setOrders(prev => prev.filter(o => o.id !== payload.data.id));
                    }
                }
            } catch (parseError) {
                console.error('[KDS] Error parsing SSE event:', parseError);
            }
        };

        eventSource.onerror = (err) => {
            console.error('[KDS] SSE Stream connection error:', err);
            // Browser EventSource automatically retries
        };

        return () => {
            console.log('[KDS] Closing SSE stream connection');
            eventSource.close();
        };
    }, [currentOutlet?.id]);

    const markAsDone = useCallback(async (orderId: number) => {
        // Optimistic UI removal
        setOrders(prev => prev.filter(o => o.id !== orderId));

        try {
            const outletId = currentOutlet?.id || 1;
            await apiClient.markKdsOrderDone(orderId, outletId);
        } catch (err) {
            console.error('[KDS] Failed to mark order done on server:', err);
        }
    }, [currentOutlet?.id]);

    return { orders, loading, error, markAsDone, refresh: fetchActiveOrders };
};
