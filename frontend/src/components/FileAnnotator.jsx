import React, { useRef, useState, useEffect } from 'react';
import { Pen, Eraser, Type, Undo, Trash2, Save, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const FileAnnotator = ({ fileUrl, initialAnnotations = [], onSave, onSaveImage, readOnly = false }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pen'); // pen, eraser, text
    const [color, setColor] = useState('#ef4444'); // red-500 default
    const [lineWidth, setLineWidth] = useState(3);
    const [annotations, setAnnotations] = useState(initialAnnotations || []);
    const [currentPath, setCurrentPath] = useState([]);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Load initial annotations or image
    useEffect(() => {
        if (initialAnnotations) {
            setAnnotations(initialAnnotations);
        }
    }, [initialAnnotations]);

    // Setup Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resizeCanvas = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            redrawCanvas();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [imageLoaded, annotations]); // Redraw when image loads or annotations change

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        annotations.forEach(ann => {
            if (ann.type === 'path') {
                ctx.beginPath();
                ctx.strokeStyle = ann.color;
                ctx.lineWidth = ann.width;
                if (ann.points.length > 0) {
                    // Convert relative coords back to absolute if needed, or assume canvas size match
                    // Using percentages for responsiveness would be better, but assuming fixed size for MVP 
                    // or storing relative coordinates (x/width, y/height)

                    // Simple Drawing for MVP (assuming 1:1 scaling or relative)
                    // Let's implement relative coordinates for better resizing support
                    const first = ann.points[0];
                    ctx.moveTo(first.x * canvas.width, first.y * canvas.height);

                    for (let i = 1; i < ann.points.length; i++) {
                        const p = ann.points[i];
                        ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
                    }
                    ctx.stroke();
                }
            } else if (ann.type === 'text') {
                ctx.font = 'bold 16px sans-serif';
                ctx.fillStyle = ann.color;
                ctx.fillText(ann.text, ann.x * canvas.width, ann.y * canvas.height);
            }
        });
    };

    // Drawing Handlers
    const startDrawing = (e) => {
        if (readOnly) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / canvas.width;
        const y = (e.clientY - rect.top) / canvas.height;

        if (tool === 'text') {
            const text = prompt("Enter text annotation:");
            if (text) {
                const newAnn = { type: 'text', text, x, y, color };
                setAnnotations([...annotations, newAnn]);
                onSave([...annotations, newAnn]);
            }
            return;
        }

        setIsDrawing(true);
        setCurrentPath([{ x, y }]);

        // Immediate visual feedback
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
        ctx.moveTo(x * canvas.width, y * canvas.height);
    };

    const draw = (e) => {
        if (!isDrawing || readOnly) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / canvas.width;
        const y = (e.clientY - rect.top) / canvas.height;

        setCurrentPath(prev => [...prev, { x, y }]);

        const ctx = canvas.getContext('2d');
        // Continue from last point in currentPath (or approximate for performance)
        const last = currentPath[currentPath.length - 1];
        if (last) {
            ctx.beginPath();
            ctx.strokeStyle = tool === 'eraser' ? 'rgba(255,255,255,1)' : color;
            ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(last.x * canvas.width, last.y * canvas.height);
            ctx.lineTo(x * canvas.width, y * canvas.height);
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over'; // content
        }
    };

    const stopDrawing = () => {
        if (!isDrawing || readOnly) return;
        setIsDrawing(false);

        if (currentPath.length > 0) {
            // For eraser, we might simply accept the clearing or store "eraser paths". 
            // Storing eraser paths is complex for simple canvas. 
            // Simpler approach for MVP: Eraser just draws white (or background color) lines, or use globalCompositeOperation if rebuilding everything.
            // We'll treat eraser as a white pen for MVP simplicity on white papers.

            const newAnn = {
                type: 'path',
                points: currentPath,
                color: tool === 'eraser' ? '#ffffff' : color, // Simple 'white out'
                width: tool === 'eraser' ? 20 : lineWidth,
                isEraser: tool === 'eraser'
            };

            const updated = [...annotations, newAnn];
            setAnnotations(updated);
            onSave(updated);
        }
        setCurrentPath([]);
        redrawCanvas(); // Ensure clean render with full state
    };

    const handleClear = () => {
        if (confirm("Clear all annotations?")) {
            setAnnotations([]);
            onSave([]);
        }
    };

    const handleUndo = () => {
        const updated = annotations.slice(0, -1);
        setAnnotations(updated);
        onSave(updated);
    };

    const handleExportImage = () => {
        if (!onSaveImage) return;
        const canvas = canvasRef.current;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');

        // Draw background image if available
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = fileUrl;
        img.onload = () => {
            // Draw Image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Note: this assumes canvas matches aspect ratio, which our resize logic in useEffect tries to do but might be loose.
            // For production, we should map coordinates precisely. 
            // But for current MVP where canvas size ~ container size ~ image size attempt, this is okay.

            // Draw Annotations
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            annotations.forEach(ann => {
                if (ann.type === 'path') {
                    ctx.beginPath();
                    ctx.strokeStyle = ann.color;
                    ctx.lineWidth = ann.width;
                    if (ann.points.length > 0) {
                        const first = ann.points[0];
                        ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
                        for (let i = 1; i < ann.points.length; i++) {
                            const p = ann.points[i];
                            ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
                        }
                        ctx.stroke();
                    }
                } else if (ann.type === 'text') {
                    ctx.font = 'bold 16px sans-serif';
                    ctx.fillStyle = ann.color;
                    ctx.fillText(ann.text, ann.x * canvas.width, ann.y * canvas.height);
                }
            });

            tempCanvas.toBlob((blob) => {
                const file = new File([blob], "annotated_file.jpg", { type: "image/jpeg" });
                onSaveImage(file);
            }, 'image/jpeg', 0.8);
        };
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className={`p-2 bg-white border-b border-gray-200 flex items-center justify-between gap-2 ${readOnly ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-1">
                    <ToolButton active={tool === 'pen'} onClick={() => setTool('pen')} icon={Pen} title="Pen" color={tool === 'pen' ? color : 'current'} />
                    <ToolButton active={tool === 'text'} onClick={() => setTool('text')} icon={Type} title="Text Tool" />
                    <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={Eraser} title="Eraser" />
                    <div className="w-px h-6 bg-gray-200 mx-2"></div>

                    {/* Color Picker */}
                    <ColorButton color="#ef4444" active={color === '#ef4444'} onClick={() => setColor('#ef4444')} />
                    <ColorButton color="#22c55e" active={color === '#22c55e'} onClick={() => setColor('#22c55e')} />
                    <ColorButton color="#3b82f6" active={color === '#3b82f6'} onClick={() => setColor('#3b82f6')} />
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={handleUndo} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Undo">
                        <Undo size={18} />
                    </button>
                    <button onClick={handleClear} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg" title="Clear All">
                        <Trash2 size={18} />
                    </button>
                    {onSaveImage && (
                        <button onClick={handleExportImage} className="ml-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-1">
                            <Save size={14} /> Save Image
                        </button>
                    )}
                </div>
            </div>

            {/* Canvas Container */}
            <div ref={containerRef} className="flex-1 relative overflow-auto bg-gray-100 flex items-center justify-center">
                {fileUrl ? (
                    <div className="relative shadow-lg inline-block">
                        {/* Image Layer */}
                        <img
                            src={fileUrl}
                            alt="Document"
                            className="max-w-none block"
                            style={{ maxHeight: '70vh' }}
                            onLoad={() => setImageLoaded(true)}
                        />
                        {/* Canvas Layer */}
                        <canvas
                            ref={canvasRef}
                            className={`absolute inset-0 z-10 w-full h-full ${!readOnly && (tool === 'text' ? 'cursor-text' : 'cursor-crosshair')}`}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <p>No file loaded</p>
                    </div>
                )}
            </div>

            {!readOnly && (
                <div className="bg-yellow-50 text-yellow-800 text-xs p-2 text-center border-t border-yellow-100">
                    Auto-saving annotations...
                </div>
            )}
        </div>
    );
};

const ToolButton = ({ active, onClick, icon: Icon, title, color }) => (
    <button
        onClick={onClick}
        className={`p-2 rounded-lg transition-colors ${active ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
        title={title}
        style={{ color: active && color !== 'current' ? color : undefined }}
    >
        <Icon size={20} />
    </button>
);

const ColorButton = ({ color, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-6 h-6 rounded-full border-2 transition-transform ${active ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-110'}`}
        style={{ backgroundColor: color }}
    />
);

export default FileAnnotator;
