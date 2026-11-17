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
  Loader2, 
  Edit3,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { useCube } from '../context';
import PageHeader from '../components/common/PageHeader';
import RubiksCube3D from '../components/3d/RubiksCube3D';
import PuzzlePreview3D from '../components/3d/PuzzlePreview3D';
import { 
  parseSimulatorUrl, 
  SIMULATOR_COMPATIBILITY_REGISTRY,
  type SimulatorParseResult 
} from '../services/simulatorAdapters';
import { parseUrlInput } from '../services/state';
import { PUZZLE_DEFINITIONS } from '../services/puzzles';

const EXAMPLE_URLS = [
  {
    name: 'RubiksCu.be 54-Facelets',
    url: 'https://rubikscu.be/play/?f=DDFRUUFDRBLLDRULFFUFDRFLLBUUUBBDRRUDBBRFLDBLFDBLRBLRFU',
    badge: '3×3 Facelets',
  },
  {
    name: 'Alg.cubing.net (3×3 Scramble)',
    url: 'https://alg.cubing.net/?setup=R_U_R-_U-_F2_D_L2_B-&puzzle=3x3x3',
    badge: '3×3 WCA',
  },
  {
    name: 'Alg.cubing.net (2×2 Pocket)',
    url: 'https://alg.cubing.net/?setup=R_U_R-_U-&puzzle=2x2x2',
    badge: '2×2 Pocket',
  },
  {
    name: 'Alg.cubing.net (4×4 Revenge)',
    url: 'https://alg.cubing.net/?setup=R_U_R-_U-_F2_D_L2_B-&puzzle=4x4x4',
    badge: '4×4 State View',
  },
  {
    name: 'CubeDB.net (3×3)',
    url: 'https://cubedb.net/?puzzle=3&scramble=R_U_R-_U-_F2_D_L2_B-',
    badge: 'CubeDB',
  },
  {
    name: 'CubeMaster Native (3×3)',
    url: 'https://cubemaster.app/?puzzle=3x3&scramble=F_R_U_R-_U-_F-',
    badge: 'Native',
  },
];

export const UrlImportView: React.FC = () => {
  const { 
    setCubeState, 
    setSelectedPuzzle, 
    commitNormalizedState,
    setInputMode, 
    setView
  } = useCube();

  const [inputUrl, setInputUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<SimulatorParseResult | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [showMatrix, setShowMatrix] = useState<boolean>(false);

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
    }, 250);
  };

  // Confirm imported configuration and route to solver
  const handleConfirmAndProceed = () => {
    if (!parseResult || !parseResult.success) return;

    // 1. Process via unified URL input parser
    const { state: normalized } = parseUrlInput(inputUrl);

    if (normalized) {
      commitNormalizedState(normalized);
    } else if (parseResult.puzzleType === '3x3' && parseResult.cubeState3x3) {
      setCubeState(parseResult.cubeState3x3);
      if (parseResult.puzzleType) {
        setSelectedPuzzle(parseResult.puzzleType);
      }
    }

    setInputMode('url');

    // 2. Navigate to Validation view
    setView('validate');
  };

  const puzzleDef = PUZZLE_DEFINITIONS.find(p => p.id === parseResult?.puzzleType) || PUZZLE_DEFINITIONS[1];
  const verifiedSimulators = SIMULATOR_COMPATIBILITY_REGISTRY.filter(s => s.integrationStatus === 'VERIFIED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title="Import Cube Using Simulator URL"
        subtitle="Paste a link from verified external Rubik's cube simulators (e.g. Alg.cubing.net, CubeDB.net, RubiksCu.be) to instantly extract, validate, and solve scrambled puzzle configurations."
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
            <div className="space-y-1">
              <strong className="font-bold text-rose-300 block">Import Error ({parseResult?.errorCode || 'FAILED'})</strong>
              <p className="leading-relaxed">{errorFeedback}</p>
              <div className="pt-2 text-[11px] text-slate-400">
                You can correct the URL above or try one of the verified presets.
              </div>
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
                  {parseResult.scrambleMoves && parseResult.scrambleMoves.length > 0 ? (
                    parseResult.scrambleMoves.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-cyan-300 font-mono font-bold text-xs shadow-sm"
                      >
                        {m}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Direct facelet color state extracted ({parseResult.metadata?.description || '54 facelets'})
                    </span>
                  )}
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

      {/* Simulator Compatibility Registry */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-cyan-400" />
              <span>Simulator Compatibility Registry</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic, zero-trust client-side adapter registry. Only tested integrations are marked as verified.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowMatrix(!showMatrix)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showMatrix ? 'Hide Full Matrix' : 'View Full Compatibility Matrix'}</span>
          </button>
        </div>

        {/* Verified Simulators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {verifiedSimulators.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white text-xs">{entry.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    VERIFIED
                  </span>
                </div>
                <div className="text-[11px] text-cyan-400 font-mono mb-2">
                  {entry.officialDomain}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                  {entry.urlFormat}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Puzzles:</span>
                  <span className="text-white font-medium">{entry.supportedPuzzles.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span className="text-cyan-300 font-mono text-[10px]">{entry.extractionMethod}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Evaluated Unsupported Simulators Matrix (When expanded) */}
        {showMatrix && (
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Tested & Evaluated Simulator Matrix</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Simulator</th>
                    <th className="py-2.5 px-3">Domain</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Supported Puzzles</th>
                    <th className="py-2.5 px-3">Extraction Method</th>
                    <th className="py-2.5 px-3">Technical Evaluation Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {SIMULATOR_COMPATIBILITY_REGISTRY.map((sim) => (
                    <tr key={sim.id} className="hover:bg-slate-900/30">
                      <td className="py-2.5 px-3 font-bold text-white">{sim.name}</td>
                      <td className="py-2.5 px-3 font-mono text-cyan-400">{sim.officialDomain}</td>
                      <td className="py-2.5 px-3">
                        {sim.integrationStatus === 'VERIFIED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            VERIFIED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            UNSUPPORTED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {sim.supportedPuzzles.length > 0 ? sim.supportedPuzzles.join(', ') : 'None'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                        {sim.extractionMethod}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">
                        {sim.testResults.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
