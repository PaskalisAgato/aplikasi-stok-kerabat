/**
 * apps/shared/QueryProvider.tsx
 *
 * Wraps the application in TanStack Query's QueryClientProvider.
 * Import this in each app's main entry point:
 *
 *   import { QueryProvider } from '@shared/QueryProvider';
 *   react-dom.createRoot(...).render(
 *     <QueryProvider>
 *       <App />
 *     </QueryProvider>
 *   );
 *
 * In development, the ReactQueryDevtools panel is included automatically.
 */
import React from 'react';
import { QueryClient } from '@tanstack/react-query';
declare const queryClient: QueryClient;
interface QueryProviderProps {
    children: React.ReactNode;
}
export declare const QueryProvider: React.FC<QueryProviderProps>;
export default QueryProvider;
export { queryClient };
