import { useState } from 'react';
import Layout from '@shared/Layout';
import PrinterSettings from '@shared/components/PrinterSettings';
import { NotificationProvider } from '@shared/components/NotificationProvider';

function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <NotificationProvider>
            <Layout 
                currentPort={5192} 
                title="Pengaturan Printer"
                subtitle="Hardware & Koneksi"
                maxWidth="100%"
                hideTitle={true}
                drawerOpen={drawerOpen}
                onDrawerOpen={() => setDrawerOpen(true)}
                onDrawerClose={() => setDrawerOpen(false)}
            >
                <div className="max-w-4xl mx-auto">
                    <PrinterSettings 
                        isOpen={true} 
                        onClose={() => {
                            // Redirect back to dashboard or POS if needed
                            window.location.href = '/';
                        }} 
                        isFullPage={true} 
                    />
                </div>
            </Layout>
        </NotificationProvider>
    );
}

export default App;
