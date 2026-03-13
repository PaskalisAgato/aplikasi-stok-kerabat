import React, { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';


import NavDrawer from '@shared/NavDrawer';




export default function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
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
                console.log("Finance Data received:", data);
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

    return (
        <div className="bg-background-app font-display text-main min-h-screen transition-colors duration-300">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5175} />
            
            <div className="flex flex-col min-h-screen lg:flex-row max-w-[1400px] mx-auto">
                
                {/* Desktop Sidebar - Side Controls */}
                <aside className="hidden lg:flex w-80 h-screen sticky top-0 bg-surface border-r border-border-dim flex-col p-8 space-y-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setDrawerOpen(true)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h1 className="text-xl font-black tracking-tight">Reports</h1>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-muted uppercase tracking-widest">Report Period</p>
                            <span className="material-symbols-outlined text-primary text-sm">calendar_month</span>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl border border-border-dim bg-background-app/50">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Dari</p>
                                <p className="text-sm font-bold">1 Mar 2024</p>
                            </div>
                            <div className="p-4 rounded-xl border border-border-dim bg-background-app/50">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Hingga</p>
                                <p className="text-sm font-bold">31 Mar 2024</p>
                            </div>
                            <button className="w-full btn-primary py-3">
                                <span className="material-symbols-outlined text-sm">filter_list</span>
                                Tampilkan
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-border-dim space-y-4">
                         <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-primary text-primary font-black hover:bg-primary/5 transition-all">
                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                            Export PDF
                        </button>
                        <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-sm">description</span>
                            Export Excel
                        </button>
                    </div>
                </aside>

                {/* Main Dashboard Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header (Mobile) */}
                    <header className="lg:hidden sticky top-0 z-30 bg-background-app/80 backdrop-blur-md p-4 border-b border-border-dim">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setDrawerOpen(true)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <h2 className="text-lg font-black tracking-tight">Financial Report</h2>
                        </div>
                    </header>

                    <main className="p-4 md:p-8 md:pt-12">
                        {/* Status Summary Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            {isLoading ? (
                                <div className="col-span-full h-48 flex items-center justify-center">
                                    <span className="material-symbols-outlined animate-spin text-primary text-5xl">refresh</span>
                                </div>
                            ) : (
                                <>
                                    <div className="card p-8 bg-primary/5 border-primary/20 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-7xl text-primary">analytics</span>
                                        </div>
                                        <p className="text-xs font-black text-muted uppercase tracking-[0.2em] mb-3">Total Pemasukan</p>
                                        <p className="text-4xl font-black text-main mb-2">
                                            Rp {((revenue || 0) / 1000).toLocaleString('id-ID')}k
                                        </p>
                                        <div className="flex items-center gap-2 text-emerald-500 font-black text-xs">
                                            <span className="material-symbols-outlined text-sm">trending_up</span>
                                            +12% vs last month
                                        </div>
                                    </div>

                                    <div className="card p-8 bg-[#d4823a] text-white border-transparent shadow-2xl shadow-[#d4823a]/30 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-20">
                                            <span className="material-symbols-outlined text-7xl text-white">account_balance_wallet</span>
                                        </div>
                                        <p className="text-xs font-black text-white/70 uppercase tracking-[0.2em] mb-3 text-shadow-sm">Profit Bersih (Net)</p>
                                        <p className="text-4xl font-black text-white mb-2">
                                            Rp {((netProfit || 0) / 1000).toLocaleString('id-ID')}k
                                        </p>
                                        <div className="flex items-center gap-2 text-white/90 font-black text-xs">
                                            <span className="material-symbols-outlined text-sm">payments</span>
                                            {margin}% Margin rata-rata
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Breakdown Section */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <div className="card p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black tracking-tight">Revenue Breakdown</h3>
                                    <span className="material-symbols-outlined text-primary">donut_large</span>
                                </div>

                                <div className="space-y-6">
                                    {/* Breakdown items with better styling */}
                                    {[
                                        { label: 'Coffee & Espresso', val: 'Rp 22,180k', color: 'bg-primary', w: 'w-[57%]' },
                                        { label: 'Tea & Non-Coffee', val: 'Rp 8,540k', color: 'bg-amber-600', w: 'w-[22%]' },
                                        { label: 'Pastries & Food', val: 'Rp 8,200k', color: 'bg-slate-400', w: 'w-[21%]' }
                                    ].map((item, id) => (
                                        <div key={id}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-3 rounded-full ${item.color} shadow-sm`}></div>
                                                    <span className="text-sm font-black text-muted uppercase tracking-tighter">{item.label}</span>
                                                </div>
                                                <span className="text-sm font-black text-main">{item.val}</span>
                                            </div>
                                            <div className="w-full bg-background-app h-2 rounded-full overflow-hidden shadow-inner border border-border-dim">
                                                <div className={`${item.color} h-full ${item.w} rounded-full transition-all duration-1000`}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Operating Expenses with new card style */}
                                <section className="card p-8 bg-surface text-main border border-border-dim">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-black text-muted text-xs uppercase tracking-[0.2em]">Total Operating Expenses</h3>
                                        <span className="material-symbols-outlined text-muted">receipt_long</span>
                                    </div>
                                    <p className="text-3xl font-black text-main">Rp {(expenses).toLocaleString('id-ID')}</p>
                                    <p className="text-[10px] font-bold text-muted mt-2 leading-relaxed">Ingredients, utilities, and labor costs synced from central API.</p>
                                </section>

                                {/* Mobile only export buttons */}
                                <div className="lg:hidden grid grid-cols-2 gap-4 pb-20">
                                    <button className="flex items-center justify-center gap-2 border-2 border-primary text-primary font-black py-4 rounded-2xl active:scale-95 transition-all">
                                        <span className="material-symbols-outlined">picture_as_pdf</span>
                                        PDF
                                    </button>
                                    <button className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all border border-emerald-500">
                                        <span className="material-symbols-outlined">description</span>
                                        Excel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}



