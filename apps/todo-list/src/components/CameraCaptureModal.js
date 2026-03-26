import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CameraCapture from '@shared/components/CameraCapture';
export default function CameraCaptureModal({ isOpen, onClose, onCapture, userName }) {
    const cameraRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [facingMode, setFacingMode] = useState('environment');
    const [isSwitching, setIsSwitching] = useState(false);
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
    if (!isOpen)
        return null;
    const handleCapture = async () => {
        if (isCapturing)
            return;
        setIsCapturing(true);
        try {
            const blob = await cameraRef.current?.capture();
            if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewImage(reader.result);
                };
                reader.readAsDataURL(blob);
            }
        }
        catch (err) {
            console.error('Capture failed', err);
        }
        finally {
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
        setTimeout(() => setIsSwitching(false), 400);
    };
    const modalContent = (_jsxs("div", { className: "fixed inset-0 z-[99999] bg-black flex flex-col items-stretch overflow-hidden select-none touch-none", children: [_jsx("div", { className: `absolute inset-0 transition-opacity duration-300 ${isSwitching ? 'opacity-0' : 'opacity-100'}`, children: previewImage ? (_jsxs("div", { className: "w-full h-full relative animate-in fade-in zoom-in-110 duration-500", children: [_jsx("img", { src: previewImage, className: "w-full h-full object-cover", alt: "Capture Preview" }), _jsx("div", { className: "absolute inset-0 bg-black/30" })] })) : (_jsx(CameraCapture, { ref: cameraRef, className: "w-full h-full", userName: userName, facingMode: facingMode })) }), _jsxs("div", { className: "absolute top-0 inset-x-0 p-6 flex justify-between items-start z-50 bg-gradient-to-b from-black/60 to-transparent", children: [_jsxs("div", { className: "animate-in slide-in-from-top-4 duration-500", children: [_jsx("h3", { className: "text-white font-black uppercase tracking-[0.2em] text-xs", children: previewImage ? 'Konfirmasi Foto' : 'Hanya Kamera' }), !previewImage && (_jsxs("div", { className: "flex items-center gap-2 mt-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/20 w-fit", children: [_jsx("div", { className: "size-1.5 bg-red-500 rounded-full animate-pulse" }), _jsx("span", { className: "text-[8px] font-black text-red-500 uppercase tracking-widest", children: "Live Preview" })] }))] }), _jsx("button", { onClick: onClose, className: "size-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-75 transition-all shadow-2xl", children: _jsx("span", { className: "material-symbols-outlined text-2xl font-black", children: "close" }) })] }), !previewImage && (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-10", children: [_jsx("div", { className: "w-full max-w-sm aspect-[3/4] border-2 border-dashed border-white/20 rounded-[3rem] relative", children: _jsx("div", { className: "absolute inset-0 border-[40px] border-black/20 rounded-[3rem]" }) }), _jsx("p", { className: "mt-8 text-white/40 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse text-center", children: "Posisikan Bukti di Tengah" })] })), _jsx("div", { className: "absolute bottom-0 inset-x-0 h-48 flex justify-center items-center z-50 bg-gradient-to-t from-black/80 to-transparent px-8", children: !previewImage ? (_jsxs("div", { className: "w-full max-w-md flex justify-between items-center relative gap-4", children: [_jsx("div", { className: "size-14 hidden md:block" }), _jsxs("button", { onClick: handleCapture, disabled: isCapturing || isSwitching, className: `group relative size-24 md:size-28 rounded-full flex items-center justify-center transition-all active:scale-90 ${isCapturing ? 'opacity-50 grayscale' : ''}`, children: [_jsx("div", { className: "absolute inset-0 rounded-full bg-white/20 animate-pulse scale-110" }), _jsx("div", { className: "absolute inset-2 rounded-full bg-white shadow-2xl transition-all group-hover:scale-95" }), isCapturing && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center z-10", children: _jsx("div", { className: "size-8 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" }) }))] }), _jsx("button", { onClick: toggleCamera, disabled: isSwitching, className: "size-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white active:scale-75 transition-all shadow-xl gap-0.5 group", children: _jsx("span", { className: "material-symbols-outlined text-2xl group-hover:rotate-180 transition-transform duration-500", children: "flip_camera_ios" }) })] })) : (_jsxs("div", { className: "flex w-full gap-4 max-w-sm animate-in slide-in-from-bottom-8 duration-500 mb-6", children: [_jsxs("button", { onClick: handleRetake, className: "flex-1 h-14 rounded-[1.5rem] bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center gap-3 active:scale-95 transition-all", children: [_jsx("span", { className: "material-symbols-outlined text-xl", children: "refresh" }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-widest", children: "Ulang" })] }), _jsxs("button", { onClick: handleConfirm, className: "flex-[1.5] h-14 rounded-[1.5rem] bg-primary text-slate-950 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl shadow-primary/40 ring-4 ring-primary/20", children: [_jsx("span", { className: "material-symbols-outlined text-xl font-black", children: "check_circle" }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-widest", children: "Simpan Bukti" })] })] })) }), _jsx("style", { children: `
                body.modal-open {
                    overflow: hidden !important;
                    height: 100vh !important;
                }
            ` })] }));
    return createPortal(modalContent, document.body);
}
