import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';

const safeNumber = (val: any) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

export default function WasteAnalysis({ setTab }: { setTab: (tab: 'pnl' | 'waste') => void }) {
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date().toISOString().substring(0, 10)
    });

    const [wasteData, setWasteData] = useState<{
        totalWasteQty: number,
        totalWasteCost: number,
        wasteRatio: number,
        status: string,
        wasteByReason: any[],
        breakdownByInventory: any[]
    }>({
        totalWasteQty: 0,
        totalWasteCost: 0,
        wasteRatio: 0,
        status: 'NORMAL',
        wasteByReason: [],
        breakdownByInventory: []
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.getWasteAnalysis(dateRange);
            const report = response?.data || {};

            console.log("Waste Analysis API response:", response);

            setWasteData({
                totalWasteQty: safeNumber(report.totalWasteQty),
                totalWasteCost: safeNumber(report.totalWasteCost),
                wasteRatio: safeNumber(report.wasteRatio),
                status: report.status || "UNKNOWN",
                wasteByReason: Array.isArray(report.wasteByReason) ? report.wasteByReason : [],
                breakdownByInventory: Array.isArray(report.breakdownByInventory) ? report.breakdownByInventory : []
            });
        } catch (error) {
            console.error("Failed to load waste analysis", error);
            setWasteData({
                totalWasteQty: 0,
                totalWasteCost: 0,
                wasteRatio: 0,
                status: "NO_DATA",
                wasteByReason: [],
                breakdownByInventory: []
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const { totalWasteQty, totalWasteCost, wasteRatio, status, wasteByReason, breakdownByInventory } = wasteData;
    
    const isCritical = status === 'CRITICAL';
    const isWarning = status === 'WARNING';
    const accentColor = isCritical ? 'red-500' : (isWarning ? 'amber-500' : 'emerald-500');
    const textStatus = isCritical ? 'KRITIS (>20%)' : (isWarning ? 'PERINGATAN (>10%)' : 'NORMAL (Aman)');

    const Sidebar = (
        <div className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
            <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                    <span className="material-symbols-outlined text-primary text-sm font-black">calendar_month</span>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Periode Analisis</p>
                </div>
                <div className="space-y-4">
                    <div className="glass p-5 rounded-2xl border-[var(--border-dim)] shadow-inner">
                        <p className="text-[9px] font-black dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-2 opacity-60">Dari Tanggal</p>
                        <input 
                            type="date"
                            value={dateRange.startDate}
                            onChange={e => setDateRange({...dateRange, startDate: e.target.value})}
                            className="bg-transparent border-none outline-none text-sm font-black dark:text-white dark:text-white text-slate-900 w-full font-display uppercase"
                        />
                    </div>
                    <div className="glass p-5 rounded-2xl border-[var(--border-dim)] shadow-inner">
                        <p className="text-[9px] font-black dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-2 opacity-60">Hingga Tanggal</p>
                        <input 
                            type="date"
                            value={dateRange.endDate}
                            onChange={e => setDateRange({...dateRange, endDate: e.target.value})}
                            className="bg-transparent border-none outline-none text-sm font-black dark:text-white dark:text-white text-slate-900 w-full font-display uppercase"
                        />
                    </div>
                    <button onClick={fetchReports} className="btn-primary w-full py-4 rounded-2xl text-[10px] uppercase font-black tracking-widest shadow-primary/20 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-lg">sync_alt</span>
                        Terapkan Filter
                    </button>
                    {isLoading && (
                        <p className="text-[9px] text-center font-black text-primary uppercase tracking-widest animate-pulse mt-2">Menghitung Data Asli...</p>
                    )}
                </div>
            </div>

            <div className="pt-10 border-t dark:border-white/5 border-slate-200">
                <button 
                    onClick={() => setTab('pnl')}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl glass border-primary/40 text-[var(--text-main)] font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 transition-all"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Kembali ke Laba Rugi
                </button>
            </div>
        </div>
    );

    return (
        <Layout
            currentPort={5175}
            title="Analisis Pemborosan"
            sidebar={Sidebar}
            subtitle="Deteksi kerugian bahan baku (Waste) dan rasio inefisiensi"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="card relative overflow-hidden group">
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Total Pemborosan</p>
                                <h2 className="text-4xl font-black font-display tracking-tighter dark:text-white dark:text-white text-slate-900 uppercase">
                                    {totalWasteQty} Unit
                                </h2>
                            </div>
                            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                <span className="material-symbols-outlined text-3xl font-black">recycling</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card relative overflow-hidden group">
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Estimasi Kerugian</p>
                                <h2 className="text-4xl font-black font-display tracking-tighter dark:text-white dark:text-white text-slate-900 uppercase">
                                    Rp {(totalWasteCost / 1000).toLocaleString('id-ID')}k
                                </h2>
                            </div>
                            <div className="size-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                                <span className="material-symbols-outlined text-3xl font-black">money_off</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`card bg-gradient-to-br from-${accentColor}/10 to-transparent border border-${accentColor}/20 relative overflow-hidden group`}>
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className={`text-[10px] font-black text-${accentColor} uppercase tracking-[0.3em]`}>Status Rasio: {textStatus}</p>
                                <h2 className={`text-4xl font-black font-display tracking-tighter text-${accentColor} uppercase`}>
                                    {wasteRatio.toFixed(1)}%
                                </h2>
                            </div>
                            <div className={`size-14 rounded-2xl bg-${accentColor}/20 flex items-center justify-center text-${accentColor} shadow-inner`}>
                                <span className="material-symbols-outlined text-3xl font-black">{isCritical ? 'warning' : 'info'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8 animate-in fade-in zoom-in duration-1000">
                <div className="card space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">pie_chart</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black font-display uppercase tracking-tight">Alasan Pembuangan</h3>
                            <p className="text-[10px] dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest">Kategori penyebab waste</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {wasteByReason.length === 0 ? <p className="text-xs dark:text-slate-400 dark:text-slate-400 text-slate-500">Data tidak ada</p> : null}
                        {wasteByReason.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center glass p-4 rounded-xl border dark:border-white/5 border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-sm">report</span>
                                    </div>
                                    <span className="text-xs font-black uppercase dark:text-white dark:text-white text-slate-900">{item.reason}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">Rp {safeNumber(item.wasteCost).toLocaleString('id-ID')}</p>
                                    <p className="text-[10px] dark:text-slate-400 dark:text-slate-400 text-slate-500">{safeNumber(item.wasteQty)} Unit</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">bar_chart</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black font-display uppercase tracking-tight">Top Bahan Terbuang</h3>
                            <p className="text-[10px] dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest">Item dengan kerugian tertinggi</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {breakdownByInventory.length === 0 ? <p className="text-xs dark:text-slate-400 dark:text-slate-400 text-slate-500">Data tidak ada</p> : null}
                        {breakdownByInventory.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center glass p-4 rounded-xl border dark:border-white/5 border-slate-200">
                                <span className="text-xs font-black uppercase dark:text-white dark:text-white text-slate-900">{item.name}</span>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-red-400">Rp {safeNumber(item.wasteCost).toLocaleString('id-ID')}</p>
                                    <p className="text-[10px] dark:text-slate-400 dark:text-slate-400 text-slate-500">- {safeNumber(item.wasteQty)} dibuang</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
