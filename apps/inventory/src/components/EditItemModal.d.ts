import React from 'react';
interface EditItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: () => void;
    item: any;
}
declare const EditItemModal: React.FC<EditItemModalProps>;
export default EditItemModal;
