import React, { useState } from 'react';
import { useBuilder } from '../../contexts/BuilderContext';
import { Image as ImageIcon, Video, Check, X } from 'lucide-react';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;

interface EditableMediaProps {
  contentKey: string;
  fallbackRaw: string; // The URL fallback
  fallbackType: 'image' | 'youtube';
  className?: string;
  imgClassName?: string; // For the inner image if needed
}

export function EditableMedia({ contentKey, fallbackRaw, fallbackType, className = '', imgClassName = '' }: EditableMediaProps) {
  const { isBuilderMode, content, updateContent } = useBuilder();
  const [isEditing, setIsEditing] = useState(false);
  const [localUrl, setLocalUrl] = useState('');
  const [localType, setLocalType] = useState<'image' | 'youtube'>('image');
  const [isUploading, setIsUploading] = useState(false);

  // Stored state defaults to fallback if not yet set in CMS
  const currentVal = content[contentKey] || { url: fallbackRaw, type: fallbackType };
  const currentUrl = currentVal.url || fallbackRaw;
  const currentType = currentVal.type || fallbackType;

  // Check if string is just url or an object. To support old string fallback:
  const normalizedUrl = typeof currentVal === 'string' ? currentVal : currentUrl;
  const normalizedType = typeof currentVal === 'string' ? fallbackType : currentType;

  const handleOpenEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBuilderMode) {
      setLocalUrl(normalizedUrl);
      setLocalType(normalizedType);
      setIsEditing(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload fallito');

      const data = await response.json();
      if (data.urls && data.urls.length > 0) {
        setLocalUrl(data.urls[0]);
        setLocalType('image');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Errore durante il caricamento dell\'immagine');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    updateContent(contentKey, { url: localUrl, type: localType });
    setIsEditing(false);
  };

  const renderMedia = () => {
    if (normalizedType === 'youtube') {
      return (
        <div className={`w-full h-full pointer-events-none ${className}`}>
           {/* @ts-ignore */}
           <Player 
             url={normalizedUrl}
             width="100%" 
             height="100%" 
             playing={true}
             loop={true}
             muted={true}
             controls={false}
             style={{ objectFit: 'cover' }}
           />
        </div>
      );
    }
    return (
      <img 
        src={normalizedUrl} 
        alt="Media" 
        loading="lazy"
        className={`w-full h-full ${imgClassName || className}`}
        referrerPolicy="no-referrer"
      />
    );
  };

  if (!isBuilderMode) {
    return renderMedia();
  }

  return (
    <div className={`relative group ${className}`}>
      {renderMedia()}
      
      {/* Edit Overlay */}
      <div 
        className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer z-20"
        onClick={handleOpenEdit}
      >
        <div className="bg-brand-orange text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg transform scale-95 group-hover:scale-100 transition-transform">
          <ImageIcon className="w-4 h-4" /> Cambia Media
        </div>
      </div>

      {/* Editor Modal/Popover */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setIsEditing(false)}>
          <div className="bg-zinc-900 border border-brand-orange/30 p-6 rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Modifica Media</h3>
            
            <div className="flex gap-4 mb-6">
              <button 
                className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl transition-colors ${localType === 'image' ? 'bg-brand-orange text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                onClick={(e) => { e.stopPropagation(); setLocalType('image'); }}
              >
                <ImageIcon className="w-5 h-5" /> Immagine
              </button>
              <button 
                className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl transition-colors ${localType === 'youtube' ? 'bg-brand-orange text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                onClick={(e) => { e.stopPropagation(); setLocalType('youtube'); }}
              >
                <Video className="w-5 h-5" /> YouTube
              </button>
            </div>

            {localType === 'image' && (
              <div className="mb-6">
                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Carica File
                </label>
                <label className={`w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-brand-orange/50 hover:bg-white/5 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                       {/* @ts-ignore */}
                      <span className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></span>
                      <span className="text-sm font-bold text-zinc-400">Caricamento...</span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-brand-orange" />
                      <span className="text-sm font-bold text-zinc-400">Clicca per selezionare o trascina</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Oppure URL</span>
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider">
                URL {localType === 'image' ? "Immagine" : "Video YouTube"}
              </label>
              <input 
                type="text" 
                value={localUrl}
                onChange={e => setLocalUrl(e.target.value)}
                placeholder={localType === 'image' ? "https://..." : "https://www.youtube.com/watch?v=..."}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-colors font-bold"
              >
                <X className="w-5 h-5" /> Annulla
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-orange-600 text-white font-bold transition-all shadow-lg"
              >
                <Check className="w-5 h-5" /> Salva Media
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
