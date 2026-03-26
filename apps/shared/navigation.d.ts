export interface NavLink {
    label: string;
    icon: string;
    port: number;
    requiredRole: 'Admin' | 'Karyawan';
}
export declare const NAV_LINKS: NavLink[];
export declare const PORT_TO_APP: Record<number, string>;
export declare const getBaseUrl: () => string;
export declare const getTargetUrl: (port: number) => string;
