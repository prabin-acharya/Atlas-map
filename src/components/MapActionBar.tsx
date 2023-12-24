import React, { Dispatch, SetStateAction, useRef } from "react";
import { BiSolidPencil } from "react-icons/bi";
import { FaMapMarkerAlt } from "react-icons/fa";
import { PiPolygonFill } from "react-icons/pi";
import { RiImageFill } from "react-icons/ri";
import { RxText } from "react-icons/rx";
import { SlCursor } from "react-icons/sl";
import { DrawingMode } from "../types";

interface Props {
  currentDrawingMode: DrawingMode | null;
  setCurrentDrawingMode: Dispatch<SetStateAction<DrawingMode | null>>;
  googleMapInstance: google.maps.Map | null;
  mapChannel: any;
  currentZoomLevel: number;
  setImageOverlays: Dispatch<
    SetStateAction<{
      [key: string]: ImageOverlay;
    }>
  >;
  setShowOverlay: Dispatch<SetStateAction<boolean>>;
  center: google.maps.LatLngLiteral | undefined;
}

type ImageOverlay = {
  url: string;
  position: google.maps.LatLngLiteral;
  size: { width: number; height: number };
};

const MapActionBar: React.FC<Props> = ({
  currentDrawingMode,
  setCurrentDrawingMode,
  googleMapInstance,
  mapChannel,
  currentZoomLevel,
  setImageOverlays,
  setShowOverlay,
  center,
}) => {
  const baseStyle = "m-2 bg-blue-100 p-2 rounded";
  const activeStyle = "border-green-800";
  const inactiveStyle =
    "border-white hover:border-green-700 active:border-green-800";

  const getButtonStyle = (mode: DrawingMode | null) => {
    return `${baseStyle} border ${
      currentDrawingMode === mode ? activeStyle : inactiveStyle
    }`;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // Call your function here, passing the file
      handleImageDrop(file);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageDrop = (file: File) => {
    // Extract files
    const files = [file];

    console.log(files, "----");

    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.readAsDataURL(file);
      reader.onloadend = function () {
        // Create blob URL
        const imageBlobUrl = URL.createObjectURL(file);

        const tempImg = new Image();
        tempImg.src = imageBlobUrl;

        tempImg.onload = () => {
          const aspectRatio = tempImg.width / tempImg.height;

          // Retrieve map properties
          if (googleMapInstance) {
            const bounds = googleMapInstance.getBounds();

            if (bounds) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              const zoom = googleMapInstance.getZoom();

              if (zoom !== null && center) {
                const id = "image_" + Date.now().toString();

                const currentSize = {
                  height: 200,
                  width: 200 * aspectRatio,
                };

                const baseSize = {
                  height:
                    currentSize.height / Math.pow(2, currentZoomLevel! - 1),
                  width: currentSize.width / Math.pow(2, currentZoomLevel! - 1),
                };

                setImageOverlays((prev) => ({
                  ...prev,
                  [id]: {
                    url: imageBlobUrl,
                    position: center,
                    size: baseSize,
                  },
                }));

                mapChannel.publish("new-image", {
                  [id]: {
                    position: center,
                    url: imageBlobUrl,
                  },
                });
              }
            }
          }
        };
      };
    }
    setShowOverlay(false);
  };

  const calculateBounds = (
    latLng: google.maps.LatLng
  ): google.maps.LatLngBoundsLiteral => {
    const delta = 0.136; // This value can be adjusted based on how large you want the image overlay to be
    return {
      north: latLng.lat() + delta,
      south: latLng.lat() - delta,
      east: latLng.lng() + delta,
      west: latLng.lng() - delta,
    };
  };
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 p-1 px-2 rounded-md bg-white opacity-85 shadow-lg">
      <button
        className={getButtonStyle(null)}
        onClick={() => setCurrentDrawingMode(null)}
      >
        <SlCursor />
      </button>
      <button
        className={getButtonStyle(DrawingMode.MARKER)}
        onClick={() => setCurrentDrawingMode(DrawingMode.MARKER)}
      >
        {/* <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-green-800"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5 s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z" />
        </svg> */}
        <FaMapMarkerAlt />
      </button>
      <button
        className={getButtonStyle(DrawingMode.FREEHAND)}
        onClick={() => setCurrentDrawingMode(DrawingMode.FREEHAND)}
      >
        <BiSolidPencil />
      </button>
      <button
        className={getButtonStyle(DrawingMode.POLYLINE)}
        onClick={() => setCurrentDrawingMode(DrawingMode.POLYLINE)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-green-800"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <polyline
            points="2,14 5,6 9,11 14,2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="1" cy="14" r="2" fill="currentColor" />
          <circle cx="5" cy="6" r="2" fill="currentColor" />
          <circle cx="9" cy="11" r="2" fill="currentColor" />
          <circle cx="14" cy="2" r="2" fill="currentColor" />
        </svg>
      </button>

      <button
        className={getButtonStyle(DrawingMode.POLYGON)}
        onClick={() => setCurrentDrawingMode(DrawingMode.POLYGON)}
      >
        <PiPolygonFill />
      </button>
      <button
        className={getButtonStyle(DrawingMode.TEXT)}
        onClick={() => setCurrentDrawingMode(DrawingMode.TEXT)}
      >
        <RxText />
      </button>
      <button
        className={getButtonStyle(DrawingMode.IMAGE)}
        onClick={() => {
          setCurrentDrawingMode(DrawingMode.IMAGE);
          handleClick();
        }}
      >
        <RiImageFill />
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
      </button>
    </div>
  );
};

export default MapActionBar;
