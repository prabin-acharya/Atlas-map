import Spaces, { type Space } from "@ably/spaces";
import { useAbly } from "ably/react";
import { createContext, useEffect, useMemo, useState } from "react";
import { getSpaceNameFromUrl } from "../utils/helpers";

const SpacesContext = createContext<Space | undefined>(undefined);

const SpaceContextProvider = ({
  example,
  children,
}: {
  example: string;
  children: React.ReactNode;
}) => {
  const [space, setSpace] = useState<Space | undefined>(undefined);
  const client = useAbly();

  const spaces = useMemo(() => new Spaces(client), [example]);

  useEffect(() => {
    let ignore = false;
    const spaceName = getSpaceNameFromUrl();

    const initSpace = async () => {
      const spaceInstance = await spaces.get(await spaceName, {
        offlineTimeout: 10_000,
      });
      if (spaceInstance && !space && !ignore) {
        setSpace(spaceInstance);
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
