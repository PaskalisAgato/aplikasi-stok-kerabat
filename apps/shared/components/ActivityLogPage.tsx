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
            month: 'long',
            year: 'numeric',
        }).format(date);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    };

    const getActionTheme = (action: string) => {
        if (action.includes('CREATE')) return 'bg-orange-50 text-orange-600 border-orange-100';
        if (action.includes('DELETE')) return 'bg-red-50 text-red-600 border-red-100';
        if (action.includes('UPDATE')) return 'bg-blue-50 text-blue-600 border-blue-100';
        if (action.includes('LOGIN')) return 'bg-orange-500 text-white border-orange-600';
        return 'bg-slate-50 text-slate-600 border-slate-100';
    };

    const getActionIcon = (action: string) => {
        if (action.includes('CREATE')) return 'add_circle';
        if (action.includes('DELETE')) return 'delete_forever';
        if (action.includes('UPDATE')) return 'edit_square';
        if (action.includes('LOGIN')) return 'login';
        if (action.includes('STOCK')) return 'inventory_2';
        return 'info';
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] font-display text-slate-800 antialiased overflow-hidden flex flex-col">
            {/* Soft Background Elements */}
            <div className="fixed top-0 right-0 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl -ml-48 -mb-48 pointer-events-none"></div>

            <div className="relative flex flex-col h-screen w-full max-w-[1400px] mx-auto z-10">
                {/* Modern Minimal Header */}
                <header className="px-6 py-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="size-12 bg-white shadow-sm border border-orange-100 flex items-center justify-center rounded-2xl text-orange-500 hover:bg-orange-500 hover:text-white active:scale-95 transition-all duration-300"
                        >
                            <span className="material-symbols-outlined font-bold">menu</span>
                        </button>
                        <div className="space-y-0.5">
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Aktivitas Akun</h1>
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.3em] opacity-80 lg:text-xs">Digital Footprints & Security</p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        <div className="px-4 py-2 bg-orange-500/10 rounded-full border border-orange-200">
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none">
                                {logs.length} Total Logs
                            </p>
                        </div>
                    </div>
                </header>

                {/* Main Scrollable Area */}
                <main className="flex-1 px-6 pb-12 overflow-y-auto custom-scrollbar-orange">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center py-40 gap-8 animate-in fade-in duration-700">
                            <div className="relative">
                                <div className="size-20 rounded-3xl border-4 border-orange-100 border-t-orange-500 animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-orange-500 animate-pulse">lock_person</span>
                                </div>
                            </div>
                            <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.4em] animate-pulse">Sinkronisasi Keamanan...</p>
                        </div>
                    ) : error ? (
                        <div className="max-w-md mx-auto mt-20 p-8 bg-white border border-red-100 shadow-xl shadow-red-500/5 rounded-[2.5rem] text-center animate-in zoom-in duration-500">
                            <div className="size-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
                                <span className="material-symbols-outlined text-4xl font-black">gpp_maybe</span>
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Gagal Memuat Log</h2>
                            <p className="text-sm text-slate-500 mb-6">{error.message || 'Terdapat kendala koneksi ke server pusat.'}</p>
                            <button className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-colors">Coba Lagi</button>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 opacity-40">
                            <div className="size-32 bg-orange-50 rounded-full flex items-center justify-center mb-8 border-2 border-dashed border-orange-200">
                                <span className="material-symbols-outlined text-6xl text-orange-500 font-light">history_toggle_off</span>
                            </div>
                            <p className="font-black text-xs uppercase tracking-[0.4em] text-slate-800">Belum Ada Aktivitas</p>
                            <p className="text-[10px] uppercase tracking-widest mt-3 opacity-60">Seluruh operasi sistem berjalan normal.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            {logs.map((log, idx) => (
                                <div
                                    key={log.id}
                                    className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 relative overflow-hidden"
                                    style={{ animationDelay: `${idx * 40}ms` }}
                                >
                                    {/* Header: User & Role */}
                                    <div className="flex items-start justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-orange-500 flex items-center justify-center font-black text-white shadow-lg shadow-orange-500/20 group-hover:rotate-6 transition-transform duration-500 shrink-0">
                                                <span className="text-sm">{getInitials(log.userName)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight truncate">
                                                    {log.userName || 'System'}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="size-1.5 rounded-full bg-orange-500"></span>
                                                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest opacity-80">
                                                        {log.role || 'Administrator'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-xl border ${getActionTheme(log.action)} flex items-center justify-center shrink-0`}>
                                            <span className="material-symbols-outlined text-lg">{getActionIcon(log.action)}</span>
                                        </div>
                                    </div>

                                    {/* Action Content */}
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors duration-300 min-h-[80px] flex flex-col justify-center">
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 opacity-60">Aktivitas</p>
                                            <p className="text-[12px] font-black text-slate-800 leading-relaxed uppercase tracking-tight">
                                                {log.action.includes(':') ? log.action.split(':').slice(1).join(':').trim() : log.action.replace(/_/g, ' ')}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Waktu Login</p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[12px] text-orange-400">schedule</span>
                                                    <p className="text-[10px] font-black text-slate-700 uppercase">{formatTime(log.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-0.5">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tanggal</p>
                                                <p className="text-[10px] font-black text-slate-700 uppercase">{formatDate(log.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subtle Table Tag */}
                                    <div className="absolute bottom-0 right-6 translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                                        <div className="px-3 py-1 bg-slate-900 rounded-t-lg">
                                            <p className="text-[8px] font-black text-white uppercase tracking-[0.3em] truncate max-w-[80px]">OBJ: {log.tableName}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                {/* Sidebar Drawer */}
                <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5180} />
            </div>

            {/* Injected Custom Scrollbar Styles */}
            <style>{`
                .custom-scrollbar-orange::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar-orange::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar-orange::-webkit-scrollbar-thumb {
                    background: #FED7AA;
                    border-radius: 10px;
                }
                .custom-scrollbar-orange::-webkit-scrollbar-thumb:hover {
                    background: #FB923C;
                }
                @media (max-width: 640px) {
                    .custom-scrollbar-orange::-webkit-scrollbar {
                        width: 0px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ActivityLogPage;
