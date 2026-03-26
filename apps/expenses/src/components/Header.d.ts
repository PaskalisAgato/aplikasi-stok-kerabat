import React from 'react';
type TabType = 'penjualan' | 'pengeluaran';
interface HeaderProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    onMenuClick: () => void;
}
declare const Header: React.FC<HeaderProps>;
export default Header;
