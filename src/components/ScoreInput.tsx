// ============================================
// COMPOSANT : Input intelligent pour scores
// Fichier : src/components/ScoreInput.tsx
// ============================================

import { useRef, useEffect } from 'react';

interface ScoreInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Input intelligent pour saisir les scores
 * - Max 2 chiffres
 * - Auto-focus sur champ suivant quand 2 chiffres
 * - Saisie numérique uniquement
 */
export function ScoreInput({ 
  value, 
  onChange, 
  onComplete, 
  label,
  disabled = false,
  autoFocus = false,
  className = ''
}: ScoreInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Garder uniquement les chiffres
    let val = e.target.value.replace(/\D/g, '');
    
    // Limiter à 2 chiffres max
    val = val.slice(0, 2);
    
    onChange(val);
    
    // Auto-focus sur le champ suivant si 2 chiffres
    if (val.length === 2 && onComplete) {
      setTimeout(() => {
        onComplete();
      }, 50);
    }
  };
  
  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-xs text-gray-600 mb-1 font-medium">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        maxLength={2}
        className={`
          w-16 h-12 text-2xl font-bold text-center 
          border-2 rounded-lg 
          transition-all duration-200
          ${disabled 
            ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
            : 'bg-white border-gray-300 text-gray-900 focus:border-rugby-gold focus:ring-2 focus:ring-rugby-gold/20'
          }
          outline-none
          ${className}
        `}
        placeholder="--"
      />
    </div>
  );
}
