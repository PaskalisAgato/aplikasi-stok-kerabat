import { create } from 'zustand';
import { DiscountRule } from '@shared/lib/promo-engine';

interface PromoState {
    activeRules: DiscountRule[];
    configVersion: number;
    lastSynced: number | null;
    isSyncing: boolean;
    
    // Actions
    setRules: (rules: DiscountRule[], version: number) => void;
    updateRule: (rule: DiscountRule) => void;
    invalidateCache: () => void;
    setSyncing: (status: boolean) => void;
}

export const usePromoStore = create<PromoState>((set) => ({
    activeRules: [],
    configVersion: 0,
    lastSynced: null,
    isSyncing: false,

    setRules: (rules, version) => set({ 
        activeRules: rules, 
        configVersion: version,
        lastSynced: Date.now(),
        isSyncing: false
    }),

    updateRule: (updatedRule) => set((state) => {
        const exists = state.activeRules.find(r => r.code === updatedRule.code);
        if (exists) {
            return {
                activeRules: state.activeRules.map(r => r.code === updatedRule.code ? updatedRule : r)
            };
        }
        return {
            activeRules: [...state.activeRules, updatedRule]
        };
    }),

    invalidateCache: () => set({ 
        activeRules: [], 
        configVersion: 0,
        lastSynced: null
    }),

    setSyncing: (status) => set({ isSyncing: status })
}));
