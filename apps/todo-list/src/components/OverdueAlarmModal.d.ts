interface OverdueAlarmModalProps {
    tasks: any[];
    onSnooze: (id: number) => void;
    onStop: (id: number) => void;
    onComplete: (task: any) => void;
}
export default function OverdueAlarmModal({ tasks, onSnooze, onStop, onComplete }: OverdueAlarmModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
