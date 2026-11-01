import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "./Background";
import { getImpactFrame } from "./ballMotion";
import { Giant } from "./Giant";
import { IronBall } from "./IronBall";
import { Sparks } from "./Sparks";

/** Cảnh thử nghiệm: chúng sanh khổng lồ với viên sắt nóng ở ngực. */
export const HotIronBallScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CameraShake>
        <svg viewBox="0 0 1920 1080" width="100%" height="100%">
          <Background />
          <Giant />
          <IronBall />
          <Sparks />
        </svg>
      </CameraShake>
      <Vignette />
      <ImpactFlash />
      <FadeInOut />
    </AbsoluteFill>
  );
};

const CameraShake: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const impact = getImpactFrame(fps);
  const strength = interpolate(frame, [impact, impact + 2, impact + 16], [0, 14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        translate: `${Math.sin(frame * 2.7) * strength}px ${Math.cos(frame * 3.3) * strength}px`,
        scale: 1.02,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at 55% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)",
    }}
  />
);

const ImpactFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const impact = getImpactFrame(fps);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ff8a2a",
        mixBlendMode: "screen",
        opacity: interpolate(frame, [impact - 1, impact + 1, impact + 8], [0, 0.28, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    />
  );
};

const FadeInOut: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        opacity: interpolate(
          frame,
          [0, 0.4 * fps, durationInFrames - 0.4 * fps, durationInFrames - 1],
          [1, 0, 0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        ),
      }}
    />
  );
};
