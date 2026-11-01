import React from "react";
import { interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BALL_RADIUS,
  getBallState,
  getBallVelocity,
  getImpactFrame,
} from "./ballMotion";

const GRAVITY = 0.45; // px / khung hình²
const TRAIL_SPARKS_PER_FRAME = 3;
const IMPACT_SPARKS = 70;

type Spark = {
  id: string;
  birth: number;
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  life: number;
  width: number;
};

/**
 * Tia lửa được tính hoàn toàn từ số khung hình (không lưu trạng thái),
 * nên khi render hay tua trong Studio đều cho kết quả giống nhau.
 */
const buildSparks = (fps: number, durationInFrames: number): Spark[] => {
  const sparks: Spark[] = [];

  // 1) Tia lửa bắn ra liên tục từ viên sắt, nhiều hơn khi bay nhanh.
  for (let f = 0; f < durationInFrames; f++) {
    const ball = getBallState(f, fps);
    const { vx, vy } = getBallVelocity(f, fps);
    const speed = Math.hypot(vx, vy);
    const count = Math.round(TRAIL_SPARKS_PER_FRAME * (0.5 + Math.min(speed, 25) / 12));
    for (let j = 0; j < count; j++) {
      const id = `t-${f}-${j}`;
      const a = random(`${id}-a`) * Math.PI * 2;
      const power = 2 + random(`${id}-p`) * 7;
      const r = BALL_RADIUS * ball.scale * 0.8;
      sparks.push({
        id,
        birth: f + random(`${id}-b`),
        x0: ball.x + Math.cos(a) * r,
        y0: ball.y + Math.sin(a) * r,
        // Văng ra mọi hướng, bị kéo về phía sau đường bay, hơi bốc lên.
        vx: Math.cos(a) * power - vx * 0.35,
        vy: Math.sin(a) * power - vy * 0.35 - 3,
        life: 10 + random(`${id}-l`) * 22,
        width: 1.5 + random(`${id}-w`) * 2.5,
      });
    }
  }

  // 2) Bùng nổ khi viên sắt đâm trở lại ngực.
  const impact = getImpactFrame(fps);
  const hit = getBallState(impact, fps);
  for (let j = 0; j < IMPACT_SPARKS; j++) {
    const id = `i-${j}`;
    // Chủ yếu bắn về phía trước (bên phải) và lên trên.
    const a = -Math.PI / 2 + (random(`${id}-a`) - 0.15) * Math.PI * 1.3;
    const power = 6 + random(`${id}-p`) * 16;
    sparks.push({
      id,
      birth: impact + random(`${id}-b`) * 3,
      x0: hit.x,
      y0: hit.y,
      vx: Math.cos(a) * power,
      vy: Math.sin(a) * power,
      life: 18 + random(`${id}-l`) * 26,
      width: 2 + random(`${id}-w`) * 3,
    });
  }

  return sparks;
};

export const Sparks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sparks = React.useMemo(
    () => buildSparks(fps, durationInFrames),
    [fps, durationInFrames],
  );

  return (
    <g style={{ mixBlendMode: "screen" }}>
      {sparks.map((s) => {
        const age = frame - s.birth;
        if (age < 0 || age > s.life) {
          return null;
        }
        const t = age / s.life;
        const x = s.x0 + s.vx * age;
        const y = s.y0 + s.vy * age + 0.5 * GRAVITY * age * age;
        const curVy = s.vy + GRAVITY * age;
        // Vệt sáng kéo dài theo hướng bay.
        const tailX = x - s.vx * 1.8;
        const tailY = y - curVy * 1.8;
        const color = t < 0.25 ? "#fff6d0" : t < 0.6 ? "#ffb12e" : "#ff4a10";
        const opacity = interpolate(t, [0, 0.1, 0.7, 1], [0, 1, 0.8, 0]);
        return (
          <line
            key={s.id}
            x1={tailX}
            y1={tailY}
            x2={x}
            y2={y}
            stroke={color}
            strokeWidth={s.width * (1 - t * 0.6)}
            strokeLinecap="round"
            opacity={opacity}
          />
        );
      })}
    </g>
  );
};
