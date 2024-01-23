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

  useEffect(() => {
    setInputValue(text);
  }, [text]);

  const calculateFontSize = () => {
    const fontSize = zoomLevel ? zoomLevel + 8 : 16;
    return fontSize + "px";
  };

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <input
        type="text"
        id={id}
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter text..."
        onClick={handleTextClick}
        onMouseDown={(e) => {
          if (e.detail == 1) {
            setSelectedItemId(id);
          }
        }}
        className="no-select text-white text-lg font-bold w-fit inline-block whitespace-nowrap z-1000 pointer-events-auto cursor-pointer bg-green-100/0 outline-none select-none  outline"
        style={{
          fontSize: calculateFontSize(),
        }}
      />
    </OverlayView>
  );
};

export default TextLabel;
