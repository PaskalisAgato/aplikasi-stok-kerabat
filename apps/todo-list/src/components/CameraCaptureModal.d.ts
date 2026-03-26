interface CameraCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (base64: string) => void;
    userName?: string;
}
export default function CameraCaptureModal({ isOpen, onClose, onCapture, userName }: CameraCaptureModalProps): import("react").ReactPortal | null;
export {};
