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

const LogoIconSidebar = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 shrink-0">
    <path 
      d="M12 21C12 21 4 15.5 4 9.5C4 6.5 6.5 4 9.5 4C11 4 11.5 4.5 12 5.5C12.5 4.5 13 4 14.5 4C17.5 4 20 6.5 20 9.5C20 15.5 12 21 12 21Z" 
      fill="#00A896" 
    />
    <path 
      d="M12 20C12 20 12 6.5 12 5.5M12 9.5C14.5 8 16.5 9 17 11.5M12 13.5C9.5 12 7.5 13 7 15.5" 
      stroke="#ffffff" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
    />
  </svg>
);

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
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isAddAttendantOpen, setIsAddAttendantOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [editingAtt, setEditingAtt] = useState<any>(null);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);
  const [confirmDeleteAttId, setConfirmDeleteAttId] = useState<string | null>(null);
  const [credentialsSearch, setCredentialsSearch] = useState('');
  const [roleSearchText, setRoleSearchText] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const doctorLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Minha Agenda', path: '/agenda', icon: Calendar },
    { name: 'Histórico', path: '/historico', icon: ClipboardList },
    ...(session?.role === 'admin' ? [{ name: 'Disponibilidade', path: '/disponibilidade', icon: Clock }] : []),
  ];

  const attendantLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Agendamentos', path: '/agendamentos', icon: Calendar },
    { name: 'Pacientes', path: '/pacientes', icon: Users },
    { name: 'Médicos', path: '/medicos', icon: Stethoscope },
  ];

  const links = role === 'doctor' ? doctorLinks : attendantLinks;

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
      // Error is already handled in addDoctor
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
      // Error is handled in updateDoctor
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
      // Error is already handled in addAttendant
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
      // Error is handled in updateAttendant
    }
  };

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
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#E0F2F1] rounded-xl flex items-center justify-center text-[#00A896]">
              <LogoIconSidebar />
            </div>
            <div>
              <div className="flex items-baseline">
                <span className="font-extrabold font-heading text-lg tracking-tight text-[#028090]">Vida</span>
                <span className="font-light text-lg tracking-tight ml-0.5 text-[#2D3748] dark:text-slate-300">Plena</span>
              </div>
              <p className="text-[9px] text-[#00A896]/80 font-black uppercase tracking-wider leading-none mt-0.5">Gestão Médica</p>
            </div>
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
          {session?.role === 'admin' && (
            <div className="bg-slate-50 dark:bg-[#0b1319] rounded-2xl p-3 border border-slate-100 dark:border-slate-800 max-h-[185px] flex flex-col min-h-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">
              {role === 'doctor' ? 'Trocar Médico' : 'Trocar de Atendente'}
            </p>
            
            {/* Campo de Pesquisa Compacto */}
            <div className="relative mb-1.5 shrink-0">
              <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search size={10} className="text-slate-400" />
              </span>
              <input
                type="text"
                placeholder={role === 'doctor' ? "Buscar médico por nome ou CPF..." : "Buscar atendente..."}
                value={roleSearchText}
                onChange={(e) => setRoleSearchText(e.target.value)}
                className="pl-6 pr-5 py-1 text-[10px] rounded-lg border border-slate-200 focus:border-blue-500 bg-white w-full shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-100 transition-all font-medium text-slate-700 placeholder:text-slate-400"
              />
              {roleSearchText && (
                <button
                  onClick={() => setRoleSearchText('')}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            
            {role === 'doctor' ? (
              <>
                <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 min-h-0">
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
                        <p className="text-[10px] text-slate-400 italic text-center py-2">
                          Nenhum médico encontrado
                        </p>
                      );
                    }

                    return filtered.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="group/item flex items-center justify-between gap-1 px-1 rounded-lg hover:bg-white text-slate-500 transition-colors"
                      >
                        <button
                          onClick={() => {
                            switchDoctor(doc.id);
                            onClose?.();
                          }}
                          className={cn(
                            "flex-1 flex items-center gap-2 px-1 py-1 text-xs transition-colors truncate font-medium align-middle",
                            activeDoctorId === doc.id && "text-blue-700 font-bold"
                          )}
                        >
                          <UserCircle size={14} className={cn(activeDoctorId === doc.id ? "text-blue-600" : "text-slate-400")} />
                          <div className="flex flex-col text-left truncate flex-1 min-w-0 font-medium">
                            <span className="truncate text-[11px] font-semibold">{doc.name}</span>
                            {doc.cpf ? (
                              <span className="text-[9px] text-slate-400 font-mono scale-[0.95] origin-left truncate block font-normal leading-none mt-0.5">
                                CPF: {maskCPF(doc.cpf)}
                              </span>
                            ) : null}
                          </div>
                          {activeDoctorId === doc.id && <Check size={12} className="text-blue-600 shrink-0" />}
                        </button>

                        <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                          {confirmDeleteDocId === doc.id ? (
                            <div className="flex items-center gap-1 bg-red-50/90 px-1 border border-red-200 rounded shrink-0">
                              <span className="text-[9px] font-bold text-red-600">Excluir?</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeDoctor(doc.id);
                                  setConfirmDeleteDocId(null);
                                }}
                                className="text-[9px] font-bold text-red-700 bg-red-100 hover:bg-red-200 px-1 rounded transition-colors"
                              >
                                Sim
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteDocId(null);
                                }}
                                className="text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-1 rounded transition-colors"
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
                                className="p-1 text-slate-400 hover:text-blue-600 rounded bg-transparent"
                                title="Editar"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteDocId(doc.id);
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 rounded bg-transparent"
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
                </div>
                
                <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
                  <DialogTrigger className={cn(buttonVariants({ variant: "ghost" }), "w-full mt-2 h-7 text-[10px] gap-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg")}>
                    <Plus size={12} />
                    Novo Médico
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white w-[95vw] sm:w-full">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Médico</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddDoctor} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Médico</Label>
                        <Input id="name" name="name" placeholder="Ex: Dr. Alberto Santos" required className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input 
                          id="cpf" 
                          name="cpf" 
                          placeholder="000.000.000-00" 
                          required
                          className="rounded-xl"
                          onChange={(e) => e.target.value = maskCPF(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialty_id">Especialidade</Label>
                        {specialties.length === 0 ? (
                          <div className="text-xs text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-100 flex flex-col gap-1.5">
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
                            id="specialty_id" 
                            name="specialty_id" 
                            required 
                            className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Selecione uma especialidade</option>
                            {specialties.map(spec => (
                              <option key={spec.id} value={spec.id}>{spec.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" name="email" type="email" placeholder="alberto@clinica.com" required className="rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="crm">CRM</Label>
                          <Input 
                            id="crm" 
                            name="crm" 
                            placeholder="00000-UF" 
                            required 
                            className="rounded-xl"
                            onChange={(e) => e.target.value = maskCRM(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input 
                            id="phone" 
                            name="phone" 
                            placeholder="(11) 99999-9999" 
                            required 
                            className="rounded-xl"
                            onChange={(e) => e.target.value = maskPhone(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                          Criar e Acessar
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={!!editingDoc} onOpenChange={(open) => !open && setEditingDoc(null)}>
                  <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white w-[95vw] sm:w-full">
                    <DialogHeader>
                      <DialogTitle>Editar Médico</DialogTitle>
                    </DialogHeader>
                    {editingDoc && (
                      <form onSubmit={handleUpdateDoctor} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-doc-name">Nome do Médico</Label>
                          <Input id="edit-doc-name" name="name" defaultValue={editingDoc.name} required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-doc-cpf">CPF</Label>
                          <Input 
                            id="edit-doc-cpf" 
                            name="cpf" 
                            defaultValue={editingDoc.cpf || ''}
                            placeholder="000.000.000-00" 
                            required
                            className="rounded-xl"
                            onChange={(e) => e.target.value = maskCPF(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-doc-specialty_id">Especialidade</Label>
                          {specialties.length === 0 ? (
                            <div className="text-xs text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-100 flex flex-col gap-1.5">
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
                              id="edit-doc-specialty_id" 
                              name="specialty_id" 
                              defaultValue={editingDoc.specialty_id}
                              required 
                              className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              <option value="">Selecione uma especialidade</option>
                              {specialties.map(spec => (
                                <option key={spec.id} value={spec.id}>{spec.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-doc-email">E-mail</Label>
                          <Input id="edit-doc-email" name="email" type="email" defaultValue={editingDoc.email} required className="rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-doc-crm">CRM</Label>
                            <Input 
                              id="edit-doc-crm" 
                              name="crm" 
                              defaultValue={editingDoc.crm}
                              placeholder="00000-UF" 
                              required 
                              className="rounded-xl"
                              onChange={(e) => e.target.value = maskCRM(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-doc-phone">Telefone</Label>
                            <Input 
                              id="edit-doc-phone" 
                              name="phone" 
                              defaultValue={editingDoc.phone}
                              placeholder="(11) 99999-9999" 
                              required 
                              className="rounded-xl"
                              onChange={(e) => e.target.value = maskPhone(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                            Salvar Alterações
                          </Button>
                        </DialogFooter>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 min-h-0">
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
                        <p className="text-[10px] text-slate-400 italic text-center py-2">
                          Nenhum atendente encontrado
                        </p>
                      );
                    }

                    return filtered.map((att) => (
                      <div 
                        key={att.id} 
                        className="group/item flex items-center justify-between gap-1 px-1 rounded-lg hover:bg-white text-slate-500 transition-colors"
                      >
                        <button
                          onClick={() => {
                            switchAttendant(att.id);
                            onClose?.();
                          }}
                          className={cn(
                            "flex-1 flex items-center gap-2 px-1 py-1 text-xs transition-colors truncate font-medium align-middle",
                            activeAttendantId === att.id && "text-blue-700 font-bold"
                          )}
                        >
                          <UserCircle size={14} className={cn(activeAttendantId === att.id ? "text-blue-600" : "text-slate-400")} />
                          <div className="flex flex-col text-left truncate flex-1 min-w-0 font-medium font-semibold">
                            <span className="truncate text-[11px] font-semibold">{att.name}</span>
                            {att.cpf ? (
                              <span className="text-[9px] text-slate-400 font-mono scale-[0.95] origin-left truncate block font-normal leading-none mt-0.5">
                                CPF: {maskCPF(att.cpf)}
                              </span>
                            ) : null}
                          </div>
                          {activeAttendantId === att.id && <Check size={12} className="text-blue-600 shrink-0" />}
                        </button>

                        <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                          {confirmDeleteAttId === att.id ? (
                            <div className="flex items-center gap-1 bg-red-50/90 px-1 border border-red-200 rounded shrink-0">
                              <span className="text-[9px] font-bold text-red-600">Excluir?</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeAttendant(att.id);
                                  setConfirmDeleteAttId(null);
                                }}
                                className="text-[9px] font-bold text-red-700 bg-red-100 hover:bg-red-200 px-1 rounded transition-colors"
                              >
                                Sim
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteAttId(null);
                                }}
                                className="text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-1 rounded transition-colors"
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
                                className="p-1 text-slate-400 hover:text-blue-600 rounded bg-transparent"
                                title="Editar"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteAttId(att.id);
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 rounded bg-transparent"
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
                </div>
                
                <Dialog open={isAddAttendantOpen} onOpenChange={setIsAddAttendantOpen}>
                  <DialogTrigger className={cn(buttonVariants({ variant: "ghost" }), "w-full mt-2 h-7 text-[10px] gap-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg")}>
                    <Plus size={12} />
                    Novo Atendente
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white w-[95vw] sm:w-full">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Atendente</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddAttendant} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Atendente</Label>
                        <Input id="name" name="name" placeholder="Ex: Maria de Souza" required className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input 
                          id="cpf" 
                          name="cpf" 
                          placeholder="000.000.000-00" 
                          required
                          className="rounded-xl"
                          onChange={(e) => e.target.value = maskCPF(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" name="email" type="email" placeholder="maria@clinica.com" required className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          placeholder="(11) 99999-9999" 
                          required 
                          className="rounded-xl"
                          onChange={(e) => e.target.value = maskPhone(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                          Criar e Acessar
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={!!editingAtt} onOpenChange={(open) => !open && setEditingAtt(null)}>
                  <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white w-[95vw] sm:w-full">
                    <DialogHeader>
                      <DialogTitle>Editar Atendente</DialogTitle>
                    </DialogHeader>
                    {editingAtt && (
                      <form onSubmit={handleUpdateAttendant} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-att-name">Nome do Atendente</Label>
                          <Input id="edit-att-name" name="name" defaultValue={editingAtt.name} required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-att-cpf">CPF</Label>
                          <Input 
                            id="edit-att-cpf" 
                            name="cpf" 
                            defaultValue={editingAtt.cpf || ''}
                            placeholder="000.000.000-00" 
                            required
                            className="rounded-xl"
                            onChange={(e) => e.target.value = maskCPF(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-att-email">E-mail</Label>
                          <Input id="edit-att-email" name="email" type="email" defaultValue={editingAtt.email} required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-att-phone">Telefone</Label>
                          <Input 
                            id="edit-att-phone" 
                            name="phone" 
                            defaultValue={editingAtt.phone}
                            placeholder="(11) 99999-9999" 
                            required 
                            className="rounded-xl"
                            onChange={(e) => e.target.value = maskPhone(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                            Salvar Alterações
                          </Button>
                        </DialogFooter>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
          )}

          {session?.role === 'admin' && (
            <div className="bg-[#E0F2F1]/30 rounded-2xl p-3 border border-[#E0F2F1] space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Alternar Perfil</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setRole('attendant')}
                  className={cn(
                    "py-1.5 px-2.5 rounded-lg text-xs font-black transition-all",
                    role === 'attendant' 
                      ? "bg-white text-[#028090] shadow-sm ring-1 ring-[#00A896]/15" 
                      : "text-[#2D3748]/65 hover:bg-white/40"
                  )}
                >
                  Atendente
                </button>
                <button
                  onClick={() => setRole('doctor')}
                  className={cn(
                    "py-1.5 px-2.5 rounded-lg text-xs font-black transition-all",
                    role === 'doctor' 
                      ? "bg-white text-[#028090] shadow-sm ring-1 ring-[#00A896]/15" 
                      : "text-[#2D3748]/65 hover:bg-white/40"
                  )}
                >
                  Médico
                </button>
              </div>
            </div>
          )}

          {/* Seção unificada de Visualizar Credenciais para Consulta Rápida */}
          {session?.role === 'admin' && (
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
                    <Key size={18} className="text-blue-600" />
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
                    className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:border-blue-500 bg-white text-xs w-full shadow-inner"
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
                                              className="font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-100 transition-colors text-left truncate max-w-[120px] sm:max-w-none"
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
                                              className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors shrink-0"
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
                                              className="font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-100 transition-colors text-left truncate max-w-[120px] sm:max-w-none"
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
                                              className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors shrink-0"
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
                                                className="font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-100 transition-colors text-left truncate max-w-[120px] sm:max-w-none"
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
                                                className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors shrink-0"
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
