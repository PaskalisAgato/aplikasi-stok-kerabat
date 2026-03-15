import React, { useState } from 'react';
import { useAuditLogs, type AuditLog } from '../hooks/useAuditLogs';
import NavDrawer from '../NavDrawer';

const ActivityLogPage: React.FC = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { data: logs = [], isLoading, error } = useAuditLogs();

    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    };

    const getActionColor = (action: string) => {
        if (action.includes('CREATE')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        if (action.includes('DELETE')) return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (action.includes('UPDATE')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        if (action.includes('STOCK')) return 'bg-primary/10 text-primary border-primary/20';
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    };

    const getActionIcon = (action: string) => {
        if (action.includes('CREATE')) return 'person_add';
        if (action.includes('DELETE')) return 'person_remove';
        if (action.includes('UPDATE_INVENTORY')) return 'inventory_2';
        if (action.includes('STOCK_MOVEMENT')) return 'monitoring';
        return 'history';
    };

    return (
        <div className="bg-background-app text-main min-h-screen antialiased flex flex-col">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5180} />
            
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-background-app/80 backdrop-blur-md p-4 border-b border-border-dim">
                <div className="flex items-center gap-3 max-w-5xl mx-auto w-full">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="flex items-center justify-center p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-main">Riwayat Aktivitas</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-24">
                <div className="max-w-5xl mx-auto w-full p-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            <p className="text-muted font-bold animate-pulse">Memuat riwayat...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 bg-red-500/10 text-red-500 rounded-3xl text-center font-bold border border-red-500/20">
                            <span className="material-symbols-outlined text-4xl mb-2">error</span>
                            <p>Gagal memuat riwayat aktivitas</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                            <span className="material-symbols-outlined text-6xl">history_toggle_off</span>
                            <p className="text-xl font-bold">Belum ada aktivitas tercatat</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="p-5 rounded-3xl bg-surface border border-border-dim shadow-sm hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* User Initial */}
                                        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black border-2 border-primary/20 shrink-0">
                                            {getInitials(log.userName)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-base font-black truncate text-main group-hover:text-primary transition-colors">
                                                    {log.userName || 'Sistem'}
                                                </h3>
                                                <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">
                                                    {formatDate(log.createdAt)}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border flex items-center gap-1.5 ${getActionColor(log.action)}`}>
                                                    <span className="material-symbols-outlined text-xs">{getActionIcon(log.action)}</span>
                                                    {log.action.split(':')[0].replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-xs font-medium text-muted">
                                                    pada tabel <code className="bg-primary/5 px-1.5 py-0.5 rounded text-primary">{log.tableName}</code>
                                                </span>
                                            </div>

                                            <p className="mt-3 text-sm font-medium text-main/80 leading-relaxed bg-background-app/50 p-3 rounded-2xl border border-border-dim/50">
                                                {log.action.includes(':') ? log.action.split(':').slice(1).join(':').trim() : log.action}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ActivityLogPage;
