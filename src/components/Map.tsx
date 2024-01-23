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
import TextLabel from "./MapElements/TextLabel";

interface Props {
  currentDrawingMode: DrawingMode | null;
  setCurrentDrawingMode: Dispatch<SetStateAction<DrawingMode | null>>;
  space?: Space;
  selfConnectionId?: string;
}

type Library = "places" | "geometry" | "visualization" | "drawing";
const libraries: Library[] = ["places", "geometry", "visualization", "drawing"];

type ImageOverlay = {
  url: string;
  coords: google.maps.LatLngLiteral;
  size: { width: number; height: number };
};

type TextData = {
  coords: google.maps.LatLngLiteral;
  text: string;
};

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

  const mapId = localStorage.getItem("activeMapId");
  const userId = localStorage.getItem("userId");

  const { self, otherMembers } = useSpaceMembers(space);

  const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(10);
  const [cursorPosition, setCursorPosition] = useState<{
    lat: number;
    lng: number;
    state: string;
  }>({ lat: 0, lng: 0, state: "move" });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [isDrawingFreehand, setIsDrawingFreehand] = useState(false);
  const [isImageDragging, setIsImageDragging] = useState(false);

  /* Map Elements */
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

  const fetchMapElements = async () => {
    try {
      const response = await fetch(
        `https://atlas-map-express-api.up.railway.app/elements?mapId=${mapId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch map elements. Status: ${response.status}`
        );
      }

      const data = await response.json();

      const savedElements = data.elements;

      savedElements.forEach((element: any) => {
        const elementType = element.elementType;
        switch (elementType) {
          case "marker":
            setMarkers((prev) => ({ ...prev, [element.id]: element.coords }));
            break;
          case "freehand":
            setFreehandPaths((prev) => ({
              ...prev,
              [element.id]: element.coords,
            }));
            break;
          case "polyline":
            setPolylines((prev) => ({
              ...prev,
              [element.id]: element.coords,
            }));
            break;
          case "polygon":
            setPolygons((prev) => ({
              ...prev,
              [element.id]: element.coords,
            }));
            break;
          case "text":
            setTexts((prev) => ({
              ...prev,
              [element.id]: { text: element.text, coords: element.coords },
            }));
            break;
          default:
            break;
        }
      });
    } catch (error) {
      console.error(`Error while fetching elements`);
    }
  };

  useEffect(() => {
    if (googleMapInstance !== null) {
      const zoomLevel = googleMapInstance.getZoom();
      if (zoomLevel) setCurrentZoomLevel(zoomLevel);
    }

    fetchMapElements();
  }, []);

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

  const saveElementToDB = async (id: string, coords: any) => {
    try {
      const response = await fetch(
        "https://atlas-map-express-api.up.railway.app/add-element",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mapId,
            userId,
            element: {
              elementType: id.split("_")[0],
              id,
              coords,
            },
          }),
        }
      );

      const data = await response.json();
      console.log(data.message);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteFromDB = async (elementId: string) => {
    try {
      const response = await fetch(
        `https://atlas-map-express-api.up.railway.app/delete-element/${elementId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      console.log(data.message);
    } catch (err) {
      console.log(err);
    }
  };

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
    let mousedownListener: google.maps.MapsEventListener | null = null;
    let mousemoveListener: google.maps.MapsEventListener | null = null;
    let mouseupListener: google.maps.MapsEventListener | null = null;
    let clickListener: google.maps.MapsEventListener | null = null;

    const onClick = async (e: google.maps.MapMouseEvent) => {
      const newPoint = e.latLng!.toJSON();
      const lastPoint = currentFreehandPath[currentFreehandPath.length - 1];
      const firstPoint = currentFreehandPath[0];

      switch (currentDrawingMode) {
        case "MARKER":
          const latLng = e.latLng;
          console.log(latLng?.toJSON());
          if (latLng !== null) {
            const id = "marker_" + Date.now().toString();

            setMarkers((prev) => ({ ...prev, [id]: latLng.toJSON() }));

            const newMarker = latLng.toJSON();
            mapChannel.publish("new-marker", {
              id,
              ...newMarker,
            });
            const coords = latLng.toJSON();

            await saveElementToDB(id, coords);

            setCurrentDrawingMode(null);
          }
          break;
        case "TEXT":
          if (e.latLng?.toJSON()) {
            const coords = e.latLng.toJSON();
            const id = `text_${Date.now()}`;
            setTexts({
              ...texts,
              [id]: { coords, text: "" },
            });

            mapChannel.publish("new-text", {
              [id]: {
                coords,
                text: "",
              },
            });

            setCurrentDrawingMode(null);
          }
          break;
        case "POLYLINE":
          if (!isDrawingFreehand) setIsDrawingFreehand(true);

          if (e.latLng)
            setCurrentFreehandPath((prev) => [...prev, e.latLng!.toJSON()]);

          // Check if too close to the last point
          if (currentFreehandPath.length > 1) {
            const lastLat = newPoint.lat;
            const lastLng = newPoint.lng;

            const prevLat = lastPoint.lat;
            const prevLng = lastPoint.lng;

            const latDiff = Math.abs(lastLat - prevLat);
            const lngDiff = Math.abs(lastLng - prevLng);

            const thredholdFactor =
              0.0000065 * Math.pow(2, 22 - currentZoomLevel);

            if (latDiff < thredholdFactor && lngDiff < thredholdFactor) {
              setIsDrawingFreehand(false);
              setCurrentDrawingMode(null);
              setCurrentFreehandPath([]);
              const id = "polyline_" + Date.now().toString();
              setPolylines((prev) => ({ ...prev, [id]: currentFreehandPath }));

              mapChannel.publish("new-polyline", {
                [id]: currentFreehandPath,
              });
              const coords = currentFreehandPath;

              await saveElementToDB(id, coords);
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

            const thredholdFactor =
              0.0000065 * Math.pow(2, 22 - currentZoomLevel);

            if (latDiff < thredholdFactor && lngDiff < thredholdFactor) {
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

              await saveElementToDB(id, currentFreehandPath);
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

        case "IMAGE":

        default:
          break;
      }
    };

    const onMouseMove = async (e: google.maps.MapMouseEvent) => {
      if (selectedItemId && selectedItemId.split("_")[0] == "text") {
        const newCoords = e.latLng?.toJSON();
        if (selectedItemId && newCoords) {
          setTexts((prevTexts) => ({
            ...prevTexts,
            [selectedItemId]: {
              ...prevTexts[selectedItemId],
              coords: newCoords,
            },
          }));

          mapChannel.publish("drag-text", {
            id: selectedItemId,
            coords: newCoords,
          });

          try {
            const response = await fetch(
              "https://atlas-map-express-api.up.railway.app/text",
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId,
                  mapId: mapId,
                  element: {
                    id: selectedItemId,
                    coords: newCoords,
                    text: texts[selectedItemId].text || "",
                  },
                }),
              }
            );
            const data = await response.json();
          } catch (err) {
            console.log(err);
          }
        }
      }

      // image move
      if (
        isImageDragging &&
        selectedItemId &&
        selectedItemId.split("_")[0] == "image"
      ) {
        const newCoords = e.latLng?.toJSON();
        if (selectedItemId && newCoords) {
          setImageOverlays((prev) => ({
            ...prev,
            [selectedItemId]: {
              ...prev[selectedItemId],
              coords: newCoords,
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
        default:
          break;
      }
    };

    const onMouseUp = () => {
      //
    };

    const onMouseUpGlobal = async () => {
      setIsDrawingFreehand(false);
      const selectedElement = selectedItemId?.split("_")[0];
      selectedElement == "text" && setSelectedItemId(null);

      if (googleMapInstance) {
        googleMapInstance.setOptions({ draggable: true });
      }

      switch (currentDrawingMode) {
        case "FREEHAND":
          const id = "freehand_" + Date.now().toString();
          setFreehandPaths((prev) => ({ ...prev, [id]: currentFreehandPath }));

          mapChannel.publish("new-freehand", {
            [id]: currentFreehandPath,
          });

          await saveElementToDB(id, currentFreehandPath);
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

  useEffect(() => {
    if (selectedItemId) {
      if (googleMapInstance) {
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
    }
  };

  const handleMarkerDrag = (
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

  const handleMarkerDragEnd = async (
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

    try {
      const response = await fetch(
        `https://atlas-map-express-api.up.railway.app/update-element/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            element: {
              coords: newPosition,
            },
          }),
        }
      );
      const data = await response.json();
    } catch (err) {
      console.log(err);
    }
  };

  /* Image */
  const [showOverlay, setShowOverlay] = useState(false);
  const [captureDrop, setCaptureDrop] = useState(false);

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    console.log("HANDLE IMAGE DROP");
    e.preventDefault();

    // Extract files
    const files = e.dataTransfer.files;

    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.readAsDataURL(file);
      reader.onloadend = function () {
        // Create blob URL
        const imageBlobUrl = URL.createObjectURL(file);

        const imageBase64 = reader.result as string;

        console.log(imageBase64, "base64");

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
                    coords: centerPosition,
                    size: baseSize,
                  },
                }));

                mapChannel.publish("new-image", {
                  [id]: {
                    coords: centerPosition,
                    url: imageBlobUrl,
                    size: baseSize,
                    imageBase64,
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

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      setShowOverlay(true);
      setCaptureDrop(true);
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowOverlay(false);
      setCaptureDrop(false);
    };

    window.addEventListener("dragover", handleGlobalDragOver);
    window.addEventListener("drop", handleGlobalDrop);

    return () => {
      window.removeEventListener("dragover", handleGlobalDragOver);
      window.removeEventListener("drop", handleGlobalDrop);
    };
  }, []);

  /* Element Options */

  const [showElementRightClickMenu, setShowElementRightClickMenu] =
    useState(false);

  const [rightClickPosition, setRightClickedPosition] =
    useState<google.maps.LatLngLiteral>();

  const handleMapClick = (
    e: google.maps.MapMouseEvent | google.maps.IconMouseEvent
  ) => {
    currentDrawingMode == null && setSelectedItemId(null);
    setShowElementRightClickMenu(false);
  };

  const handleRightClickElement = (
    e: google.maps.MapMouseEvent | google.maps.IconMouseEvent,
    id: string
  ) => {
    const rightClickedPosition = e?.latLng?.toJSON();
    rightClickedPosition && setRightClickedPosition(rightClickedPosition);
    console.log("right click");
    setShowElementRightClickMenu(true);
    setSelectedItemId(id);
  };

  const deleteElement = async (id: string) => {
    console.log("delete ", id);
    const element = id.split("_")[0];

    switch (element) {
      case "marker":
        setMarkers((prevMarkers) => {
          const newMarkers = { ...prevMarkers };
          delete newMarkers[id];
          return newMarkers;
        });

        await deleteFromDB(id);

        break;

      case "freehand":
        setFreehandPaths((prev) => {
          const newFreehands = { ...prev };
          delete newFreehands[id];
          return newFreehands;
        });

        await deleteFromDB(id);
        break;

      case "polyline":
        console.log("cased polyline");

        setPolylines((prev) => {
          const newPolylines = { ...prev };
          delete newPolylines[id];
          return newPolylines;
        });

        await deleteFromDB(id);
        break;

      case "polygon":
        setPolygons((prev) => {
          const newPolylines = { ...prev };
          delete newPolylines[id];
          return newPolylines;
        });
        await deleteFromDB(id);

        break;
    }

    setSelectedItemId(null);
  };

  const handleTextChange = async (
    newText: string,
    id: string,
    textData: TextData
  ) => {
    setTexts({
      ...texts,
      [id]: { ...textData, text: newText },
    });

    mapChannel.publish("update-text", {
      id,
      updatedText: newText,
    });

    try {
      const response = await fetch(
        "https://atlas-map-express-api.up.railway.app/text",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            mapId: mapId,
            element: {
              id,
              coords: textData.coords,
              text: newText,
            },
          }),
        }
      );
      const data = await response.json();
    } catch (err) {
      console.log(err);
    }
  };

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
              onClick={(e) => {
                handleMapClick(e);
              }}
            >
              {Object.entries(markers).map(([id, coords]) => (
                <Marker
                  key={id}
                  position={coords}
                  draggable={true}
                  onDrag={(e) => handleMarkerDrag(e, id)}
                  onDragEnd={(e) => handleMarkerDragEnd(e, id)}
                  onRightClick={(e) => handleRightClickElement(e, id)}
                />
              ))}

              {/* FREEHAND Drawing------------------------------------ */}
              {Object.entries(freehandPaths).map(([id, path]) => (
                <Polyline
                  key={id}
                  path={path}
                  options={{
                    strokeWeight: 5,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                  }}
                  onRightClick={(e) => handleRightClickElement(e, id)}
                />
              ))}
              {isDrawingFreehand && (
                <Polyline
                  path={currentFreehandPath}
                  options={{
                    strokeWeight: 5,
                    strokeColor: "#FF0000",
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
                    strokeWeight: 4,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                  }}
                  onDrag={(e) => {
                    console.log("on drag polyline");
                    console.log(e.latLng?.toJSON());
                  }}
                  onRightClick={(e) => handleRightClickElement(e, id)}
                />
              ))}
              {isDrawingFreehand &&
                currentDrawingMode == DrawingMode.POLYLINE && (
                  <Polyline
                    path={[...currentFreehandPath, cursorPosition]}
                    options={{
                      strokeWeight: 4,
                      strokeColor: "#FF0000",
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
                    strokeWeight: 4,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                  }}
                  onRightClick={(e) => handleRightClickElement(e, id)}
                />
              ))}
              {isDrawingFreehand && currentDrawingMode == "POLYGON" && (
                <Polygon
                  path={[...currentFreehandPath, cursorPosition]}
                  options={{
                    strokeWeight: 4,
                    strokeColor: "#FF0000",
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

              {/* Text ---------------------------------------------- */}
              {Object.entries(texts).map(([id, textData]) => (
                <TextLabel
                  key={id}
                  id={id}
                  position={textData.coords}
                  text={textData.text}
                  zoomLevel={currentZoomLevel}
                  setSelectedItemId={setSelectedItemId}
                  onTextChange={(newText) =>
                    handleTextChange(newText, id, textData)
                  }
                />
              ))}

              {/* IMAGE---------------------------------------- */}
              {Object.entries(imageOverlays).map(([id, image]) => (
                <OverlayView
                  key={id}
                  position={image.coords}
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
                      border: `${
                        selectedItemId == id
                          ? "1px solid blue"
                          : "1px solid red"
                      }`,
                    }}
                    onClick={(e) => {
                      console.log("click");
                      setSelectedItemId(id);
                    }}
                    onMouseDown={(e) => {
                      if (e.detail == 1) {
                        setIsImageDragging(true);
                        setSelectedItemId(id);
                      }
                    }}
                    onMouseUp={() => {
                      setIsImageDragging(false);
                    }}
                  >
                    <img src={image.url} className="w-full h-full shadow-lg" />
                  </div>
                </OverlayView>
              ))}

              {/* Element Right Click Menu */}
              {showElementRightClickMenu && selectedItemId && (
                <OverlayView
                  key={selectedItemId}
                  position={rightClickPosition}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div className=" flex py-2 bg-slate-500 text-white w-32 font-medium rounded-sm shadow-md text-base">
                    <span
                      className=" w-full px-2 py-1  hover:bg-slate-600 cursor-pointer z-50"
                      onClick={() => deleteElement(selectedItemId)}
                    >
                      Delete
                    </span>
                  </div>
                </OverlayView>
              )}
            </GoogleMap>

            {showOverlay && (
              <div
                className="absolute inset-0 w-full h-full z-10  bg-orange-600 opacity-10"
                style={{ pointerEvents: captureDrop ? "auto" : "none" }}
                onDrop={(e) => {
                  e.stopPropagation();
                  handleImageDrop(e);
                }}
                onDragOver={(e) => e.preventDefault()}
              ></div>
            )}
            <MapActionBar
              currentDrawingMode={currentDrawingMode}
              setCurrentDrawingMode={setCurrentDrawingMode}
              googleMapInstance={googleMapInstance}
              mapChannel={mapChannel}
              currentZoomLevel={currentZoomLevel}
              setImageOverlays={setImageOverlays}
              setShowOverlay={setShowOverlay}
              center={googleMapInstance?.getCenter()?.toJSON()}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Map;

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
