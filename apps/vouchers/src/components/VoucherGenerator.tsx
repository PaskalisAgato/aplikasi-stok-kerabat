import React, { useState } from 'react';
import { 
  Plus, 
  ChevronRight, 
  Layers, 
  Calendar, 
  DollarSign, 
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

export const VoucherGenerator = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
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
    { id: '1', name: 'Black Minimalist', usage: 'High' },
    { id: '2', name: 'Cafe Modern Style', usage: 'Medium' },
    { id: '3', name: 'Weekend Special', usage: 'New' }
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vouchers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity)
        })
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
      } else {
        alert('Generation failed: ' + json.message);
      }
    } catch (e) {
      alert('Network error connecting to Marketing Factory.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-center gap-12 mb-16">
        {[
          { step: 1, label: 'Promotional Data' },
          { step: 2, label: 'Select Template' },
          { step: 3, label: 'Preview & Fire' }
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-3">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
               step >= s.step ? 'bg-white text-black ring-4 ring-white/10' : 'bg-white/5 text-white/20'
             }`}>
               {step > s.step ? <Check className="w-4 h-4" /> : s.step}
             </div>
             <span className={`text-xs font-black uppercase tracking-widest ${
               step >= s.step ? 'text-white' : 'text-white/20'
             }`}>{s.label}</span>
             {s.step < 3 && <div className="w-12 h-[1px] bg-white/5 ml-4" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Form Side */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Promo Campaign Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ramadhan Coffee Fest"
                    className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl focus:outline-none focus:border-white/20 transition-all font-outfit"
                    value={formData.promoName}
                    onChange={e => setFormData({...formData, promoName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Product / Menu</label>
                  <div className="relative">
                    <Package className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="text" 
                      placeholder="Product to highlight"
                      className="w-full bg-white/5 border border-white/5 p-5 pl-14 rounded-2xl focus:outline-none focus:border-white/20 transition-all"
                      value={formData.menuName}
                      onChange={e => setFormData({...formData, menuName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Normal Price</label>
                    <div className="relative">
                       <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 text-sm font-bold">Rp</span>
                       <input 
                        type="number" 
                        className="w-full bg-white/5 border border-white/5 p-5 pl-12 rounded-2xl focus:outline-none focus:border-white/20"
                        value={formData.normalPrice}
                        onChange={e => setFormData({...formData, normalPrice: e.target.value})}
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Voucher Price</label>
                    <div className="relative">
                       <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 text-sm font-bold">Rp</span>
                       <input 
                        type="number" 
                        className="w-full bg-white/5 border border-white/5 p-5 pl-12 rounded-2xl focus:outline-none focus:border-white/20"
                        value={formData.voucherPrice}
                        onChange={e => setFormData({...formData, voucherPrice: e.target.value})}
                       />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Batch Quantity</label>
                    <input 
                      type="number" 
                      className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl focus:outline-none focus:border-white/20 text-center font-mono text-xl"
                      value={formData.quantity}
                      onChange={e => setFormData({...formData, quantity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Validity (Days)</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <input 
                        type="number" 
                        className="w-full bg-white/5 border border-white/5 p-5 pl-14 rounded-2xl focus:outline-none focus:border-white/20"
                        value={formData.expiryDays}
                        onChange={e => setFormData({...formData, expiryDays: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className="w-full py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5"
                >
                  Continue to Templates
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
                <div className="grid grid-cols-1 gap-4">
                  {templates.map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => setFormData({...formData, templateId: t.id})}
                      className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all flex items-center justify-between group ${
                        formData.templateId === t.id ? 'border-white bg-white/10' : 'border-white/5 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-3xl transition-colors ${
                          formData.templateId === t.id ? 'bg-white text-black' : 'bg-white/5 text-white/30 group-hover:text-white'
                        }`}>
                          <Layers className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{t.name}</p>
                          <p className="text-xs text-white/30">Usage: <span className="text-white/60">{t.usage}</span></p>
                        </div>
                      </div>
                      {formData.templateId === t.id && (
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black">
                           <Check className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 py-5 glass rounded-[2rem] font-bold uppercase tracking-widest text-xs opacity-40 hover:opacity-100 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setStep(3)}
                    disabled={!formData.templateId}
                    className="flex-[2] py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20"
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
                <div className="p-8 rounded-[3rem] glass space-y-6">
                   <div className="flex items-center gap-4 text-white/40 font-bold uppercase tracking-widest text-[10px]">
                     <Zap className="w-4 h-4 text-indigo-400" /> Confirm Batch Details
                   </div>
                   
                   <div className="space-y-4">
                     <div className="flex justify-between border-b border-white/5 py-3">
                       <span className="text-sm opacity-40">Campaign</span>
                       <span className="text-sm font-bold">{formData.promoName || 'Unnamed'}</span>
                     </div>
                     <div className="flex justify-between border-b border-white/5 py-3">
                       <span className="text-sm opacity-40">Total Quantity</span>
                       <span className="text-sm font-mono font-bold">{formData.quantity} Units</span>
                     </div>
                     <div className="flex justify-between border-b border-white/5 py-3">
                       <span className="text-sm opacity-40">Estimated Budget Value</span>
                       <span className="text-sm font-bold">Rp {parseInt(formData.quantity) * (parseInt(formData.normalPrice) - parseInt(formData.voucherPrice)) || 0}</span>
                     </div>
                   </div>

                   <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-3 italic text-[11px] text-white/40 text-center justify-center">
                     <AlertCircle className="w-4 h-4" /> This action cannot be undone once vouchers are generated.
                   </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(2)}
                    className="flex-1 py-5 glass rounded-[2rem] font-bold uppercase tracking-widest text-xs opacity-40 hover:opacity-100 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex-[2] py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    {loading ? 'Generating...' : 'Fire Batch'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Preview Side */}
        <div className="flex flex-col items-center">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">Real-time Preview</p>
           
           <div className="w-[320px] aspect-[1/2] bg-[#111] rounded-[3rem] border border-white/10 shadow-[0_0_80px_rgba(255,255,255,0.05)] relative overflow-hidden flex flex-col p-8">
              <div className="absolute top-0 right-0 p-8">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-2xl">
                  <QrCode className="w-10 h-10 text-black opacity-80" />
                </div>
              </div>

              <div className="mt-auto space-y-6">
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Special Offer</p>
                  <h3 className="text-xl font-outfit font-black leading-tight truncate">
                    {formData.promoName || 'Promo Name'}
                  </h3>
                </div>

                <div className="h-[1px] bg-white/10 w-full" />

                <div>
                   <p className="text-[10px] text-white/40 mb-1">Valid for:</p>
                   <p className="text-sm font-bold text-white/80">{formData.menuName || 'All Menus'}</p>
                </div>

                <div className="flex items-end gap-3">
                   <div className="bg-white text-black px-4 py-2 rounded-xl text-lg font-black font-outfit shadow-xl">
                      Rp {formData.voucherPrice || '0'}
                   </div>
                   <span className="text-[10px] line-through text-white/20 pb-2">Rp {formData.normalPrice || '0'}</span>
                </div>

                 <div className="pt-8 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-mono text-white/40 bg-white/5 px-3 py-1 rounded-full uppercase tracking-tighter">KKT-XJ82KF-7B</p>
                    <p className="text-[7px] text-white/20 uppercase tracking-widest">Signed & Encrypted • {formData.expiryDays} days validity</p>
                 </div>
              </div>

              {/* Decorative side cutouts for voucher look */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-8 rounded-full bg-[#050505] border border-white/5" />
              <div className="absolute top-1/2 -translate-y-1/2 -right-4 w-8 h-8 rounded-full bg-[#050505] border border-white/5" />
           </div>

           {/* Thermal Print Toggle Placeholder */}
           <div className="mt-12 flex items-center gap-8 opacity-20">
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 rounded-full border border-white/10"><Printer className="w-6 h-6" /></div>
                <span className="text-[8px] font-bold uppercase tracking-widest">Thermal 58mm</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 rounded-full border border-white/10"><FileDown className="w-6 h-6" /></div>
                <span className="text-[8px] font-bold uppercase tracking-widest">PDF Export</span>
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
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full glass p-10 rounded-[4rem] text-center space-y-8 border-white/20 shadow-[0_0_100px_rgba(255,255,255,0.1)]"
            >
              <div className="w-24 h-24 bg-white text-black rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce">
                <Check className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-3xl font-outfit font-black tracking-tight">Batch Generated!</h2>
                <p className="text-white/40 mt-3 leading-relaxed">Successfully minted {formData.quantity} unique vouchers for your campaign.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button className="w-full py-4 bg-white text-black rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" /> Print Thermal Test
                </button>
                <button 
                  onClick={() => { setSuccess(false); setStep(1); }}
                  className="w-full py-4 glass text-white/60 hover:text-white rounded-3xl font-bold uppercase tracking-widest text-xs transition-all"
                >
                  Return to Factory
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
