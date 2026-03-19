import Layout from '@shared/Layout';
import EmployeeManagementModal from '@shared/components/EmployeeManagementModal';
import QueryProvider from '@shared/QueryProvider';

function AppContent() {
    return (
        <Layout
            currentPort={5178}
            title="Manajemen Karyawan"
            subtitle="Staff & Access Control"
        >
            <EmployeeManagementModal 
                isOpen={true} 
                onClose={() => {}} 
                isStandalone={true}
            />
        </Layout>
    );
}

function App() {
    return (
        <QueryProvider>
            <AppContent />
        </QueryProvider>
    );
}

export default App;

