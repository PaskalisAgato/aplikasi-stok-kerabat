import React, { useState } from 'react';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';
import { useEmployees } from '../hooks/useEmployees';
import type { User } from '../services/userService';
import NavDrawer from '../NavDrawer';

interface EmployeeManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    isStandalone?: boolean;
}

const EmployeeManagementModal: React.FC<EmployeeManagementModalProps> = ({ isOpen, onClose, isStandalone }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

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
        <div className={`fixed inset-0 z-[60] flex flex-col bg-background-app text-main antialiased ${isStandalone ? 'relative' : 'fixed'}`}>
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5178} />
            
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-background-app/80 backdrop-blur-md p-4 border-b border-border-dim">
                <div className="flex items-center gap-3 max-w-5xl mx-auto w-full">
                    {isStandalone ? (
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="flex items-center justify-center p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    )}
                    <h1 className="text-xl font-bold tracking-tight text-main">Kelola Karyawan</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-24">
                <div className="max-w-5xl mx-auto w-full">
                    {/* Search Bar */}
                    <div className="px-4 py-6">
                        <div className="relative group max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary/60">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className="block w-full pl-12 pr-4 py-4 bg-surface border border-border-dim rounded-xl focus:ring-2 focus:ring-primary/50 text-main placeholder:text-muted text-base shadow-sm"
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
                            <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-center font-bold">
                                Gagal memuat data karyawan
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredEmployees.map((employee) => (
                                    <div
                                        key={employee.id}
                                        onClick={() => setSelectedEmployee(employee)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border-dim active:scale-[0.98] transition-all cursor-pointer hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 ${employee.status === 'Non-aktif' ? 'opacity-75 grayscale' : ''}`}
                                    >
                                        <div className="relative shrink-0">
                                            <div className={`h-16 w-16 rounded-full flex items-center justify-center overflow-hidden border-2 bg-primary/10 border-primary/20`}>
                                                {employee.image ? (
                                                    <img className="h-full w-full object-cover" src={employee.image} alt={employee.name} />
                                                ) : (
                                                    <span className="text-xl font-bold text-primary">{getInitials(employee.name)}</span>
                                                )}
                                            </div>
                                            <div className={`absolute bottom-0 right-0 h-4 w-4 border-2 border-background-app rounded-full ${employee.status !== 'Non-aktif' ? 'bg-emerald-500' : 'bg-muted'}`}></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h3 className="text-base font-bold truncate text-main">{employee.name}</h3>
                                            </div>
                                            <p className="text-sm text-primary font-bold">{employee.role}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-muted/50">chevron_right</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* FAB */}
            <button
                onClick={() => setIsAddEmployeeModalOpen(true)}
                className="fixed bottom-10 right-6 size-16 bg-primary rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center text-white z-30 active:scale-95 transition-all hover:scale-110"
            >
                <span className="material-symbols-outlined text-3xl font-bold">add</span>
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
};

export default EmployeeManagementModal;
