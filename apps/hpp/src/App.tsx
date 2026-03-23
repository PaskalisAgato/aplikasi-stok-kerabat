import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';
import { getTargetUrl } from '@shared/navigation';

function App() {
    const [hppData, setHppData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sellingPrice, setSellingPrice] = useState<number>(() => {
        const saved = localStorage.getItem('hpp_selling_price');
        return saved ? Number(saved) : 0;
    });

    useEffect(() => {
        localStorage.setItem('hpp_selling_price', sellingPrice.toString());
    }, [sellingPrice]);

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
        <Layout
            currentPort={5176}
            title="Analisis HPP"
            subtitle="Cost of Goods Sold Analytics"
        >
            {isLoading ? (
                <div className="flex flex-col justify-center items-center py-32 gap-6 glass rounded-[3rem] opacity-60">
                    <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Menghitung Beban Produksi...</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Selling Price & Summary Stats */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                        {/* Selling Price Input */}
                        <div className="card group p-6 flex flex-col justify-between hover:scale-[1.02] transition-all border-primary/20 bg-primary/5">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Selling Price / Cup</p>
                                <div className="relative">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg font-black text-primary opacity-40">Rp</span>
                                    <input 
                                        type="number"
                                        value={sellingPrice || ''}
                                        onChange={(e) => setSellingPrice(Number(e.target.value))}
                                        className="w-full bg-transparent border-none focus:ring-0 text-2xl font-black text-[var(--text-main)] pl-7 p-0 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-primary/10">
                                <span className="text-[8px] font-black text-primary uppercase tracking-widest opacity-60 italic">Atur harga untuk hitung margin</span>
                            </div>
                        </div>

                        <div className="card group p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-500 border-white/5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-60">Profit Per Cup</p>
                                <h2 className="text-3xl font-black text-[var(--text-main)] font-display tracking-tighter uppercase leading-tight">
                                    Rp {Math.max(0, sellingPrice - (totalHPPBahan / (hppData?.totalSalesCount || 1))).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                </h2>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 italic">Margin: {sellingPrice > 0 ? (((sellingPrice - (totalHPPBahan / (hppData?.totalSalesCount || 1))) / sellingPrice) * 100).toFixed(1) : 0}%</span>
                            </div>
                        </div>

                        <div className="card group p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-500 border-white/5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-60">Total HPP Bahan</p>
                                <h2 className="text-3xl font-black text-[var(--text-main)] font-display tracking-tighter uppercase leading-tight">Rp {totalHPPBahan.toLocaleString('id-ID')}</h2>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 italic">30 Hari Terakhir</span>
                            </div>
                        </div>

                        <div className="card group p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-500 border-white/5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-60">Matriks Bahan</p>
                                <h2 className="text-3xl font-black text-[var(--text-main)] font-display tracking-tighter uppercase leading-tight">{ingredientsHPP.length} <span className="text-sm opacity-40 font-bold ml-1">SKU</span></h2>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-500 text-xs font-black">sync</span>
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Sync</span>
                            </div>
                        </div>
                    </section>

                    {/* HPP Trend Chart */}
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <div className="space-y-1">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">Tren Pengeluaran</h3>
                                <p className="text-xl font-black font-display tracking-tight text-[var(--text-main)] uppercase">Historikal 30 Hari</p>
                            </div>
                            <span className="text-[9px] text-[var(--text-muted)] font-black tracking-widest uppercase bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-inner">
                                Avg: Rp {(totalHPPBahan / 30).toLocaleString('id-ID', { maximumFractionDigits: 0 })}/hari
                            </span>
                        </div>
                        <div className="card p-8 group overflow-hidden border-white/5">
                            <div className="h-48 w-full relative">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4"></stop>
                                            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"></stop>
                                        </linearGradient>
                                        <filter id="glow">
                                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                        </filter>
                                    </defs>
                                    <path d="M0,80 Q40,75 80,40 T160,50 T240,20 T320,60 T400,30 V100 H0 Z" fill="url(#chartGradient)" className="animate-pulse duration-[3s]"></path>
                                    <path d="M0,80 Q40,75 80,40 T160,50 T240,20 T320,60 T400,30" fill="none" stroke="var(--primary)" strokeLinecap="round" strokeWidth="4" filter="url(#glow)"></path>
                                </svg>
                            </div>
                            <div className="flex justify-between mt-8 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] opacity-40 px-2">
                                <span>7 Hari</span><span>14 Hari</span><span>21 Hari</span><span>Sekarang</span>
                            </div>
                        </div>
                    </section>

                    {/* High Usage Ingredients */}
                    <section className="animate-in fade-in zoom-in duration-1000">
                        <div className="space-y-1 mb-6 px-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">Kontribusi Biaya</h3>
                            <p className="text-xl font-black font-display tracking-tight text-[var(--text-main)] uppercase">Bahan Termahal (Usage)</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {ingredientsHPP.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 glass rounded-[3rem] opacity-40 border-dashed border-2">
                                    <span className="material-symbols-outlined text-6xl text-primary font-black mb-4">inventory</span>
                                    <p className="font-black text-xs uppercase tracking-widest text-[var(--text-main)]">Data Kosong</p>
                                    <p className="text-[9px] uppercase tracking-widest mt-1 opacity-60 italic">Belum ada data penjualan tercatat.</p>
                                </div>
                            ) : (
                                ingredientsHPP.map((ing: any) => (
                                    <div key={ing.id} className="card group p-5 flex items-center justify-between gap-6 hover:scale-[1.01] active:scale-[0.99] transition-all border-white/5">
                                        <div className="flex items-center gap-5 flex-1 min-w-0">
                                            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner group-hover:rotate-6 transition-transform">
                                                <span className="material-symbols-outlined text-primary text-2xl font-black">inventory_2</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-black font-display tracking-tight text-[var(--text-main)] uppercase leading-tight truncate">{ing.name}</h3>
                                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest opacity-60">{ing.totalQty.toFixed(2)} unit digunakan</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 space-y-1.5">
                                            <p className="text-xl font-black text-[var(--text-main)] font-display tracking-tighter uppercase whitespace-nowrap">Rp {ing.totalCost.toLocaleString('id-ID')}</p>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span className="text-[8px] font-black text-primary uppercase tracking-widest">{( ing.totalCost / totalHPPBahan * 100 ).toFixed(1)}%</span>
                                                <div className="w-12 bg-white/5 h-1 rounded-full overflow-hidden">
                                                    <div className="bg-primary h-full rounded-full" style={{ width: `${(ing.totalCost / totalHPPBahan * 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Info Section */}
                    <section className="pb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        <div className="card p-8 bg-primary/5 hover:bg-primary/10 transition-all border-primary/10 group overflow-hidden relative">
                            <div className="absolute -right-8 -top-8 size-40 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="flex gap-6 items-start relative z-10">
                                <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-3xl font-black">lightbulb</span>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black font-display tracking-tight text-[var(--text-main)] uppercase">Metodologi Perhitungan</h3>
                                    <p className="text-[11px] font-bold text-[var(--text-muted)] leading-relaxed uppercase tracking-widest opacity-60 italic">
                                        Angka HPP dihitung secara otomatis berdasarkan Bill of Materials (BOM) setiap menu dikalikan dengan data penjualan nyata dari modul Kasir (POS).
                                    </p>
                                    <a href={getTargetUrl(5184)} className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl glass text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all border-primary/20 shadow-xl group/link">
                                        <span className="material-symbols-outlined text-sm font-black group-hover/link:rotate-12 transition-transform">restaurant_menu</span>
                                        Kelola BOM / Resep
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </Layout>
    );
}

export default App;
