import React from 'react';
import type { BahanBaku as InventoryItem } from '../App';
interface AddStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialItem?: InventoryItem | null;
}
declare const AddStockModal: React.FC<AddStockModalProps>;
export default AddStockModal;
