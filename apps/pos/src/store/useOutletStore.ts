import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Outlet {
    id: number;
    name: string;
    address: string | null;
    timezone: string;
}

interface OutletState {
    currentOutlet: Outlet | null;
    availableOutlets: Outlet[];
    setOutlet: (outlet: Outlet) => void;
    setAvailableOutlets: (outlets: Outlet[]) => void;
    clearOutlet: () => void;
}

export const useOutletStore = create<OutletState>()(
    persist(
        (set) => ({
            currentOutlet: null,
            availableOutlets: [],
            setOutlet: (outlet) => set({ currentOutlet: outlet }),
            setAvailableOutlets: (outlets) => set({ availableOutlets: outlets }),
            clearOutlet: () => set({ currentOutlet: null }),
        }),
        {
            name: 'kerabat-outlet-storage',
        }
    )
);
