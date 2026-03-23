import Layout from '@shared/Layout';
import QueryProvider from '@shared/QueryProvider';
import { useShifts } from '@shared/hooks/useShifts';
import { useEmployees } from '@shared/hooks/useEmployees';
import ShiftTemplate from './components/ShiftTemplate';

function ShiftPage() {
    const { allShifts, isLoading } = useShifts();
    const { data: employees } = useEmployees();
    
    return (
        <Layout
            currentPort={5188}
            title="Manajemen Shift"
            subtitle="Penjadwalan Karyawan"
        >
            <div className="space-y-6">
                <ShiftTemplate 
                    employees={employees || []} 
                    allShifts={allShifts} 
                    isLoading={isLoading}
                />
            </div>
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
