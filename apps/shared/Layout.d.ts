import React from 'react';
interface LayoutProps {
    children: React.ReactNode;
    currentPort: number;
    title: string;
    subtitle?: string;
    sidebar?: React.ReactNode;
    headerExtras?: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
}
declare const Layout: React.FC<LayoutProps>;
export default Layout;
