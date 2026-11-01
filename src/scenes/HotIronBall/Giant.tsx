import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CHEST, getBallState, getImpactFrame } from "./ballMotion";

/**
 * Chúng sanh khổng lồ nhìn nghiêng sang phải, dựng bằng các lớp hình vector.
 * Đây là hình minh họa tạm để kiểm tra chuyển động; sau này có thể thay
 * bằng tranh vẽ thật mà vẫn giữ nguyên các hiệu ứng.
 */

const HEAD =
  "M612 305 C575 225 598 112 690 90 C782 72 836 138 834 192 L852 228 L826 240 C834 272 818 302 792 318 C760 338 702 342 660 332 Z";

const TORSO =
  "M600 320 L770 322 C840 352 884 400 893 468 C904 540 898 604 872 684 C852 760 868 880 882 1080 L395 1080 C410 900 428 700 466 560 C482 450 520 372 600 320 Z";

const BACK_ARM = "M520 440 C470 560 452 690 480 780 C500 850 530 890 560 920";
const NEAR_ARM = "M650 440 C690 560 700 650 712 724 C770 770 840 790 905 792";

const CRACKS = [
  "M872 548 L820 500 L790 470",
  "M872 548 L815 560 L770 590 L735 585",
  "M872 548 L835 610 L828 660",
  "M872 548 L840 480 L842 430",
  "M820 500 L800 520",
  "M770 590 L760 620",
];

const RIBS = [
  "M700 470 C760 480 820 500 860 520",
  "M690 520 C750 535 810 560 850 585",
  "M690 570 C740 590 790 615 830 645",
];

/** Các hình tạo nên thân (dùng cho cả hiển thị và mặt nạ chiếu sáng). */
const BodyShapes: React.FC<{ fill: string; armFill?: string }> = ({
  fill,
  armFill,
}) => (
  <>
    <path
      d={BACK_ARM}
      stroke={armFill ?? fill}
      strokeWidth={96}
      strokeLinecap="round"
      fill="none"
    />
    <path d={TORSO} fill={fill} />
    <path d={HEAD} fill={fill} />
    <path
      d={NEAR_ARM}
      stroke={fill}
      strokeWidth={104}
      strokeLinecap="round"
      fill="none"
    />
    <ellipse cx={918} cy={790} rx={52} ry={40} fill={fill} />
  </>
);

export const Giant: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ball = getBallState(frame, fps);
  const impact = getImpactFrame(fps);

  // Thở nặng nhọc.
  const breathe = Math.sin(frame / 14) * 0.008;

  // Giật lùi khi viên sắt đâm trở lại ngực.
  const recoil = interpolate(
    frame,
    [impact - 1, impact + 3, impact + 18],
    [0, -26, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Vết bỏng ở ngực: rực nhất khi viên sắt nằm ở ngực, lóe mạnh lúc va chạm.
  const impactFlash = interpolate(
    frame,
    [impact - 1, impact + 2, impact + 25],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const woundGlow = Math.min(
    1,
    0.35 + 0.55 * (1 - ball.progress) + impactFlash * 0.6,
  );

  // Mắt nhấp nháy theo cơn đau.
  const eyeGlow = 0.6 + 0.4 * Math.abs(Math.sin(frame / 9));

  return (
    <g
      style={{
        translate: `${recoil}px 0px`,
        scale: `${1 + breathe} ${1 + breathe * 1.4}`,
        transformOrigin: "640px 1080px",
      }}
    >
      <defs>
        <linearGradient id="giantSkin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#140706" />
          <stop offset="60%" stopColor="#2e1410" />
          <stop offset="100%" stopColor="#3d1a12" />
        </linearGradient>
        <mask id="giantMask">
          <BodyShapes fill="white" />
        </mask>
        <radialGradient
          id="ballLightOnBody"
          gradientUnits="userSpaceOnUse"
          cx={ball.x}
          cy={ball.y}
          r={560 * ball.scale}
        >
          <stop offset="0%" stopColor="#ffb347" stopOpacity={0.95} />
          <stop offset="25%" stopColor="#ff6a1a" stopOpacity={0.55} />
          <stop offset="60%" stopColor="#a8200a" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="woundGradient">
          <stop offset="0%" stopColor="#fff2b0" />
          <stop offset="35%" stopColor="#ff8a1e" />
          <stop offset="100%" stopColor="#ff2a00" stopOpacity={0} />
        </radialGradient>
        <filter id="crackGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Thân */}
      <BodyShapes fill="url(#giantSkin)" armFill="#120605" />

      {/* Chi tiết: xương sườn */}
      <g stroke="#0c0403" strokeWidth={6} fill="none" opacity={0.7}>
        {RIBS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {/* Ánh sáng từ viên sắt chiếu lên thân — di chuyển theo viên sắt */}
      <rect
        width={1920}
        height={1080}
        fill="url(#ballLightOnBody)"
        mask="url(#giantMask)"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Vết bỏng và các vết nứt rực đỏ ở ngực */}
      <circle
        cx={CHEST.x}
        cy={CHEST.y}
        r={70 + impactFlash * 40}
        fill="url(#woundGradient)"
        opacity={woundGlow}
        mask="url(#giantMask)"
      />
      <g
        stroke="#ffb347"
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
        filter="url(#crackGlow)"
        opacity={woundGlow}
      >
        {CRACKS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {/* Mắt và miệng */}
      <ellipse cx={792} cy={186} rx={16} ry={9} fill="#ff6a1a" opacity={eyeGlow} />
      <ellipse cx={792} cy={186} rx={6} ry={4} fill="#fff1c0" opacity={eyeGlow} />
      <path
        d="M800 262 C815 268 826 282 818 298 C806 300 792 290 790 276 Z"
        fill="#070201"
      />
    </g>
  );
};
