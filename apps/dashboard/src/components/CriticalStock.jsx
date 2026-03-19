export default function CriticalStock({ inventory }) {
    if (!inventory) return null;

    const criticalItems = inventory.filter(item => 
        parseFloat(item.currentStock) <= parseFloat(item.minStock)
    );

    return (
        <section className="space-y-8 animate-in fade-in slide-in-from-right duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <span className="material-symbols-outlined font-black">warning</span>
                    </div>
                    <h2 className="text-xl font-black font-display tracking-tight uppercase">Stok Kritis</h2>
                </div>
                <div className="glass px-4 py-1.5 rounded-full border-orange-500/20">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none">{criticalItems.length} BAHAN</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {criticalItems.length > 0 ? criticalItems.map(item => (
                    <div key={item.id} className="card group hover:translate-x-1 transition-all">
                        <div className="flex items-center gap-5">
                            <div className="size-14 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0 shadow-lg group-hover:bg-red-500 group-hover:text-slate-950 transition-all">
                                <span className="material-symbols-outlined text-2xl font-black text-red-500 group-hover:text-slate-950">inventory_2</span>
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-black text-[var(--text-main)] truncate font-display uppercase tracking-wide">{item.name}</h3>
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{item.currentStock} {item.unit}</p>
                                </div>
                                <div className="w-full bg-[var(--bg-app)] h-2 rounded-full overflow-hidden border border-[var(--border-dim)]">
                                    <div 
                                        className="bg-red-500 h-full rounded-full transition-all duration-1000 accent-glow" 
                                        style={{ width: `${Math.max(5, (parseFloat(item.currentStock)/parseFloat(item.minStock || 1)) * 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">Ambang Batas: {item.minStock} {item.unit}</p>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="card text-center p-12 bg-emerald-500/5 border-emerald-500/10 flex flex-col items-center gap-4 group">
                        <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-5xl font-black">verified</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-emerald-500 font-black text-sm uppercase tracking-[0.3em]">OPERASI AMAN</p>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Semua stok bahan mencukupi</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

