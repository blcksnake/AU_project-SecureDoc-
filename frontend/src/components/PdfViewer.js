import React, { useState, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import * as pdfjs from 'pdfjs-dist/build/pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

// Simple Page wrapper
const PageWithRef = (props) => <Page {...props} />;

const PdfViewer = ({
  file,
  redactionAreas,
  onRedactionAreasChange,
  selectedArea,
  onSelectedAreaChange
}) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const [scale, setScale] = useState(1.0);
  const containerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleMouseDown = (event) => {
    if (event.target.closest('.redaction-overlay')) return;

    // Try to get the canvas element directly
    const canvas = event.target.closest('canvas');
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (event) => {
    if (!isDrawing || !startPoint) return;

    // Try to get the canvas element directly
    const canvas = event.target.closest('canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    const newRect = {
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      width: Math.abs(x - startPoint.x),
      height: Math.abs(y - startPoint.y)
    };

    setCurrentRect(newRect);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect || currentRect.width < 5 || currentRect.height < 5) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentRect(null);
      return;
    }

    const newArea = {
      id: Date.now().toString(),
      pageNumber,
      x: currentRect.x,
      y: currentRect.y,
      width: currentRect.width,
      height: currentRect.height,
      redactionCode: 'PERSONAL_INFO',
      description: ''
    };

    onRedactionAreasChange([...redactionAreas, newArea]);
    onSelectedAreaChange(newArea);

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  };

  const handleAreaClick = (area) => {
    onSelectedAreaChange(area);
  };

  const handleAreaDelete = (areaId) => {
    const updatedAreas = redactionAreas.filter(area => area.id !== areaId);
    onRedactionAreasChange(updatedAreas);
    if (selectedArea && selectedArea.id === areaId) {
      onSelectedAreaChange(null);
    }
  };

  const getPageAreas = () => {
    return redactionAreas.filter(area => area.pageNumber === pageNumber);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          PDF Viewer - Page {pageNumber} of {numPages || '?'}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          >
            -
          </button>
          <span className="text-sm text-gray-600">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="px-4 py-2 text-sm bg-hipaa-blue text-white rounded disabled:bg-gray-300"
          >
            Previous
          </button>
          <button
            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || 1))}
            disabled={pageNumber >= numPages}
            className="px-4 py-2 text-sm bg-hipaa-blue text-white rounded disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      </div>

      <div className="relative inline-block">
        <div
          ref={containerRef}
          className="pdf-viewer"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ position: 'relative', cursor: 'crosshair' }}
        >
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="text-center py-8">Loading PDF...</div>}
            error={<div className="text-center py-8 text-red-600">Error loading PDF</div>}
          >
            <PageWithRef
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>

          {/* Redaction areas overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {getPageAreas().map((area) => (
              <div
                key={area.id}
                className={`redaction-overlay pointer-events-auto ${selectedArea && selectedArea.id === area.id ? 'selected' : ''
                  }`}
                style={{
                  left: area.x * scale,
                  top: area.y * scale,
                  width: area.width * scale,
                  height: area.height * scale,
                }}
                onClick={() => handleAreaClick(area)}
              >
                <button
                  className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 text-white text-xs rounded-full hover:bg-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAreaDelete(area.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            {/* Current drawing rectangle */}
            {isDrawing && currentRect && (
              <div
                className="redaction-overlay"
                style={{
                  left: currentRect.x * scale,
                  top: currentRect.y * scale,
                  width: currentRect.width * scale,
                  height: currentRect.height * scale,
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>Click and drag to create redaction areas. Click on existing areas to select them.</p>
        <p className="mt-1">
          <strong>Current page areas:</strong> {getPageAreas().length} redaction area(s)
        </p>
      </div>
    </div>
  );
};

export default PdfViewer;
