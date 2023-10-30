import { useEffect, useState } from "react";

import type { Space, CursorUpdate as _CursorUpdate } from "@ably/spaces";
import { Marker } from "@react-google-maps/api";
import { Member } from "../utils/types";

// 💡 This component is used to render the cursor of the user
const YourCursor = ({
  self,
  space,
  cursorPosition,
}: {
  self: Member | null;
  space?: Space;
  cursorPosition: {
    lat: number;
    lng: number;
    state: string;
  };
}) => {
  if (!self) {
    return null;
  }
  if (cursorPosition.state === "leave") return null;
  const { cursorColor, nameColor } = self.profileData.userColors;

  const markerIcon = {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: "#0000FF",
    fillOpacity: 0.8,
    strokeWeight: 0.6,
  };

  return (
    <>
      <Marker
        icon={markerIcon}
        clickable={false}
        position={{
          lat: cursorPosition.lat,
          lng: cursorPosition.lng,
        }}
      />
      {/* <div
        className="absolute border-2 border-yellow-600"
        onMouseMove={(e) => handleSelfCursorMove(e)}
        style={{
          top: `${cursorPosition.top}px`,
          left: `${cursorPosition.left}px`,
        }}
      >
        <CursorSvg cursorColor={cursorColor} />
        <div
          className={`px-4 py-2 m-2 ${nameColor} rounded-full text-sm text-white whitespace-nowrap`}
        >
          You
        </div>
      </div> */}
    </>
  );
};

type CursorUpdate = Omit<_CursorUpdate, "data"> & {
  data: { state: "move" | "leave" };
};

// 💡 This component is used to render the cursors of other users in the space
const MemberCursors = ({
  otherUsers,
  space,
  selfConnectionId,
}: {
  otherUsers: Member[];
  space?: Space;
  selfConnectionId?: string;
}) => {
  const [positions, setPositions] = useState<{
    [connectionId: string]: {
      position: { x: number; y: number };
      state: string | undefined;
    };
  }>({});

  useEffect(() => {
    if (!space) return;

    space.cursors.subscribe("update", (event) => {
      let e = event as CursorUpdate;
      // 💡 Ignore our own cursor
      if (e.connectionId === selfConnectionId) return;

      setPositions((positions) => ({
        ...positions,
        [e.connectionId]: { position: e.position, state: e.data.state },
      }));
    });
    return () => {
      space.cursors.unsubscribe();
    };
  }, [space]);

  const markerIcon = {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: "#F00",
    fillOpacity: 0.8,
    strokeWeight: 0.6,
  };

  return (
    <>
      {otherUsers.map(({ connectionId, profileData }) => {
        if (!positions[connectionId]) return;
        if (positions[connectionId].state === "leave") return;
        const { cursorColor, nameColor } = profileData.userColors;
        return (
          <Marker
            key={connectionId}
            icon={markerIcon}
            clickable={false}
            position={{
              lat: positions[connectionId].position.x,
              lng: positions[connectionId].position.y,
            }}
          />
        );
      })}
    </>
  );
};

export { MemberCursors, YourCursor };
