import React, { useState } from 'react';
import Layout from '@shared/Layout';
import QueryProvider from '@shared/QueryProvider';
import { ModernTable } from '@shared/components/ModernTable';
import { useShifts } from '@shared/hooks/useShifts';
import { useEmployees } from '@shared/hooks/useEmployees';
import { useSession } from '@shared/authClient';

function ShiftPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'Admin';
    const { allShifts, myShifts, isLoading, createShift, updateShift, deleteShift } = useShifts();
    const { data: employees } = useEmployees();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        userId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '17:00'
    });

    const displayShifts = isAdmin ? allShifts : myShifts;

    const handleOpenModal = (shift: any = null) => {
        if (shift) {
            setEditingShift(shift);
            setFormData({
                userId: shift.userId,
                date: new Date(shift.date).toISOString().split('T')[0],
                startTime: shift.startTime,
                endTime: shift.endTime
            });
        } else {
            setEditingShift(null);
            setFormData({
                userId: '',
                date: new Date().toISOString().split('T')[0],
                startTime: '08:00',
                endTime: '17:00'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingShift) {
                await updateShift({ id: editingShift.id, data: formData });
            } else {
                await createShift(formData);
            }
            setIsModalOpen(false);
        } catch (error: any) {
            alert(error.message);
        }
    };

    const columns = [
        { header: 'Tanggal', render: (s: any) => new Date(s.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
        { header: 'Jam Mulai', key: 'startTime' as const },
        { header: 'Jam Selesai', key: 'endTime' as const },
        { header: 'Karyawan', render: (s: any) => isAdmin ? <span>{s.userName}<br/><span className="text-[10px] opacity-50 uppercase">{s.userRole}</span></span> : session?.user?.name },
    ];

    if (isAdmin) {
        columns.push({
            header: 'Aksi',
            render: (s: any) => (
                <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(s)} className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onClick={() => confirm('Hapus shift ini?') && deleteShift(s.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
            )
        });
    }

    return (
        <Layout
            currentPort={5188}
            title="Manajemen Shift"
            subtitle="Penjadwalan Karyawan"
            headerExtras={isAdmin && (
                <button 
                    onClick={() => handleOpenModal()}
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    TAMBAH SHIFT
                </button>
            )}
        >
            <div className="space-y-6">
                <ModernTable 
                    columns={columns} 
                    data={displayShifts} 
                    isLoading={isLoading} 
                    emptyMessage="Belum ada shift yang dijadwalkan"
                />
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-md glass p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300">
                        <h2 className="text-xl font-black font-display tracking-tight mb-6 uppercase">
                            {editingShift ? 'Edit Shift' : 'Tambah Shift Baru'}
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1">Karyawan</label>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
                                    value={formData.userId}
                                    onChange={e => setFormData({ ...formData, userId: e.target.value })}
                                    required
                                    disabled={!!editingShift}
                                >
                                    <option value="" className="bg-slate-900">Pilih Karyawan</option>
                                    {employees?.map((emp: any) => (
                                        <option key={emp.id} value={emp.id} className="bg-slate-900">{emp.name} ({emp.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1">Tanggal</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1">Jam Mulai</label>
                                    <input 
                                        type="time" 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1">Jam Selesai</label>
                                    <input 
                                        type="time" 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-[2] btn-primary"
                                >
                                    SIMPAN SHIFT
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

function App() {
    return (
        <QueryProvider>
            <ShiftPage />
        </QueryProvider>
    );
}

export default App;
