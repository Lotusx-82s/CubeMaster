import React from 'react';
import { Camera, Palette, ShieldCheck, Rotate3d, Cpu, Compass } from 'lucide-react';
import { useCube } from '../../context';

export const FeatureGrid: React.FC = () => {
  const { setView } = useCube();

  const features = [
    {
      icon: Camera,
      title: 'AI Camera Vision Scanning',
      description: 'Align each face with the real-time targeting grid. Automatic color extraction samples stickers and guides you through all 6 faces.',
      actionLabel: 'Try Camera Scan',
      actionView: 'scan' as const,
      color: 'from-cyan-500 to-blue-500',
      badge: 'Interactive',
    },
    {
      icon: Palette,
      title: 'Manual 3D & Net Painter',
      description: 'Prefer manual control? Paint stickers directly on an unfolded 2D net or the interactive 3D cube with real-time sticker counters.',
      actionLabel: 'Open 3D Painter',
      actionView: 'manual' as const,
      color: 'from-emerald-500 to-teal-500',
      badge: 'Full Precision',
    },
    {
      icon: ShieldCheck,
      title: 'Comprehensive Parity Validator',
      description: 'Checks sticker counts, centers geometry, edge piece validity, and parity laws before solving to guarantee your cube is solvable.',
      actionLabel: 'Check Validation Rules',
      actionView: 'validate' as const,
      color: 'from-amber-500 to-orange-500',
      badge: 'WCA Rules',
    },
    {
      icon: Rotate3d,
      title: 'Step-by-Step 3D Playback',
      description: 'Watch the virtual cube twist and rotate in real 3D space with play, pause, scrubber controls, and clear Singmaster move notations.',
      actionLabel: 'View 3D Visualizer',
      actionView: 'solution' as const,
      color: 'from-indigo-500 to-purple-500',
      badge: 'Interactive 3D',
    },
    {
      icon: Cpu,
      title: 'Modular Algorithm Architecture',
      description: 'Designed from the ground up to integrate different solving algorithms (Kociemba Two-Phase, CFOP, BFS) across diverse puzzle geometries.',
      actionLabel: 'View Supported Puzzles',
      actionView: 'select' as const,
      color: 'from-sky-500 to-cyan-500',
      badge: 'Extensible',
    },
    {
      icon: Compass,
      title: 'Singmaster Move Notation Guide',
      description: 'Complete breakdown of official standard cube notations (U, D, L, R, F, B, prime counter-clockwise turns, and 180° double turns).',
      actionLabel: 'Learn Cube Notation',
      actionView: 'settings' as const,
      color: 'from-pink-500 to-rose-500',
      badge: 'Reference',
    },
  ];

  return (
    <section className="py-16 border-t border-slate-900 bg-slate-950/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Engineered For Speedcubers & Beginners
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Dual Input. Flawless Verification. 3D Solutions.
          </h3>
          <p className="text-slate-400 text-sm sm:text-base">
            Everything you need to scan, validate, and solve Rubik's Cubes with zero guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-cyan-500/30 hover:bg-slate-900/80 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feature.color} flex items-center justify-center text-white shadow-lg shadow-cyan-500/10 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50">
                      {feature.badge}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                <button
                  onClick={() => setView(feature.actionView)}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer group-hover:translate-x-1 duration-200"
                >
                  <span>{feature.actionLabel}</span>
                  <span>→</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
