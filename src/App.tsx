import { ProblemSolverProvider } from './context/ProblemSolverContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UIProvider } from './context/UIContext';
import { useProblemSolver } from './hooks/useProblemSolverContext';
import { Layout } from './components/layout/Layout';
import { ProgressBar } from './components/layout/ProgressBar';
import { Wizard } from './components/wizard/Wizard';

import { useAuth } from './context/AuthContext';

function AppContent() {
  const { state } = useProblemSolver();
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout header={<ProgressBar currentStep={state.currentStep} />}>
      <Wizard />
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <UIProvider>
        <AuthProvider>
          <ProblemSolverProvider>
            <AppContent />
          </ProblemSolverProvider>
        </AuthProvider>
      </UIProvider>
    </ThemeProvider>
  );
}

export default App;
