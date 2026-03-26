/**
 * apps/shared/hooks/useSales.ts
 *
 * TanStack Query mutation hook for POS checkout.
 *
 * Usage:
 *   const checkout = useCheckoutCart();
 *   await checkout.mutateAsync({ items: [...], totalAmount: 55000, ... });
 */
import { type CheckoutPayload } from '../services/salesService';
export declare const useCheckoutCart: () => import("@tanstack/react-query").UseMutationResult<import("../services/salesService").CheckoutResult, Error, CheckoutPayload, unknown>;
