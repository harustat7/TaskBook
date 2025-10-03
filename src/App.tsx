import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const [showLogin, setShowLogin] = useState(true);
  const { user } = useAuth();

  if (user) {
    return <Dashboard />;
  }

  return showLogin ? (
    <Login onSwitchToRegister={() => setShowLogin(false)} />
  ) : (
    <Register onSwitchToLogin={() => setShowLogin(true)} />
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <AppContent />
        </div>
        <footer className="mt-8 py-6 text-center text-sm text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <span>Taskbook</span>
            <span className="mx-2">·</span>
            <span>Built with care, not buzzwords</span>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
