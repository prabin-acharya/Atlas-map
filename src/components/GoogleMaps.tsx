import {
  DrawingManager,
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";
import { useAbly } from "ably/react";
import { useEffect, useMemo, useRef, useState } from "react";

type Library = "places" | "geometry" | "visualization" | "drawing";
const libraries: Library[] = ["places", "geometry", "visualization", "drawing"];

const GoogleMaps = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const center = useMemo(() => ({ lat: 18.52043, lng: 73.856743 }), []);

  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(
    null
  );

  //
  //

  const client = useAbly();
  const mapChannel = client.channels.get("map-updates");

  const [markers, setMarkers] = useState<
    Array<google.maps.LatLngLiteral | undefined>
  >([]);

  useEffect(() => {
    const subscription = mapChannel.subscribe(
      "new-marker",
      (message: { data: google.maps.LatLngLiteral }) => {
        const newMarker = message.data;

        if (newMarker) {
          setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  //
  const onMarkerComplete = (marker: google.maps.Marker) => {
    const newMarker = marker.getPosition()?.toJSON();

    if (newMarker) {
      setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
      mapChannel.publish("new-marker", newMarker);
    }
  };

  console.log("MAPS", "########################");

  const onPolygonComplete = (polygon: google.maps.Polygon) => {
    const path = polygon
      .getPath()
      .getArray()
      .map((coord) => {
        return {
          lat: coord.lat(),
          lng: coord.lng(),
        };
      });
  };

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
              onPolygonComplete={onPolygonComplete}
              options={{
                drawingMode: null, // Start without any drawing mode
                drawingControl: true,
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
            {markers.map((marker, index) =>
              marker ? <Marker key={index} position={marker} /> : null
            )}
          </GoogleMap>
        </>
      )}
    </div>
  );
};

export default GoogleMaps;
