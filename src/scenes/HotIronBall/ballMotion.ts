import { Easing, interpolate } from "remotion";

/**
 * Quỹ đạo của viên sắt nóng.
 *
 * Mọi hiệu ứng (lửa, tia lửa, vệt sáng, ánh sáng chiếu lên thân)
 * đều đọc vị trí từ hàm này, nên chúng luôn bám theo viên sắt.
 *
 * Thời gian tính theo giây để không phụ thuộc vào fps.
 */

/** Vị trí viên sắt khi nằm ở ngực chúng sanh khổng lồ. */
export const CHEST = { x: 872, y: 548 };
/** Điểm xa nhất phía trước ngực. */
export const FRONT = { x: 1460, y: 600 };

export const BALL_RADIUS = 40;

/** Các mốc thời gian (giây). */
export const TIMING = {
  leaveStart: 0.6, // bắt đầu rời ngực
  leaveEnd: 1.9, // tới điểm xa nhất
  returnStart: 2.5, // bắt đầu quay về
  returnEnd: 4.0, // đâm trở lại ngực
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export type BallState = {
  x: number;
  y: number;
  /** Tỉ lệ kích thước: >1 khi viên sắt tiến lại gần người xem. */
  scale: number;
  /** 0 = ở ngực, 1 = ở điểm xa nhất. */
  progress: number;
};

export const getBallState = (frame: number, fps: number): BallState => {
  const t = frame / fps;

  // Rời ngực: chậm lúc đầu (bị dính), nhanh dần, chậm lại khi tới nơi.
  const out = interpolate(t, [TIMING.leaveStart, TIMING.leaveEnd], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.55, 0, 0.2, 1),
  });
  // Quay về: tăng tốc, như bị hút trở lại ngực.
  const back = interpolate(t, [TIMING.returnStart, TIMING.returnEnd], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.6, 0, 0.9, 0.55),
  });

  const progress = out * (1 - back);

  // Lơ lửng nhẹ khi dừng ở phía trước.
  const hover = interpolate(
    t,
    [TIMING.leaveEnd - 0.2, TIMING.leaveEnd, TIMING.returnStart, TIMING.returnStart + 0.3],
    [0, 1, 1, 0],
    clamp,
  );
  const bob = Math.sin(t * 7) * 7 * hover;

  // Đường cong: bay vòng lên trên một chút rồi hạ xuống.
  const arc = -Math.sin(progress * Math.PI) * 110;

  return {
    x: CHEST.x + (FRONT.x - CHEST.x) * progress,
    y: CHEST.y + (FRONT.y - CHEST.y) * progress + arc + bob,
    scale: 1 + 0.4 * progress,
    progress,
  };
};

/** Vận tốc (px / khung hình) tại một thời điểm. */
export const getBallVelocity = (frame: number, fps: number) => {
  const a = getBallState(frame - 0.5, fps);
  const b = getBallState(frame + 0.5, fps);
  return { vx: b.x - a.x, vy: b.y - a.y };
};

/** Khung hình viên sắt đâm trở lại ngực. */
export const getImpactFrame = (fps: number) => Math.round(TIMING.returnEnd * fps);
