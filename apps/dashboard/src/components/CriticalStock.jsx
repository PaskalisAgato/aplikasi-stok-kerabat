import { INVENTORY } from '@shared/mockDatabase';

export default function CriticalStock() {
    const criticalItems = INVENTORY.filter(item => item.status === 'KRITIS');

    return (
        <section className="mt-8 px-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-900 dark:text-white text-base font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-500 text-xl">warning</span>
                    Stok Kritis
                </h2>
                <a className="text-primary text-xs font-semibold" href="#">Lihat Semua</a>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {criticalItems.length > 0 ? criticalItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 bg-background-light dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                        <div className="size-12 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-red-500">inventory_2</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Sisa: <span className="text-red-500 font-bold">{item.currentStock} {item.unit}</span></p>
                        </div>
                        <button className="bg-primary hover:bg-primary/90 transition-colors text-white text-xs font-bold px-3 py-1.5 rounded-lg">Restock</button>
                    </div>
                )) : (
                    <div className="bg-emerald-500/10 p-6 rounded-xl border border-emerald-500/20 text-center">
                        <p className="text-emerald-500 font-bold">Semua stok aman</p>
                    </div>
                )}
            </div>
        </section>
    );
}
