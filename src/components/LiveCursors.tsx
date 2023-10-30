import { useContext, useEffect, useMemo, useRef, useState } from "react";
import useSpaceMembers from "../hooks/useMembers";
import { DrawingMode } from "../types";
import { Member, colours } from "../utils/helpers";
import { mockNames } from "../utils/mockNames";
import { SpacesContext } from "./SpacesContext";

import Avatars from "./Avatars";
import Map from "./Map";

const mockName = () => mockNames[Math.floor(Math.random() * mockNames.length)];

const LiveCursors = () => {
  const name = useMemo(mockName, []);
  const userColors = useMemo(
    () => colours[Math.floor(Math.random() * colours.length)],
    []
  );

  const space = useContext(SpacesContext);

  useEffect(() => {
    console.log(userColors, "_________*****************************8");
    const memeberColor = userColors["nameColor"];
    space?.enter({ name, userColors });
  }, [space]);

  const { self, otherMembers } = useSpaceMembers(space);

  const liveCursors = useRef(null);

  const [currentDrawingMode, setCurrentDrawingMode] =
    useState<DrawingMode | null>(null);

  return (
    <div className="flex flex-col border-2 border-red-600 h-screen">
      <div className="w-full h-14 bg-slate-600 flex items-center">
        <h2 className="text-white text-3xl font-extrabold p-6 relative">
          Atlas
          <span className="text-xxs p-1 ml-2 rounded-md bg-yellow-600 text-black">
            ALPHA
          </span>
        </h2>
        <div
          className="avatar-stack-container example-container"
          id="avatar-stack"
        >
          <Avatars
            self={self as Member | null}
            otherUsers={otherMembers as Member[]}
          />
        </div>
      </div>
      <div
        id="live-cursors"
        ref={liveCursors}
        className="flex-grow flex justify-center items-center relative w-full border-4 border-green-600 "
      >
        <Map
          currentDrawingMode={currentDrawingMode}
          setCurrentDrawingMode={setCurrentDrawingMode}
          space={space}
          selfConnectionId={self?.connectionId}
        />
      </div>
    </div>
  );
};

export default LiveCursors;
