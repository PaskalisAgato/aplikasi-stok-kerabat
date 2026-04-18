export default function KPICards({ reports }) {
    if (!reports) return null;

    const { revenueToday, expenses, netProfit } = reports;

    const cards = [
        { 
            label: 'Penjualan Hari Ini', 
            val: revenueToday, 
            icon: 'payments', 
            color: 'rgb(16, 185, 129)', 
            tag: 'Real-time',
            gradient: 'from-emerald-400 to-emerald-600'
        },
        { 
            label: 'Pengeluaran', 
            val: expenses, 
            icon: 'shopping_cart', 
            color: 'rgb(239, 68, 68)', 
            tag: 'Operasional',
            gradient: 'from-rose-400 to-rose-600'
        },
        { 
            label: 'Profit Bersih', 
            val: netProfit, 
            icon: 'account_balance_wallet', 
            color: 'var(--primary)', 
            tag: 'Laba Bersih',
            gradient: 'accent-gradient'
        }
    ];

    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {cards.map((card, i) => (
                <div key={i} className="card group relative overflow-hidden flex flex-col items-center text-center">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                       <span className="material-symbols-outlined text-8xl transition-all group-hover:scale-110">{card.icon}</span>
                    </div>
                    <div className={`size-20 rounded-[1.5rem] bg-slate-900 flex items-center justify-center mb-6 shadow-xl ${card.gradient === 'accent-gradient' ? 'accent-gradient' : `bg-gradient-to-br ${card.gradient}`} text-[var(--text-main)]`}>
                        <span className="material-symbols-outlined text-4xl font-black">{card.icon}</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">{card.label}</p>
                        <p className={`text-3xl font-black font-display tracking-tight ${card.label === 'Profit Bersih' ? 'text-primary' : 'text-[var(--text-main)]'}`}>
                            Rp {(card.val || 0).toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="mt-8 px-5 py-2 glass rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80" style={{ color: card.color }}>{card.tag}</p>
                    </div>
                </div>
            ))}
        </section>
    );
}

