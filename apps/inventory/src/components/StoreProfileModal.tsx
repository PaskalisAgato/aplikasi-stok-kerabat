import React from 'react';

interface StoreProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const StoreProfileModal: React.FC<StoreProfileModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background-app text-main overflow-y-auto pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-background-app/80 backdrop-blur-md p-4 border-b border-border-dim justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="text-primary cursor-pointer hover:bg-primary/10 p-1 rounded-full transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold tracking-tight text-main">Store Profile</h1>
                </div>
                <button
                    onClick={onClose}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
                >
                    Save
                </button>
            </header>

            <main className="max-w-md mx-auto px-4 py-6 space-y-8 flex-1 w-full">
                {/* Logo Section */}
                <section className="flex flex-col items-center gap-4">
                    <div className="relative group">
                        <div
                            className="size-32 rounded-full border-4 border-primary/20 bg-cover bg-center overflow-hidden shadow-xl"
                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB9y1ZtNrs-R-ME1VxmCsiwQXfT_9WC5qRA_13BZhUHZMF0IFepSachNUKI6TDCMbE6FWj-co06LKFuN_Kjl4UmqBXFv6_fXIEsiDvaQUQopz7p7k5yCaHkWc63GP75fYyhHKqG1j71nVNBahFz-U_gCnm_5qHYdq3XK2mlEFC2hH3MVt8JvTJdL2Pjcf1FXMVrOPdKl2d6vwjyZVet-WUZQucx9djoOHvg-BWH3jWqVvb89ZG6zis-VJ7vNnBsEHbNcKKtXrOzMzE')" }}
                        >
                        </div>
                        <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-background-app active:scale-90 transition-transform">
                            <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold italic text-primary">Kerabat Kopi Tiam</h2>
                        <p className="text-muted text-sm font-bold">Traditional Taste, Modern Connection</p>
                    </div>
                </section>

                {/* General Information Form */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-border-dim">
                        <span className="material-symbols-outlined text-primary text-xl font-bold">info</span>
                        <h3 className="font-bold text-sm uppercase tracking-wider text-muted">General Information</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-muted ml-1 uppercase">Store Name</label>
                            <input
                                className="w-full bg-background-app border border-border-dim rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-main placeholder:text-muted"
                                type="text"
                                defaultValue="Kerabat Kopi Tiam"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-muted ml-1 uppercase">Tagline / Slogan</label>
                            <input
                                className="w-full bg-background-app border border-border-dim rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-main placeholder:text-muted"
                                placeholder="e.g. Authentic Brews"
                                type="text"
                                defaultValue="Traditional Taste, Modern Connection"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-muted ml-1 uppercase">Address</label>
                            <textarea
                                className="w-full bg-background-app border border-border-dim rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-main resize-none placeholder:text-muted"
                                rows={3}
                                defaultValue="Jl. Gajah Mada No. 123, Central Jakarta, Indonesia"
                            />
                        </div>
                    </div>
                </section>

                {/* Contact & Localization */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-border-dim">
                        <span className="material-symbols-outlined text-primary text-xl font-bold">contact_support</span>
                        <h3 className="font-bold text-sm uppercase tracking-wider text-muted">Contact & Settings</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-muted ml-1 uppercase">WhatsApp Number</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg">call</span>
                                <input
                                    className="w-full bg-background-app border border-border-dim rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary text-main"
                                    type="tel"
                                    defaultValue="+62 812-3456-7890"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-muted ml-1 uppercase">Email Address</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg">mail</span>
                                <input
                                    className="w-full bg-background-app border border-border-dim rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary text-main"
                                    type="email"
                                    defaultValue="hello@kerabatkopi.id"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-muted ml-1 uppercase">Currency Preference</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg">payments</span>
                                <select className="w-full bg-background-app border border-border-dim rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary text-main appearance-none">
                                    <option className="bg-background-app" value="IDR">Indonesian Rupiah (IDR)</option>
                                    <option className="bg-background-app" value="USD">US Dollar (USD)</option>
                                    <option className="bg-background-app" value="SGD">Singapore Dollar (SGD)</option>
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined pointer-events-none">expand_more</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Operational Hours */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-border-dim">
                        <span className="material-symbols-outlined text-primary text-xl font-bold">schedule</span>
                        <h3 className="font-bold text-sm uppercase tracking-wider text-muted">Operational Hours</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-muted ml-1 uppercase">Opening Time</label>
                            <div className="relative">
                                <input
                                    className="w-full bg-background-app border border-border-dim rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-main"
                                    type="time"
                                    defaultValue="07:00"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-muted ml-1 uppercase">Closing Time</label>
                            <div className="relative">
                                <input
                                    className="w-full bg-background-app border border-border-dim rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-main"
                                    type="time"
                                    defaultValue="22:00"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Save Button */}
                <div className="pt-4 pb-12">
                    <button
                        onClick={onClose}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">save</span>
                        Save All Changes
                    </button>
                </div>
            </main>

            {/* Bottom Nav Placeholder (Visual match only) */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background-app border-t border-border-dim px-4 pb-6 pt-2">
                <div className="flex justify-between items-center max-w-md mx-auto">
                    <button className="flex flex-1 flex-col items-center gap-1 text-muted">
                        <span className="material-symbols-outlined">dashboard</span>
                        <p className="text-[10px] font-bold uppercase">Dashboard</p>
                    </button>
                    <button className="flex flex-1 flex-col items-center gap-1 text-muted">
                        <span className="material-symbols-outlined">shopping_bag</span>
                        <p className="text-[10px] font-bold uppercase">Orders</p>
                    </button>
                    <button className="flex flex-1 flex-col items-center gap-1 text-muted">
                        <span className="material-symbols-outlined">coffee</span>
                        <p className="text-[10px] font-bold uppercase">Menu</p>
                    </button>
                    <button className="flex flex-1 flex-col items-center gap-1 text-primary">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
                        <p className="text-[10px] font-bold uppercase">Settings</p>
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default StoreProfileModal;
