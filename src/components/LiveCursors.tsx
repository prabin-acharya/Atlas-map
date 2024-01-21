import {
  ChangeEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IoIosArrowDown, IoMdClose } from "react-icons/io";
import useSpaceMembers from "../hooks/useMembers";
import { DrawingMode } from "../types";
import { Member, colours } from "../utils/helpers";
import { mockNames } from "../utils/mockNames";
import { SpacesContext } from "./SpacesContext";

import { useAbly } from "ably/react";
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

  const userId = localStorage.getItem("userId");
  const mapId = localStorage.getItem("activeMapId");

  const [userName, setUserName] = useState("");

  useEffect(() => {
    space?.enter({ name, userColors });

    if (space) {
      setUserName(name as string);
    }

    userId && mapId && fetchAllMaps();
  }, [space]);

  const { self, otherMembers } = useSpaceMembers(space);
  const liveCursors = useRef(null);

  const client = useAbly();
  const mapChannel = client.channels.get("map-updates");

  const [currentDrawingMode, setCurrentDrawingMode] =
    useState<DrawingMode | null>(null);

  const [allMaps, setAllMaps] = useState<
    {
      _id: string;
      userID: string;
      title: string;
      createdOn: Date;
    }[]
  >([]);

  const [mapTitle, setMapTitle] = useState("");

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showAllMaps, setShowAllMaps] = useState(false);

  const copyLinkToClipboard = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setShowShareMenu(true);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      try {
        const map = allMaps.find((map: any) => map._id.toString() === mapId);

        if (mapTitle && mapTitle != map?.title) {
          console.log("update map title", mapTitle);
          const response = await fetch(
            `https://atlas-map-express-api.up.railway.app/updateMapTitle`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                mapId: mapId,
                updatedTitle: mapTitle,
              }),
            }
          );

          if (response.ok) {
            console.log("Value saved successfully!");
          } else {
            console.error("Error saving value:", response.status);
            console.log(response);
          }
        }
      } catch (error) {
        console.error("Request failed:", error);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [mapTitle]);

  const fetchAllMaps = async () => {
    try {
      const response = await fetch(
        `https://atlas-map-express-api.up.railway.app/mapsByCollaborator/${userId}`
      );

      const data = await response.json();

      const allMaps = data.maps;

      if (allMaps.length > 0) {
        const sortedAllMaps = allMaps.sort(
          (a: any, b: any) =>
            new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
        );

        setAllMaps(sortedAllMaps);

        const currentMap = sortedAllMaps.find(
          (map: any) => map._id.toString() === mapId
        );

        setMapTitle(currentMap.title);
      }

      if (!response.ok) {
        console.error("Error:", response.status);
      }
    } catch (error) {
      console.error("Request failed:");
    }
  };

  const handleMapTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setMapTitle(newValue);
  };

  const updateUserName = async (event: ChangeEvent<HTMLInputElement>) => {
    setUserName(event.target.value);
    await space?.updateProfileData((currentProfile) => {
      console.log(currentProfile);
      return { ...currentProfile, name: event.target.value };
    });
  };

  useEffect(() => {
    const updateMapTitleSubscription = mapChannel.subscribe(
      "update-mapTitle",
      (message: { data: { title: string }; clientId: string }) => {
        if (message.clientId == space?.client.auth.clientId) return;

        const { title } = message.data;
        setMapTitle(title);
      }
    );

    return () => {
      updateMapTitleSubscription?.unsubscribe?.();
    };
  }, [mapChannel, space]);

  return (
    <div className="flex flex-col h-screen">
      <div className="w-full h-14 bg-slate-500 flex items-center justify-between">
        <h2 className="text-white text-3xl font-extrabold p-6 pl-10 relative">
          Atlas
          <span className="text-xxs p-1 ml-2 rounded-md bg-yellow-600 text-black">
            ALPHA
          </span>
        </h2>
        <div className="flex items-center h-full">
          <input
            value={mapTitle}
            onChange={handleMapTitleChange}
            onBlur={() => setMapTitle(mapTitle.trim() ? mapTitle : "Untitled")}
            className={`bg-slate-500 outline-none  text-white font-medium p-0 m-0 text-center `}
            style={{ width: `${mapTitle?.length * 10 + 18}px` }}
          />

          <div
            onMouseLeave={() => setShowContextMenu(false)}
            className="h-full flex items-center"
          >
            <IoIosArrowDown
              className={`text-white cursor-pointer ${
                showContextMenu ? "rotate-180" : ""
              } transition-all duration-300`}
              onClick={() => setShowContextMenu(!showContextMenu)}
            />

            {/* New Map, All Maps Menu */}
            {showContextMenu && (
              <div className="absolute bg-black text-white text-sm  top-12 z-50 rounded-md py-3">
                <span
                  onClick={() => {
                    const maps = localStorage.getItem("maps") || "";
                    const activeMapId = localStorage.getItem("activeMapId");

                    const updatedMaps = maps + (maps ? "," : "") + activeMapId;

                    if (activeMapId) {
                      localStorage.setItem("maps", updatedMaps);
                    }

                    localStorage.removeItem("activeMapId");
                    window.location.href = "/";
                  }}
                  className="flex border-b border-gray-700 px-5 py-2  hover:bg-gray-900 cursor-pointer"
                >
                  <p>New Map</p>
                </span>
                <span
                  onClick={() => setShowAllMaps(true)}
                  className="flex  border-gray-700 px-5 py-2 hover:bg-gray-900 cursor-pointer"
                >
                  <p>All Maps</p>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2 mr-4 items-center pr-8">
          <div className="" id="avatar-stack">
            <Avatars
              self={self as Member | null}
              otherUsers={otherMembers as Member[]}
            />
          </div>

          <button
            onClick={copyLinkToClipboard}
            className="text-sm bg-[#3E5645] px-3 py-2 rounded-md text-white"
          >
            Share
          </button>
        </div>

        {/* Saved Maps Menu */}
        {showAllMaps && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="w-1/2 h-2/3 pb-32">
              <div className="bg-slate-500 p-6 rounded-sm w-full h-full opacity-90 text-white">
                <div className="flex flex-row-reverse">
                  <span
                    className="cursor-pointer"
                    onClick={() => setShowAllMaps(false)}
                  >
                    <IoMdClose />
                  </span>
                </div>
                <h2 className="font-semibold text-2xl mb-2"> Saved Maps</h2>
                <hr className="mb-5" />
                <div className="flex flex-col flex-wrap h-full">
                  {allMaps.slice(0, 3).map((map) => (
                    <div
                      onClick={() => {
                        localStorage.setItem("activeMapId", map._id);
                        window.location.href = `/?space=${map._id}`;
                      }}
                      className="px-4 py-2 mr-2 bg-gray-600 w-1/3 mb-2 rounded cursor-pointer"
                    >
                      <p>
                        <b>{map.title || "Untitled"}</b>
                      </p>
                      <span>
                        Created On:
                        {new Date(map?.createdOn).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Map Menu */}
        {showShareMenu && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="w-1/3 h-2/3  pb-32">
              <div className="bg-slate-500 p-6 rounded-sm w-full h-full opacity-90 text-white">
                <div className="flex flex-row-reverse">
                  <span
                    className="cursor-pointer"
                    onClick={() => setShowShareMenu(false)}
                  >
                    <IoMdClose />
                  </span>
                </div>
                <h2 className="font-semibold text-2xl mb-2"> Share</h2>
                <hr className="mb-5" />
                <span className="block font-semibold">Your Name</span>
                <input
                  className="border border-green-700 p-2 rounded-sm mb-2 w-2/3 focus:outline focus:outline-2focus:outline-green-800 text-black"
                  value={userName}
                  onChange={updateUserName}
                />
                <span className="block font-semibold">Link</span>
                <input
                  className="border border-green-800 p-2 rounded-sm mb-2 bg-slate-300 w-2/3 outline-none text-black"
                  value={window.location.href}
                  onChange={updateUserName}
                />
                <button
                  onClick={copyLinkToClipboard}
                  className="text-sm bg-[#3E5645] px-3 py-3 rounded-md text-white ml-4"
                >
                  Copy Link
                </button>
                <p className=" mt-2 ">
                  Any one with the link can edit this map
                </p>
              </div>
            </div>
          </div>
        )}
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
