import { MapElement } from "../types";

export const fetchMapElements = async (mapId: string): Promise<any[]> => {
  try {
    const response = await fetch(
      `https://atlas-map-express-api.up.railway.app/map/${mapId}`
    );

    const data = await response.json();
    const savedElements = data.elements;
    const mapDetails = data.mapDetails;

    return [savedElements, mapDetails];
  } catch (error) {
    console.error(`Error while fetching elements`);
    return [];
  }
};

export const saveElementToDB = async (
  mapId: string,
  userId: string,
  element: MapElement
): Promise<void> => {
  try {
    const response = await fetch(
      "https://atlas-map-express-api.up.railway.app/mapElement",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mapId,
          userId,
          element,
        }),
      }
    );

    const data = await response.json();
    console.log(data.message);
  } catch (err) {
    console.log(err);
  }
};

export const updateElementInDB = async (
  id: string,
  updatedElement: {
    coords?: google.maps.LatLngLiteral | google.maps.LatLngLiteral[];
    text?: string;
  }
): Promise<void> => {
  try {
    const response = await fetch(
      `https://atlas-map-express-api.up.railway.app/mapElement/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updatedElement,
        }),
      }
    );
    const data = await response.json();
  } catch (err) {
    console.log(err);
  }
};

export const deleteElementFromDB = async (id: string): Promise<void> => {
  try {
    const response = await fetch(
      `https://atlas-map-express-api.up.railway.app/mapElement/${id}`,
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

export const updateMapDetails = async (
  mapId: string,
  center: { lng: number; lat: number },
  zoomLevel: number
): Promise<void> => {
  try {
    const response = await fetch(`http://localhost:5000/map/${mapId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ center, zoomLevel }),
    });

    const data = await response.json();

    console.log(data);
  } catch (error) {
    console.error("Error updating map:", error);
  }
};
