import React, { useState } from 'react';
import { 
  QrCode, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ScanValidator = () => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'expired'>('idle');
  const [result, setResult] = useState<any>(null);

  const handleValidate = async () => {
    if (!code) return;
    setStatus('loading');
    
    // Simulate API call
    setTimeout(() => {
      if (code.toUpperCase().includes('ERR')) {
        setStatus('error');
      } else if (code.toUpperCase().includes('EXP')) {
        setStatus('expired');
      } else {
        setStatus('success');
        setResult({
          promoName: 'Ramadhan Coffee Fest',
          menu: 'Cafe Latte / Cappuccino',
          discount: 'Rp 15.000',
          expiry: '12 Jun 2026'
        });
      }
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-2">
           <Lock className="w-4 h-4 text-primary" />
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Secure Validator Protocol</span>
        </div>
        <h2 className="text-4xl font-display font-black text-[var(--text-main)] uppercase tracking-tight">Vault Entry</h2>
        <p className="text-[var(--text-muted)] font-bold text-sm uppercase tracking-widest max-w-lg mx-auto">Verifikasi autentikasi voucher melalui enkripsi kode unik.</p>
      </div>

      <div className="card p-10 md:p-16 space-y-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 size-64 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="space-y-6 relative z-10">
          <div className="relative group">
            <QrCode className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary opacity-30 group-focus-within:opacity-100 transition-opacity" />
            <input 
              type="text" 
              placeholder="Masukkan Kode Voucher (e.g. KKT-XJ82KF-7B)"
              className="w-full bg-primary/5 border border-primary/10 p-6 pl-16 rounded-[2rem] focus:outline-none focus:border-primary/30 transition-all font-mono font-bold text-lg text-primary placeholder:text-primary/20 text-center"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleValidate()}
            />
          </div>

          <button 
            onClick={handleValidate}
            disabled={status === 'loading' || !code}
            className="btn-primary w-full h-20 text-lg shadow-2xl shadow-primary/20"
          >
            {status === 'loading' ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <Search className="w-6 h-6 mr-3" />}
            {status === 'loading' ? 'MENGHUBUNGKI SERVER...' : 'VALIDASI KODE'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-10 rounded-[3rem] bg-[var(--success)]/5 border border-[var(--success)]/20 space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <CheckCircle2 className="size-32 text-[var(--success)]" />
              </div>
              
              <div className="flex items-center gap-4 text-[var(--success)] font-black uppercase tracking-[0.3em] text-[10px]">
                 <span className="size-3 rounded-full bg-[var(--success)] animate-pulse" /> Authentication Verified
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] text-[var(--success)] font-black uppercase tracking-widest opacity-60">Program Kampanye</p>
                  <p className="text-2xl font-display font-black text-[var(--text-main)] uppercase">{result?.promoName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-[var(--success)] font-black uppercase tracking-widest opacity-60">Nilai Manfaat</p>
                  <p className="text-2xl font-mono font-black text-[var(--success)]">{result?.discount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-[var(--success)] font-black uppercase tracking-widest opacity-60">Berlaku Hingga</p>
                  <p className="text-lg font-bold text-[var(--text-main)] uppercase">{result?.expiry}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-[var(--success)] font-black uppercase tracking-widest opacity-60">Ketentuan</p>
                  <p className="text-sm font-bold text-[var(--text-main)] uppercase truncate">{result?.menu}</p>
                </div>
              </div>

              <button className="w-full py-5 bg-[var(--success)] text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-[var(--success)]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                 Terapkan Voucher <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {(status === 'error' || status === 'expired') && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-10 rounded-[3rem] bg-[var(--error)]/5 border border-[var(--error)]/20 space-y-6 text-center"
            >
              <div className="size-20 bg-[var(--error)]/10 text-[var(--error)] rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                {status === 'error' ? <XCircle className="size-10" /> : <AlertCircle className="size-10" />}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-black text-[var(--error)] uppercase">
                  {status === 'error' ? 'Authentication Failed' : 'Security Breach: Expired'}
                </h3>
                <p className="text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest">
                  {status === 'error' ? 'Kode tidak ditemukan dalam database pusat.' : 'Masa berlaku voucher ini telah habis.'}
                </p>
              </div>
              <p className="text-[11px] font-bold text-[var(--error)]/60 italic">Mohon periksa kembali karakter kode atau hubungi administrator.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center opacity-20 hover:opacity-50 transition-opacity">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">End-to-End Encryption Enabled</p>
      </div>
    </div>
  );
};
