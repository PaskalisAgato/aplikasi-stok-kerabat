import { useEffect, useState } from 'react';
import { useOutletStore } from '../../../store/useOutletStore';

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
    timestamp: string;
}

export const useKdsEvents = () => {
    const [orders, setOrders] = useState<KdsOrder[]>([]);
    const currentOutlet = useOutletStore(state => state.currentOutlet);

    useEffect(() => {
        if (!currentOutlet) return;

        const url = `${import.meta.env.VITE_API_BASE_URL}/kds/events?outletId=${currentOutlet.id}`;
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            const payload = JSON.parse(event.data);
            
            if (payload.type === 'NEW_ORDER') {
                setOrders(prev => [payload.data, ...prev]);
                
                // Optional: Play sound or show notification
                new Audio('/assets/sounds/order-notification.mp3').play().catch(() => {});
            } else if (payload.type === 'ORDER_UPDATE') {
                // Handle updates like Cancellations
                setOrders(prev => prev.filter(o => o.id !== payload.data.id));
            }
        };

        eventSource.onerror = (err) => {
            console.error('[KDS] SSE Error:', err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [currentOutlet]);

    const markAsDone = (orderId: number) => {
        setOrders(prev => prev.filter(o => o.id !== orderId));
    };

    return { orders, markAsDone };
};
