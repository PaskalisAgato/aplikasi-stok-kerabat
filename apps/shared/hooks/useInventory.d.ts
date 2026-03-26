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
import { type CreateInventoryItemPayload, type UpdateInventoryItemPayload, type RecordMovementPayload } from '../services/inventoryService';
export declare const inventoryKeys: {
    all: readonly ["inventory"];
    list: () => readonly ["inventory", "list"];
    movements: (id: number) => readonly ["inventory", "movements", number];
    stockInHistory: () => readonly ["inventory", "stock-in-history"];
    wasteSummary: () => readonly ["inventory", "waste-summary"];
    itemWaste: (id: number) => readonly ["inventory", "waste", number];
};
/** Fetch all inventory items with computed status */
export declare const useInventory: () => import("@tanstack/react-query").UseQueryResult<import("../apiClient").ApiResponse<import("../services/inventoryService").InventoryItem>, Error>;
/** Fetch last 20 stock movements for a specific item */
export declare const useItemMovements: (id: number) => import("@tanstack/react-query").UseQueryResult<import("../services/inventoryService").StockMovement[], Error>;
/** Fetch general restock history */
export declare const useStockInHistory: () => import("@tanstack/react-query").UseQueryResult<import("../services/inventoryService").StockInHistoryItem[], Error>;
/** Fetch 30-day waste summary */
export declare const useWasteSummary: () => import("@tanstack/react-query").UseQueryResult<import("../services/inventoryService").WasteSummary, Error>;
/** Fetch waste logs for a specific inventory item */
export declare const useItemWaste: (id: number) => import("@tanstack/react-query").UseQueryResult<import("../services/inventoryService").StockMovement[], Error>;
/** Create a new inventory item, then refetch the list */
export declare const useCreateInventoryItem: () => import("@tanstack/react-query").UseMutationResult<import("../services/inventoryService").InventoryItem, Error, CreateInventoryItemPayload, unknown>;
/** Update an inventory item's master data */
export declare const useUpdateInventoryItem: () => import("@tanstack/react-query").UseMutationResult<import("../services/inventoryService").InventoryItem, Error, {
    id: number;
    data: UpdateInventoryItemPayload;
}, unknown>;
/**
 * Record a stock movement (IN / OUT / WASTE / OPNAME_ADJUSTMENT).
 * Invalidates the inventory list and movements for the affected item.
 */
export declare const useRecordStockMovement: () => import("@tanstack/react-query").UseMutationResult<{
    success: boolean;
    message: string;
}, Error, {
    id: number;
    data: RecordMovementPayload;
}, unknown>;
