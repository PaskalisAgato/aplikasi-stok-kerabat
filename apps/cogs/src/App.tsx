import { useState } from 'react';
import { INVENTORY } from '@shared/mockDatabase';


import NavDrawer from '@shared/NavDrawer';




function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5180} />
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl border-x border-slate-800/10 dark:border-slate-800/30">

                {/* Header Section */}
                <div className="flex items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md p-4 pb-3 sticky top-0 z-30 border-b border-primary/10 dark:border-slate-800/50 gap-2">
                    <button onClick={() => setDrawerOpen(true)} className="flex items-center justify-center size-10 rounded-full hover:bg-primary/10 transition-colors active:scale-95 text-primary shrink-0">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1">COGS Analysis</h2>
                </div>

                <main className="flex-1 overflow-y-auto pb-8">

                    {/* Ingredient Summary */}
                    <div className="flex p-4">
                        <div className="flex w-full flex-col gap-4 items-start">
                            <div className="flex gap-4 items-center w-full">
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-24 border border-slate-200 dark:border-primary/20 shrink-0 shadow-sm"
                                    style={{ backgroundImage: `url('${INVENTORY[0].imageUrl}')` }}
                                    title={INVENTORY[0].name}
                                ></div>
                                <div className="flex flex-col flex-1 pl-1">
                                    <p className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight mb-1">{INVENTORY[0].name}</p>
                                    <p className="text-primary text-base font-bold leading-normal mb-1 tracking-tight">Rp 125.000 / <span className="text-sm">{INVENTORY[0].unit}</span></p>
                                    <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-normal mt-0.5">Last updated: 2 hours ago</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="flex flex-col gap-3 px-4 pt-2 pb-6">

                        <div className="flex flex-col gap-1.5 rounded-xl p-4 bg-primary/5 dark:bg-primary/5 border border-primary/10 dark:border-primary/10 shadow-sm">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Spending</p>
                            <p className="text-slate-900 dark:text-slate-100 text-2xl font-extrabold leading-tight tracking-tight">Rp 4.2M</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-[16px]">trending_up</span>
                                <p className="text-green-600 dark:text-green-500 text-[11px] font-bold">+5.2% vs last mo</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 rounded-xl p-4 bg-primary/5 dark:bg-primary/5 border border-primary/10 dark:border-primary/10 shadow-sm">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Usage Volume</p>
                            <p className="text-slate-900 dark:text-slate-100 text-2xl font-extrabold leading-tight tracking-tight">35.4 kg</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="material-symbols-outlined text-red-600 dark:text-red-500 text-[16px]">trending_down</span>
                                <p className="text-red-600 dark:text-red-500 text-[11px] font-bold">-2.1% vs last mo</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 rounded-xl p-4 bg-primary/5 dark:bg-primary/5 border border-primary/10 dark:border-primary/10 shadow-sm">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Waste Loss</p>
                            <p className="text-slate-900 dark:text-slate-100 text-2xl font-extrabold leading-tight tracking-tight">1.2 kg</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-[16px]">check_circle</span>
                                <p className="text-green-600 dark:text-green-500 text-[11px] font-bold">Within tolerance (3.4%)</p>
                            </div>
                        </div>

                    </div>

                    {/* Chart Section */}
                    <div className="px-4 pb-6">
                        <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold tracking-tight mb-3">Price Trend (3 Mo)</h3>

                        <div className="relative w-full h-48 bg-slate-50 dark:bg-primary/5 rounded-2xl border border-primary/10 flex items-end justify-between p-5 pt-8 overflow-hidden shadow-inner group">
                            {/* Decorative Background Icon */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-10 pointer-events-none transition-transform duration-700 group-hover:scale-110">
                                <span className="material-symbols-outlined text-[140px] text-slate-900 dark:text-white">monitoring</span>
                            </div>

                            {/* Chart Bars */}
                            <div className="flex flex-col items-center gap-3 h-full justify-end w-1/3 z-10">
                                <div className="w-10 bg-primary/40 dark:bg-primary/30 rounded-t-lg h-[60%] transition-all duration-500 hover:bg-primary/60"></div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Oct</span>
                            </div>

                            <div className="flex flex-col items-center gap-3 h-full justify-end w-1/3 z-10 relative">
                                <div className="w-10 bg-primary/60 dark:bg-primary/50 rounded-t-lg h-[75%] transition-all duration-500 hover:bg-primary/80"></div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nov</span>
                            </div>

                            <div className="flex flex-col items-center gap-3 h-full justify-end w-1/3 z-10 relative">
                                {/* Peak Tooltip */}
                                <div className="absolute -top-7 whitespace-nowrap bg-primary text-white text-[10px] px-2.5 py-1.5 rounded-md font-bold shadow-lg shadow-primary/20 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-primary">
                                    Peak: Rp 128k
                                </div>
                                <div className="w-10 bg-primary rounded-t-lg h-[90%] shadow-[0_0_15px_rgba(212,130,58,0.3)] transition-all duration-500 hover:brightness-110"></div>
                                <span className="text-xs text-slate-900 dark:text-slate-200 font-bold">Dec</span>
                            </div>
                        </div>
                    </div>

                    {/* Usage breakdown */}
                    <div className="px-4 pb-6">
                        <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold tracking-tight mb-3">Usage by Menu Item</h3>
                        <div className="flex flex-col gap-2.5">

                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-primary/5 border border-slate-100 dark:border-primary/10 hover:border-primary/30 transition-colors">
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">Kopi O (Regular)</p>
                                    <p className="text-[11px] text-slate-500 font-medium">18g per serving</p>
                                </div>
                                <div className="text-right flex flex-col gap-0.5">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Rp 2.250</p>
                                    <p className="text-[10px] text-primary font-bold">45% of total usage</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-primary/5 border border-slate-100 dark:border-primary/10 hover:border-primary/30 transition-colors">
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">Kopi Tarik</p>
                                    <p className="text-[11px] text-slate-500 font-medium">22g per serving</p>
                                </div>
                                <div className="text-right flex flex-col gap-0.5">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Rp 2.750</p>
                                    <p className="text-[10px] text-primary font-bold">30% of total usage</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-primary/5 border border-slate-100 dark:border-primary/10 hover:border-primary/30 transition-colors">
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">Kopi C</p>
                                    <p className="text-[11px] text-slate-500 font-medium">20g per serving</p>
                                </div>
                                <div className="text-right flex flex-col gap-0.5">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Rp 2.500</p>
                                    <p className="text-[10px] text-primary font-bold">25% of total usage</p>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Purchase History */}
                    <div className="px-4 pb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold tracking-tight">Recent Purchases</h3>
                            <button className="text-primary text-[11px] font-bold uppercase tracking-wider hover:underline">View All</button>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800/50">
                            <table className="w-full text-left bg-white dark:bg-transparent">
                                <thead className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/30">
                                    <tr>
                                        <th className="py-3 px-4 w-[25%]">Date</th>
                                        <th className="py-3 px-4 w-[40%]">Vendor</th>
                                        <th className="py-3 px-4 w-[15%]">Qty</th>
                                        <th className="py-3 px-4 w-[20%] text-right">Unit Price</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">Dec 12</td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">Medan Coffee Co.</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">10kg</td>
                                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">Rp 126k</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">Dec 05</td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">Lokal Roasters</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">15kg</td>
                                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">Rp 124k</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">Nov 28</td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">Medan Coffee Co.</td>
                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">10kg</td>
                                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">Rp 125k</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </main>



            </div>
        </div>
    );
}

export default App;
