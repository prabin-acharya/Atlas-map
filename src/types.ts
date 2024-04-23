export enum DrawingMode {
  MARKER = "MARKER",
  FREEHAND = "FREEHAND",
  POLYGON = "POLYGON",
  POLYLINE = "POLYLINE",
  TEXT = "TEXT",
  URL = "URL",
  IMAGE = "IMAGE",
}

export type Library = "places" | "geometry" | "visualization" | "drawing";

export type MarkerData = {
  id: string;
  coords: google.maps.LatLngLiteral;
};

export type PolylineData = {
  id: string;
  coords: google.maps.LatLngLiteral[];
};

export type TextData = {
  id: string;
  coords: google.maps.LatLngLiteral;
  text: string;
};

export type ImageOverlay = {
  url: string;
  coords: google.maps.LatLngLiteral;
  size: { width: number; height: number };
};

export type MapElement = MarkerData | PolylineData | TextData;
