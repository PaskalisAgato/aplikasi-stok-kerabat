import React, { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';

function App() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getAnalyticsDashboard();
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const summary = data?.summary || {};
  const monitoring = data?.monitoring || { activeShifts: [], riskIndicator: {} };
  const ranking = data?.ranking || [];

  return (
    <Layout currentPort={5173} title="Owner Dashboard" subtitle="Real-time Business Control">
      {isLoading && !data ? (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
           <span className="material-symbols-outlined text-primary text-5xl mb-4">monitoring</span>
           <p className="text-xs font-black uppercase tracking-widest text-primary">Memuat Analisis Real-time...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* A. DAILY SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <SummaryCard title="Total Revenue" value={summary.revenue} icon="payments" color="text-primary" />
            <SummaryCard title="Cash in Drawer" value={summary.cash} icon="account_balance_wallet" color="text-emerald-500" />
            <SummaryCard title="Non-Cash (QRIS/EDC)" value={summary.nonCash} icon="qr_code_2" color="text-blue-500" />
            <SummaryCard title="Operational Exp" value={summary.expenses} icon="shopping_bag" color="text-red-500" />
            <SummaryCard title="Net Profit (Gross)" value={summary.grossProfit} icon="trending_up" color="text-primary" isHighlight />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* B. SHIFT MONITORING & RISK */}
            <div className="lg:col-span-8 space-y-6">
              <div className="card-glass border border-white/5 p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black uppercase tracking-widest text-xs opacity-60">Status Shift Aktif</h3>
                  {monitoring.riskIndicator.fraudAlarms > 0 && (
                     <div className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse flex items-center gap-1">
                       <span className="material-symbols-outlined text-xs">warning</span>
                       {monitoring.riskIndicator.fraudAlarms} FRAUD DETECTED
                     </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {monitoring.activeShifts.length === 0 ? (
                    <div className="text-center py-10 opacity-30 text-[10px] uppercase font-black tracking-widest">Tidak ada shift aktif</div>
                  ) : monitoring.activeShifts.map((s) => (
                    <div key={s.id} className="flex items-center justify-between bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all">
                       <div className="flex items-center gap-4">
                         <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                           <span className="material-symbols-outlined">person</span>
                         </div>
                         <div>
                           <p className="font-black text-white uppercase text-xs">{s.cashier}</p>
                           <p className="text-[10px] text-[var(--text-muted)]">Mulai: {new Date(s.startTime).toLocaleTimeString()}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="text-[10px] font-bold text-primary">Rp {parseFloat(s.initialCash).toLocaleString()} (Modal)</p>
                         <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">Online</span>
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RISK INDICATORS (RED FLAGS) */}
              {(monitoring.riskIndicator.fraudAlarms > 0) && (
                <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-3xl space-y-4">
                    <h3 className="text-red-500 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined">report</span>
                      Indikator Risiko Kritis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {monitoring.riskIndicator.fraudAlarms > 0 && (
                        <div className="bg-red-500 p-4 rounded-2xl text-white">
                          <p className="text-[10px] font-black uppercase opacity-80">Alat Deteksi Fraud</p>
                          <p className="text-xl font-black">{monitoring.riskIndicator.fraudAlarms} Upaya Manipulasi Harga</p>
                          <p className="text-[9px] font-medium mt-1">Sistem otomatis memblokir transaksi ini.</p>
                        </div>
                      )}
                    </div>
                </div>
              )}
            </div>

            {/* C. CASHIER PERFORMANCE RANKING */}
            <div className="lg:col-span-4 card-glass border border-white/5 p-6 rounded-3xl">
              <h3 className="font-black uppercase tracking-widest text-xs opacity-60 mb-6">Peringkat Kasir</h3>
              <div className="space-y-4">
                {ranking.map((c, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-black ${i === 0 ? 'text-primary' : 'opacity-20'}`}># {i + 1}</span>
                      <div>
                        <p className="text-[11px] font-black text-white uppercase">{c.name}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-bold">{c.voidCount} Void</p>
                      </div>
                    </div>
                    <p className="text-xs font-black text-white">Rp {parseFloat(c.salesVolume).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </Layout>
  );
}

function SummaryCard({ title, value, icon, color, isHighlight }) {
  return (
    <div className={`p-5 rounded-3xl border transition-all ${isHighlight ? 'bg-primary shadow-2xl shadow-primary/20 border-primary text-slate-950' : 'bg-white/5 border-white/5 text-white hover:bg-white/10'}`}>
      <div className="flex justify-between items-start mb-4">
        <span className={`material-symbols-outlined ${isHighlight ? 'text-slate-900' : color} text-2xl opacity-80`}>{icon}</span>
        {isHighlight && <div className="text-[8px] font-black uppercase bg-slate-950/20 px-1.5 py-0.5 rounded">UTAMA</div>}
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest ${isHighlight ? 'text-slate-950/60' : 'opacity-40'}`}>{title}</p>
        <p className={`text-lg font-black tracking-tight mt-1 ${isHighlight ? 'text-slate-950' : 'text-white'}`}>
           <span className="text-[10px] mr-0.5">Rp</span>
           {parseFloat(value || 0).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default App;
