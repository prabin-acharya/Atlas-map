// import { useMembers, useSpace } from "@ably/spaces/react";
import { useContext, useEffect, useMemo } from "react";
import { getMemberColor } from "../utils/mockColors";
import { getMemberName } from "../utils/mockNames";
import Avatars from "./Avatars";

import useMembers from "../hooks/useMembers";
import type { Member } from "../utils/helpers";
import { SpacesContext } from "./SpacesContext";

const AvatarStack = () => {
  const name = useMemo(getMemberName, []);
  const memberColor = useMemo(getMemberColor, []);

  /** 💡 Get a handle on a space instance 💡 */
  //   const { space } = useSpace();
  const space = useContext(SpacesContext);

  /** 💡 Enter the space as soon as it's available 💡 */
  useEffect(() => {
    space?.enter({ name, memberColor });
  }, [space]);

  /** 💡 Get everybody except the local member in the space and the local member 💡 */
  const { self, otherMembers } = useMembers();
  const others = otherMembers;

  console.log(others, "++++++++++++++++++++++++++++++");

  return (
    <div className="avatar-stack-container example-container" id="avatar-stack">
      {/** 💡 Stack of first 5 user avatars including yourself.💡 */}
      <Avatars self={self as Member | null} otherUsers={others as Member[]} />
    </div>
  );
};

export default AvatarStack;
