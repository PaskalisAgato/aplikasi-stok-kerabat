import React, { useState } from 'react';

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose }) => {
    const [isActive, setIsActive] = useState(true);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background-app  dark:text-white dark:text-white text-slate-900  overflow-y-auto pb-24 antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-background-app/80  backdrop-blur-md p-4 border-b border-primary/10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="text-primary cursor-pointer hover:bg-primary/10 p-1 rounded-full transition-colors flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold tracking-tight">Tambah Karyawan</h1>
                </div>
            </header>

            <main className="flex-1 max-w-md mx-auto w-full px-4 py-8 space-y-8">
                {/* Profile Photo Upload */}
                <section className="flex flex-col items-center gap-4">
                    <div className="relative group">
                        <div className="size-32 rounded-full border-4 border-primary/10 bg-slate-100  flex items-center justify-center overflow-hidden shadow-inner">
                            <span className="material-symbols-outlined text-4xl dark:text-white dark:text-white text-slate-900 ">image</span>
                        </div>
                        <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-background-dark active:scale-90 transition-transform flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm font-bold">edit</span>
                        </button>
                    </div>
                    <div className="text-center">
                        <h2 className="font-bold text-base">Unggah Foto Profil</h2>
                        <p className="text-primary text-xs font-medium">Format JPG atau PNG, maks 2MB</p>
                    </div>
                </section>

                {/* Form Fields */}
                <section className="space-y-5">
                    {/* Nama Lengkap */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold dark:text-white dark:text-white text-slate-900  ml-1 tracking-wide">Nama Lengkap</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                            <input
                                className="w-full bg-slate-100  border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 dark:text-white dark:text-white text-slate-900  placeholder:dark:text-slate-400 dark:text-slate-400 text-slate-500  text-sm font-medium transition-all"
                                type="text"
                                placeholder="Masukkan nama lengkap karyawan"
                            />
                        </div>
                    </div>

                    {/* Pilih Peran */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold dark:text-white dark:text-white text-slate-900  ml-1 tracking-wide">Pilih Peran</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
                            <select className="w-full bg-slate-100  border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 dark:text-white dark:text-white text-slate-900  text-sm font-medium appearance-none transition-all">
                                <option value="" disabled selected hidden>Pilih Jabatan</option>
                                <option className="bg-background-app " value="barista_senior">Barista Senior</option>
                                <option className="bg-background-app " value="barista">Barista</option>
                                <option className="bg-background-app " value="kasir">Kasir</option>
                                <option className="bg-background-app " value="admin_gudang">Admin Gudang</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 dark:text-slate-400 dark:text-slate-400 text-slate-500  material-symbols-outlined pointer-events-none text-lg">expand_more</span>
                        </div>
                    </div>

                    {/* Nomor WhatsApp */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold dark:text-white dark:text-white text-slate-900  ml-1 tracking-wide">Nomor WhatsApp</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                            <input
                                className="w-full bg-slate-100  border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 dark:text-white dark:text-white text-slate-900  placeholder:dark:text-slate-400 dark:text-slate-400 text-slate-500  text-sm font-medium transition-all"
                                type="tel"
                                placeholder="Contoh: 08123456789"
                            />
                        </div>
                    </div>

                    {/* Alamat Email */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold dark:text-white dark:text-white text-slate-900  ml-1 tracking-wide">Alamat Email</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                            <input
                                className="w-full bg-slate-100  border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 dark:text-white dark:text-white text-slate-900  placeholder:dark:text-slate-400 dark:text-slate-400 text-slate-500  text-sm font-medium transition-all"
                                type="email"
                                placeholder="karyawan@email.com"
                            />
                        </div>
                    </div>

                    {/* Status Akun */}
                    <div className="flex flex-col gap-2 pt-2">
                        <label className="text-xs font-semibold dark:text-white dark:text-white text-slate-900  ml-1 tracking-wide">Status Akun</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setIsActive(true)}
                                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-sm font-bold transition-all ${isActive ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-transparent border-slate-200  text-slate-500  hover:bg-slate-50 '}`}
                            >
                                <span className={`material-symbols-outlined text-lg ${isActive ? 'fill-icon' : ''}`}>check_circle</span>
                                Aktif
                            </button>
                            <button
                                onClick={() => setIsActive(false)}
                                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-sm font-bold transition-all ${!isActive ? 'bg-slate-700 dark:border-slate-700 border-slate-200 dark:text-white dark:text-white text-slate-900 shadow-lg shadow-slate-900/20' : 'bg-transparent border-slate-200  dark:text-slate-400 dark:text-slate-400 text-slate-500  hover:bg-slate-50 '}`}
                            >
                                <span className={`material-symbols-outlined text-lg ${!isActive ? 'fill-icon' : ''}`}>cancel</span>
                                Nonaktif
                            </button>
                        </div>
                    </div>
                </section>

                {/* Bottom Padding for floating button */}
                <div className="h-16"></div>

                {/* Save Button (Fixed at Bottom) */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background-light via-background-light to-transparent   z-50">
                    <div className="max-w-md mx-auto">
                        <button
                            className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">save</span>
                            Simpan Data Karyawan
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AddEmployeeModal;

