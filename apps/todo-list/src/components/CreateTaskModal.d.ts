interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    task?: any;
}
export default function CreateTaskModal({ isOpen, onClose, onSave, task }: CreateTaskModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
