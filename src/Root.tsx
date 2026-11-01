import { Composition } from "remotion";
import { HotIronBallScene } from "./scenes/HotIronBall/HotIronBallScene";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Video thử nghiệm: 5 giây, 16:9, 1920×1080, 30fps */}
      <Composition
        id="VienSatNong"
        component={HotIronBallScene}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
