import React, { useState } from 'react';
import { useCreateEmployee } from '../hooks/useEmployees';

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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-surface border border-border-dim rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-border-dim bg-surface/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="text-primary hover:bg-primary/10 p-2 rounded-full transition-all flex items-center justify-center active:scale-95"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h1 className="text-xl font-bold tracking-tight text-main">Tambah Karyawan</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Welcome Icon Section */}
                    <div className="flex flex-col items-center">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                            <span className="material-symbols-outlined text-4xl text-primary">person_add</span>
                        </div>
                    </div>

                    <section className="space-y-6">
                        {/* Nama Lengkap */}
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-muted uppercase tracking-widest ml-1">Nama Lengkap</label>
                            <div className="relative group">
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
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-muted uppercase tracking-widest ml-1">Pilih Peran</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
                                <select 
                                    className="w-full bg-background-app border border-border-dim rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 text-main text-sm font-medium appearance-none transition-all cursor-pointer"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="Karyawan">Karyawan</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Barista">Barista</option>
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        {/* PIN */}
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-muted uppercase tracking-widest ml-1">PIN Akses (Numerik)</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                                <input
                                    className="w-full bg-background-app border border-border-dim rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 text-main placeholder:text-muted text-sm font-medium transition-all tracking-widest"
                                    type="text"
                                    maxLength={6}
                                    placeholder="Contoh: 123456"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                        </div>

                        {/* Alamat Email */}
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-muted uppercase tracking-widest ml-1">Alamat Email</label>
                            <div className="relative group">
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
                </main>

                <footer className="p-4 border-t border-border-dim bg-surface">
                    <button
                        onClick={handleSave}
                        disabled={createMutation.isPending}
                        className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {createMutation.isPending ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">save</span>}
                        {createMutation.isPending ? 'Menyimpan...' : 'Simpan Karyawan'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
