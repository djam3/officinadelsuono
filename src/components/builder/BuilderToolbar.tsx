import React from 'react';
import { useBuilder } from '../../contexts/BuilderContext';
import { Save, Loader2, AlertCircle, X, Pencil } from 'lucide-react';

export function BuilderToolbar() {
  const { isBuilderMode, isDirty, isLoading, saveContent, deactivateBuilderMode } = useBuilder();

  if (!isBuilderMode) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] transform transition-transform duration-300 translate-y-0`}>
      <div className="bg-zinc-900 border-t border-brand-orange/50 p-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Modalità Modifica Sito</p>
              <p className="text-zinc-400 text-xs">{isDirty ? 'Hai modifiche non salvate' : 'Clicca su testi o immagini per modificarli'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                onClick={() => window.location.reload()}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-bold transition-colors text-sm border border-white/10"
              >
                Annulla
              </button>
            )}
            {isDirty && (
              <button
                onClick={saveContent}
                disabled={isLoading}
                className="px-5 py-2 bg-gradient-to-r from-brand-orange to-orange-600 text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 text-sm"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isLoading ? 'Salvo...' : 'Salva Modifiche'}
              </button>
            )}
            <button
              onClick={deactivateBuilderMode}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-colors text-sm flex items-center gap-2 border border-white/10"
            >
              <X className="w-4 h-4" /> Esci dalla Modifica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
