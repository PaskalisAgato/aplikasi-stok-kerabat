import React, { useState } from 'react';
import { 
  QrCode, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Ticket,
  Maximize
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ScanValidator = () => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'validating' | 'success' | 'error'>('idle');

  const handleScan = async () => {
    if (!code) return;
    setStatus('validating');
    
    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      const json = await res.json();
      if (json.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(json.message);
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMsg('Connection to Secure Vault failed.');
    }
  };

  const [errorMsg, setErrorMsg] = useState('');

  return (
    <div className="p-12 max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto border border-white/10">
          <QrCode className="w-10 h-10 text-white/40" />
        </div>
        <h2 className="text-3xl font-outfit font-black tracking-tight">Scan Validator</h2>
        <p className="text-white/40 text-sm">Verify voucher authenticity and mark as redeemed in real-time.</p>
      </div>

      <div className="glass p-10 rounded-[3rem] border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.03)] space-y-8">
        <div className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Enter Code or Scan..." 
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              className="w-full bg-white/5 border-2 border-white/5 rounded-3xl p-6 pl-8 pr-32 font-mono text-2xl tracking-[0.3em] outline-none focus:border-white/20 focus:bg-white/10 transition-all text-center"
            />
            <button 
              onClick={() => setStatus('scanning')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-white text-black rounded-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={handleScan}
            disabled={!code || status === 'validating'}
            className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-white/5"
          >
            {status === 'validating' ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
            {status === 'validating' ? 'Verifying Vault...' : 'Validate & Redeem'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-8 rounded-[2.5rem] bg-green-500/10 border border-green-500/20 flex flex-col items-center text-center gap-2 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
              <CheckCircle2 className="w-12 h-12 text-green-400 mb-2 relative z-10" />
              <p className="font-outfit font-black text-green-400 text-xl relative z-10">Voucher Validated!</p>
              <p className="text-xs text-green-400/60 uppercase tracking-[0.2em] font-black relative z-10">Signature Verified & Redeemed</p>
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-8 rounded-[2.5rem] bg-red-500/10 border border-red-500/20 flex flex-col items-center text-center gap-2"
            >
              <XCircle className="w-12 h-12 text-red-400 mb-2" />
              <p className="font-outfit font-black text-red-400 text-xl">Validation Failed</p>
              <p className="text-xs text-red-400/60 uppercase tracking-[0.2em] font-black">{errorMsg}</p>
              <button 
                onClick={() => setStatus('idle')}
                className="mt-4 px-6 py-2 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                Try Another Code
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-12 text-white/20 select-none">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Auto-Sync Active</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Database Encrypted</span>
         </div>
      </div>
    </div>
  );
};
