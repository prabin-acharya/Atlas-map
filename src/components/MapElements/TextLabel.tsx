import { OverlayView } from "@react-google-maps/api";
import { useEffect, useState } from "react";

type TextLabelProps = {
  id: string;
  position: google.maps.LatLngLiteral;
  text: string;
  zoomLevel: number | null;
  onTextChange: (newText: string) => void;
  setSelectedItemId: (id: string | null) => void;
};

const TextLabel: React.FC<TextLabelProps> = ({
  id,
  position,
  text,
  zoomLevel,
  onTextChange,
  setSelectedItemId,
}) => {
  const handleTextClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    e.currentTarget.focus();
  };

  const [inputValue, setInputValue] = useState(text);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onTextChange(newValue);
  };

  const handleInputBlur = () => {
    onTextChange(inputValue);
  };

  useEffect(() => {
    setInputValue(text);
  }, [text]);

  const calculateFontSize = () => {
    const fontSize = zoomLevel ? zoomLevel + 8 : 16;
    return fontSize + "px";
  };

  // ================---------------------------------------

  const onOverlayLoad = (overlay: google.maps.OverlayView) => {
    const div = overlay.getPanes()?.overlayMouseTarget as
      | HTMLElement
      | null
      | undefined;

    if (!div) return;

    const handleMouseDown = (e: globalThis.MouseEvent): void => {
      setSelectedItemId(id);
    };

    div.addEventListener("mousedown", handleMouseDown);

    return () => {
      div.removeEventListener("mousedown", handleMouseDown);
    };
  };

  // console.log(text);

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      onLoad={onOverlayLoad}
    >
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter text..."
        // onBlur={handleInputBlur}
        onClick={handleTextClick}
        className="no-select text-white text-lg font-bold w-fit inline-block p-4 whitespace-nowrap z-1000 pointer-events-auto border-none cursor-pointer bg-green-100/0 outline-none select-none border-2 border-red-600"
        style={{
          fontSize: calculateFontSize(),
        }}
      />
    </OverlayView>
  );
};

export default TextLabel;
