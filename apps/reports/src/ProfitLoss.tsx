import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';

const safeNumber = (val: any) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

export default function ProfitLoss({ setTab }: { setTab: (tab: 'pnl' | 'waste') => void }) {
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date().toISOString().substring(0, 10)
    });

    const [financeData, setFinanceData] = useState<{
        revenue: number,
        totalHPP: number,
        expenses: number,
        grossProfit: number,
        netProfit: number,
        status: string,
        breakdown: any[]
    }>({
        revenue: 0,
        totalHPP: 0,
        expenses: 0,
        grossProfit: 0,
        netProfit: 0,
        status: 'BREAK_EVEN',
        breakdown: []
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.getProfitLossReport(dateRange);
            const report = response?.data || {};
            
            console.log("Profit Loss API response:", response);

            setFinanceData({
                revenue: safeNumber(report.revenue),
                totalHPP: safeNumber(report.totalHPP),
                expenses: safeNumber(report.totalExpenses),
                grossProfit: safeNumber(report.grossProfit),
                netProfit: safeNumber(report.netProfit),
                status: report.status || "UNKNOWN",
                breakdown: Array.isArray(report.breakdown) ? report.breakdown : []
            });
        } catch (error) {
            console.error("Failed to load finance reports", error);
            setFinanceData({
                revenue: 0,
                totalHPP: 0,
                expenses: 0,
                grossProfit: 0,
                netProfit: 0,
                status: "NO_DATA",
                breakdown: []
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const { revenue, totalHPP, expenses, grossProfit, netProfit, status, breakdown } = financeData;
    
    // Status colors
    const isLoss = status === 'LOSS';
    const accentColor = isLoss ? 'red-500' : 'emerald-500';
    const accentGradientClass = isLoss ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30' : 'accent-gradient shadow-primary/30';
    const textStatus = isLoss ? 'RUGI (LOSS)' : (status === 'PROFIT' ? 'Laba (PROFIT)' : 'BREAK EVEN');

    const ReportsSidebar = (
        <div className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
            <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                    <span className="material-symbols-outlined text-primary text-sm font-black">calendar_month</span>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Periode Laporan P&L</p>
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
                        <p className="text-[9px] text-center font-black text-primary uppercase tracking-widest animate-pulse mt-2">Menghitung Data Real...</p>
                    )}
                </div>
            </div>

            <div className="pt-10 border-t dark:border-white/5 border-slate-200">
                <button 
                    onClick={() => setTab('waste')}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl glass border-primary/40 text-[var(--text-main)] font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 transition-all"
                >
                    <span className="material-symbols-outlined text-lg">delete_sweep</span>
                    Buka Analisis Waste
                </button>
            </div>
        </div>
    );

    return (
        <Layout
            currentPort={5175}
            title="Laba Rugi (P&L)"
            sidebar={ReportsSidebar}
            subtitle="Ringkasan Pendapatan & Pengeluaran Berdasarkan Transaksi Asli"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Total Pendapatan (Kotor)</p>
                                <h2 className="text-4xl font-black font-display tracking-tighter dark:text-white dark:text-white text-slate-900 uppercase">
                                    Rp {(revenue / 1000).toLocaleString('id-ID')}k
                                </h2>
                            </div>
                            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                <span className="material-symbols-outlined text-3xl font-black">point_of_sale</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 size-64 bg-amber-500/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">HPP Keseluruhan</p>
                                <h2 className="text-4xl font-black font-display tracking-tighter dark:text-white dark:text-white text-slate-900 uppercase">
                                    Rp {(totalHPP / 1000).toLocaleString('id-ID')}k
                                </h2>
                            </div>
                            <div className="size-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                                <span className="material-symbols-outlined text-3xl font-black">inventory_2</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 size-64 bg-slate-500/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-[0.3em]">Pengeluaran Operasional</p>
                                <h2 className="text-4xl font-black font-display tracking-tighter dark:text-white dark:text-white text-slate-900 uppercase">
                                    Rp {(expenses / 1000).toLocaleString('id-ID')}k
                                </h2>
                            </div>
                            <div className="size-14 rounded-2xl bg-slate-500/10 flex items-center justify-center dark:text-slate-400 dark:text-slate-400 text-slate-500 shadow-inner">
                                <span className="material-symbols-outlined text-3xl font-black">receipt_long</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`card ${accentGradientClass} dark:text-white dark:text-white text-slate-900 border-none shadow-2xl relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 size-64 dark:bg-white/10 bg-white shadow-md border border-slate-200 rounded-full blur-[60px] -mr-24 -mt-24"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black dark:text-white dark:text-white text-slate-900/80 uppercase tracking-[0.3em]">{textStatus}</p>
                                <h2 className="text-4xl font-black font-display tracking-tighter uppercase">
                                    Rp {(netProfit / 1000).toLocaleString('id-ID')}k
                                </h2>
                            </div>
                            <div className={`size-14 rounded-2xl bg-white/20 flex items-center justify-center dark:text-white dark:text-white text-slate-900 shadow-inner`}>
                                <span className="material-symbols-outlined text-3xl font-black">account_balance_wallet</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest dark:bg-black bg-white/20 w-fit px-3 py-1.5 rounded-lg border border-black/10">
                            Profit Kotor: Rp {grossProfit.toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Table */}
            <div className="card p-0 overflow-hidden dark:border-white/5 border-slate-200 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="p-6 border-b dark:border-white/5 border-slate-200 flex items-center gap-4 bg-white/[0.02]">
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <span className="material-symbols-outlined font-black">list_alt</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-black font-display tracking-tight dark:text-white dark:text-white text-slate-900 uppercase">Rincian Performa Produk</h3>
                        <p className="text-[10px] font-bold dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest mt-1 opacity-60">Analisis margin HPP dan volume per item terjual</p>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b dark:border-white/5 border-slate-200">
                                <th className="p-5 text-[10px] font-black dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest">Produk</th>
                                <th className="p-5 text-[10px] font-black dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest text-center">Terjual</th>
                                <th className="p-5 text-[10px] font-black dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest text-right">Revenue</th>
                                <th className="p-5 text-[10px] font-black text-amber-500 uppercase tracking-widest text-right">Total HPP</th>
                                <th className="p-5 text-[10px] font-black text-primary uppercase tracking-widest text-right">Profit Produk</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {breakdown.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-xs font-bold dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest opacity-60">Tidak ada transaksi di rentang tanggal ini</td>
                                </tr>
                            ) : (
                                breakdown.map((item: any, i: number) => {
                                    const prof = safeNumber(item.profit);
                                    const isItemLoss = prof < 0;
                                    return (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-5">
                                                <p className="text-xs font-black dark:text-white dark:text-white text-slate-900 uppercase">{item.name}</p>
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className="text-xs font-black font-display">{safeNumber(item.totalSold)}</span>
                                            </td>
                                            <td className="p-5 text-right font-display text-sm font-bold dark:text-white dark:text-white text-slate-900">
                                                Rp {safeNumber(item.revenue).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-5 text-right font-display text-sm font-bold text-amber-500/80">
                                                Rp {safeNumber(item.totalHPP).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-5 text-right">
                                                <p className={`text-sm font-black font-display ${isItemLoss ? 'text-red-500' : 'text-primary'}`}>
                                                    Rp {prof.toLocaleString('id-ID')}
                                                </p>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}



