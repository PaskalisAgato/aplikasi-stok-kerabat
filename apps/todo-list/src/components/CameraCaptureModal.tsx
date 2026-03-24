import { useRef, useState } from 'react';
import CameraCapture from '@shared/components/CameraCapture';
import type { CameraCaptureHandle } from '@shared/components/CameraCapture';

interface CameraCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (base64: string) => void;
    userName?: string;
}

export default function CameraCaptureModal({ isOpen, onClose, onCapture, userName }: CameraCaptureModalProps) {
    const cameraRef = useRef<CameraCaptureHandle>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [isSwitching, setIsSwitching] = useState(false);

    if (!isOpen) return null;

    const handleCapture = async () => {
        if (isCapturing) return;
        setIsCapturing(true);
        try {
            const blob = await cameraRef.current?.capture();
            if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewImage(reader.result as string);
                };
                reader.readAsDataURL(blob);
            }
        } finally {
            setIsCapturing(false);
        }
    };

    const handleConfirm = () => {
        if (previewImage) {
            onCapture(previewImage);
            onClose();
            setPreviewImage(null);
        }
    };

    const handleRetake = () => {
        setPreviewImage(null);
    };

    const toggleCamera = () => {
        setIsSwitching(true);
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        setTimeout(() => setIsSwitching(false), 500);
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-black animate-in fade-in duration-300 flex flex-col">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="animate-in slide-in-from-top duration-500">
                    <h3 className="text-white font-black uppercase tracking-widest text-sm">
                        {previewImage ? 'Konfirmasi Bukti' : 'Preview Kamera'}
                    </h3>
                    <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">{userName || 'Karyawan'}</p>
                </div>
                <button 
                    onClick={onClose}
                    className="size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-75 transition-all"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            {/* Camera Area */}
            <div className={`flex-1 relative overflow-hidden transition-all duration-500 ${isSwitching ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                {previewImage ? (
                    <div className="w-full h-full animate-in zoom-in-110 duration-500">
                        <img src={previewImage} className="w-full h-full object-cover" alt="Capture Preview" />
                        <div className="absolute inset-0 bg-black/20" />
                    </div>
                ) : (
                    <>
                        <CameraCapture 
                            ref={cameraRef}
                            className="w-full h-full rounded-none shadow-none"
                            userName={userName}
                            facingMode={facingMode}
                        />

                        {/* Overlays / Guides */}
                        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 aspect-square border-2 border-dashed border-white/20 rounded-3xl pointer-events-none" />
                        
                        <p className="absolute bottom-32 inset-x-0 text-center text-white/40 text-[10px] font-black uppercase tracking-[0.3em] pointer-events-none animate-pulse">
                            Posisikan Bukti di Tengah Kotak
                        </p>
                    </>
                )}
            </div>

            {/* Footer / Controls */}
            <div className="h-48 bg-black flex items-center justify-center relative px-6">
                {!previewImage ? (
                    <>
                        {/* Cancel Button */}
                        <button 
                            onClick={onClose}
                            className="absolute left-8 md:relative md:left-0 md:flex-1 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors text-left"
                        >
                            Batal
                        </button>

                        {/* Main Capture Button */}
                        <button 
                            onClick={handleCapture}
                            disabled={isCapturing || isSwitching}
                            className={`group relative size-24 rounded-full flex items-center justify-center transition-all active:scale-90 ${isCapturing ? 'opacity-50' : ''}`}
                        >
                            <div className="absolute inset-0 rounded-full border-4 border-white/20 scale-110" />
                            <div className="absolute inset-2 rounded-full bg-white transition-all group-hover:scale-95" />
                            {isCapturing && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="size-8 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </button>

                        {/* Switch Camera Button */}
                        <button 
                            onClick={toggleCamera}
                            disabled={isSwitching}
                            className="absolute right-8 md:relative md:right-0 md:flex-1 flex flex-col items-center gap-2 group"
                        >
                            <div className="size-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white group-active:scale-75 transition-all">
                                <span className="material-symbols-outlined text-xl">flip_camera_ios</span>
                            </div>
                            <span className="text-[8px] text-white/40 font-black uppercase tracking-widest">Ganti</span>
                        </button>
                    </>
                ) : (
                    <div className="flex w-full gap-4 max-w-md animate-in slide-in-from-bottom duration-500">
                        <button 
                            onClick={handleRetake}
                            className="flex-1 h-14 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-xl">refresh</span>
                            <span className="text-xs font-black uppercase tracking-widest">Ulang</span>
                        </button>
                        <button 
                            onClick={handleConfirm}
                            className="flex-[2] h-14 rounded-2xl bg-primary text-slate-950 flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-xl">check_circle</span>
                            <span className="text-xs font-black uppercase tracking-widest">Gunakan Foto</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
