import React, { useState, useRef } from 'react';
import { 
  Move, 
  Type, 
  QrCode, 
  Upload, 
  Trash2, 
  Save, 
  Maximize, 
  MoreHorizontal,
  ChevronDown,
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
    <div className="flex h-full animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Designer Canvas */}
      <div className="flex-1 p-12 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-outfit font-extrabold tracking-tight">Visual Designer</h2>
            <p className="text-white/40 text-sm mt-1">Position QR and text elements on your custom template.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-3 rounded-2xl glass hover:bg-white/5 transition-all text-sm font-bold flex items-center gap-2">
              <Upload className="w-4 h-4" /> Change Background
            </button>
            <button className="px-8 py-3 rounded-2xl bg-white text-black font-bold text-sm shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-black/40 rounded-[3rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px]" />
          
          {/* Voucher Preview Container (58mm aspect ratio approx 1:2 or 2:1) */}
          <div 
            ref={containerRef}
            className="w-[450px] aspect-[1/2] bg-[#111] rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden select-none"
          >
            {bgImage ? (
              <img src={bgImage} className="w-full h-full object-cover opacity-60" alt="Background" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-white/5 m-4 rounded-2xl">
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No Background Active</p>
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
                className={`group/item ${selectedId === el.id ? 'ring-2 ring-white ring-offset-4 ring-offset-black rounded-lg' : ''}`}
              >
                {el.type === 'qr' ? (
                  <div 
                    className={`${highContrast ? 'bg-white p-1' : 'bg-transparent'} rounded-sm shadow-xl`} 
                    style={{ width: el.size, height: el.size }}
                  >
                    <QrCode className={`w-full h-full ${highContrast ? 'text-black' : 'text-white'}`} />
                  </div>
                ) : (
                  <div className="font-outfit font-black uppercase text-white drop-shadow-lg flex items-center gap-2" style={{ fontSize: el.size }}>
                    <Type className="w-4 h-4 opacity-0 group-hover/item:opacity-40 transition-opacity" />
                    {el.label}
                  </div>
                )}
                
                {/* Drag Handle Overlay */}
                <div className="absolute inset-0 bg-white/0 group-hover/item:bg-white/5 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover/item:opacity-100">
                   <Move className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Properties Sidebar */}
      <div className="w-96 border-l border-white/5 bg-[#0a0a0a]/50 p-8 flex flex-col">
        <h3 className="font-outfit font-bold text-lg mb-8">Properties</h3>
        
        {selectedId ? (
          <div className="space-y-8">
            <div className="p-5 rounded-3xl glass">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/60">
                   {elements.find(e => e.id === selectedId)?.type === 'qr' ? <QrCode className="w-5 h-5"/> : <Type className="w-5 h-5"/>}
                </div>
                <div>
                   <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Active Element</p>
                   <p className="font-bold">{elements.find(e => e.id === selectedId)?.label}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-tighter">Size</label>
                    <span className="text-[10px] font-mono text-white/20">{elements.find(e => e.id === selectedId)?.size}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="200" 
                    value={elements.find(e => e.id === selectedId)?.size}
                    onChange={(e) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, size: parseInt(e.target.value) } : el))}
                    className="w-full accent-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-tighter">Position X</label>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-sm font-mono flex items-center justify-between">
                      {Math.round(elements.find(e => e.id === selectedId)?.x || 0)}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-tighter">Position Y</label>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-sm font-mono flex items-center justify-between">
                      {Math.round(elements.find(e => e.id === selectedId)?.y || 0)}%
                    </div>
                  </div>
                </div>

                {elements.find(e => e.id === selectedId)?.type === 'qr' && (
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2">
                       <Zap className="w-4 h-4 text-yellow-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest">High Contrast QR</span>
                    </div>
                    <button 
                      onClick={() => setHighContrast(!highContrast)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${highContrast ? 'bg-green-500' : 'bg-white/10'}`}
                    >
                      <motion.div 
                        animate={{ x: highContrast ? 26 : 2 }}
                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setSelectedId(null)}
              className="w-full py-4 rounded-2xl glass hover:bg-white/5 text-xs font-bold text-white/40 hover:text-white transition-all uppercase tracking-widest"
            >
              Deselect Element
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 grayscale italic">
            <MousePointer2 className="w-12 h-12 mb-4" />
            <p className="text-sm">Click an element on the canvas to edit its properties</p>
          </div>
        )}

        <div className="mt-auto space-y-4">
           <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
             <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
               <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Layout Tip</p>
             </div>
             <p className="text-xs text-indigo-300/80 leading-relaxed">Ensure QR Code has a 5mm safety margin from edges for reliable thermal printing.</p>
           </div>
        </div>
      </div>
    </div>
  );
};
