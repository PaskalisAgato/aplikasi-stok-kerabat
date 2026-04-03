import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CameraCapture from '@shared/components/CameraCapture';
import type { CameraCaptureHandle } from '@shared/components/CameraCapture';
import { compressImage, addWatermarkToImage } from '@shared/utils/image';
import { getGeoLocation } from '@shared/utils/location';
import { toast } from 'react-hot-toast';

interface CameraCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (base64: string) => void;
    userName?: string;
    category?: string;
    photoUploadMode?: 'camera' | 'gallery' | 'both';
}

export default function CameraCaptureModal({ isOpen, onClose, onCapture, userName, category, photoUploadMode = 'both' }: CameraCaptureModalProps) {
    const cameraRef = useRef<CameraCaptureHandle>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [isSwitching, setIsSwitching] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Scroll Lock Logic
    useEffect(() => {
        if (isOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCapture = async () => {
        if (isCapturing || isProcessing) return;
        setIsCapturing(true);
        setIsProcessing(true);
        try {
            const blob = await cameraRef.current?.capture();
            if (blob) {
                // Get location for watermark
                let locationStr = '';
                try {
                    const loc = await getGeoLocation();
                    locationStr = loc.address;
                } catch (e) {
                    console.warn('Could not get location', e);
                }

                // Add Watermark first
                const watermarkedBlob = await addWatermarkToImage(blob, userName, locationStr);

                // Apply 300KB compression
                const compressedBlob = await compressImage(watermarkedBlob, { maxSizeKB: 300 });
                
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewImage(reader.result as string);
                };
                reader.readAsDataURL(compressedBlob);
            }
        } catch (err) {
            console.error('Capture failed', err);
            toast.error('Gagal mengambil foto');
        } finally {
            setIsCapturing(false);
            setIsProcessing(false);
        }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || isProcessing) return;

        setIsProcessing(true);
        try {
            // Get location for watermark
            let locationStr = '';
            try {
                const loc = await getGeoLocation();
                locationStr = loc.address;
            } catch (e) {
                console.warn('Could not get location', e);
            }

            // Convert file to blob/base64 then watermark
            const watermarkedBlob = await addWatermarkToImage(file, userName, locationStr);

            // Apply 300KB compression
            const compressedBlob = await compressImage(watermarkedBlob, { maxSizeKB: 300 });
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(compressedBlob);
        } catch (err) {
            console.error('Gallery upload failed', err);
            toast.error('Gagal memproses gambar dari galeri');
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const isGalleryAllowed = photoUploadMode !== 'camera' || category === 'Request';
    const isCameraAllowed = photoUploadMode !== 'gallery';

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
        setTimeout(() => setIsSwitching(false), 400);
    };

    const modalContent = (
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col items-stretch overflow-hidden select-none touch-none">
            {/* STICKY FULLSCREEN CAMERA */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${isSwitching ? 'opacity-0' : 'opacity-100'}`}>
                {previewImage ? (
                    <div className="w-full h-full relative animate-in fade-in zoom-in-110 duration-500">
                        <img src={previewImage} className="w-full h-full object-cover" alt="Capture Preview" />
                        <div className="absolute inset-0 bg-black/30" />
                    </div>
                ) : (
                    <CameraCapture 
                        ref={cameraRef}
                        className="w-full h-full"
                        userName={userName}
                        facingMode={facingMode}
                        showWatermark={false}
                    />
                )}
            </div>

            {/* OVERLAY UI: TOP ACTIONS */}
            <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-50 bg-gradient-to-b from-black/60 to-transparent">
                <div className="animate-in slide-in-from-top-4 duration-500">
                    <h3 className="text-white font-black uppercase tracking-[0.2em] text-xs">
                        {previewImage ? 'Konfirmasi Foto' : 'Hanya Kamera'}
                    </h3>
                    {!previewImage && (
                         <div className="flex items-center gap-2 mt-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/20 w-fit">
                             <div className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                             <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Live Preview</span>
                         </div>
                    )}
                </div>

                <button 
                    onClick={onClose}
                    className="size-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-75 transition-all shadow-2xl"
                >
                    <span className="material-symbols-outlined text-2xl font-black">close</span>
                </button>
            </div>

            {/* OVERLAY UI: GUIDES */}
            {!previewImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-10">
                    <div className="w-full max-w-sm aspect-[3/4] border-2 border-dashed border-white/20 rounded-[3rem] relative">
                         <div className="absolute inset-0 border-[40px] border-black/20 rounded-[3rem]" />
                    </div>
                    <p className="mt-8 text-white/40 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse text-center">
                        Posisikan Bukti di Tengah
                    </p>
                </div>
            )}

            {/* OVERLAY UI: BOTTOM ACTIONS */}
            <div className="absolute bottom-0 inset-x-0 h-48 flex justify-center items-center z-50 bg-gradient-to-t from-black/80 to-transparent px-8">
                {!previewImage ? (
                    <div className="w-full max-w-md flex justify-between items-center relative gap-4">
                        
                        {/* Gallery Button - Show if mode is BOTH or GALLERY */}
                        {isGalleryAllowed ? (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="size-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white active:scale-75 transition-all shadow-xl gap-0.5 group"
                            >
                                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">photo_library</span>
                                <span className="text-[8px] font-black uppercase tracking-tighter opacity-80">Galeri</span>
                            </button>
                        ) : (
                            <div className="size-14" /> // Spacer
                        )}

                        {/* Capture Button - Show if mode is BOTH or CAMERA */}
                        {isCameraAllowed ? (
                            <button 
                                onClick={handleCapture}
                                disabled={isCapturing || isSwitching}
                                className={`group relative size-24 md:size-28 rounded-full flex items-center justify-center transition-all active:scale-90 ${isCapturing ? 'opacity-50 grayscale' : ''}`}
                            >
                                <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse scale-110" />
                                <div className="absolute inset-2 rounded-full bg-white shadow-2xl transition-all group-hover:scale-95" />
                                {(isCapturing || isProcessing) && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        <div className="size-8 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </button>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-white/40 text-4xl">no_photography</span>
                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest text-center">Kamera Dinonaktifkan</span>
                            </div>
                        )}

                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleGalleryUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />

                        {/* Switch Camera Button - Only show if camera is enabled */}
                        {isCameraAllowed ? (
                            <button 
                                onClick={toggleCamera}
                                disabled={isSwitching}
                                className="size-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white active:scale-75 transition-all shadow-xl gap-0.5 group"
                            >
                                <span className="material-symbols-outlined text-2xl group-hover:rotate-180 transition-transform duration-500">flip_camera_ios</span>
                            </button>
                        ) : (
                            <div className="size-14" /> // Spacer
                        )}
                    </div>
                ) : (
                    <div className="flex w-full gap-4 max-w-sm animate-in slide-in-from-bottom-8 duration-500 mb-6">
                        <button 
                            onClick={handleRetake}
                            className="flex-1 h-14 rounded-[1.5rem] bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-xl">refresh</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Ulang</span>
                        </button>
                        <button 
                            onClick={handleConfirm}
                            className="flex-[1.5] h-14 rounded-[1.5rem] bg-primary text-slate-950 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl shadow-primary/40 ring-4 ring-primary/20"
                        >
                            <span className="material-symbols-outlined text-xl font-black">check_circle</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Simpan Bukti</span>
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                body.modal-open {
                    overflow: hidden !important;
                    height: 100vh !important;
                }
            `}</style>
        </div>
    );

    return createPortal(modalContent, document.body);
}
