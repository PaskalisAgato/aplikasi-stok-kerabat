import { useRef } from 'react';
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

    if (!isOpen) return null;

    const handleCapture = async () => {
        const blob = await cameraRef.current?.capture();
        if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onCapture(reader.result as string);
                onClose();
            };
            reader.readAsDataURL(blob);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative glass p-6 rounded-[3rem] max-w-lg w-full space-y-6 shadow-2xl border border-white/10 zoom-in-95 duration-300">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Ambil Foto Bukti</p>
                        <h3 className="text-xl font-black text-white">Kamera Aktif</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="size-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white active:scale-75"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>

                <div className="aspect-[4/3] w-full rounded-[2rem] overflow-hidden bg-black/40 border border-white/5 relative">
                    <CameraCapture 
                        ref={cameraRef}
                        className="w-full h-full"
                        userName={userName}
                        facingMode="environment"
                    />
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleCapture}
                        className="flex-[2] py-5 btn-primary rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        <span className="material-symbols-outlined font-black">photo_camera</span>
                        Capture & Simpan
                    </button>
                </div>
            </div>
        </div>
    );
}
