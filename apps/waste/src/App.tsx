import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';
import LogWasteModal from './components/LogWasteModal';

const safeNumber = (val: any) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

function App() {
    const [wasteSummary, setWasteSummary] = useState<any>({
        totalValueMonth: 0,
        topOffenders: [],
        status: 'NORMAL'
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.getWasteSummary();
            const data = response?.data || {};
            
            console.log("Waste API response:", response);

            setWasteSummary({
                totalValueMonth: safeNumber(data.totalValueMonth),
                topOffenders: Array.isArray(data.topOffenders) ? data.topOffenders : [],
                status: data.status || "NORMAL"
            });
        } catch (error) {
            console.error('Failed to fetch waste summary', error);
            setWasteSummary({
                totalValueMonth: 0,
                topOffenders: [],
                status: "ERROR"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalWasteValue = safeNumber(wasteSummary?.totalValueMonth);
    const topOffenders = Array.isArray(wasteSummary?.topOffenders) ? wasteSummary.topOffenders : [];

    return (
        <Layout
            currentPort={5182}
            title="Analisis Waste"
            subtitle="Zero Waste Management"
            footer={
                <footer className="glass border-t dark:border-white/5 border-slate-200 px-8 py-10 shrink-0">
                    <button
                        onClick={() => setIsLogModalOpen(true)}
                        className="w-full flex items-center justify-center gap-4 bg-gradient-to-r from-red-500 to-orange-600 dark:text-white dark:text-white text-slate-900 px-10 py-5 rounded-[2rem] shadow-2xl shadow-red-500/20 active:scale-95 transition-all border-none group"
                    >
                        <span className="material-symbols-outlined text-3xl font-black group-hover:rotate-12 transition-transform">delete_sweep</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Input Data Waste</span>
                    </button>
                </footer>
            }
        >
            <div className="space-y-10">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-6 glass rounded-[3rem] opacity-60">
                        <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Menghitung Kerugian Produk...</p>
                    </div>
                ) : (
                    <>
                        {/* Total Waste Metric Card */}
                        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="card group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] p-8">
                                <div className="absolute -right-10 -top-10 opacity-5 transition-transform duration-1000 group-hover:scale-125 group-hover:rotate-12 pointer-events-none text-primary">
                                    <span className="material-symbols-outlined font-black" style={{ fontSize: '240px' }}>delete_outline</span>
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <div className="flex border-b dark:border-white/5 border-slate-200 pb-4 mb-4 justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-sm font-black">warning</span>
                                            <p className="text-[10px] font-black tracking-[0.4em] text-primary uppercase opacity-80">Total Pengeluaran Sia-Sia</p>
                                        </div>
                                        {wasteSummary?.status === 'ERROR' && (
                                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl animate-pulse">
                                                <span className="material-symbols-outlined text-red-500 text-sm font-black">error</span>
                                                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Data tidak tersedia</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-5xl font-black dark:text-white dark:text-white text-slate-900 tracking-tighter uppercase font-display leading-tight">
                                            Rp {totalWasteValue.toLocaleString('id-ID')}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-inner">
                                                <span className="material-symbols-outlined text-[14px] font-black">trending_down</span>
                                                Optimal
                                            </span>
                                            <p className="text-[9px] font-black dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest opacity-40 italic">Bulan Berjalan</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Waste Trend Chart */}
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Tren Kerugian</h3>
                                    <p className="text-xl font-black font-display tracking-tight dark:text-white dark:text-white text-slate-900 uppercase">Historikal 30 Hari</p>
                                </div>
                                <span className="text-[9px] text-primary font-black tracking-widest uppercase bg-primary/10 px-4 py-2 rounded-full border border-primary/20 shadow-inner">
                                    {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="card p-8 group overflow-hidden">
                                 <div className="flex flex-col gap-1 mb-10 relative z-10">
                                    <p className="text-[9px] font-black dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest opacity-60">Estimasi Rata-rata Harian</p>
                                    <p className="text-3xl font-black tracking-tighter text-primary font-display uppercase">Rp {(totalWasteValue / 30).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                                </div>
                                <div className="h-48 w-full relative">
                                    {totalWasteValue > 0 ? (
                                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
                                            <defs>
                                                <linearGradient id="wasteChartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4"></stop>
                                                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"></stop>
                                                </linearGradient>
                                                <filter id="glow">
                                                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                                </filter>
                                            </defs>
                                            <path d="M0 80 Q 20 70, 40 85 T 80 60 T 120 75 T 160 40 T 200 65 T 240 30 T 280 55 T 320 20 T 360 45 T 400 10 L 400 100 L 0 100 Z" fill="url(#wasteChartGradient)" className="animate-pulse duration-[3s]"></path>
                                            <path d="M0 80 Q 20 70, 40 85 T 80 60 T 120 75 T 160 40 T 200 65 T 240 30 T 280 55 T 320 20 T 360 45 T 400 10" fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"></path>
                                        </svg>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                            <div className="w-full h-[1px] dark:bg-white/10 bg-white shadow-md border border-slate-200 relative">
                                                <div className="absolute inset-0 bg-primary/20 blur-sm"></div>
                                            </div>
                                            <p className="text-[9px] font-black text-primary/40 uppercase tracking-[0.3em]">Belum ada aktivitas waste</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between mt-6 text-[8px] dark:text-slate-400 dark:text-slate-400 text-slate-500 font-black uppercase tracking-[0.2em] opacity-40 relative z-10">
                                    <span>Awal Bulan</span><span>Mid Periode</span><span>Minggu Ke-3</span><span>Realtime</span>
                                </div>
                            </div>
                        </section>

                        {/* Top Waste Offenders */}
                        <section className="animate-in fade-in zoom-in duration-1000">
                            <div className="space-y-1 mb-6 px-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Produk Bermasalah</h3>
                                <p className="text-xl font-black font-display tracking-tight dark:text-white dark:text-white text-slate-900 uppercase">Top Waste Offenders</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {topOffenders.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-16 text-center glass rounded-[3rem] border-dashed border-2 opacity-40">
                                        <span className="material-symbols-outlined text-6xl text-primary font-black mb-4">inventory_2</span>
                                        <p className="font-black text-xs uppercase tracking-widest">Optimasi Persediaan Tercapai</p>
                                        <p className="text-[9px] uppercase tracking-widest mt-1 opacity-60">Tidak ada produk dengan pemborosan signifikan</p>
                                    </div>
                                ) : (
                                    topOffenders.map((item: any) => (
                                        <div key={item.id} className="card group p-5 flex items-center justify-between gap-6 transition-all duration-500 hover:scale-[1.01] active:scale-[0.99] dark:border-white/5 border-slate-200">
                                            <div className="flex items-center gap-5 flex-1 min-w-0">
                                                <div className="size-16 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20 shadow-inner group-hover:rotate-6 transition-transform">
                                                    <span className="material-symbols-outlined text-red-500 text-3xl font-black">inventory_2</span>
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    <h4 className="font-black dark:text-white dark:text-white text-slate-900 text-xl font-display tracking-tight uppercase truncate leading-tight group-hover:text-red-500 transition-colors">{item.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-2 py-0.5 rounded border border-primary/20">AKTUAL</span>
                                                        <p className="text-[10px] dark:text-slate-400 dark:text-slate-400 text-slate-500 font-black uppercase tracking-widest opacity-60">{parseFloat(item.currentStock)} {item.unit} Tersisa</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col gap-2 items-end shrink-0">
                                                <p className="text-2xl font-black text-red-500 font-display tracking-tighter uppercase whitespace-nowrap">
                                                    Rp {parseFloat(item.totalWasteValue).toLocaleString('id-ID')}
                                                </p>
                                                <span className="text-[8px] text-red-600 font-black uppercase tracking-[0.3em] bg-red-500/10 px-3 py-1 rounded-lg shadow-inner border border-red-500/20">Critical Alert</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Waste Reasons Breakdown */}
                        <section className="animate-in fade-in duration-1000">
                            <div className="space-y-1 mb-6 px-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Analisis Akar Masalah</h3>
                                <p className="text-xl font-black font-display tracking-tight dark:text-white dark:text-white text-slate-900 uppercase">Penyebab Kerugian</p>
                            </div>
                            <div className="card p-8 space-y-8 overflow-hidden">
                                <div className="space-y-6">
                                    {(wasteSummary?.wasteByReason?.length > 0) ? (
                                        wasteSummary.wasteByReason.map((r: any) => {
                                            const totalCost = safeNumber(wasteSummary.totalValueMonth);
                                            const pct = totalCost > 0 ? Math.round((safeNumber(r.wasteCost) / totalCost) * 100) : 0;
                                            
                                            return (
                                                <div key={r.reason} className="space-y-3 group/item transition-all hover:translate-x-1">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[11px] font-black dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-[0.15em] opacity-80 group-hover/item:text-primary transition-colors">{r.reason || 'Lainnya'}</span>
                                                        <span className="text-sm font-black dark:text-white dark:text-white text-slate-900 font-display tracking-wide">{pct}%</span>
                                                    </div>
                                                    <div className="w-full bg-[var(--bg-app)] h-3 rounded-full overflow-hidden shadow-inner border dark:border-white/5 border-slate-200">
                                                        <div 
                                                            className={`bg-primary shadow-primary/20 h-full rounded-full transition-all duration-1000 ease-out accent-glow`} 
                                                            style={{ width: `${pct}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-10 opacity-40">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Belum ada data penyebab kerugian</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Actionable Recommendations */}
                        <section className="pb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-2xl font-black">lightbulb</span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Smart Recommendations</h3>
                                    <p className="text-xl font-black font-display tracking-tight dark:text-white dark:text-white text-slate-900 uppercase">Saran Perbaikan Stok</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {totalWasteValue > 0 ? (
                                    <>
                                        <div className="card group p-6 flex gap-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 relative overflow-hidden dark:border-white/5 border-slate-200">
                                            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all border border-primary/20 shadow-inner">
                                                <span className="material-symbols-outlined text-primary text-3xl font-black group-hover:rotate-12 transition-transform">analytics</span>
                                            </div>
                                            <div className="flex-1 space-y-2 relative z-10">
                                                <p className="text-lg font-black font-display tracking-tight dark:text-white dark:text-white text-slate-900 uppercase leading-tight group-hover:text-primary transition-colors">Analisis Terdeteksi</p>
                                                <p className="text-[10px] font-bold dark:text-slate-400 dark:text-slate-400 text-slate-500 leading-relaxed uppercase tracking-widest opacity-60">Sistem mendeteksi adanya pemborosan. Tinjau stok barang dengan rasio waste tertinggi di tabel atas.</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-12 text-center glass rounded-[3rem] opacity-40 border-dashed border-2">
                                        <p className="font-black text-[10px] uppercase tracking-widest">Belum ada saran</p>
                                        <p className="text-[9px] uppercase tracking-widest mt-1">Saran akan muncul otomatis saat data waste terdeteksi</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </div>

            <LogWasteModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                onSaved={() => {
                    apiClient.getWasteSummary().then(setWasteSummary).catch(console.error);
                }}
            />
        </Layout>
    );
}

export default App;

