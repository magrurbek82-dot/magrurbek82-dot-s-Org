/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Delete } from 'lucide-react';

interface NumpadProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
}

export default function Numpad({ value, onChange, className = "" }: NumpadProps) {
  const handleNumberClick = (num: string) => {
    // Cap at 12 digits (999,999,999,999 UZS) to avoid overflow
    if (value.length >= 12) return;
    
    // Prevent multiple leading zeros
    if (value === '0' && num === '0') return;
    
    // Replace leading zero
    if (value === '0') {
      onChange(num);
    } else {
      onChange(value + num);
    }
    
    // Simulate haptic feedback if API available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleDelete = () => {
    if (value.length <= 1) {
      onChange('0');
    } else {
      onChange(value.slice(0, -1));
    }
    
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const handleClear = () => {
    onChange('0');
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const keys = [
    { label: '1', action: () => handleNumberClick('1') },
    { label: '2', action: () => handleNumberClick('2') },
    { label: '3', action: () => handleNumberClick('3') },
    { label: '4', action: () => handleNumberClick('4') },
    { label: '5', action: () => handleNumberClick('5') },
    { label: '6', action: () => handleNumberClick('6') },
    { label: '7', action: () => handleNumberClick('7') },
    { label: '8', action: () => handleNumberClick('8') },
    { label: '9', action: () => handleNumberClick('9') },
    { label: 'C', action: handleClear, isSpecial: true },
    { label: '0', action: () => handleNumberClick('0') },
    { label: 'delete', action: handleDelete, isIcon: true, isSpecial: true },
  ];

  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {keys.map((key, idx) => (
        <motion.button
          key={idx}
          onClick={key.action}
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          className={`h-14 sm:h-16 rounded-2xl flex items-center justify-center font-mono text-xl sm:text-2xl font-bold transition-all border shadow-[0_2px_8px_rgba(0,0,0,0.01)]
            ${key.isSpecial 
              ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/80' 
              : 'bg-white border-slate-100 text-slate-900 hover:bg-slate-50 hover:border-slate-200'
            }`}
        >
          {key.isIcon ? (
            <Delete className="w-5 h-5 text-slate-500" />
          ) : (
            key.label
          )}
        </motion.button>
      ))}
    </div>
  );
}
