import React, { Dispatch, SetStateAction } from "react";
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
}

const MapActionBar: React.FC<Props> = ({
  currentDrawingMode,
  setCurrentDrawingMode,
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
        onClick={() => setCurrentDrawingMode(DrawingMode.IMAGE)}
      >
        <RiImageFill />
      </button>
    </div>
  );
};

export default MapActionBar;
