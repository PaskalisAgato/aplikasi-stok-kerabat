export default function KPICards({ reports }) {
    if (!reports) return null;

    const { revenueToday, expenses, netProfit } = reports;

    return (
        <section className="px-4 py-2">
            <div className="grid grid-cols-1 gap-3">
                {/* Pemasukan */}
                <div className="flex flex-col gap-1 rounded-xl p-5 bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-emerald-500 dark:text-emerald-400 text-sm font-semibold uppercase tracking-wider">Penjualan Hari Ini</p>
                        <span className="material-symbols-outlined text-emerald-500 text-lg">trending_up</span>
                    </div>
                    <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">Rp {(revenueToday || 0).toLocaleString('id-ID')}</p>
                    <p className="text-emerald-500 text-xs font-medium">Data real-time</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {/* Pengeluaran */}
                    <div className="flex flex-col gap-1 rounded-xl p-4 bg-red-500/10 border border-red-500/20">
                        <p className="text-red-500 dark:text-red-400 text-[11px] font-semibold uppercase tracking-wider">Pengeluaran Total</p>
                        <p className="text-slate-900 dark:text-white text-lg font-bold">Rp {(expenses || 0).toLocaleString('id-ID')}</p>
                        <p className="text-red-500 text-[10px] font-medium">Beban operasional</p>
                    </div>
                    {/* Net Profit */}
                    <div className="flex flex-col gap-1 rounded-xl p-4 bg-primary/10 border border-primary/20">
                        <p className="text-primary text-[11px] font-semibold uppercase tracking-wider">Profit Bersih</p>
                        <p className="text-slate-900 dark:text-white text-lg font-bold">Rp {(netProfit || 0).toLocaleString('id-ID')}</p>
                        <p className="text-primary text-[10px] font-medium">Akumulasi laba</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
