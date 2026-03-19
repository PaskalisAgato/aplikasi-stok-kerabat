import { INVENTORY } from '@shared/mockDatabase';
import Layout from '@shared/Layout';

function App() {
    return (
        <Layout
            currentPort={5183}
            title="COGS Analysis"
            subtitle="Cost of Goods Sold Insights"
        >
            <div className="space-y-10">
                {/* Ingredient Summary */}
                <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="card group p-8 flex flex-col sm:flex-row gap-8 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] border-white/5 relative overflow-hidden">
                        <div
                            className="size-32 rounded-[2rem] bg-[var(--bg-app)] bg-center bg-no-repeat bg-cover border-4 border-white/10 shadow-2xl transition-transform duration-700 group-hover:rotate-3 group-hover:scale-110 shrink-0"
                            style={{ backgroundImage: `url('${INVENTORY[0].imageUrl}')` }}
                            title={INVENTORY[0].name}
                        ></div>
                        
                        <div className="flex-1 space-y-4 relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-3xl font-black font-display tracking-tighter text-[var(--text-main)] uppercase leading-none group-hover:text-primary transition-colors">{INVENTORY[0].name}</h3>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80">Top Expenditure Item</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl font-black text-primary font-display tracking-tighter uppercase leading-none">Rp 125.000 <span className="text-xs opacity-40 font-bold">/ {INVENTORY[0].unit}</span></p>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xs text-[var(--text-muted)] font-black">schedule</span>
                                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Terakhir Diperbarui: 2 Jam Lalu</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Decorative Background Blob */}
                        <div className="absolute top-0 right-0 size-40 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
                    </div>
                </section>

                {/* KPI Cards */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="card group p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-500 border-white/5 relative overflow-hidden">
                        <div className="space-y-2 relative z-10">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-60">Total Pengadaan (Bulan Ini)</p>
                            <h2 className="text-5xl font-black text-[var(--text-main)] font-display tracking-tighter uppercase leading-none">Rp 4.2M</h2>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 italic">Accumulated Spending Portfolio</span>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-500 text-sm font-black">trending_up</span>
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">+12.4%</span>
                            </div>
                        </div>
                         {/* Decorative Background Blob */}
                         <div className="absolute -left-10 -bottom-10 size-48 bg-primary/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
                    </div>
                </section>

                {/* Advice Section */}
                <section className="pb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <div className="card p-8 bg-primary/5 hover:bg-primary/10 transition-all border-primary/10 group overflow-hidden relative">
                        <div className="flex gap-6 items-start relative z-10">
                            <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl font-black">analytics</span>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-black font-display tracking-tight text-[var(--text-main)] uppercase">Metrik COGS Dinamis</h3>
                                <p className="text-[11px] font-bold text-[var(--text-muted)] leading-relaxed uppercase tracking-widest opacity-60 italic">
                                    Data COGS ditarik secara realtime dari pergerakan stok 'MASUK' dan disinkronkan dengan harga beli terbaru. Membantu identifikasi produk dengan beban biaya tertinggi.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
}

export default App;
