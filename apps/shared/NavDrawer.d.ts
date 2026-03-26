import React from 'react';
interface NavDrawerProps {
    open: boolean;
    onClose: () => void;
    currentPort?: number;
}
declare const NavDrawer: React.FC<NavDrawerProps>;
export default NavDrawer;
