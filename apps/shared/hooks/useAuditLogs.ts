import { useQuery } from '@tanstack/react-query';
import { auditService } from '../services/auditService';

export const auditKeys = {
    all: ['audit'] as const,
    list: () => [...auditKeys.all, 'list'] as const,
};

export const useAuditLogs = () =>
    useQuery({
        queryKey: auditKeys.list(),
        queryFn: auditService.fetchAll,
        refetchInterval: 30000, // Refresh every 30 seconds
    });
