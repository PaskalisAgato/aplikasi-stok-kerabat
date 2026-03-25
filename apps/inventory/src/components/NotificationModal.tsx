import React from 'react';

interface NotificationCardProps {
    image: string;
    title: string;
    status: 'CRITICAL' | 'LOW';
    time: string;
    stockInfo: string;
    showRestock?: boolean;
    showUpdate?: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
    image, title, status, time, stockInfo, showRestock, showUpdate
}) => (
    <div className="bg-[var(--bg-app)] border-2 border-[var(--border-dim)] rounded-3xl overflow-hidden shadow-2xl transition-all">
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
                    <span className="text-[10px] text-muted font-medium">{time}</span>
                </div>
                <h3 className="text-base font-bold text-main">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 align-middle" />
                    {title}
                </h3>
                <p className="text-sm text-muted">
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
                    <button className="px-3 bg-surface hover:bg-primary/10 text-main rounded-lg border border-border-dim transition-all">
                        <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                </div>
            ) : showUpdate ? (
                <button className="w-full bg-surface hover:bg-primary/10 text-main py-2.5 rounded-lg font-semibold text-sm transition-all border border-border-dim">
                    Update Stok
                </button>
            ) : null}
        </div>
    </div>
);

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventory?: any[]; // Allow undefined for fallback compatibility
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, inventory = [] }) => {
    if (!isOpen) return null;

    const criticalItems = inventory.filter(item => item.status === 'KRITIS' || item.status === 'HABIS');

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[var(--bg-app)] border-b border-[var(--border-dim)] px-4 py-4 flex items-center gap-4">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-surface rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined text-main">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight text-main">Notifikasi Stok</h1>
            </header>

            {/* Filter Tabs */}
            <div className="px-4 py-3 bg-background-app/40 sticky top-0 z-10 backdrop-blur-sm border-b border-border-dim">
                <div className="flex gap-2">
                    <button className="px-6 py-2 rounded-full bg-primary text-white text-xs font-bold transition-all shadow-lg shadow-primary/20">
                        Semua
                    </button>
                    <button className="px-6 py-2 rounded-full bg-surface border border-border-dim text-muted text-xs font-bold hover:bg-primary/10 transition-all">
                        Belum Dibaca
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary font-bold">Stok Kritis / Habis</h2>
                        <span className="text-xs text-muted">{criticalItems.length} Alerts</span>
                    </div>

                    {criticalItems.length === 0 ? (
                        <div className="text-center py-10 text-muted">
                            Semua stok dalam kondisi aman.
                        </div>
                    ) : (
                        criticalItems.map(item => (
                            <NotificationCard
                                key={item.id}
                                image={item.imageUrl || ""}
                                title={item.name}
                                status={item.status === 'HABIS' ? 'CRITICAL' : 'LOW'}
                                time="Baru saja"
                                stockInfo={`${item.currentStock} ${item.unit}`}
                                showRestock
                            />
                        ))
                    )}
                </section>
            </main>
        </div>
    );
};

export default NotificationModal;

