/**
 * apps/shared/hooks/useInventory.ts
 *
 * TanStack Query hooks for all inventory data and mutations.
 * Import these in any app module instead of calling apiClient directly.
 *
 * Usage:
 *   const { data, isLoading, error } = useInventory();
 *   const mutation = useCreateInventoryItem();
 *   mutation.mutate({ name: 'Gula Pasir', ... });
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    inventoryService,
    type CreateInventoryItemPayload,
    type UpdateInventoryItemPayload,
    type RecordMovementPayload,
} from '../services/inventoryService';

// ── Query keys — centralized to keep cache invalidation consistent ─────────────
export const inventoryKeys = {
    all: ['inventory'] as const,
    list: () => [...inventoryKeys.all, 'list'] as const,
    movements: (id: number) => [...inventoryKeys.all, 'movements', id] as const,
    stockInHistory: () => [...inventoryKeys.all, 'stock-in-history'] as const,
    wasteSummary: () => [...inventoryKeys.all, 'waste-summary'] as const,
    itemWaste: (id: number) => [...inventoryKeys.all, 'waste', id] as const,
};

// ── Query hooks ────────────────────────────────────────────────────────────────

/** Fetch all inventory items with computed status */
export const useInventory = () =>
    useQuery({
        queryKey: inventoryKeys.list(),
        queryFn: () => inventoryService.fetchAll(),
        staleTime: 1000 * 30, // 30 seconds
    });

/** Fetch last 20 stock movements for a specific item */
export const useItemMovements = (id: number) =>
    useQuery({
        queryKey: inventoryKeys.movements(id),
        queryFn: () => inventoryService.fetchMovements(id),
        enabled: !!id,
    });

/** Fetch general restock history */
export const useStockInHistory = () =>
    useQuery({
        queryKey: inventoryKeys.stockInHistory(),
        queryFn: inventoryService.fetchStockInHistory,
    });

/** Fetch 30-day waste summary */
export const useWasteSummary = () =>
    useQuery({
        queryKey: inventoryKeys.wasteSummary(),
        queryFn: inventoryService.fetchWasteSummary,
    });

/** Fetch waste logs for a specific inventory item */
export const useItemWaste = (id: number) =>
    useQuery({
        queryKey: inventoryKeys.itemWaste(id),
        queryFn: () => inventoryService.fetchItemWaste(id),
        enabled: !!id,
    });

// ── Mutation hooks ─────────────────────────────────────────────────────────────

/** Create a new inventory item, then refetch the list */
export const useCreateInventoryItem = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateInventoryItemPayload) => inventoryService.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.list() }),
    });
};

/** Update an inventory item's master data */
export const useUpdateInventoryItem = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateInventoryItemPayload }) =>
            inventoryService.update(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.list() }),
    });
};

/**
 * Record a stock movement (IN / OUT / WASTE / OPNAME_ADJUSTMENT).
 * Invalidates the inventory list and movements for the affected item.
 */
export const useRecordStockMovement = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: RecordMovementPayload }) =>
            inventoryService.recordMovement(id, data),
        onSuccess: (_result, { id }) => {
            qc.invalidateQueries({ queryKey: inventoryKeys.list() });
            qc.invalidateQueries({ queryKey: inventoryKeys.movements(id) });
            qc.invalidateQueries({ queryKey: inventoryKeys.wasteSummary() });
        },
    });
};
