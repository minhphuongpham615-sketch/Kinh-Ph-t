import React from "react";
import { random, useCurrentFrame } from "remotion";

const EMBER_COUNT = 70;

/** Bầu trời đỏ thẫm, dãy núi xa và tàn lửa trôi lên chậm. */
export const Background: React.FC = () => {
  return (
    <g>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c0202" />
          <stop offset="55%" stopColor="#2a0704" />
          <stop offset="85%" stopColor="#5a1206" />
          <stop offset="100%" stopColor="#2b0603" />
        </linearGradient>
        <radialGradient id="horizonGlow" cx="0.65" cy="0.9" r="0.6">
          <stop offset="0%" stopColor="#ff5a14" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#ff5a14" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#sky)" />
      <rect width={1920} height={1080} fill="url(#horizonGlow)" />

      {/* Dãy núi xa */}
      <path
        d="M0 820 L140 700 L260 760 L420 640 L560 740 L700 690 L860 780 L1010 660 L1180 760 L1320 680 L1500 770 L1640 690 L1800 750 L1920 700 L1920 1080 L0 1080 Z"
        fill="#1b0503"
        opacity={0.9}
      />
      <path
        d="M0 900 L180 830 L330 880 L520 810 L720 890 L940 830 L1140 900 L1360 840 L1560 900 L1760 850 L1920 880 L1920 1080 L0 1080 Z"
        fill="#120302"
      />
      {/* Mặt đất nóng đỏ */}
      <rect x={0} y={960} width={1920} height={120} fill="#0b0201" />
      <ellipse cx={1150} cy={975} rx={900} ry={30} fill="#ff4a10" opacity={0.18} />

      <Embers />
    </g>
  );
};

const Embers: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <g>
      {new Array(EMBER_COUNT).fill(true).map((_, i) => {
        const speed = 0.6 + random(`ember-speed-${i}`) * 1.6;
        const startY = random(`ember-y-${i}`) * 1200;
        const y = 1100 - ((startY + frame * speed) % 1200);
        const x =
          random(`ember-x-${i}`) * 1920 +
          Math.sin(frame / 18 + i) * 14 * random(`ember-sway-${i}`);
        const r = 1 + random(`ember-r-${i}`) * 2.5;
        const flicker = 0.4 + 0.6 * Math.abs(Math.sin(frame / 6 + i * 1.3));
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill="#ff9a3c"
            opacity={0.55 * flicker}
          />
        );
      })}
    </g>
  );
};
