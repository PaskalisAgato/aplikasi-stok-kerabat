import { useState } from 'react';
import { INVENTORY, RECIPES } from '@shared/mockDatabase';


import NavDrawer from '@shared/NavDrawer';
import { getTargetUrl } from '@shared/navigation';




function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const totalHPPBahan = INVENTORY.reduce((sum, i) => sum + (i.systemStock * 5000), 0);
    const avgHPPPercent = 31.4; // Still mocked but could be calculated
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen pb-24 font-display antialiased">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5176} />
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-2xl border-x border-slate-800/10 dark:border-slate-800/30">

                {/* Header */}
                <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 dark:border-slate-800/30 px-4 py-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setDrawerOpen(true)} className="p-2 rounded-full hover:bg-primary/10 transition-colors text-primary flex items-center justify-center active:scale-95 shrink-0">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined">analytics</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold leading-tight tracking-tight">Analisis HPP</h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-tight">Kerabat Kopi Tiam • April 2024</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-4 space-y-8 flex-1">

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-xl p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total HPP</p>
                            <p className="text-2xl font-extrabold mt-1 text-primary tracking-tight">Rp {(totalHPPBahan / 1000000).toFixed(1)}M</p>
                            <div className="flex items-center gap-1 mt-2 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-sm">trending_up</span>
                                <span>+3.2% vs LW</span>
                            </div>
                        </div>

                        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-xl p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rasio HPP</p>
                            <p className="text-2xl font-extrabold mt-1 text-primary tracking-tight">{avgHPPPercent}%</p>
                            <div className="flex items-center gap-1 mt-2 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-sm">trending_down</span>
                                <span>-0.8% Target</span>
                            </div>
                        </div>
                    </div>

                    {/* HPP Trend Chart */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold tracking-tight">Tren HPP <span className="text-slate-500 text-sm font-semibold">(30 Hari Terakhir)</span></h2>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Rata-rata: Rp 1.4M/hari</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-primary/5 dark:border-slate-800 relative z-0">

                            {/* SVG Chart Wrapper */}
                            <div className="h-40 w-full relative">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#d4823a" stopOpacity="0.3"></stop>
                                            <stop offset="100%" stopColor="#d4823a" stopOpacity="0"></stop>
                                        </linearGradient>
                                    </defs>
                                    {/* Fill Area */}
                                    <path d="M0,80 Q40,75 80,40 T160,50 T240,20 T320,60 T400,30 V100 H0 Z" fill="url(#chartGradient)"></path>
                                    {/* Stroke Line */}
                                    <path d="M0,80 Q40,75 80,40 T160,50 T240,20 T320,60 T400,30" fill="none" stroke="#d4823a" strokeLinecap="round" strokeWidth="3"></path>
                                    {/* Data Point Circles */}
                                    <circle cx="80" cy="40" fill="#d4823a" r="4" className="drop-shadow-sm"></circle>
                                    <circle cx="240" cy="20" fill="#d4823a" r="4" className="drop-shadow-sm"></circle>
                                    <circle cx="400" cy="30" fill="#d4823a" r="4" className="drop-shadow-sm"></circle>
                                </svg>
                            </div>

                            {/* X-axis Labels */}
                            <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                                <span>1 Apr</span>
                                <span>10 Apr</span>
                                <span>20 Apr</span>
                                <span>30 Apr</span>
                            </div>
                        </div>
                    </section>

                    {/* High Usage Ingredients */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold tracking-tight">Bahan Penggunaan Tinggi</h2>
                            <button className="text-xs text-primary font-bold hover:underline active:opacity-70">Lihat Semua</button>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-primary/5 dark:border-slate-800 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800/50">

                            <div className="p-4 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <span className="material-symbols-outlined text-primary text-xl">coffee</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Kopi Bubuk Arabica</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">24.5 kg digunakan</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Rp 8.4M</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">19.6% <span className="text-[9px] uppercase tracking-wider">Kontribusi</span></p>
                                </div>
                            </div>

                            <div className="p-4 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <span className="material-symbols-outlined text-primary text-xl">water_drop</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Susu UHT Full Cream</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">120 Liter digunakan</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Rp 6.2M</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">14.4% <span className="text-[9px] uppercase tracking-wider">Kontribusi</span></p>
                                </div>
                            </div>

                            <div className="p-4 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <span className="material-symbols-outlined text-primary text-xl">icecream</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Susu Kental Manis</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">45 Kaleng digunakan</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Rp 3.1M</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">7.2% <span className="text-[9px] uppercase tracking-wider">Kontribusi</span></p>
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* Recipe Costing */}
                    <section className="pb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold tracking-tight">Biaya Resep <span className="text-slate-500 text-sm font-semibold">(Menu Teratas)</span></h2>
                            <div className="flex gap-2 items-center">
                                <span className="material-symbols-outlined text-slate-400 text-sm hover:text-slate-600 transition-colors cursor-help">info</span>
                                <a href={getTargetUrl(5184)} className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1 active:scale-95">
                                    <span className="material-symbols-outlined text-[14px]">restaurant_menu</span>
                                    Kelola Resep
                                </a>
                            </div>
                        </div>

                        <div className="space-y-4">

                            {/* Item 1 */}
                            <div className="bg-background-light dark:bg-background-dark border border-primary/10 rounded-xl p-5 shadow-sm">
                                <div className="flex justify-between items-start mb-5">
                                    <div>
                                        <h3 className="font-bold text-sm tracking-tight">Kopi Tarik Signature</h3>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Kategori: Minuman Andalan</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded bg-[#059669]/10 text-[#059669] text-[9px] font-extrabold uppercase tracking-wider border border-[#059669]/20">
                                        Margin Sehat
                                    </span>
                                </div>

                                <div className="flex items-end justify-between gap-6">
                                    <div className="flex-1 space-y-2.5">
                                        <div className="flex justify-between items-end text-[11px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Bahan per Modal</span>
                                            <span className="font-bold">Rp 7,200</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-primary h-full rounded-full w-[28%]"></div>
                                        </div>
                                        <div className="flex justify-between items-end text-[11px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Harga Jual</span>
                                            <span className="font-bold">Rp 25,000</span>
                                        </div>
                                    </div>

                                    <div className="text-right border-l border-slate-200 dark:border-slate-800 pl-4 py-1">
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">HPP %</p>
                                        <p className="text-xl font-extrabold text-primary tracking-tight">28.8%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Item 2 */}
                            <div className="bg-background-light dark:bg-background-dark border border-primary/10 rounded-xl p-5 shadow-sm">
                                <div className="flex justify-between items-start mb-5">
                                    <div>
                                        <h3 className="font-bold text-sm tracking-tight">Kaya Toast Premium</h3>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Kategori: Makanan</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 text-[9px] font-extrabold uppercase tracking-wider border border-amber-500/20">
                                        Cek Resep
                                    </span>
                                </div>

                                <div className="flex items-end justify-between gap-6">
                                    <div className="flex-1 space-y-2.5">
                                        <div className="flex justify-between items-end text-[11px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Bahan per Porsi</span>
                                            <span className="font-bold">Rp 9,800</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-amber-500 h-full rounded-full w-[44%]"></div>
                                        </div>
                                        <div className="flex justify-between items-end text-[11px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Harga Jual</span>
                                            <span className="font-bold">Rp 22,000</span>
                                        </div>
                                    </div>

                                    <div className="text-right border-l border-slate-200 dark:border-slate-800 pl-4 py-1">
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">HPP %</p>
                                        <p className="text-xl font-extrabold text-amber-500 tracking-tight">44.5%</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </section>

                </main>

            </div>
        </div>
    );
}

export default App;
