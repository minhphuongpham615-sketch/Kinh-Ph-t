import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Chest position (in composition pixels) where the iron ball enters.
const CHEST_X = 470;
const CHEST_Y = 360;
// Where the ball starts / returns to, off to the right.
const START_X = 1100;
const START_Y = 300;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * Progress 0 → 1 → 0 of the ball going into the chest and back out.
 * One cycle lasts 2.5s, so a 5s video shows two full in/out movements.
 */
const useInOutProgress = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cycle = 2.5 * fps;
  const t = frame % cycle;
  return interpolate(
    t,
    [0, 0.4 * cycle, 0.6 * cycle, cycle],
    [0, 1, 1, 0],
    { ...clamp, easing: Easing.inOut(Easing.cubic) },
  );
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const flicker = 0.85 + 0.15 * Math.sin(frame / 3);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 110%, rgba(140,30,0,${
          0.55 * flicker
        }) 0%, #1a0505 45%, #050101 100%)`,
      }}
    />
  );
};

const Figure: React.FC = () => {
  const progress = useInOutProgress();
  const frame = useCurrentFrame();
  // Chest glows while the ball is inside.
  const glow = interpolate(progress, [0.6, 1], [0, 1], clamp);
  // Body flinches slightly when the ball enters.
  const flinch = interpolate(progress, [0.8, 1], [0, -8], clamp);
  const breathe = Math.sin(frame / 10) * 2;

  return (
    <svg
      width={1280}
      height={720}
      viewBox="0 0 1280 720"
      style={{ position: "absolute", inset: 0 }}
    >
      <defs>
        <radialGradient id="chestGlow">
          <stop offset="0%" stopColor="#fff3b0" stopOpacity={glow} />
          <stop offset="35%" stopColor="#ff7a00" stopOpacity={0.9 * glow} />
          <stop offset="100%" stopColor="#ff2200" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="skin" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3a2a28" />
          <stop offset="100%" stopColor="#1c1414" />
        </linearGradient>
      </defs>
      <g transform={`translate(${flinch}, ${breathe})`}>
        {/* Head */}
        <circle cx={CHEST_X} cy={170} r={62} fill="url(#skin)" />
        {/* Neck */}
        <rect x={CHEST_X - 22} y={222} width={44} height={40} fill="#2a1e1d" />
        {/* Torso */}
        <path
          d={`M ${CHEST_X - 140} 280
              Q ${CHEST_X} 240 ${CHEST_X + 140} 280
              L ${CHEST_X + 115} 560
              Q ${CHEST_X} 590 ${CHEST_X - 115} 560 Z`}
          fill="url(#skin)"
          stroke="#5a3a30"
          strokeWidth={3}
        />
        {/* Arms */}
        <path
          d={`M ${CHEST_X - 140} 285 Q ${CHEST_X - 200} 420 ${CHEST_X - 175} 560`}
          stroke="#2a1e1d"
          strokeWidth={46}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M ${CHEST_X + 140} 285 Q ${CHEST_X + 200} 420 ${CHEST_X + 175} 560`}
          stroke="#2a1e1d"
          strokeWidth={46}
          strokeLinecap="round"
          fill="none"
        />
        {/* Glow inside the chest */}
        <circle cx={CHEST_X} cy={CHEST_Y} r={150} fill="url(#chestGlow)" />
      </g>
    </svg>
  );
};

const IronBall: React.FC = () => {
  const progress = useInOutProgress();
  const frame = useCurrentFrame();

  const x = interpolate(progress, [0, 1], [START_X, CHEST_X]);
  // Slight arc on the path.
  const y =
    interpolate(progress, [0, 1], [START_Y, CHEST_Y]) -
    Math.sin(progress * Math.PI) * 60;
  // The ball sinks into the chest: it shrinks and fades in the last part.
  const scale = interpolate(progress, [0, 0.75, 1], [1, 0.9, 0.35], clamp);
  const opacity = interpolate(progress, [0.8, 1], [1, 0], clamp);
  const pulse = 1 + 0.06 * Math.sin(frame / 2);
  const size = 110;

  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        opacity,
        scale: String(scale * pulse),
        background:
          "radial-gradient(circle at 35% 35%, #fffbe0 0%, #ffd23f 18%, #ff7b00 45%, #c42000 75%, #4a0800 100%)",
        boxShadow:
          "0 0 40px 15px rgba(255,120,0,0.85), 0 0 120px 50px rgba(255,60,0,0.45)",
      }}
    />
  );
};

/** Deterministic sparks trailing behind the ball. */
const Sparks: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = useInOutProgress();
  const ballX = interpolate(progress, [0, 1], [START_X, CHEST_X]);
  const ballY =
    interpolate(progress, [0, 1], [START_Y, CHEST_Y]) -
    Math.sin(progress * Math.PI) * 60;
  const visible = interpolate(progress, [0.85, 1], [1, 0], clamp);

  return (
    <>
      {new Array(18).fill(0).map((_, i) => {
        const life = (frame + i * 7) % 20;
        const angle = (i * 137.5 * Math.PI) / 180;
        const dist = life * 4;
        const o = interpolate(life, [0, 20], [1, 0]) * visible;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: ballX + Math.cos(angle) * dist,
              top: ballY + Math.sin(angle) * dist + life * 1.5,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#ffcf4a",
              boxShadow: "0 0 8px 3px rgba(255,140,0,0.9)",
              opacity: o,
            }}
          />
        );
      })}
    </>
  );
};

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        right: 70,
        bottom: 60,
        width: 520,
        textAlign: "right",
        color: "#ffd9a0",
        fontFamily: "Georgia, serif",
        fontSize: 40,
        lineHeight: 1.3,
        textShadow: "0 0 18px rgba(255,90,0,0.8)",
        opacity: interpolate(frame, [0, 0.8 * fps], [0, 1], clamp),
        translate: `0px ${interpolate(frame, [0, 0.8 * fps], [30, 0], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        })}px`,
      }}
    >
      Viên sắt nóng
      <div style={{ fontSize: 24, opacity: 0.75 }}>Video thử nghiệm · 5 giây</div>
    </div>
  );
};

export const HotIronBall: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <Figure />
      <Sparks />
      <IronBall />
      <Title />
    </AbsoluteFill>
  );
};
