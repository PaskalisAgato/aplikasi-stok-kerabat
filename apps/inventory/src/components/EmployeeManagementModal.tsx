import React, { useState } from 'react';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';
import { useEmployees, type User } from '@shared/hooks/useEmployees';

interface EmployeeManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EmployeeManagementModal: React.FC<EmployeeManagementModalProps> = ({ isOpen, onClose }) => {
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

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background-app text-main overflow-y-auto pb-24 antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-background-app/80 backdrop-blur-md p-4 border-b border-border-dim">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-main">Kelola Karyawan</h1>
                </div>
                <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-md mx-auto w-full">
                {/* Search Bar */}
                <div className="px-4 py-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary/60">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            className="block w-full pl-12 pr-4 py-4 bg-surface border border-border-dim rounded-xl focus:ring-2 focus:ring-primary/50 text-main placeholder:text-muted text-base"
                            placeholder="Cari nama atau peran karyawan"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Employee List Section */}
                <div className="px-4 space-y-4">
                    <div className="flex items-center justify-between pb-2">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted font-bold">Daftar Karyawan</h2>
                        <span className="text-xs font-medium text-muted">{filteredEmployees.length} Karyawan</span>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-center">
                            Gagal memuat data karyawan
                        </div>
                    ) : (
                        filteredEmployees.map((employee) => (
                            <div
                                key={employee.id}
                                onClick={() => setSelectedEmployee(employee)}
                                className={`flex items-center gap-4 p-4 rounded-xl bg-surface border border-border-dim active:scale-[0.98] transition-all cursor-pointer hover:border-primary/50 ${employee.status === 'Non-aktif' ? 'opacity-75' : ''}`}
                            >
                                <div className="relative">
                                    <div className={`h-14 w-14 rounded-full flex items-center justify-center overflow-hidden border-2 bg-primary/20 border-primary/30`}>
                                        {employee.image ? (
                                            <img className="h-full w-full object-cover" src={employee.image} alt={employee.name} />
                                        ) : (
                                            <span className="text-lg font-bold text-primary">{getInitials(employee.name)}</span>
                                        )}
                                    </div>
                                    <div className={`absolute bottom-0 right-0 h-4 w-4 border-2 border-background-app rounded-full ${employee.status !== 'Non-aktif' ? 'bg-emerald-500' : 'bg-muted'}`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-bold truncate text-main">{employee.name}</h3>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${employee.status !== 'Non-aktif' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-background-app text-muted border-border-dim'}`}>
                                            {employee.status || 'Aktif'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-primary font-bold">{employee.role}</p>
                                </div>
                                <span className="material-symbols-outlined text-muted">chevron_right</span>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* FAB */}
            <button
                onClick={() => setIsAddEmployeeModalOpen(true)}
                className="fixed bottom-24 right-6 size-16 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-white z-30 active:scale-95 transition-all hover:scale-110"
            >
                <span className="material-symbols-outlined text-3xl font-bold">add</span>
            </button>

            {/* Navigation Bottom Bar (Visual match) */}
            <nav className="fixed bottom-0 inset-x-0 bg-background-app border-t border-border-dim px-4 pb-6 pt-2 z-40">
                <div className="flex items-center justify-around max-w-md mx-auto">
                    <button className="flex flex-col items-center gap-1 p-2 text-muted">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-[10px] font-medium uppercase tracking-tighter">Dashboard</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 p-2 text-muted">
                        <span className="material-symbols-outlined">receipt_long</span>
                        <span className="text-[10px] font-medium uppercase tracking-tighter">Pesanan</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 p-2 text-primary">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Karyawan</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 p-2 text-muted">
                        <span className="material-symbols-outlined">settings</span>
                        <span className="text-[10px] font-medium uppercase tracking-tighter">Settings</span>
                    </button>
                </div>
            </nav>

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
};

export default EmployeeManagementModal;

