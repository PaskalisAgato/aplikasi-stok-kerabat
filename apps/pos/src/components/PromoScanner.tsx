import React, { useState } from 'react';
import { QrCode, X, CheckCircle, AlertCircle } from 'lucide-react';
import { usePromo } from '../hooks/usePromo';

interface PromoScannerProps {
    subtotal: number;
    items?: any[];
    onApplyPromo: (discountAmount: number, promoData: any) => void;
    onClose: () => void;
}

export const PromoScanner: React.FC<PromoScannerProps> = ({ subtotal, items = [], onApplyPromo, onClose }) => {
    const { validateBarcode } = usePromo();
    const [scannedCode, setScannedCode] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleValidate = async () => {
        if (!scannedCode || isLoading) return;
        setIsLoading(true);
        setErrorMsg('');
        try {
            const result = await validateBarcode(scannedCode, subtotal, items);
            if (result.valid) {
                onApplyPromo(result.discountAmount, result.promoData);
                onClose();
            } else {
                setErrorMsg(result.reason || 'Kode tidak valid');
            }
        } catch (e: any) {
            setErrorMsg('Terjadi kesalahan jaringan.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                </button>

                <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <QrCode className="text-primary" />
                    Scan Promo Barcode
                </h3>

                <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-2">Subtotal Transaksi: Rp {subtotal.toLocaleString('id-ID')}</p>
                    <input
                        autoFocus
                        type="text"
                        placeholder="Scan atau ketik kode..."
                        className="w-full p-4 text-lg font-bold border-2 border-slate-200 rounded-xl focus:border-primary outline-none text-center tracking-widest uppercase"
                        disabled={isLoading}
                        value={scannedCode}
                        onChange={(e) => setScannedCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                    />
                </div>

                {errorMsg && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl mb-4 text-sm font-semibold">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {errorMsg}
                    </div>
                )}

                <button 
                    onClick={handleValidate}
                    disabled={isLoading}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                    {isLoading ? 'Memvalidasi...' : 'Validasi Promo'}
                </button>
            </div>
        </div>
    );
};
