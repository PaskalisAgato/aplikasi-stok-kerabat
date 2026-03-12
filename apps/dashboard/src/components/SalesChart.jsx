export default function SalesChart({ reports }) {
    if (!reports || !reports.topMenus) return null;

    const topMenus = reports.topMenus;
    const maxQty = Math.max(...topMenus.map(m => m.totalQty), 1);

    return (
        <section className="mt-6 px-4">
            <div className="bg-slate-500/5 dark:bg-white/5 rounded-xl p-5 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">5 Menu Terlaris</h2>
                        <p className="text-slate-500 text-xs">Berdasarkan volume penjualan</p>
                    </div>
                    <span className="material-symbols-outlined text-primary">analytics</span>
                </div>

                <div className="flex items-end justify-between h-32 gap-3 mt-4 px-1">
                    {topMenus.map((item, index) => {
                        const height = (item.totalQty / maxQty) * 100;
                        return (
                            <div key={item.recipeId} className="flex flex-col items-center gap-2 flex-1 group relative">
                                <div 
                                    className={`w-full bg-primary/20 rounded-t-lg relative transition-all duration-700`} 
                                    style={{ height: `${height}%` }}
                                >
                                    <div className="absolute bottom-0 w-full bg-primary/40 rounded-t-lg h-1/2"></div>
                                    {index === 0 && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded shadow-lg font-bold">TOP</div>
                                    )}
                                </div>
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold truncate w-full text-center" title={item.name}>
                                    {item.name}
                                </span>
                            </div>
                        );
                    })}
                    {topMenus.length === 0 && (
                        <div className="w-full flex items-center justify-center h-full text-slate-400 text-xs italic">
                            Belum ada data penjualan
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
