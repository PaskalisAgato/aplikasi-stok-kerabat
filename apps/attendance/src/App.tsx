import { useState, useRef } from 'react';
import Layout from '@shared/Layout';
import QueryProvider from '@shared/QueryProvider';
import { useAttendance } from '@shared/hooks/useAttendance';
import { useSession } from '@shared/authClient';
import { getGeoLocation, type GeoLocation } from '@shared/utils/location';
import CameraCapture from '@shared/components/CameraCapture';
import type { CameraCaptureHandle } from '@shared/components/CameraCapture';
import { compressImage } from '@shared/utils/image';
import toast, { Toaster } from 'react-hot-toast';

function AttendancePage() {
    const { data: session } = useSession();
    const { todayAttendance, checkIn, checkOut, isLoading, isActionLoading } = useAttendance();
    const cameraRef = useRef<CameraCaptureHandle>(null);

    const [isLocating, setIsLocating] = useState(false);
    const [locationData, setLocationData] = useState<GeoLocation | null>(null);
    const [previewPhoto, setPreviewPhoto] = useState<{ blob: Blob; url: string; type: 'in' | 'out' } | null>(null);

    const handleStartCapture = async (type: 'in' | 'out') => {
        setIsLocating(true);
        try {
            const loc = await getGeoLocation();
            setLocationData(loc);
            
            const photo = await cameraRef.current?.capture();
            if (!photo) {
                toast.error('Gagal mengambil foto. Pastikan kamera aktif.');
                return;
            }

            // Apply 300KB compression
            const compressedPhoto = await compressImage(photo, { maxSizeKB: 300 });

            setPreviewPhoto({
                blob: compressedPhoto,
                url: URL.createObjectURL(compressedPhoto),
                type
            });
        } catch (error: any) {
            toast.error(error.message || 'Gagal mengambil lokasi.');
        } finally {
            setIsLocating(false);
        }
    };

    const handleConfirmSubmit = async () => {
        if (!previewPhoto || !locationData) return;

        try {
            // Convert Blob to base64 string for Cloudinary upload via backend middleware
            const base64Photo = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(previewPhoto.blob);
            });

            const payload = {
                photo: base64Photo,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                location: locationData.address
            };

            if (previewPhoto.type === 'in') {
                await checkIn(payload);
                toast.success('Berhasil Absen Masuk!');
            } else {
                await checkOut(payload);
                toast.success('Berhasil Absen Pulang!');
            }

            handleCancelPreview();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleCancelPreview = () => {
        if (previewPhoto) URL.revokeObjectURL(previewPhoto.url);
        setPreviewPhoto(null);
        setLocationData(null);
    };

    const isCheckedIn = !!todayAttendance?.checkIn;
    const isCheckedOut = !!todayAttendance?.checkOut;

    return (
        <Layout
            currentPort={5189}
            title="Absen Karyawan"
            subtitle="Presensi Harian"
        >
            <Toaster position="top-center" />
            <div className="max-w-2xl mx-auto space-y-10 py-10">
                {/* Status Card */}
                <div className="glass rounded-[3rem] p-8 sm:p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 accent-gradient opacity-50" />
                    
                    <div className="space-y-6">
                        {!isCheckedOut ? (
                            <div className="relative group">
                                <CameraCapture 
                                    ref={cameraRef}
                                    className="aspect-[4/3] w-full max-w-md mx-auto"
                                    userName={session?.user?.name}
                                    facingMode="user"
                                />
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Siap Mengambil Foto</p>
                                </div>
                            </div>
                        ) : (
                            <div className="size-24 mx-auto rounded-[2.5rem] flex items-center justify-center text-slate-950 shadow-2xl transition-all duration-700 bg-slate-500">
                                <span className="material-symbols-outlined text-5xl font-black">check_circle</span>
                            </div>
                        )}

                        <div className="pt-4">
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
                            onClick={() => handleStartCapture('in')}
                            disabled={isCheckedIn || isActionLoading || isLoading || isLocating}
                            className={`flex-1 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${isCheckedIn ? 'bg-white/5 text-[var(--text-muted)] cursor-not-allowed' : 'btn-primary'}`}
                        >
                            <span className="material-symbols-outlined font-black">{isLocating ? 'location_on' : 'login'}</span>
                            {isLocating ? 'MENCARI LOKASI...' : isActionLoading ? 'PROSES...' : 'ABSEN MASUK'}
                        </button>
                        <button 
                            onClick={() => handleStartCapture('out')}
                            disabled={!isCheckedIn || isCheckedOut || isActionLoading || isLoading || isLocating}
                            className={`flex-1 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${(!isCheckedIn || isCheckedOut) ? 'bg-white/5 text-[var(--text-muted)] cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'}`}
                        >
                            <span className="material-symbols-outlined font-black">{isLocating ? 'location_on' : 'logout'}</span>
                            {isLocating ? 'MENCARI LOKASI...' : isActionLoading ? 'PROSES...' : 'ABSEN PULANG'}
                        </button>
                    </div>

                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Info Card */}
                <div className="glass rounded-[2rem] p-8 space-y-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Pemberitahuan</p>
                    <div className="flex gap-4 items-start">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <span className="material-symbols-outlined">info</span>
                        </div>
                        <p className="text-xs font-bold leading-relaxed opacity-80">
                            Sistem absen kini menggunakan kamera & lokasi GPS. Pastikan izin kamera dan lokasi diberikan untuk verifikasi kehadiran.
                        </p>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewPhoto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative glass p-6 rounded-[3rem] max-w-lg w-full space-y-6 shadow-2xl border border-white/10 zoom-in-95 duration-300">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Pratinjau Absensi</p>
                                <h3 className="text-xl font-black">{previewPhoto.type === 'in' ? 'Masuk' : 'Pulang'}</h3>
                            </div>
                            <button 
                                onClick={handleCancelPreview}
                                className="size-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <div className="aspect-[4/3] w-full rounded-[2rem] overflow-hidden bg-black/40 border border-white/5 relative">
                            <img 
                                src={previewPhoto.url} 
                                alt="Capture Preview" 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
                                <p className="text-[10px] font-bold text-white leading-tight">
                                    <span className="text-primary">LOKASI:</span> {locationData?.address}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={handleCancelPreview}
                                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Ambil Ulang
                            </button>
                            <button 
                                onClick={handleConfirmSubmit}
                                disabled={isActionLoading}
                                className="flex-2 py-4 btn-primary rounded-2xl font-black text-xs uppercase tracking-widest transition-all px-8"
                            >
                                {isActionLoading ? 'MENGIRIM...' : 'KIRIM ABSENSI'}
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
            <AttendancePage />
        </QueryProvider>
    );
}

export default App;
