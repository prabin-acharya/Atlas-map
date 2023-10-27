import type {
  Space,
  SpaceMember,
  CursorUpdate as _CursorUpdate,
} from "@ably/spaces";
import {
  GoogleMap,
  Marker,
  Polyline,
  useLoadScript,
} from "@react-google-maps/api";
import { useAbly } from "ably/react";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSpaceMembers from "../hooks/useMembers";

import { OverlayView, useGoogleMap } from "@react-google-maps/api";
import { DrawingMode } from "../types";
import { Member } from "../utils/types";
import { MemberCursors, YourCursor } from "./Cursors";
import MapActionBar from "./MapActionBar";

type Library = "places" | "geometry" | "visualization" | "drawing";
const libraries: Library[] = ["places", "geometry", "visualization", "drawing"];

interface Props {
  currentDrawingMode: DrawingMode | null;
  setCurrentDrawingMode: Dispatch<SetStateAction<DrawingMode | null>>;
  space?: Space;
  selfConnectionId?: string;
}

const GoogleMaps: React.FC<Props> = ({
  currentDrawingMode,
  setCurrentDrawingMode,
  space,
}) => {
  if (!space) return;

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const client = useAbly();
  const mapChannel = client.channels.get("map-updates");

  const center = useMemo(() => ({ lat: 18.52043, lng: 73.856743 }), []);

  const [markers, setMarkers] = useState<
    Record<string, google.maps.LatLngLiteral>
  >({});

  useEffect(() => {
    const newMarkerSubscription = mapChannel.subscribe(
      "new-marker",
      (message: { data: { id: string; lat: number; lng: number } }) => {
        const { id, ...newMarker } = message.data;
        setMarkers((prevMarkers) => ({ ...prevMarkers, [id]: newMarker }));
      }
    );

    const updateMarkerSubscription = mapChannel.subscribe(
      "update-marker",
      (message: { data: { id: string; lat: number; lng: number } }) => {
        const { id, ...updatedMarker } = message.data;
        setMarkers((prevMarkers) => ({ ...prevMarkers, [id]: updatedMarker }));
      }
    );

    const dragMarkerSubscription = mapChannel.subscribe(
      "drag-marker",
      (message: { data: { id: string; lat: number; lng: number } }) => {
        const { id, ...draggedMarker } = message.data;
        setMarkers((prevMarkers) => ({
          ...prevMarkers,
          [id]: draggedMarker,
        }));
      }
    );

    const newPolylineSubscription = mapChannel.subscribe(
      "new-polyline",
      (message: {
        data: { id: string; polylinePoints: google.maps.LatLngLiteral[] };
      }) => {
        const { id, polylinePoints } = message.data;
        setPolylines((prevPolylines) => ({
          ...prevPolylines,
          [id]: polylinePoints,
        }));
      }
    );

    return () => {
      newMarkerSubscription.unsubscribe();
      updateMarkerSubscription.unsubscribe();
      dragMarkerSubscription.unsubscribe();
      newPolylineSubscription.unsubscribe();
    };
  }, []);

  const onMarkerComplete = (marker: google.maps.Marker) => {
    const newMarker = marker.getPosition()?.toJSON();
    console.log("marker added!");
    if (newMarker) {
      const id = Date.now().toString();
      setMarkers((prevMarkers) => ({ ...prevMarkers, [id]: newMarker }));
      mapChannel.publish("new-marker", { id, ...newMarker });
    }
    marker.setMap(null);
  };

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

  //
  //
  //
  //
  //

  const [polylines, setPolylines] = useState<{
    [key: string]: google.maps.LatLngLiteral[];
  }>({});

  const onPolylineComplete = (polyline: google.maps.Polyline) => {
    const pathArray = polyline.getPath().getArray();
    const polylinePoints: google.maps.LatLngLiteral[] = pathArray.map((point) =>
      point.toJSON()
    );

    if (polylinePoints.length) {
      const id = Date.now().toString();
      setPolylines((prevPolylines) => ({
        ...prevPolylines,
        [id]: polylinePoints,
      }));
      mapChannel.publish("new-polyline", { id, polylinePoints });
    }

    polyline.setMap(null);
  };
  //
  //
  //
  //

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<google.maps.LatLngLiteral[]>(
    []
  );
  const [freehandPaths, setFreehandPaths] = useState<
    Record<string, google.maps.LatLngLiteral[]>
  >({});

  const [googleMapInstance, setGoogleMapInstance] =
    useState<google.maps.Map | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let mousedownListener: google.maps.MapsEventListener | null = null;
    let mousemoveListener: google.maps.MapsEventListener | null = null;
    let mouseupListener: google.maps.MapsEventListener | null = null;
    let clickListener: google.maps.MapsEventListener | null = null;

    const onClick = (e: google.maps.MapMouseEvent) => {
      switch (currentDrawingMode) {
        case "MARKER":
          console.log("MARKERRRRRRRRRRRRRRRRRRRRR");
          const latLng = e.latLng;
          if (latLng !== null) {
            const id = Date.now().toString();
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
            const id = `label_${Date.now()}`;
            setTexts({
              ...texts,
              [id]: { position: coords, text: "default text" },
            });
            setCurrentDrawingMode(null);
          }

          break;
        default:
          break;
      }
    };

    const onMouseDown = (e: google.maps.MapMouseEvent) => {
      setIsDragging(true);

      switch (currentDrawingMode) {
        case "FREEHAND":
          setIsDrawing(true);
          if (e.latLng) setCurrentPath([e.latLng.toJSON()]);
          if (googleMapInstance) {
            googleMapInstance.setOptions({ draggable: false });
          }
          break;
        default:
          break;
      }
    };

    // const updateItemPosition = (id, newPosition) => {
    //   setMapItems((prevItems) =>
    //     prevItems.map((item) =>
    //       item.id === id ? { ...item, position: newPosition } : item
    //     )
    //   );
    // };

    const onMouseMove = (e: google.maps.MapMouseEvent) => {
      // if (!isDragging) return;

      console.log("MMMMMMMMmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm");

      console.log(isDragging);

      if (isDragging) {
        const id = selectedTextId;

        console.log("llllllllllllllllllllll");

        if (googleMapInstance) {
          console.log("VVVVVVVVVVVVVVVVVVVVVVVVVVVVVv");
          googleMapInstance.setOptions({ draggable: false });
        }

        const newPosition = e.latLng?.toJSON();
        setTexts((prevTexts) => ({
          ...prevTexts,
          [id]: { ...prevTexts[id], position: newPosition },
        }));
      }

      switch (currentDrawingMode) {
        case "FREEHAND":
          if (isDrawing && e.latLng) {
            setCurrentPath((prev) => [...prev, e.latLng!.toJSON()]);
          }

          break;
        // Additional cases for new drawing modes can go here
        default:
          break;
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      setSelectedTextId(null);

      switch (currentDrawingMode) {
        case "FREEHAND":
          if (isDrawing) {
            const id = Date.now().toString();
            setFreehandPaths((prev) => ({ ...prev, [id]: currentPath }));
            setCurrentPath([]);
          }
          setIsDrawing(false);

          break;
        default:
          break;
      }
    };

    const onMouseUpGlobal = () => {
      setIsDrawing(false);
      if (googleMapInstance) {
        googleMapInstance.setOptions({ draggable: true });
      }
      const id = Date.now().toString();
      setFreehandPaths((prev) => ({ ...prev, [id]: currentPath }));
      setCurrentPath([]);
    };

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
  }, [isDrawing, currentPath, googleMapInstance, markers, isDragging]);

  // console.log("MAPS", "########################++");
  //

  const [cursorPosition, setCursorPosition] = useState<{
    lat: number;
    lng: number;
    state: string;
  }>({ lat: 0, lng: 0, state: "move" });

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

  const { self, otherMembers } = useSpaceMembers(space);

  //
  //
  //
  // ###############################################################

  const [texts, setTexts] = useState<Record<string, TextData>>({});

  const [images, setImages] = useState<Record<string, ImageData>>({});

  const [currentZoomLevel, setCurrentZoomLevel] = useState<number | null>(null);

  const handleZoomChanged = () => {
    if (googleMapInstance !== null) {
      const zoomLevel = googleMapInstance.getZoom();
      if (zoomLevel) setCurrentZoomLevel(zoomLevel);
      console.log("Current zoom level:", zoomLevel);
    }
  };

  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  useEffect(() => {
    if (isDragging) {
      if (googleMapInstance) {
        googleMapInstance.setOptions({ draggable: false });
      }
    } else {
      if (googleMapInstance) {
        googleMapInstance.setOptions({ draggable: true });
      }
    }
  }, [isDragging]);

  return (
    <div className="h-full w-full">
      {!isLoaded ? (
        <h1>Loading...</h1>
      ) : (
        <>
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

            {isDrawing && (
              <Polyline
                path={currentPath}
                options={{
                  strokeWeight: 7,
                  strokeColor: "#00FF00",
                  strokeOpacity: 0.8,
                }}
              />
            )}
            {/* Cursors------------- */}
            <YourCursor
              self={self as Member | null}
              space={space}
              cursorPosition={cursorPosition}
            />
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
                setSelectedTextId={setSelectedTextId}
                onTextChange={(newText) => {
                  setTexts({
                    ...texts,
                    [id]: { ...textData, text: newText },
                  });
                }}
              />
            ))}

            {/* {Object.entries(images).map(([id, imageData]) => (
              <ImageLabel
                key={id}
                position={imageData.position}
                src={imageData.src}
                onPositionChange={(newPosition) => {
                  setImages({
                    ...images,
                    [id]: { ...imageData, position: newPosition },
                  });
                }}
              />
            ))} */}
          </GoogleMap>
          <MapActionBar
            currentDrawingMode={currentDrawingMode}
            setCurrentDrawingMode={setCurrentDrawingMode}
          />
        </>
      )}
    </div>
  );
};

export default GoogleMaps;

// ==========================================================================

type TextOverlay = {
  position: google.maps.LatLngLiteral | null | undefined;
  content: string;
  isEditing?: boolean;
};

type TextLabelProps = {
  id: string;
  position: google.maps.LatLngLiteral;
  text: string;
  zoomLevel: number | null;
  onTextChange: (newText: string) => void;
  setSelectedTextId: (id: string | null) => void; // new prop
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
  setSelectedTextId,
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
      setSelectedTextId(id);
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
        className="text-white text-lg font-bold inline-block whitespace-nowrap z-1000 pointer-events-auto border-none cursor-pointer bg-green-100/0"
        style={{
          width: `${Math.max(8, inputValue.length * 8)}px`,
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
