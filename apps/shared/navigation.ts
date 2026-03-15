export interface NavLink {
    label: string;
    icon: string;
    port: number;
    requiredRole: 'Admin' | 'Karyawan';
}

export const NAV_LINKS: NavLink[] = [
    { label: 'Dasbor', icon: 'dashboard', port: 5173, requiredRole: 'Admin' },
    { label: 'Kasir (POS)', icon: 'point_of_sale', port: 5186, requiredRole: 'Karyawan' },
    { label: 'Inventori', icon: 'inventory_2', port: 5174, requiredRole: 'Karyawan' },
    { label: 'Laporan (Laba Rugi)', icon: 'bar_chart', port: 5175, requiredRole: 'Admin' },
    { label: 'Analisis HPP', icon: 'analytics', port: 5176, requiredRole: 'Admin' },
    { label: 'Stok Opname', icon: 'fact_check', port: 5177, requiredRole: 'Karyawan' },
    { label: 'Analisis Keuangan', icon: 'payments', port: 5179, requiredRole: 'Admin' },
    { label: 'Riwayat Aktivitas', icon: 'history', port: 5180, requiredRole: 'Admin' },
    { label: 'Kelola Karyawan', icon: 'badge', port: 5178, requiredRole: 'Admin' },
    { label: 'Analisis COGS', icon: 'donut_small', port: 5183, requiredRole: 'Admin' },
    { label: 'Pengeluaran', icon: 'payments', port: 5184, requiredRole: 'Karyawan' },
    { label: 'Analisis Pemborosan', icon: 'delete_outline', port: 5185, requiredRole: 'Admin' },
];

const REPO_NAME = 'aplikasi-stok-kerabat';

export const PORT_TO_APP: Record<number, string> = {
    5173: 'dashboard',
    5174: 'inventory',
    5175: 'reports',
    5176: 'analisis-hpp',
    5177: 'stok-opname',
    5178: 'karyawan',
    5179: 'analisis-keuangan',
    5180: 'activity-history',
    5183: 'analisis-cogs',
    5184: 'pengeluaran',
    5185: 'analisis-pemborosan',
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
