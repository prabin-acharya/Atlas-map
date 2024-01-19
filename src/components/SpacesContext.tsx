import Spaces, { type Space } from "@ably/spaces";
import { useAbly } from "ably/react";
import { generate } from "random-words";
import { createContext, useEffect, useMemo, useState } from "react";
import { getSpaceNameFromUrl } from "../utils/helpers";

const SpacesContext = createContext<Space | undefined>(undefined);

const SpaceContextProvider = ({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) => {
  const [space, setSpace] = useState<Space | undefined>(undefined);
  const client = useAbly();

  const spaces = useMemo(() => new Spaces(client), [userId]);

  const addUserAsCollaboratorToMap = async (mapId: string) => {
    const userId = localStorage.getItem("userId");
    try {
      const response = await fetch(
        `https://atlas-map-express-api.up.railway.app/addCollaborators`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mapId,
            userId,
          }),
        }
      );

      if (response.ok) {
        console.log("Successfully added!");
      } else {
        console.log(response);
        console.error("Error:", response.status);
      }
    } catch (error) {
      console.error("Request failed:");
    }
  };

  const createMapAndGetID = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await fetch(
        "https://atlas-map-express-api.up.railway.app/newMap",
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

  useEffect(() => {
    let ignore = false;
    const mapId = getSpaceNameFromUrl();

    const initSpace = async () => {
      const url = new URL(window.location.href);

      if (!mapId) {
        const savedMapId = localStorage.getItem("activeMapId");

        const mapId = savedMapId ? savedMapId : await createMapAndGetID();
        url.searchParams.set("space", mapId);
        window.history.replaceState({}, "", `?${url.searchParams.toString()}`);

        const spaceInstance = await spaces.get(await mapId, {
          offlineTimeout: 10_000,
        });
        if (spaceInstance && !space && !ignore) {
          setSpace(spaceInstance);
        }
      } else {
        addUserAsCollaboratorToMap(mapId);

        const spaceInstance = await spaces.get(mapId, {
          offlineTimeout: 10_000,
        });
        if (spaceInstance && !space && !ignore) {
          setSpace(spaceInstance);
        }
      }
    };

    initSpace();

    return () => {
      ignore = true;
    };
  }, [spaces]);

  return (
    <SpacesContext.Provider value={space}>{children}</SpacesContext.Provider>
  );
};

export { SpaceContextProvider, SpacesContext };
