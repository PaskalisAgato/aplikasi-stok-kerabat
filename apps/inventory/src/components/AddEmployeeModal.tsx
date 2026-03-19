import React, { useState } from 'react';
import { useCreateEmployee } from '../../../shared/hooks/useEmployees';

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState('Karyawan');
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    
    const createMutation = useCreateEmployee();

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name || !email || !pin) {
            alert('Harap isi semua bidang');
            return;
        }
        try {
            await createMutation.mutateAsync({ name, email, role, pin });
            onClose();
            // Reset form
            setName('');
            setRole('Karyawan');
            setEmail('');
            setPin('');
        } catch (error) {
            alert('Gagal menambah karyawan');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background-app text-main overflow-x-hidden antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-background-app/80 backdrop-blur-md p-4 border-b border-border-dim">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="text-primary cursor-pointer hover:bg-primary/10 p-1 rounded-full transition-colors flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-main">Tambah Karyawan</h1>
                </div>
            </header>

            <main className="flex-1 max-w-md mx-auto w-full px-4 py-8 space-y-8">
                {/* Form Fields */}
                <section className="space-y-5">
                    {/* Nama Lengkap */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-muted uppercase ml-1 tracking-wide">Nama Lengkap</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                            <input
                                className="w-full bg-background-app border border-border-dim rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 text-main placeholder:text-muted text-sm font-medium transition-all"
                                type="text"
                                placeholder="Nama lengkap karyawan"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Pilih Peran */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-muted uppercase ml-1 tracking-wide">Pilih Peran</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
                            <select 
                                className="w-full bg-background-app border border-border-dim rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 text-main text-sm font-medium appearance-none transition-all"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="Karyawan">Karyawan</option>
                                <option value="Admin">Admin</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400  material-symbols-outlined pointer-events-none text-lg">expand_more</span>
                        </div>
                    </div>

                    {/* PIN */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-muted uppercase ml-1 tracking-wide">PIN Akses (Numeric)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                            <input
                                className="w-full bg-background-app border border-border-dim rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 text-main placeholder:text-muted text-sm font-medium transition-all"
                                type="text"
                                maxLength={6}
                                placeholder="Contoh: 123456"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                    </div>

                    {/* Alamat Email */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-muted uppercase ml-1 tracking-wide">Alamat Email</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                            <input
                                className="w-full bg-background-app border border-border-dim rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 text-main placeholder:text-muted text-sm font-medium transition-all"
                                type="email"
                                placeholder="karyawan@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Save Button */}
                <div className="pt-8">
                    <button
                        onClick={handleSave}
                        disabled={createMutation.isPending}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined">save</span>
                        {createMutation.isPending ? 'Menyimpan...' : 'Simpan Karyawan'}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default AddEmployeeModal;

