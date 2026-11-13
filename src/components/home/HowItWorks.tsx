import React from 'react';
import { Camera, CheckSquare, PlayCircle, Layers, ArrowRight } from 'lucide-react';
import { useCube } from '../../context';

export const HowItWorks: React.FC = () => {
  const { setView } = useCube();

  const steps = [
    {
      num: '01',
      title: 'Select Puzzle Type',
      description: 'Choose your cube geometry (3x3 Standard, 2x2, 4x4, or Pyraminx).',
      icon: Layers,
    },
    {
      num: '02',
      title: 'Scan or Paint Colors',
      description: 'Use your camera to scan each face, or paint stickers directly using the 3D palette.',
      icon: Camera,
    },
    {
      num: '03',
      title: 'Integrity & Parity Check',
      description: 'The engine verifies sticker counts (9 of each color), unique centers, and edge legality.',
      icon: CheckSquare,
    },
    {
      num: '04',
      title: 'Step-by-Step 3D Playback',
      description: 'Follow 3D animated twists with scrubber controls, pause/play, and Singmaster notations.',
      icon: PlayCircle,
    },
  ];

  return (
    <section className="py-20 border-t border-slate-900 bg-slate-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Intuitive Workflow
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How CubeMaster Works
          </h3>
          <p className="text-slate-400 text-sm">
            Four simple steps from a completely scrambled cube to a solved puzzle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-black text-slate-700">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-white mb-2">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Box */}
        <div className="mt-14 p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/20 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xl font-bold text-white">
              Ready to solve your scrambled cube?
            </h4>
            <p className="text-xs text-slate-400">
              Start with manual 3D input or open your camera to scan in seconds.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setView('manual')}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
