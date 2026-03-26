interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    isDeleting: boolean;
}
export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemName, isDeleting }: DeleteConfirmationModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
