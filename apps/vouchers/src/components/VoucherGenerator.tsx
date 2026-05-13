import React, { useState } from 'react';
import { 
  Plus, 
  ChevronRight, 
  Layers, 
  Calendar, 
  Package,
  Check,
  Zap,
  Printer,
  FileDown,
  Loader2,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@shared/apiClient';
import { PrintService } from '@shared/services/PrintService';

export const VoucherGenerator = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const [formData, setFormData] = useState({
    promoName: '',
    menuName: '',
    normalPrice: '',
    voucherPrice: '',
    expiryDays: '30',
    quantity: '50',
    templateId: ''
  });

  const templates = [
    { id: '1', name: 'Terracotta Classic', usage: 'High' },
    { id: '2', name: 'Espresso Minimal', usage: 'Medium' },
    { id: '3', name: 'Cream Silk Special', usage: 'New' }
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/vouchers/promo/generate', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity)
        })
      });
      
      if (response && response.data && response.data.batch) {
        setBatchId(response.data.batch.id);
      }
      setSuccess(true);
    } catch (e: any) {
      alert('Generation failed: ' + (e?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTest = async () => {
    try {
      await PrintService.printVoucher({
        ...formData,
        promoName: `[TEST] ${formData.promoName}`,
        code: 'KKT-TEST-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        voucherPrice: parseInt(formData.voucherPrice),
      }, true);
    } catch (e: any) {
      alert('Print failed: ' + (e?.message || 'Unknown error'));
    }
  };

  const handlePrintAll = async () => {
    if (!batchId) return;
    setIsPrinting(true);
    try {
      const response = await apiFetch(`/vouchers/promo/batches/${batchId}/vouchers`);
      const vouchers = response.data || [];
      
      for (const v of vouchers) {
        await PrintService.printVoucher({
          promoName: formData.promoName,
          code: v.code,
          voucherPrice: parseInt(v.voucherPrice || formData.voucherPrice),
          expiryDays: parseInt(formData.expiryDays),
          menuName: v.menuName || formData.menuName
        }, false);
        // Small delay between prints for hardware stability
        await new Promise(r => setTimeout(r, 800));
      }
      alert(`Berhasil mengirim ${vouchers.length} voucher ke antrean print.`);
    } catch (e: any) {
      alert('Batch print failed: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsPrinting(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-4 sm:gap-12 mb-16">
        {[
          { step: 1, label: 'Data Promosi', icon: 'campaign' },
          { step: 2, label: 'Pilih Template', icon: 'palette' },
          { step: 3, label: 'Finalisasi', icon: 'rocket_launch' }
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-3">
             <div className={`size-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 ${
               step >= s.step 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                : 'bg-primary/5 text-primary/30 border border-primary/10'
             }`}>
               {step > s.step ? <Check className="w-5 h-5" /> : (
                 <span className="material-symbols-outlined text-lg">{s.icon}</span>
               )}
             </div>
             <div className="hidden sm:block">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                  step >= s.step ? 'text-primary' : 'text-[var(--text-muted)] opacity-40'
                }`}>{s.label}</p>
             </div>
             {s.step < 3 && <div className={`w-8 h-[2px] rounded-full hidden md:block transition-colors duration-700 ${step > s.step ? 'bg-primary' : 'bg-primary/10'}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Form Side */}
        <div className="card space-y-8 p-8 md:p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-display font-black text-[var(--text-main)] uppercase">Informasi Kampanye</h3>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Detail penawaran voucher Anda</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Nama Promo</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ramadhan Coffee Fest"
                      className="w-full bg-primary/5 border border-primary/10 p-4 rounded-2xl focus:outline-none focus:border-primary/30 transition-all font-display font-bold text-[var(--text-main)] placeholder:opacity-30"
                      value={formData.promoName}
                      onChange={e => setFormData({...formData, promoName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Menu Utama</label>
                    <div className="relative group">
                      <Package className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                      <input 
                        type="text" 
                        placeholder="Highlight menu anda"
                        className="w-full bg-primary/5 border border-primary/10 p-4 pl-14 rounded-2xl focus:outline-none focus:border-primary/30 transition-all font-bold text-[var(--text-main)] placeholder:opacity-30"
                        value={formData.menuName}
                        onChange={e => setFormData({...formData, menuName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Harga Normal</label>
                      <div className="relative">
                         <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary opacity-40 text-xs font-black">Rp</span>
                         <input 
                          type="number" 
                          className="w-full bg-primary/5 border border-primary/10 p-4 pl-12 rounded-2xl focus:outline-none focus:border-primary/30 font-mono font-bold"
                          value={formData.normalPrice}
                          onChange={e => setFormData({...formData, normalPrice: e.target.value})}
                         />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Harga Voucher</label>
                      <div className="relative">
                         <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary opacity-40 text-xs font-black">Rp</span>
                         <input 
                          type="number" 
                          className="w-full bg-primary/5 border border-primary/10 p-4 pl-12 rounded-2xl focus:outline-none focus:border-primary/30 font-mono font-bold"
                          value={formData.voucherPrice}
                          onChange={e => setFormData({...formData, voucherPrice: e.target.value})}
                         />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Jumlah Batch</label>
                      <input 
                        type="number" 
                        className="w-full bg-primary/5 border border-primary/10 p-4 rounded-2xl focus:outline-none focus:border-primary/30 text-center font-mono font-bold text-lg"
                        value={formData.quantity}
                        onChange={e => setFormData({...formData, quantity: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Masa Berlaku (Hari)</label>
                      <div className="relative">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
                        <input 
                          type="number" 
                          className="w-full bg-primary/5 border border-primary/10 p-4 pl-14 rounded-2xl focus:outline-none focus:border-primary/30 font-bold"
                          value={formData.expiryDays}
                          onChange={e => setFormData({...formData, expiryDays: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className="btn-primary w-full shadow-2xl"
                >
                  Pilih Template <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-display font-black text-[var(--text-main)] uppercase">Visualisasi Voucher</h3>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Pilih estetika yang sesuai dengan event</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {templates.map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => setFormData({...formData, templateId: t.id})}
                      className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                        formData.templateId === t.id 
                          ? 'border-primary bg-primary/5 shadow-lg' 
                          : 'border-primary/5 bg-transparent hover:border-primary/20'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${
                          formData.templateId === t.id ? 'bg-primary text-white' : 'bg-primary/5 text-primary'
                        }`}>
                          <Layers className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-display font-black text-[var(--text-main)] uppercase tracking-tight">{t.name}</p>
                          <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Populer: <span className="text-primary">{t.usage}</span></p>
                        </div>
                      </div>
                      {formData.templateId === t.id && (
                        <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                           <Check className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 px-6 rounded-2xl border border-primary/10 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-primary/5 transition-all"
                  >
                    Kembali
                  </button>
                  <button 
                    onClick={() => setStep(3)}
                    disabled={!formData.templateId}
                    className="btn-primary flex-[2] disabled:opacity-20 disabled:scale-100"
                  >
                    Review Final
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 space-y-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Zap className="size-24 text-primary fill-current" />
                   </div>
                   
                   <div className="flex items-center gap-4 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                     Konfirmasi Batch Details
                   </div>
                   
                   <div className="space-y-4 relative z-10">
                     <div className="flex justify-between border-b border-primary/5 py-3">
                       <span className="text-[10px] font-bold uppercase opacity-40">Kampanye</span>
                       <span className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">{formData.promoName || 'Tanpa Nama'}</span>
                     </div>
                     <div className="flex justify-between border-b border-primary/5 py-3">
                       <span className="text-[10px] font-bold uppercase opacity-40">Total Quantity</span>
                       <span className="text-sm font-mono font-black text-primary">{formData.quantity} Units</span>
                     </div>
                     <div className="flex justify-between border-b border-primary/5 py-3">
                       <span className="text-[10px] font-bold uppercase opacity-40">Estimasi Nilai Budget</span>
                       <span className="text-sm font-black text-[var(--text-main)] font-mono">Rp {(parseInt(formData.quantity) * (parseInt(formData.normalPrice) - parseInt(formData.voucherPrice)) || 0).toLocaleString()}</span>
                     </div>
                   </div>

                   <div className="p-5 rounded-2xl bg-primary/10 border border-primary/10 flex gap-4 text-[10px] font-bold text-primary/70 leading-relaxed italic">
                     <AlertCircle className="w-5 h-5 shrink-0" /> Tindakan ini tidak dapat dibatalkan setelah voucher dicetak dan dienkripsi ke database.
                   </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(2)}
                    className="flex-1 py-4 px-6 rounded-2xl border border-primary/10 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-primary/5 transition-all"
                  >
                    Kembali
                  </button>
                  <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="btn-primary flex-[2] shadow-2xl shadow-primary/30"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    {loading ? 'Processing...' : 'Eksekusi Batch'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Preview Side */}
        <div className="flex flex-col items-center">
           <div className="mb-8 text-center space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Signature Preview</p>
              <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Real-time Visualisation</p>
           </div>
           
           {/* Premium Voucher Card Preview */}
           <div className="w-[320px] aspect-[1/2] bg-[var(--bg-app)] rounded-[3.5rem] border border-primary/20 shadow-2xl relative overflow-hidden flex flex-col p-8 transition-all hover:scale-105 duration-500">
              {/* Background Accent */}
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/10 to-transparent" />
              <div className="absolute -left-20 -top-20 size-60 bg-primary/5 rounded-full blur-3xl" />
              
              <div className="absolute top-0 right-0 p-8 z-10">
                <div className="size-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl border border-black/5">
                  <QrCode className="size-10 text-black opacity-80" />
                </div>
              </div>

              <div className="mt-auto space-y-8 relative z-10">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary">Authentic Offer</p>
                  <h3 className="text-2xl font-display font-black leading-tight truncate text-[var(--text-main)] uppercase tracking-tighter">
                    {formData.promoName || 'PROMO NAME'}
                  </h3>
                </div>

                <div className="h-[1px] bg-primary/10 w-full" />

                <div className="space-y-1">
                   <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Dapat Digunakan Untuk:</p>
                   <p className="text-sm font-black text-[var(--text-main)] uppercase">{formData.menuName || 'SEMUA MENU'}</p>
                </div>

                <div className="flex items-end gap-3 translate-y-2">
                   <div className="bg-primary text-white px-5 py-3 rounded-2xl text-xl font-display font-black shadow-xl shadow-primary/30">
                      Rp {(parseInt(formData.voucherPrice) || 0).toLocaleString()}
                   </div>
                   <span className="text-[10px] line-through text-[var(--text-muted)] font-bold pb-2">Rp {(parseInt(formData.normalPrice) || 0).toLocaleString()}</span>
                </div>

                 <div className="pt-10 flex flex-col items-center gap-3">
                    <div className="px-5 py-2 rounded-xl bg-primary/5 border border-primary/10">
                       <p className="text-[11px] font-mono font-black text-primary tracking-tighter uppercase shrink-0">KKT-XJ82KF-7B</p>
                    </div>
                    <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] opacity-60">Verified Seal • {formData.expiryDays} hari berlaku</p>
                 </div>
              </div>

              {/* Classic Voucher Cutouts */}
              <div className="absolute top-[60%] -translate-y-1/2 -left-4 size-8 rounded-full bg-[var(--bg-app)] border border-primary/10" />
              <div className="absolute top-[60%] -translate-y-1/2 -right-4 size-8 rounded-full bg-[var(--bg-app)] border border-primary/10" />
           </div>

           {/* Export Options */}
           <div className="mt-12 flex items-center gap-12 opacity-30 group hover:opacity-100 transition-opacity duration-700">
              <div className="flex flex-col items-center gap-3 cursor-help">
                <div className="size-14 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary/5 transition-all"><Printer className="w-5 h-5 text-primary" /></div>
                <span className="text-[9px] font-black uppercase tracking-widest">Thermal 58mm</span>
              </div>
              <div className="flex flex-col items-center gap-3 cursor-help">
                <div className="size-14 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary/5 transition-all"><FileDown className="w-5 h-5 text-primary" /></div>
                <span className="text-[9px] font-black uppercase tracking-widest">PDF Encryption</span>
              </div>
           </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[1000] bg-[var(--secondary)]/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full glass p-12 rounded-[4rem] text-center space-y-8 border-primary/20 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-20 -left-20 size-60 bg-primary/10 rounded-full blur-3xl opacity-50" />
              
              <div className="size-24 bg-primary text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl relative z-10 animate-bounce transition-transform">
                <Check className="w-12 h-12" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-display font-black tracking-tight text-[var(--text-main)] uppercase">Batch Generated!</h2>
                <p className="text-[var(--text-muted)] mt-3 leading-relaxed font-bold">Berhasil menerbitkan {formData.quantity} voucher unik untuk kampanye Anda.</p>
              </div>
              <div className="flex flex-col gap-3 relative z-10">
                <button 
                  onClick={handlePrintTest}
                  disabled={isPrinting}
                  className="btn-primary w-full text-[10px] opacity-70"
                >
                  <Printer className="w-4 h-4 mr-2" /> Cetak 1 Voucher (Test)
                </button>
                <button 
                  onClick={handlePrintAll}
                  disabled={isPrinting}
                  className="btn-primary w-full text-[10px] bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                >
                  <Printer className="w-4 h-4 mr-2" /> {isPrinting ? 'Mencetak...' : `Cetak Semua (${formData.quantity})`}
                </button>
                <button 
                  onClick={() => { setSuccess(false); setStep(1); }}
                  className="w-full py-4 rounded-3xl border border-primary/10 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
                >
                  Kembali ke Factory
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
