import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Share2, Copy, Check } from 'lucide-react';

interface VoucherQRModalProps {
    isOpen: boolean;
    onClose: () => void;
    voucher: {
        code: string;
        expiresAt: string;
    };
}

export const VoucherQRModal: React.FC<VoucherQRModalProps> = ({ isOpen, onClose, voucher }) => {
    const [copied, setCopied] = React.useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(voucher.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsAppShare = () => {
        const text = `Halo! Ini voucher QR Kerabat Kopi Tiam Anda: ${voucher.code}\n\nBerlaku hingga: ${new Date(voucher.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n\nTunjukkan QR ini di Outlet Utama untuk mendapatkan promo spesial!`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 pb-0 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800">Voucher QR</h3>
                        <p className="text-slate-500 text-sm mt-1">Gunakan di Outlet Utama</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col items-center">
                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 relative group">
                        <QRCodeSVG 
                            value={voucher.code} 
                            size={200}
                            level="H"
                            includeMargin={false}
                            className="bg-white p-2 rounded-lg"
                        />
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none rounded-xl" />
                    </div>

                    <div className="mt-8 text-center">
                        <div 
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full cursor-pointer hover:bg-slate-200 transition-colors group mb-2"
                        >
                            <span className="font-mono text-xl font-bold text-indigo-600 tracking-wider">
                                {voucher.code}
                            </span>
                            {copied ? (
                                <Check className="w-5 h-5 text-green-500" />
                            ) : (
                                <Copy className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                            )}
                        </div>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                            Berlaku Hingga: {new Date(voucher.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={handleWhatsAppShare}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-2xl font-bold hover:brightness-95 transition-all active:scale-95 shadow-lg shadow-green-200"
                    >
                        <Share2 className="w-5 h-5" />
                        WhatsApp
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};
