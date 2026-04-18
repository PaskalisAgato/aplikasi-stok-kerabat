import React, { useState } from 'react';

interface EditEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    // We would pass employee data here in a real app, keeping it simple for UI demo
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose }) => {
    const [isActive, setIsActive] = useState(true);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background-app  text-[var(--text-main)]  overflow-x-hidden antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-background-app/80  backdrop-blur-md p-4 border-b border-primary/10 ">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="text-primary cursor-pointer hover:bg-slate-200  p-1 rounded-full transition-colors flex items-center justify-center size-10"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">Edit Karyawan</h1>
                </div>
            </header>

            <main className="flex-1 max-w-md mx-auto w-full pb-32">
                {/* Profile Photo Section */}
                <div className="flex flex-col items-center p-6">
                    <div className="relative group">
                        <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-32 w-32 border-4 border-primary/20 shadow-inner"
                            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDJGtZ4k-vcd2-yCGA1I0cO5v7QDOHoyQ29g_SedUIzgiiJhzyvKa78cD8jF_F30o6IGlkJakpq87V590IMHBLDX_048T_Nm7hoLFNYoMyCs6Silm8wIPZXTWRc1AxJ0Yz3X-7pcwdu2rd8NHDwwJ1gLoxEeqHjJxTFA9A776YiDtr_Qn7DVfmNxl_BrUi3TvC_xAnYQWbJJ-rm7buJGjEeT3Q9f9bx1pBkU4EEpCAJEC8pK4L3BiJeRyOCLAKqTCZ-LoHQua-HoJw")' }}
                        ></div>
                        <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform border-2 border-background-dark">
                            <span className="material-symbols-outlined text-sm font-bold">photo_camera</span>
                        </button>
                    </div>
                    <button className="mt-4 text-primary font-semibold text-sm hover:opacity-80 transition-opacity">
                        Ubah Foto Profil
                    </button>
                </div>

                {/* Form Elements */}
                <div className="px-4 space-y-6">
                    {/* Nama Lengkap */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-[var(--text-muted)] ">Nama Lengkap</label>
                        <input
                            className="w-full h-14 rounded-xl border border-slate-200  bg-white  text-[var(--text-main)]  focus:ring-primary focus:border-primary transition-all px-4"
                            type="text"
                            defaultValue="Ahmad Subarjo"
                        />
                    </div>

                    {/* Peran */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-[var(--text-muted)] ">Peran</label>
                        <select
                            className="w-full h-14 rounded-xl border border-slate-200  bg-white  text-[var(--text-main)]  focus:ring-primary focus:border-primary transition-all px-4 pr-10 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1.2em_1.2em]"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23d4823a\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")' }}
                            defaultValue="barista"
                        >
                            <option value="barista">Barista Utama</option>
                            <option value="kasir">Kasir</option>
                            <option value="manager">Manager Outlet</option>
                            <option value="server">Server</option>
                        </select>
                    </div>

                    {/* Nomor WhatsApp */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-[var(--text-muted)] ">Nomor WhatsApp</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">+62</span>
                            <input
                                className="w-full h-14 rounded-xl border border-slate-200  bg-white  text-[var(--text-main)]  focus:ring-primary focus:border-primary transition-all pl-14 pr-4"
                                type="tel"
                                defaultValue="81234567890"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-[var(--text-muted)] ">Email</label>
                        <input
                            className="w-full h-14 rounded-xl border border-slate-200  bg-white  text-[var(--text-main)]  focus:ring-primary focus:border-primary transition-all px-4"
                            type="email"
                            defaultValue="ahmad.subarjo@kerabatkopi.com"
                        />
                    </div>

                    {/* Status Akun */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100  border border-slate-200 ">
                        <div className="flex flex-col">
                            <span className="font-semibold text-[var(--text-main)] ">Status Akun</span>
                            <span className="text-xs text-[var(--text-muted)]  mt-0.5">Tentukan status akses aplikasi</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-slate-300  peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            <span className="ml-3 text-sm font-medium text-primary">{isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-8 pb-4 space-y-4">
                        <button className="w-full h-14 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 active:scale-[0.98]">
                            Simpan Perubahan
                        </button>
                        <button className="w-full h-14 flex items-center justify-center gap-2 text-red-500 font-semibold rounded-xl border border-red-500/20 hover:bg-red-500/10 transition-colors active:scale-[0.98]">
                            <span className="material-symbols-outlined text-lg">delete</span>
                            Hapus Karyawan
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EditEmployeeModal;

