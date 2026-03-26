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
export declare function ModernTable<T extends {
    id: any;
}>({ columns, data, isLoading, emptyMessage }: ModernTableProps<T>): import("react/jsx-runtime").JSX.Element;
export {};
