import {
  DrawingManager,
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";
import { useMemo, useRef } from "react";
import MapActionBar from "./MapActionBar";

const GoogleMaps = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places", "geometry", "visualization", "drawing"],
  });
  const center = useMemo(() => ({ lat: 18.52043, lng: 73.856743 }), []);

  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(
    null
  );

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
    console.log(path);
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
          </GoogleMap>

          {/* <MapActionBar
            onAddMarker={handleAddMarker}
            onDrawPath={handleDrawPath}
            onDrawPolygon={handleDrawPolygon}
          /> */}
        </>
      )}
    </div>
  );
};

export default GoogleMaps;
