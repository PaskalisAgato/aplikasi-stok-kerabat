import { useState } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
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
        <div className="bg-[var(--bg-app)] font-display text-[var(--text-main)] min-h-screen pb-32 antialiased animate-in fade-in duration-700">
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-2xl mx-auto glass border-x border-white/5 overflow-x-hidden shadow-2xl">
                <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5180} />
                
                {/* Header */}
                <header className="sticky top-0 z-50 glass border-b border-white/5 px-8 py-6 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="size-12 glass flex items-center justify-center rounded-2xl text-primary hover:bg-primary/10 active:scale-90 transition-all border-white/10"
                        >
                            <span className="material-symbols-outlined font-black">menu</span>
                        </button>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase leading-none">Aktivitas</h1>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80 leading-tight">System Audit & Logs</p>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-8 space-y-10 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center py-32 gap-6 glass rounded-[3rem] opacity-60">
                            <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Menelusuri Jejak Digital...</p>
                        </div>
                    ) : error ? (
                        <div className="p-10 card bg-red-500/5 border-red-500/20 text-center animate-in zoom-in duration-500">
                            <span className="material-symbols-outlined text-5xl text-red-500 font-black mb-4">gpp_maybe</span>
                            <p className="text-red-500 font-black uppercase text-xs tracking-widest">Sinkronasi Log Gagal</p>
                            <p className="text-[10px] text-red-500/60 uppercase tracking-widest mt-2">{error.message || 'Error Koneksi Database'}</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 glass rounded-[3rem] border-dashed border-2 opacity-40">
                            <span className="material-symbols-outlined text-7xl text-primary font-black mb-6">history_toggle_off</span>
                            <p className="font-black text-xs uppercase tracking-[0.3em] text-[var(--text-main)]">Log Masih Bersih</p>
                            <p className="text-[9px] uppercase tracking-widest mt-2 opacity-60">Belum ada aktivitas yang terekam hari ini.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            {logs.map((log, idx) => (
                                <div
                                    key={log.id}
                                    className="card group p-6 flex items-start gap-6 hover:scale-[1.01] active:scale-[0.99] transition-all border-white/5 relative overflow-hidden"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {/* User Initial Avatar */}
                                    <div className="size-14 rounded-2xl glass flex items-center justify-center font-black text-primary border-primary/20 shadow-inner group-hover:rotate-6 transition-transform shrink-0 relative z-10">
                                        <span className="text-lg">{getInitials(log.userName)}</span>
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-4 relative z-10">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-black font-display tracking-tight text-[var(--text-main)] uppercase leading-none truncate group-hover:text-primary transition-colors">
                                                    {log.userName || 'Sistem Otomatis'}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="material-symbols-outlined text-[10px] text-[var(--text-muted)] font-black">schedule</span>
                                                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                                                        {formatDate(log.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-inner ${getActionColor(log.action)}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[14px] font-black">{getActionIcon(log.action)}</span>
                                                    {log.action.split(':')[0].replace(/_/g, ' ')}
                                                </div>
                                            </span>
                                        </div>

                                        <div className="p-4 glass rounded-2xl border-white/5 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                                                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Obyek: <span className="opacity-60">{log.tableName}</span></p>
                                            </div>
                                            <p className="text-[11px] font-bold text-[var(--text-muted)] leading-relaxed uppercase tracking-widest italic opacity-80">
                                                {log.action.includes(':') ? log.action.split(':').slice(1).join(':').trim() : log.action}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Decorative Background Blob for Each Item */}
                                    <div className="absolute right-0 bottom-0 size-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mb-12 group-hover:bg-primary/10 transition-colors"></div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ActivityLogPage;
