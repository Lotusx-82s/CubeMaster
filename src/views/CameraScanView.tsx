import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Check, 
  Upload, 
  RefreshCw, 
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { useCube } from '../context';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';
import type { CubeColor } from '../types/cube';
import { CUBE_COLORS } from '../types/cube';
import PageHeader from '../components/common/PageHeader';

function classifyRgbToCubeColor(r: number, g: number, b: number, allowedColors: CubeColor[]): CubeColor {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const brightness = (r + g + b) / 3;

  if (allowedColors.includes('white') && brightness > 175 && diff < 40) {
    return 'white';
  }

  const palettes: Record<CubeColor, [number, number, number]> = {
    white: [240, 240, 240],
    yellow: [230, 200, 20],
    green: [20, 155, 50],
    blue: [20, 70, 185],
    red: [190, 25, 30],
    orange: [235, 95, 15],
    purple: [147, 51, 234],
    pink: [236, 72, 153],
    lightgreen: [74, 222, 128],
    lightblue: [56, 189, 248],
    grey: [100, 116, 139],
    cream: [254, 240, 138],
  };

  let bestColor: CubeColor = allowedColors[0] || 'white';
  let minDistance = Infinity;

  for (const color of allowedColors) {
    const [pr, pg, pb] = palettes[color] || [128, 128, 128];
    const rmean = (r + pr) / 2;
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    const distance = Math.sqrt((2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db);
    if (distance < minDistance) {
      minDistance = distance;
      bestColor = color;
    }
  }

  return bestColor;
}

export const CameraScanView: React.FC = () => {
  const { selectedPuzzle, cubeState, setFaceColors, setView } = useCube();
  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === selectedPuzzle) || PUZZLE_DEFINITIONS[1];

  const [activeFaceId, setActiveFaceId] = useState<string>(() => puzzleDef.faceNames[0]?.id || 'U');
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [capturedFaces, setCapturedFaces] = useState<Record<string, boolean>>({});

  // Current detected stickers for active face
  const [previewStickers, setPreviewStickers] = useState<(CubeColor | null)[]>(() => 
    Array(puzzleDef.stickersPerFace).fill(puzzleDef.faceNames[0]?.defaultColor || 'white')
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectFace = (faceId: string) => {
    setActiveFaceId(faceId);
    const targetFace = puzzleDef.faceNames.find(f => f.id === faceId);
    if (selectedPuzzle === '3x3' && faceId in cubeState) {
      setPreviewStickers([...cubeState[faceId as keyof typeof cubeState]]);
    } else {
      setPreviewStickers(Array(puzzleDef.stickersPerFace).fill(targetFace?.defaultColor || 'white'));
    }
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser environment. You can upload photo files below.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
        setCameraError(null);
      }
    } catch (err: any) {
      setCameraError(err.message || 'Camera permission denied or camera device not found. Please upload a photo or use manual mode.');
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  useEffect(() => {
    let isMounted = true;
    navigator.mediaDevices?.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
      audio: false,
    }).then(stream => {
      if (isMounted && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      } else {
        stream.getTracks().forEach(t => t.stop());
      }
    }).catch(() => {
      if (isMounted) {
        setCameraError('Camera offline or permission needed. Tap "Try Camera" or upload a photo.');
      }
    });

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  const processImageSource = (imageSource: HTMLVideoElement | HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;
    ctx.drawImage(imageSource, 0, 0, 300, 300);

    const count = puzzleDef.stickersPerFace;
    const newColors: CubeColor[] = [];

    // Distribute sample points across the canvas based on sticker count
    const cols = Math.ceil(Math.sqrt(count));
    const step = 300 / cols;
    const offset = step / 2;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = Math.floor(col * step + offset);
      const y = Math.floor(row * step + offset);

      const pixelData = ctx.getImageData(Math.max(0, x - 5), Math.max(0, y - 5), 10, 10).data;
      let rTotal = 0, gTotal = 0, bTotal = 0, pCount = 0;
      for (let p = 0; p < pixelData.length; p += 4) {
        rTotal += pixelData[p];
        gTotal += pixelData[p + 1];
        bTotal += pixelData[p + 2];
        pCount++;
      }

      const r = Math.round(rTotal / pCount);
      const g = Math.round(gTotal / pCount);
      const b = Math.round(bTotal / pCount);

      const detected = classifyRgbToCubeColor(r, g, b, puzzleDef.colorSet);
      newColors.push(detected);
    }

    setPreviewStickers(newColors);
  };

  const handleCaptureVideo = () => {
    if (videoRef.current && streamActive) {
      processImageSource(videoRef.current);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      processImageSource(img);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleOverrideStickerColor = (index: number) => {
    const colorOrder = puzzleDef.colorSet;
    const current = previewStickers[index] || colorOrder[0];
    const nextIndex = (colorOrder.indexOf(current) + 1) % colorOrder.length;
    const updated = [...previewStickers];
    updated[index] = colorOrder[nextIndex];
    setPreviewStickers(updated);
  };

  const handleSaveFace = () => {
    if (selectedPuzzle === '3x3') {
      setFaceColors(activeFaceId as any, previewStickers);
    }
    setCapturedFaces(prev => ({ ...prev, [activeFaceId]: true }));

    const currentIndex = puzzleDef.faceNames.findIndex(f => f.id === activeFaceId);
    if (currentIndex < puzzleDef.faceNames.length - 1) {
      const nextFace = puzzleDef.faceNames[currentIndex + 1];
      setActiveFaceId(nextFace.id);
      setPreviewStickers(Array(puzzleDef.stickersPerFace).fill(nextFace.defaultColor));
    }
  };

  const allCaptured = Object.keys(capturedFaces).length === puzzleDef.facesCount;
  const currentFaceMeta = puzzleDef.faceNames.find(f => f.id === activeFaceId) || puzzleDef.faceNames[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title={`AI Camera Scanner • ${puzzleDef.name}`}
        subtitle={`Align each face within the targeting frame to capture all ${puzzleDef.facesCount} faces of your ${puzzleDef.dimensionsLabel} puzzle.`}
        badge={puzzleDef.dimensionsLabel}
        backTo="select"
        actions={
          <button
            onClick={() => setView('manual')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            Switch to Manual Input
          </button>
        }
      />

      {/* Solver status banner if unsupported */}
      {!puzzleDef.supported && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-amber-300 block mb-0.5">
              Solver Not Yet Available for {puzzleDef.name}
            </strong>
            Camera vision scanning captures and classifies colors for this {puzzleDef.geometryType} geometry. The automated solving algorithm for this puzzle is currently in active development.
          </div>
        </div>
      )}

      {/* Face Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {puzzleDef.faceNames.map((face) => {
          const isSelected = activeFaceId === face.id;
          const isDone = capturedFaces[face.id];
          const colorDef = CUBE_COLORS[face.defaultColor] || { hex: '#38bdf8', borderHex: '#0284c7' };

          return (
            <button
              key={face.id}
              onClick={() => handleSelectFace(face.id)}
              className={`p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-md border shadow-sm shrink-0"
                  style={{ backgroundColor: colorDef.hex, borderColor: colorDef.borderHex }}
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{face.id}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[90px]">
                    {face.name}
                  </span>
                </div>
              </div>

              {isDone && (
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square max-w-[500px] mx-auto rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${streamActive ? 'block' : 'hidden'}`}
            />

            <canvas ref={canvasRef} className="hidden" />

            {!streamActive && (
              <div className="text-center p-8 space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Camera Offline</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {cameraError || 'Allow camera permission or upload a photo to sample colors.'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Camera Again</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Face Photo</span>
                  </button>
                </div>
              </div>
            )}

            {/* Target Alignment Grid */}
            <div className="absolute inset-8 pointer-events-none border-2 border-cyan-400/60 rounded-2xl p-2 bg-cyan-950/10 backdrop-blur-[0.5px] flex items-center justify-center">
              <div className="grid grid-cols-3 gap-2 w-full h-full">
                {Array(Math.min(9, puzzleDef.stickersPerFace)).fill(0).map((_, i) => (
                  <div
                    key={i}
                    className="border border-cyan-400/30 rounded-xl flex items-center justify-center"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/50" />
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 text-xs text-white flex items-center gap-2 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Scanning Face: <strong>{currentFaceMeta.name}</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 max-w-[500px] mx-auto">
            {streamActive && (
              <button
                onClick={handleCaptureVideo}
                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Sample {activeFaceId} Face</span>
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-3.5 px-4 rounded-2xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload Photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Detected Facelets</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {activeFaceId}
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  Tap to cycle colors
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ensure each of the {puzzleDef.stickersPerFace} facelets matches your physical puzzle.
              </p>
            </div>

            <div className="aspect-square max-w-[280px] mx-auto grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
              {previewStickers.map((color, idx) => {
                const colorDef = color ? CUBE_COLORS[color] : null;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOverrideStickerColor(idx)}
                    title={`Facelet #${idx + 1}`}
                    className="w-full h-full rounded-xl border-2 transition-all flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: colorDef ? colorDef.hex : '#334155',
                      borderColor: colorDef ? colorDef.borderHex : '#475569',
                      color: colorDef ? colorDef.textColor : '#ffffff',
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleSaveFace}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm {activeFaceId} & Next Face</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {allCaptured && (
                <button
                  onClick={() => setView('validate')}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>All {puzzleDef.facesCount} Faces Captured • Validate</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <h5 className="font-bold text-slate-200 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scanning Guidelines</span>
            </h5>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Keep ambient light even and avoid direct glares.</li>
              <li>Align the {puzzleDef.name} steadily inside the target window.</li>
              <li>Tap any detected facelet if your camera lens distorts color warmth.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraScanView;
