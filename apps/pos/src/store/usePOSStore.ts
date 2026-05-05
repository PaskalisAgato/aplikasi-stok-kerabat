import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OrderSource = 'DIRECT' | 'STAND' | 'GRABFOOD' | 'GOFOOD' | 'SHOPEEFOOD';
export type PaymentMethod = 'CASH' | 'QRIS' | 'CARD';
export type AppView = 'pos' | 'history' | 'printer-settings' | 'print-queue' | 'sync-queue';

interface CartItem {
    recipeId: number;
    quantity: number;
    note?: string;
}

interface POSState {
    // Transaction State
    cart: Record<number, number>; // recipeId -> quantity
    itemNotes: Record<number, string>; // recipeId -> note
    orderSource: OrderSource;
    currentBillId: number | null;
    customerInfo: string;
    
    // Payment State
    paymentMethod: PaymentMethod;
    amountPaid: number;
    
    // Loyalty & Discounts
    selectedMember: any | null;
    selectedDiscounts: any[];
    pointsToRedeem: number;
    
    // UI State
    view: AppView;
    mobileTab: 'menu' | 'cart' | 'bills';
    
    // Actions
    setOrderSource: (source: OrderSource) => void;
    updateQty: (recipeId: number, delta: number) => void;
    setCart: (cart: Record<number, number>) => void;
    setItemNote: (recipeId: number, note: string) => void;
    setCurrentBillId: (id: number | null) => void;
    setCustomerInfo: (info: string) => void;
    setPaymentMethod: (method: PaymentMethod) => void;
    setAmountPaid: (amount: number) => void;
    setSelectedMember: (member: any | null) => void;
    toggleDiscount: (discount: any) => void;
    setPointsToRedeem: (points: number) => void;
    setView: (view: AppView) => void;
    setMobileTab: (tab: 'menu' | 'cart' | 'bills') => void;
    resetCart: () => void;
}

export const usePOSStore = create<POSState>()(
    persist(
        (set) => ({
            cart: {},
            itemNotes: {},
            orderSource: 'DIRECT',
            currentBillId: null,
            customerInfo: '',
            paymentMethod: 'CASH',
            amountPaid: 0,
            selectedMember: null,
            selectedDiscounts: [],
            pointsToRedeem: 0,
            view: 'pos',
            mobileTab: 'menu',

            setOrderSource: (source) => set({ orderSource: source }),
            updateQty: (recipeId, delta) => set((state) => {
                const currentQty = state.cart[recipeId] || 0;
                const newQty = Math.max(0, currentQty + delta);
                const newCart = { ...state.cart };
                if (newQty === 0) delete newCart[recipeId];
                else newCart[recipeId] = newQty;
                return { cart: newCart };
            }),
            setCart: (cart) => set({ cart }),
            setItemNote: (recipeId, note) => set((state) => ({
                itemNotes: { ...state.itemNotes, [recipeId]: note }
            })),
            setCurrentBillId: (id) => set({ currentBillId: id }),
            setCustomerInfo: (info) => set({ customerInfo: info }),
            setPaymentMethod: (method) => set({ paymentMethod: method }),
            setAmountPaid: (amount) => set({ amountPaid: amount }),
            setSelectedMember: (member) => set({ selectedMember: member }),
            toggleDiscount: (discount) => set((state) => {
                const exists = state.selectedDiscounts.find(d => d.id === discount.id);
                if (exists) {
                    return { selectedDiscounts: state.selectedDiscounts.filter(d => d.id !== discount.id) };
                }
                return { selectedDiscounts: [...state.selectedDiscounts, discount] };
            }),
            setPointsToRedeem: (points) => set({ pointsToRedeem: points }),
            setView: (view) => set({ view }),
            setMobileTab: (tab) => set({ mobileTab: tab }),
            resetCart: () => set({ 
                cart: {}, 
                itemNotes: {}, 
                currentBillId: null, 
                customerInfo: '',
                selectedMember: null,
                selectedDiscounts: [],
                pointsToRedeem: 0,
                amountPaid: 0
            }),
        }),
        {
            name: 'kerabat-pos-transaction',
            partialize: (state) => ({ 
                cart: state.cart, 
                itemNotes: state.itemNotes, 
                orderSource: state.orderSource,
                currentBillId: state.currentBillId,
                customerInfo: state.customerInfo,
                selectedMember: state.selectedMember,
                selectedDiscounts: state.selectedDiscounts,
                pointsToRedeem: state.pointsToRedeem
            })
        }
    )
);
