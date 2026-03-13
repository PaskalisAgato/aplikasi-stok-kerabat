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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Retry once on failure; most network errors will resolve on retry
            retry: 1,
            // Consider data stale after 30 seconds
            staleTime: 1000 * 30,
            // Refetch on window focus to keep data fresh
            refetchOnWindowFocus: true,
        },
        mutations: {
            // Do not retry failed mutations (could cause duplicate writes)
            retry: false,
        },
    },
});

interface QueryProviderProps {
    children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* DevTools only renders in development */}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
};

export default QueryProvider;

// Export the queryClient so it can be used outside of React tree if needed
export { queryClient };
