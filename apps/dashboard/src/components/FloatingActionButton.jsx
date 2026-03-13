export default function FloatingActionButton() {
    return (
        <button className="fixed bottom-24 right-6 size-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-30">
            <span className="material-symbols-outlined text-3xl">add</span>
        </button>
    );
}

