import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';

export default function App() {
    const [financeData, setFinanceData] = useState({
        revenue: 0,
        expenses: 0,
        netProfit: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await apiClient.getFinanceReports();
                setFinanceData({
                    revenue: data.revenue || 0,
                    expenses: data.expenses || 0,
                    netProfit: data.netProfit || 0
                });
            } catch (error) {
                console.error("Failed to load finance reports", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReports();
    }, []);

    const { revenue, expenses, netProfit } = financeData;
    const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(0) : 0;

    const ReportsSidebar = (
        <div className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
            <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                    <span className="material-symbols-outlined text-primary text-sm font-black">calendar_month</span>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Periode Laporan</p>
                </div>
                <div className="space-y-4">
                    <div className="glass p-5 rounded-2xl border-[var(--border-dim)] shadow-inner">
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-60">Dari Tanggal</p>
                        <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">01 Maret 2024</p>
                    </div>
                    <div className="glass p-5 rounded-2xl border-[var(--border-dim)] shadow-inner">
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-60">Hingga Tanggal</p>
                        <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">31 Maret 2024</p>
                    </div>
                    <button className="btn-primary w-full py-4 rounded-2xl text-[10px] uppercase font-black tracking-widest shadow-primary/20 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-lg">sync_alt</span>
                        Terapkan Filter
                    </button>
                </div>
            </div>

            <div className="mt-10 pt-10 border-t border-[var(--border-dim)] space-y-4">
                 <button className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl glass border-primary/40 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all active:scale-95">
                    <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                    Ekspor PDF
                </button>
                <button className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-lg font-black">table_view</span>
                    Ekspor Excel
                </button>
            </div>
        </div>
    );

    const ReportsFooter = (
        <footer className="glass border-t border-white/5 p-8 shrink-0 flex gap-4 lg:hidden">
            <button className="flex-1 flex items-center justify-center gap-3 glass border-primary/40 text-primary font-black py-5 rounded-[1.5rem] active:scale-95 transition-all text-xs uppercase tracking-widest shadow-xl">
                <span className="material-symbols-outlined">picture_as_pdf</span>
                PDF
            </button>
            <button className="flex-1 flex items-center justify-center gap-3 bg-emerald-500 text-slate-950 font-black py-5 rounded-[1.5rem] shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all border-none text-xs uppercase tracking-widest">
                <span className="material-symbols-outlined font-black">table_view</span>
                Excel
            </button>
        </footer>
    );

    return (
        <Layout
            currentPort={5175}
            title="Laporan"
            sidebar={ReportsSidebar}
            footer={ReportsFooter}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                {isLoading ? (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center gap-6 glass rounded-[3rem]">
                        <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Menghitung Laba Rugi...</p>
                    </div>
                ) : (
                    <>
                        <div className="card relative overflow-hidden group">
                            <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Total Pemasukan</p>
                                        <h2 className="text-4xl font-black font-display tracking-tighter text-[var(--text-main)] uppercase">
                                            Rp {((revenue || 0) / 1000).toLocaleString('id-ID')}k
                                        </h2>
                                    </div>
                                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                        <span className="material-symbols-outlined text-3xl font-black">analytics</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-500/10 w-fit px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                    <span className="material-symbols-outlined text-sm font-black">trending_up</span>
                                    +12.5% vs bulan lalu
                                </div>
                            </div>
                        </div>

                        <div className="card accent-gradient text-slate-950 border-none shadow-2xl shadow-primary/30 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 size-64 bg-white/10 rounded-full blur-[60px] -mr-24 -mt-24"></div>
                            <div className="relative z-10 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] opacity-80">Profit Bersih (Net)</p>
                                        <h2 className="text-4xl font-black font-display tracking-tighter uppercase">
                                            Rp {((netProfit || 0) / 1000).toLocaleString('id-ID')}k
                                        </h2>
                                    </div>
                                    <div className="size-14 rounded-2xl bg-slate-900/10 flex items-center justify-center text-slate-950 shadow-inner">
                                        <span className="material-symbols-outlined text-3xl font-black">account_balance_wallet</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-950 font-black text-[10px] uppercase tracking-widest bg-slate-950/10 w-fit px-3 py-1.5 rounded-lg border border-slate-950/20">
                                    <span className="material-symbols-outlined text-sm font-black">payments</span>
                                    Margin {margin}% Akumulasi
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in zoom-in duration-1000">
                <div className="card relative overflow-hidden space-y-10 group">
                    <div className="flex items-center justify-between relative z-10">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black font-display tracking-tight uppercase">Segmentasi Penjualan</h3>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] opacity-80">Distribusi pendapatan per kategori</p>
                        </div>
                        <div className="size-12 rounded-2xl glass flex items-center justify-center text-primary border-white/5">
                            <span className="material-symbols-outlined font-black">donut_large</span>
                        </div>
                    </div>

                    <div className="space-y-8 relative z-10">
                        {[
                            { label: 'Kopi & Espresso', val: 'Rp 22,180k', color: 'bg-primary shadow-primary/20', w: 'w-[57%]' },
                            { label: 'Teh & Non-Kopi', val: 'Rp 8,540k', color: 'bg-amber-500 shadow-amber-500/20', w: 'w-[22%]' },
                            { label: 'Makanan & Snack', val: 'Rp 8,200k', color: 'bg-slate-400 shadow-slate-400/20', w: 'w-[21%]' }
                        ].map((item, id) => (
                            <div key={id} className="space-y-3 group/item transition-all hover:translate-x-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-3 rounded-full ${item.color} shadow-lg`}></div>
                                        <span className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] opacity-80 group-hover/item:text-primary transition-colors">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-black text-[var(--text-main)] font-display tracking-wide">{item.val}</span>
                                </div>
                                <div className="w-full bg-[var(--bg-app)] h-2.5 rounded-full overflow-hidden shadow-inner border border-white/5">
                                    <div className={`${item.color} h-full ${item.w} rounded-full transition-all duration-1000 accent-glow`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    <section className="card group relative overflow-hidden transition-all duration-500 hover:border-red-500/20">
                        <div className="absolute top-0 right-0 size-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">Biaya Operasional</h3>
                                <p className="text-3xl font-black font-display tracking-tighter text-[var(--text-main)] uppercase">Rp {(expenses).toLocaleString('id-ID')}</p>
                            </div>
                            <div className="size-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl font-black">receipt_long</span>
                            </div>
                        </div>
                        <div className="glass p-4 rounded-xl border-white/5 opacity-80">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-relaxed">Seluruh biaya bahan baku, utilitas, dan upah karyawan disinkronisasi otomatis dari Kerabat Cloud.</p>
                        </div>
                    </section>
                </div>
            </div>
        </Layout>
    );
}



