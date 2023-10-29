import React, { Dispatch, SetStateAction } from "react";
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
    "border-white hover:border-green-500 active:border-green-800";

  const getButtonStyle = (mode: DrawingMode | null) => {
    return `${baseStyle} border ${
      currentDrawingMode === mode ? activeStyle : inactiveStyle
    }`;
  };

  return (
    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10 p-1 px-2 rounded-md bg-white opacity-85 shadow-lg">
      <button
        className={getButtonStyle(null)}
        onClick={() => setCurrentDrawingMode(null)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-green-800"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2L10.59 3.41 18.17 11H2v2h16.17l-7.58 7.59L12 22l10-10-10-10z" />
        </svg>
      </button>
      <button
        className={getButtonStyle(DrawingMode.MARKER)}
        onClick={() => setCurrentDrawingMode(DrawingMode.MARKER)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-green-800"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5 s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z" />
        </svg>
      </button>
      <button
        className={getButtonStyle(DrawingMode.FREEHAND)}
        onClick={() => setCurrentDrawingMode(DrawingMode.FREEHAND)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-green-800"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3,21c0.4,0,0.8-0.2,1-0.6L20.4,3.6c0.4-0.8,0.1-1.7-0.7-2.1c-0.8-0.4-1.7-0.1-2.1,0.7L1.6,19.1C1.2,19.9,1.5,21,2.3,21H3z" />
        </svg>
      </button>
      <button
        className={getButtonStyle(DrawingMode.POLYLINE)}
        onClick={() => setCurrentDrawingMode(DrawingMode.POLYLINE)}
      >
        PL
      </button>
      <button
        className={getButtonStyle(DrawingMode.TEXT)}
        onClick={() => setCurrentDrawingMode(DrawingMode.TEXT)}
      >
        T
      </button>
    </div>
  );
};

export default MapActionBar;
