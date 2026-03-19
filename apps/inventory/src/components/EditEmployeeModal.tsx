import React, { useState, useEffect } from 'react';
import { useUpdateEmployee, useDeleteEmployee, type User } from '../../../shared/hooks/useEmployees';

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
        <div className="fixed inset-0 z-[60] flex flex-col bg-background-app text-main overflow-x-hidden antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-background-app/80 backdrop-blur-md p-4 border-b border-border-dim">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="text-primary cursor-pointer hover:bg-primary/10 p-1 rounded-full transition-colors flex items-center justify-center size-10"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-main">Edit Karyawan</h1>
                </div>
            </header>

            <main className="flex-1 max-w-md mx-auto w-full pb-32">
                {/* Profile Photo Section */}
                <div className="flex flex-col items-center p-6">
                    <div className="relative group">
                        <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-32 w-32 border-4 border-primary/20 shadow-inner flex items-center justify-center overflow-hidden"
                            style={employee.image ? { backgroundImage: `url("${employee.image}")` } : {}}
                        >
                            {!employee.image && <span className="text-4xl font-bold text-primary">{name.substring(0,1)}</span>}
                        </div>
                    </div>
                </div>

                {/* Form Elements */}
                <div className="px-4 space-y-6">
                    {/* Nama Lengkap */}
                    <div>
                        <label className="block mb-2 text-sm font-bold text-muted uppercase">Nama Lengkap</label>
                        <input
                            className="w-full h-14 rounded-xl border border-border-dim bg-background-app text-main focus:ring-primary focus:border-primary transition-all px-4"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Peran */}
                    <div>
                        <label className="block mb-2 text-sm font-bold text-muted uppercase">Peran</label>
                        <select
                            className="w-full h-14 rounded-xl border border-border-dim bg-background-app text-main focus:ring-primary focus:border-primary transition-all px-4 pr-10 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1.2em_1.2em]"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23d4823a\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")' }}
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="Admin">Admin</option>
                            <option value="Karyawan">Karyawan</option>
                        </select>
                    </div>

                    {/* PIN */}
                    <div>
                        <label className="block mb-2 text-sm font-bold text-muted uppercase">PIN Akses</label>
                        <input
                            className="w-full h-14 rounded-xl border border-border-dim bg-background-app text-main focus:ring-primary focus:border-primary transition-all px-4"
                            type="text"
                            maxLength={6}
                            placeholder="Maks 6 digit"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block mb-2 text-sm font-bold text-muted uppercase">Email</label>
                        <input
                            className="w-full h-14 rounded-xl border border-border-dim bg-background-app text-main focus:ring-primary focus:border-primary transition-all px-4"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-8 pb-4 space-y-4">
                        <button 
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="w-full h-14 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
                        >
                            {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                        <button 
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="w-full h-14 flex items-center justify-center gap-2 text-red-500 font-bold rounded-xl border border-red-500/20 hover:bg-red-500/10 transition-colors active:scale-[0.98] disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                            {deleteMutation.isPending ? 'Menghapus...' : 'Hapus Karyawan'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EditEmployeeModal;
