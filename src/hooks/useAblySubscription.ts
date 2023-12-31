import { Space } from "@ably/spaces";
import { useEffect } from "react";

type TextData = {
  position: google.maps.LatLngLiteral;
  text: string;
};

type ImageOverlay = {
  url: string;
  position: google.maps.LatLngLiteral;
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
          [key: string]: { text: string; position: google.maps.LatLngLiteral };
        };
        clientId: string;
      }) => {
        if (message.clientId == space?.client.auth.clientId) return;

        const id = Object.keys(message.data)[0];
        const { position, text } = message.data[id];

        setTexts((prev) => ({ ...prev, [id]: { position, text } }));
      }
    );

    const newImageSubscription = mapChannel.subscribe(
      "new-image",
      (message: {
        data: {
          [key: string]: {
            url: string;
            position: google.maps.LatLngLiteral;
            size: { width: number; height: number };
          };
        };
        clientId: string;
      }) => {
        if (message.clientId == space?.client.auth.clientId) return;

        const id = Object.keys(message.data)[0];
        const { url, position, size } = message.data[id];

        setImageOverlays((prev) => ({
          ...prev,
          [id]: { url, position, size },
        }));

        console.log("here-----------------!");
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
    };
  }, [mapChannel, space]);
};

export default useAblySubscription;
