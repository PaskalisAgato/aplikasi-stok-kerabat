import { useEffect, useCallback } from 'react';
import { usePromoStore } from '../store/promo-store';
import { PromoEngine, PromoValidationResult } from '@shared/lib/promo-engine';
import { apiClient } from '@shared/apiClient';

export function usePromo() {
    const { activeRules, configVersion, lastSynced, setRules, setSyncing, isSyncing } = usePromoStore();

    // Fetch the latest rules from backend
    const syncRules = useCallback(async (force = false) => {
        // Simple cache invalidation (e.g. 5 minutes or forced)
        if (!force && lastSynced && (Date.now() - lastSynced < 300000)) return;
        
        try {
            setSyncing(true);
            const res: any = await apiClient.get('/discounts/rules/active');
            if (res?.data) {
                // If backend returns a version, we capture it. Otherwise fallback to calculating one.
                const newVersion = res.version || Math.max(...res.data.map((r: any) => r.configVersion || 0), 1);
                setRules(res.data, newVersion);
            }
        } catch (error) {
            console.error('Failed to sync promo rules', error);
        } finally {
            setSyncing(false);
        }
    }, [lastSynced, setRules, setSyncing]);

    // Setup Event-Driven Sync via polling or listening to SyncEngine.
    // Here we poll every 30 seconds for simplicity, but could be WebSocket if available.
    useEffect(() => {
        syncRules();
        const interval = setInterval(() => syncRules(true), 30000);
        return () => clearInterval(interval);
    }, [syncRules]);

    /**
     * Validate and apply a barcode using deterministic engine rules
     */
    const validateBarcode = (code: string, subtotal: number): PromoValidationResult => {
        const normalizedCode = code.toUpperCase().trim();
        const rule = activeRules.find(r => r.code.toUpperCase() === normalizedCode);
        
        if (!rule) {
            return { valid: false, reason: "Kode promo tidak ditemukan atau tidak aktif", discountAmount: 0 };
        }

        return PromoEngine.evaluate(subtotal, rule);
    };

    return {
        activeRules,
        configVersion,
        isSyncing,
        syncRules,
        validateBarcode
    };
}
