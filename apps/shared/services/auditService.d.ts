export interface AuditLog {
    id: number;
    userId: string;
    userName: string;
    action: string;
    tableName: string;
    oldData: string | null;
    newData: string | null;
    createdAt: string;
    role: string | null;
}
export declare const auditService: {
    fetchAll: () => Promise<AuditLog[]>;
};
