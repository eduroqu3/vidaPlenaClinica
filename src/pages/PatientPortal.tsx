import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { 
  User, 
  Calendar, 
  ClipboardList, 
  FileText, 
  LogOut, 
  Phone, 
  Mail, 
  CalendarDays, 
  ShieldCheck, 
  UserCircle,
  Loader2,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  Sun,
  Moon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';



export default function PatientPortal() {
  const { session, logout, specialties, theme, toggleTheme } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatientData = async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*, doctor:doctors(*)')
        .eq('patient_id', session.user.id)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err: any) {
      console.error('Error fetching patient portal data:', err);
      toast.error('Erro ao buscar suas consultas e prontuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [session]);

  const maskCPF = (value: string) => {
    if (!value) return '';
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const parsePdfFromNotes = (notes: string) => {
    if (!notes) return { text: '', pdfName: '', pdfData: '' };
    const parts = notes.split(' |||PDF:');
    if (parts.length > 1) {
      try {
        const pdfMeta = JSON.parse(parts[1]);
        return {
          text: parts[0],
          pdfName: pdfMeta.name || 'Documento',
          pdfData: pdfMeta.base64 || ''
        };
      } catch (e) {
        return { text: parts[0], pdfName: '', pdfData: '' };
      }
    }
    return { text: notes, pdfName: '', pdfData: '' };
  };

  const handleViewPdf = (pdfData: string, pdfName: string) => {
    try {
      const base64Clean = pdfData.includes('base64,') ? pdfData.split('base64,')[1] : pdfData;
      const byteCharacters = atob(base64Clean);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const fileType = pdfData.includes('data:') ? pdfData.split(';')[0].split(':')[1] : 'application/pdf';
      const blob = new Blob([byteArray], { type: fileType });
      const fileURL = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.target = '_blank';
      link.download = pdfName || 'documento.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Arquivo aberto.');
    } catch (err) {
      console.error('Error viewing PDF:', err);
      toast.error('Erro ao abrir o arquivo PDF.');
    }
  };

  const scheduledApps = appointments.filter(app => app.status === 'scheduled' || app.status === 'confirmed');
  const completedApps = appointments.filter(app => app.status === 'completed' && app.notes && !app.notes.startsWith('[CALLING]'));

  // Get specialty name helper
  const getSpecialtyName = (specialtyId?: string) => {
    if (!specialtyId) return 'Clínico Geral';
    const spec = specialties.find(s => s.id === specialtyId);
    return spec ? spec.name : 'Clínico Geral';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1319] flex flex-col font-sans text-[#2D3748] dark:text-slate-200 transition-colors">
      {/* Top Header */}
      <header className="bg-white dark:bg-[#111c24] border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline">
              <span className="font-display font-black text-[#028090] text-xl tracking-tight leading-none">Vida</span>
              <span className="font-display font-normal text-[#2D3748] dark:text-gray-100 text-xl tracking-tight leading-none ml-1">Plena</span>
              <span className="font-display font-black text-[#FF6B35] text-xl tracking-tight leading-none">.</span>
            </div>
            <p className="text-[9px] text-[#00A896] font-extrabold uppercase tracking-widest leading-none mt-1.5">Portal do Paciente</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{session?.user?.name}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">Paciente Cadastrado</span>
            </div>

            {/* Tema Switcher para o Paciente */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              {theme === 'dark' ? (
                <Sun size={17} className="text-amber-500 stroke-[2.5]" />
              ) : (
                <Moon size={17} className="text-slate-600 stroke-[2.5]" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-[#E0F2F1]/30 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 hover:border-red-100 dark:hover:border-red-950/25 transition-all font-semibold gap-2 py-1.5 px-3 h-9"
            >
              <LogOut size={14} />
              <span className="text-xs">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#028090] to-[#00A896] rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-[#028090]/10 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-black tracking-tight font-heading">Olá, {session?.user?.name}!</h1>
            <p className="text-[#E0F2F1] font-medium text-xs md:text-sm">
              Consulte seu prontuário clínico e veja os horários de suas consultas de forma rápida e segura.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3 self-start md:self-auto shadow-inner">
            <Calendar size={22} className="text-[#E0F2F1] shrink-0" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#E0F2F1] block">Sessão Segura</span>
              <span className="text-xs font-extrabold font-mono">{maskCPF(session?.user?.id)}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-4">
            <Loader2 className="w-8 h-8 text-[#00A896] animate-spin" />
            <p className="text-sm font-bold text-[#2D3748]/70 dark:text-slate-400">Buscando suas informações médicas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1 & 2: Lists */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Active Scheduled Appointments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <CalendarDays className="h-4.5 w-4.5 text-[#00A896]" />
                    Consultas Agendadas
                  </h3>
                  <span className="bg-[#E0F2F1] dark:bg-[#028090]/20 text-[#028090] dark:text-[#E0F2F1] text-[10px] font-black px-2.5 py-1 rounded-full border border-[#E0F2F1] dark:border-transparent">
                    {scheduledApps.length} {scheduledApps.length === 1 ? 'consulta' : 'consultas'}
                  </span>
                </div>

                {scheduledApps.length === 0 ? (
                  <Card className="border-slate-100 dark:border-slate-800/80 border-dashed bg-slate-50/50 dark:bg-slate-950/20 shadow-none rounded-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center px-4">
                      <CalendarDays className="text-slate-300 dark:text-slate-600 w-10 h-10 mb-3" />
                      <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">Nenhuma consulta agendada</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Quando você agendar uma consulta na recepção, ela aparecerá aqui.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {scheduledApps.map(app => (
                      <Card key={app.id} className="border-slate-100 dark:border-slate-800 hover:border-[#00A896]/30 dark:hover:border-[#00A896]/30 hover:shadow-md transition-all duration-300 rounded-2xl shadow-sm bg-white dark:bg-[#111c24] overflow-hidden group">
                        <CardContent className="p-5 flex items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#E0F2F1] dark:bg-[#00a896]/10 text-[#00A896] flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                              <User size={22} className="stroke-[2]" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-black text-slate-900 dark:text-slate-100">{app.doctor?.name || 'Médico'}</p>
                              <p className="text-xs text-[#028090] dark:text-[#E0F2F1] font-bold">{getSpecialtyName(app.doctor?.specialty_id)}</p>
                              
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                <span className="flex items-center gap-1 font-bold bg-[#E0F2F1]/40 dark:bg-slate-800 rounded-md px-1.5 py-0.5 text-slate-600 dark:text-slate-350">
                                  <CalendarDays size={12} className="text-[#028090]" />
                                  {formatDate(app.date)}
                                </span>
                                <span className="flex items-center gap-1 font-bold bg-[#E0F2F1]/40 dark:bg-slate-800 rounded-md px-1.5 py-0.5 text-slate-600 dark:text-slate-350">
                                  <Clock size={12} className="text-[#028090]" />
                                  {app.time}h
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end text-right shrink-0">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Senha do Dia</span>
                            <span className="font-mono text-xl md:text-2xl font-black text-[#00A896] bg-[#E0F2F1]/50 dark:bg-[#00a896]/15 border border-[#E0F2F1] dark:border-[#028090]/30 px-3 py-1 rounded-xl shadow-[0_1px_2px_rgba(0,168,150,0.05)]">
                              {app.daily_sequence ? `AG${app.daily_sequence}` : '--'}
                            </span>
                            <span className={cn(
                              "text-[9px] font-bold uppercase px-2 py-0.5 rounded mt-2 tracking-wider",
                              app.status === 'confirmed' ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30" : "bg-[#E0F2F1] dark:bg-[#028090]/15 text-[#028090] dark:text-[#E0F2F1] border border-[#E0F2F1] dark:border-transparent"
                            )}>
                              {app.status === 'confirmed' ? 'Confirmada' : 'Agendada'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Patient Chart - Medical Records */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-[#00A896]" />
                    Meu Prontuário Médico
                  </h3>
                  <span className="bg-[#E0F2F1] dark:bg-[#028090]/20 text-[#028090] dark:text-[#E0F2F1] text-[10px] font-black px-2.5 py-1 rounded-full border border-[#E0F2F1] dark:border-transparent">
                    {completedApps.length} {completedApps.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                {completedApps.length === 0 ? (
                  <Card className="border-slate-100 dark:border-slate-800 shadow-none rounded-2xl bg-white dark:bg-[#111c24]">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center px-4">
                      <ClipboardList className="text-slate-300 dark:text-slate-600 w-12 h-12 mb-3" />
                      <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">Seu prontuário está em branco</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-sm">Informações registradas pelos doutores sobre suas consultas finalizadas aparecerão aqui de forma confidencial.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {completedApps.map(app => (
                      <Card key={app.id} className="border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-[#111c24] overflow-hidden">
                        <CardHeader className="bg-[#E0F2F1]/20 dark:bg-[#028090]/10 border-b border-slate-50 dark:border-slate-800/80 px-5 py-4">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Profissional Responsável</p>
                              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">{app.doctor?.name}</p>
                              <p className="text-[10px] text-[#028090] dark:text-[#E0F2F1] font-black uppercase tracking-wide mt-0.5">
                                CRM: {app.doctor?.crm || '—'} • {getSpecialtyName(app.doctor?.specialty_id)}
                              </p>
                            </div>
                            <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 py-1 px-2 rounded-lg font-mono">
                              {formatDate(app.date)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-5">
                          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">Descrição Clínica / Prescrições</p>
                          <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-800/50 rounded-xl p-4 text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed whitespace-pre-wrap font-sans">
                            {parsePdfFromNotes(app.notes || '').text || 'Sem observações registradas.'}
                          </div>
                          
                          {(() => {
                            const { pdfName, pdfData } = parsePdfFromNotes(app.notes || '');
                            if (pdfName && pdfData) {
                              return (
                                <div className="mt-4 p-4 bg-[#00A896]/5 border border-[#00A896]/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] dark:bg-[#00A896]/15 text-[#00A896] flex items-center justify-center shrink-0">
                                      <FileText size={20} />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Documento Enviado pelo Médico</p>
                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate max-w-[200px]" title={pdfName}>{pdfName}</p>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => handleViewPdf(pdfData, pdfName)}
                                    size="sm"
                                    className="bg-[#00A896] hover:bg-[#028090] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-md shadow-[#00A896]/10 font-sans"
                                  >
                                    <FileText size={13} />
                                    Visualizar PDF
                                  </Button>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-[#00A896] uppercase tracking-wide px-1">
                            <ShieldCheck size={13} className="text-[#00A896]" />
                            Registro assinado digitalmente pelo profissional responsável
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Column 3: Personal Information Card */}
            <div className="space-y-6">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-[#111c24] overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800/80 p-5">
                  <CardTitle className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <User className="text-[#00A896] h-4 w-4" />
                    Meus Dados Cadastrais
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3 bg-[#E0F2F1]/30 dark:bg-[#00a896]/5 border border-[#E0F2F1]/50 dark:border-[#00a896]/10 p-3 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] dark:bg-[#028090]/20 text-[#028090] dark:text-[#E0F2F1] flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                      {session?.user?.name ? session.user.name.charAt(0) : 'P'}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase leading-none">Nome do Cadastro</p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">{session?.user?.name}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        CPF do Paciente
                      </span>
                      <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 bg-[#E0F2F1]/20 dark:bg-[#028090]/10 border border-[#E0F2F1]/30 dark:border-[#00A896]/15 rounded-lg px-2.5 py-1.5 mt-1">
                        {maskCPF(session?.user?.id)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        E-mail Cadastrado
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                        <Mail size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="text-xs font-semibold truncate">{session?.user?.email || '—'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        Telefone de Contato
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                        <Phone size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="text-xs font-semibold">{session?.user?.phone || '—'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        Data de Nascimento
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                        <Calendar size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="text-xs font-semibold">
                          {session?.user?.birth_date ? formatDate(session.user.birth_date) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4 flex gap-2.5 items-start text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-normal">
                    <Info size={16} className="text-[#00A896] shrink-0 mt-0.5" />
                    <span>Se houver alguma informação desatualizada, informe ao atendente na recepção da clínica para realizar a alteração.</span>
                  </div>
                </CardContent>
              </Card>

              {/* Informative Help Box */}
              <div className="bg-[#E0F2F1]/30 dark:bg-[#00a896]/5 border border-[#E0F2F1] dark:border-[#00a896]/10 rounded-2xl p-5.5 space-y-3 shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00A896] animate-pulse shrink-0" />
                  <p className="text-xs font-black text-[#028090] dark:text-[#E0F2F1] uppercase tracking-wider">Como funciona a sua senha?</p>
                </div>
                <p className="text-[11px] text-[#2D3748]/85 dark:text-slate-300 leading-relaxed font-bold">
                  A sua <b className="text-[#028090] dark:text-[#E0F2F1]">Senha do Dia</b> é gerada automaticamente pelo painel de agendamentos e é única para o dia da sua consulta.
                </p>
                <p className="text-[11px] text-[#2D3748]/75 dark:text-slate-400 leading-relaxed font-medium">
                  Quando o seu médico chamar a sua senha no monitor, ela se iluminará na recepção (Fila de Espera). Mantenha este painel aberto para monitorar em tempo real.
                </p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#111c24]/30 border-t border-slate-100 dark:border-slate-800/50 py-6 text-center mt-12 shrink-0">
        <p className="text-[10px] font-black text-[#2D3748]/60 dark:text-slate-500 uppercase tracking-widest">
          © {new Date().getFullYear()} Vida Plena. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
