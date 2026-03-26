import React from 'react';
interface EmployeeManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    isStandalone?: boolean;
}
declare const EmployeeManagementModal: React.FC<EmployeeManagementModalProps>;
export default EmployeeManagementModal;
