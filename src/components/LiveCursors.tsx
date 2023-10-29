import { useContext, useEffect, useMemo, useRef, useState } from "react";
import useSpaceMembers from "../hooks/useMembers";
import { DrawingMode } from "../types";
import { colours } from "../utils/helpers";
import { mockNames } from "../utils/mockNames";
import { SpacesContext } from "./SpacesContext";

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
    space?.enter({ name, userColors });
  }, [space]);

  const { self, otherMembers } = useSpaceMembers(space);

  const liveCursors = useRef(null);

  const [currentDrawingMode, setCurrentDrawingMode] =
    useState<DrawingMode | null>(null);

  console.log("LiveCursors+++--------------------------------------");

  return (
    <div className="flex flex-col border-2 border-red-600 h-screen">
      <div className="w-full h-14 bg-slate-600  flex items-center">
        <h2 className="text-white text-2xl font-extrabold p-4">Atlas</h2>
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
        {/* <YourCursor
          self={self as Member | null}
          space={space}
          parentRef={liveCursors}
        /> */}
        {/* <MemberCursors
          otherUsers={
            otherMembers.filter((m: SpaceMember) => m.isConnected) as Member[]
          }
          space={space}
          selfConnectionId={self?.connectionId}
        /> */}
      </div>
    </div>
  );
};

export default LiveCursors;
