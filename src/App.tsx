import { ProblemSolverProvider } from './context/ProblemSolverContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UIProvider } from './context/UIContext';
import { useProblemSolver } from './hooks/useProblemSolverContext';
import { Layout } from './components/layout/Layout';
import { ProgressBar } from './components/layout/ProgressBar';
import { Wizard } from './components/wizard/Wizard';

function AppContent() {
  const { state } = useProblemSolver();

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
