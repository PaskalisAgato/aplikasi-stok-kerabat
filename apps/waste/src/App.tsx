import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';
import LogWasteModal from './components/LogWasteModal';

const safeNumber = (val: any) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

function App() {
    const [wasteHistory, setWasteHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [summaryRes, historyRes] = await Promise.all([
                apiClient.getWasteSummary(),
                apiClient.getWasteHistory(20, 0)
            ]);

            const data = summaryRes?.data || {};
            setWasteSummary({
                totalValueMonth: safeNumber(data.totalValueMonth),
                topOffenders: Array.isArray(data.topOffenders) ? data.topOffenders : [],
                wasteByReason: Array.isArray(data.wasteByReason) ? data.wasteByReason : [],
                status: data.status || "NORMAL"
            });

            if (historyRes?.success) {
                setWasteHistory(historyRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch waste data', error);
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
                <div className="sticky bottom-0 left-0 right-0 p-6 glass border-t border-white/5 animate-in slide-in-from-bottom duration-1000">
                    <button
                        onClick={() => setIsLogModalOpen(true)}
                        className="w-full flex items-center justify-center gap-4 bg-gradient-to-r from-red-500 to-orange-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl shadow-red-500/20 active:scale-[0.98] transition-all border border-white/10 group"
                    >
                        <span className="material-symbols-outlined text-3xl font-black group-hover:rotate-12 transition-transform">delete_sweep</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Input Data Waste</span>
                    </button>
                </div>
            }
        >
            <div className="space-y-10 px-2 sm:px-0">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-6 glass rounded-[3rem] opacity-60">
                        <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Menghitung Kerugian Produk...</p>
                    </div>
                ) : (
                    <>
                        {/* Total Waste Metric Card */}
                        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="card group relative overflow-hidden transition-all duration-500 hover:scale-[1.01] p-8 bg-gradient-to-br from-white/5 to-transparent border-white/5 shadow-2xl">
                                <div className="absolute -right-10 -top-10 opacity-5 transition-transform duration-1000 group-hover:scale-125 group-hover:rotate-12 pointer-events-none text-primary">
                                    <span className="material-symbols-outlined font-black" style={{ fontSize: '240px' }}>delete_outline</span>
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex border-b border-white/5 pb-4 justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <span className="material-symbols-outlined text-primary text-sm font-black">warning</span>
                                            </div>
                                            <p className="text-[10px] font-black tracking-[0.4em] text-primary uppercase opacity-80">Total Pengeluaran Sia-Sia</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-5xl sm:text-6xl font-black text-[var(--text-main)] tracking-tighter uppercase font-display leading-tight">
                                            Rp {totalWasteValue.toLocaleString('id-ID')}
                                        </h2>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20 shadow-inner">
                                                <span className="material-symbols-outlined text-[16px] font-black">trending_down</span>
                                                Optimal
                                            </span>
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] opacity-40 italic">Bulan Ini</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Top Waste Offenders */}
                        <section className="animate-in fade-in zoom-in duration-1000">
                            <div className="space-y-1 mb-6 px-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">Daftar Produk</h3>
                                <p className="text-xl font-black font-display tracking-tight text-[var(--text-main)] uppercase">Top Waste Offenders</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {topOffenders.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-20 text-center glass rounded-[3rem] border-dashed border-2 opacity-40">
                                        <span className="material-symbols-outlined text-6xl text-primary font-black mb-4">inventory_2</span>
                                        <p className="font-black text-xs uppercase tracking-[0.2em]">Kondisi Stok Optimal</p>
                                    </div>
                                ) : (
                                    topOffenders.map((item: any) => (
                                        <div key={item.id} className="card group p-6 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all duration-500 hover:scale-[1.01] active:scale-[0.99] bg-white/5 border-white/5 overflow-hidden">
                                            <div className="flex items-center gap-6 w-full sm:flex-1 min-w-0">
                                                <div className="size-16 sm:size-20 rounded-3xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20 shadow-2xl group-hover:rotate-6 transition-transform">
                                                    <span className="material-symbols-outlined text-red-500 text-3xl font-black">inventory_2</span>
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <h4 className="font-black text-[var(--text-main)] text-xl sm:text-2xl font-display tracking-tight uppercase truncate leading-tight group-hover:text-red-500 transition-colors uppercase">{item.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] bg-primary/20 px-3 py-1 rounded-full border border-primary/20">DATA RIIL</span>
                                                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">{parseFloat(item.currentStock)} {item.unit} Tersisa</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full sm:w-auto text-right">
                                                <p className="text-2xl sm:text-3xl font-black text-red-500 font-display tracking-tighter uppercase whitespace-nowrap">
                                                    Rp {parseFloat(item.totalWasteValue).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Waste History List */}
                        <section className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            <div className="flex items-center justify-between mb-6 px-4">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">Log Riwayat</h3>
                                    <p className="text-xl font-black font-display tracking-tight text-[var(--text-main)] uppercase">Aktivitas Terakhir</p>
                                </div>
                            </div>
                            <div className="card p-4 sm:p-8 bg-white/5 border-white/5">
                                <div className="space-y-4">
                                    {wasteHistory.length === 0 ? (
                                        <div className="py-10 text-center opacity-40 italic text-[10px] uppercase tracking-widest">Belum ada riwayat pengeluaran</div>
                                    ) : (
                                        wasteHistory.map((log: any) => (
                                            <div key={log.id} className="group flex items-center justify-between p-4 rounded-3xl bg-black/20 border border-white/5 hover:border-primary/50 transition-all duration-300">
                                                <div className="flex items-center gap-4">
                                                    <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                                                        log.reason === 'Owner' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
                                                        log.reason === 'Staff' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                                        log.reason === 'R&D' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                                                        'bg-red-500/10 border-red-500/20 text-red-500'
                                                    }`}>
                                                        <span className="material-symbols-outlined text-lg font-black">
                                                            {log.reason === 'Owner' ? 'person' : 
                                                             log.reason === 'Staff' ? 'groups' :
                                                             log.reason === 'R&D' ? 'labs' : 'inventory_2'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight">{log.itemName}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                                                log.reason === 'Owner' ? 'bg-purple-500/20 text-purple-400' :
                                                                log.reason === 'Staff' ? 'bg-blue-500/20 text-blue-400' :
                                                                log.reason === 'R&D' ? 'bg-orange-500/20 text-orange-400' :
                                                                'bg-white/10 text-[var(--text-muted)]'
                                                            }`}>
                                                                {log.reason === 'Owner' ? 'Konsumsi Owner' : 
                                                                 log.reason === 'Staff' ? 'Makan Karyawan' :
                                                                 log.reason === 'R&D' ? 'Trial Menu' : (log.reason || 'Lainnya')}
                                                            </span>
                                                            <span className="text-[8px] text-[var(--text-muted)] opacity-40 font-black uppercase">
                                                                {new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-[var(--text-main)]">-{log.quantity} {log.unit}</p>
                                                    <p className="text-[9px] font-black text-red-500/60 mt-0.5">Rp {(parseFloat(log.quantity) * parseFloat(log.priceAtTime || 0)).toLocaleString('id-ID')}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Waste Reasons Breakdown */}
                        <section className="animate-in fade-in duration-1000">
                            <div className="space-y-1 mb-6 px-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">Akar Masalah</h3>
                                <p className="text-xl font-black font-display tracking-tight text-[var(--text-main)] uppercase">Penyebab Kerugian</p>
                            </div>
                            <div className="card p-8 bg-white/5 border-white/5 overflow-hidden">
                                <div className="space-y-8">
                                    {(wasteSummary?.wasteByReason?.length > 0) ? (
                                        wasteSummary.wasteByReason.map((r: any) => {
                                            const totalCost = safeNumber(wasteSummary.totalValueMonth);
                                            const pct = totalCost > 0 ? Math.round((safeNumber(r.wasteCost) / totalCost) * 100) : 0;
                                            
                                            return (
                                                <div key={r.reason} className="space-y-4 group/item transition-all duration-500">
                                                    <div className="flex justify-between items-end px-2">
                                                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-80 group-hover/item:text-primary transition-colors">
                                                            {r.reason === 'Owner' ? 'KONSUMSI OWNER' : 
                                                             r.reason === 'Staff' ? 'MAKAN KARYAWAN' :
                                                             r.reason === 'R&D' ? 'TRIAL MENU BARU' : 
                                                             (r.reason?.toUpperCase() || 'LAINNYA')}
                                                        </span>
                                                        <span className="text-lg font-black text-[var(--text-main)] font-display tracking-wide">{pct}%</span>
                                                    </div>
                                                    <div className="w-full bg-[var(--bg-app)] h-4 rounded-full overflow-hidden shadow-2xl border border-white/10 p-1">
                                                        <div 
                                                            className={`bg-gradient-to-r from-primary to-primary-focus h-full rounded-full transition-all duration-1000 ease-out accent-glow shadow-lg shadow-primary/20`} 
                                                            style={{ width: `${pct}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-10 opacity-30">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Data analisis belum tersedia</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <div className="h-10" /> {/* Bottom Spacing */}
                    </>
                )}
            </div>

            <LogWasteModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                onSaved={() => {
                    fetchData();
                }}
            />
        </Layout>
    );
}

export default App;

