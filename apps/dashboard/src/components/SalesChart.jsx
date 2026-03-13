export default function SalesChart({ reports }) {
    if (!reports || !reports.topMenus) return null;

    const topMenus = reports.topMenus;
    const maxQty = Math.max(...topMenus.map(m => m.totalQty), 1);

    return (
        <section className="mt-6 px-4">
        <section className="card p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-slate-900  text-lg font-black leading-tight">5 Menu Terlaris</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Berdasarkan volume penjualan</p>
                </div>
                <span className="material-symbols-outlined text-primary text-3xl">analytics</span>
            </div>

            <div className="flex items-end justify-between h-48 gap-4 mt-4 px-2">
                {topMenus.map((item, index) => {
                    const height = (item.totalQty / maxQty) * 100;
                    return (
                        <div key={item.recipeId} className="flex flex-col items-center gap-3 flex-1 group relative">
                            <div 
                                className={`w-full bg-primary/20 rounded-t-xl relative transition-all duration-700 overflow-hidden group-hover:bg-primary/30`} 
                                style={{ height: `${height}%` }}
                            >
                                <div className="absolute bottom-0 w-full bg-primary/40 h-1/2"></div>
                                {index === 0 && (
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-2 py-1 rounded-full shadow-lg font-black z-10">#1</div>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-500  font-black truncate w-full text-center uppercase tracking-tighter" title={item.name}>
                                {item.name}
                            </span>
                        </div>
                    );
                })}
                {topMenus.length === 0 && (
                    <div className="w-full flex flex-col items-center justify-center h-full text-slate-400 text-sm italic opacity-50">
                        <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
                        Belum ada data penjualan
                    </div>
                )}
            </div>
        </section>
        </section>
    );
}

