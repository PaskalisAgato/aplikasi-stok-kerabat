import React, { useState } from 'react';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';

interface Employee {
    id: number;
    name: string;
    role: string;
    status: 'Aktif' | 'Non-aktif';
    lastActive: string;
    image?: string;
    initials?: string;
}

const employeesData: Employee[] = [
    {
        id: 1,
        name: "Ahmad Fauzi",
        role: "Barista Senior",
        status: "Aktif",
        lastActive: "2 menit yang lalu",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCPXE6SQQ473O5_TuDL_0sHhncuu8wws5jNS9kAgDTczJiGTznehJnvS5xe_3hPWu_tWXI0InRcvuDsE_T7A4Ekev6q1kK_JIPPq_PRNDxA74x6JAs7POc8Tf_M7gdzY2BxVrrApQn-BEJBjIwJG69i-I_liEYUc2-zWsR4-5guFRMP5PMXmFWT5SjNS9kAgDTczJiGTznehJnvS5xe_3hPWu_tWXI0InRcvuDsE_T7A4Ekev6q1kK_JIPPq_PRNDxA74x6JAs7POc8Tf_M7gdzY2BxVrrApQn-BEJBjIwJG69i-I_liEYUc2-zWsR4-5guFRMP5PMXmFWT5WJDN5U3chG8L73RQfygmqq-J7gPra0RtF5F4GPy2ACAtWrMWhDwobpZf5wC2pppqcvr8j-d0h_csW1FmCKv848"
    },
    {
        id: 2,
        name: "Siti Aminah",
        role: "Kasir",
        status: "Aktif",
        lastActive: "Sekarang",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQ3h8xwbi96n5IL2b-aiAehjSrH8vEC7-6ZdciPgzSw0YTHmU6apSdAlnyif_1AcbpCnV6ueVPHCkdh8yMek0XIduI8SVjLMR4AOb49HfR960qBtSLMK6f7NsomY6ew5BrcBk4CpYTfmigpgOtkQDst9b01Ko8niQz57HkLCt233puTgeB2bdRDJJkyL_S5LlQMrRwfphO020mpYG7pjnV-YuY0u7EidEH9JrLZ2syrapMVpbiK38GwVotnGVxfe-P1dBuCMo7rX0"
    },
    {
        id: 3,
        name: "Budi Pratama",
        role: "Admin Gudang",
        status: "Non-aktif",
        lastActive: "3 hari yang lalu",
        initials: "BP"
    },
    {
        id: 4,
        name: "Rizky Ramadhan",
        role: "Barista",
        status: "Aktif",
        lastActive: "15 menit yang lalu",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBUsUqk-odior0NZzqURl7FAZ5yjl3o0tDZc3oZ2rHyeukgFgRjyjS83WCuTp3irHiZrcoozW5IC2T5_qcMvOLWEB99_OfNwaCg5Z0vDiE7b8Rh5_vdGGHCn1wMpnwp2hWyQUEyBOJ6CaX194kO52mP4VWwdSTddtmt24T2I4NPz31Qfv2Wu9kAxtdacDLtxfoMk_5-HRuNcCXwI9jMHkZUdt1rvQ9CIaV_NLIIW_GaVmHfMyagQg-9_HjjZFT9E3-yK73SaYNoPdo"
    }
];

interface EmployeeManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EmployeeManagementModal: React.FC<EmployeeManagementModalProps> = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
    const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);

    if (!isOpen) return null;

    const filteredEmployees = employeesData.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

                    {filteredEmployees.map((employee) => (
                        <div
                            key={employee.id}
                            onClick={() => setIsEditEmployeeModalOpen(true)}
                            className={`flex items-center gap-4 p-4 rounded-xl bg-surface border border-border-dim active:scale-[0.98] transition-all cursor-pointer hover:border-primary/50 ${employee.status === 'Non-aktif' ? 'opacity-75' : ''}`}
                        >
                            <div className="relative">
                                <div className={`h-14 w-14 rounded-full flex items-center justify-center overflow-hidden border-2 ${employee.status === 'Aktif' ? 'bg-primary/20 border-primary/30' : 'bg-background-app border-border-dim'}`}>
                                    {employee.image ? (
                                        <img className="h-full w-full object-cover" src={employee.image} alt={employee.name} />
                                    ) : (
                                        <span className="text-lg font-bold text-muted">{employee.initials}</span>
                                    )}
                                </div>
                                <div className={`absolute bottom-0 right-0 h-4 w-4 border-2 border-background-app rounded-full ${employee.status === 'Aktif' ? 'bg-emerald-500' : 'bg-muted'}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold truncate text-main">{employee.name}</h3>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${employee.status === 'Aktif' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-background-app text-muted border-border-dim'}`}>
                                        {employee.status}
                                    </span>
                                </div>
                                <p className="text-sm text-primary font-bold">{employee.role}</p>
                                <p className="text-xs text-muted mt-1 font-semibold">Terakhir aktif: {employee.lastActive}</p>
                            </div>
                            <span className="material-symbols-outlined text-muted">chevron_right</span>
                        </div>
                    ))}
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
                isOpen={isEditEmployeeModalOpen}
                onClose={() => setIsEditEmployeeModalOpen(false)}
            />
        </div>
    );
};

export default EmployeeManagementModal;

