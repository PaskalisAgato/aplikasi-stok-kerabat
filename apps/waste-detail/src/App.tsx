import { useState } from 'react';
import { INVENTORY } from '@shared/mockDatabase';


import NavDrawer from '@shared/NavDrawer';




function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const item = INVENTORY.find(i => i.id === 1) || INVENTORY[0];
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display antialiased">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5183} />
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl border-x border-slate-800/10 dark:border-slate-800/30 overflow-x-hidden pb-8">

                {/* Header Section */}
                <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-primary/10">
                    <div className="flex items-center p-4 gap-2">
                        <button onClick={() => setDrawerOpen(true)} className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors active:scale-95 text-primary shrink-0">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">Detail Pemborosan</h1>
                            <h2 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100">{item.name}</h2>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">

                    {/* Ingredient Context */}
                    <div className="p-4 flex items-center gap-4">
                        <div
                            className="size-20 rounded-2xl bg-white dark:bg-primary/5 bg-cover bg-center border border-slate-200 dark:border-primary/20 shadow-sm shrink-0"
                            style={{ backgroundImage: `url('${item.imageUrl || "https://images.unsplash.com/photo-1550508127-160fa31b2628?q=80&w=200&auto=format&fit=crop"}')` }}
                            title={item.name}
                        ></div>
                        <div className="flex-1">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Outlet</p>
                            <p className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100">Kopi Tiam Warm Dark</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 dark:border-primary/30 uppercase tracking-wider shadow-sm">Liquid</span>
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 dark:border-emerald-500/30 uppercase tracking-wider shadow-sm">In Stock</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards Grid */}
                    <div className="px-4 grid grid-cols-2 gap-3 pb-2 pt-2">
                        <div className="col-span-2 bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-5 shadow-sm">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Total Terbuang (30 Hari)</p>
                            <div className="flex items-end justify-between mt-2">
                                <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                                    15.5 <span className="text-lg font-semibold text-slate-500 dark:text-slate-400 ml-1">Liter</span>
                                </p>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-rose-600 dark:text-rose-500 flex items-center gap-0.5 text-[11px] font-bold bg-rose-500/10 px-2 py-0.5 rounded shadow-sm border border-rose-500/20">
                                        <span className="material-symbols-outlined text-[14px]">trending_up</span> 0.5%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-4 shadow-sm">
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Nilai Kerugian</p>
                            <p className="text-lg font-extrabold mt-1.5 tracking-tight text-slate-900 dark:text-slate-100">Rp 1.240k</p>
                            <p className="text-emerald-600 dark:text-emerald-500 text-[10px] font-bold mt-2 flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[14px]">trending_down</span> 2.1% <span className="text-slate-400 font-medium">vs bln lalu</span>
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-4 shadow-sm">
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">% vs Total Stok</p>
                            <p className="text-lg font-extrabold mt-1.5 tracking-tight text-slate-900 dark:text-slate-100">4.2%</p>
                            <p className="text-rose-600 dark:text-rose-500 text-[10px] font-bold mt-2 flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[14px]">trending_up</span> 0.1% <span className="text-slate-400 font-medium">vs bln lalu</span>
                            </p>
                        </div>
                    </div>

                    {/* Waste Reasons Breakdown */}
                    <section className="mt-8 px-4">
                        <h3 className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Penyebab Utama</h3>
                        <div className="space-y-4.5 flex flex-col gap-4">

                            {/* Reason 1 */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-1.5 text-sm">
                                    <span className="font-bold tracking-tight text-slate-800 dark:text-slate-200">Kadaluarsa (Expired)</span>
                                    <span className="text-primary font-extrabold">50%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800/50 h-2.5 rounded-full overflow-hidden shadow-inner flex">
                                    <div className="bg-primary hover:bg-primary/90 transition-colors h-full rounded-full" style={{ width: '50%' }}></div>
                                </div>
                            </div>

                            {/* Reason 2 */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-1.5 text-sm">
                                    <span className="font-bold tracking-tight text-slate-800 dark:text-slate-200">Tumpah (Spillage)</span>
                                    <span className="text-primary font-extrabold">30%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800/50 h-2.5 rounded-full overflow-hidden shadow-inner flex">
                                    <div className="bg-primary/70 hover:bg-primary/80 transition-colors h-full rounded-full" style={{ width: '30%' }}></div>
                                </div>
                            </div>

                            {/* Reason 3 */}
                            <div className="group">
                                <div className="flex justify-between items-end mb-1.5 text-sm">
                                    <span className="font-bold tracking-tight text-slate-800 dark:text-slate-200">Salah Racik (Prep Error)</span>
                                    <span className="text-primary font-extrabold">20%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800/50 h-2.5 rounded-full overflow-hidden shadow-inner flex">
                                    <div className="bg-primary/40 hover:bg-primary/50 transition-colors h-full rounded-full" style={{ width: '20%' }}></div>
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* 30-Day Trend Chart (Visual Representation) */}
                    <section className="mt-8 px-4">
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tren 30 Hari</h3>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded">Avg: 0.5L/day</span>
                        </div>

                        <div className="h-32 w-full bg-white dark:bg-primary/5 rounded-2xl border border-slate-200 dark:border-primary/10 relative overflow-hidden flex items-end px-3 py-2 gap-1.5 shadow-sm group">
                            {/* Decorative Background grid lines */}
                            <div className="absolute inset-x-0 bottom-[25%] border-b border-slate-100 dark:border-slate-800/50 w-full z-0"></div>
                            <div className="absolute inset-x-0 bottom-[50%] border-b border-slate-100 dark:border-slate-800/50 w-full z-0"></div>
                            <div className="absolute inset-x-0 bottom-[75%] border-b border-slate-100 dark:border-slate-800/50 w-full z-0"></div>

                            {/* Chart Bars */}
                            <div className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors h-[25%] rounded-t z-10"></div>
                            <div className="flex-1 bg-primary/30 hover:bg-primary/50 transition-colors h-[33%] rounded-t z-10"></div>
                            <div className="flex-1 bg-primary/50 hover:bg-primary/70 transition-colors h-[50%] rounded-t z-10 relative">
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">1.2L</div>
                            </div>
                            <div className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors h-[20%] rounded-t z-10"></div>
                            <div className="flex-1 bg-primary/70 hover:bg-primary/90 transition-colors h-[66%] rounded-t z-10 relative">
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">1.6L</div>
                            </div>
                            <div className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors h-[25%] rounded-t z-10"></div>
                            <div className="flex-1 bg-primary/30 hover:bg-primary/50 transition-colors h-[33%] rounded-t z-10"></div>
                            <div className="flex-1 bg-primary/50 hover:bg-primary/70 transition-colors h-[75%] rounded-t z-10 relative">
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">1.8L</div>
                            </div>
                            <div className="flex-1 bg-primary hover:bg-primary/90 transition-colors h-[90%] rounded-t z-10 relative">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-100 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-primary z-20">2.1L</div>
                            </div>
                            <div className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors h-[20%] rounded-t z-10"></div>
                            <div className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors h-[25%] rounded-t z-10"></div>
                            <div className="flex-1 bg-primary/40 hover:bg-primary/60 transition-colors h-[40%] rounded-t z-10"></div>
                        </div>

                        <div className="flex justify-between mt-2.5 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest px-1 shadow-sm">
                            <span>01 Okt</span>
                            <span>15 Okt</span>
                            <span>30 Okt</span>
                        </div>
                    </section>

                    {/* Recent Waste Log */}
                    <section className="mt-8 px-4 pb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Log Pembuangan</h3>
                            <button className="text-[11px] text-primary font-extrabold uppercase tracking-wider hover:underline">Lihat Semua</button>
                        </div>

                        <div className="space-y-3">

                            {/* Log Item 1 */}
                            <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-0.5">
                                        <p className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100">2.0 Liter</p>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Kadaluarsa (Stockroom A)</p>
                                    </div>
                                    <div className="text-right flex flex-col gap-1 items-end">
                                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Hari ini, 09:12</p>
                                        <p className="text-[9px] text-primary font-extrabold uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">Barista: Budi S.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Log Item 2 */}
                            <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-0.5">
                                        <p className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100">0.5 Liter</p>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tumpah (Bar Area)</p>
                                    </div>
                                    <div className="text-right flex flex-col gap-1 items-end">
                                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Kemarin, 14:45</p>
                                        <p className="text-[9px] text-primary font-extrabold uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">Barista: Ani W.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Log Item 3 */}
                            <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-0.5">
                                        <p className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100">1.2 Liter</p>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Salah Racik</p>
                                    </div>
                                    <div className="text-right flex flex-col gap-1 items-end">
                                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">28 Okt, 18:20</p>
                                        <p className="text-[9px] text-primary font-extrabold uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">Barista: Budi S.</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </section>
                </main>

                {/* Bottom Action */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent pt-10 max-w-md mx-auto z-40">
                    <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">edit_note</span>
                        Update Waste / Stock Opname
                    </button>
                </div>

            </div>
        </div>
    );
}

export default App;
