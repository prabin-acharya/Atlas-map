import { generate } from "random-words";

export const colours = [
  { nameColor: "bg-orange-700", cursorColor: "#FE372B" },
  { nameColor: "bg-pink-700", cursorColor: "#9C007E" },
  { nameColor: "bg-green-700", cursorColor: "#008E06" },
  { nameColor: "bg-purple-700", cursorColor: "#460894" },
  { nameColor: "bg-blue-700", cursorColor: "#0284CD" },
  { nameColor: "bg-yellow-700", cursorColor: "#AC8600" },
  { nameColor: "bg-orange-500", cursorColor: "#FF723F" },
  { nameColor: "bg-pink-500", cursorColor: "#FF17D2" },
  { nameColor: "bg-green-500", cursorColor: "#00E80B" },
  { nameColor: "bg-purple-500", cursorColor: "#7A1BF2" },
  { nameColor: "bg-blue-500", cursorColor: "#2CC0FF" },
  { nameColor: "bg-yellow-500", cursorColor: "#FFC700" },
];

const createMapAndGetID = async () => {
  console.log("here--createMapId");
  try {
    const userId = localStorage.getItem("userId");
    const response = await fetch(
      "https://atlas-map-express-api.up.railway.app//newMap",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );

    const data = await response.json();

    localStorage.setItem("activeMapId", data.mapId);

    return data.mapId;
  } catch (error) {
    console.error("Error creating map:", error);
    throw error; // Re-throw the error to propagate it up if needed
  }
};

export const getSpaceNameFromUrl = async () => {
  const url = new URL(window.location.href);
  const spaceNameInParams = url.searchParams.get("space");

  if (spaceNameInParams) {
    localStorage.setItem("activeMapId", spaceNameInParams);
    return spaceNameInParams;
  } else {
    const generatedName = generate({ exactly: 3, join: "-" });
    const savedMapId = localStorage.getItem("activeMapId");

    const mapId = savedMapId ? savedMapId : await createMapAndGetID();
    // url.searchParams.set("space", generatedName);
    url.searchParams.set("space", mapId);
    window.history.replaceState({}, "", `?${url.searchParams.toString()}`);
    return generatedName;
  }
};

import { type SpaceMember } from "@ably/spaces";

export const REMOVE_USER_AFTER_MILLIS = 120_000;
export const MAX_USERS_BEFORE_LIST = 4;
export const HORIZONTAL_SPACING_OFFSET = 40;
export const OVERLAP_AMOUNT = 40;
export const AVATAR_WIDTH = 48;

export type Member = Omit<SpaceMember, "profileData"> & {
  profileData: {
    userColors: { nameColor: string; cursorColor: string };
    name: string;
  };
};

export function calculateRightOffset({
  usersCount,
  index = 0,
}: {
  usersCount: number;
  index: number;
}): number {
  return usersCount > MAX_USERS_BEFORE_LIST
    ? (index + 1) * HORIZONTAL_SPACING_OFFSET
    : index * HORIZONTAL_SPACING_OFFSET;
}

export function calculateTotalWidth({ users }: { users: Member[] }): number {
  return (
    AVATAR_WIDTH +
    OVERLAP_AMOUNT * Math.min(users.length, MAX_USERS_BEFORE_LIST + 1)
  );
}
