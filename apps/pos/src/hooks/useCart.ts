import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@shared/services/db';
import { Recipe } from './usePOSData';

export function useCart(items: Recipe[]) {
    const [sales, setSales] = useState<Record<number, number>>({});
    const [itemNotes, setItemNotes] = useState<Record<number, string>>({});

    // Load persisted cart on mount
    useEffect(() => {
        db.cart.get('current_cart').then(savedCart => {
            if (savedCart && savedCart.items.length > 0) {
                const initialSales: Record<number, number> = {};
                savedCart.items.forEach(item => {
                    initialSales[item.id] = item.qty;
                });
                setSales(initialSales);
            }
        });
    }, []);

    // Persist cart on change
    useEffect(() => {
        const cartItems = Object.entries(sales)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => ({ id: parseInt(id), qty }));
        
        db.cart.put({ id: 'current_cart', items: cartItems, updatedAt: new Date().toISOString() });
    }, [sales]);

    const updateQty = useCallback((id: number, delta: number) => {
        setSales(prev => ({
            ...prev,
            [id]: Math.max(0, (prev[id] || 0) + delta)
        }));
    }, []);

    const onNoteChange = useCallback((id: number, note: string) => {
        setItemNotes(prev => ({
            ...prev,
            [id]: note
        }));
    }, []);

    const activeCartItems = useMemo(() => {
        return items.filter((r) => sales[r.id] > 0);
    }, [items, sales]);

    const totalSalesValue = useMemo(() => {
        return Object.entries(sales).reduce((total, [id, qty]) => {
            const recipe = items.find((r) => r.id === parseInt(id));
            return total + (recipe ? recipe.price * qty : 0);
        }, 0);
    }, [items, sales]);

    const totalItems = useMemo(() => {
        return Object.values(sales).reduce((a, b) => a + b, 0);
    }, [sales]);

    const resetCart = useCallback(() => {
        setSales({});
        setItemNotes({});
    }, []);

    return {
        sales,
        setSales,
        itemNotes,
        setItemNotes,
        updateQty,
        onNoteChange,
        activeCartItems,
        totalSalesValue,
        totalItems,
        resetCart
    };
}
