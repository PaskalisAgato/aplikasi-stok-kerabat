import { EXPENSES, RECIPES } from '@shared/mockDatabase';

export default function KPICards() {
    const totalExpenses = EXPENSES.reduce((sum, e) => sum + e.amount, 0);
    const totalSales = RECIPES.length * 1500000; // Mock calculation based on recipes
    const profit = totalSales - totalExpenses;

    return (
        <section className="px-4 py-2">
            <div className="grid grid-cols-1 gap-3">
                {/* Pemasukan */}
                <div className="flex flex-col gap-1 rounded-xl p-5 bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-emerald-500 dark:text-emerald-400 text-sm font-semibold uppercase tracking-wider">Penjualan</p>
                        <span className="material-symbols-outlined text-emerald-500 text-lg">trending_up</span>
                    </div>
                    <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">Rp {totalSales.toLocaleString('id-ID')}</p>
                    <p className="text-emerald-500 text-xs font-medium">+12% dari kemarin</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {/* Pengeluaran */}
                    <div className="flex flex-col gap-1 rounded-xl p-4 bg-red-500/10 border border-red-500/20">
                        <p className="text-red-500 dark:text-red-400 text-[11px] font-semibold uppercase tracking-wider">Pengeluaran</p>
                        <p className="text-slate-900 dark:text-white text-lg font-bold">Rp {totalExpenses.toLocaleString('id-ID')}</p>
                        <p className="text-red-500 text-[10px] font-medium">-5% efisiensi</p>
                    </div>
                    {/* Net Profit */}
                    <div className="flex flex-col gap-1 rounded-xl p-4 bg-primary/10 border border-primary/20">
                        <p className="text-primary text-[11px] font-semibold uppercase tracking-wider">Profit Bersih</p>
                        <p className="text-slate-900 dark:text-white text-lg font-bold">Rp {profit.toLocaleString('id-ID')}</p>
                        <p className="text-primary text-[10px] font-medium">+18% naik</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
