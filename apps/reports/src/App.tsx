import { useState } from 'react';
import { EXPENSES, RECIPES } from '@shared/mockDatabase';


import NavDrawer from '@shared/NavDrawer';




function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const totalExpenses = EXPENSES.reduce((sum, e) => sum + e.amount, 0);
    const totalRevenue = RECIPES.length * 1500000;
    const netProfit = totalRevenue - totalExpenses;
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5175} />
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-2xl border-x border-slate-800/10 dark:border-slate-800/30">

                {/* Header */}
                <div className="flex items-center bg-background-light/90 dark:bg-background-dark/90 p-4 border-b border-primary/10 sticky top-0 z-30 backdrop-blur-md gap-2">
                    <button onClick={() => setDrawerOpen(true)} className="text-slate-900 dark:text-slate-100 flex size-10 items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-primary shrink-0">
                        <span className="material-symbols-outlined text-primary">menu</span>
                    </button>
                    <button className="text-slate-900 dark:text-slate-100 flex size-10 items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1">Kopi Tiam P&L Report</h2>
                </div>

                {/* Date Range Picker Section */}
                <div className="p-4 relative z-0">
                    <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/20">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold uppercase tracking-wider text-primary">REPORT PERIOD</span>
                            <span className="material-symbols-outlined text-primary text-sm">calendar_month</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <button className="flex-1 flex items-center justify-center gap-2 bg-background-light dark:bg-slate-800 p-3 rounded-lg border border-primary/20 active:scale-95 transition-transform hover:bg-primary/10 text-slate-900 dark:text-slate-100">
                                <span className="text-sm font-medium">1 Mar 2024</span>
                            </button>
                            <span className="text-primary font-bold">→</span>
                            <button className="flex-1 flex items-center justify-center gap-2 bg-background-light dark:bg-slate-800 p-3 rounded-lg border border-primary/20 active:scale-95 transition-transform hover:bg-primary/10 text-slate-900 dark:text-slate-100">
                                <span className="text-sm font-medium">31 Mar 2024</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="flex gap-4 px-4 pb-4 overflow-x-auto no-scrollbar snap-x">
                    <div className="flex min-w-[160px] flex-1 flex-col gap-2 rounded-xl p-5 bg-primary/10 border border-primary/20 snap-center">
                        <p className="text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Revenue</p>
                        <p className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold leading-tight tracking-tight">Rp {(totalRevenue / 1000).toLocaleString('id-ID')}k</p>
                        <p className="text-emerald-500 text-xs font-bold flex items-center gap-1 mt-1">
                            <span className="material-symbols-outlined text-xs">trending_up</span> +12.4%
                        </p>
                    </div>

                    <div className="flex min-w-[160px] flex-1 flex-col gap-2 rounded-xl p-5 bg-gradient-to-br from-[#d4823a] to-[#b36a2b] text-white shadow-lg shadow-primary/30 snap-center">
                        <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Net Profit</p>
                        <p className="text-white text-3xl font-extrabold leading-tight tracking-tight">Rp {(netProfit / 1000).toLocaleString('id-ID')}k</p>
                        <p className="text-white text-xs font-bold flex items-center gap-1 mt-1">
                            <span className="material-symbols-outlined text-xs">payments</span> {((netProfit / totalRevenue) * 100).toFixed(0)}% Margin
                        </p>
                    </div>
                </div>

                {/* Detailed Sections */}
                <div className="p-4 space-y-8 flex-1">

                    {/* Revenue Breakdown */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Revenue Breakdown</h3>
                            <button className="text-xs text-primary font-bold hover:underline active:opacity-70">View Details</button>
                        </div>

                        <div className="space-y-4">
                            {/* Item 1 */}
                            <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <div className="size-2 rounded-full bg-primary"></div>
                                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">Coffee & Espresso</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">$22,180</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full w-[57%] rounded-full"></div>
                                </div>
                            </div>

                            {/* Item 2 */}
                            <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <div className="size-2 rounded-full bg-amber-600"></div>
                                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">Non-Coffee Drinks</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">$8,540</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-amber-600 h-full w-[22%] rounded-full"></div>
                                </div>
                            </div>

                            {/* Item 3 */}
                            <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <div className="size-2 rounded-full bg-slate-400"></div>
                                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">Food & Pastries</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">$8,200</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-slate-400 h-full w-[21%] rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* COGS (HPP) Section */}
                    <section className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Total COGS (HPP)</h3>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">($14,580)</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Ingredients, packaging, and waste management.</p>
                    </section>

                    {/* Operating Expenses */}
                    <section>
                        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">Operating Expenses</h3>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm">
                            <div className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer first:rounded-t-xl">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                        <span className="material-symbols-outlined text-lg">home_work</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Rent & Utilities</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">$4,200</span>
                            </div>
                            <div className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                        <span className="material-symbols-outlined text-lg">group</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Staff Payroll</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">$6,500</span>
                            </div>
                            <div className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer last:rounded-b-xl">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                        <span className="material-symbols-outlined text-lg">inventory_2</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Store Supplies</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">$1,190</span>
                            </div>
                        </div>
                    </section>

                    {/* Export Buttons */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <button className="flex items-center justify-center gap-2 border-2 border-primary text-primary font-bold py-3.5 rounded-xl hover:bg-primary/5 active:scale-95 transition-all">
                            <span className="material-symbols-outlined">picture_as_pdf</span>
                            PDF
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-[#059669] text-white font-bold py-3.5 rounded-xl hover:bg-[#047857] shadow-lg shadow-[#059669]/20 active:scale-95 transition-all border border-[#047857]">
                            <span className="material-symbols-outlined">description</span>
                            Excel
                        </button>
                    </div>

                </div>


            </div>
        </div>
    );
}

export default App;
