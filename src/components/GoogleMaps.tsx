import {
  DrawingManager,
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";
import { useAbly } from "ably/react";
import { useEffect, useMemo, useRef, useState } from "react";
import MapActionBar from "./MapActionBar";

type Library = "places" | "geometry" | "visualization" | "drawing";
const libraries: Library[] = ["places", "geometry", "visualization", "drawing"];

interface Props {
  currentDrawingMode: google.maps.drawing.OverlayType | null;
  setCurrentDrawingMode: React.Dispatch<
    React.SetStateAction<google.maps.drawing.OverlayType | null>
  >;
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

  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(
    null
  );

  const center = useMemo(() => ({ lat: 18.52043, lng: 73.856743 }), []);

  const [markers, setMarkers] = useState<{
    [key: string]: google.maps.LatLngLiteral;
  }>({});

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
    return () => {
      newMarkerSubscription.unsubscribe();
      updateMarkerSubscription.unsubscribe();
      dragMarkerSubscription.unsubscribe();
    };
  }, []);

  console.log(markers, "===");

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

  console.log("MAPS", "########################++");

  return (
    <div className="h-full w-full">
      {!isLoaded ? (
        <h1>Loading...</h1>
      ) : (
        <>
          <GoogleMap
            mapContainerClassName="h-full w-full rounded border"
            center={center}
            zoom={10}
          >
            <DrawingManager
              ref={drawingManagerRef as React.RefObject<DrawingManager>}
              onMarkerComplete={onMarkerComplete}
              options={{
                drawingMode: currentDrawingMode,
                drawingControl: false,
                drawingControlOptions: {
                  position: window.google.maps.ControlPosition.TOP_CENTER,
                  drawingModes: [
                    window.google.maps.drawing.OverlayType.MARKER,
                    window.google.maps.drawing.OverlayType.POLYLINE,
                    window.google.maps.drawing.OverlayType.POLYGON,
                  ],
                },
              }}
            />
            {Object.entries(markers).map(([id, marker]) =>
              marker ? (
                <Marker
                  key={id}
                  position={marker}
                  draggable={true}
                  onDrag={(e) => handleDrag(e, id)}
                  onDragEnd={(e) => handleDragEnd(e, id)}
                />
              ) : null
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
