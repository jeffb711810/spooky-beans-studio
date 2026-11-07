// Quick review clip: several frame ranges of the BellWitch timeline back to back (one mount per range).
import React from "react";
import { Sequence } from "remotion";
import { BellWitch } from "./Bell";

export const TEST_SEGS: [number, number][] = [[443,  700],  [1500,  1700]];
export const TEST_FRAMES = TEST_SEGS.reduce((n, [a, b]) => n + b - a, 0);

export const BellTest: React.FC = () => {
  let at = 0;
  return (
    <>
      {TEST_SEGS.map(([a, b]) => {
        const from = at; at += b - a;
        return (
          <Sequence key={a} from={from} durationInFrames={b - a} layout="none">
            <Sequence from={-a} layout="none"><BellWitch /></Sequence>
          </Sequence>
        );
      })}
    </>
  );
};
