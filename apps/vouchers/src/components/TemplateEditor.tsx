import React, { useState, useRef } from 'react';
import { 
  Move, 
  Type, 
  QrCode, 
  Upload, 
  Trash2, 
  Save, 
  MousePointer2,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ElementPosition {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  type: 'qr' | 'text';
}

export const TemplateEditor = () => {
  const [elements, setElements] = useState<ElementPosition[]>([
    { id: 'qr', label: 'QR Code', x: 70, y: 30, size: 100, type: 'qr' },
    { id: 'promo', label: 'Promo Name', x: 20, y: 20, size: 24, type: 'text' },
    { id: 'code', label: 'Voucher Code', x: 20, y: 80, size: 16, type: 'text' }
  ]);
  
  const [highContrast, setHighContrast] = useState(true);
  
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      
      setElements(prev => prev.map(el => 
        el.id === id ? { ...el, x: Math.max(0, Math.min(90, x)), y: Math.max(0, Math.min(95, y)) } : el
      ));
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    setSelectedId(id);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-8 animate-in fade-in slide-in-from-right-4 duration-500 min-h-[70vh]">
      {/* Designer Canvas */}
      <div className="flex-1 flex flex-col space-y-6">
        <div className="flex items-center justify-between px-2">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">Canvas</p>
            <h2 className="text-2xl font-display font-black tracking-tight text-[var(--text-main)] uppercase">Voucher Designer</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="h-12 px-6 rounded-2xl border border-primary/10 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all flex items-center gap-2">
              <Upload className="w-4 h-4" /> Change BG
            </button>
            <button className="btn-primary h-12 px-8">
              <Save className="w-4 h-4 mr-2" /> Simpan Layout
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-primary/5 rounded-[3.5rem] border border-primary/10 relative overflow-hidden group min-h-[600px] shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(var(--primary)_1px,transparent_1px)] opacity-[0.03] [background-size:24px_24px]" />
          
          {/* Voucher Preview Container */}
          <div 
            ref={containerRef}
            className="w-[350px] aspect-[1/2] bg-[var(--bg-app)] rounded-3xl border border-primary/20 shadow-2xl relative overflow-hidden select-none"
          >
            {bgImage ? (
              <img src={bgImage} className="w-full h-full object-cover opacity-60" alt="Background" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-primary/10 m-6 rounded-2xl">
                <div className="size-16 rounded-3xl bg-primary/5 flex items-center justify-center mb-4 transition-colors group-hover:bg-primary/10">
                  <Upload className="size-8 text-primary opacity-20" />
                </div>
                <p className="text-primary/20 text-[10px] font-black uppercase tracking-widest">No Plate Active</p>
              </div>
            )}

            {elements.map((el) => (
              <div
                key={el.id}
                onMouseDown={(e) => handleDrag(el.id, e)}
                style={{ 
                  left: `${el.x}%`, 
                  top: `${el.y}%`,
                  position: 'absolute',
                  cursor: 'move',
                  zIndex: selectedId === el.id ? 20 : 10
                }}
                className={`group/item ${selectedId === el.id ? 'ring-2 ring-primary ring-offset-4 ring-offset-[var(--bg-app)] rounded-lg' : ''}`}
              >
                {el.type === 'qr' ? (
                  <div 
                    className={`${highContrast ? 'bg-white p-1' : 'bg-transparent'} rounded-sm shadow-xl border border-black/5`} 
                    style={{ width: el.size, height: el.size }}
                  >
                    <QrCode className={`w-full h-full ${highContrast ? 'text-black' : 'text-primary'}`} />
                  </div>
                ) : (
                  <div className="font-display font-black uppercase text-[var(--text-main)] drop-shadow-md flex items-center gap-2 whitespace-nowrap" style={{ fontSize: el.size }}>
                    {el.label}
                  </div>
                )}
                
                {/* Drag Handle Overlay */}
                <div className="absolute -inset-2 bg-primary/0 group-hover/item:bg-primary/5 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover/item:opacity-100 border border-primary/20 scale-110">
                   <Move className="size-4 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Properties Sidebar */}
      <div className="w-full lg:w-96 flex flex-col space-y-6">
        <div>
           <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">Configuration</p>
           <h2 className="text-2xl font-display font-black tracking-tight text-[var(--text-main)] uppercase">Properties</h2>
        </div>
        
        <div className="flex-1 card min-h-[500px] p-8 space-y-8">
          {selectedId ? (
            <div className="space-y-8 h-full flex flex-col">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                     {elements.find(e => e.id === selectedId)?.type === 'qr' ? <QrCode className="size-6"/> : <Type className="size-6"/>}
                  </div>
                  <div>
                     <p className="text-[9px] text-primary uppercase font-black tracking-[0.2em] mb-0.5">Active Element</p>
                     <p className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">{elements.find(e => e.id === selectedId)?.label}</p>
                  </div>
                </div>

                <div className="h-[1px] bg-primary/10 w-full" />

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Dimension Scale</label>
                      <span className="text-[10px] font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{elements.find(e => e.id === selectedId)?.size}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="200" 
                      value={elements.find(e => e.id === selectedId)?.size}
                      onChange={(e) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, size: parseInt(e.target.value) } : el))}
                      className="w-full accent-primary h-1.5 bg-primary/10 rounded-full appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">X Offset</label>
                      <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-sm font-mono font-black text-primary flex items-center justify-center">
                        {Math.round(elements.find(e => e.id === selectedId)?.x || 0)}%
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Y Offset</label>
                      <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-sm font-mono font-black text-primary flex items-center justify-center">
                        {Math.round(elements.find(e => e.id === selectedId)?.y || 0)}%
                      </div>
                    </div>
                  </div>

                  {elements.find(e => e.id === selectedId)?.type === 'qr' && (
                    <div className="flex items-center justify-between p-5 bg-primary/5 rounded-2xl border border-primary/10">
                      <div className="flex items-center gap-3">
                         <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Zap className="size-4 fill-current" />
                         </div>
                         <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Contrast QR</span>
                      </div>
                      <button 
                        onClick={() => setHighContrast(!highContrast)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${highContrast ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-primary/10'}`}
                      >
                        <motion.div 
                          animate={{ x: highContrast ? 26 : 2 }}
                          className="absolute top-1 left-1 size-4 bg-white rounded-full shadow-md"
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <button 
                  onClick={() => setSelectedId(null)}
                  className="w-full py-4 rounded-2xl border border-primary/10 text-[10px] font-black text-primary hover:bg-primary/5 transition-all uppercase tracking-widest"
                >
                  Deselect Element
                </button>
                <button className="w-full py-4 flex items-center justify-center gap-3 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/5 rounded-2xl transition-all">
                  <Trash2 className="size-4" /> Remove Item
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-30 group cursor-default">
              <div className="size-20 rounded-[2.5rem] bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                <MousePointer2 className="size-10 text-primary" />
              </div>
              <p className="text-sm font-bold text-[var(--text-main)] uppercase tracking-widest">Select element to configure</p>
              <p className="text-[10px] uppercase mt-2 opacity-60">Interactive design mode active</p>
            </div>
          )}
        </div>

        <div className="p-6 rounded-[2.5rem] bg-primary/5 border border-primary/10">
           <div className="flex items-center gap-3 mb-3">
             <div className="size-2 h-2 rounded-full bg-primary animate-pulse" />
             <p className="text-[10px] font-black uppercase text-primary tracking-widest">Safety Margin Alert</p>
           </div>
           <p className="text-[11px] font-bold text-primary/60 leading-relaxed italic">Pastikan QR Code memiliki jarak minimal 5mm dari tepi untuk keandalan cetak thermal.</p>
        </div>
      </div>
    </div>
  );
};
