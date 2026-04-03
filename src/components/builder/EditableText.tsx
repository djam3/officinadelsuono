import React, { useState, useEffect, useRef } from 'react';
import { useBuilder } from '../../contexts/BuilderContext';
import { Pencil } from 'lucide-react';

interface EditableTextProps {
  contentKey: string;
  fallback: string;
  as?: any; // To avoid JSX namespace errors
  className?: string;
  multiline?: boolean;
}

export function EditableText({ contentKey, fallback, as: Component = 'span', className = '', multiline = false }: EditableTextProps) {
  const { isBuilderMode, content, updateContent } = useBuilder();
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState('');
  const inputRef = useRef<any>(null);

  const displayValue = content[contentKey] ?? fallback;

  useEffect(() => {
    if (isEditing) {
      setLocalValue(displayValue);
      // Auto-focus after render
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isEditing, displayValue]);

  const handleSave = () => {
    setIsEditing(false);
    if (localValue !== displayValue) {
      updateContent(contentKey, localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault(); // Stop newline in singleline inputs
      handleSave();
    }
    if (e.key === 'Escape') {
      setIsEditing(false); // Cancel
    }
  };

  if (!isBuilderMode) {
    return <Component className={className} dangerouslySetInnerHTML={{ __html: displayValue.replace(/\n/g, '<br/>') }} />;
  }

  if (isEditing) {
    return (
      <div className={`relative inline-block ${className}`}>
        {multiline ? (
          <textarea
            ref={inputRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full bg-zinc-800/80 text-white rounded outline-none ring-2 ring-brand-orange p-1 min-h-[100px] font-inherit"
            style={{ fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', lineHeight: 'inherit' }}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full bg-zinc-800/80 text-white rounded outline-none ring-2 ring-brand-orange px-1 font-inherit text-inherit"
            style={{ fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', width: `${Math.max(localValue.length, 10)}ch` }}
          />
        )}
      </div>
    );
  }

  return (
    <Component 
      className={`relative group cursor-pointer border border-dashed border-transparent hover:border-brand-orange/50 transition-colors ${className}`}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        setIsEditing(true);
      }}
    >
      {/* Show line breaks properly */}
      <span dangerouslySetInnerHTML={{ __html: displayValue.replace(/\n/g, '<br/>') }} />
      <span className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 bg-brand-orange text-white p-1 rounded-full shadow-lg transition-opacity pointer-events-none" style={{display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
        <Pencil className="w-3 h-3" />
      </span>
    </Component>
  );
}
