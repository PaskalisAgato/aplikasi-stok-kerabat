import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import CameraCaptureModal from './CameraCaptureModal';
export default function TaskCard({ task, role, onComplete, onEdit, onDelete }) {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isOverdue, setIsOverdue] = useState(false);
    useEffect(() => {
        if (!task.deadline || task.status === 'Completed') {
            setTimeLeft(null);
            setIsOverdue(false);
            return;
        }
        const updateTime = () => {
            const now = new Date();
            const deadlineDate = new Date(task.deadline);
            const diff = deadlineDate.getTime() - now.getTime();
            if (diff <= 0) {
                setTimeLeft('OVERDUE');
                setIsOverdue(true);
            }
            else {
                setIsOverdue(false);
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                if (hours > 24)
                    setTimeLeft(`${Math.floor(hours / 24)}d left`);
                else if (hours > 0)
                    setTimeLeft(`${hours}h ${minutes}m left`);
                else
                    setTimeLeft(`${minutes}m left`);
            }
        };
        updateTime();
        const interval = setInterval(updateTime, 1000 * 30); // Update every 30s
        return () => clearInterval(interval);
    }, [task.deadline, task.status]);
    const handleCapture = async (base64) => {
        if (!onComplete)
            return;
        setIsUploading(true);
        try {
            await onComplete(task.id, base64);
        }
        finally {
            setIsUploading(false);
        }
    };
    const isCompleted = task.status === 'Completed';
    return (_jsxs("div", { className: `card group p-5 flex flex-col gap-4 transition-all border-white/5 relative ${isCompleted ? 'opacity-60 grayscale-[0.5]' : ''} ${isOverdue ? 'ring-2 ring-red-500/50 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : ''}`, children: [_jsxs("div", { className: "flex justify-between items-start gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center flex-wrap gap-2 mb-2", children: [_jsx("span", { className: `text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${task.category === 'Opening' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                                            task.category === 'Closing' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                                                'text-sky-500 border-sky-500/20 bg-sky-500/5'}`, children: task.category }), timeLeft && (_jsxs("span", { className: `text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 border animate-in fade-in zoom-in duration-500 ${isOverdue ? 'bg-red-500 text-white border-red-500' : 'bg-primary/10 text-primary border-primary/20'}`, children: [_jsx("span", { className: "material-symbols-outlined text-[10px] font-black", children: isOverdue ? 'priority_high' : 'schedule' }), timeLeft] })), task.isRecurring && (_jsxs("span", { className: "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[10px] font-black", children: "autorenew" }), "Rutin"] })), !isCompleted && !task.isRecurring && (_jsx("span", { className: "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-500", children: "Sekali Saja" })), isCompleted && (_jsxs("span", { className: "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[10px] font-black", children: "check_circle" }), "Selesai"] }))] }), _jsx("h3", { className: "text-lg font-black font-display tracking-tight text-main uppercase leading-tight truncate", children: task.title }), _jsx("p", { className: "text-[10px] text-muted font-bold uppercase tracking-widest opacity-60 line-clamp-2", children: task.description })] }), role === 'Admin' && (_jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: () => onEdit?.(task), className: "size-8 glass rounded-lg text-primary hover:bg-primary/20 flex items-center justify-center transition-all", children: _jsx("span", { className: "material-symbols-outlined text-sm font-black", children: "edit" }) }), _jsx("button", { onClick: () => onDelete?.(task.id), className: "size-8 glass rounded-lg text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-all", children: _jsx("span", { className: "material-symbols-outlined text-sm font-black", children: "delete" }) })] }))] }), !isCompleted && role === 'Karyawan' && (_jsx("div", { className: "pt-4 border-t border-white/5 flex flex-col gap-3", children: _jsxs("button", { onClick: () => setIsCameraOpen(true), disabled: isUploading, className: `w-full h-12 rounded-xl flex items-center justify-center gap-3 transition-all border-2 border-dashed ${isUploading ? 'bg-primary/5 border-primary/40 animate-pulse' : 'bg-white/5 border-white/10 hover:border-primary/40 hover:bg-primary/5'}`, children: [_jsx("span", { className: "material-symbols-outlined text-primary text-xl font-black", children: "photo_camera" }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-widest text-primary", children: isUploading ? 'Mengunggah...' : 'Ambil Foto Bukti' })] }) })), _jsx(CameraCaptureModal, { isOpen: isCameraOpen, onClose: () => setIsCameraOpen(false), onCapture: handleCapture }), isCompleted && task.photoProof && (_jsxs("div", { className: "pt-5 border-t border-white/5 space-y-4", children: [_jsxs("div", { className: "w-full aspect-video rounded-[2rem] bg-slate-900 overflow-hidden border border-white/10 cursor-pointer group/thumb relative", onClick: () => window.open(task.photoProof, '_blank'), children: [_jsx("img", { src: task.photoProof, className: "w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-110", alt: "Bukti" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-end p-4", children: _jsxs("span", { className: "text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "visibility" }), "Lihat Foto Full"] }) })] }), _jsxs("div", { className: "flex justify-between items-end", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx("p", { className: "text-[8px] font-black text-muted uppercase tracking-widest opacity-60", children: "Selesai pada" }), _jsx("p", { className: "text-[10px] font-black text-main uppercase tracking-tight", children: new Date(task.completionTime).toLocaleString('id-ID') })] }), _jsxs("div", { className: "text-right space-y-0.5", children: [_jsx("p", { className: "text-[8px] font-black text-muted uppercase tracking-widest opacity-60", children: "Oleh" }), _jsx("p", { className: "text-[10px] font-black text-primary uppercase tracking-tight", children: task.completedByName || 'Staf' })] })] })] }))] }));
}
