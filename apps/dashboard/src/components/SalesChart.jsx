export default function SalesChart({ reports }) {
    if (!reports || !reports.topMenus) return null;

    const topMenus = reports.topMenus;
    const maxQty = Math.max(...topMenus.map(m => m.totalQty), 1);

    return (
        <section className="card group relative overflow-hidden transition-all duration-700">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>

            <div className="flex items-center justify-between mb-12 relative z-10">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black font-display tracking-tight leading-tight uppercase">5 Menu Terlaris</h2>
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] opacity-80">Berdasarkan volume penjualan saat ini</p>
                </div>
                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <span className="material-symbols-outlined text-3xl font-black">analytics</span>
                </div>
            </div>

            <div className="flex items-end justify-between h-56 gap-5 mt-6 px-2 relative z-10">
                {topMenus.map((item, index) => {
                    const height = (item.totalQty / maxQty) * 100;
                    return (
                        <div key={item.recipeId} className="flex flex-col items-center gap-4 flex-1 group/bar relative">
                            {/* Value Label */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 scale-90 group-hover/bar:scale-100">
                                <div className="glass px-3 py-1 rounded-lg">
                                    <p className="text-[10px] font-black text-primary">{item.totalQty} terjual</p>
                                </div>
                            </div>

                            {/* Bar */}
                            <div 
                                className={`w-full relative transition-all duration-1000 ease-out overflow-hidden rounded-[1.25rem] shadow-xl group-hover/bar:-translate-y-1`} 
                                style={{ height: `${height}%` }}
                            >
                                <div className={`absolute inset-0 accent-gradient opacity-40`}></div>
                                <div className={`absolute inset-0 bg-gradient-to-t from-black/40 to-white/10`}></div>
                                
                                {index === 0 && (
                                    <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10">
                                        <div className="bg-primary text-slate-950 text-[10px] size-6 flex items-center justify-center rounded-full shadow-lg font-black animate-bounce">#1</div>
                                    </div>
                                )}
                            </div>

                            {/* Menu Name */}
                            <div className="w-full space-y-1">
                                <span className="text-[9px] font-black text-[var(--text-muted)] truncate block w-full text-center uppercase tracking-wider group-hover/bar:text-primary transition-colors" title={item.name}>
                                    {item.name}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {topMenus.length === 0 && (
                    <div className="w-full flex flex-col items-center justify-center h-full text-[var(--text-muted)] italic opacity-40 py-10">
                        <span className="material-symbols-outlined text-6xl mb-4 font-black">bar_chart</span>
                        <p className="text-xs font-black uppercase tracking-widest">Belum ada data penjualan tersedia</p>
                    </div>
                )}
            </div>
        </section>
    );
}

