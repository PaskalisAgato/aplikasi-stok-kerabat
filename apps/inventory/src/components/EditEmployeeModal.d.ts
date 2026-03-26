import React from 'react';
import { type User } from '@shared/hooks/useEmployees';
interface EditEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: User | null;
}
declare const EditEmployeeModal: React.FC<EditEmployeeModalProps>;
export default EditEmployeeModal;
