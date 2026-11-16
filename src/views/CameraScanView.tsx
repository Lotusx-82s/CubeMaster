import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert, 
  SunMedium, 
  Sparkles, 
  SwitchCamera, 
  X, 
  Edit3
} from 'lucide-react';
import { useCube } from '../context';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';
import type { CubeColor, FaceId } from '../types/cube';
import { CUBE_COLORS } from '../types/cube';
import PageHeader from '../components/common/PageHeader';
import { 
  sampleRoiPixels, 
  classifySampledColor, 
  getPuzzleRoiPoints, 
  type ColorDetectionResult, 
  type RoiPoint 
} from '../services/cvColorExtractor';

export const CameraScanView: React.FC = () => {
  const { selectedPuzzle, cubeState, setFaceColors, setGenericPuzzleState, setView } = useCube();
  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === selectedPuzzle) || PUZZLE_DEFINITIONS[1];

  const [activeFaceId, setActiveFaceId] = useState<string>(() => puzzleDef.faceNames[0]?.id || 'U');
  const [inputTab, setInputTab] = useState<'camera' | 'upload'>('camera');
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Photo / Frame orientation state (for non-standard camera angles or uploaded photos)
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [isFlippedH, setIsFlippedH] = useState<boolean>(false);

  // Scanned faces record: faceId -> ColorDetectionResult[]
  const [scannedFacesData, setScannedFacesData] = useState<Record<string, ColorDetectionResult[]>>({});
  
  // Current face detection result
  const [currentFaceDetections, setCurrentFaceDetections] = useState<ColorDetectionResult[]>(() => {
    const defaultColor = puzzleDef.faceNames[0]?.defaultColor || 'white';
    return Array(puzzleDef.stickersPerFace).fill(null).map(() => ({
      color: defaultColor,
      confidence: 95,
      sampledRgb: { r: 240, g: 240, b: 240 },
      sampledHex: '#f1f5f9',
    }));
  });

  // Modal / Popover state for manual sticker color override
  const [editingStickerIndex, setEditingStickerIndex] = useState<number | null>(null);

  // Uploaded photo image source
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic ROI points for the active puzzle
  const roiPoints: RoiPoint[] = getPuzzleRoiPoints(puzzleDef.id, puzzleDef.stickersPerFace);

  // Enumerate camera devices
  const updateCameraDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch {
      // Ignore enumeration errors
    }
  }, [selectedDeviceId]);

  // Start Camera Stream
  const startCamera = useCallback(async (deviceId?: string, facing?: 'environment' | 'user') => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera API is not supported in this browser. Please upload photo images instead.');
        return;
      }

      // Stop existing stream if running
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceId 
          ? { deviceId: { exact: deviceId } }
          : { facingMode: facing || facingMode, width: { ideal: 720 }, height: { ideal: 720 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamActive(true);
        setCameraError(null);
        await updateCameraDevices();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Camera access denied or device not found.';
      setCameraError(`${message} You can upload a photo or use manual color entry.`);
      setStreamActive(false);
    }
  }, [facingMode, updateCameraDevices]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  }, []);

  // Initialize camera on mount when in camera tab
  useEffect(() => {
    let isMounted = true;
    const videoEl = videoRef.current;
    if (inputTab !== 'camera') return;

    const initCam = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          if (isMounted) setCameraError('Camera API not supported in this browser. Please upload a photo.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'environment', width: { ideal: 720 }, height: { ideal: 720 } },
        });
        if (isMounted && videoEl) {
          videoEl.srcObject = stream;
          await videoEl.play();
          setStreamActive(true);
          setCameraError(null);
          void updateCameraDevices();
        } else {
          stream.getTracks().forEach(t => t.stop());
        }
      } catch {
        if (isMounted) {
          setCameraError('Camera access requires permission or device is unavailable. Try again or upload a photo.');
        }
      }
    };
    void initCam();

    return () => {
      isMounted = false;
      if (videoEl?.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        videoEl.srcObject = null;
      }
    };
  }, [inputTab, updateCameraDevices]);

  // Toggle front/back camera
  const handleToggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(undefined, nextFacing);
  };

  // Switch camera device
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedDeviceId(deviceId);
    startCamera(deviceId);
  };

  // Switch active face
  const handleSelectFace = (faceId: string) => {
    setActiveFaceId(faceId);
    setEditingStickerIndex(null);

    // If face already scanned, load its detections
    if (scannedFacesData[faceId]) {
      setCurrentFaceDetections(scannedFacesData[faceId]);
    } else if (selectedPuzzle === '3x3' && faceId in cubeState) {
      // Load from cube context if 3x3
      const existing = cubeState[faceId as keyof typeof cubeState];
      setCurrentFaceDetections(
        existing.map(color => ({
          color: color || 'white',
          confidence: 100,
          sampledRgb: { r: 240, g: 240, b: 240 },
          sampledHex: color ? CUBE_COLORS[color]?.hex || '#ffffff' : '#ffffff',
        }))
      );
    } else {
      const targetFace = puzzleDef.faceNames.find(f => f.id === faceId);
      const defColor = targetFace?.defaultColor || 'white';
      setCurrentFaceDetections(
        Array(puzzleDef.stickersPerFace).fill(null).map(() => ({
          color: defColor,
          confidence: 90,
          sampledRgb: { r: 240, g: 240, b: 240 },
          sampledHex: CUBE_COLORS[defColor]?.hex || '#ffffff',
        }))
      );
    }
  };

  // Rotate / Flip orientation
  const handleRotate = (direction: 'cw' | 'ccw') => {
    setRotationDegrees(prev => {
      const delta = direction === 'cw' ? 90 : -90;
      return (prev + delta + 360) % 360;
    });
  };

  const handleToggleFlip = () => {
    setIsFlippedH(prev => !prev);
  };

  const handleResetOrientation = () => {
    setRotationDegrees(0);
    setIsFlippedH(false);
  };

  // Core Computer Vision sampling on canvas
  const processImageCanvas = (source: HTMLVideoElement | HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const size = 500;
    canvas.width = size;
    canvas.height = size;

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotationDegrees * Math.PI) / 180);
    if (isFlippedH) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, -size / 2, -size / 2, size, size);
    ctx.restore();

    // Sample each ROI point using our CIELAB + HSV filter engine
    const detectedList: ColorDetectionResult[] = [];
    for (const point of roiPoints) {
      const cx = Math.floor(point.x * size);
      const cy = Math.floor(point.y * size);
      const rad = Math.max(8, Math.floor(point.radius * size));

      // Extract median pixel with glare & shadow rejection
      const medianRgb = sampleRoiPixels(ctx, cx, cy, rad);

      // Classify color using CIELAB distance + HSV rules
      const result = classifySampledColor(medianRgb, puzzleDef.colorSet);
      detectedList.push(result);
    }

    setCurrentFaceDetections(detectedList);
  };

  // Handle capture from live video
  const handleCaptureVideo = () => {
    if (videoRef.current && streamActive) {
      processImageCanvas(videoRef.current);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setUploadedImageSrc(src);
      setInputTab('upload');

      const img = new Image();
      img.onload = () => {
        processImageCanvas(img);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Re-process uploaded photo if orientation changed
  const handleReprocessUploadedImage = () => {
    if (!uploadedImageSrc) return;
    const img = new Image();
    img.onload = () => {
      processImageCanvas(img);
    };
    img.src = uploadedImageSrc;
  };

  // Manual Color Override for a specific facelet
  const handleManualColorOverride = (index: number, newColor: CubeColor) => {
    const updated = [...currentFaceDetections];
    updated[index] = {
      ...updated[index],
      color: newColor,
      confidence: 100, // User verified
      sampledHex: CUBE_COLORS[newColor]?.hex || '#ffffff',
    };
    setCurrentFaceDetections(updated);
    setEditingStickerIndex(null);
  };

  // Confirm active face and advance
  const handleSaveFace = () => {
    const colorsOnly = currentFaceDetections.map(d => d.color);
    
    // Save to local scanned data
    const updatedScans = {
      ...scannedFacesData,
      [activeFaceId]: currentFaceDetections,
    };
    setScannedFacesData(updatedScans);

    // If 3x3, also commit directly to CubeContext
    if (selectedPuzzle === '3x3') {
      setFaceColors(activeFaceId as FaceId, colorsOnly);
    }

    // Auto-advance to the next face if not the last one
    const currentIndex = puzzleDef.faceNames.findIndex(f => f.id === activeFaceId);
    if (currentIndex < puzzleDef.faceNames.length - 1) {
      const nextFace = puzzleDef.faceNames[currentIndex + 1];
      handleSelectFace(nextFace.id);
    }
  };

  // Retake current face (resets this face's detections)
  const handleRetakeFace = () => {
    const updatedScans = { ...scannedFacesData };
    delete updatedScans[activeFaceId];
    setScannedFacesData(updatedScans);

    const targetFace = puzzleDef.faceNames.find(f => f.id === activeFaceId);
    const defColor = targetFace?.defaultColor || 'white';
    setCurrentFaceDetections(
      Array(puzzleDef.stickersPerFace).fill(null).map(() => ({
        color: defColor,
        confidence: 0,
        sampledRgb: { r: 240, g: 240, b: 240 },
        sampledHex: CUBE_COLORS[defColor]?.hex || '#ffffff',
      }))
    );
  };

  // Proceed to Validation
  const handleProceedToValidation = () => {
    if (selectedPuzzle === '3x3') {
      // Ensure all 6 faces are written into CubeContext
      for (const face of puzzleDef.faceNames) {
        if (scannedFacesData[face.id]) {
          const colors = scannedFacesData[face.id].map(d => d.color);
          setFaceColors(face.id as FaceId, colors);
        }
      }
    } else {
      // Ensure all faces are written into genericPuzzleState
      setGenericPuzzleState(prev => {
        const nextState = { ...prev };
        for (const face of puzzleDef.faceNames) {
          if (scannedFacesData[face.id]) {
            nextState[face.id] = scannedFacesData[face.id].map(d => d.color);
          }
        }
        return nextState;
      });
    }
    setView('validate');
  };

  const capturedCount = Object.keys(scannedFacesData).length;
  const allCaptured = capturedCount === puzzleDef.facesCount;
  const currentFaceMeta = puzzleDef.faceNames.find(f => f.id === activeFaceId) || puzzleDef.faceNames[0];

  // Face guide hint text
  const getFaceInstruction = (faceId: string): string => {
    if (selectedPuzzle === '3x3' || selectedPuzzle === '2x2' || selectedPuzzle === '4x4' || selectedPuzzle === 'skewb') {
      switch (faceId) {
        case 'U': return 'Hold cube with White face up and Green facing you.';
        case 'D': return 'Rotate cube to show Yellow face on top, keep Green facing forward.';
        case 'F': return 'Rotate cube to show Green face on top, White facing you.';
        case 'B': return 'Rotate cube to show Blue face on top, White facing you.';
        case 'R': return 'Rotate cube to show Red face on top, White facing you.';
        case 'L': return 'Rotate cube to show Orange face on top, White facing you.';
        default: return `Align the ${currentFaceMeta.name} squarely in the frame.`;
      }
    }
    if (selectedPuzzle === 'pyraminx') {
      return `Position the triangular ${currentFaceMeta.name} face with tips aligned to guide points.`;
    }
    return `Align the ${currentFaceMeta.name} flatly inside the targeting guide.`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title={`AI Camera Scanner • ${puzzleDef.name}`}
        subtitle={`Computer vision powered color classifier with CIELAB perceptual distance, specular glare filtering, and multi-orientation compensation.`}
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
              Solver Engine In Active Development for {puzzleDef.name}
            </strong>
            Camera computer vision extracts, filters, and classifies all colors for this {puzzleDef.geometryType} geometry. The automated solving algorithm for this puzzle is currently in active development.
          </div>
        </div>
      )}

      {/* Face Progress Bar & Navigation Ribbon */}
      <div className="mb-6 bg-slate-900/60 p-4 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-3 px-1">
          <span className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Scanning Progress: {capturedCount} of {puzzleDef.facesCount} Faces Captured</span>
          </span>
          <span className="text-cyan-400 font-bold">
            {Math.round((capturedCount / puzzleDef.facesCount) * 100)}% Complete
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${(capturedCount / puzzleDef.facesCount) * 100}%` }}
          />
        </div>

        {/* Face Tabs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {puzzleDef.faceNames.map((face) => {
            const isSelected = activeFaceId === face.id;
            const isDone = !!scannedFacesData[face.id];
            const colorDef = CUBE_COLORS[face.defaultColor] || { hex: '#38bdf8', borderHex: '#0284c7' };

            return (
              <button
                key={face.id}
                onClick={() => handleSelectFace(face.id)}
                className={`p-3 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-500/15'
                    : isDone
                    ? 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/60'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className="w-4 h-4 rounded-md border shadow-sm shrink-0"
                    style={{ backgroundColor: colorDef.hex, borderColor: colorDef.borderHex }}
                  />
                  <div className="truncate">
                    <span className="text-xs font-bold text-white block">
                      {face.id}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {face.name}
                    </span>
                  </div>
                </div>

                {isDone && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Viewfinder & Capture Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Input Source & Camera Toggle Tabs */}
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setInputTab('camera');
                  void startCamera();
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  inputTab === 'camera'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live Camera</span>
              </button>
              <button
                onClick={() => {
                  setInputTab('upload');
                  stopCamera();
                  if (!uploadedImageSrc) {
                    fileInputRef.current?.click();
                  }
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  inputTab === 'upload'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>
            </div>

            {/* Quick Camera Flip or Device Selector */}
            {inputTab === 'camera' && streamActive && (
              <div className="flex items-center gap-2">
                {availableDevices.length > 1 && (
                  <select
                    value={selectedDeviceId}
                    onChange={handleDeviceChange}
                    className="text-[11px] bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 outline-none cursor-pointer"
                  >
                    {availableDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={handleToggleFacingMode}
                  title="Switch Front/Back Camera"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Viewfinder Frame with Dynamic Alignment Overlay */}
          <div className="relative aspect-square max-w-[500px] mx-auto rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
            {/* Live Video Element */}
            {inputTab === 'camera' && (
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  transform: `rotate(${rotationDegrees}deg) ${isFlippedH ? 'scaleX(-1)' : ''}`,
                  transition: 'transform 0.2s ease-out',
                }}
                className={`w-full h-full object-cover ${streamActive ? 'block' : 'hidden'}`}
              />
            )}

            {/* Uploaded Photo Image */}
            {inputTab === 'upload' && uploadedImageSrc && (
              <img
                src={uploadedImageSrc}
                alt="Uploaded face"
                style={{
                  transform: `rotate(${rotationDegrees}deg) ${isFlippedH ? 'scaleX(-1)' : ''}`,
                  transition: 'transform 0.2s ease-out',
                }}
                className="w-full h-full object-cover"
              />
            )}

            {/* Internal Processing Canvas (Hidden) */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Camera Offline / Upload Prompt Placeholder */}
            {inputTab === 'camera' && !streamActive && (
              <div className="text-center p-8 space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Camera Offline</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {cameraError || 'Allow camera permission or upload a photo to scan colors.'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => startCamera()}
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

            {/* Uploaded Image Empty State */}
            {inputTab === 'upload' && !uploadedImageSrc && (
              <div className="text-center p-8 space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Upload Face Photo</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a clear, well-lit photo of your {puzzleDef.name}'s {currentFaceMeta.name} face.
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  <span>Browse Photo</span>
                </button>
              </div>
            )}

            {/* Dynamic Alignment Guide Overlay for Puzzle Geometry */}
            {((inputTab === 'camera' && streamActive) || (inputTab === 'upload' && uploadedImageSrc)) && (
              <div className="absolute inset-8 pointer-events-none border-2 border-cyan-400/50 rounded-2xl bg-cyan-950/10 backdrop-blur-[0.5px]">
                {roiPoints.map((pt, i) => (
                  <div
                    key={i}
                    style={{
                      left: `${pt.x * 100}%`,
                      top: `${pt.y * 100}%`,
                      width: `${pt.radius * 200}%`,
                      height: `${pt.radius * 200}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="absolute rounded-full border-2 border-cyan-400/80 bg-cyan-500/15 flex items-center justify-center shadow-sm"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                  </div>
                ))}
              </div>
            )}

            {/* Top Badge: Current Target Face */}
            <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/80 text-xs text-white flex items-center gap-2 pointer-events-none shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Target Face: <strong>{currentFaceMeta.name}</strong></span>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Orientation Controls (Rotate & Flip to handle non-standard photo angles) */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 max-w-[500px] mx-auto text-xs">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5 pl-2">
              <span>Orient Frame:</span>
              <span className="text-cyan-400 font-bold">{rotationDegrees}°</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  handleRotate('ccw');
                  if (inputTab === 'upload') setTimeout(handleReprocessUploadedImage, 50);
                }}
                title="Rotate 90° CCW"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  handleRotate('cw');
                  if (inputTab === 'upload') setTimeout(handleReprocessUploadedImage, 50);
                }}
                title="Rotate 90° CW"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  handleToggleFlip();
                  if (inputTab === 'upload') setTimeout(handleReprocessUploadedImage, 50);
                }}
                title="Flip Horizontal"
                className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                  isFlippedH 
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
              {(rotationDegrees !== 0 || isFlippedH) && (
                <button
                  onClick={() => {
                    handleResetOrientation();
                    if (inputTab === 'upload') setTimeout(handleReprocessUploadedImage, 50);
                  }}
                  title="Reset Orientation"
                  className="px-2 py-1 rounded-xl text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-800 border border-slate-700 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Main Action Buttons */}
          <div className="flex items-center justify-center gap-3 max-w-[500px] mx-auto">
            {inputTab === 'camera' && streamActive && (
              <button
                onClick={handleCaptureVideo}
                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Scan {currentFaceMeta.id} Face</span>
              </button>
            )}

            {inputTab === 'upload' && uploadedImageSrc && (
              <button
                onClick={handleReprocessUploadedImage}
                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Re-Extract Colors</span>
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-3.5 px-4 rounded-2xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Choose Photo</span>
            </button>
          </div>

          {/* Orientation Prompt */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 max-w-[500px] mx-auto text-xs text-cyan-200 flex items-center gap-2.5">
            <SunMedium className="w-4 h-4 text-cyan-400 shrink-0" />
            <span><strong>Orientation Tip:</strong> {getFaceInstruction(activeFaceId)}</span>
          </div>
        </div>

        {/* Right Column: Detected Colors Grid, Manual Correction & Confirmation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Detected Facelets</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {activeFaceId} Face
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Tap any facelet to correct
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Each color is classified via CIELAB perceptual space. If lighting altered a facelet, tap it to manually select the true color.
              </p>
            </div>

            {/* Sticker Grid Representation */}
            <div className={`aspect-square max-w-[280px] mx-auto p-3.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner grid gap-2.5 ${
              puzzleDef.id === '2x2' 
                ? 'grid-cols-2' 
                : puzzleDef.id === '4x4' 
                ? 'grid-cols-4' 
                : 'grid-cols-3'
            }`}>
              {currentFaceDetections.map((detection, idx) => {
                const colorDef = CUBE_COLORS[detection.color] || { hex: '#334155', borderHex: '#475569', textColor: '#ffffff' };
                const isEditing = editingStickerIndex === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEditingStickerIndex(isEditing ? null : idx)}
                    title={`Facelet #${idx + 1}: ${detection.color} (${detection.confidence}% confidence)`}
                    className={`relative w-full h-full rounded-xl border-2 transition-all flex flex-col items-center justify-center font-bold text-xs shadow-md cursor-pointer hover:scale-105 active:scale-95 ${
                      isEditing ? 'ring-2 ring-cyan-400 scale-105' : ''
                    }`}
                    style={{
                      backgroundColor: colorDef.hex,
                      borderColor: colorDef.borderHex,
                      color: colorDef.textColor,
                    }}
                  >
                    <span className="text-sm drop-shadow">{idx + 1}</span>
                    <span 
                      className="text-[9px] font-mono px-1 py-0.2 rounded-full mt-0.5 font-bold opacity-90 shadow-sm"
                      style={{
                        backgroundColor: colorDef.textColor === '#000000' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {detection.confidence}%
                    </span>

                    <Edit3 className="w-2.5 h-2.5 absolute top-1 right-1 opacity-60" />
                  </button>
                );
              })}
            </div>

            {/* Color Palette Popover / In-place Selector */}
            {editingStickerIndex !== null && (
              <div className="p-4 rounded-2xl bg-slate-800/95 border border-cyan-500/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Select True Color for Facelet #{editingStickerIndex + 1}</span>
                  </span>
                  <button
                    onClick={() => setEditingStickerIndex(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {puzzleDef.colorSet.map((col) => {
                    const cDef = CUBE_COLORS[col];
                    const isCurrent = currentFaceDetections[editingStickerIndex]?.color === col;

                    return (
                      <button
                        key={col}
                        onClick={() => handleManualColorOverride(editingStickerIndex, col)}
                        className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-105 ${
                          isCurrent ? 'ring-2 ring-white scale-105' : ''
                        }`}
                        style={{
                          backgroundColor: cDef.hex,
                          borderColor: cDef.borderHex,
                          color: cDef.textColor,
                        }}
                      >
                        <span className="text-[10px] font-bold capitalize">{col}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confirmation & Retake Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveFace}
                  className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm {activeFaceId} & Next Face</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleRetakeFace}
                  title="Discard and retake this face"
                  className="py-3.5 px-4 rounded-2xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Retake</span>
                </button>
              </div>

              {/* Validate Puzzle Button once all required faces are scanned */}
              {allCaptured ? (
                <button
                  onClick={handleProceedToValidation}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-xl shadow-cyan-500/30 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>All {puzzleDef.facesCount} Faces Scanned • Proceed to Validation</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                  <span>Capture all <strong>{puzzleDef.facesCount} faces</strong> ({capturedCount}/{puzzleDef.facesCount} done) to unlock validation & solving.</span>
                </div>
              )}
            </div>
          </div>

          {/* Computer Vision & Lighting Guidance Card */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 space-y-2.5">
            <h5 className="font-bold text-slate-200 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Computer Vision Guidance</span>
            </h5>
            <ul className="space-y-1.5 list-disc list-inside">
              <li><strong>Specular Glare Rejection:</strong> Direct camera flash highlights are automatically filtered via HSV saturation clipping.</li>
              <li><strong>Shadow Rejection:</strong> Deep plastic crevices and black borders are discarded from median estimation.</li>
              <li><strong>Perceptual CIELAB:</strong> Color distances are calculated using standard D65 illuminant ($\Delta E_{76}$) to handle warm indoor bulbs.</li>
              <li><strong>Orientation:</strong> If your photo was captured at an angle, use the Orient buttons before sampling.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraScanView;
