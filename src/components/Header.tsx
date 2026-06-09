import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { 
  Search, 
  UserCircle, 
  Menu, 
  LogOut, 
  Sun, 
  Moon, 
  UserRound, 
  Stethoscope, 
  ChevronDown, 
  X, 
  Check, 
  Edit, 
  Trash2, 
  Plus,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
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

// Helpers de Máscara (copiados do Sidebar para consistência)
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

const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { 
    user, 
    role, 
    setRole,
    logout, 
    theme, 
    toggleTheme,
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
    session,
    patients,
    addPatient,
    impersonate,
    stopImpersonating,
    originalAdminSession
  } = useAuth();

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isAddAttendantOpen, setIsAddAttendantOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [editingAtt, setEditingAtt] = useState<any>(null);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);
  const [confirmDeleteAttId, setConfirmDeleteAttId] = useState<string | null>(null);
  const [roleSearchText, setRoleSearchText] = useState('');
  
  // Local states for presentation and credentials dictionary
  const [activeTab, setActiveTab] = useState<'doctor' | 'attendant' | 'patient'>('doctor');
  const [credentialsSearch, setCredentialsSearch] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const switcherRef = React.useRef<HTMLDivElement>(null);

  // Fecha o menu de troca ao clicar por fora (guardado de cliques em modais)
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (target.closest('[role="dialog"]') || target.closest('[data-state="open"]')) {
          return;
        }
        setIsSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentDoctor = doctors?.find(doc => doc.id === activeDoctorId);
  const currentAttendant = attendants?.find(att => att.id === activeAttendantId);

  const handleAddDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cpf = formData.get('cpf') as string;
    try {
      const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '';
      if (cleanCpf.length !== 11) {
        toast.error('CPF inválido. Deve conter 11 números.');
        return;
      }
      await addDoctor({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        crm: formData.get('crm') as string,
        phone: formData.get('phone') as string,
        specialty_id: formData.get('specialty_id') as string,
        cpf: cpf,
      });
      setIsAddDoctorOpen(false);
    } catch (error) {
      // Já tratado
    }
  };

  const handleUpdateDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDoc) return;
    const formData = new FormData(e.currentTarget);
    const cpf = formData.get('cpf') as string;
    try {
      const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '';
      if (cleanCpf.length !== 11) {
        toast.error('CPF inválido. Deve conter 11 números.');
        return;
      }
      await updateDoctor(editingDoc.id, {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        crm: formData.get('crm') as string,
        phone: formData.get('phone') as string,
        specialty_id: formData.get('specialty_id') as string,
        cpf: cpf,
      });
      setEditingDoc(null);
    } catch (error) {
      // Já tratado
    }
  };

  const handleAddAttendant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cpf = formData.get('cpf') as string;
    try {
      const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '';
      if (cleanCpf.length !== 11) {
        toast.error('CPF inválido. Deve conter 11 números.');
        return;
      }
      await addAttendant({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        cpf: cpf,
      });
      setIsAddAttendantOpen(false);
    } catch (error) {
      // Já tratado
    }
  };

  const handleUpdateAttendant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAtt) return;
    const formData = new FormData(e.currentTarget);
    const cpf = formData.get('cpf') as string;
    try {
      const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '';
      if (cleanCpf.length !== 11) {
        toast.error('CPF inválido. Deve conter 11 números.');
        return;
      }
      await updateAttendant(editingAtt.id, {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        cpf: cpf,
      });
      setEditingAtt(null);
    } catch (error) {
      // Já tratado
    }
  };

  const handleAddPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cpf = formData.get('cpf') as string;
    try {
      const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '';
      if (cleanCpf.length !== 11) {
        toast.error('CPF inválido. Deve conter 11 números.');
        return;
      }
      await addPatient({
        id: cleanCpf,
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        birth_date: formData.get('birth_date') as string,
      });
      setIsAddPatientOpen(false);
    } catch (error) {
      // Já tratado
    }
  };

  return (
    <>
      <header className="h-16 md:h-20 bg-white dark:bg-[#111c24] border-b border-slate-200 dark:border-slate-800 px-2 sm:px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-1.5 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden h-9 w-9 rounded-xl text-slate-500 dark:text-slate-400 shrink-0"
            onClick={onMenuClick}
          >
            <Menu size={20} />
          </Button>

          {/* Troca de Perfil e Impersonação no Menu Superior para área Admin */}
          {session?.role === 'admin' && (
            <>
              <div className="relative" ref={switcherRef}>
              <button
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-3.5 md:py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left hover:bg-[#E0F2F1]/40 dark:hover:bg-slate-800/60 transition-all group cursor-pointer focus:outline-none shrink-0"
                title="Simular perfil de outro usuário do sistema"
              >
                <div className="flex items-center justify-center w-7 h-7 bg-[#028090]/10 text-[#028090] dark:text-[#00c9b6] rounded-lg group-hover:scale-105 transition-transform shrink-0">
                  <UserRound size={15} />
                </div>
                <div className="hidden sm:block max-w-[100px] md:max-w-[180px] lg:max-w-[240px] truncate pr-1">
                  <div className="flex items-center gap-1.5 leading-none">
                    <p className="text-[9px] uppercase font-black text-slate-400 hidden xl:block">
                      Módulo de Teste
                    </p>
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">
                    Simular Usuário...
                  </p>
                </div>
                <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-200 shrink-0", isSwitcherOpen && "rotate-180")} />
              </button>

              {isSwitcherOpen && (
                <div className="absolute left-0 mt-2 w-72 sm:w-85 bg-white dark:bg-[#111c24] border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 flex flex-col font-sans animate-scale shrink-0">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 mb-2 flex items-center justify-between">
                    <span>Impersonar Conta do Usuário</span>
                    <span className="text-[8px] font-extrabold text-amber-500 tracking-widest uppercase bg-amber-500/10 px-1 py-0.5 rounded leading-none">MODO HOMOLOGAÇÃO</span>
                  </p>

                  {/* Tabs para Alternar entre Médico, Atendente e Paciente */}
                  <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-3 border border-slate-150 dark:border-slate-800 shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('attendant');
                        setRoleSearchText('');
                      }}
                      className={cn(
                        "py-1.5 px-0.5 rounded-lg text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer",
                        activeTab === 'attendant'
                          ? "bg-white dark:bg-[#111c24] text-[#028090] dark:text-[#00c9b6] shadow-sm font-black"
                          : "text-slate-500 dark:text-slate-400 hover:text-[#028090] dark:hover:text-[#00c9b6]"
                      )}
                    >
                      Recepção
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('doctor');
                        setRoleSearchText('');
                      }}
                      className={cn(
                        "py-1.5 px-0.5 rounded-lg text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer",
                        activeTab === 'doctor'
                          ? "bg-white dark:bg-[#111c24] text-[#028090] dark:text-[#00c9b6] shadow-sm font-black"
                          : "text-slate-500 dark:text-slate-400 hover:text-[#028090] dark:hover:text-[#00c9b6]"
                      )}
                    >
                      Médico
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('patient');
                        setRoleSearchText('');
                      }}
                      className={cn(
                        "py-1.5 px-0.5 rounded-lg text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer",
                        activeTab === 'patient'
                          ? "bg-white dark:bg-[#111c24] text-[#028090] dark:text-[#00c9b6] shadow-sm font-black"
                          : "text-slate-500 dark:text-slate-400 hover:text-[#028090] dark:hover:text-[#00c9b6]"
                      )}
                    >
                      Paciente
                    </button>
                  </div>

                  {/* Pesquisa na lista embutida */}
                  <div className="relative mb-2 shrink-0">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Search size={12} className="text-slate-400" />
                    </span>
                    <input
                      type="text"
                      placeholder={
                        activeTab === 'doctor' 
                          ? "Buscar médico..." 
                          : activeTab === 'attendant' 
                            ? "Buscar atendente..." 
                            : "Buscar paciente..."
                      }
                      value={roleSearchText}
                      onChange={(e) => setRoleSearchText(e.target.value)}
                      className="pl-7 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-[#00A896] bg-slate-50 dark:bg-slate-900 w-full focus:outline-none transition-all font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                    />
                    {roleSearchText && (
                      <button
                        onClick={() => setRoleSearchText('')}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Lista com base no perfil escolhido */}
                  <div className="space-y-1 max-h-48 overflow-y-auto flex-1 pr-0.5 mt-1">
                    {activeTab === 'doctor' && (
                      <>
                        {(() => {
                          const term = roleSearchText.toLowerCase().trim();
                          const cleanTerm = term.replace(/\D/g, '');
                          const filtered = doctors.filter(doc => {
                            if (!term) return true;
                            const cpfClean = doc.cpf ? doc.cpf.replace(/\D/g, '') : '';
                            const cpfFormatted = doc.cpf ? maskCPF(doc.cpf) : '';
                            return doc.name.toLowerCase().includes(term) ||
                                   (cleanTerm !== '' && cpfClean.includes(cleanTerm)) ||
                                   cpfFormatted.includes(term);
                          });

                          if (filtered.length === 0) {
                            return (
                              <p className="text-[10px] text-slate-400 italic text-center py-4">
                                Nenhum médico encontrado
                              </p>
                            );
                          }

                          return filtered.map((doc) => (
                            <div 
                              key={doc.id} 
                              className="group/item flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                            >
                              <button
                                onClick={() => {
                                  impersonate('doctor', doc.id);
                                  setIsSwitcherOpen(false);
                                }}
                                className="flex-1 flex items-center gap-2 px-1 py-1 text-xs transition-colors truncate font-semibold focus:outline-none cursor-pointer text-slate-600 dark:text-slate-300 hover:text-[#00A896]"
                              >
                                <UserCircle size={14} className="text-slate-400 shrink-0" />
                                <div className="flex flex-col text-left truncate flex-1 min-w-0">
                                  <span className="truncate text-[11px] font-bold">{doc.name}</span>
                                  {doc.cpf ? (
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono scale-[0.95] origin-left truncate block font-normal leading-none mt-0.5">
                                      CPF: {maskCPF(doc.cpf)}
                                    </span>
                                  ) : null}
                                </div>
                              </button>

                              <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                                {confirmDeleteDocId === doc.id ? (
                                  <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/20 px-1 border border-red-200 dark:border-red-900/40 rounded shrink-0">
                                    <span className="text-[9px] font-bold text-red-600">Excluir?</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeDoctor(doc.id);
                                        setConfirmDeleteDocId(null);
                                      }}
                                      className="text-[9px] font-bold text-red-700 bg-red-100 dark:bg-red-900/40 px-1 rounded transition-colors"
                                    >
                                      Sim
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteDocId(null);
                                      }}
                                      className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 rounded transition-colors"
                                    >
                                      Não
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingDoc(doc);
                                      }}
                                      className="p-1 text-slate-400 hover:text-[#00A896] rounded bg-transparent cursor-pointer"
                                      title="Editar"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteDocId(doc.id);
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-600 rounded bg-transparent cursor-pointer"
                                      title="Excluir"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ));
                        })()}
                      </>
                    )}

                    {activeTab === 'attendant' && (
                      <>
                        {(() => {
                          const term = roleSearchText.toLowerCase().trim();
                          const cleanTerm = term.replace(/\D/g, '');
                          const filtered = attendants.filter(att => {
                            if (!term) return true;
                            const cpfClean = att.cpf ? att.cpf.replace(/\D/g, '') : '';
                            const cpfFormatted = att.cpf ? maskCPF(att.cpf) : '';
                            return att.name.toLowerCase().includes(term) ||
                                   (cleanTerm !== '' && cpfClean.includes(cleanTerm)) ||
                                   cpfFormatted.includes(term);
                          });

                          if (filtered.length === 0) {
                            return (
                              <p className="text-[10px] text-slate-400 italic text-center py-4">
                                Nenhum atendente encontrado
                              </p>
                            );
                          }

                          return filtered.map((att) => (
                            <div 
                              key={att.id} 
                              className="group/item flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                            >
                              <button
                                onClick={() => {
                                  impersonate('attendant', att.id);
                                  setIsSwitcherOpen(false);
                                }}
                                className="flex-1 flex items-center gap-2 px-1 py-1 text-xs transition-colors truncate font-semibold focus:outline-none cursor-pointer text-slate-600 dark:text-slate-300 hover:text-[#00A896]"
                              >
                                <UserCircle size={14} className="text-slate-400 shrink-0" />
                                <div className="flex flex-col text-left truncate flex-1 min-w-0">
                                  <span className="truncate text-[11px] font-bold">{att.name}</span>
                                  {att.cpf ? (
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono scale-[0.95] origin-left truncate block font-normal leading-none mt-0.5">
                                      CPF: {maskCPF(att.cpf)}
                                    </span>
                                  ) : null}
                                </div>
                              </button>

                              <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                                {confirmDeleteAttId === att.id ? (
                                  <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/20 px-1 border border-red-200 dark:border-red-900/40 rounded shrink-0">
                                    <span className="text-[9px] font-bold text-red-600">Excluir?</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeAttendant(att.id);
                                        setConfirmDeleteAttId(null);
                                      }}
                                      className="text-[9px] font-bold text-red-700 bg-red-100 dark:bg-red-900/40 px-1 rounded transition-colors"
                                    >
                                      Sim
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteAttId(null);
                                      }}
                                      className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 rounded transition-colors"
                                    >
                                      Não
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingAtt(att);
                                      }}
                                      className="p-1 text-slate-400 hover:text-[#00A896] rounded bg-transparent cursor-pointer"
                                      title="Editar"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteAttId(att.id);
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-600 rounded bg-transparent cursor-pointer"
                                      title="Excluir"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ));
                        })()}
                      </>
                    )}

                    {activeTab === 'patient' && (
                      <>
                        {(() => {
                          const term = roleSearchText.toLowerCase().trim();
                          const cleanTerm = term.replace(/\D/g, '');
                          const filtered = (patients || []).filter(pat => {
                            if (!term) return true;
                            const cpfClean = pat.id ? pat.id.replace(/\D/g, '') : '';
                            const cpfFormatted = pat.id ? maskCPF(pat.id) : '';
                            return (pat.name || '').toLowerCase().includes(term) ||
                                   (cleanTerm !== '' && cpfClean.includes(cleanTerm)) ||
                                   cpfFormatted.includes(term);
                          });

                          if (filtered.length === 0) {
                            return (
                              <p className="text-[10px] text-slate-400 italic text-center py-4">
                                Nenhum paciente encontrado
                              </p>
                            );
                          }

                          return filtered.map((pat) => (
                            <div 
                              key={pat.id} 
                              className="group/item flex items-center justify-between gap-1 px-1.5 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                            >
                              <button
                                onClick={() => {
                                  impersonate('patient', pat.id);
                                  setIsSwitcherOpen(false);
                                }}
                                className="flex-1 flex items-center gap-2 px-1 py-1 text-xs transition-colors truncate font-semibold focus:outline-none cursor-pointer text-slate-600 dark:text-slate-300 hover:text-[#028090]"
                              >
                                <UserCircle size={14} className="text-slate-400 shrink-0" />
                                <div className="flex flex-col text-left truncate flex-1 min-w-0">
                                  <span className="truncate text-[11px] font-bold">{pat.name}</span>
                                  {pat.id ? (
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono scale-[0.95] origin-left truncate block font-normal leading-none mt-0.5">
                                      CPF: {maskCPF(pat.id)}
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            </div>
                          ));
                        })()}
                      </>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 mt-2.5 pt-2 shrink-0">
                    {activeTab === 'doctor' ? (
                      <button
                        onClick={() => {
                          setIsAddDoctorOpen(true);
                          setIsSwitcherOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-[#028090] hover:bg-slate-50 dark:hover:bg-slate-900 border border-dashed border-slate-200 dark:border-[#111c24] transition-all cursor-pointer"
                      >
                        <Plus size={11} className="stroke-[2.5]" />
                        Novo Médico
                      </button>
                    ) : activeTab === 'attendant' ? (
                      <button
                        onClick={() => {
                          setIsAddAttendantOpen(true);
                          setIsSwitcherOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-[#028090] hover:bg-slate-50 dark:hover:bg-slate-900 border border-dashed border-slate-200 dark:border-[#111c24] transition-all cursor-pointer"
                      >
                        <Plus size={11} className="stroke-[2.5]" />
                        Novo Atendente
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsAddPatientOpen(true);
                          setIsSwitcherOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-[#028090] hover:bg-slate-50 dark:hover:bg-slate-900 border border-dashed border-slate-200 dark:border-[#111c24] transition-all cursor-pointer"
                      >
                        <Plus size={11} className="stroke-[2.5]" />
                        Novo Paciente
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Painel de Credenciais de Teste / Dicionário para Área Admin */}
            <Dialog onOpenChange={(open) => {
                if (!open) {
                  setCredentialsSearch('');
                  setRevealedPasswords({});
                }
              }}>
              <DialogTrigger className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-3.5 md:py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left hover:bg-[#E0F2F1]/40 dark:hover:bg-slate-800/60 transition-all group cursor-pointer focus:outline-none shrink-0" title="Ver senhas e credenciais de todas as contas do sistema">
                <div className="flex items-center justify-center w-7 h-7 bg-[#028090]/10 text-[#028090] dark:text-[#00c9b6] rounded-lg group-hover:scale-105 transition-transform shrink-0">
                  <Key size={15} className="text-[#028090] dark:text-[#00c9b6]" />
                </div>
                <div className="hidden sm:block max-w-[100px] md:max-w-[180px] lg:max-w-[240px] truncate pr-1">
                  <div className="flex items-center gap-1.5 leading-none">
                    <p className="text-[9px] uppercase font-black text-slate-400 hidden xl:block">
                      Credenciais
                    </p>
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">
                    Painel de Contas...
                  </p>
                </div>
                <div className="hidden sm:block w-3.5 h-3.5 shrink-0" /> {/* Espaçador invisível para manter simetria perfeita com o outro botão */}
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#111c24] w-[95vw] sm:w-full border dark:border-slate-800 font-sans z-[100]">
                <DialogHeader className="p-1 dark:text-slate-100">
                  <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
                    <div className="flex items-center gap-2">
                      <Key size={18} className="text-[#028090]" />
                      <span>Dicionário de Senhas e Credenciais</span>
                    </div>
                    <span className="text-[8.5px] font-black tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-1 rounded uppercase mr-4 leading-none inline-block w-fit">
                      Ambiente de Homologação / Testes
                    </span>
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
                    className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-[#028090] bg-white dark:bg-slate-900 text-xs w-full shadow-inner text-slate-800 dark:text-slate-100"
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
                          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-3 border border-slate-100 dark:border-slate-800">
                            <Search size={20} />
                          </div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum cadastro encontrado</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                            Não encontramos nenhum médico, atendente ou paciente correspondente a "{credentialsSearch}".
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {/* Médicos */}
                        {filteredDocs.length > 0 && (
                          <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center px-1">
                              <span>Médicos</span>
                              <span className="text-[10px] text-slate-400 lowercase font-normal">
                                {filteredDocs.length} {filteredDocs.length === 1 ? 'encontrado' : 'encontrados'}
                              </span>
                            </h3>
                            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-slate-50/50 dark:bg-slate-900/10">
                              <table className="w-full table-fixed text-xs text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-3 py-2 w-[40%] truncate">Nome</th>
                                    <th className="px-3 py-2 w-[30%] truncate">CPF (Login)</th>
                                    <th className="px-3 py-2 w-[30%] truncate">Senha</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {filteredDocs.map(doc => {
                                    const isRevealed = revealedPasswords[doc.id] || false;
                                    return (
                                      <tr key={doc.id} className="hover:bg-white dark:hover:bg-slate-900/45 transition-colors">
                                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100 truncate" title={doc.name}>{doc.name}</td>
                                        <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400 truncate">{doc.cpf ? maskCPF(doc.cpf) : '—'}</td>
                                        <td className="px-3 py-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(doc.password || '');
                                                toast.success(`Senha do Dr(a). ${doc.name} copiada!`);
                                              }}
                                              className="font-mono font-bold text-emerald-750 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/45 transition-colors text-left truncate max-w-[120px] sm:max-w-none cursor-pointer"
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
                                              className="p-1 text-slate-400 hover:text-[#00A896] rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
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
                            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-slate-50/50 dark:bg-slate-900/10">
                              <table className="w-full table-fixed text-xs text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-3 py-2 w-[40%] truncate">Nome</th>
                                    <th className="px-3 py-2 w-[30%] truncate">CPF (Login)</th>
                                    <th className="px-3 py-2 w-[30%] truncate">Senha</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {filteredAtts.map(att => {
                                    const isRevealed = revealedPasswords[att.id] || false;
                                    return (
                                      <tr key={att.id} className="hover:bg-white dark:hover:bg-slate-900/45 transition-colors">
                                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100 truncate" title={att.name}>{att.name}</td>
                                        <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400 truncate">{att.cpf ? maskCPF(att.cpf) : '—'}</td>
                                        <td className="px-3 py-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(att.password || '');
                                                toast.success(`Senha de ${att.name} copiada!`);
                                              }}
                                              className="font-mono font-bold text-emerald-750 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/45 transition-colors text-left truncate max-w-[120px] sm:max-w-none cursor-pointer"
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
                                              className="p-1 text-slate-400 hover:text-[#00A896] rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
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
                            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-slate-50/50 dark:bg-slate-900/10">
                              <table className="w-full table-fixed text-xs text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-3 py-2 w-[40%] truncate">Nome</th>
                                    <th className="px-3 py-2 w-[30%] truncate">CPF (Login)</th>
                                    <th className="px-3 py-2 w-[30%] truncate">Senha</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {filteredPats.map(pat => {
                                    const isRevealed = revealedPasswords[pat.id] || false;
                                    return (
                                      <tr key={pat.id} className="hover:bg-white dark:hover:bg-slate-900/45 transition-colors">
                                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100 truncate" title={pat.name}>{pat.name}</td>
                                        <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400 truncate">{pat.id ? maskCPF(pat.id) : '—'}</td>
                                        <td className="px-3 py-2">
                                          {pat.password ? (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <button
                                                onClick={() => {
                                                  navigator.clipboard.writeText(pat.password || '');
                                                  toast.success(`Senha de ${pat.name} copiada!`);
                                                }}
                                                className="font-mono font-bold text-emerald-750 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/45 transition-colors text-left truncate max-w-[120px] sm:max-w-none cursor-pointer"
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
                                                className="p-1 text-slate-400 hover:text-[#00A896] rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
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
                      </div>
                    );
                  })()}
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          {/* Toggle de Tema Claro/Escuro */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {theme === 'dark' ? (
              <Sun size={19} className="text-amber-500 stroke-[2.5] animate-scale" />
            ) : (
              <Moon size={19} className="text-slate-600 stroke-[2.5]" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 md:gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 p-1 md:p-1.5 rounded-2xl transition-colors cursor-pointer text-left focus:outline-none border-none">
              <div className="text-right hidden sm:block font-sans">
                <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
                  {session?.role === 'admin' ? 'Administrador' : user?.name}
                </p>
                <div className="mt-1 flex items-center justify-end gap-1.5">
                  {session?.role === 'admin' ? (
                    <Badge variant="outline" className="text-[9px] md:text-[10px] h-3.5 md:h-4 px-1.5 uppercase font-black tracking-widest border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-[#152e2a] text-[#00A896]">
                      Administrador
                    </Badge>
                  ) : (
                    <Badge variant={role === 'doctor' ? 'default' : 'secondary'} className="text-[9px] md:text-[10px] h-3.5 md:h-4 px-1.5 uppercase font-black tracking-widest border-none">
                      {role === 'doctor' ? 'Médico' : 'Recepção'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                <UserCircle size={32} strokeWidth={1} className="md:w-10 md:h-10" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 bg-white dark:bg-[#111c24] p-2.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 font-sans z-50">
              <div className="px-2 py-1.5">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Conta Ativa</p>
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate mt-0.5" title={session?.role === 'admin' ? 'Administrador' : user?.name}>
                  {session?.role === 'admin' ? 'Administrador' : user?.name}
                </p>
                <p className="text-[10px] text-[#00A896] font-black uppercase tracking-widest mt-0.5">
                  {session?.role === 'admin' ? 'Administrador' : (role === 'doctor' ? 'Médico' : 'Recepção')}
                </p>
              </div>
              <DropdownMenuSeparator className="-mx-2.5 my-2 h-px bg-slate-100 dark:bg-slate-800" />
              <DropdownMenuItem 
                onClick={logout}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-500 focus:text-red-500 focus:bg-red-50/50 dark:focus:bg-red-950/20 cursor-pointer rounded-xl p-2 text-xs font-bold transition-all"
              >
                <LogOut size={13} className="text-slate-400 dark:text-slate-500 group-hover:text-red-500 shrink-0" />
                Sair da Conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* MODAL: CRIAR NOVO MÉDICO */}
      <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white dark:bg-[#111c24] w-[95vw] sm:w-full border dark:border-slate-800 font-sans">
          <DialogHeader className="text-slate-900 dark:text-slate-100">
            <DialogTitle>Criar Novo Médico</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDoctor} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hdr-name" className="text-slate-700 dark:text-slate-300">Nome do Médico</Label>
              <Input id="hdr-name" name="name" placeholder="Ex: Dr. Alberto Santos" required className="rounded-xl custom-input-theme" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hdr-cpf" className="text-slate-700 dark:text-slate-300">CPF</Label>
              <Input 
                id="hdr-cpf" 
                name="cpf" 
                placeholder="000.000.000-00" 
                required
                className="rounded-xl custom-input-theme"
                onChange={(e) => e.target.value = maskCPF(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hdr-specialty_id" className="text-slate-700 dark:text-slate-300">Especialidade</Label>
              {specialties.length === 0 ? (
                <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-100 dark:border-red-900/40 flex flex-col gap-1.5">
                  <span>Nenhuma especialidade no banco de dados.</span>
                  <Button 
                    type="button" 
                    onClick={async () => {
                      const toastId = toast.loading("Carregando e cadastrando especialidades padrão...");
                      try {
                        await refreshData();
                        toast.success("Dados recarregados!", { id: toastId });
                      } catch (err) {
                        toast.error("Falha ao recarregar.", { id: toastId });
                      }
                    }} 
                    className="h-7 text-[10px] bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 w-max"
                  >
                    Sincronizar especialidades
                  </Button>
                </div>
              ) : (
                <select 
                  id="hdr-specialty_id" 
                  name="specialty_id" 
                  required 
                  className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A896] dark:focus:ring-[#00A896] dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="" className="dark:bg-slate-900">Selecione uma especialidade</option>
                  {specialties.map(spec => (
                    <option key={spec.id} value={spec.id} className="dark:bg-slate-900">{spec.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hdr-email" className="text-slate-700 dark:text-slate-300">E-mail</Label>
              <Input id="hdr-email" name="email" type="email" placeholder="alberto@clinica.com" required className="rounded-xl custom-input-theme" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hdr-crm" className="text-slate-700 dark:text-slate-300">CRM</Label>
                <Input 
                  id="hdr-crm" 
                  name="crm" 
                  placeholder="00000-UF" 
                  required 
                  className="rounded-xl custom-input-theme"
                  onChange={(e) => e.target.value = maskCRM(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hdr-phone" className="text-slate-700 dark:text-slate-300">Telefone</Label>
                <Input 
                  id="hdr-phone" 
                  name="phone" 
                  placeholder="(11) 99999-9999" 
                  required 
                  className="rounded-xl custom-input-theme"
                  onChange={(e) => e.target.value = maskPhone(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-[#028090] hover:bg-[#00a896] text-white rounded-xl font-bold">
                Criar e Acessar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR MÉDICO */}
      <Dialog open={!!editingDoc} onOpenChange={(open) => !open && setEditingDoc(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white dark:bg-[#111c24] w-[95vw] sm:w-full border dark:border-slate-800 font-sans">
          <DialogHeader className="text-slate-900 dark:text-slate-100">
            <DialogTitle>Editar Médico</DialogTitle>
          </DialogHeader>
          {editingDoc && (
            <form onSubmit={handleUpdateDoctor} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="hdr-edit-doc-name" className="text-slate-700 dark:text-slate-300">Nome do Médico</Label>
                <Input id="hdr-edit-doc-name" name="name" defaultValue={editingDoc.name} required className="rounded-xl custom-input-theme" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hdr-edit-doc-cpf" className="text-slate-700 dark:text-slate-300">CPF</Label>
                <Input 
                  id="hdr-edit-doc-cpf" 
                  name="cpf" 
                  defaultValue={editingDoc.cpf || ''}
                  placeholder="000.000.000-00" 
                  required
                  className="rounded-xl custom-input-theme"
                  onChange={(e) => e.target.value = maskCPF(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hdr-edit-doc-specialty_id" className="text-slate-700 dark:text-slate-300">Especialidade</Label>
                {specialties.length === 0 ? (
                  <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/25 p-2.5 rounded-xl border border-red-100 dark:border-red-900/40 flex flex-col gap-1.5">
                    <span>Nenhuma especialidade no banco de dados.</span>
                    <Button 
                      type="button" 
                      onClick={async () => {
                        const toastId = toast.loading("Carregando e cadastrando especialidades padrão...");
                        try {
                          await refreshData();
                          toast.success("Dados recarregados!", { id: toastId });
                        } catch (err) {
                          toast.error("Falha ao recarregar.", { id: toastId });
                        }
                      }} 
                      className="h-7 text-[10px] bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 w-max"
                    >
                      Sincronizar especialidades
                    </Button>
                  </div>
                ) : (
                  <select 
                    id="hdr-edit-doc-specialty_id" 
                    name="specialty_id" 
                    defaultValue={editingDoc.specialty_id}
                    required 
                    className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A896] dark:focus:ring-[#00A896] dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="" className="dark:bg-slate-900">Selecione uma especialidade</option>
                    {specialties.map(spec => (
                      <option key={spec.id} value={spec.id} className="dark:bg-slate-900">{spec.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="hdr-edit-doc-email" className="text-slate-700 dark:text-slate-300">E-mail</Label>
                <Input id="hdr-edit-doc-email" name="email" type="email" defaultValue={editingDoc.email} required className="rounded-xl custom-input-theme" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hdr-edit-doc-crm" className="text-slate-700 dark:text-slate-300">CRM</Label>
                  <Input 
                    id="hdr-edit-doc-crm" 
                    name="crm" 
                    defaultValue={editingDoc.crm}
                    placeholder="00000-UF" 
                    required 
                    className="rounded-xl custom-input-theme"
                    onChange={(e) => e.target.value = maskCRM(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hdr-edit-doc-phone" className="text-slate-700 dark:text-slate-300">Telefone</Label>
                  <Input 
                    id="hdr-edit-doc-phone" 
                    name="phone" 
                    defaultValue={editingDoc.phone}
                    placeholder="(11) 99999-9999" 
                    required 
                    className="rounded-xl custom-input-theme"
                    onChange={(e) => e.target.value = maskPhone(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-[#028090] hover:bg-[#00a896] text-white rounded-xl font-bold">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CRIAR NOVO ATENDENTE */}
      <Dialog open={isAddAttendantOpen} onOpenChange={setIsAddAttendantOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white dark:bg-[#111c24] w-[95vw] sm:w-full border dark:border-slate-800 font-sans">
          <DialogHeader className="text-slate-900 dark:text-slate-100">
            <DialogTitle>Criar Novo Atendente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAttendant} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hdr-att-name" className="text-slate-700 dark:text-slate-300">Nome do Atendente</Label>
              <Input id="hdr-att-name" name="name" placeholder="Ex: Maria de Souza" required className="rounded-xl custom-input-theme" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hdr-att-cpf" className="text-slate-700 dark:text-slate-300">CPF</Label>
              <Input 
                id="hdr-att-cpf" 
                name="cpf" 
                placeholder="000.000.000-00" 
                required
                className="rounded-xl custom-input-theme"
                onChange={(e) => e.target.value = maskCPF(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hdr-att-email" className="text-slate-700 dark:text-slate-300">E-mail</Label>
              <Input id="hdr-att-email" name="email" type="email" placeholder="maria@clinica.com" required className="rounded-xl custom-input-theme" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hdr-att-phone" className="text-slate-700 dark:text-slate-300">Telefone</Label>
              <Input 
                id="hdr-att-phone" 
                name="phone" 
                placeholder="(11) 99999-9999" 
                required 
                className="rounded-xl custom-input-theme"
                onChange={(e) => e.target.value = maskPhone(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-[#028090] hover:bg-[#00a896] text-white rounded-xl font-bold">
                Criar e Acessar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR ATENDENTE */}
      <Dialog open={!!editingAtt} onOpenChange={(open) => !open && setEditingAtt(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white dark:bg-[#111c24] w-[95vw] sm:w-full border dark:border-slate-800 font-sans">
          <DialogHeader className="text-slate-900 dark:text-slate-100">
            <DialogTitle>Editar Atendente</DialogTitle>
          </DialogHeader>
          {editingAtt && (
            <form onSubmit={handleUpdateAttendant} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="hdr-edit-att-name" className="text-slate-700 dark:text-slate-300">Nome do Atendente</Label>
                <Input id="hdr-edit-att-name" name="name" defaultValue={editingAtt.name} required className="rounded-xl custom-input-theme" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hdr-edit-att-cpf" className="text-slate-700 dark:text-slate-300">CPF</Label>
                <Input 
                  id="hdr-edit-att-cpf" 
                  name="cpf" 
                  defaultValue={editingAtt.cpf || ''}
                  placeholder="000.000.000-00" 
                  required
                  className="rounded-xl custom-input-theme"
                  onChange={(e) => e.target.value = maskCPF(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hdr-edit-att-email" className="text-slate-700 dark:text-slate-300">E-mail</Label>
                <Input id="hdr-edit-att-email" name="email" type="email" defaultValue={editingAtt.email} required className="rounded-xl custom-input-theme" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hdr-edit-att-phone" className="text-slate-700 dark:text-slate-300">Telefone</Label>
                <Input 
                  id="hdr-edit-att-phone" 
                  name="phone" 
                  defaultValue={editingAtt.phone}
                  placeholder="(11) 99999-9999" 
                  required 
                  className="rounded-xl custom-input-theme"
                  onChange={(e) => e.target.value = maskPhone(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-[#028090] hover:bg-[#00a896] text-white rounded-xl font-bold">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CRIAR NOVO PACIENTE */}
      <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white dark:bg-[#111c24] w-[95vw] sm:w-full border dark:border-slate-800 font-sans">
          <DialogHeader className="text-slate-900 dark:text-slate-100">
            <DialogTitle>Criar Novo Paciente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPatient} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hdr-pat-name" className="text-slate-700 dark:text-slate-300">Nome do Paciente</Label>
              <Input id="hdr-pat-name" name="name" placeholder="Ex: Maria Silva" required className="rounded-xl custom-input-theme" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hdr-pat-cpf" className="text-slate-700 dark:text-slate-300">CPF</Label>
              <Input 
                id="hdr-pat-cpf" 
                name="cpf" 
                placeholder="000.000.000-00" 
                required
                className="rounded-xl custom-input-theme"
                onChange={(e) => e.target.value = maskCPF(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hdr-pat-email" className="text-slate-700 dark:text-slate-300">E-mail</Label>
              <Input id="hdr-pat-email" name="email" type="email" placeholder="maria@email.com" required className="rounded-xl custom-input-theme" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hdr-pat-phone" className="text-slate-700 dark:text-slate-300">Telefone</Label>
              <Input 
                id="hdr-pat-phone" 
                name="phone" 
                placeholder="(11) 99999-9999" 
                required 
                className="rounded-xl custom-input-theme"
                onChange={(e) => e.target.value = maskPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hdr-pat-birth_date" className="text-slate-700 dark:text-slate-300">Data de Nascimento</Label>
              <Input 
                id="hdr-pat-birth_date" 
                name="birth_date" 
                type="date"
                required 
                className="rounded-xl custom-input-theme"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-[#028090] hover:bg-[#00a896] text-white rounded-xl font-bold">
                Criar e Acessar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
