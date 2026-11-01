import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { HotIronBall } from "./HotIronBall";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition
        id="HotIronBall"
        component={HotIronBall}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
