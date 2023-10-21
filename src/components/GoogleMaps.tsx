import {
  DrawingManager,
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
import { DrawingMode } from "../types";
import MapActionBar from "./MapActionBar";

type Library = "places" | "geometry" | "visualization" | "drawing";
const libraries: Library[] = ["places", "geometry", "visualization", "drawing"];

interface Props {
  currentDrawingMode: DrawingMode | null;
  setCurrentDrawingMode: Dispatch<SetStateAction<DrawingMode | null>>;
}

const GoogleMaps: React.FC<Props> = ({
  currentDrawingMode,
  setCurrentDrawingMode,
}) => {
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

  useEffect(() => {
    let mousedownListener: google.maps.MapsEventListener | null = null;
    let mousemoveListener: google.maps.MapsEventListener | null = null;
    let mouseupListener: google.maps.MapsEventListener | null = null;
    let clickListener: google.maps.MapsEventListener | null = null;

    const onClick = (e: google.maps.MapMouseEvent) => {
      console.log("Clickkkkkkk!!!!!!!");
      if (currentDrawingMode !== "MARKER") return;
      const id = Date.now().toString();
      setMarkers((prev) => ({ ...prev, [id]: e.latLng.toJSON() }));
    };

    const onMouseDown = (e: google.maps.MapMouseEvent) => {
      setIsDrawing(true);
      setCurrentPath([e.latLng.toJSON()]);
      console.log("mouseDown");
      if (googleMapInstance) {
        googleMapInstance.setOptions({ draggable: false });
      }
    };

    const onMouseMove = (e: google.maps.MapMouseEvent) => {
      if (!isDrawing) return;
      console.log("mouseMove");
      setCurrentPath((prev) => [...prev, e.latLng.toJSON()]);
    };

    const onMouseUp = () => {
      setIsDrawing(false);
      const id = Date.now().toString();
      setFreehandPaths((prev) => ({ ...prev, [id]: currentPath }));
      setCurrentPath([]);
      console.log("MouseUp");
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
      document.removeEventListener("mouseup", onMouseUpGlobal);
    };
  }, [isDrawing, currentPath, googleMapInstance, markers]);

  console.log("MAPS", "########################++");

  console.log(currentPath);

  return (
    <div className="h-full w-full">
      {!isLoaded ? (
        <h1>Loading...</h1>
      ) : (
        <>
          <GoogleMap
            onLoad={(map) => setGoogleMapInstance(map)}
            // ref={googleMapRef}
            mapContainerClassName="h-full w-full rounded border"
            center={center}
            zoom={10}
          >
            {/* {Object.entries(markers).map(([id, marker]) =>
              marker ? (
                <Marker
                  key={id}
                  position={marker}
                  draggable={true}
                  onDrag={(e) => handleDrag(e, id)}
                  onDragEnd={(e) => handleDragEnd(e, id)}
                />
              ) : null
            )} */}
            {Object.entries(markers).map(([id, position]) => (
              <Marker
                key={id}
                position={position}
                draggable={true}
                onDrag={(e) => handleDrag(e, id)}
                onDragEnd={(e) => handleDragEnd(e, id)}
              />
            ))}
            {/* {Object.entries(polylines).map(([id, points]) => (
              <Polyline key={id} path={points} />
            ))} */}
            {Object.entries(freehandPaths).map(([id, path]) => (
              <Polyline
                key={id}
                path={path}
                options={{ strokeColor: "#FF0000" }}
              />
            ))}
            {isDrawing && (
              <Polyline
                path={currentPath}
                options={{ strokeColor: "#00FF00" }}
              />
            )}
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
