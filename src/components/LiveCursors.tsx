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

  console.log(
    space,
    "________+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
  );

  const [linkCopied, setLinkCopied] = useState(false);
  const handleButtonClick = async () => {
    try {
      await navigator.clipboard.writeText("hello clipboard");
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000); // Message will disappear after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="w-full h-14 bg-slate-500 flex items-center justify-between">
        <h2 className="text-white text-3xl font-extrabold p-6 pl-10 relative">
          Atlas
          <span className="text-xxs p-1 ml-2 rounded-md bg-yellow-600 text-black">
            ALPHA
          </span>
        </h2>
        <div className="flex space-x-2 mr-4 items-center">
          <div className="pr-24" id="avatar-stack">
            <Avatars
              self={self as Member | null}
              otherUsers={otherMembers as Member[]}
            />
          </div>

          {linkCopied && <div className="text-sm text-white">Link Copied!</div>}
        </div>
      </div>
      <div
        id="live-cursors"
        ref={liveCursors}
        className="flex-grow flex justify-center items-center relative w-full "
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
