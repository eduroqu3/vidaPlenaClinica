import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Agenda from './pages/Agenda';
import Appointments from './pages/Appointments';
import Doctors from './pages/Doctors';
import Availability from './pages/Availability';
import History from './pages/History';
import Login from './pages/Login';
import PatientPortal from './pages/PatientPortal';
import LandingPage from './pages/LandingPage';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

// Placeholder pages for demonstration
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
    <p className="text-slate-500 mt-2">Este módulo está sendo preparado para a próxima expansão.</p>
  </div>
);

function AppContent() {
  const { isFullScreen, session } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [loginView, setLoginView] = React.useState<'staff' | 'patient' | null>(null);

  if (!session) {
    if (loginView) {
      return (
        <>
          <Login onBack={() => setLoginView(null)} defaultTab={loginView} />
          <Toaster position="top-right" />
        </>
      );
    }
    return (
      <>
        <LandingPage 
          onEnterStaff={() => setLoginView('staff')} 
          onEnterPatient={() => setLoginView('patient')} 
        />
        <Toaster position="top-right" />
      </>
    );
  }

  if (session.role === 'patient') {
    return (
      <>
        <PatientPortal />
        <Toaster position="top-right" />
      </>
    );
  }
  
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b1319] font-sans text-slate-900 dark:text-slate-100 transition-colors">
        {!isFullScreen && (
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        )}
        <div className="flex-1 flex flex-col min-w-0">
          {!isFullScreen && (
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
          )}
          <main className={cn(
            "flex-1 overflow-y-auto", 
            isFullScreen ? "p-0" : "p-4 md:p-8"
          )}>
            <div className={cn("mx-auto", !isFullScreen && "max-w-7xl")}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/historico" element={<History />} />
                <Route path="/disponibilidade" element={<Availability />} />
                <Route path="/agendamentos" element={<Appointments />} />
                <Route path="/pacientes" element={<Patients />} />
                <Route path="/medicos" element={<Doctors />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
      <Toaster position="top-right" />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
