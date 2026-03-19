import React from 'react';

const NotificationCard = ({
    image, title, status, time, stockInfo, showRestock, showUpdate
}) => (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 flex gap-4">
            <div
                className="w-20 h-20 rounded-lg bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url('${image}')` }}
            />
            <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-widest ${status === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-500 border-red-500/30'
                            : 'bg-orange-400/20 text-orange-400 border-orange-400/30'
                        }`}>
                        {status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">{time}</span>
                </div>
                <h3 className="text-base font-bold text-white">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 align-middle" />
                    {title}
                </h3>
                <p className="text-sm text-slate-400">
                    Stok: <span className={`${status === 'CRITICAL' ? 'text-red-500' : 'text-orange-400'} font-semibold`}>
                        {stockInfo}
                    </span> tersisa
                </p>
            </div>
        </div>
        <div className="px-4 pb-4">
            {showRestock ? (
                <div className="flex gap-2">
                    <button className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all">
                        <span className="material-symbols-outlined text-sm">shopping_cart</span>
                        Restock Now
                    </button>
                    <button className="px-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-all">
                        <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                </div>
            ) : showUpdate ? (
                <button className="w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg font-semibold text-sm transition-all">
                    Update Stok
                </button>
            ) : null}
        </div>
    </div>
);

const NotificationModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background-dark text-slate-100 overflow-hidden font-display">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background-dark/80 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center gap-4">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined text-slate-100">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight text-slate-100">Notifikasi Stok</h1>
            </header>

            {/* Filter Tabs */}
            <div className="px-4 py-3 bg-background-dark/40 sticky top-0 z-10 backdrop-blur-sm">
                <div className="flex gap-2">
                    <button className="px-6 py-2 rounded-full bg-primary text-white text-xs font-bold transition-all shadow-lg shadow-primary/20">
                        Semua
                    </button>
                    <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/10 transition-all">
                        Belum Dibaca
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                {/* Section: Today */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary font-bold">Hari Ini</h2>
                        <span className="text-xs text-slate-400">3 Alerts</span>
                    </div>

                    <NotificationCard
                        image="https://lh3.googleusercontent.com/aida-public/AB6AXuChtQCTFMl2EAT5uWHkcJnUbfRvTrhci9joQCuujP095U-qEfSS10MKx-H1jYoSWVIMGKqblk7_Wsipvpe5emEhWp3tnjRfwHIZrqQ64Acp15JDON_hFMvGX9qUIIhKkMR2EWsD49xrLY1h1ABX7SW8kTCKkxkLQ7BNAAvcvpRiLYDiWSEGT_4KCfquQkWf-0LDJreJFoIbFMsiwEPQQtPnRwAqNTthuVSBC0AQ0iQJE0UgxvvxVLREO8anfzFd7zS_x9VD2XF4PpM"
                        title="Kopi Bubuk Arabica"
                        status="CRITICAL"
                        time="10 mins ago"
                        stockInfo="0.2kg"
                        showRestock
                    />

                    <NotificationCard
                        image="https://lh3.googleusercontent.com/aida-public/AB6AXuCU0QEoSTr-awtj8LzL4hth_Rr9Oe6aDL7TfH1QI8EnVz4ezNBiGmlyU-NF6Z9cMpvf58DWaz-HMxWYY8wN-iM-I9yBMp25Da8yvarXHe8UlhkFxVPakViMKh2F6Vo2EeGARgZd2yPGJFFc707jGsxfJ4RDZbwqkRmZPG1SoOVZu00gj-XXRWfqmevLXQsMS4bnI95HYIHJj-dmlJAr5GITxBZP7pn48kyRXXj3M-HYdNqDlzmrHXw88_a-Z_SZdEqWmKbtyPBF4pc"
                        title="Susu UHT Full Cream"
                        status="CRITICAL"
                        time="2 hours ago"
                        stockInfo="3 Liter"
                        showRestock
                    />
                </section>

                {/* Section: Yesterday */}
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-primary font-bold">Kemarin</h2>

                    <NotificationCard
                        image="https://lh3.googleusercontent.com/aida-public/AB6AXuAaeU6dvNyqxEXe-GKIp8fIx09exZUYe_hX4wzqwVhs9y_u1CfPsNIzA6ciCKyQ3fiRYfrHcKfW1A3GkgqCBKUt1NFZgcu6keolyRZwfGpTbpLg89puJXBfQMkZjGyDW4yG2-DQa06L2jSINcDy1j9Xml7Jspk1bl_IJTlWEp32Ju0eOuKrDDExbM1B1JE8h8OxLLmTu2aF0K-YU2H_cZjt6BDOYvQXkSGa5oxCPdE9pjx8tWMgsj9eBsqZ74ZoZdAz2FS7sTGBko4"
                        title="Gula Aren Cair"
                        status="LOW"
                        time="1 day ago"
                        stockInfo="1.5kg"
                        showUpdate
                    />
                </section>
            </main>
        </div>
    );
};

export default NotificationModal;

