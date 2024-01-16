import { Space } from "@ably/spaces";
import { useEffect } from "react";

type TextData = {
  coords: google.maps.LatLngLiteral;
  text: string;
};

type ImageOverlay = {
  url: string;
  coords: google.maps.LatLngLiteral;
  size: { width: number; height: number };
};

const useAblySubscription = (
  mapChannel: any,
  freehandChannel: any,
  setMarkers: React.Dispatch<
    React.SetStateAction<Record<string, google.maps.LatLngLiteral>>
  >,
  setPolylines: React.Dispatch<
    React.SetStateAction<{ [key: string]: google.maps.LatLngLiteral[] }>
  >,
  setTexts: React.Dispatch<React.SetStateAction<Record<string, TextData>>>,
  setFreehandPaths: React.Dispatch<
    React.SetStateAction<Record<string, google.maps.LatLngLiteral[]>>
  >,
  setPolygons: React.Dispatch<
    React.SetStateAction<{
      [key: string]: google.maps.LatLngLiteral[];
    }>
  >,
  setImageOverlays: React.Dispatch<
    React.SetStateAction<{
      [key: string]: ImageOverlay;
    }>
  >,
  space?: Space
) => {
  useEffect(() => {
    const newMarkerSubscription = mapChannel.subscribe(
      "new-marker",
      (message: {
        data: { id: string; lat: number; lng: number };
        clientId: string;
      }) => {
        if (message.clientId == space?.client.auth.clientId) return;
        const { id, ...newMarker } = message.data;
        console.log();
        setMarkers((prevMarkers) => ({ ...prevMarkers, [id]: newMarker }));
      }
    );

    const updateMarkerSubscription = mapChannel.subscribe(
      "update-marker",
      (message: {
        data: { id: string; lat: number; lng: number };
        clientId: string;
      }) => {
        const { id, ...updatedMarker } = message.data;
        setMarkers((prevMarkers) => ({ ...prevMarkers, [id]: updatedMarker }));
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
        setMarkers((prevMarkers) => ({
          ...prevMarkers,
          [id]: draggedMarker,
        }));
      }
    );

    const updateTextSubscription = mapChannel.subscribe(
      "update-text",
      (message: {
        data: {
          id: string;
          updatedText: string;
        };
        clientId: string;
      }) => {
        if (message.clientId == space?.client.auth.clientId) return;

        const { id, updatedText } = message.data;
        setTexts((prev) => ({
          ...prev,
          [id]: { ...prev[id], text: updatedText },
        }));
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
        setTexts((prev) => ({
          ...prev,
          [id]: { ...prev[id], position },
        }));
      }
    );

    const newPolylineSubscription = mapChannel.subscribe(
      "new-polyline",
      (message: {
        data: { [key: string]: { lat: number; lng: number }[] };
        clientId: string;
      }) => {
        if (message.clientId == space?.client.auth.clientId) return;

        const id = Object.keys(message.data)[0];
        const points = message.data[id];
        setPolylines((prev) => ({
          ...prev,
          [id]: points,
        }));
      }
    );

    const newFreehnadSubscription = mapChannel.subscribe(
      "new-freehand",
      (message: {
        data: { [key: string]: { lat: number; lng: number }[] };
        clientId: string;
      }) => {
        if (message.clientId == space?.client.auth.clientId) return;

        const id = Object.keys(message.data)[0];
        const points = message.data[id];
        setFreehandPaths((prev) => ({ ...prev, [id]: points }));
      }
    );

    const newPolygonSubscription = mapChannel.subscribe(
      "new-polygon",
      (message: {
        data: { [key: string]: { lat: number; lng: number }[] };
        clientId: string;
      }) => {
        if (message.clientId == space?.client.auth.clientId) return;

        const id = Object.keys(message.data)[0];
        const points = message.data[id];
        setPolygons((prev) => ({ ...prev, [id]: points }));
      }
    );

    const newTextSubscription = mapChannel.subscribe(
      "new-text",
      (message: {
        data: {
          [key: string]: { text: string; coords: google.maps.LatLngLiteral };
        };
        clientId: string;
      }) => {
        if (message.clientId == space?.client.auth.clientId) return;

        const id = Object.keys(message.data)[0];
        const { coords, text } = message.data[id];

        setTexts((prev) => ({ ...prev, [id]: { coords, text } }));
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
      newMarkerSubscription.unsubscribe();
      updateMarkerSubscription.unsubscribe();
      dragMarkerSubscription.unsubscribe();
      newTextSubscription.unsubscribe();
      updateTextSubscription.unsubscribe();
      dragTextSubscription.unsubscribe();
      newPolylineSubscription.unsubscribe();
      newFreehnadSubscription.unsubscribe();
      newPolygonSubscription.unsubscribe();
      newImageSubscription.unsubscribe();
    };
  }, [mapChannel, space]);
};

export default useAblySubscription;
