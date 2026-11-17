import React from 'react';
import { CubeProvider, useCube } from './context';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomeView from './views/HomeView';
import CubeSelectionView from './views/CubeSelectionView';
import CameraScanView from './views/CameraScanView';
import ManualInputView from './views/ManualInputView';
import CubeValidationView from './views/CubeValidationView';
import SolutionView from './views/SolutionView';
import SettingsView from './views/SettingsView';
import UrlImportView from './views/UrlImportView';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import type { AppView } from './types/navigation';

const WORKFLOW_STEPS: { id: string; label: string; views: AppView[]; targetView: AppView }[] = [
  { id: 'step-1', label: '1. Select Puzzle', views: ['select'], targetView: 'select' },
  { id: 'step-2', label: '2. Capture State', views: ['scan', 'manual', 'url-import'], targetView: 'manual' },
  { id: 'step-3', label: '3. Parity Validation', views: ['validate'], targetView: 'validate' },
  { id: 'step-4', label: '4. 3D Solution', views: ['solution'], targetView: 'solution' },
];

const StepProgressBar: React.FC = () => {
  const { currentView, setView } = useCube();

  // Only display progress bar during active solver workflow steps
  const activeStepIdx = WORKFLOW_STEPS.findIndex((step) => step.views.includes(currentView));
  if (activeStepIdx === -1) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md flex items-center justify-between gap-2 overflow-x-auto">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isCurrent = step.views.includes(currentView);
          const isPassed = activeStepIdx > idx;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setView(step.targetView)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : isPassed
                    ? 'text-emerald-400 hover:bg-slate-800/60'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                {isPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                )}
                <span>{step.label}</span>
              </button>

              {idx < WORKFLOW_STEPS.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { currentView, selectedPuzzle } = useCube();

  return (
    <main className="flex-1 flex flex-col w-full relative z-10">
      <StepProgressBar />
      {currentView === 'home' && <HomeView />}
      {currentView === 'select' && <CubeSelectionView />}
      {currentView === 'scan' && <CameraScanView key={selectedPuzzle} />}
      {currentView === 'manual' && <ManualInputView key={selectedPuzzle} />}
      {currentView === 'url-import' && <UrlImportView key={selectedPuzzle} />}
      {currentView === 'validate' && <CubeValidationView key={selectedPuzzle} />}
      {currentView === 'solution' && <SolutionView />}
      {currentView === 'settings' && <SettingsView />}
    </main>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <CubeProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
            {/* Subtle ambient gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
              <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
              <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-blue-600/10 rounded-full blur-3xl" />
              <div className="absolute bottom-10 left-1/4 w-[28rem] h-[28rem] bg-indigo-600/8 rounded-full blur-3xl" />
            </div>

            <Navbar />
            <MainContent />
            <Footer />
          </div>
        </NotificationProvider>
      </CubeProvider>
    </ThemeProvider>
  );
}

export default App;
