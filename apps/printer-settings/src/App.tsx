import { useState } from 'react';
import Layout from '@shared/Layout';
import PrinterSettings from '@shared/components/PrinterSettings';

function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <Layout 
            currentPort={5192} 
            title="Pengaturan Printer"
            subtitle="Hardware & Koneksi"
            maxWidth="100%"
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
    );
}

export default App;
