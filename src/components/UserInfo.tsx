import classNames from "classnames";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FunctionComponent, useContext, useState } from "react";
import { IoCheckmarkSharp } from "react-icons/io5";
import { MdOutlineModeEdit } from "react-icons/md";

import { type Member } from "../utils/helpers";
import { SpacesContext } from "./SpacesContext";

dayjs.extend(relativeTime);

const UserInfo: FunctionComponent<{ user: Member; isSelf?: boolean }> = ({
  user,
  isSelf,
}) => {
  const containerCSS = classNames(
    {
      "bg-gray-200": !user.isConnected,
      [user.profileData.userColors.nameColor]: user.isConnected,
    },
    "h-8 w-8 rounded-full flex shrink-0 items-center justify-center relative border-2 border-gray-300"
  );

  const initialsCSS = classNames(
    {
      "text-white": user.isConnected,
      "text-gray-400": !user.isConnected,
    },
    "text-xs"
  );

  const statusIndicatorCSS = classNames(
    {
      "bg-slate-500": !user.isConnected,
      "bg-green-500": user.isConnected,
    },
    "w-[5px] h-[5px] rounded-full mr-2"
  );

  const initials = user.profileData.name
    .split(" ")
    .map((word: string) => word.charAt(0))
    .join("");

  const statusIndicatorText = user.isConnected
    ? "Online"
    : "Last seen " + dayjs().to(user.lastEvent.timestamp);

  const name = isSelf
    ? `${user.profileData.name} (You)`
    : user.profileData.name;

  const space = useContext(SpacesContext);

  const handleClick = async () => {
    await space?.updateProfileData((currentProfile) => {
      console.log(currentProfile);
      return { ...currentProfile, name: inputName };
    });
    setIsEditingName(false);
  };

  const [isEditingName, setIsEditingName] = useState(false);
  const [inputName, setInputName] = useState(user.profileData.name);

  return (
    <div className="flex justify-start items-center p-3">
      <div className={containerCSS} id="avatar">
        <p className={initialsCSS}>{initials}</p>
      </div>

      {/* 💡 Display the name of the user from the `profileData` object 💡 */}
      <div id="user-list" className="pl-3 w-full">
        <div className="flex items-center justify-between">
          {isEditingName ? (
            <>
              <input
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                autoFocus
                className="bg-black text-white text-sm outline-none w-32 font-semibold  rounded-md p-1 "
              />
              <IoCheckmarkSharp
                className="cursor-pointer"
                onClick={handleClick}
              />
            </>
          ) : (
            <>
              <p className="font-semibold text-sm w-fit">{name}</p>
              {isSelf && (
                <MdOutlineModeEdit
                  className=" cursor-pointer"
                  onClick={() => setIsEditingName(true)}
                />
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-start">
          <div className={statusIndicatorCSS} />
          <p className="font-medium text-xs">{statusIndicatorText}</p>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
