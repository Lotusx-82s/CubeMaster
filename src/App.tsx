import React from 'react';
import { CubeProvider, useCube } from './context';
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

const MainContent: React.FC = () => {
  const { currentView } = useCube();

  return (
    <main className="flex-1 flex flex-col w-full relative z-10">
      {currentView === 'home' && <HomeView />}
      {currentView === 'select' && <CubeSelectionView />}
      {currentView === 'scan' && <CameraScanView />}
      {currentView === 'manual' && <ManualInputView />}
      {currentView === 'url-import' && <UrlImportView />}
      {currentView === 'validate' && <CubeValidationView />}
      {currentView === 'solution' && <SolutionView />}
      {currentView === 'settings' && <SettingsView />}
    </main>
  );
};

export function App() {
  return (
    <CubeProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
        {/* Modern subtle ambient gradients */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/4 w-[28rem] h-[28rem] bg-indigo-600/8 rounded-full blur-3xl" />
        </div>

        <Navbar />
        <MainContent />
        <Footer />
      </div>
    </CubeProvider>
  );
}

export default App;
