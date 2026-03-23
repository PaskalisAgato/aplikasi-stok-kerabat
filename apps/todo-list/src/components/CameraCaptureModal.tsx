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

    if (!isOpen) return null;

    const handleCapture = async () => {
        if (isCapturing) return;
        setIsCapturing(true);
        try {
            const blob = await cameraRef.current?.capture();
            if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    onCapture(reader.result as string);
                    onClose();
                };
                reader.readAsDataURL(blob);
            }
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-black animate-in fade-in duration-300 flex flex-col">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div>
                    <h3 className="text-white font-black uppercase tracking-widest text-sm">Preview Kamera</h3>
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
            <div className="flex-1 relative overflow-hidden">
                <CameraCapture 
                    ref={cameraRef}
                    className="w-full h-full rounded-none shadow-none"
                    userName={userName}
                    facingMode="environment"
                />

                {/* Overlays / Guides (Optional) */}
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 aspect-square border-2 border-dashed border-white/20 rounded-3xl pointer-events-none" />
                
                <p className="absolute bottom-32 inset-x-0 text-center text-white/40 text-[10px] font-black uppercase tracking-[0.3em] pointer-events-none animate-pulse">
                    Posisikan Bukti di Tengah Kotak
                </p>
            </div>

            {/* Footer / Controls */}
            <div className="h-48 bg-black flex items-center justify-center relative">
                {/* Cancel Link */}
                <button 
                    onClick={onClose}
                    className="absolute left-12 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                    Batal
                </button>

                {/* Main Capture Button */}
                <button 
                    onClick={handleCapture}
                    disabled={isCapturing}
                    className={`group relative size-24 rounded-full flex items-center justify-center transition-all active:scale-90 ${isCapturing ? 'opacity-50' : ''}`}
                >
                    <div className="absolute inset-0 rounded-full border-4 border-white/20 scale-110" />
                    <div className="absolute inset-2 rounded-full bg-white transition-all group-hover:scale-95" />
                    {isCapturing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="size-8 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </button>

                <div className="absolute right-12 flex flex-col items-center gap-1 opacity-40">
                     <span className="material-symbols-outlined text-white text-xl">photo_library</span>
                     <span className="text-[8px] text-white font-black uppercase">Kamera Saja</span>
                </div>
            </div>
        </div>
    );
}
