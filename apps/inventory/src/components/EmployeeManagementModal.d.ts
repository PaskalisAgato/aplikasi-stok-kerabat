import React from 'react';
interface EmployeeManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}
declare const EmployeeManagementModal: React.FC<EmployeeManagementModalProps>;
export default EmployeeManagementModal;
