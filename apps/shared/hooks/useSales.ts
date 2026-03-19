/**
 * apps/shared/hooks/useSales.ts
 *
 * TanStack Query mutation hook for POS checkout.
 *
 * Usage:
 *   const checkout = useCheckoutCart();
 *   await checkout.mutateAsync({ items: [...], totalAmount: 55000, ... });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService, type CheckoutPayload } from '../services/salesService';
import { inventoryKeys } from './useInventory';
import { financeKeys } from './useFinance';

export const useCheckoutCart = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (data: CheckoutPayload) => salesService.checkout(data),
        onSuccess: () => {
            // After a sale, inventory stock levels and finance figures are stale
            qc.invalidateQueries({ queryKey: inventoryKeys.list() });
            qc.invalidateQueries({ queryKey: financeKeys.reports() });
        },
    });
};
