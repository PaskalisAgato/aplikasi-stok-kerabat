export interface CameraCaptureHandle {
    capture: () => Promise<Blob | null>;
    stop: () => void;
    start: () => Promise<void>;
}
interface CameraCaptureProps {
    className?: string;
    userName?: string;
    location?: string;
    facingMode?: 'user' | 'environment';
    showWatermark?: boolean;
}
declare const CameraCapture: import("react").ForwardRefExoticComponent<CameraCaptureProps & import("react").RefAttributes<CameraCaptureHandle>>;
export default CameraCapture;
