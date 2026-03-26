interface TaskCardProps {
    task: any;
    role: 'Admin' | 'Karyawan';
    onComplete?: (id: number, photo: string) => void;
    onEdit?: (task: any) => void;
    onDelete?: (id: number) => void;
}
export default function TaskCard({ task, role, onComplete, onEdit, onDelete }: TaskCardProps): import("react/jsx-runtime").JSX.Element;
export {};
