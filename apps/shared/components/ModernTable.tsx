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

export function ModernTable<T extends { id: any }>({ columns, data, isLoading, emptyMessage = 'Tidak ada data ditemukan' }: ModernTableProps<T>) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 animate-pulse">
                <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Memuat Data...</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 glass rounded-[2.5rem] border-dashed border-2 dark:border-white/5 border-slate-200 opacity-50">
                <span className="material-symbols-outlined text-4xl mb-4">folder_open</span>
                <p className="text-sm font-black uppercase tracking-widest">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden glass rounded-[2.5rem] shadow-xl border dark:border-white/5 border-slate-200">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="dark:bg-white/5 bg-white shadow-sm border border-slate-200">
                            {columns.map((col, i) => (
                                <th key={i} className={`px-4 sm:px-8 py-4 sm:py-6 text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b dark:border-white/5 border-slate-200 ${col.className || ''}`}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((item, rowIdx) => (
                            <tr key={item.id || rowIdx} className="hover:dark:bg-white/5 bg-white shadow-sm border border-slate-200 transition-all group">
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className={`px-4 sm:px-8 py-3 sm:py-5 text-sm font-bold dark:text-white dark:text-white text-slate-900 transition-all group-hover:translate-x-1 ${col.className || ''}`}>
                                        {col.render ? col.render(item) : (col.key ? String(item[col.key]) : '')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
