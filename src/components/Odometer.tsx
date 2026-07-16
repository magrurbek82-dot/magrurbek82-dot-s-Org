/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OdometerProps {
  value: number;
  currency?: string;
  className?: string;
}

export default function Odometer({ value, currency = "UZS", className = "" }: OdometerProps) {
  const [digits, setDigits] = useState<string[]>([]);

  useEffect(() => {
    // Format number with commas
    const formattedString = value.toLocaleString('uz-UZ');
    setDigits(formattedString.split(''));
  }, [value]);

  return (
    <div className={`flex items-baseline justify-center font-mono font-bold tracking-tight select-none ${className}`}>
      <AnimatePresence mode="popLayout">
        {digits.map((char, index) => {
          if (char === ' ' || char === ',') {
            return (
              <span key={`comma-${index}`} className="mx-0.5 opacity-60">
                ,
              </span>
            );
          }

          const digit = parseInt(char, 10);
          if (isNaN(digit)) {
            return (
              <span key={`char-${index}`} className="mx-0.5">
                {char}
              </span>
            );
          }

          return (
            <div
              key={`digit-container-${index}-${char}`}
              className="relative h-[1.2em] overflow-hidden flex flex-col justify-start"
              style={{ width: '0.65em' }}
            >
              <motion.div
                className="absolute left-0 right-0 flex flex-col items-center"
                initial={{ y: '100%' }}
                animate={{ y: `-${digit * 10}%` }}
                exit={{ y: '-100%' }}
                transition={{
                  type: 'spring',
                  stiffness: 70,
                  damping: 14,
                  mass: 0.8,
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <span
                    key={num}
                    className="flex h-[1.2em] items-center justify-center text-center"
                    style={{ height: '1.2em', lineHeight: '1.2em' }}
                  >
                    {num}
                  </span>
                ))}
              </motion.div>
              {/* Invisible placeholder to reserve layout space */}
              <span className="opacity-0">8</span>
            </div>
          );
        })}
      </AnimatePresence>
      <span className="ml-2 text-xs sm:text-sm font-sans font-semibold tracking-normal text-slate-500 opacity-95">
        {currency}
      </span>
    </div>
  );
}
