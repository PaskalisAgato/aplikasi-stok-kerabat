import React, { useState } from 'react';
import Layout from '@shared/Layout';
import QueryProvider from '@shared/QueryProvider';
import { ModernTable } from '@shared/components/ModernTable';
import { useAttendance } from '@shared/hooks/useAttendance';
import { useSession } from '@shared/authClient';
import { API_BASE_URL } from '@shared/apiClient';

function AttendanceHistoryPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'Admin';
    const UPLOADS_BASE = API_BASE_URL.replace('/api', '') + '/uploads/';
    
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        name: ''
    });

    const { history, isLoading } = useAttendance(filters);

    if (!isAdmin) {
        return (
            <Layout currentPort={5190} title="Riwayat Absen" subtitle="Akses Terbatas">
                <div className="flex flex-col items-center justify-center py-20 glass rounded-[3rem] text-center space-y-4">
                    <span className="material-symbols-outlined text-6xl text-red-500">lock</span>
                    <h2 className="text-2xl font-black uppercase">Akses Ditolak</h2>
                    <p className="text-sm font-bold opacity-60">Halaman ini hanya dapat diakses oleh Administrator.</p>
                </div>
            </Layout>
        );
    }

    const columns = [
        { header: 'Karyawan', key: 'userName' as const },
        { header: 'Tanggal', render: (a: any) => new Date(a.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) },
        { header: 'Check-In', render: (a: any) => a.checkIn ? new Date(a.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--' },
        { header: 'Check-Out', render: (a: any) => a.checkOut ? new Date(a.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--' },
        { 
            header: 'Foto (In/Out)', 
            render: (a: any) => (
                <div className="flex gap-2">
                    {a.checkInPhoto ? (
                        <a href={`${UPLOADS_BASE}${a.checkInPhoto}`} target="_blank" rel="noreferrer" className="size-8 rounded-lg overflow-hidden border border-white/10 hover:border-primary transition-all">
                            <img src={`${UPLOADS_BASE}${a.checkInPhoto}`} alt="In" className="size-8 object-cover" />
                        </a>
                    ) : (
                        <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[10px] opacity-20">image_not_supported</span>
                        </div>
                    )}
                    {a.checkOutPhoto ? (
                        <a href={`${UPLOADS_BASE}${a.checkOutPhoto}`} target="_blank" rel="noreferrer" className="size-8 rounded-lg overflow-hidden border border-white/10 hover:border-primary transition-all">
                            <img src={`${UPLOADS_BASE}${a.checkOutPhoto}`} alt="Out" className="size-8 object-cover" />
                        </a>
                    ) : (
                        <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[10px] opacity-20">image_not_supported</span>
                        </div>
                    )}
                </div>
            )
        },

        { 
            header: 'Status', 
            render: (a: any) => (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                    a.status === 'Terlambat' ? 'bg-amber-500/10 text-amber-500' : 
                    a.status === 'Hadir' ? 'bg-green-500/10 text-green-500' : 
                    'bg-red-500/10 text-red-500'
                }`}>
                    {a.status}
                </span>
            ) 
        },

    ];

    return (
        <Layout
            currentPort={5190}
            title="Riwayat Absen"
            subtitle="Monitoring Kehadiran"
        >
            <div className="space-y-6">
                {/* Filters */}
                <div className="glass rounded-[2rem] p-6 flex flex-wrap gap-6 items-center border-white/5 shadow-lg">
                    <div className="flex-1 min-w-[200px] space-y-2">
                        <label className="text-[9px] font-black text-primary uppercase tracking-widest pl-1">Cari Karyawan</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">search</span>
                            <input 
                                type="text" 
                                placeholder="Nama karyawan..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
                                value={filters.name}
                                onChange={e => setFilters({ ...filters, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-primary uppercase tracking-widest pl-1">Mulai</label>
                            <input 
                                type="date" 
                                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
                                value={filters.startDate}
                                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>
                        <div className="self-end pb-4 opacity-30">
                            <span className="material-symbols-outlined">trending_flat</span>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-primary uppercase tracking-widest pl-1">Selesai</label>
                            <input 
                                type="date" 
                                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
                                value={filters.endDate}
                                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <ModernTable 
                    columns={columns} 
                    data={history} 
                    isLoading={isLoading} 
                    emptyMessage="Tidak ada riwayat absen untuk periode ini"
                />
            </div>
        </Layout>
    );
}

function App() {
    return (
        <QueryProvider>
            <AttendanceHistoryPage />
        </QueryProvider>
    );
}

export default App;
