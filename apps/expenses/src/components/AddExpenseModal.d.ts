import React from 'react';
interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (expense: any) => void;
    initialData?: any;
}
declare const AddExpenseModal: React.FC<AddExpenseModalProps>;
export default AddExpenseModal;
