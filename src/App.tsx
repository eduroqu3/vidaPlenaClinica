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
import { 
  AdminDashboard, 
  AdminStaffManage, 
  AdminPatientsView, 
  AdminAgendaGeneral, 
  AdminClinicSettings 
} from './pages/AdminPages';
import AvailabilityGeneral from './pages/AvailabilityGeneral';

// Placeholder pages for demonstration
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
    <p className="text-slate-500 mt-2">Este módulo está sendo preparado para a próxima expansão.</p>
  </div>
);

function AppContent() {
  const { isFullScreen, session, originalAdminSession, stopImpersonating } = useAuth();
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
      <div className="flex flex-col min-h-screen">
        {originalAdminSession && (
          <div className="bg-gradient-to-r from-[#00A896] to-[#028090] text-white px-4 py-2.5 text-center text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-3 shadow-md relative z-50">
            <span>⚠️ Modo de Apresentação: Simulando acesso como Paciente — {session?.user?.name}</span>
            <button 
              onClick={stopImpersonating}
              className="bg-white text-slate-900 hover:bg-slate-50 active:scale-95 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wide cursor-pointer transition-all shadow-sm shrink-0 border border-transparent"
            >
              Voltar para Painel Admin
            </button>
          </div>
        )}
        <div className="flex-1">
          <PatientPortal />
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }
  
  return (
    <Router>
      <div className="flex flex-col h-screen overflow-hidden">
        {originalAdminSession && (
          <div className="bg-gradient-to-r from-[#00A896] to-[#028090] text-white px-4 py-2.5 text-center text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-3 shadow-md relative z-50">
            <span>⚠️ Modo de Apresentação: Simulando acesso como {session?.user?.name} ({session?.role === 'doctor' ? 'Médico' : 'Recepção'})</span>
            <button 
              onClick={stopImpersonating}
              className="bg-white text-slate-900 hover:bg-slate-50 active:scale-95 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wide cursor-pointer transition-all shadow-sm shrink-0 border border-transparent"
            >
              Voltar para Painel Admin
            </button>
          </div>
        )}
        <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-[#0b1319] font-sans text-slate-900 dark:text-slate-100 transition-colors">
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
                  {session.role === 'admin' ? (
                    <>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/funcionarios" element={<AdminStaffManage />} />
                      <Route path="/pacientes" element={<AdminPatientsView />} />
                      <Route path="/agenda" element={<AdminAgendaGeneral />} />
                      <Route path="/disponibilidade-geral" element={<AvailabilityGeneral />} />
                      <Route path="/configuracoes" element={<AdminClinicSettings />} />
                    </>
                  ) : (
                    <>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/agenda" element={<Agenda />} />
                      <Route path="/historico" element={<History />} />
                      <Route path="/disponibilidade" element={<Availability />} />
                      <Route path="/agendamentos" element={<Appointments />} />
                      <Route path="/pacientes" element={<Patients />} />
                      <Route path="/medicos" element={<Doctors />} />
                    </>
                  )}
                </Routes>
              </div>
            </main>
          </div>
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
