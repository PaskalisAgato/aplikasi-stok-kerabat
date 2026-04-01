import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

export interface CameraCaptureHandle {
    capture: () => Promise<Blob | null>;
    stop: () => void;
    start: () => Promise<void>;
}

interface CameraCaptureProps {
    className?: string;
    userName?: string;
    location?: string;
    facingMode?: 'user' | 'environment';
    showWatermark?: boolean;
}

const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(({ 
    className, 
    userName, 
    location,
    facingMode = 'environment',
    showWatermark = true
}, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }, 
                audio: false 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err: any) {
            console.error('Camera access error:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Izin Kamera Ditolak. Harap aktifkan izin kamera di pengaturan browser/situs Anda untuk mengambil foto bukti.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError('Kamera tidak ditemukan di perangkat ini.');
            } else {
                setError('Gagal mengakses kamera. Pastikan kamera tidak sedang digunakan aplikasi lain.');
            }
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [facingMode]);

    useImperativeHandle(ref, () => ({
        start: startCamera,
        stop: stopCamera,
        capture: async (): Promise<Blob | null> => {
            if (!videoRef.current || !canvasRef.current) return null;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) return null;

            // Set canvas size to video size
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            if (facingMode === 'user') {
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
            }
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            if (facingMode === 'user') {
                context.setTransform(1, 0, 0, 1, 0, 0); // reset
            }
            
            if (showWatermark) {
                // Add Timestamp Overlay
                const now = new Date();
                const timestamp = now.toLocaleString('id-ID', { 
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit' 
                });

                const padding = canvas.width * 0.04;
                const fontSize = Math.max(16, canvas.width * 0.04);
                const lineHeight = fontSize + 8;
                
                // Draw Background Box for contrast
                const locationText = location ? (location.length > 50 ? location.substring(0, 47) + '...' : location) : '';
                
                context.font = `bold ${fontSize}px sans-serif`;
                const boxWidth = Math.max(
                    context.measureText(timestamp).width,
                    userName ? context.measureText(`USER: ${userName.toUpperCase()}`).width : 0,
                    location ? context.measureText(locationText).width : 0
                ) + (padding * 2);
                
                const lines = 1 + (userName ? 1 : 0) + (location ? 1 : 0);
                const boxHeight = lines * lineHeight + padding;

                context.fillStyle = 'rgba(0, 0, 0, 0.6)';
                context.fillRect(0, canvas.height - boxHeight, boxWidth, boxHeight);

                context.fillStyle = 'white';
                
                // Draw lines from bottom up
                let currentY = canvas.height - padding;
                
                // Row 1: Timestamp
                context.fillText(timestamp, padding, currentY);
                
                // Row 2: User
                if (userName) {
                    currentY -= lineHeight;
                    context.font = `bold ${fontSize - 4}px sans-serif`;
                    context.fillText(`USER: ${userName.toUpperCase()}`, padding, currentY);
                }

                // Row 3: Location
                if (location) {
                    currentY -= lineHeight;
                    context.font = `bold ${fontSize - 6}px sans-serif`;
                    context.fillText(locationText, padding, currentY);
                }
            }

            // Convert to Blob
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.8);
            });
        }
    }));

    return (
        <div className={`relative overflow-hidden bg-slate-950 w-full h-full ${className}`}>
            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <span className="material-symbols-outlined text-red-500 text-5xl">videocam_off</span>
                    <p className="text-white text-sm font-bold">{error}</p>
                    <button 
                        onClick={startCamera}
                        className="px-6 py-2 bg-primary text-slate-950 rounded-full text-xs font-black uppercase tracking-widest"
                    >
                        Coba Lagi
                    </button>
                </div>
            ) : (
                <>
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover ${facingMode === 'user' ? 'mirror' : ''}`}
                    />
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                        <div className="size-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Live</span>
                    </div>
                </>
            )}
            <canvas ref={canvasRef} className="hidden" />
            <style>{`
                .mirror {
                    transform: scaleX(-1);
                }
            `}</style>
        </div>
    );
});

CameraCapture.displayName = 'CameraCapture';

export default CameraCapture;
