import React from 'react';
interface StockDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItem?: any;
    onEditClick?: () => void;
    onUpdateStockClick?: () => void;
}
declare const StockDetailModal: React.FC<StockDetailModalProps>;
export default StockDetailModal;
