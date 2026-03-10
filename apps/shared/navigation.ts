export const NAV_LINKS = [
    { label: 'Dashboard', icon: 'dashboard', port: 5173 },
    { label: 'Inventory', icon: 'inventory_2', port: 5174 },
    { label: 'Reports (P&L)', icon: 'bar_chart', port: 5175 },
    { label: 'HPP Analysis', icon: 'analytics', port: 5176 },
    { label: 'Stock Opname', icon: 'fact_check', port: 5177 },
    { label: 'Employees', icon: 'badge', port: 5178 },
    { label: 'Settings', icon: 'settings', port: 5179 },
    { label: 'COGS Analysis', icon: 'donut_small', port: 5180 },
    { label: 'Expenses', icon: 'payments', port: 5181 },
    { label: 'Analisis Pemborosan', icon: 'delete_outline', port: 5182 },
];

const REPO_NAME = 'aplikasi-stok-kerabat';

export const PORT_TO_APP: Record<number, string> = {
    5173: 'dashboard',
    5174: 'inventory',
    5175: 'reports',
    5176: 'hpp',
    5177: 'opname',
    5178: 'employees',
    5179: 'settings',
    5180: 'cogs',
    5181: 'expenses',
    5182: 'waste',
    5183: 'waste-detail',
    5184: 'recipes',
    5185: 'recipe-edit',
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

        // Jika web dibuka di GitHub Pages atau mode preview static
        if (hostname.includes('github.io') || window.location.pathname.includes(`/${REPO_NAME}/`)) {
            const appName = PORT_TO_APP[port];
            return appName ? `/${REPO_NAME}/${appName}/` : `/${REPO_NAME}/`;
        }

        // Jika jalankan mode development (localhost:517x)
        const url = new URL(window.location.href);
        url.port = port.toString();
        url.pathname = '/';
        url.search = '';
        url.hash = '';
        return url.toString();
    }
    return `http://localhost:${port}/`;
};
