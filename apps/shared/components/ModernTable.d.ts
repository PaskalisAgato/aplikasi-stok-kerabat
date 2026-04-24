import React from 'react';
interface Column<T> {
    header: string;
    key?: keyof T;
    render?: (item: T) => React.ReactNode;
    className?: string;
}
interface ModernTableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    emptyMessage?: string;
}
export declare const ModernTable: <T extends {
    id: any;
}>(props: ModernTableProps<T>) => React.ReactElement;
export {};
