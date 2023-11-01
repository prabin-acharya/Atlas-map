import type {
  Space,
  SpaceMember,
  CursorUpdate as _CursorUpdate,
} from "@ably/spaces";
import {
  GoogleMap,
  Marker,
  Polygon,
  Polyline,
  useLoadScript,
} from "@react-google-maps/api";
import { useAbly } from "ably/react";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import useAblySubscription from "../hooks/useAblySubscription";
import useSpaceMembers from "../hooks/useMembers";

import { OverlayView } from "@react-google-maps/api";
import { DrawingMode } from "../types";
import { Member } from "../utils/types";
import { MemberCursors, YourCursor } from "./Cursors";
import MapActionBar from "./MapActionBar";

type Library = "places" | "geometry" | "visualization" | "drawing";
const libraries: Library[] = ["places", "geometry", "visualization", "drawing"];

type ImageOverlay = {
  url: string;
  position: google.maps.LatLngLiteral;
  size: { width: number; height: number };
};

interface Props {
  currentDrawingMode: DrawingMode | null;
  setCurrentDrawingMode: Dispatch<SetStateAction<DrawingMode | null>>;
  space?: Space;
  selfConnectionId?: string;
}

const Map: React.FC<Props> = ({
  currentDrawingMode,
  setCurrentDrawingMode,
  space,
}) => {
  if (!space) return;

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });
  const [googleMapInstance, setGoogleMapInstance] =
    useState<google.maps.Map | null>(null);
  const center = useMemo(() => ({ lat: 18.52043, lng: 73.856743 }), []);

  const client = useAbly();
  const mapChannel = client.channels.get("map-updates");
  const freehandChannel = client.channels.get("freehand-updates");

  const { self, otherMembers } = useSpaceMembers(space);

  const handleDragEnd = (
    e: google.maps.MapMouseEvent | google.maps.IconMouseEvent,
    id: string
  ) => {
    const newPosition = e.latLng?.toJSON();
    if (!newPosition) {
      console.log("marker not addedddd!!!!");
      return;
    }
    setMarkers((prevMarkers) => {
      const updatedMarkers = { ...prevMarkers };
      updatedMarkers[id] = newPosition;
      return updatedMarkers;
    });
    mapChannel.publish("update-marker", { id, ...newPosition });
  };

  const handleDrag = (
    e: google.maps.MapMouseEvent | google.maps.IconMouseEvent,
    id: string
  ) => {
    const newPosition = e.latLng?.toJSON();
    if (!newPosition) {
      console.log("marker not addedddd!!!!");
      return;
    }
    setMarkers((prevMarkers) => {
      const updatedMarkers = { ...prevMarkers };
      updatedMarkers[id] = newPosition;
      return updatedMarkers;
    });
    mapChannel.publish("drag-marker", { id, ...newPosition });
  };

  const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(10);
  const [cursorPosition, setCursorPosition] = useState<{
    lat: number;
    lng: number;
    state: string;
  }>({ lat: 0, lng: 0, state: "move" });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [isDrawingFreehand, setIsDrawingFreehand] = useState(false);

  const [markers, setMarkers] = useState<
    Record<string, google.maps.LatLngLiteral>
  >({});

  const [texts, setTexts] = useState<Record<string, TextData>>({});

  const [freehandPaths, setFreehandPaths] = useState<
    Record<string, google.maps.LatLngLiteral[]>
  >({});
  const [currentFreehandPath, setCurrentFreehandPath] = useState<
    google.maps.LatLngLiteral[]
  >([]);

  const [polylines, setPolylines] = useState<{
    [key: string]: google.maps.LatLngLiteral[];
  }>({});

  const [polygons, setPolygons] = useState<{
    [key: string]: google.maps.LatLngLiteral[];
  }>({});

  const [imageOverlays, setImageOverlays] = useState<{
    [key: string]: ImageOverlay;
  }>({});

  //
  //
  //
  //

  useAblySubscription(
    mapChannel,
    freehandChannel,
    setMarkers,
    setPolylines,
    setTexts,
    setFreehandPaths,
    setPolygons,
    setImageOverlays,
    space
  );

  useEffect(() => {
    let mousedownListener: google.maps.MapsEventListener | null = null;
    let mousemoveListener: google.maps.MapsEventListener | null = null;
    let mouseupListener: google.maps.MapsEventListener | null = null;
    let clickListener: google.maps.MapsEventListener | null = null;

    const onClick = (e: google.maps.MapMouseEvent) => {
      const newPoint = e.latLng!.toJSON();
      const lastPoint = currentFreehandPath[currentFreehandPath.length - 1];
      const firstPoint = currentFreehandPath[0];

      switch (currentDrawingMode) {
        case "MARKER":
          const latLng = e.latLng;
          if (latLng !== null) {
            const id = "marker_" + Date.now().toString();
            setMarkers((prev) => ({ ...prev, [id]: latLng.toJSON() }));

            const newMarker = latLng.toJSON();
            mapChannel.publish("new-marker", {
              id,
              ...newMarker,
            });
          }
          break;
        case "TEXT":
          if (e.latLng?.toJSON()) {
            const coords = e.latLng.toJSON();
            const id = `text_${Date.now()}`;
            setTexts({
              ...texts,
              [id]: { position: coords, text: "default text" },
            });

            mapChannel.publish("new-text", {
              [id]: {
                position: coords,
                text: "default text",
              },
            });
            setCurrentDrawingMode(null);
          }
          break;
        case "POLYLINE":
          if (!isDrawingFreehand) setIsDrawingFreehand(true);

          if (e.latLng)
            setCurrentFreehandPath((prev) => [...prev, e.latLng!.toJSON()]);

          // Check if close to the last point
          if (currentFreehandPath.length > 1) {
            const lastLat = newPoint.lat;
            const lastLng = newPoint.lng;

            const prevLat = lastPoint.lat;
            const prevLng = lastPoint.lng;

            const latDiff = Math.abs(lastLat - prevLat);
            const lngDiff = Math.abs(lastLng - prevLng);

            if (latDiff < 0.001 && lngDiff < 0.0001) {
              setIsDrawingFreehand(false);
              setCurrentDrawingMode(null);
              setCurrentFreehandPath([]);
              const id = "polyline_" + Date.now().toString();
              setPolylines((prev) => ({ ...prev, [id]: currentFreehandPath }));

              mapChannel.publish("new-polyline", {
                [id]: currentFreehandPath,
              });
            }
          }
          break;

        case "POLYGON":
          if (!isDrawingFreehand) setIsDrawingFreehand(true);

          if (e.latLng)
            setCurrentFreehandPath((prev) => [...prev, e.latLng!.toJSON()]);

          // check if close to first point
          if (currentFreehandPath.length > 1) {
            const lastLat = newPoint.lat;
            const lastLng = newPoint.lng;

            const firstLat = firstPoint.lat;
            const firstLng = firstPoint.lng;

            const latDiff = Math.abs(lastLat - firstLat);
            const lngDiff = Math.abs(lastLng - firstLng);

            if (latDiff < 0.001 && lngDiff < 0.0001) {
              setIsDrawingFreehand(false);
              setCurrentDrawingMode(null);
              setCurrentFreehandPath([]);
              const id = "polygon_" + Date.now().toString();
              setPolygons((prev) => ({
                ...prev,
                [id]: currentFreehandPath,
              }));

              mapChannel.publish("new-polygon", {
                [id]: currentFreehandPath,
              });
            }
          }

          break;

        default:
          break;
      }
    };

    const onMouseDown = (e: google.maps.MapMouseEvent) => {
      switch (currentDrawingMode) {
        case "FREEHAND":
          setIsDrawingFreehand(true);
          if (e.latLng) setCurrentFreehandPath([e.latLng.toJSON()]);
          if (googleMapInstance) {
            googleMapInstance.setOptions({ draggable: false });
          }
          break;

        default:
          break;
      }
    };

    const onMouseMove = (e: google.maps.MapMouseEvent) => {
      // text move -- here need to
      if (selectedItemId && selectedItemId.split("_")[0] == "text") {
        const newPosition = e.latLng?.toJSON();
        if (selectedItemId && newPosition) {
          setTexts((prevTexts) => ({
            ...prevTexts,
            [selectedItemId]: {
              ...prevTexts[selectedItemId],
              position: newPosition,
            },
          }));
        }
      }

      switch (currentDrawingMode) {
        case "FREEHAND":
          if (isDrawingFreehand && e.latLng) {
            setCurrentFreehandPath((prev) => [...prev, e.latLng!.toJSON()]);
          }
          break;
        case "TEXT":
        // console.log("here!");
        // if (selectedItemId) {
        //   const newPosition = e.latLng?.toJSON();
        //   if (selectedItemId && newPosition) {
        //     setTexts((prevTexts) => ({
        //       ...prevTexts,
        //       [selectedItemId]: {
        //         ...prevTexts[selectedItemId],
        //         position: newPosition,
        //       },
        //     }));
        //   }
        // }
        // break;
        default:
          break;
      }
    };

    const onMouseUp = () => {
      //
    };

    const onMouseUpGlobal = () => {
      setIsDrawingFreehand(false);
      setSelectedItemId(null);

      switch (currentDrawingMode) {
        case "FREEHAND":
          const id = "freehand_" + Date.now().toString();
          setFreehandPaths((prev) => ({ ...prev, [id]: currentFreehandPath }));

          mapChannel.publish("new-freehand", {
            [id]: currentFreehandPath,
          });
          setCurrentFreehandPath([]);

          if (googleMapInstance) {
            googleMapInstance.setOptions({ draggable: true });
          }
          break;
        default:
          break;
      }
    };

    // ----------------------
    document.addEventListener("mouseup", onMouseUpGlobal);

    if (googleMapInstance) {
      mousedownListener = googleMapInstance.addListener(
        "mousedown",
        onMouseDown
      );
      mousemoveListener = googleMapInstance.addListener(
        "mousemove",
        onMouseMove
      );
      mouseupListener = googleMapInstance.addListener("mouseup", onMouseUp);
      clickListener = googleMapInstance.addListener("click", onClick);
    }

    return () => {
      mousedownListener?.remove();
      mousemoveListener?.remove();
      mouseupListener?.remove();
      clickListener?.remove();
      document.removeEventListener("mouseup", onMouseUpGlobal);
    };
  }, [
    isDrawingFreehand,
    currentFreehandPath,
    googleMapInstance,
    markers,
    selectedItemId,
    currentDrawingMode,
  ]);

  const handleCursorMove = (e: google.maps.MapMouseEvent) => {
    setCursorPosition({
      lat: e.latLng?.toJSON().lat ?? 18,
      lng: e.latLng?.toJSON().lng ?? 73,
      state: "move",
    });

    space.cursors.set({
      position: {
        x: e.latLng?.toJSON().lat ?? 18,
        y: e.latLng?.toJSON().lng ?? 73,
      },
      data: { state: "move" },
    });
  };

  const handleCursorLeave = (e: google.maps.MapMouseEvent) => {
    setCursorPosition({
      lat: 18,
      lng: 73,
      state: "leave",
    });

    space.cursors.set({
      position: { x: 18, y: 73 },
      data: { state: "leave" },
    });
  };

  useEffect(() => {
    if (selectedItemId) {
      if (googleMapInstance) {
        console.log("&&****___+++");
        googleMapInstance.setOptions({ draggable: false });
      }
    } else {
      if (googleMapInstance) {
        googleMapInstance.setOptions({ draggable: true });
      }
    }
  }, [selectedItemId]);

  const handleZoomChanged = () => {
    if (googleMapInstance !== null) {
      const zoomLevel = googleMapInstance.getZoom();
      if (zoomLevel) setCurrentZoomLevel(zoomLevel);
      console.log("Current zoom level:", zoomLevel);
    }
  };

  //
  //
  //

  const calculateBounds = (
    latLng: google.maps.LatLng
  ): google.maps.LatLngBoundsLiteral => {
    const delta = 0.136; // This value can be adjusted based on how large you want the image overlay to be
    return {
      north: latLng.lat() + delta,
      south: latLng.lat() - delta,
      east: latLng.lng() + delta,
      west: latLng.lng() - delta,
    };
  };

  useEffect(() => {
    window.addEventListener("dragenter", handleDragEnter);
    // Cleanup
    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
    };
  }, []);

  const handleDragEnter = () => {
    // Set pointer-events to 'auto' for .overlay-div
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    console.log("HANDLE IMAGE DROP");
    e.preventDefault();

    // Extract files
    const files = e.dataTransfer.files;

    console.log(files, "----");

    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.readAsDataURL(file);
      reader.onloadend = function () {
        // Create blob URL
        const imageBlobUrl = URL.createObjectURL(file);

        const tempImg = new Image();
        tempImg.src = imageBlobUrl;

        tempImg.onload = () => {
          const aspectRatio = tempImg.width / tempImg.height;

          // Retrieve map properties
          if (googleMapInstance) {
            const bounds = googleMapInstance.getBounds();

            if (bounds) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              const zoom = googleMapInstance.getZoom();

              if (zoom !== null) {
                const latLng = new google.maps.LatLng(
                  sw.lat() +
                    (ne.lat() - sw.lat()) *
                      (e.nativeEvent.offsetY /
                        googleMapInstance.getDiv().offsetHeight),
                  sw.lng() +
                    (ne.lng() - sw.lng()) *
                      (e.nativeEvent.offsetX /
                        googleMapInstance.getDiv().offsetWidth)
                );

                // Calculate bounds for image overlay
                const calculatedBounds = calculateBounds(latLng);
                function getCenterFromBounds(bounds: any) {
                  const lat = (bounds.north + bounds.south) / 2;
                  const lng = (bounds.east + bounds.west) / 2;
                  return { lat, lng };
                }
                const centerPosition = getCenterFromBounds(calculatedBounds);

                const id = "image_" + Date.now().toString();

                const currentSize = {
                  height: 200,
                  width: 200 * aspectRatio,
                };

                const baseSize = {
                  height:
                    currentSize.height / Math.pow(2, currentZoomLevel! - 1),
                  width: currentSize.width / Math.pow(2, currentZoomLevel! - 1),
                };

                setImageOverlays((prev) => ({
                  ...prev,
                  [id]: {
                    url: imageBlobUrl,
                    position: centerPosition,
                    size: baseSize,
                  },
                }));

                mapChannel.publish("new-image", {
                  [id]: {
                    position: centerPosition,
                    url: imageBlobUrl,
                  },
                });
              }
            }
          }
        };
      };
    }
    setShowOverlay(false);
  };

  const [showOverlay, setShowOverlay] = useState(false);
  const [captureDrop, setCaptureDrop] = useState(false);

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      console.log("DRAG OVER");
      e.preventDefault();
      setShowOverlay(true);
      setCaptureDrop(true); // Enable drop capture
    };

    const handleGlobalDrop = (e: DragEvent) => {
      console.log("GLOBAL DROP");

      e.preventDefault(); // Add this line to prevent the default behavior
      e.stopPropagation();
      setShowOverlay(false);
      setCaptureDrop(false); // Disable drop capture after drop is complete
    };

    window.addEventListener("dragover", handleGlobalDragOver);
    window.addEventListener("drop", handleGlobalDrop);

    return () => {
      window.removeEventListener("dragover", handleGlobalDragOver);
      window.removeEventListener("drop", handleGlobalDrop);
    };
  }, []);

  const position = { lat: 37.7749, lng: -122.4194 };
  console.log(imageOverlays, "#####@@@@");

  const initiateResize = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (e: MouseEvent) => {
      if (googleMapInstance) {
        googleMapInstance.setOptions({ draggable: false });
      }
      const newWidth = imageOverlays[id].size.width + (e.clientX - startX);
      const newHeight = imageOverlays[id].size.height + (e.clientY - startY);

      const baseWidth = newWidth / Math.pow(2, currentZoomLevel! - 1);
      const baseHeight = newHeight / Math.pow(2, currentZoomLevel! - 1);

      setImageOverlays((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          size: { width: baseWidth, height: baseHeight },
        },
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (googleMapInstance) {
        googleMapInstance.setOptions({ draggable: true });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  console.log(selectedItemId, currentZoomLevel);

  useEffect(() => {
    if (googleMapInstance !== null) {
      const zoomLevel = googleMapInstance.getZoom();
      if (zoomLevel) setCurrentZoomLevel(zoomLevel);
      console.log("Current zoom level:", zoomLevel);
    }
  }, []);

  return (
    <div className="h-full w-full">
      {!isLoaded ? (
        <h1>Loading...</h1>
      ) : (
        <>
          <div className="h-full w-full relative">
            <GoogleMap
              onLoad={(map) => setGoogleMapInstance(map)}
              mapContainerClassName="h-full w-full rounded border"
              center={center}
              zoom={10}
              onZoomChanged={handleZoomChanged}
              onMouseOut={(e) => handleCursorLeave(e)}
              onMouseMove={(e) => handleCursorMove(e)}
            >
              {Object.entries(markers).map(([id, position]) => (
                <Marker
                  key={id}
                  position={position}
                  draggable={true}
                  onDrag={(e) => handleDrag(e, id)}
                  onDragEnd={(e) => handleDragEnd(e, id)}
                />
              ))}
              {/* FREEHAND MARKER------------------------------------ */}
              {Object.entries(freehandPaths).map(([id, path]) => (
                <Polyline
                  key={id}
                  path={path}
                  options={{
                    strokeWeight: 7,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                  }}
                  draggable={true}
                />
              ))}
              {isDrawingFreehand && (
                <Polyline
                  path={currentFreehandPath}
                  options={{
                    strokeWeight: 7,
                    strokeColor: "#00FF00",
                    strokeOpacity: 0.8,
                  }}
                />
              )}
              {/* POLYLINE--------------------------- */}
              {Object.entries(polylines).map(([id, path]) => (
                <Polyline
                  key={id}
                  path={path}
                  options={{
                    strokeWeight: 7,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                  }}
                  draggable={true}
                />
              ))}
              {isDrawingFreehand && (
                <Polyline
                  path={[...currentFreehandPath, cursorPosition]}
                  options={{
                    strokeWeight: 7,
                    strokeColor: "#00FF00",
                    strokeOpacity: 0.8,
                  }}
                />
              )}

              {/* POLYGON--------------------------- */}
              {Object.entries(polygons).map(([id, path]) => (
                <Polygon
                  key={id}
                  path={path}
                  options={{
                    strokeWeight: 7,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                  }}
                  draggable={true}
                />
              ))}
              {isDrawingFreehand && currentDrawingMode == "POLYGON" && (
                <Polygon
                  path={[...currentFreehandPath, cursorPosition]}
                  options={{
                    strokeWeight: 7,
                    strokeColor: "#00FF00",
                    strokeOpacity: 0.8,
                  }}
                />
              )}

              {/* Cursors-------------------------------------------*/}
              <MemberCursors
                otherUsers={
                  otherMembers.filter(
                    (m: SpaceMember) => m.isConnected
                  ) as Member[]
                }
                space={space}
                selfConnectionId={self?.connectionId}
              />
              {Object.entries(texts).map(([id, textData]) => (
                <TextLabel
                  key={id}
                  id={id}
                  position={textData.position}
                  text={textData.text}
                  zoomLevel={currentZoomLevel}
                  setSelectedItemId={setSelectedItemId}
                  onTextChange={(newText) => {
                    setTexts({
                      ...texts,
                      [id]: { ...textData, text: newText },
                    });
                  }}
                />
              ))}

              {/* IMAGE---------------------------------------- */}
              {Object.entries(imageOverlays).map(([id, image]) => (
                <OverlayView
                  key={id}
                  position={image.position}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div
                    style={{
                      width: `${
                        image.size.width * Math.pow(2, currentZoomLevel! - 1)
                      }px`,
                      height: `${
                        image.size.height * Math.pow(2, currentZoomLevel! - 1)
                      }px`,
                    }}
                    onMouseDown={(e) => initiateResize(e, id)}
                    onClick={() => setSelectedItemId(id)}
                    className={`border-2 ${
                      selectedItemId == id ? " border-red-500" : ""
                    }`}
                  >
                    <img
                      src={image.url}
                      className="w-full h-full shadow-lg border"
                    />
                  </div>
                </OverlayView>
              ))}
            </GoogleMap>

            {showOverlay && (
              <div
                className="absolute inset-0 w-full h-full z-10  bg-orange-600 opacity-10"
                style={{ pointerEvents: captureDrop ? "auto" : "none" }}
                onDrop={(e) => {
                  console.log("**********onDrop");
                  e.stopPropagation();
                  handleImageDrop(e);
                }}
                onDragOver={(e) => e.preventDefault()}
              ></div>
            )}
            <MapActionBar
              currentDrawingMode={currentDrawingMode}
              setCurrentDrawingMode={setCurrentDrawingMode}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Map;

// ==========================================================================
// ==========================================================================
// ==========================================================================

type TextLabelProps = {
  id: string;
  position: google.maps.LatLngLiteral;
  text: string;
  zoomLevel: number | null;
  onTextChange: (newText: string) => void;
  setSelectedItemId: (id: string | null) => void;
};

type TextData = {
  position: google.maps.LatLngLiteral;
  text: string;
};

const TextLabel: React.FC<TextLabelProps> = ({
  id,
  position,
  text,
  zoomLevel,
  onTextChange,
  setSelectedItemId,
}) => {
  const handleTextClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    e.currentTarget.focus();
  };

  const [inputValue, setInputValue] = useState(text);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    onTextChange(inputValue);
  };

  const calculateFontSize = () => {
    return zoomLevel + "px";
  };

  // ================---------------------------------------

  const onOverlayLoad = (overlay: google.maps.OverlayView) => {
    const div = overlay.getPanes()?.overlayMouseTarget as
      | HTMLElement
      | null
      | undefined;

    if (!div) return;

    const handleMouseDown = (e: globalThis.MouseEvent): void => {
      setSelectedItemId(id);
    };

    div.addEventListener("mousedown", handleMouseDown);

    return () => {
      div.removeEventListener("mousedown", handleMouseDown);
    };
  };

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      onLoad={onOverlayLoad}
    >
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onClick={handleTextClick}
        className="no-select text-white text-lg font-bold w-fit inline-block p-4 whitespace-nowrap z-1000 pointer-events-auto border-none cursor-pointer bg-green-100/0 outline-none select-none"
        style={{
          fontSize: calculateFontSize(),
        }}
      />
    </OverlayView>
  );
};

// type ImageData = {
//   position: google.maps.LatLngLiteral;
//   src: string;
// };

// interface ImageLabelProps {
//   position: google.maps.LatLngLiteral;
//   src: string;
//   onPositionChange: (newPosition: google.maps.LatLngLiteral) => void;
// }

// const ImageLabel: React.FC<ImageLabelProps> = ({
//   position,
//   src,
//   onPositionChange,
// }) => {

//   const handleMouseDown = (
//     e: React.MouseEvent<HTMLImageElement, MouseEvent>
//   ) => {
//     setIsDragging(true);
//     e.preventDefault();
//   };

//   const handleMouseMove = (
//     e: React.MouseEvent<HTMLImageElement, MouseEvent>
//   ) => {
//     if (!isDragging) return;
//     const newPosition = {
//       lat: position.lat + SOME_DELTA,
//       lng: position.lng + SOME_DELTA,
//     };
//     onPositionChange(newPosition);
//   };

//   const handleMouseUp = () => {
//     setIsDragging(false);
//   };

//   return (
//     <OverlayView
//       position={position}
//       mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
//     >
//       <img
//         src={src}
//         draggable={false}
//         onMouseDown={handleMouseDown}
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUp}
//       />
//     </OverlayView>
//   );
// };
