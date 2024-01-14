import {
  ChangeEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaPlus } from "react-icons/fa";
import { IoIosArrowDown, IoIosArrowUp, IoMdClose } from "react-icons/io";
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

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const memeberColor = userColors["nameColor"];
    space?.enter({ name, userColors });

    userId && fetchAllMaps();
  }, [space]);

  const { self, otherMembers } = useSpaceMembers(space);

  const liveCursors = useRef(null);

  const [currentDrawingMode, setCurrentDrawingMode] =
    useState<DrawingMode | null>(null);

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

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [mapTitle, setMapTitle] = useState("Untitled");

  const [showAllMaps, setShowAllMaps] = useState(false);
  const [allMaps, setAllMaps] = useState<
    {
      _id: string;
      userID: string;
      title: string;
      createdOn: Date;
    }[]
  >([]);

  console.log(showAllMaps, "==__**");

  const mapId = localStorage.getItem("activeMapId");

  const handleMapTitleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    try {
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
      }
    } catch (error) {
      console.error("Request failed:");
    }

    setMapTitle(newValue);
  };

  const fetchAllMaps = async () => {
    try {
      const response = await fetch(
        `https://atlas-map-express-api.up.railway.app/mapsByCollaborator?userId=${userId}`
      );

      const data = await response.json();

      const allMaps = data.maps;
      const sortedAllMaps = allMaps.sort(
        (a: any, b: any) =>
          new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
      );

      setAllMaps(sortedAllMaps);

      const currentMap = allMaps.find(
        (map: any) => map._id.toString() === mapId
      );

      setMapTitle(currentMap.title);

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
          {/* <p className="text-white pr-4">Untitled</p> */}
          <input
            value={mapTitle}
            onChange={handleMapTitleChange}
            className={`bg-slate-500 outline-none  text-white font-medium p-0 m-0 text-center `}
            style={{ width: `${mapTitle?.length * 10 + 18}px` }}
          />

          <div
            onMouseLeave={() => setShowContextMenu(false)}
            className="h-full flex items-center"
          >
            <IoIosArrowDown
              // className="text-white cursor-pointer transform rotate-180 transition-all duration-300"
              className={`text-white cursor-pointer ${
                showContextMenu ? "rotate-180" : ""
              } transition-all duration-300`}
              onClick={() => setShowContextMenu(!showContextMenu)}
            />

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
                    // const maps = ["658ef9dc23fa08064fb38782"];
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

        {showAllMaps && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="w-1/2 h-2/3 pb-32">
              <div className="bg-white p-6 rounded-lg w-full h-full opacity-90">
                <div className="flex flex-row-reverse">
                  <span
                    className="cursor-pointer"
                    onClick={() => setShowAllMaps(false)}
                  >
                    <IoMdClose />
                  </span>
                </div>
                {/* Your menu content goes here */}
                <h2 className="font-semibold text-2xl mb-3"> Saved Maps</h2>
                <div className="flex flex-col flex-wrap h-full">
                  {allMaps.map((map) => (
                    <div
                      onClick={() => {
                        localStorage.setItem("activeMapId", map._id);
                        window.location.href = `/?space=${map._id}`;
                      }}
                      className="px-4 py-2 mr-2 bg-gray-100 w-1/3 mb-2 rounded cursor-pointer"
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
