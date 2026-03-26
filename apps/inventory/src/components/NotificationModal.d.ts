import React from 'react';
interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventory?: any[];
}
declare const NotificationModal: React.FC<NotificationModalProps>;
export default NotificationModal;
