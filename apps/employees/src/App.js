import { jsx as _jsx } from "react/jsx-runtime";
import Layout from '@shared/Layout';
import EmployeeManagementModal from '@shared/components/EmployeeManagementModal';
import QueryProvider from '@shared/QueryProvider';
function AppContent() {
    return (_jsx(Layout, { currentPort: 5178, title: "Manajemen Karyawan", subtitle: "Staff & Access Control", children: _jsx(EmployeeManagementModal, { isOpen: true, onClose: () => { }, isStandalone: true }) }));
}
function App() {
    return (_jsx(QueryProvider, { children: _jsx(AppContent, {}) }));
}
export default App;
