import { Space } from "@ably/spaces";
import { useEffect } from "react";
import { MapElement } from "../types";

type ImageOverlay = {
  url: string;
  coords: google.maps.LatLngLiteral;
  size: { width: number; height: number };
};

const useAblySubscription = (
  mapChannel: any,
  freehandChannel: any,
  setMapElements: React.Dispatch<React.SetStateAction<MapElement[]>>,
  setImageOverlays: React.Dispatch<
    React.SetStateAction<{
      [key: string]: ImageOverlay;
    }>
  >,
  space?: Space
) => {
  useEffect(() => {
    const addElementSubscription = mapChannel.subscribe(
      "new-element",
      (message: { data: MapElement; clientId: string }) => {
        if (message.clientId == space?.client.auth.clientId) return;
        setMapElements((prev) => [...prev, message.data]);
      }
    );

    const updateElementSubscription = mapChannel.subscribe(
      "update-element",
      (message: { data: MapElement; clientId: string }) => {
        if (message.clientId == space?.client.auth.clientId) return;
        setMapElements((prev) => [...prev, message.data]);
        setMapElements((prevElements) => {
          const updatedData = prevElements.map((element) => {
            if (element.id == message.data.id)
              return { ...element, ...{ ...message.data } };
            return element;
          });
          return updatedData;
        });
      }
    );

    const updateMarkerSubscription = mapChannel.subscribe(
      "update-marker",
      (message: {
        data: { id: string; lat: number; lng: number };
        clientId: string;
      }) => {
        const { id, ...updatedMarker } = message.data;
        // setMarkers((prevMarkers) => ({ ...prevMarkers, [id]: updatedMarker }));
        setMapElements((prevElements) => {
          const updatedData = prevElements.map((element) => {
            if (element.id == id)
              return { ...element, ...{ id, coords: updatedMarker } };
            return element;
          });
          return updatedData;
        });
      }
    );

    const dragMarkerSubscription = mapChannel.subscribe(
      "drag-marker",
      (message: {
        data: { id: string; lat: number; lng: number };
        clientId: string;
      }) => {
        if (message.clientId == space?.client.auth.clientId) return;

        const { id, ...draggedMarker } = message.data;
        // setMarkers((prevMarkers) => ({
        //   ...prevMarkers,
        //   [id]: draggedMarker,
        // }));

        setMapElements((prevElements) => {
          const updatedData = prevElements.map((element) => {
            if (element.id == id)
              return { ...element, ...{ id, coords: draggedMarker } };
            return element;
          });
          return updatedData;
        });
      }
    );

    const dragTextSubscription = mapChannel.subscribe(
      "drag-text",
      (message: {
        data: {
          id: string;
          position: { lat: number; lng: number };
        };
        clientId: string;
      }) => {
        if (message.clientId == space?.client.auth.clientId) return;

        const { id, position } = message.data;
        // setTexts((prev) => ({
        //   ...prev,
        //   [id]: { ...prev[id], position },
        // }));
        setMapElements((prevElements) => {
          const updatedData = prevElements.map((element) => {
            if (element.id == id)
              return { ...element, ...{ id, coords: position } };
            return element;
          });
          return updatedData;
        });
      }
    );

    const newImageSubscription = mapChannel.subscribe(
      "new-image",
      (message: {
        data: {
          [key: string]: {
            url: string;
            coords: google.maps.LatLngLiteral;
            size: { width: number; height: number };
            imageBase64: string;
          };
        };
        clientId: string;
      }) => {
        if (message.clientId == space?.client.auth.clientId) return;

        const id = Object.keys(message.data)[0];
        const { url, coords, size, imageBase64 } = message.data[id];

        const tempImg = new Image();
        tempImg.src = imageBase64;
        const imageData = imageBase64;

        const byteCharacters = atob(imageData.split(",")[1]);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/jpeg" });
        const imageBlobUrl = URL.createObjectURL(blob);

        setImageOverlays((prev) => ({
          ...prev,
          [id]: { url: imageBlobUrl, coords, size },
        }));
      }
    );

    return () => {
      // newMarkerSubscription.unsubscribe();
      addElementSubscription.unsubscribe();
      updateElementSubscription.unsubscribe();
      updateMarkerSubscription.unsubscribe();
      dragMarkerSubscription.unsubscribe();
      dragTextSubscription.unsubscribe();
      newImageSubscription.unsubscribe();
    };
  }, [mapChannel, space]);
};

export default useAblySubscription;
