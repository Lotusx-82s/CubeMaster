import React, { useState } from 'react';
import { 
  Link2, 
  Globe, 
  Clipboard, 
  X, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  Loader2, 
  Edit3 
} from 'lucide-react';
import { useCube } from '../context';
import PageHeader from '../components/common/PageHeader';
import RubiksCube3D from '../components/3d/RubiksCube3D';
import PuzzlePreview3D from '../components/3d/PuzzlePreview3D';
import { 
  parseSimulatorUrl, 
  SIMULATOR_ADAPTERS, 
  type SimulatorParseResult 
} from '../services/simulatorAdapters';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';

const EXAMPLE_URLS = [
  {
    name: 'RubiksCu.be 54-Facelet State',
    url: 'https://rubikscu.be/play/?f=DDFRUUFDRBLLDRULFFUFDRFLLBUUUBBDRRUDBBRFLDBLFDBLRBLRFU',
    badge: '54 Facelets',
  },
  {
    name: 'RubiksCu.be Scramble',
    url: 'https://rubikscu.be/?scramble=R_U_R-_U-_F2_D_L2_B-',
    badge: 'RubiksCu.be',
  },
  {
    name: 'Alg.cubing.net (WCA Scramble)',
    url: 'https://alg.cubing.net/?setup=R_U_R-_U-_F2_D_L2_B-&puzzle=3x3x3',
    badge: 'Popular',
  },
  {
    name: 'Alg.cubing.net (Superflip)',
    url: 'https://alg.cubing.net/?setup=U_R2_F_B_R_B2_R_U2_L_B2_R_U-_D-_R2_F_R-_L_B2_U2_F2&puzzle=3x3x3',
    badge: '20-Move Superflip',
  },
  {
    name: 'CubeDB.net Scramble',
    url: 'https://cubedb.net/?puzzle=3&scramble=R_U_R-_U-_F2_D_L2_B-',
    badge: 'CubeDB',
  },
  {
    name: 'CubeMaster Native Link',
    url: 'https://cubemaster.app/?puzzle=3x3&scramble=F_R_U_R-_U-_F-',
    badge: 'Native',
  },
];

export const UrlImportView: React.FC = () => {
  const { 
    setCubeState, 
    setSelectedPuzzle, 
    setInputMode, 
    setView
  } = useCube();

  const [inputUrl, setInputUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<SimulatorParseResult | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  // Paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        setErrorFeedback('Clipboard read is not supported in this browser. Please paste the URL manually.');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text.trim());
        setErrorFeedback(null);
      }
    } catch {
      setErrorFeedback('Could not access clipboard. Please paste the URL into the input field directly.');
    }
  };

  // Clear input
  const handleClear = () => {
    setInputUrl('');
    setParseResult(null);
    setErrorFeedback(null);
  };

  // Verify and parse simulator URL
  const handleVerifyAndImport = (urlToParse?: string) => {
    const targetUrl = urlToParse || inputUrl;
    if (!targetUrl.trim()) {
      setErrorFeedback('Please enter or paste a simulator URL.');
      setParseResult(null);
      return;
    }

    setIsLoading(true);
    setErrorFeedback(null);

    // Simulate brief asynchronous processing for smooth UX
    setTimeout(() => {
      const result = parseSimulatorUrl(targetUrl);
      setIsLoading(false);
      setParseResult(result);

      if (!result.success) {
        setErrorFeedback(result.error || 'Failed to extract puzzle configuration from this URL.');
      } else {
        setErrorFeedback(null);
      }
    }, 300);
  };

  // Confirm imported configuration and route to solver
  const handleConfirmAndProceed = () => {
    if (!parseResult || !parseResult.success) return;

    setInputMode('url');

    if (parseResult.puzzleType) {
      setSelectedPuzzle(parseResult.puzzleType);
    }

    // If 3x3, commit reconstructed state to CubeContext
    if (parseResult.puzzleType === '3x3' && parseResult.cubeState3x3) {
      setCubeState(parseResult.cubeState3x3);
    }

    // Navigate to Validation view
    setView('validate');
  };

  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === parseResult?.puzzleType) || PUZZLE_DEFINITIONS[1];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title="Import Cube Using Simulator URL"
        subtitle="Paste a link from external Rubik's cube simulators (e.g. Alg.cubing.net, CubeDB.net) to instantly import, reconstruct, and solve scrambled configurations."
        badge="URL Import"
        backTo="select"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('scan')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            >
              Camera Scan
            </button>
            <button
              onClick={() => setView('manual')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            >
              Manual Paint
            </button>
          </div>
        }
      />

      {/* Main Input Box Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl mb-8 space-y-6">
        <div>
          <label htmlFor="simulator-url-input" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Paste Simulator Web Address (HTTP / HTTPS):
          </label>

          <div className="relative flex items-center">
            <div className="absolute left-4 pointer-events-none text-slate-500">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>

            <input
              id="simulator-url-input"
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerifyAndImport();
              }}
              placeholder="https://alg.cubing.net/?setup=R_U_R-_U-_F2_D_L2_B-&puzzle=3x3x3"
              className="w-full pl-12 pr-28 py-4 bg-slate-950 border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-inner font-mono"
            />

            <div className="absolute right-3 flex items-center gap-1.5">
              {inputUrl && (
                <button
                  type="button"
                  onClick={handleClear}
                  title="Clear URL"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePasteClipboard}
                title="Paste from Clipboard"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Button & Quick Examples */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold mr-1">Quick Presets:</span>
            {EXAMPLE_URLS.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setInputUrl(ex.url);
                  handleVerifyAndImport(ex.url);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-semibold text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>{ex.name}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleVerifyAndImport()}
            disabled={isLoading || !inputUrl.trim()}
            className="py-3 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Simulator...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Import</span>
              </>
            )}
          </button>
        </div>

        {/* Error Feedback Alert Banner */}
        {errorFeedback && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-3 shadow-lg">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-rose-300 block mb-0.5">Import Error ({parseResult?.errorCode || 'FAILED'})</strong>
              <p className="leading-relaxed">{errorFeedback}</p>
            </div>
          </div>
        )}
      </div>

      {/* Results Area (When successfully parsed) */}
      {parseResult?.success && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-emerald-500/30 shadow-2xl mb-8 space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Configuration Extracted Successfully</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {parseResult.simulatorName}
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  Detected: <strong>{puzzleDef.name}</strong> • {parseResult.metadata?.moveCount || 0} Scramble Moves
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmAndProceed}
                className="py-3 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Confirm & Send to Solver</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Scramble Moves Details */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Extracted WCA Move Sequence:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                  {parseResult.scrambleMoves?.map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-cyan-300 font-mono font-bold text-xs shadow-sm"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Simulator Source</span>
                  <span className="text-white font-bold">{parseResult.simulatorName}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Puzzle Geometry</span>
                  <span className="text-cyan-400 font-bold">{puzzleDef.dimensionsLabel}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Invariants Verified</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Physical Parity</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setView('manual')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Fine-Tune in Manual Input</span>
                </button>
              </div>
            </div>

            {/* 3D Preview of Imported Cube */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                3D Interactive Reconstruction:
              </span>
              <div className="h-[280px] w-full rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden relative">
                {parseResult.puzzleType === '3x3' && parseResult.cubeState3x3 ? (
                  <RubiksCube3D
                    cubeState={parseResult.cubeState3x3}
                    interactive={false}
                    autoRotate={true}
                    autoRotateSpeed={0.9}
                  />
                ) : (
                  <PuzzlePreview3D puzzleId={parseResult.puzzleType || '3x3'} autoRotate={true} className="w-full h-full" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supported Simulators Registry Card */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan-400" />
          <span>Supported Simulator Registry & Security Invariants</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SIMULATOR_ADAPTERS.map((adapter) => (
            <div
              key={adapter.id}
              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">{adapter.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                  {adapter.description}
                </p>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  Domains: {adapter.domains.join(', ')}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Puzzles: {adapter.supportedPuzzles.join(', ')}</span>
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <span>WCA</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Security Disclaimers */}
        <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 space-y-1.5">
          <strong className="text-slate-200 block mb-0.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Trust Client-Side Extraction Policy</span>
          </strong>
          <p className="leading-relaxed">
            CubeMaster extracts simulator states purely client-side via safe URL query parameters. No external JavaScript is ever evaluated, and no server-side fetching or insecure CORS proxies are utilized.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UrlImportView;
