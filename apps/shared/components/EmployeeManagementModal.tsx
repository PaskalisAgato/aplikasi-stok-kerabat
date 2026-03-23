import React, { useState } from 'react';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';
import { useEmployees } from '../hooks/useEmployees';
import type { User } from '../services/userService';


interface EmployeeManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    isStandalone?: boolean;
}

const EmployeeManagementModal: React.FC<EmployeeManagementModalProps> = ({ isOpen, onClose, isStandalone }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);


    const { data: employees = [], isLoading, error } = useEmployees();

    if (!isOpen) return null;

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const content = (
        <div className={`w-full ${isStandalone ? 'max-w-7xl mx-auto px-6 pb-20' : 'px-6 pb-20'}`}>
            {/* Search Bar */}
            <div className="py-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="relative group max-w-2xl">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black">search</span>
                    <input
                        className="block w-full pl-14 pr-6 py-5 glass border-none rounded-[2rem] focus:ring-4 focus:ring-primary/20 text-[var(--text-main)] placeholder:text-[var(--text-muted)] text-base font-bold shadow-inner"
                        placeholder="Cari nama atau peran karyawan..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Employee List Section */}
            <div className="space-y-8 animate-in fade-in zoom-in duration-1000">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">Daftar Karyawan</h2>
                    <div className="glass px-4 py-1.5 rounded-full border-white/5 shadow-inner">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{filteredEmployees.length} AKTIF</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-24 gap-6 glass rounded-[3rem] opacity-60">
                        <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Menyelaraskan Data Karyawan...</p>
                    </div>
                ) : error ? (
                    <div className="p-10 glass border-red-500/20 text-red-500 rounded-[3rem] text-center font-black uppercase tracking-widest text-xs">
                        <span className="material-symbols-outlined text-4xl mb-4 block">error</span>
                        Gagal memuat data karyawan
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredEmployees.map((employee) => (
                            <div
                                key={employee.id}
                                onClick={() => setSelectedEmployee(employee)}
                                className={`card group p-6 flex flex-col items-center text-center gap-6 cursor-pointer relative overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] ${employee.status === 'Non-aktif' ? 'opacity-60 grayscale' : ''}`}
                            >
                                <div className="relative z-10">
                                    <div className="relative">
                                        <div className={`size-24 rounded-[2rem] flex items-center justify-center overflow-hidden border-4 bg-[var(--bg-app)] border-white/10 shadow-2xl transition-transform group-hover:rotate-3`}>
                                            {employee.image ? (
                                                <img className="h-full w-full object-cover" src={employee.image} alt={employee.name} />
                                            ) : (
                                                <span className="text-3xl font-black text-primary font-display">{getInitials(employee.name)}</span>
                                            )}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 size-6 border-4 border-[var(--bg-surface)] rounded-full shadow-lg ${employee.status !== 'Non-aktif' ? 'bg-emerald-500' : 'bg-slate-500'} animate-pulse`}></div>
                                    </div>
                                </div>
                                
                                <div className="relative z-10 space-y-2 flex-1 w-full">
                                    <h3 className="text-xl font-black font-display tracking-tight text-[var(--text-main)] uppercase truncate group-hover:text-primary transition-colors">{employee.name}</h3>
                                    <div className="bg-primary/10 text-primary text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl border border-primary/20 w-fit mx-auto">
                                        {employee.role}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 w-full flex items-center justify-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-primary transition-colors">Lihat Detail Karyawan</p>
                                    <span className="material-symbols-outlined text-sm font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </div>

                                {/* Decorative Background Blob */}
                                <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                            </div>
                        ))}
                        
                        {filteredEmployees.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-32 glass rounded-[3rem] opacity-40 border-dashed border-2">
                                <span className="material-symbols-outlined text-7xl text-primary font-black mb-6">person_search</span>
                                <p className="font-black text-lg uppercase tracking-widest text-[var(--text-main)]">Karyawan Tidak Ditemukan</p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Coba gunakan kata kunci pencarian lain</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Button (Fixed Overlay) */}
            <button
                onClick={() => setIsAddEmployeeModalOpen(true)}
                className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 size-16 sm:size-24 accent-gradient text-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(200,100,20,0.4)] flex items-center justify-center active:scale-75 transition-all hover:scale-110 z-[100]"
            >
                <span className="material-symbols-outlined text-3xl sm:text-5xl font-black">person_add</span>
            </button>

            <AddEmployeeModal
                isOpen={isAddEmployeeModalOpen}
                onClose={() => setIsAddEmployeeModalOpen(false)}
            />

            <EditEmployeeModal
                isOpen={!!selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
                employee={selectedEmployee}
            />
        </div>
    );

    if (isStandalone) {
        return content;
    }

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] antialiased animate-in fade-in duration-500 overflow-hidden">
            {/* Header for Modal usage */}
            <header className="z-50 flex items-center glass border-b border-white/5 p-6 shrink-0">
                <div className="flex items-center gap-6 max-w-7xl mx-auto w-full">
                    <button
                        onClick={onClose}
                        className="size-12 glass flex items-center justify-center rounded-2xl text-primary hover:bg-primary/10 active:scale-90 transition-all border-white/10"
                    >
                        <span className="material-symbols-outlined font-black">arrow_back</span>
                    </button>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase">Kelola Karyawan</h1>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80">Manajemen Personel</p>
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto custom-scrollbar">
                {content}
            </main>
        </div>
    );
};

export default EmployeeManagementModal;
