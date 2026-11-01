import React from "react";
import { noise2D } from "@remotion/noise";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BALL_RADIUS,
  getBallState,
  getBallVelocity,
  getImpactFrame,
} from "./ballMotion";

const TRAIL_STEPS = 10;
const FLAME_TONGUES = 9;

/**
 * Viên sắt nóng + lửa + quầng sáng + vệt chuyển động.
 * Tất cả đều tính từ getBallState() nên di chuyển cùng nhau.
 */
export const IronBall: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ball = getBallState(frame, fps);
  const { vx, vy } = getBallVelocity(frame, fps);
  const speed = Math.hypot(vx, vy);
  const r = BALL_RADIUS * ball.scale;
  const impact = getImpactFrame(fps);

  const flash = interpolate(frame, [impact - 1, impact + 1, impact + 20], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Lửa bị gió thổi ngược hướng bay, đồng thời bốc lên trên.
  const trailX = -vx * 1.4;
  const trailY = -vy * 1.4 - 9;
  const flameAngle = Math.atan2(trailY, trailX);
  const flameStretch = 1 + Math.min(speed, 30) * 0.06;

  // Viên sắt tự xoay khi bay.
  const spin = (ball.progress * 540 + frame * 2) % 360;

  return (
    <g>
      <defs>
        <radialGradient id="ballCore" cx="0.42" cy="0.4" r="0.65">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="30%" stopColor="#ffd25a" />
          <stop offset="65%" stopColor="#ff6a10" />
          <stop offset="100%" stopColor="#7a1404" />
        </radialGradient>
        <radialGradient id="ballHalo">
          <stop offset="0%" stopColor="#ffcf6a" stopOpacity={0.9} />
          <stop offset="30%" stopColor="#ff7a1a" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#ff3a00" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="flameGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff3b0" stopOpacity={0.95} />
          <stop offset="35%" stopColor="#ffb02e" stopOpacity={0.85} />
          <stop offset="75%" stopColor="#ff4a0a" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#b01800" stopOpacity={0} />
        </linearGradient>
        <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="trailBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      {/* Quầng sáng lớn chiếu ra không gian */}
      <circle
        cx={ball.x}
        cy={ball.y}
        r={r * (7 + flash * 5) * (0.95 + 0.05 * noise2D("halo", frame / 6, 0))}
        fill="url(#ballHalo)"
        style={{ mixBlendMode: "screen" }}
        opacity={0.75 + flash * 0.25}
      />

      {/* Vệt chuyển động: vị trí của viên sắt ở các khung hình trước */}
      <g filter="url(#trailBlur)" style={{ mixBlendMode: "screen" }}>
        {new Array(TRAIL_STEPS).fill(true).map((_, i) => {
          const past = getBallState(frame - (i + 1) * 0.8, fps);
          const k = 1 - (i + 1) / (TRAIL_STEPS + 1);
          return (
            <circle
              key={i}
              cx={past.x}
              cy={past.y}
              r={BALL_RADIUS * past.scale * (0.5 + 0.5 * k)}
              fill={i < 3 ? "#ffb347" : "#ff5a14"}
              opacity={Math.min(1, speed / 6) * 0.55 * k}
            />
          );
        })}
      </g>

      {/* Lưỡi lửa */}
      <g filter="url(#softBlur)" style={{ mixBlendMode: "screen" }}>
        {new Array(FLAME_TONGUES).fill(true).map((_, i) => {
          const spread = (i - (FLAME_TONGUES - 1) / 2) / ((FLAME_TONGUES - 1) / 2);
          const n = noise2D(`flame-${i}`, frame / 5, i);
          const angle = flameAngle + spread * 0.75 + n * 0.25;
          const length =
            r * (1.9 + 1.4 * (1 - Math.abs(spread)) + n * 0.7) * flameStretch +
            flash * r * 2;
          const tipX = ball.x + Math.cos(angle) * length;
          const tipY = ball.y + Math.sin(angle) * length;
          const px = -Math.sin(angle);
          const py = Math.cos(angle);
          const w = r * (0.75 - Math.abs(spread) * 0.3);
          const bx1 = ball.x + px * w;
          const by1 = ball.y + py * w;
          const bx2 = ball.x - px * w;
          const by2 = ball.y - py * w;
          const wig = noise2D(`wiggle-${i}`, frame / 4, 0) * r * 0.6;
          const midX = (ball.x + tipX) / 2 + px * wig;
          const midY = (ball.y + tipY) / 2 + py * wig;
          return (
            <path
              key={i}
              d={`M${bx1} ${by1} Q${midX + px * w * 0.8} ${midY + py * w * 0.8} ${tipX} ${tipY} Q${midX - px * w * 0.8} ${midY - py * w * 0.8} ${bx2} ${by2} Z`}
              fill={i % 3 === 0 ? "#ffd56a" : i % 3 === 1 ? "#ff7a1a" : "#ff3d0a"}
              opacity={0.55 + 0.35 * Math.abs(n)}
            />
          );
        })}
      </g>

      {/* Viên sắt */}
      <g
        style={{
          translate: `${ball.x}px ${ball.y}px`,
          rotate: `${spin}deg`,
        }}
      >
        <circle r={r * 1.15} fill="#ff7a1a" opacity={0.6} filter="url(#softBlur)" />
        <circle r={r} fill="url(#ballCore)" />
        {/* Lớp vảy sắt sẫm màu để thấy viên sắt đang xoay */}
        <path
          d={`M${-r * 0.6} ${-r * 0.2} q${r * 0.25} ${-r * 0.25} ${r * 0.5} 0 q${-r * 0.1} ${r * 0.25} ${-r * 0.5} 0 Z`}
          fill="#8a2204"
          opacity={0.55}
        />
        <circle cx={r * 0.35} cy={r * 0.45} r={r * 0.16} fill="#9a2a06" opacity={0.5} />
        <circle cx={-r * 0.2} cy={r * 0.55} r={r * 0.1} fill="#9a2a06" opacity={0.45} />
        <circle
          cx={-r * 0.25}
          cy={-r * 0.3}
          r={r * 0.28}
          fill="#fffbe6"
          opacity={0.5 + flash * 0.5}
          filter="url(#softBlur)"
        />
      </g>
    </g>
  );
};
