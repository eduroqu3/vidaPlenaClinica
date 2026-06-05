import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { 
  ClipboardList, 
  Search, 
  Calendar, 
  User, 
  Stethoscope, 
  FileText, 
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  UploadCloud,
  X,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/src/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { formatDateSafe, parseYYYYMMDD } from '@/src/lib/date-utils';

const HistoryPage = () => {
  const { role, activeDoctorId } = useAuth();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('appointments')
        .select('*, patient:patients(*), doctor:doctors(*)')
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      // If user is a doctor, filter by their ID
      if (role === 'doctor' && activeDoctorId) {
        query = query.eq('doctor_id', activeDoctorId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching clinical history:', error);
      toast.error('Erro ao carregar histórico clínico.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [role, activeDoctorId]);

  // PDF states
  const [selectedAppForPdf, setSelectedAppForPdf] = useState<any | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  // Helper inside history page to extract text/PDF from appointments note
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

  const savePdfToAppointment = async (appId: string, currentNotes: string, pdfName: string, pdfBase64: string | null) => {
    const cleanNotes = currentNotes.split(' |||PDF:')[0];
    const updatedNotes = pdfBase64 
      ? `${cleanNotes} |||PDF:${JSON.stringify({ name: pdfName, base64: pdfBase64 })}`
      : cleanNotes;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ notes: updatedNotes })
        .eq('id', appId);

      if (error) throw error;
      
      toast.success(pdfBase64 ? 'PDF salvo com sucesso e disponibilizado para o paciente!' : 'PDF removido com sucesso!');
      await fetchHistory();
    } catch (err: any) {
      console.error('Error saving PDF:', err);
      toast.error('Erro ao salvar o arquivo PDF.');
      throw err;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, appointment: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione um arquivo em formato PDF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB Limit
      toast.error('O arquivo é muito grande. O tamanho máximo permitido é 10MB.');
      return;
    }

    const reader = new FileReader();
    setIsSavingPdf(true);
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string;
        await savePdfToAppointment(appointment.id, appointment.notes || '', file.name, base64);
        
        // Update local component state so the modal updates immediately
        const cleanNotes = (appointment.notes || '').split(' |||PDF:')[0];
        const newNotes = `${cleanNotes} |||PDF:${JSON.stringify({ name: file.name, base64 })}`;
        setSelectedAppForPdf({ ...appointment, notes: newNotes });
      } catch (err) {
        // Handled in save
      } finally {
        setIsSavingPdf(false);
      }
    };
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo.');
      setIsSavingPdf(false);
    };
    reader.readAsDataURL(file);
  };

  const openPdf = (pdfData: string, pdfName: string) => {
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
      toast.success('Arquivo PDF aberto.');
    } catch (err) {
      console.error('Error viewing PDF:', err);
      toast.error('Erro ao abrir o arquivo PDF.');
    }
  };

  const filteredAppointments = appointments.filter(app => {
    const { text } = parsePdfFromNotes(app.notes || '');
    return (
      app.patient?.id.includes(searchTerm) ||
      (app.patient?.name && app.patient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      app.doctor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      text?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="text-[#00A896]" />
            Histórico de Atendimentos
          </h1>
          <p className="text-slate-500 text-sm">Registro completo de todas as consultas finalizadas.</p>
        </div>
        
        <div></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-none shadow-sm bg-gradient-to-br from-[#028090] to-[#00A896] text-white rounded-2xl shadow-[#028090]/10">
          <CardContent className="pt-4 md:pt-6">
            <p className="text-[#E0F2F1] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Total de Atendimentos</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl md:text-4xl font-bold">{appointments.length}</h3>
              <div className="p-2 bg-white/20 rounded-xl">
                <CheckCircle2 size={20} className="md:w-6 md:h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl flex items-center px-4 md:px-6">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                <Calendar size={18} className="md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Últimos 30 dias</p>
                <p className="text-lg md:text-xl font-bold text-slate-900">
                    {appointments.filter(a => {
                        const date = parseYYYYMMDD(a.date);
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
                        return diffDays <= 30;
                    }).length}
                </p>
            </div>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl flex items-center px-4 md:px-6">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                <User size={18} className="md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Pacientes Únicos</p>
                <p className="text-lg md:text-xl font-bold text-slate-900">
                    {new Set(appointments.map(a => a.patient_id)).size}
                </p>
            </div>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="p-4 md:pb-3 border-b border-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Pesquisar por CPF, médico ou notas..." 
              className="pl-10 rounded-xl border-slate-200 focus:ring-[#00A896]/20 text-sm h-10 md:h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Paciente</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Médico</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Data & Hora</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Resumo Clínico</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 italic">
                      {isLoading ? 'Carregando histórico...' : 'Nenhum atendimento finalizado encontrado.'}
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">{app.patient?.name}</p>
                              {app.daily_sequence && (
                                <span className="text-[9px] font-black text-[#028090] bg-[#E0F2F1] px-1 py-0.5 rounded border border-[#E0F2F1]">
                                  AG{app.daily_sequence}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">CPF: {app.patient?.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#E0F2F1] text-[#028090] flex items-center justify-center">
                            <Stethoscope size={14} />
                          </div>
                          <p className="text-xs font-bold text-slate-700">{app.doctor?.name}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                            <Calendar size={12} className="text-[#00A896]" />
                            {formatDateSafe(app.date, "dd/MM/yyyy")}
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 font-medium text-[10px]">
                            <FileText size={10} />
                            {app.time}h
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="max-w-[250px]">
                           <p className="text-xs text-slate-600 line-clamp-2 italic leading-relaxed">
                             {parsePdfFromNotes(app.notes || '').text || 'Sem observações registradas.'}
                           </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2 text-right">
                          {(() => {
                            const { pdfName } = parsePdfFromNotes(app.notes || '');
                            if (pdfName) {
                              return (
                                <Button 
                                  onClick={() => {
                                    setSelectedAppForPdf(app);
                                    setIsPdfModalOpen(true);
                                  }}
                                  variant="outline" 
                                  size="sm" 
                                  className="text-[#00C4A8] border-[#00C4A8]/20 bg-[#00C4A8]/5 hover:bg-[#00C4A8]/10 rounded-xl font-bold text-xs"
                                >
                                  <FileText size={13} className="mr-1" />
                                  {role === 'doctor' ? 'Ver/Editar PDF' : 'Ver PDF'}
                                </Button>
                              );
                            } else if (role === 'doctor') {
                              return (
                                <Button 
                                  onClick={() => {
                                    setSelectedAppForPdf(app);
                                    setIsPdfModalOpen(true);
                                  }}
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-slate-400 hover:text-[#00C4A8] hover:bg-[#00C4A8]/5 rounded-xl font-bold text-xs flex items-center gap-1"
                                >
                                  <UploadCloud size={13} />
                                  Enviar PDF
                                </Button>
                              );
                            } else {
                              return (
                                <span className="text-[10px] text-slate-400 italic">Nenhum PDF</span>
                              );
                            }
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile viewcards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredAppointments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic text-sm">
                {isLoading ? 'Carregando histórico...' : 'Nenhum atendimento finalizado.'}
              </div>
            ) : (
              filteredAppointments.map((app) => (
                <div key={app.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{app.patient?.name}</p>
                          {app.daily_sequence && (
                            <span className="text-[9px] font-black text-[#028090] bg-[#E0F2F1] px-1 py-0.5 rounded border border-[#E0F2F1] uppercase">
                              AG{app.daily_sequence}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">CPF: {app.patient?.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {formatDateSafe(app.date, "dd/MM/yy")}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{app.time}h</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope size={12} className="text-[#00A896]" />
                      <p className="text-[10px] font-bold text-slate-700">Dr. {app.doctor?.name}</p>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-3 italic leading-relaxed">
                      {parsePdfFromNotes(app.notes || '').text || 'Sem observações registradas.'}
                    </p>
                  </div>

                  {(() => {
                    const { pdfName } = parsePdfFromNotes(app.notes || '');
                    return (
                      <Button 
                        onClick={() => {
                          setSelectedAppForPdf(app);
                          setIsPdfModalOpen(true);
                        }}
                        variant="outline" 
                        className="w-full text-[#028090] dark:text-[#00C4A8] border-slate-100 dark:border-slate-800 bg-[#E0F2F1]/20 dark:bg-[#00C4A8]/5 hover:bg-[#E0F2F1]/40 dark:hover:bg-[#00C4A8]/10 rounded-xl h-10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <FileText size={14} />
                        {pdfName ? (role === 'doctor' ? 'Ver / Editar PDF' : 'Visualizar PDF') : (role === 'doctor' ? 'Anexar / Enviar PDF' : 'Sem PDF Anexado')}
                      </Button>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* PDF Management Modal */}
      {isPdfModalOpen && selectedAppForPdf && (() => {
        const { pdfName, pdfData } = parsePdfFromNotes(selectedAppForPdf.notes || '');
        
        return (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsPdfModalOpen(false)}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-[#1E1E2F] border border-slate-150 dark:border-[#2A2A3C] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl z-10 transition-colors duration-300">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-[#2A2A3C] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="text-[#00C4A8]" />
                    {role === 'doctor' ? 'Gerenciador de PDF' : 'Visualizar PDF'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-450 font-medium mt-1">
                    Paciente: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedAppForPdf.patient?.name}</span>
                  </p>
                </div>
                <Button 
                  onClick={() => setIsPdfModalOpen(false)}
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2A2A3C]"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-[#121212] p-4 rounded-2xl border border-slate-100/50 dark:border-[#2A2A3C]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</span>
                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                      {formatDateSafe(selectedAppForPdf.date, "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horário</span>
                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                      {selectedAppForPdf.time}h
                    </p>
                  </div>
                </div>

                {pdfName ? (
                  /* PDF Is Attached State */
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-[#00C4A8]/5 dark:bg-[#00C4A8]/10 border border-[#00C4A8]/20 rounded-2xl p-4">
                      <div className="w-12 h-12 rounded-xl bg-[#00C4A8]/10 text-[#00C4A8] flex items-center justify-center shrink-0">
                        <FileText size={24} className="stroke-[2.5]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-[#B0B0B0] uppercase tracking-wider">Documento Anexado</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate mt-1" title={pdfName}>
                          {pdfName}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <Button 
                        onClick={() => openPdf(pdfData, pdfName)}
                        className="w-full bg-[#00C4A8] hover:bg-[#0A6B6B] text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2 text-sm cursor-pointer shadow-lg shadow-[#00C4A8]/10"
                      >
                        <Eye size={16} />
                        Visualizar PDF Enviado
                      </Button>

                      {role === 'doctor' && (
                        <div className="flex gap-2">
                          {/* Replace File Button */}
                          <div className="flex-1 relative">
                            <input 
                              type="file" 
                              id="replace-pdf-upload" 
                              accept="application/pdf"
                              onChange={(e) => handleFileChange(e, selectedAppForPdf)}
                              className="hidden" 
                            />
                            <label 
                              htmlFor="replace-pdf-upload"
                              className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-[#2A2A3C] dark:hover:bg-[#2A2A3C]/80 text-slate-700 dark:text-slate-200 font-bold h-11 rounded-xl border border-slate-200 dark:border-transparent flex items-center justify-center gap-2 text-xs cursor-pointer transition-all uppercase tracking-wide px-3"
                            >
                              <RefreshCw size={14} className={isSavingPdf ? 'animate-spin' : ''} />
                              Trocar PDF
                            </label>
                          </div>

                          {/* Delete File Button */}
                          <Button 
                            onClick={async () => {
                              if (confirm("Deseja realmente remover o PDF anexado?")) {
                                try {
                                  setIsSavingPdf(true);
                                  await savePdfToAppointment(selectedAppForPdf.id, selectedAppForPdf.notes || '', '', null);
                                  setSelectedAppForPdf({ ...selectedAppForPdf, notes: (selectedAppForPdf.notes || '').split(' |||PDF:')[0] });
                                } catch(e) {
                                  // Already logged
                                } finally {
                                  setIsSavingPdf(false);
                                }
                              }
                            }}
                            variant="destructive"
                            className="bg-red-500 hover:bg-red-650 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2 px-4 shadow-lg shadow-red-500/10 cursor-pointer"
                            title="Excluir PDF"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* PDF Is Empty State */
                  <div className="space-y-4">
                    {role === 'doctor' ? (
                      /* Doctor can Upload */
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-slate-200 dark:border-[#2A2A3C] rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-[#00C4A8]/40 transition-colors group relative">
                          <input 
                            type="file" 
                            id="pdf-upload" 
                            accept="application/pdf"
                            onChange={(e) => handleFileChange(e, selectedAppForPdf)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                          />
                          <UploadCloud size={36} className="text-slate-300 dark:text-slate-500 group-hover:text-[#00C4A8] group-hover:scale-110 transition-all mb-3" />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-350">Clique ou arraste um arquivo PDF</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Limite máx: 10MB (Apenas PDF)</p>
                        </div>
                      </div>
                    ) : (
                      /* Guest view can't Upload */
                      <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                        <FileText size={36} className="text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm font-bold">Nenhum PDF anexado</p>
                        <p className="text-xs mt-1">O médico responsável não enviou um arquivo PDF para esta consulta.</p>
                      </div>
                    )}
                  </div>
                )}

                {isSavingPdf && (
                  <div className="flex items-center justify-center p-2 text-[#00C4A8] text-xs font-bold gap-2 animate-pulse bg-[#00C4A8]/5 rounded-xl border border-[#00C4A8]/10 py-3">
                    <RefreshCw size={14} className="animate-spin" />
                    Processando e salvando arquivo PDF...
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}
      
    </div>
  );
};

export default HistoryPage;
