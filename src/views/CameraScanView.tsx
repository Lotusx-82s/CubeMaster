import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Check, 
  Upload, 
  RefreshCw, 
  AlertCircle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useCube } from '../context';
import type { CubeColor, FaceId } from '../types/cube';
import { CUBE_COLORS, FACE_NAMES } from '../types/cube';
import PageHeader from '../components/common/PageHeader';

const ORDERED_FACES: FaceId[] = ['U', 'R', 'F', 'D', 'L', 'B'];

function classifyRgbToCubeColor(r: number, g: number, b: number): CubeColor {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const brightness = (r + g + b) / 3;

  if (brightness > 175 && diff < 40) {
    return 'white';
  }

  const palettes: Record<CubeColor, [number, number, number]> = {
    white: [240, 240, 240],
    yellow: [230, 200, 20],
    green: [20, 155, 50],
    blue: [20, 70, 185],
    red: [190, 25, 30],
    orange: [235, 95, 15],
  };

  let bestColor: CubeColor = 'white';
  let minDistance = Infinity;

  for (const [colorName, [pr, pg, pb]] of Object.entries(palettes) as [CubeColor, [number, number, number]][]) {
    const rmean = (r + pr) / 2;
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    const distance = Math.sqrt((2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db);
    if (distance < minDistance) {
      minDistance = distance;
      bestColor = colorName;
    }
  }

  return bestColor;
}

export const CameraScanView: React.FC = () => {
  const { cubeState, setFaceColors, setView } = useCube();
  const [activeFace, setActiveFace] = useState<FaceId>('U');
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedFaces, setCapturedFaces] = useState<Record<FaceId, boolean>>({
    U: false,
    R: false,
    F: false,
    D: false,
    L: false,
    B: false,
  });

  const [previewStickers, setPreviewStickers] = useState<(CubeColor | null)[]>(() => [...cubeState.U]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectFace = (face: FaceId) => {
    setActiveFace(face);
    setPreviewStickers([...cubeState[face]]);
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
    // Attempt auto-starting camera stream once on mount
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

    const newColors: CubeColor[] = [];
    const step = 300 / 3;
    const offset = step / 2;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (row === 1 && col === 1) {
          newColors.push(FACE_NAMES[activeFace].standardColor);
          continue;
        }

        const x = Math.floor(col * step + offset);
        const y = Math.floor(row * step + offset);
        const pixelData = ctx.getImageData(x - 5, y - 5, 10, 10).data;

        let rTotal = 0, gTotal = 0, bTotal = 0, count = 0;
        for (let p = 0; p < pixelData.length; p += 4) {
          rTotal += pixelData[p];
          gTotal += pixelData[p + 1];
          bTotal += pixelData[p + 2];
          count++;
        }

        const r = Math.round(rTotal / count);
        const g = Math.round(gTotal / count);
        const b = Math.round(bTotal / count);

        const detected = classifyRgbToCubeColor(r, g, b);
        newColors.push(detected);
      }
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
    if (index === 4) return;

    const colorOrder: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];
    const current = previewStickers[index] || 'white';
    const nextIndex = (colorOrder.indexOf(current) + 1) % colorOrder.length;
    const updated = [...previewStickers];
    updated[index] = colorOrder[nextIndex];
    setPreviewStickers(updated);
  };

  const handleSaveFace = () => {
    setFaceColors(activeFace, previewStickers);
    setCapturedFaces(prev => ({ ...prev, [activeFace]: true }));

    const currentIndex = ORDERED_FACES.indexOf(activeFace);
    if (currentIndex < ORDERED_FACES.length - 1) {
      const nextFace = ORDERED_FACES[currentIndex + 1];
      setActiveFace(nextFace);
      setPreviewStickers([...cubeState[nextFace]]);
    }
  };

  const allCaptured = Object.values(capturedFaces).filter(Boolean).length === 6;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title="AI Camera Cube Scanner"
        subtitle="Position your Rubik's Cube within the 3x3 alignment grid and capture each face in sequence."
        badge="Computer Vision"
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {ORDERED_FACES.map((face) => {
          const isSelected = activeFace === face;
          const isDone = capturedFaces[face];
          const standardColor = FACE_NAMES[face].standardColor;
          const colorDef = CUBE_COLORS[standardColor];

          return (
            <button
              key={face}
              onClick={() => handleSelectFace(face)}
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
                    <span>{face} Face</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {FACE_NAMES[face].name.split(' ')[0]}
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

            <div className="absolute inset-8 pointer-events-none grid grid-cols-3 grid-rows-3 gap-2 border-2 border-cyan-400/60 rounded-2xl p-2 bg-cyan-950/10 backdrop-blur-[0.5px]">
              {Array(9).fill(0).map((_, i) => (
                <div
                  key={i}
                  className={`border border-cyan-400/30 rounded-xl flex items-center justify-center relative ${
                    i === 4 ? 'bg-cyan-500/10 border-cyan-400' : ''
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/50" />
                  {i === 4 && (
                    <span className="absolute text-[10px] font-bold text-cyan-300 uppercase tracking-wider bg-slate-950/80 px-2 py-0.5 rounded-md -bottom-2">
                      Center: {FACE_NAMES[activeFace].standardColor}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 text-xs text-white flex items-center gap-2 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Scanning: <strong>{FACE_NAMES[activeFace].name}</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 max-w-[500px] mx-auto">
            {streamActive && (
              <button
                onClick={handleCaptureVideo}
                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Sample {activeFace} Face</span>
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
                  <span>Detected Stickers</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {activeFace} Face
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  Tap any sticker to adjust color
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verify each sticker matches your physical cube under your lighting.
              </p>
            </div>

            <div className="aspect-square max-w-[280px] mx-auto grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
              {previewStickers.map((color, idx) => {
                const colorDef = color ? CUBE_COLORS[color] : null;
                const isCenter = idx === 4;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOverrideStickerColor(idx)}
                    title={isCenter ? 'Fixed Center' : 'Click to cycle color'}
                    className={`w-full h-full rounded-xl border-2 transition-all flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer hover:scale-105 active:scale-95 ${
                      isCenter ? 'ring-2 ring-cyan-400/50 cursor-default' : ''
                    }`}
                    style={{
                      backgroundColor: colorDef ? colorDef.hex : '#334155',
                      borderColor: colorDef ? colorDef.borderHex : '#475569',
                      color: colorDef ? colorDef.textColor : '#ffffff',
                    }}
                  >
                    {isCenter ? '★' : ''}
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
                <span>Confirm {activeFace} Face & Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {allCaptured && (
                <button
                  onClick={() => setView('validate')}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>All 6 Faces Captured • Validate Cube</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <h5 className="font-bold text-slate-200 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scanning Tips for Best Accuracy</span>
            </h5>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Ensure good, even lighting without heavy glares or shadows.</li>
              <li>Hold the cube steady and align all 9 stickers inside the colored boxes.</li>
              <li>Keep <strong>White on Top</strong> and <strong>Green in Front</strong> for standard orientation.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraScanView;
