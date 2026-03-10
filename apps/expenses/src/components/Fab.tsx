import React from 'react';

interface FabProps {
    onClick: () => void;
}

const Fab: React.FC<FabProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed right-6 bottom-24 bg-primary text-white shadow-lg shadow-primary/40 flex items-center gap-2 px-5 py-3 rounded-full active:scale-95 transition-transform z-20"
        >
            <span className="material-symbols-outlined">add</span>
            <span className="font-bold text-sm">Tambah Pengeluaran</span>
        </button>
    );
};

export default Fab;
