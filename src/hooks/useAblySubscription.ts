import { Space } from "@ably/spaces";
import { useEffect } from "react";

type TextData = {
  position: google.maps.LatLngLiteral;
  text: string;
};

const useAblySubscription = (
  mapChannel: any,
  setMarkers: React.Dispatch<
    React.SetStateAction<Record<string, google.maps.LatLngLiteral>>
  >,
  setPolylines: React.Dispatch<
    React.SetStateAction<{ [key: string]: google.maps.LatLngLiteral[] }>
  >,
  setTexts: React.Dispatch<React.SetStateAction<Record<string, TextData>>>,
  space?: Space
) => {
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

    const newTextSubscription = mapChannel.subscribe(
      "new-text",
      (message: {
        data: {
          id: string;
          text: string;
          position: { lat: number; lng: number };
        };
      }) => {
        const { id, ...newText } = message.data;
        setTexts((prevTexts) => ({ ...prevTexts, [id]: newText }));
      }
    );

    const updateTextSubscription = mapChannel.subscribe(
      "update-text",
      (message: {
        data: {
          id: string;
          text: string;
          position: { lat: number; lng: number };
        };
      }) => {
        const { id, ...updatedText } = message.data;
        setTexts((prevTexts) => ({
          ...prevTexts,
          [id]: updatedText,
        }));
      }
    );

    const dragTextSubscription = mapChannel.subscribe(
      "drag-text",
      (message: {
        data: {
          id: string;
          text: string;
          position: { lat: number; lng: number };
        };
      }) => {
        const { id, ...draggedText } = message.data;
        setTexts((prevTexts) => ({
          ...prevTexts,
          [id]: draggedText,
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
      newTextSubscription.unsubscribe();
      updateTextSubscription.unsubscribe();
      dragTextSubscription.unsubscribe();
      newPolylineSubscription.unsubscribe();
    };
  }, [mapChannel]);
};

export default useAblySubscription;
