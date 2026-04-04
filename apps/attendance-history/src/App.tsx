import { useState } from 'react';
import Layout from '@shared/Layout';
import QueryProvider from '@shared/QueryProvider';
import { ModernTable } from '@shared/components/ModernTable';
import { useAttendance } from '@shared/hooks/useAttendance';
import { useSession } from '@shared/authClient';
import { apiClient } from '@shared/apiClient';
import toast, { Toaster } from 'react-hot-toast';
import { exportToExcel, exportToCSV } from '@shared/utils/exportAttendance';

function AttendanceHistoryPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'Admin';
    
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        name: ''
    });

    const { history, isLoading, deleteRecord, deleteByRange, isActionLoading } = useAttendance(filters);
    const [viewingPhoto, setViewingPhoto] = useState<{ url: string; label: string } | null>(null);
    const [isFetchingPhoto, setIsFetchingPhoto] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteRange, setDeleteRange] = useState({
        startDate: filters.startDate,
        endDate: filters.endDate
    });

    const handleViewPhoto = async (photoPath: string, label: string) => {
        if (!photoPath) return;
        setViewingPhoto({ url: photoPath, label });
    };
    const handleDelete = async (id: string | number) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus riwayat absen ini? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
            await deleteRecord(id);
            toast.success('Data berhasil dihapus');
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleBulkDelete = async () => {
        const confirmMsg = `PERINGATAN KRITIKAL: Anda akan menghapus SEMUA data absensi dari tanggal ${deleteRange.startDate} sampai ${deleteRange.endDate}.\n\nTermasuk semua file foto bukti absen. Tindakan ini TIDAK BISA DIBATALKAN.\n\nKetik 'HAPUS' untuk mengonfirmasi:`;
        
        const input = window.prompt(confirmMsg);
        if (input !== 'HAPUS') {
            if (input !== null) toast.error('Konfirmasi salah. Penghapusan dibatalkan.');
            return;
        }

        try {
            const result = await deleteByRange({
                startDate: deleteRange.startDate,
                endDate: deleteRange.endDate
            });
            toast.success(`Berhasil menghapus ${result.count} data dan ${result.filesDeleted} file foto.`);
            setShowDeleteModal(false);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleExportExcel = async () => {
        const data = history as any[];
        if (!data || data.length === 0) {
            toast.error('Tidak ada data untuk diekspor');
            return;
        }
        const fileName = `absensi-${filters.startDate}-${filters.endDate}`;
        await exportToExcel(data, fileName);
    };

    const handleExportCSV = () => {
        const data = history as any[];
        if (!data || data.length === 0) {
            toast.error('Tidak ada data untuk diekspor');
            return;
        }
        const fileName = `absensi-${filters.startDate}-${filters.endDate}`;
        exportToCSV(data, fileName);
    };

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
                        <button
                            onClick={() => handleViewPhoto(a.checkInPhoto, `Masuk: ${a.userName}`)}
                            disabled={isFetchingPhoto}
                            className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-full text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                            {isFetchingPhoto ? '...' : 'Masuk'}
                        </button>
                    ) : null}
                    {a.checkOutPhoto ? (
                        <button 
                            onClick={() => handleViewPhoto(a.checkOutPhoto, `Pulang: ${a.userName}`)}
                            disabled={isFetchingPhoto}
                            className="px-3 py-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                            {isFetchingPhoto ? '...' : 'Pulang'}
                        </button>
                    ) : null}
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

        {
            header: 'Aksi',
            render: (a: any) => (
                <button 
                    onClick={() => handleDelete(a.id)}
                    className="p-2 hover:bg-red-500/10 text-white/20 hover:text-red-500 rounded-xl transition-all group"
                >
                    <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">delete</span>
                </button>
            )
        }

    ];

    return (
        <Layout
            currentPort={5190}
            title="Riwayat Absen"
            subtitle="Monitoring Kehadiran"
            headerExtras={
                <div className="flex flex-wrap gap-2 justify-end">
                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest border border-emerald-500/20 shrink-0"
                    >
                        <span className="material-symbols-outlined text-sm">download_for_offline</span>
                        Excel
                    </button>
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/5 text-[var(--text-muted)] hover:bg-white/10 rounded-xl transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest border border-white/10 shrink-0"
                    >
                        <span className="material-symbols-outlined text-sm">csv</span>
                        CSV
                    </button>
                    <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest border border-red-500/20 shrink-0"
                    >
                        <span className="material-symbols-outlined text-sm">delete_sweep</span>
                        <span className="hidden sm:inline">Hapus Riwayat</span>
                        <span className="sm:hidden">Hapus</span>
                    </button>
                </div>
            }
        >
            <Toaster position="top-center" />
            <div className="space-y-6">
                {/* Filters */}
                <div className="glass rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 items-center border-white/5 shadow-lg">
                    <div className="w-full md:flex-1 space-y-2">
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

                    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full sm:w-auto space-y-2">
                            <label className="text-[9px] font-black text-primary uppercase tracking-widest pl-1">Mulai</label>
                            <input 
                                type="date" 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
                                value={filters.startDate}
                                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>
                        <div className="hidden sm:block pb-4 opacity-30">
                            <span className="material-symbols-outlined">trending_flat</span>
                        </div>
                        <div className="w-full sm:w-auto space-y-2">
                            <label className="text-[9px] font-black text-primary uppercase tracking-widest pl-1">Selesai</label>
                            <input 
                                type="date" 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
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
            {/* Photo Viewing Modal */}
            {viewingPhoto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative glass p-6 rounded-[3rem] max-w-lg w-full space-y-6 shadow-2xl border border-white/10 zoom-in-95 duration-300">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Bukti Absensi</p>
                                <h3 className="text-xl font-black">{viewingPhoto.label}</h3>
                            </div>
                            <button 
                                onClick={() => setViewingPhoto(null)}
                                className="size-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group"
                            >
                                <span className="material-symbols-outlined text-sm group-hover:scale-110">close</span>
                            </button>
                        </div>

                        <div className="aspect-[4/3] w-full rounded-[2rem] overflow-hidden bg-black/40 border border-white/5">
                            <img 
                                src={viewingPhoto.url} 
                                alt="Attendance Proof" 
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex gap-4">
                            <span className="material-symbols-outlined text-primary">info</span>
                            <p className="text-[10px] font-bold text-primary/80 leading-relaxed uppercase tracking-widest">
                                Foto ini adalah bukti sah absensi karyawan yang tersimpan di sistem.
                            </p>
                        </div>

                        <button 
                            onClick={() => {
                                if (viewingPhoto.url.startsWith('blob:')) URL.revokeObjectURL(viewingPhoto.url);
                                setViewingPhoto(null);
                            }}
                            className="w-full py-4 bg-primary text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Tutup & Konfirmasi Selesai
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative glass p-8 rounded-[3rem] max-w-md w-full space-y-8 shadow-2xl border border-red-500/20 zoom-in-95 duration-300">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Penghapusan Massal</p>
                                <h3 className="text-2xl font-black">Hapus Riwayat</h3>
                            </div>
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="size-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group"
                            >
                                <span className="material-symbols-outlined text-sm group-hover:scale-110">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-primary uppercase tracking-widest pl-1">Dari Tanggal</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-red-500 transition-all outline-none"
                                    value={deleteRange.startDate}
                                    onChange={e => setDeleteRange({ ...deleteRange, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-primary uppercase tracking-widest pl-1">Sampai Tanggal</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-red-500 transition-all outline-none"
                                    value={deleteRange.endDate}
                                    onChange={e => setDeleteRange({ ...deleteRange, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex gap-4">
                            <span className="material-symbols-outlined text-red-500">warning</span>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-red-200 leading-relaxed uppercase tracking-widest">
                                    PENTING!
                                </p>
                                <p className="text-[9px] font-bold text-red-200/60 leading-relaxed uppercase tracking-widest">
                                    Semua data absen dan file foto dalam rentang ini akan dihapus permanen.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleBulkDelete}
                                disabled={isActionLoading}
                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 disabled:opacity-50 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-lg shadow-red-500/20"
                            >
                                {isActionLoading ? 'Memproses...' : 'Hapus Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
