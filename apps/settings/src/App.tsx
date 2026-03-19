import { useState } from 'react';

import NavDrawer from '@shared/NavDrawer';




function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    return (
        <div className="bg-[var(--bg-app)] font-display text-[var(--text-main)] h-screen antialiased overflow-hidden">
            <div className="relative flex h-screen w-full flex-col max-w-[1600px] mx-auto glass border-x border-white/5 shadow-2xl">
                
                {/* Header */}
                <header className="z-50 glass border-b border-white/5 px-8 py-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="size-12 glass flex items-center justify-center rounded-2xl text-primary hover:bg-primary/10 active:scale-90 transition-all border-white/10"
                        >
                            <span className="material-symbols-outlined font-black">menu</span>
                        </button>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase leading-none">Settings</h1>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80 leading-tight">Store Configuration</p>
                        </div>
                    </div>
                    <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">
                        Simpan
                    </button>
                </header>

                <main className="flex-1 p-8 space-y-12 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {/* Logo Section */}
                    <section className="flex flex-col items-center gap-8 py-6">
                        <div className="relative group">
                            <div
                                className="size-40 rounded-[2.5rem] glass border-4 border-white/10 bg-cover bg-center overflow-hidden shadow-2xl group-hover:rotate-3 transition-transform duration-500"
                                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB9y1ZtNrs-R-ME1VxmCsiwQXfT_9WC5qRA_13BZhUHZMF0IFepSachNUKI6TDCMbE6FWj-co06LKFuN_Kjl4UmqBXFv6_fXIEsiDvaQUQopz7p7k5yCaHkWc63GP75fYyhHKqG1j71nVNBahFz-U_gCnm_5qHYdq3XK2mlEFC2hH3MVt8JvTJdL2Pjcf1FXMVrOPdKl2d6vwjyZVet-WUZQucx9djoOHvg-BWH3jWqVvb89ZG6zis-VJ7vNnBsEHbNcKKtXrOzMzE')" }}
                            >
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-white text-4xl font-black">photo_camera</span>
                                </div>
                            </div>
                            <button className="absolute -bottom-2 -right-2 bg-primary text-white p-3 rounded-2xl shadow-2xl border-4 border-[var(--bg-app)] active:scale-90 transition-transform hover:rotate-12">
                                <span className="material-symbols-outlined text-xl font-black">edit</span>
                            </button>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black font-display tracking-tight text-primary uppercase leading-none">Kerabat Kopi Tiam</h2>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] opacity-60">Traditional Taste, Modern Connection</p>
                        </div>
                    </section>

                    {/* General Information Form */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                            <span className="material-symbols-outlined text-primary text-2xl font-black">storefront</span>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Informasi Gerai</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex flex-col gap-3">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2 opacity-60">Nama Toko</label>
                                <input
                                    className="w-full glass border-white/10 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/20 text-sm font-black uppercase tracking-widest text-[var(--text-main)] outline-none"
                                    type="text"
                                    defaultValue="Kerabat Kopi Tiam"
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2 opacity-60">Slogan / Tagline</label>
                                <input
                                    className="w-full glass border-white/10 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/20 text-sm font-black uppercase tracking-widest text-[var(--text-main)] outline-none"
                                    placeholder="e.g. Authentic Brews"
                                    type="text"
                                    defaultValue="Traditional Taste, Modern Connection"
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2 opacity-60">Alamat Lengkap</label>
                                <textarea
                                    className="w-full glass border-white/10 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/20 text-sm font-bold tracking-wide text-[var(--text-main)] resize-none outline-none"
                                    rows={3}
                                    defaultValue="Jl. Gajah Mada No. 123, Central Jakarta, Indonesia"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Contact & Localization */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                            <span className="material-symbols-outlined text-primary text-2xl font-black">alternate_email</span>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Kontak & Lokalisasi</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex flex-col gap-3">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2 opacity-60">WhatsApp Business</label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined font-black">call</span>
                                    <input
                                        className="w-full glass border-white/10 rounded-2xl pl-16 pr-6 py-4 focus:ring-4 focus:ring-primary/20 text-sm font-black tracking-widest text-[var(--text-main)] outline-none"
                                        type="tel"
                                        defaultValue="+62 812-3456-7890"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2 opacity-60">Email Korespondensi</label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined font-black">mail</span>
                                    <input
                                        className="w-full glass border-white/10 rounded-2xl pl-16 pr-6 py-4 focus:ring-4 focus:ring-primary/20 text-sm font-black tracking-widest text-[var(--text-main)] outline-none lowercase"
                                        type="email"
                                        defaultValue="hello@kerabatkopi.id"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2 opacity-60">Preferensi Mata Uang</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined font-black">payments</span>
                                    <select className="w-full glass border-white/10 rounded-2xl pl-16 pr-12 py-4 focus:ring-4 focus:ring-primary/20 text-sm font-black uppercase tracking-widest text-[var(--text-main)] appearance-none outline-none cursor-pointer">
                                        <option value="IDR" className="bg-[var(--bg-app)]">IDR - Indonesian Rupiah</option>
                                        <option value="USD" className="bg-[var(--bg-app)]">USD - US Dollar</option>
                                        <option value="SGD" className="bg-[var(--bg-app)]">SGD - Singapore Dollar</option>
                                    </select>
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined font-black pointer-events-none">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Operational Hours */}
                    <section className="space-y-8 pb-10">
                        <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                            <span className="material-symbols-outlined text-primary text-2xl font-black">schedule</span>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Jam Operasional</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="flex flex-col gap-3">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2 opacity-60">Waktu Buka</label>
                                <div className="relative">
                                    <input
                                        className="w-full glass border-white/10 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/20 text-sm font-black tracking-widest text-[var(--text-main)] outline-none"
                                        type="time"
                                        defaultValue="07:00"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2 opacity-60">Waktu Tutup</label>
                                <div className="relative">
                                    <input
                                        className="w-full glass border-white/10 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/20 text-sm font-black tracking-widest text-[var(--text-main)] outline-none"
                                        type="time"
                                        defaultValue="22:00"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="p-8 glass border-t border-white/10 shrink-0 z-50">
                    <button
                        className="w-full bg-primary text-white font-black text-xs uppercase tracking-[0.3em] py-5 rounded-[2rem] shadow-2xl shadow-primary/40 flex items-center justify-center gap-4 active:scale-[0.95] hover:scale-[1.02] transition-all"
                    >
                        <span className="material-symbols-outlined font-black">verified_user</span>
                        Simpan Seluruh Perubahan
                    </button>
                </footer>

                <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5179} />
            </div>
        </div>
    );
}

export default App;

