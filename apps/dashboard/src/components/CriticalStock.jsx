export default function CriticalStock({ inventory }) {
    if (!inventory) return null;

    const criticalItems = inventory.filter(item => 
        parseFloat(item.currentStock) <= parseFloat(item.minStock)
    );

    return (
        <section className="mt-8 px-4 pb-20">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-900 dark:text-white text-base font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-500 text-xl">warning</span>
                    Stok Kritis
                </h2>
                <span className="text-primary text-[10px] bg-primary/10 px-2 py-0.5 rounded-full font-bold">
                    {criticalItems.length} Bahan
                </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {criticalItems.length > 0 ? criticalItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <div className="size-12 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-red-500">inventory_2</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Sisa: <span className="text-red-500 font-bold">{item.currentStock} {item.unit}</span></p>
                            <p className="text-[9px] text-slate-400">Min: {item.minStock} {item.unit}</p>
                        </div>
                    </div>
                )) : (
                    <div className="bg-emerald-500/10 p-6 rounded-xl border border-emerald-500/20 text-center">
                        <p className="text-emerald-500 font-bold text-sm">Semua stok aman</p>
                    </div>
                )}
            </div>
        </section>
    );
}
