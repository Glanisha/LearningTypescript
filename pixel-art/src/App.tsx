import React, { useState, useRef, useEffect } from 'react';

type GridSize = {
  width: number;
  height: number;
};

const App: React.FC = () => {
  const [gridSize, setGridSize] = useState<GridSize>({ width: 16, height: 16 });
  const [selectedColor, setSelectedColor] = useState<string>('#3b82f6');
  const [pixels, setPixels] = useState<Map<string, string>>(new Map());
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [recentColors, setRecentColors] = useState<string[]>(['#3b82f6']);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setGridSize({ width: 16, height: 16 });
      } else {
        setGridSize({ width: 32, height: 32 });
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getPixelKey = (x: number, y: number): string => {
    return `${x}-${y}`;
  };

  const addToRecentColors = (color: string): void => {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c !== color);
      const newRecent = [color, ...filtered];
      return newRecent.slice(0, 10); // Keep only 10 recent colors
    });
  };

  const handleColorChange = (color: string): void => {
    setSelectedColor(color);
    addToRecentColors(color);
  };

  const handlePixelClick = (x: number, y: number, event: React.MouseEvent): void => {
    const pixelKey = getPixelKey(x, y);
    const newPixels = new Map(pixels);
    
    if (event.shiftKey) {
      newPixels.delete(pixelKey);
    } else {
      newPixels.set(pixelKey, selectedColor);
      addToRecentColors(selectedColor);
    }
    
    setPixels(newPixels);
  };

  const handleTouchClick = (x: number, y: number, event: React.TouchEvent): void => {
    const pixelKey = getPixelKey(x, y);
    const newPixels = new Map(pixels);
    
    if (event.touches.length > 1) {
      newPixels.delete(pixelKey);
    } else {
      newPixels.set(pixelKey, selectedColor);
      addToRecentColors(selectedColor);
    }
    
    setPixels(newPixels);
  };

  const handleMouseDown = (): void => {
    setIsDrawing(true);
  };

  const handleMouseUp = (): void => {
    setIsDrawing(false);
  };

  const handlePixelMouseEnter = (x: number, y: number): void => {
    if (isDrawing) {
      const pixelKey = getPixelKey(x, y);
      const newPixels = new Map(pixels);
      newPixels.set(pixelKey, selectedColor);
      setPixels(newPixels);
      addToRecentColors(selectedColor);
    }
  };

  const handleTouchMove = (e: React.TouchEvent, x: number, y: number): void => {
    e.preventDefault();
    if (isDrawing) {
      const pixelKey = getPixelKey(x, y);
      const newPixels = new Map(pixels);
      newPixels.set(pixelKey, selectedColor);
      setPixels(newPixels);
      addToRecentColors(selectedColor);
    }
  };

  const downloadAsPNG = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = gridSize.width * 10;
    canvas.height = gridSize.height * 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pixels.forEach((color: string, key: string) => {
      const [x, y] = key.split('-').map(Number);
      ctx.fillStyle = color;
      ctx.fillRect(x * 10, y * 10, 10, 10);
    });

    canvas.toBlob((blob: Blob | null) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pixel-art.png';
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const downloadAsSVG = (): void => {
    const svgWidth = gridSize.width * 10;
    const svgHeight = gridSize.height * 10;
    
    let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
    
    pixels.forEach((color: string, key: string) => {
      const [x, y] = key.split('-').map(Number);
      svgContent += `<rect x="${x * 10}" y="${y * 10}" width="10" height="10" fill="${color}"/>`;
    });
    
    svgContent += '</svg>';
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pixel-art.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearCanvas = (): void => {
    setPixels(new Map());
  };

  const renderGrid = (): React.ReactElement[] => {
    const grid: React.ReactElement[] = [];
    const pixelSize = isMobile ? 'w-6 h-6' : 'w-4 h-4';
    
    for (let y = 0; y < gridSize.height; y++) {
      for (let x = 0; x < gridSize.width; x++) {
        const pixelKey = getPixelKey(x, y);
        const pixelColor = pixels.get(pixelKey) || 'transparent';
        
        grid.push(
          <div
            key={pixelKey}
            className={`${pixelSize} border border-gray-200 cursor-crosshair hover:border-blue-300 transition-colors`}
            style={{ backgroundColor: pixelColor }}
            onClick={(e: React.MouseEvent) => handlePixelClick(x, y, e)}
            onMouseEnter={() => handlePixelMouseEnter(x, y)}
            onMouseDown={handleMouseDown}
            onTouchStart={(e: React.TouchEvent) => {
              handleMouseDown();
              handleTouchClick(x, y, e);
            }}
            onTouchEnd={handleMouseUp}
            onTouchMove={(e) => handleTouchMove(e, x, y)}
          />
        );
      }
    }
    
    return grid;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white">
      {/* Mobile Header */}
      {isMobile && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Pixel Art Maker</h1>
        </div>
      )}

      {/* Sidebar - becomes top panel on mobile */}
      <div className={`${isMobile ? 'w-full p-4 border-b' : 'w-64 p-6 border-r'} border-gray-200 bg-gray-50`}>
        {!isMobile && (
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Pixel Art Maker</h1>
        )}
        
        {/* Color Picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={selectedColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorChange(e.target.value)}
              className="w-10 h-10 cursor-pointer rounded border border-gray-300"
            />
            <div className="text-sm text-gray-700">{selectedColor}</div>
          </div>
        </div>

        {/* Recent Colors */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recent Colors
          </label>
          <div className="flex flex-wrap gap-1">
            {recentColors.map((color, index) => (
              <button
                key={`${color}-${index}`}
                className={`w-8 h-8 rounded border-2 cursor-pointer transition-all ${
                  selectedColor === color ? 'border-blue-500 scale-110' : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Controls - horizontal on mobile */}
        <div className={`${isMobile ? 'flex gap-2 mb-4' : 'space-y-2'}`}>
          <button
            onClick={clearCanvas}
            className={`${isMobile ? 'flex-1' : 'w-full'} bg-white text-gray-800 py-2 px-4 rounded border border-gray-300 hover:bg-gray-100 transition-colors`}
          >
            Clear
          </button>
          <button
            onClick={downloadAsPNG}
            className={`${isMobile ? 'flex-1' : 'w-full'} bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors`}
          >
            PNG
          </button>
          <button
            onClick={downloadAsSVG}
            className={`${isMobile ? 'flex-1' : 'w-full'} bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors`}
          >
            SVG
          </button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-600 mt-4">
          <p className="mb-1">• Click to paint</p>
          <p className="mb-1">• Drag to paint continuously</p>
          <p className="mb-1">• Shift+click to erase</p>
          <p>• Two-finger tap to erase (mobile)</p>
        </div>

        {/* Grid Info */}
        {!isMobile && (
          <div className="mt-6 text-xs text-gray-500">
            <p>Grid: {gridSize.width} × {gridSize.height}</p>
            <p>Pixels painted: {pixels.size}</p>
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 p-4 overflow-auto bg-white">
        <div className="flex justify-center items-center h-full">
          <div 
            className={`inline-grid gap-0 border border-gray-300 bg-white ${isMobile ? 'shadow-sm' : 'shadow-md'} rounded`}
            style={{ 
              gridTemplateColumns: `repeat(${gridSize.width}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize.height}, 1fr)`
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {renderGrid()}
          </div>
        </div>
      </div>

      {/* Hidden canvas for PNG export */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default App;