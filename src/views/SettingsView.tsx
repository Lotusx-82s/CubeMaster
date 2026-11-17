import React, { useState } from 'react';
import { 
  HelpCircle, 
  Compass, 
  Sliders, 
  RotateCw,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { useCube } from '../context';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import RubiksCube3D from '../components/3d/RubiksCube3D';
import PageHeader from '../components/common/PageHeader';

export const SettingsView: React.FC = () => {
  const { 
    cubeState, 
    applySingleMove, 
    scrambleCube, 
    resetToSolved,
    playbackSpeed,
    setPlaybackSpeed
  } = useCube();
  const { theme, setTheme } = useTheme();
  const { success, info } = useNotification();

  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const moves = [
    { label: 'U', desc: 'Up Clockwise' },
    { label: "U'", desc: 'Up Counter-CW' },
    { label: 'U2', desc: 'Up 180°' },
    { label: 'D', desc: 'Down Clockwise' },
    { label: "D'", desc: 'Down Counter-CW' },
    { label: 'D2', desc: 'Down 180°' },
    { label: 'R', desc: 'Right Clockwise' },
    { label: "R'", desc: 'Right Counter-CW' },
    { label: 'R2', desc: 'Right 180°' },
    { label: 'L', desc: 'Left Clockwise' },
    { label: "L'", desc: 'Left Counter-CW' },
    { label: 'L2', desc: 'Left 180°' },
    { label: 'F', desc: 'Front Clockwise' },
    { label: "F'", desc: 'Front Counter-CW' },
    { label: 'F2', desc: 'Front 180°' },
    { label: 'B', desc: 'Back Clockwise' },
    { label: "B'", desc: 'Back Counter-CW' },
    { label: 'B2', desc: 'Back 180°' },
  ];

  const faqs = [
    {
      q: 'How should I orient my cube when starting?',
      a: 'CubeMaster uses Orange on Top (U) and White in Front (F). With this orientation, Right (R) is Blue, Back (B) is Yellow, Left (L) is Green, and Bottom (D) is Red. Opposite pairs are Orange/Red, White/Yellow, and Blue/Green.',
    },
    {
      q: 'Why does my camera scan report wrong colors?',
      a: 'Camera sensors are sensitive to color temperature and glares. Ensure bright, even daylight or diffuse room lighting. You can also tap any detected sticker in the preview to cycle to the true color, or use the 3D manual painter.',
    },
    {
      q: 'What causes parity / validation errors?',
      a: 'A standard 3x3 Rubik\'s cube must satisfy strict parity invariants: exactly 9 stickers per color, exactly 6 unique centers, and valid 2-color edges and 3-color corners. A single twisted corner or flipped edge piece makes the cube physically unsolvable.',
    },
    {
      q: 'What solving algorithms are used?',
      a: 'CubeMaster architecture integrates Herbert Kociemba\'s Two-Phase optimal reduction algorithm (which solves cubes in 20-22 moves) and the CFOP (Fridrich) method (Cross, F2L, OLL, PLL) for human-friendly step learning.',
    },
  ];

  const handleScramble = () => {
    scrambleCube(15);
    info('Virtual 3D cube scrambled with 15 WCA moves.', 'Scramble Applied');
  };

  const handleReset = () => {
    resetToSolved();
    success('Virtual 3D cube reset to solved state.', 'Reset Complete');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <PageHeader
        title="Settings & Knowledge Base"
        subtitle="Configure appearance themes, playback speed, practice interactive turns on the virtual 3D cube, and consult WCA notation references."
        badge="Preferences"
        backTo="home"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Move Test Pad</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Click any move to execute it on the live 3D cube.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleScramble}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Scramble</span>
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-6 gap-2">
              {moves.map(({ label, desc }) => (
                <button
                  key={label}
                  onClick={() => applySingleMove(label)}
                  title={desc}
                  className="py-2.5 px-2 rounded-xl text-xs font-extrabold bg-slate-950/80 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/40 text-white border border-slate-800 transition-all cursor-pointer shadow-sm active:scale-95 text-center"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="h-[340px] w-full pt-2">
              <RubiksCube3D
                cubeState={cubeState}
                interactive={false}
                autoRotate={false}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Theme Preferences Card */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Appearance & Theme</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  info('Switched to Dark Theme', 'Theme Updated');
                }}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Moon className="w-6 h-6 text-cyan-400" />
                <span className="font-bold">Dark Theme</span>
                <span className="text-[10px] text-slate-400">Deep slate & cyan neon</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  info('Switched to Light Theme', 'Theme Updated');
                }}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-slate-100 border-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Sun className="w-6 h-6 text-amber-500" />
                <span className="font-bold">Light Theme</span>
                <span className="text-[10px] text-slate-400">Crisp clean daytime view</span>
              </button>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Solver & Playback Preferences</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block font-semibold mb-1.5">
                  Default 3D Playback Speed
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Slow (1.5s)', val: 1500 },
                    { label: 'Normal (1.0s)', val: 1000 },
                    { label: 'Fast (0.5s)', val: 500 },
                  ].map(({ label, val }) => (
                    <button
                      key={val}
                      onClick={() => setPlaybackSpeed(val)}
                      className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer border ${
                        playbackSpeed === val
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-300 block font-semibold mb-1">Active Cube Orientation</span>
                <span className="text-slate-400 block text-[11px] mb-2">Configured with <strong>Orange on Top</strong> and <strong>White in Front</strong>:</span>
                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                  <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#ea580c]" />
                    <span>U: Orange</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#f8fafc] border border-slate-400" />
                    <span className="text-slate-200">F: White</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#2563eb]" />
                    <span>R: Blue</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#facc15]" />
                    <span>B: Yellow</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#16a34a]" />
                    <span>L: Green</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#dc2626]" />
                    <span>D: Red</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Frequently Asked Questions</span>
            </h3>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/50"
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full p-3.5 text-left flex items-center justify-between text-xs font-bold text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
