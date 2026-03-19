

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddEmployeeModal({ isOpen, onClose }: AddEmployeeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background-app text-slate-900 overflow-y-auto pb-24 antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-background-app/80 backdrop-blur-md p-4 border-b border-primary/10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
                    >
                        <span className="material-symbols-outlined text-slate-600">close</span>
                    </button>
                    <h2 className="text-xl font-black tracking-tight">Tambah Karyawan</h2>
                </div>
            </header>

            <div className="p-6 space-y-8">
                {/* Form Fields */}
                <div className="space-y-6">
                    {/* Nama Lengkap */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg">person</span>
                            <input
                                type="text"
                                placeholder="Masukkan nama lengkap"
                                className="w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                            />
                        </div>
                    </div>

                    {/* Email / Username */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email / Username</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg">alternate_email</span>
                            <input
                                type="text"
                                placeholder="nama@kerabat.com"
                                className="w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                            />
                        </div>
                    </div>

                    {/* Jabatan / Role */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jabatan</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
                            <select className="w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 text-slate-900 text-sm font-medium appearance-none transition-all cursor-pointer">
                                <option value="" disabled selected hidden>Pilih Jabatan</option>
                                <option value="barista_senior">Barista Senior</option>
                                <option value="barista">Barista</option>
                                <option value="kasir">Kasir</option>
                                <option value="admin_gudang">Admin Gudang</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined pointer-events-none text-lg">expand_more</span>
                        </div>
                    </div>

                    {/* Temporary Password */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Sementara</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg">lock</span>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 italic ml-1">* Karyawan akan diminta mengganti password saat login pertama kali.</p>
                    </div>
                </div>

                {/* Submit Action */}
                <button className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 text-sm uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    Daftarkan Karyawan
                </button>
            </div>
        </div>
    );
}
