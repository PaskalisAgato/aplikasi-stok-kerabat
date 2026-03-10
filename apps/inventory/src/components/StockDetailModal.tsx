import React from 'react';

interface StockDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const StockDetailModal: React.FC<StockDetailModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        /* Full-screen overlay */
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            {/* Bottom Sheet */}
            <div className="w-full bg-background-light dark:bg-background-dark rounded-t-xl shadow-2xl flex flex-col max-h-[92vh] border-t border-primary/20">

                {/* Drag Handle Area (Click to close for now) */}
                <button
                    onClick={onClose}
                    className="flex h-6 w-full items-center justify-center cursor-pointer hover:bg-black/5 rounded-t-xl transition-colors"
                >
                    <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-primary/30" />
                </button>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Header Item Detail */}
                    <div className="flex p-4">
                        <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-between items-start">
                            <div className="flex gap-4 items-center">
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl min-h-[6rem] w-24 bg-primary/10 border border-primary/20"
                                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCuurHJ0EvS4x2sNETvQ4se_9e7W_9c-rzdvRKYAPE2FWSaquvoRKl_LPJfnWjCmdRaMhpieJbcR9ElGLKINlrcRCwVqPS5ctwUg1ClQNW8lHLux-cdPmQ-WETYs8ZslKD_Bu4omNG1UrF__SI0QyVsXWcybJTFDfX-XCRRfTk3lkEvZko9qJg24G1S78wrikk-jr6nXhX8iJIUagT-XvgLcgvpk-MYlOX52UxVmSWav0XlgQKBxS7hthrzo7nUZPBI3rtYo9_TQyc")' }}
                                />
                                <div className="flex flex-col">
                                    <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold leading-tight">Kopi Bubuk Arabica</h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                                        <p className="text-primary font-semibold text-lg">1.2kg remaining</p>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Last updated: 2 hours ago</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recipe Usage Section */}
                    <div className="px-4 py-2">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold tracking-tight">Recipe Usage</h3>
                            <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary uppercase tracking-wider">Inventory Linked</span>
                        </div>
                        <div className="space-y-2">
                            {/* Usage Card 1 */}
                            <div className="flex items-center gap-4 bg-slate-100 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 p-3 rounded-lg justify-between hover:bg-slate-200 dark:hover:bg-primary/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
                                        <span className="material-symbols-outlined">coffee</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-slate-900 dark:text-slate-100 text-base font-semibold">Kopi O</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs">Serving portion: 20g</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-900 dark:text-slate-100 text-sm font-medium">60 Servings</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px]">potential yield</p>
                                </div>
                            </div>

                            {/* Usage Card 2 */}
                            <div className="flex items-center gap-4 bg-slate-100 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 p-3 rounded-lg justify-between hover:bg-slate-200 dark:hover:bg-primary/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
                                        <span className="material-symbols-outlined">water_drop</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-slate-900 dark:text-slate-100 text-base font-semibold">Kopi Susu</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs">Serving portion: 15g</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-900 dark:text-slate-100 text-sm font-medium">80 Servings</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px]">potential yield</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock History Section */}
                    <div className="px-4 py-4 mt-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold tracking-tight">Stock History</h3>
                            <button className="text-primary text-sm font-medium hover:underline">View All</button>
                        </div>

                        <div className="space-y-4">
                            {/* History Item 1 */}
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-green-500 text-lg">add</span>
                                </div>
                                <div className="flex-1 border-b border-slate-200 dark:border-primary/10 pb-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-slate-900 dark:text-slate-100 font-medium">Supplier Delivery</p>
                                        <p className="text-green-500 font-bold">+5.0 kg</p>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Oct 24, 2023 • 09:15 AM</p>
                                </div>
                            </div>

                            {/* History Item 2 */}
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-red-500 text-lg">remove</span>
                                </div>
                                <div className="flex-1 border-b border-slate-200 dark:border-primary/10 pb-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-slate-900 dark:text-slate-100 font-medium">Daily Usage Adjustment</p>
                                        <p className="text-red-500 font-bold">-0.8 kg</p>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Oct 23, 2023 • 10:00 PM</p>
                                </div>
                            </div>

                            {/* History Item 3 */}
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-red-500 text-lg">remove</span>
                                </div>
                                <div className="flex-1 pb-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-slate-900 dark:text-slate-100 font-medium">Waste Recorded</p>
                                        <p className="text-red-500 font-bold">-0.2 kg</p>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Oct 23, 2023 • 04:30 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Bottom Actions */}
                <div className="p-4 flex gap-3 sticky bottom-0 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-primary/10">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-lg active:scale-95 transition-transform">
                        <span className="material-symbols-outlined">inventory</span>
                        Update Stock
                    </button>
                    <button className="flex h-auto px-4 items-center justify-center bg-slate-100 dark:bg-primary/20 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-primary/30 hover:bg-slate-200 dark:hover:bg-primary/30 transition-colors">
                        <span className="material-symbols-outlined">edit</span>
                    </button>
                </div>

                {/* Bottom Padding for iOS safe area */}
                <div className="h-6 bg-background-light dark:bg-background-dark" />
            </div>
        </div>
    );
};

export default StockDetailModal;
