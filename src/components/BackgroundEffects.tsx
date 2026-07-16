/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 w-full h-full bg-slate-50 overflow-hidden pointer-events-none z-0">
      {/* Soft elegant glowing light-blue/indigo orbs for light background */}
      <motion.div
        className="absolute w-[450px] h-[450px] sm:w-[600px] sm:h-[600px] rounded-full bg-blue-100/40 blur-[120px] sm:blur-[160px] top-[-10%] left-[-15%]"
        animate={{
          x: [0, 30, -15, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full bg-slate-100/60 blur-[130px] sm:blur-[180px] bottom-[5%] right-[-15%]"
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 30, -30, 0],
          scale: [1, 0.95, 1.05, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full bg-emerald-50/30 blur-[100px] sm:blur-[140px] top-[40%] left-[20%]"
        animate={{
          x: [0, 40, -40, 0],
          y: [0, 20, -20, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* SVG Noise/Grain Overlay Filter (Ultra subtle for high premium texture) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.015] mix-blend-overlay">
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
}

