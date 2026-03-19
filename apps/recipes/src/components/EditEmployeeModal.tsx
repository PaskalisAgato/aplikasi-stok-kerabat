import { useState, useEffect } from 'react';

interface EditEmployeeModalProps {
    employee: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function EditEmployeeModal({ employee, isOpen, onClose }: EditEmployeeModalProps) {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');

    useEffect(() => {
        if (employee) {
            setName(employee.name);
            setRole(employee.role);
        }
    }, [employee]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background-app text-slate-900 overflow-x-hidden antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-background-app/80 backdrop-blur-md p-4 border-b border-primary/10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
                    >
                        <span className="material-symbols-outlined text-slate-600">close</span>
                    </button>
                    <h2 className="text-xl font-black tracking-tight">Edit Karyawan</h2>
                </div>
            </header>

            <div className="p-6 space-y-8 overflow-y-auto pb-32">
                {/* Form Fields */}
                <div className="space-y-6">
                    {/* Photo Profile */}
                    <div className="flex flex-col items-center gap-4 py-2">
                        <div className="relative">
                            <div className="size-24 rounded-full bg-primary/10 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                                {employee?.avatar ? (
                                    <img src={employee.avatar} alt={name} className="size-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-primary/40 text-4xl">person</span>
                                )}
                            </div>
                            <button className="absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full shadow-lg flex items-center justify-center border-2 border-white active:scale-90 transition-transform">
                                <span className="material-symbols-outlined text-sm">photo_camera</span>
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ganti Foto Profil</p>
                    </div>

                    {/* Nama Lengkap */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg">person</span>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Masukkan nama lengkap"
                                className="w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                            />
                        </div>
                    </div>

                    {/* Jabatan / Role */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jabatan</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
                            <select 
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 text-slate-900 text-sm font-medium appearance-none transition-all cursor-pointer"
                            >
                                <option value="barista_senior">Barista Senior</option>
                                <option value="barista">Barista</option>
                                <option value="kasir">Kasir</option>
                                <option value="admin_gudang">Admin Gudang</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined pointer-events-none text-lg">expand_more</span>
                        </div>
                    </div>
                </div>

                {/* Danger Zone / Reset Password */}
                <div className="bg-red-50 rounded-2xl p-4 border border-red-100 space-y-3">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">ZONA BAHAYA</p>
                    <button className="w-full bg-white border border-red-200 text-red-500 font-bold py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-lg">lock_reset</span>
                        Reset Password (Terima Ke Email)
                    </button>
                    <button className="w-full bg-white border border-red-200 text-red-500 font-bold py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-lg">person_remove</span>
                        Non-aktifkan Akun
                    </button>
                </div>

                {/* Submit Action */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-background-app/80 backdrop-blur-md border-t border-primary/10 max-w-md mx-auto">
                    <button className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );
}
