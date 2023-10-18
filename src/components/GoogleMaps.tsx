import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useMemo } from "react";
import MapActionBar from "./MapActionBar";

const GoogleMaps = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });
  const center = useMemo(() => ({ lat: 18.52043, lng: 73.856743 }), []);

  const handleAddMarker = () => {
    console.log("Add Marker clicked");
  };

  const handleDrawPath = () => {
    console.log("Draw Line clicked");
  };

  const handleDrawPolygon = () => {
    console.log("Draw Polygon clicked");
  };

  console.log("MAPS", "########################");

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
          />
          <MapActionBar
            onAddMarker={handleAddMarker}
            onDrawPath={handleDrawPath}
            onDrawPolygon={handleDrawPolygon}
          />
        </>
      )}
    </div>
  );
};

export default GoogleMaps;
