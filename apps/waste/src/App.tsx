import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import NavDrawer from '@shared/NavDrawer';

function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [wasteSummary, setWasteSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const summary = await apiClient.getWasteSummary();
                setWasteSummary(summary);
            } catch (error) {
                console.error('Failed to fetch waste summary', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalWasteValue = wasteSummary?.totalValueMonth || 0;
    const topOffenders = wasteSummary?.topOffenders || [];

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen pb-24 antialiased">
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl border-x border-slate-800/10 dark:border-slate-800/30 overflow-x-hidden">

                {/* Hamburger Drawer Overlay */}
                <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5182} />

                {/* Header */}
                <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 px-4 py-4 flex items-center gap-2">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors active:scale-95 text-primary shrink-0"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold tracking-tight">Analisis Pemborosan</h1>
                    </div>
                </header>

                <main className="p-4 space-y-6 flex-1">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
                        </div>
                    ) : (
                        <>
                            {/* Total Waste Metric Card */}
                            <section>
                                <div className="bg-primary/10 dark:bg-primary/5 border border-primary/20 rounded-2xl p-5 relative overflow-hidden shadow-sm group">
                                    <div className="absolute -right-4 -top-4 opacity-10 dark:opacity-5 transition-transform duration-700 group-hover:scale-110 pointer-events-none">
                                        <span className="material-symbols-outlined text-[140px] text-primary">delete_outline</span>
                                    </div>
                                    <p className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400">Total Pemborosan Bulan Ini</p>
                                    <div className="mt-2.5 flex items-baseline gap-2.5">
                                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                                            Rp {totalWasteValue.toLocaleString('id-ID')}
                                        </h2>
                                        <span className="text-emerald-600 dark:text-emerald-500 text-[13px] font-bold flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                            <span className="material-symbols-outlined text-[16px]">trending_down</span>
                                            Healthy
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-500 mt-2">Dihitung dari log stock movement 'WASTE'</p>
                                </div>
                            </section>

                            {/* Waste Trend Chart */}
                            <section>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h3 className="text-base font-bold tracking-tight">Tren Pemborosan (30 Hari)</h3>
                                    <span className="text-xs text-primary font-bold tracking-tight bg-primary/10 px-2 py-1 rounded-md">
                                        {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-5 shadow-sm">
                                    <div className="flex flex-col gap-1 mb-5">
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rata-rata Harian Est.</p>
                                        <p className="text-2xl font-extrabold tracking-tight">Rp {(totalWasteValue / 30).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                                    </div>
                                    <div className="h-40 w-full relative">
                                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
                                            <defs>
                                                <linearGradient id="wasteChartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#d4823a" stopOpacity="0.4"></stop>
                                                    <stop offset="100%" stopColor="#d4823a" stopOpacity="0"></stop>
                                                </linearGradient>
                                                <filter id="glow">
                                                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                                </filter>
                                            </defs>
                                            <path d="M0 80 Q 20 70, 40 85 T 80 60 T 120 75 T 160 40 T 200 65 T 240 30 T 280 55 T 320 20 T 360 45 T 400 10 L 400 100 L 0 100 Z" fill="url(#wasteChartGradient)"></path>
                                            <path d="M0 80 Q 20 70, 40 85 T 80 60 T 120 75 T 160 40 T 200 65 T 240 30 T 280 55 T 320 20 T 360 45 T 400 10" fill="none" stroke="#d4823a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"></path>
                                        </svg>
                                    </div>
                                    <div className="flex justify-between mt-3 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider relative z-10">
                                        <span>7 Hari</span><span>14 Hari</span><span>21 Hari</span><span>Sekarang</span>
                                    </div>
                                </div>
                            </section>

                            {/* Top Waste Offenders */}
                            <section>
                                <h3 className="text-base font-bold tracking-tight mb-3 px-1">Top Waste Offenders</h3>
                                <div className="space-y-2.5">
                                    {topOffenders.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-primary/5 rounded-2xl border border-slate-100 dark:border-primary/10 border-dashed">
                                            <p className="text-slate-500 font-medium text-sm italic">Belum ada data pemborosan recorded.</p>
                                        </div>
                                    ) : (
                                        topOffenders.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl shadow-sm hover:border-primary/30 transition-colors">
                                                <div className="flex items-center gap-3.5">
                                                    <div className={`w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20`}>
                                                        <span className={`material-symbols-outlined text-red-500`}>inventory_2</span>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <p className="font-bold text-sm tracking-tight">{item.name}</p>
                                                        <p className="text-xs text-slate-500 font-medium">Stok: {parseFloat(item.currentStock)} {item.unit}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col gap-1 items-end">
                                                    <p className="font-bold text-sm tracking-tight text-red-500">Rp {parseFloat(item.totalWasteValue).toLocaleString('id-ID')}</p>
                                                    <p className={`text-[9px] text-red-600 dark:text-red-400 font-extrabold uppercase tracking-wider bg-red-500/10 px-1.5 py-0.5 rounded shadow-sm border border-red-500/20`}>MAJOR</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>

                            {/* Waste Reasons Breakdown */}
                            <section>
                                <h3 className="text-base font-bold tracking-tight mb-3 px-1">Penyebab Pemborosan (Estimasi)</h3>
                                <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-5 shadow-sm">
                                    <div className="flex flex-col gap-5">
                                        {[{ label: 'Expired / Kedaluwarsa', pct: 54, opacity: '' }, { label: 'Spillage / Kerusakan', pct: 28, opacity: '/70' }, { label: 'Kesalahan Pembuatan', pct: 18, opacity: '/40' }].map(r => (
                                            <div key={r.label}>
                                                <div className="flex justify-between items-end mb-1.5">
                                                    <span className="text-sm font-bold tracking-tight">{r.label}</span>
                                                    <span className="text-sm font-extrabold">{r.pct}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-2.5 overflow-hidden shadow-inner">
                                                    <div className={`bg-primary${r.opacity} h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: `${r.pct}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* Actionable Recommendations */}
                            <section className="pb-4">
                                <h3 className="text-base font-bold tracking-tight mb-3 px-1 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
                                    Rekomendasi Aksi
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { icon: 'shopping_cart_checkout', title: 'Optimalkan Stok Susu', desc: 'Pesan dalam batch lebih kecil (2L vs 5L) untuk mengurangi risiko expired hingga 30%.' },
                                        { icon: 'groups', title: 'Retraining Barista', desc: 'Lakukan tinjauan SOP pembuatan kopi susu untuk mengurangi spillage harian.' },
                                    ].map(rec => (
                                        <div key={rec.title} className="p-4 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 border-l-4 border-l-primary rounded-xl flex gap-3.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-primary">{rec.icon}</span>
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <p className="text-sm font-bold tracking-tight mb-0.5">{rec.title}</p>
                                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{rec.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default App;
