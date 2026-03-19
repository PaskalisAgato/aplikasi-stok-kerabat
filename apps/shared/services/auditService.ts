import { apiFetch } from '../apiClient';

export interface AuditLog {
    id: number;
    userId: string;
    userName: string;
    action: string;
    tableName: string;
    oldData: string | null;
    newData: string | null;
    createdAt: string;
}

export const auditService = {
    fetchAll: () => apiFetch<AuditLog[]>('/audit')
};
