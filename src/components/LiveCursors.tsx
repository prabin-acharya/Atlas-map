import { useContext, useEffect, useMemo, useRef } from "react";
import useSpaceMembers from "../hooks/useMembers";
import { colours } from "../utils/helpers";
import { mockNames } from "../utils/mockNames";
import { MemberCursors, YourCursor } from "./Cursors";
import { SpacesContext } from "./SpacesContext";

import type { SpaceMember } from "@ably/spaces";
import type { Member } from "../utils/types";

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

  return (
    <div
      // id="live-cursors"
      // ref={liveCursors}
      // className="live-cursors-container example-container border-2 border-red-600 p-3 py-3"
      // className="border-2 border-red-600 h-screen"
      className="flex flex-col border-2 border-red-600 h-screen"
    >
      <div className="w-full h-14 bg-slate-600"></div>
      <div
        id="live-cursors"
        ref={liveCursors}
        // className=" flex justify-center items-center relative w-full h-full border-2 border-green-600 "
        className="flex-grow flex justify-center items-center relative w-full border-2 border-green-600 "
      >
        <YourCursor
          self={self as Member | null}
          space={space}
          parentRef={liveCursors}
        />
        <MemberCursors
          otherUsers={
            otherMembers.filter((m: SpaceMember) => m.isConnected) as Member[]
          }
          space={space}
          selfConnectionId={self?.connectionId}
        />
      </div>
    </div>
  );
};

export default LiveCursors;
