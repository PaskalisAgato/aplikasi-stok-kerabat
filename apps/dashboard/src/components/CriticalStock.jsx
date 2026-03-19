export default function CriticalStock({ inventory }) {
    if (!inventory) return null;

    const criticalItems = inventory.filter(item => 
        parseFloat(item.currentStock) <= parseFloat(item.minStock)
    );

    return (
        <section className="mt-2 px-0">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-main text-lg font-black flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-500 text-2xl">warning</span>
                    Stok Kritis
                </h2>
                <span className="text-primary text-xs bg-primary/10 px-3 py-1 rounded-full font-black">
                    {criticalItems.length} Bahan
                </span>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {criticalItems.length > 0 ? criticalItems.map(item => (
                    <div key={item.id} className="card p-4 flex items-center gap-4 group hover:border-orange-500/30 transition-all">
                        <div className="size-14 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-red-500 text-2xl">inventory_2</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-main truncate">{item.name}</h3>
                            <p className="text-xs text-muted mt-1">Sisa: <span className="text-red-500 font-black">{item.currentStock} {item.unit}</span></p>
                            <div className="w-full bg-background-app h-1.5 rounded-full mt-2 overflow-hidden">
                                <div 
                                    className="bg-red-500 h-full rounded-full" 
                                    style={{ width: `${Math.min(100, (parseFloat(item.currentStock)/parseFloat(item.minStock || 1)) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="card p-8 bg-emerald-500/5 border-emerald-500/20 text-center flex flex-col items-center text-main">
                        <span className="material-symbols-outlined text-emerald-500 text-5xl mb-3">check_circle</span>
                        <p className="text-emerald-500 font-black text-sm uppercase tracking-widest">Semua Stok Aman</p>
                    </div>
                )}
            </div>
        </section>
    );
}

