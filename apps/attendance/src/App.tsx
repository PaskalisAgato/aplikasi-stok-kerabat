import React from 'react';
import Layout from '@shared/Layout';
import QueryProvider from '@shared/QueryProvider';
import { useAttendance } from '@shared/hooks/useAttendance';
import { useSession } from '@shared/authClient';

function AttendancePage() {
    const { data: session } = useSession();
    const { todayAttendance, checkIn, checkOut, isLoading, isActionLoading } = useAttendance();

    const handleCheckIn = async () => {
        try {
            await checkIn();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleCheckOut = async () => {
        try {
            await checkOut();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const isCheckedIn = !!todayAttendance?.checkIn;
    const isCheckedOut = !!todayAttendance?.checkOut;

    return (
        <Layout
            currentPort={5189}
            title="Absen Karyawan"
            subtitle="Presensi Harian"
        >
            <div className="max-w-2xl mx-auto space-y-10 py-10">
                {/* Status Card */}
                <div className="glass rounded-[3rem] p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 accent-gradient opacity-50" />
                    
                    <div className="space-y-4">
                        <div className={`size-24 mx-auto rounded-[2.5rem] flex items-center justify-center text-slate-950 shadow-2xl transition-all duration-700 ${isCheckedOut ? 'bg-slate-500' : isCheckedIn ? 'bg-green-500' : 'bg-primary'}`}>
                            <span className="material-symbols-outlined text-5xl font-black">
                                {isCheckedOut ? 'check_circle' : isCheckedIn ? 'timer' : 'fingerprint'}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Status Hari Ini</p>
                            <h2 className="text-4xl font-black font-display tracking-tight">
                                {isCheckedOut ? 'Sudah Pulang' : isCheckedIn ? 'Sudah Masuk' : 'Belum Absen'}
                            </h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass rounded-[2rem] p-6 space-y-1">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Jam Masuk</p>
                            <p className="text-xl font-black">{todayAttendance?.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                            {todayAttendance?.status === 'Terlambat' && (
                                <span className="inline-block px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-tighter">Terlambat</span>
                            )}
                        </div>
                        <div className="glass rounded-[2rem] p-6 space-y-1">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Jam Pulang</p>
                            <p className="text-xl font-black">{todayAttendance?.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button 
                            onClick={handleCheckIn}
                            disabled={isCheckedIn || isActionLoading || isLoading}
                            className={`flex-1 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${isCheckedIn ? 'bg-white/5 text-[var(--text-muted)] cursor-not-allowed' : 'btn-primary'}`}
                        >
                            <span className="material-symbols-outlined font-black">login</span>
                            {isActionLoading ? 'PROSES...' : 'ABSEN MASUK'}
                        </button>
                        <button 
                            onClick={handleCheckOut}
                            disabled={!isCheckedIn || isCheckedOut || isActionLoading || isLoading}
                            className={`flex-1 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${(!isCheckedIn || isCheckedOut) ? 'bg-white/5 text-[var(--text-muted)] cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'}`}
                        >
                            <span className="material-symbols-outlined font-black">logout</span>
                            {isActionLoading ? 'PROSES...' : 'ABSEN PULANG'}
                        </button>
                    </div>

                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                <div className="glass rounded-[2rem] p-8 space-y-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Pemberitahuan</p>
                    <div className="flex gap-4 items-start">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <span className="material-symbols-outlined">info</span>
                        </div>
                        <p className="text-xs font-bold leading-relaxed opacity-80">
                            Silakan lakukan presensi tepat waktu sesuai jadwal shift Anda. Keterlambatan akan otomatis tercatat dalam sistem riwayat absen.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

function App() {
    return (
        <QueryProvider>
            <AttendancePage />
        </QueryProvider>
    );
}

export default App;
