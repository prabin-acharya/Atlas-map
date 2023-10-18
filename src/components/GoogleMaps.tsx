import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useMemo } from "react";

const GoogleMaps = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });
  const center = useMemo(() => ({ lat: 18.52043, lng: 73.856743 }), []);

  console.log("MAPS", "########################");

  return (
    <div className="h-full w-full">
      {!isLoaded ? (
        <h1>Loading...</h1>
      ) : (
        <GoogleMap
          // mapContainerClassName="map-container"
          mapContainerClassName="h-full w-full rounded border"
          center={center}
          zoom={10}
        />
      )}
    </div>
  );
};

export default GoogleMaps;
