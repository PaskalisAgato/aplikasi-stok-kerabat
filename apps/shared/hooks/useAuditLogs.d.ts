export declare const auditKeys: {
    all: readonly ["audit"];
    list: () => readonly ["audit", "list"];
};
export declare const useAuditLogs: () => import("@tanstack/react-query").UseQueryResult<import("../services/auditService").AuditLog[], Error>;
