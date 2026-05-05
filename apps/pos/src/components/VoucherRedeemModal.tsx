import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode, Search, AlertCircle, CheckCircle2, Ticket, Loader2 } from 'lucide-react';
import { apiClient } from '@shared/apiClient';

interface VoucherRedeemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyVoucher: (code: string) => void;
}

export const VoucherRedeemModal: React.FC<VoucherRedeemModalProps> = ({ isOpen, onClose, onApplyVoucher }) => {
    const [manualCode, setManualCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'scanning' | 'validating' | 'success' | 'error'>('scanning');
    const [errorMsg, setErrorMsg] = useState('');
    const [voucherData, setVoucherData] = useState<any>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (isOpen && status === 'scanning') {
            const scanner = new Html5QrcodeScanner(
                'qr-reader',
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render((decodedText) => {
                handleValidate(decodedText);
                scanner.clear();
            }, () => {
                // Ignore frequent scan errors
            });

            scannerRef.current = scanner;
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.warn('Scanner cleanup error', e));
            }
        };
    }, [isOpen, status]);

    const handleValidate = async (code: string) => {
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) return;

        setStatus('validating');
        setErrorMsg('');

        try {
            const res = await apiClient.get(`/vouchers/validate/${cleanCode}`) as any;
            if (res.isValid) {
                setVoucherData(res.voucher);
                setStatus('success');
                // Auto close after 1.5s
                setTimeout(() => {
                    onApplyVoucher(cleanCode);
                    onClose();
                }, 1500);
            } else {
                setStatus('error');
                setErrorMsg(res.message || 'Voucher tidak valid');
            }
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err.message || 'Gagal memvalidasi voucher');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 pb-4 flex justify-between items-center border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <Ticket className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Redeem Voucher</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {status === 'scanning' ? (
                        <div className="flex flex-col items-center">
                            <div id="qr-reader" className="w-full rounded-2xl overflow-hidden border-2 border-indigo-100" />
                            <button 
                                onClick={() => setStatus('idle')}
                                className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline"
                            >
                                Kembali ke Input Manual
                            </button>
                        </div>
                    ) : status === 'validating' ? (
                        <div className="py-12 flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                            <p className="font-medium text-slate-600">Memproses Voucher...</p>
                        </div>
                    ) : status === 'success' ? (
                        <div className="py-12 flex flex-col items-center gap-4 text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-800">Voucher Berhasil!</h4>
                                <p className="text-slate-500 mt-1">Diskon 20% Kopi & Free Teh/Kopi Susu diterapkan</p>
                                <div className="mt-4 px-4 py-2 bg-green-50 text-green-700 font-mono font-bold rounded-lg inline-block">
                                    {voucherData?.code}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {status === 'error' && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-sm font-medium">{errorMsg}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Input Kode Voucher
                                </label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        placeholder="KKT-XXXXXX"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 transition-all font-mono text-xl tracking-widest outline-none"
                                        onKeyPress={(e) => e.key === 'Enter' && handleValidate(manualCode)}
                                    />
                                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                                </div>
                                <button 
                                    onClick={() => handleValidate(manualCode)}
                                    disabled={!manualCode}
                                    className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                                >
                                    <Search className="w-5 h-5" />
                                    Cek Voucher
                                </button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-100" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase font-bold">
                                    <span className="px-2 bg-white text-slate-400">Atau</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setStatus('scanning')}
                                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-slate-200"
                            >
                                <QrCode className="w-6 h-6" />
                                Scan QR Barcode
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center text-xs text-slate-400 font-medium italic">
                    "Satu voucher berlaku untuk satu kali transaksi di Outlet Utama"
                </div>
            </div>
        </div>
    );
};
