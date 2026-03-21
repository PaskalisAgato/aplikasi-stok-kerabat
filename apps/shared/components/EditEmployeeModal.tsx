import React, { useState, useEffect } from 'react';
import { useUpdateEmployee, useDeleteEmployee } from '../hooks/useEmployees';
import type { User } from '../services/userService';

interface EditEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: User | null;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, employee }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState('Karyawan');
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [status, setStatus] = useState('Aktif');

    const updateMutation = useUpdateEmployee();
    const deleteMutation = useDeleteEmployee();

    useEffect(() => {
        if (employee) {
            setName(employee.name);
            setRole(employee.role);
            setEmail(employee.email);
            setPin(employee.pin || '');
            setStatus(employee.status || 'Aktif');
        }
    }, [employee]);

    if (!isOpen || !employee) return null;

    const handleSave = async () => {
        try {
            await updateMutation.mutateAsync({
                id: employee.id,
                data: { name, role, email, pin }
            });
            onClose();
        } catch (error) {
            alert('Gagal menyimpan perubahan');
        }
    };

    const handleDelete = async () => {
        if (confirm(`Apakah Anda yakin ingin menghapus ${employee.name}?`)) {
            try {
                await deleteMutation.mutateAsync(employee.id);
                onClose();
            } catch (error) {
                alert('Gagal menghapus karyawan');
            }
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
                        <h1 className="text-xl font-bold tracking-tight text-main">Edit Karyawan</h1>
                    </div>
                    <button 
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
                        title="Hapus Karyawan"
                    >
                        <span className="material-symbols-outlined">{deleteMutation.isPending ? 'sync' : 'delete'}</span>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Profile Photo Section */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-32 w-32 border-4 border-primary/20 shadow-xl flex items-center justify-center overflow-hidden bg-primary/5"
                                style={employee.image ? { backgroundImage: `url("${employee.image}")` } : {}}
                            >
                                {!employee.image && <span className="text-4xl font-bold text-primary">{name.substring(0,1)}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Form Elements */}
                    <div className="space-y-6">
                        {/* Nama Lengkap */}
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-muted uppercase tracking-widest ml-1">Nama Lengkap</label>
                            <input
                                className="w-full h-14 rounded-2xl border border-border-dim bg-background-app text-main focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all px-5 font-medium"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {/* Peran */}
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-muted uppercase tracking-widest ml-1">Peran Akses</label>
                            <div className="relative group">
                                <select
                                    className="w-full h-14 rounded-2xl border border-border-dim bg-background-app text-main focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all px-5 appearance-none font-medium cursor-pointer"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Karyawan">Karyawan</option>
                                    <option value="Barista">Barista</option>
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        {/* PIN */}
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-muted uppercase tracking-widest ml-1">PIN Keamanan (6 Digit)</label>
                            <input
                                className="w-full h-14 rounded-2xl border border-border-dim bg-background-app text-main focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all px-5 font-medium tracking-[0.5em]"
                                type="text"
                                maxLength={6}
                                placeholder="******"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-muted uppercase tracking-widest ml-1">Email Karyawan</label>
                            <input
                                className="w-full h-14 rounded-2xl border border-border-dim bg-background-app text-main focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all px-5 font-medium"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                            <div>
                                <p className="text-sm font-bold text-main">Status Akun</p>
                                <p className="text-xs text-muted">Tentukan apakah akun ini aktif</p>
                            </div>
                            <button
                                onClick={() => setStatus(status === 'Aktif' ? 'Non-aktif' : 'Aktif')}
                                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${status === 'Aktif' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}
                            >
                                {status}
                            </button>
                        </div>
                    </div>
                </main>

                <footer className="p-4 border-t border-border-dim bg-surface">
                    <button 
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="w-full h-14 bg-gradient-to-r from-primary to-primary-dark text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {updateMutation.isPending && <span className="material-symbols-outlined animate-spin">refresh</span>}
                        {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default EditEmployeeModal;
