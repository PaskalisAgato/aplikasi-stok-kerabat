import React from 'react';
interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    isDeleting?: boolean;
}
declare const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps>;
export default DeleteConfirmationModal;
