import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import NavDrawer from '@shared/NavDrawer';
import { getTargetUrl } from '@shared/navigation';

function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [hppData, setHppData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHPP = async () => {
            try {
                const data = await apiClient.getHPPAnalysis();
                setHppData(data);
            } catch (error) {
                console.error('Failed to fetch HPP analysis', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHPP();
    }, []);

    const totalHPPBahan = hppData?.totalHPP || 0;
    const ingredientsHPP = hppData?.ingredientsHPP || [];

    return (
        <div className="bg-background-app  text-slate-900  min-h-screen pb-24 font-display antialiased">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5176} />
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-2xl border-x border-slate-800/10 ">

                {/* Header */}
                <header className="sticky top-0 z-30 bg-background-app/80  backdrop-blur-md border-b border-primary/10  px-4 py-4">
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
                                <p className="text-xs text-slate-500  font-medium tracking-tight">Kerabat Kopi Tiam • Live Data</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-4 space-y-8 flex-1">
                    {isLoading ? (
                         <div className="flex justify-center items-center py-20">
                            <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
                         </div>
                    ) : (
                        <>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-primary/5  border border-primary/10  rounded-xl p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 ">Total HPP (30 Hari)</p>
                                    <p className="text-2xl font-extrabold mt-1 text-primary tracking-tight">Rp {totalHPPBahan.toLocaleString('id-ID')}</p>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Berdasarkan BOM & Penjualan</span>
                                </div>

                                <div className="bg-primary/5  border border-primary/10  rounded-xl p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 ">Jumlah Bahan</p>
                                    <p className="text-2xl font-extrabold mt-1 text-primary tracking-tight">{ingredientsHPP.length}</p>
                                    <div className="flex items-center gap-1 mt-2 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                        <span>Live Sync</span>
                                    </div>
                                </div>
                            </div>

                            {/* HPP Trend Chart - Visual Placeholder */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base font-bold tracking-tight">Tren HPP <span className="text-slate-500 text-sm font-semibold">(30 Hari Terakhir)</span></h2>
                                    <span className="text-xs text-slate-500  font-medium">Avg: Rp {(totalHPPBahan / 30).toLocaleString('id-ID', { maximumFractionDigits: 0 })}/hari</span>
                                </div>
                                <div className="bg-slate-50  rounded-xl p-4 border border-primary/5  relative z-0">
                                    <div className="h-40 w-full relative">
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                                    <stop offset="0%" stopColor="#d4823a" stopOpacity="0.3"></stop>
                                                    <stop offset="100%" stopColor="#d4823a" stopOpacity="0"></stop>
                                                </linearGradient>
                                            </defs>
                                            <path d="M0,80 Q40,75 80,40 T160,50 T240,20 T320,60 T400,30 V100 H0 Z" fill="url(#chartGradient)"></path>
                                            <path d="M0,80 Q40,75 80,40 T160,50 T240,20 T320,60 T400,30" fill="none" stroke="#d4823a" strokeLinecap="round" strokeWidth="3"></path>
                                        </svg>
                                    </div>
                                    <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                                        <span>7 Hari</span><span>14 Hari</span><span>21 Hari</span><span>Sekarang</span>
                                    </div>
                                </div>
                            </section>

                            {/* High Usage Ingredients / HPP Contribution */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base font-bold tracking-tight">Bahan Kontribusi HPP Tertinggi</h2>
                                </div>

                                <div className="bg-slate-50  rounded-xl border border-primary/5  overflow-hidden divide-y divide-slate-200 ">
                                    {ingredientsHPP.length === 0 ? (
                                        <p className="p-8 text-center text-slate-500 italic text-sm">Belum ada data penjualan tercatat.</p>
                                    ) : (
                                        ingredientsHPP.map((ing: any) => (
                                            <div key={ing.id} className="p-4 flex items-center justify-between hover:bg-slate-100  transition-colors cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                        <span className="material-symbols-outlined text-primary text-xl">inventory_2</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-900 ">{ing.name}</h3>
                                                        <p className="text-xs text-slate-500  font-medium">{ing.totalQty.toFixed(2)} unit digunakan</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <p className="text-sm font-bold text-slate-900 ">Rp {ing.totalCost.toLocaleString('id-ID')}</p>
                                                    <p className="text-[10px] text-slate-500  font-bold">{( ing.totalCost / totalHPPBahan * 100 ).toFixed(1)}% <span className="text-[9px] uppercase tracking-wider font-medium">Beban</span></p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>

                            {/* Info Section */}
                            <section className="pb-8">
                                <div className="p-5 bg-primary/10  border border-primary/20 rounded-2xl">
                                    <div className="flex gap-4 items-start">
                                        <span className="material-symbols-outlined text-primary text-3xl">lightbulb</span>
                                        <div>
                                            <h3 className="font-bold text-slate-900  text-sm">Apa itu Analisis HPP?</h3>
                                            <p className="text-xs text-slate-500  mt-1 leading-relaxed">
                                                Angka di atas dihitung secara otomatis berdasarkan Bill of Materials (BOM) setiap menu dikalikan dengan data penjualan nyata dari modul Kasir (POS). Ini memberikan gambaran biaya bahan baku langsung yang keluar.
                                            </p>
                                            <a href={getTargetUrl(5184)} className="inline-flex items-center gap-1.5 text-xs text-primary font-bold mt-4 hover:underline">
                                                <span className="material-symbols-outlined text-sm">restaurant_menu</span>
                                                Sesuaikan BOM di Kelola Resep
                                            </a>
                                        </div>
                                    </div>
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

