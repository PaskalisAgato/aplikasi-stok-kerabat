export const NAV_LINKS = [
    { label: 'Dasbor', icon: 'dashboard', port: 5173 },
    { label: 'Kasir (POS)', icon: 'point_of_sale', port: 5186 },
    { label: 'Inventori', icon: 'inventory_2', port: 5174 },
    { label: 'Laporan (Laba Rugi)', icon: 'bar_chart', port: 5175 },
    { label: 'Analisis HPP', icon: 'analytics', port: 5176 },
    { label: 'Stok Opname', icon: 'fact_check', port: 5177 },
    { label: 'Karyawan', icon: 'badge', port: 5178 },
    { label: 'Pengaturan', icon: 'settings', port: 5179 },
    { label: 'Analisis COGS', icon: 'donut_small', port: 5180 },
    { label: 'Pengeluaran', icon: 'payments', port: 5181 },
    { label: 'Analisis Pemborosan', icon: 'delete_outline', port: 5182 },
];

const REPO_NAME = 'aplikasi-stok-kerabat';

export const PORT_TO_APP: Record<number, string> = {
    5173: 'dashboard',
    5174: 'inventory',
    5175: 'reports',
    5176: 'analisis-hpp',
    5177: 'stok-opname',
    5178: 'karyawan',
    5179: 'pengaturan',
    5180: 'analisis-cogs',
    5181: 'pengeluaran',
    5182: 'analisis-pemborosan',
    5183: 'waste-detail',
    5184: 'recipes',
    5185: 'recipe-edit',
    5186: 'pos',
};

export const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        return `${url.protocol}//${url.hostname}`;
    }
    return 'http://localhost';
};

export const getTargetUrl = (port: number) => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;

        // Is this a local development environment (localhost, 127.0.0.1, or local IP)?
        const isLocalhost = hostname === 'localhost' || 
                           hostname === '127.0.0.1' || 
                           hostname.startsWith('192.168.') || 
                           hostname.startsWith('10.');

        if (!isLocalhost) {
            // Production environment (GitHub Pages, Render, etc.)
            const appName = PORT_TO_APP[port];
            
            // On GitHub Pages, the base is often /REPO_NAME/
            // We want to ensure we stay within that base if it exists
            const segments = pathname.split('/').filter(Boolean);
            const isGitHubPages = segments[0] === REPO_NAME;

            if (isGitHubPages) {
                return appName ? `/${REPO_NAME}/${appName}/` : `/${REPO_NAME}/`;
            } else {
                // Root-level deployment or other environment
                return appName ? `/${appName}/` : '/';
            }
        }

        // Development mode: switch ports
        const url = new URL(window.location.href);
        url.port = port.toString();
        url.pathname = '/';
        url.search = '';
        url.hash = '';
        return url.toString();
    }
    return `http://localhost:${port}/`;
};
