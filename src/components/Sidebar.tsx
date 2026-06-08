import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserRound, 
  Clock, 
  Settings, 
  Stethoscope,
  ClipboardList,
  UserCircle,
  Plus,
  Check,
  X,
  Edit,
  Trash2,
  Key,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
    .slice(0, 15);
};

const maskCRM = (value: string) => {
  const cleaned = value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  const numbers = cleaned.replace(/[A-Z]/g, '');
  const letters = cleaned.replace(/[0-9]/g, '').slice(0, 2);
  
  if (letters.length > 0) {
    return `${numbers}-${letters}`;
  }
  return numbers;
};

const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};



const Sidebar = ({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) => {
  const { 
    role, 
    setRole, 
    user, 
    doctors, 
    specialties, 
    switchDoctor, 
    addDoctor, 
    updateDoctor,
    removeDoctor,
    activeDoctorId,
    attendants,
    activeAttendantId,
    switchAttendant,
    addAttendant,
    updateAttendant,
    removeAttendant,
    refreshData,
    patients,
    session
  } = useAuth();
  const location = useLocation();
  const [credentialsSearch, setCredentialsSearch] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const doctorLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Minha Agenda', path: '/agenda', icon: Calendar },
    { name: 'Histórico', path: '/historico', icon: ClipboardList },
  ];

  const attendantLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Agendamentos', path: '/agendamentos', icon: Calendar },
    { name: 'Pacientes', path: '/pacientes', icon: Users },
    { name: 'Médicos', path: '/medicos', icon: Stethoscope },
  ];

  const adminLinks = [
    { name: 'Painel Central', path: '/', icon: LayoutDashboard },
    { name: 'Funcionários', path: '/funcionarios', icon: Stethoscope },
    { name: 'Pacientes', path: '/pacientes', icon: Users },
    { name: 'Agenda', path: '/agenda', icon: Calendar },
    { name: 'Disponibilidade', path: '/disponibilidade-geral', icon: Clock },
    { name: 'Especialidades', path: '/configuracoes', icon: Settings },
  ];

  const links = session?.role === 'admin'
    ? adminLinks
    : (role === 'doctor' ? doctorLinks : attendantLinks);



  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#028090]/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#111c24] border-r border-slate-100 dark:border-slate-800 flex flex-col h-screen z-50 transition-transform duration-300 transform lg:relative lg:translate-x-0 lg:z-auto transition-colors",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between gap-3 border-b border-slate-50 dark:border-slate-800">
          <div className="flex flex-col">
            <div className="flex items-baseline">
              <span className="font-display font-black text-2xl tracking-tight text-[#028090] leading-none">Vida</span>
              <span className="font-display font-normal text-2xl tracking-tight text-[#2D3748] dark:text-slate-300 leading-none ml-1">Plena</span>
              <span className="font-display font-black text-2xl tracking-tight text-[#FF6B35] leading-none">.</span>
            </div>
            <p className="text-[9px] text-[#00A896]/80 font-black uppercase tracking-wider leading-none mt-1.5">Gestão Médica</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 rounded-lg text-[#028090] dark:text-[#E0F2F1] hover:bg-[#E0F2F1]/50 dark:hover:bg-slate-800" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-bold",
                  isActive 
                    ? "bg-[#E0F2F1] dark:bg-[#028090]/20 text-[#028090] dark:text-[#00c9b6] font-black shadow-sm" 
                    : "text-[#2D3748]/75 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-[#028090] dark:hover:text-[#00c9b6]"
                )}
              >
                <Icon size={18} className={cn(
                  "transition-colors stroke-[2.5]",
                  isActive ? "text-[#00A896]" : "text-slate-400 dark:text-slate-500 group-hover:text-[#00A896] dark:group-hover:text-[#00A896]"
                )} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 lg:space-y-4">
          {/* Seção unificada de Visualizar Credenciais movida para o Header */}
          {false && (
            <Dialog onOpenChange={(open) => {
                if (!open) {
                  setCredentialsSearch('');
                  setRevealedPasswords({});
                }
              }}>
              <DialogTrigger className={cn(buttonVariants({ variant: "outline" }), "w-full h-8 text-[10px] gap-1.5 bg-white font-bold text-slate-600 border-[#E0F2F1] hover:border-[#00A896]/50 hover:bg-[#E0F2F1]/10 rounded-xl transition-all")}>
                <Key size={12} className="text-[#00A896] stroke-[2.5]" />
                Senhas de Acesso (Dicionário)
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto rounded-2xl bg-white w-[95vw] sm:w-full">
                <DialogHeader className="p-1">
                  <DialogTitle className="flex items-center gap-2">
                    <Key size={18} className="text-[#00A896]" />
                    Dicionário de Senhas e Credenciais
                  </DialogTitle>
                </DialogHeader>

                {/* Campo de Pesquisa de Credenciais */}
                <div className="relative mt-2 mb-4">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <Input
                    type="text"
                    placeholder="Buscar por CPF (completo ou parte) ou Nome..."
                    value={credentialsSearch}
                    onChange={(e) => setCredentialsSearch(e.target.value)}
                    className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:border-[#00A896] bg-white text-xs w-full shadow-inner"
                  />
                  {credentialsSearch && (
                    <button
                      onClick={() => setCredentialsSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-6 py-1">
                  {/* Processamento dos filtros */}
                  {(() => {
                    const term = credentialsSearch.toLowerCase().trim();
                    const cleanTerm = term.replace(/\D/g, '');

                    const filteredDocs = doctors.filter(doc => {
                      if (!term) return true;
                      const docCpfClean = doc.cpf ? doc.cpf.replace(/\D/g, '') : '';
                      const docCpfFormatted = doc.cpf ? maskCPF(doc.cpf) : '';
                      return doc.name.toLowerCase().includes(term) || 
                             (cleanTerm !== '' && docCpfClean.includes(cleanTerm)) || 
                             docCpfFormatted.includes(term);
                    });

                    const filteredAtts = attendants.filter(att => {
                      if (!term) return true;
                      const attCpfClean = att.cpf ? att.cpf.replace(/\D/g, '') : '';
                      const attCpfFormatted = att.cpf ? maskCPF(att.cpf) : '';
                      return att.name.toLowerCase().includes(term) || 
                             (cleanTerm !== '' && attCpfClean.includes(cleanTerm)) || 
                             attCpfFormatted.includes(term);
                    });

                    const filteredPats = (patients || []).filter(pat => {
                      if (!term) return true;
                      const patCpfClean = pat.id ? pat.id.replace(/\D/g, '') : '';
                      const patCpfFormatted = pat.id ? maskCPF(pat.id) : '';
                      return (pat.name || '').toLowerCase().includes(term) || 
                             (cleanTerm !== '' && patCpfClean.includes(cleanTerm)) || 
                             patCpfFormatted.includes(term);
                    });

                    const hasResults = filteredDocs.length > 0 || filteredAtts.length > 0 || filteredPats.length > 0;

                    if (!hasResults) {
                      return (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
                            <Search size={20} />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">Nenhum cadastro encontrado</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                            Não encontramos nenhum médico, atendente ou paciente correspondente a "{credentialsSearch}".
                          </p>
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Médicos */}
                        {filteredDocs.length > 0 && (
                          <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center px-1">
                              <span>Médicos</span>
                              <span className="text-[10px] text-slate-400 lowercase font-normal">
                                {filteredDocs.length} {filteredDocs.length === 1 ? 'encontrado' : 'encontrados'}
                              </span>
                            </h3>
                            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-slate-50/50">
                              <table className="w-full table-fixed text-xs text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-500 border-b border-slate-100">
                                    <th className="px-3 py-2 w-[40%] truncate">Nome</th>
                                    <th className="px-3 py-2 w-[30%] truncate">CPF (Login)</th>
                                    <th className="px-3 py-2 w-[30%] truncate">Senha</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {filteredDocs.map(doc => {
                                    const isRevealed = revealedPasswords[doc.id] || false;
                                    return (
                                      <tr key={doc.id} className="hover:bg-white transition-colors">
                                        <td className="px-3 py-2 font-medium text-slate-900 truncate" title={doc.name}>{doc.name}</td>
                                        <td className="px-3 py-2 font-mono text-slate-600 truncate">{doc.cpf ? maskCPF(doc.cpf) : '—'}</td>
                                        <td className="px-3 py-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(doc.password || '');
                                                toast.success(`Senha do Dr(a). ${doc.name} copiada!`);
                                              }}
                                              className="font-mono font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-100 transition-colors text-left truncate max-w-[120px] sm:max-w-none"
                                              title="Clique para copiar"
                                            >
                                              {isRevealed ? (doc.password || '—') : '********'}
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setRevealedPasswords(prev => ({
                                                  ...prev,
                                                  [doc.id]: !isRevealed
                                                }));
                                              }}
                                              className="p-1 text-slate-400 hover:text-[#00A896] rounded hover:bg-slate-100 transition-colors shrink-0"
                                              title={isRevealed ? "Ocultar senha" : "Mostrar senha"}
                                            >
                                              {isRevealed ? <Eye size={12} /> : <EyeOff size={12} />}
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Atendentes */}
                        {filteredAtts.length > 0 && (
                          <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center px-1">
                              <span>Atendentes</span>
                              <span className="text-[10px] text-slate-400 lowercase font-normal">
                                {filteredAtts.length} {filteredAtts.length === 1 ? 'encontrado' : 'encontrados'}
                              </span>
                            </h3>
                            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-slate-50/50">
                              <table className="w-full table-fixed text-xs text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-500 border-b border-slate-100">
                                    <th className="px-3 py-2 w-[40%] truncate">Nome</th>
                                    <th className="px-3 py-2 w-[30%] truncate">CPF (Login)</th>
                                    <th className="px-3 py-2 w-[30%] truncate">Senha</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {filteredAtts.map(att => {
                                    const isRevealed = revealedPasswords[att.id] || false;
                                    return (
                                      <tr key={att.id} className="hover:bg-white transition-colors">
                                        <td className="px-3 py-2 font-medium text-slate-900 truncate" title={att.name}>{att.name}</td>
                                        <td className="px-3 py-2 font-mono text-slate-600 truncate">{att.cpf ? maskCPF(att.cpf) : '—'}</td>
                                        <td className="px-3 py-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(att.password || '');
                                                toast.success(`Senha de ${att.name} copiada!`);
                                              }}
                                              className="font-mono font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-100 transition-colors text-left truncate max-w-[120px] sm:max-w-none"
                                              title="Clique para copiar"
                                            >
                                              {isRevealed ? (att.password || '—') : '********'}
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setRevealedPasswords(prev => ({
                                                  ...prev,
                                                  [att.id]: !isRevealed
                                                }));
                                              }}
                                              className="p-1 text-slate-400 hover:text-[#00A896] rounded hover:bg-slate-100 transition-colors shrink-0"
                                              title={isRevealed ? "Ocultar senha" : "Mostrar senha"}
                                            >
                                              {isRevealed ? <Eye size={12} /> : <EyeOff size={12} />}
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Pacientes */}
                        {filteredPats.length > 0 && (
                          <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center px-1">
                              <span>Pacientes</span>
                              <span className="text-[10px] text-slate-400 lowercase font-normal">
                                {filteredPats.length} {filteredPats.length === 1 ? 'encontrado' : 'encontrados'}
                              </span>
                            </h3>
                            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-slate-50/50">
                              <table className="w-full table-fixed text-xs text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-500 border-b border-slate-100">
                                    <th className="px-3 py-2 w-[40%] truncate">Nome</th>
                                    <th className="px-3 py-2 w-[30%] truncate">CPF (Login)</th>
                                    <th className="px-3 py-2 w-[30%] truncate">Senha</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {filteredPats.map(pat => {
                                    const isRevealed = revealedPasswords[pat.id] || false;
                                    return (
                                      <tr key={pat.id} className="hover:bg-white transition-colors">
                                        <td className="px-3 py-2 font-medium text-slate-900 truncate" title={pat.name}>{pat.name}</td>
                                        <td className="px-3 py-2 font-mono text-slate-600 truncate">{pat.id ? maskCPF(pat.id) : '—'}</td>
                                        <td className="px-3 py-2">
                                          {pat.password ? (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <button
                                                onClick={() => {
                                                  navigator.clipboard.writeText(pat.password || '');
                                                  toast.success(`Senha de ${pat.name} copiada!`);
                                                }}
                                                className="font-mono font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-100 transition-colors text-left truncate max-w-[120px] sm:max-w-none"
                                                title="Clique para copiar"
                                              >
                                                {isRevealed ? pat.password : '********'}
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setRevealedPasswords(prev => ({
                                                    ...prev,
                                                    [pat.id]: !isRevealed
                                                  }));
                                                }}
                                                className="p-1 text-slate-400 hover:text-[#00A896] rounded hover:bg-slate-100 transition-colors shrink-0"
                                                title={isRevealed ? "Ocultar senha" : "Mostrar senha"}
                                              >
                                                {isRevealed ? <Eye size={12} /> : <EyeOff size={12} />}
                                              </button>
                                            </div>
                                          ) : (
                                            <span className="text-xs text-slate-400 font-mono italic">Sem senha</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
