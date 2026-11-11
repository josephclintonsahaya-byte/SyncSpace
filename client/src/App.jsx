
import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Line, Rect, Text } from "react-konva";
import socket from "./socket";

function App() {
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const currentLineId = useRef(null);
  const [isRectangle, setIsRectangle] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);
const [startPosition, setStartPosition] = useState(null);
const [isTextMode, setIsTextMode] = useState(false);
const [textInput, setTextInput] = useState("");
const [currentText, setCurrentText] = useState(null);

  // Receive other users' drawings
  useEffect(() => {
    const handleRemoteDrawing = (data) => {
      setLines((previousLines) => {
        const existingLine = previousLines.some(
          (line) => line.id === data.id
        );

        if (existingLine) {
          return previousLines.map((line) =>
            line.id === data.id ? data : line
          );
        }

        return [...previousLines, data];
      });
    };

    const handleRemoteClear = () => {
      setLines([]);
    };

    socket.on("drawing", handleRemoteDrawing);
    socket.on("clearCanvas", handleRemoteClear);

    return () => {
      socket.off("drawing", handleRemoteDrawing);
      socket.off("clearCanvas", handleRemoteClear);
    };
  }, []);

  // Start drawing
  

const handleMouseDown = (e) => {
  const pos = e.target.getStage().getPointerPosition();

 if (isTextMode && textInput.trim()) {
  const newText = {
    id: crypto.randomUUID(),
    type: "text",
    x: pos.x,
    y: pos.y,
    text: textInput,
    color: brushColor,
    fontSize: 24,
  };

  setLines((previousLines) => [
    ...previousLines,
    newText,
  ]);

  socket.emit("drawing", newText);

  setCurrentText(null);
  return;
}
  if (isRectangle) {
    setStartPosition({
      x: pos.x,
      y: pos.y,
    });
    return;
  }

  const newLine = {
    id: crypto.randomUUID(),
    points: [pos.x, pos.y],
    color: isEraser ? "white" : brushColor,
    width: isEraser ? 20 : brushSize,
  };

  currentLineId.current = newLine.id;

  setIsDrawing(true);

  setLines((previousLines) => [
    ...previousLines,
    newLine,
  ]);

  socket.emit("drawing", newLine);
};


  // Continue drawing
  

const handleMouseMove = (e) => {
  const pos = e.target.getStage().getPointerPosition();

  // Rectangle drawing
  if (isRectangle && startPosition) {
    setCurrentRect({
      x: Math.min(startPosition.x, pos.x),
      y: Math.min(startPosition.y, pos.y),
      width: Math.abs(pos.x - startPosition.x),
      height: Math.abs(pos.y - startPosition.y),
    });

    return;
  }

  // Existing freehand drawing
  if (!isDrawing || !currentLineId.current) return;

  const lineId = currentLineId.current;

  setLines((previousLines) => {
    const currentLine = previousLines.find(
      (line) => line.id === lineId
    );

    if (!currentLine) return previousLines;

    const updatedLine = {
      ...currentLine,
      points: [...currentLine.points, pos.x, pos.y],
    };

    socket.emit("drawing", updatedLine);

    return previousLines.map((line) =>
      line.id === lineId ? updatedLine : line
    );
  });
};

  // Stop drawing
 

const handleMouseUp = (e) => {
  if (isRectangle && startPosition) {
    const pos = e.target.getStage().getPointerPosition();

    const rect = {
      x: Math.min(startPosition.x, pos.x),
      y: Math.min(startPosition.y, pos.y),
      width: Math.abs(pos.x - startPosition.x),
      height: Math.abs(pos.y - startPosition.y),
    };

    if (rect.width > 0 && rect.height > 0) {
      const newRect = {
        id: crypto.randomUUID(),
        type: "rectangle",
        ...rect,
        color: brushColor,
        strokeWidth: brushSize,
      };

      setLines((previousLines) => [
        ...previousLines,
        newRect,
      ]);

      socket.emit("drawing", newRect);
    }

    setCurrentRect(null);
    setStartPosition(null);
    return;
  }

  setIsDrawing(false);
  currentLineId.current = null;
};


  // Clear canvas for all users
  const handleClearCanvas = () => {
    setLines([]);
    socket.emit("clearCanvas");
  };

  return (
    <div>
      <h1>SyncSpace Whiteboard</h1>

      {/* Toolbar */}
      <div className="toolbar">
        <label>Color:</label>

        <input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
        />

        <label>Size:</label>

        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
        />

        <span>{brushSize}px</span>

        <button onClick={() => setIsEraser(!isEraser)}>
          {isEraser ? "Brush" : "Eraser"}
        </button>

        <button onClick={() => setIsRectangle(!isRectangle)}>
  {isRectangle ? "Brush" : "Rectangle"}
</button>

<input
  type="text"
  placeholder="Enter text..."
  value={textInput}
  onChange={(e) => setTextInput(e.target.value)}
/>

<button onClick={() => setIsTextMode(!isTextMode)}>
  {isTextMode ? "Brush" : "Text"}
</button>

        <button onClick={handleClearCanvas}>
          Clear Canvas
        </button>
      </div>

      {/* Whiteboard */}
      <Stage
        width={800}
        height={500}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >

        
       <Layer>
  {/* Whiteboard background */}
  <Rect
    width={800}
    height={500}
    fill="white"
    listening={false}
  />

  {/* Permanent drawings */}
  {lines.map((shape) => {
  if (shape.type === "rectangle") {
    return (
      <Rect
        key={shape.id}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        stroke={shape.color}
        strokeWidth={shape.strokeWidth}
        fill="rgba(0,0,0,0)"
      />
    );
  }

  if (shape.type === "text") {
    return (
      <Text
        key={shape.id}
        x={shape.x}
        y={shape.y}
        text={shape.text}
        fontSize={shape.fontSize}
        fill={shape.color}
      />
    );
  }

  return (
    <Line
      key={shape.id}
      points={shape.points}
      stroke={shape.color}
      strokeWidth={shape.width}
      lineCap="round"
      lineJoin="round"
    />
  );
})}

  {/* Rectangle preview */}
  {currentRect && (
    <Rect
      x={currentRect.x}
      y={currentRect.y}
      width={currentRect.width}
      height={currentRect.height}
      stroke={brushColor}
      strokeWidth={2}
      fill="rgba(0,0,0,0)"
      listening={false}
    />
  )}

  {currentText && (
  <Text
    x={currentText.x}
    y={currentText.y}
    text={currentText.text}
    fontSize={currentText.fontSize}
    fill={currentText.color}
    listening={false}
  />
)}
</Layer>
      </Stage>
    </div>
  );
}

export default App;
