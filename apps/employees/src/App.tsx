import { useState } from 'react';
import NavDrawer from '@shared/NavDrawer';
import EmployeeManagementModal from '@shared/components/EmployeeManagementModal';
import QueryProvider from '@shared/QueryProvider';

function AppContent() {
    return (
        <div className="bg-background-app font-display text-main min-h-screen antialiased flex flex-col">
            <EmployeeManagementModal 
                isOpen={true} 
                onClose={() => {}} 
                isStandalone={true}
            />
        </div>
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

