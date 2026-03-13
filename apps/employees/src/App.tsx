import { useState } from 'react';
import { EMPLOYEES } from '@shared/mockDatabase';

import AddEmployeeModal from './components/AddEmployeeModal';
import EditEmployeeModal from './components/EditEmployeeModal';

import NavDrawer from '@shared/NavDrawer';




interface Employee {
    id: number;
    name: string;
    role: string;
    status: 'Aktif' | 'Non-aktif';
    lastActive: string;
    image?: string;
    initials?: string;
}

// REMOVED UNUSED EMPLOYEES DATA

function App() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
    const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const filteredEmployees = EMPLOYEES.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-background-light  font-display text-slate-900  min-h-screen flex flex-col antialiased">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5178} />
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background-light/80  backdrop-blur-md border-b border-primary/10 px-4 py-4 flex items-center gap-2">
                <button
                    onClick={() => setDrawerOpen(true)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors active:scale-95 shrink-0"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold tracking-tight">Kelola Karyawan</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-24 max-w-md mx-auto w-full">
                {/* Search Bar */}
                <div className="px-4 py-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary/60">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            className="block w-full pl-12 pr-4 py-4 bg-primary/5 border-none rounded-xl focus:ring-2 focus:ring-primary/50 text-slate-900  placeholder:text-primary/40 text-base transition-all"
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
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary/70">Daftar Karyawan</h2>
                        <span className="text-xs font-medium text-primary/50">{filteredEmployees.length} Karyawan</span>
                    </div>

                    {filteredEmployees.map((employee: any) => (
                        <div
                            key={employee.id}
                            onClick={() => setIsEditEmployeeModalOpen(true)}
                            className={`flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 active:scale-[0.98] transition-all cursor-pointer hover:bg-primary/10 ${employee.status === 'Non-aktif' ? 'opacity-75' : ''}`}
                        >
                            <div className="relative">
                                <div className={`h-14 w-14 rounded-full flex items-center justify-center overflow-hidden border-2 ${employee.status === 'Aktif' ? 'bg-primary/20 border-primary/20' : 'bg-slate-700 border-slate-600'}`}>
                                    {employee.image ? (
                                        <img className="h-full w-full object-cover" src={employee.image} alt={employee.name} />
                                    ) : (
                                        <span className="text-lg font-bold text-slate-400">{employee.initials || employee.name.substring(0,2).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className={`absolute bottom-0 right-0 h-4 w-4 border-2 border-background-dark rounded-full ${employee.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold truncate">{employee.name}</h3>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${employee.status === 'Aktif' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                        {employee.status}
                                    </span>
                                </div>
                                <p className="text-sm text-primary font-medium">{employee.role}</p>
                                <p className="text-xs text-primary/50 mt-1">Terakhir aktif: {employee.lastActive}</p>
                            </div>
                            <span className="material-symbols-outlined text-primary/30">chevron_right</span>
                        </div>
                    ))}
                </div>
            </main>

            {/* FAB */}
            <button
                onClick={() => setIsAddEmployeeModalOpen(true)}
                className="fixed bottom-24 right-6 size-16 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-background-dark z-30 active:scale-95 transition-all hover:scale-110"
            >
                <span className="material-symbols-outlined text-3xl font-bold">add</span>
            </button>

            {/* Navigation Bottom Bar */}


            <AddEmployeeModal
                isOpen={isAddEmployeeModalOpen}
                onClose={() => setIsAddEmployeeModalOpen(false)}
            />

            <EditEmployeeModal
                isOpen={isEditEmployeeModalOpen}
                onClose={() => setIsEditEmployeeModalOpen(false)}
            />
        </div>
    );
}

export default App;

