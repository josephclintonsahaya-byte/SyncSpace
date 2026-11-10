
import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Line, Rect } from "react-konva";
import socket from "./socket";

function App() {
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const currentLineId = useRef(null);

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

  const newLine = {
    id: crypto.randomUUID(),
    points: [pos.x, pos.y],
    color: isEraser ? "white" : brushColor,
    width: isEraser ? 20 : brushSize,
  };

  // Store current stroke ID
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
  if (!isDrawing || !currentLineId.current) return;

  const stage = e.target.getStage();
  const pos = stage.getPointerPosition();

  const lineId = currentLineId.current;

  setLines((previousLines) => {
    const currentLine = previousLines.find(
      (line) => line.id === lineId
    );

    if (!currentLine) return previousLines;

    const updatedLine = {
      ...currentLine,
      points: [
        ...currentLine.points,
        pos.x,
        pos.y,
      ],
    };

    socket.emit("drawing", updatedLine);

    return previousLines.map((line) =>
      line.id === lineId ? updatedLine : line
    );
  });
};


  // Stop drawing
 

const handleMouseUp = () => {
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
          <Rect
            width={800}
            height={500}
            fill="white"
            listening={false}
          />

          {lines.map((line) => (
            <Line
              key={line.id}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.width}
              lineCap="round"
              lineJoin="round"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
