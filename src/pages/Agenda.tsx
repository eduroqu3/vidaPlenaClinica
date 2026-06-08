import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  BellOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/src/lib/supabase';
import { Appointment } from '@/src/types';

const MOCK_APPOINTMENTS = [
  { id: '1', doctorId: 'doc-1', patientId: '123.456.789-01', patient: 'Ana Costa', time: '09:00', type: 'Consulta', status: 'confirmed', notes: '' },
  { id: '2', doctorId: 'doc-1', patientId: '234.567.890-12', patient: 'João Pereira', time: '10:30', type: 'Retorno', status: 'confirmed', notes: '' },
  { id: '3', doctorId: 'doc-2', patientId: '345.678.901-23', patient: 'Carla Souza', time: '14:00', type: 'Consulta', status: 'scheduled', notes: '' },
  { id: '4', doctorId: 'doc-2', patientId: '456.789.012-34', patient: 'Marcos Lima', time: '15:30', type: 'Retorno', status: 'scheduled', notes: '' },
];

const AgendaPage = () => {
  const { user, activeDoctorId, doctors } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!activeDoctorId) return;
    
    try {
      setIsLoading(true);
      const formattedDate = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients!appointments_patient_id_fkey(*)
        `)
        .eq('doctor_id', activeDoctorId)
        .eq('date', formattedDate)
        .order('time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching agenda:', error);
      toast.error('Erro ao carregar agenda.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [activeDoctorId, date]);

  const handleSaveNotes = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const notes = formData.get('notes') as string;
    
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          notes, 
          status: 'completed' 
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      setAppointments(prev => prev.map(app => 
        app.id === selectedAppointment.id ? { ...app, notes, status: 'completed' } : app
      ));
      setIsNotesDialogOpen(false);
      toast.success('Atendimento finalizado com sucesso!');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Erro ao finalizar atendimento.');
    }
  };

  const handleCallAppointment = async (id: string, shouldCall: boolean, appData?: any) => {
    try {
      const currentNotes = appData?.notes || '';
      let newNotes = currentNotes;

      if (shouldCall) {
        if (!currentNotes.startsWith('[CALLING]')) {
          newNotes = `[CALLING]${new Date().toISOString()}|${currentNotes}`;
        }
      } else {
        if (currentNotes.startsWith('[CALLING]')) {
          newNotes = currentNotes.split('|').slice(1).join('|');
        }
      }

      const { error } = await supabase
        .from('appointments')
        .update({ notes: newNotes })
        .eq('id', id);

      if (error) throw error;
      
      setAppointments(prev => prev.map(app => 
        app.id === id ? { ...app, notes: newNotes, is_called: shouldCall } : app
      ));
      
      if (shouldCall) {
        toast.success('Paciente chamado na fila!');
      } else {
        toast.success('Chamada removida da fila.');
      }
    } catch (error) {
      console.error('Error handling call:', error);
      toast.error('Erro ao processar chamada.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="rounded-md border-none"
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Resumo do Dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Total de Consultas</span>
              <span className="font-bold text-slate-900">{appointments.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Confirmadas</span>
              <span className="font-bold text-emerald-600">{appointments.filter(a => a.status === 'confirmed').length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Pendentes</span>
              <span className="font-bold text-amber-600">{appointments.filter(a => a.status === 'scheduled').length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Agenda de {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : 'Hoje'}
            </h2>
            <p className="text-sm text-[#00A896] font-extrabold uppercase tracking-wider">
              {doctors.find(d => d.id === activeDoctorId)?.name || 'Carregando...'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
              <ChevronLeft size={18} />
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {appointments.map((app) => (
            <Card key={app.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:ring-1 hover:ring-[#E0F2F1] hover:shadow-md transition-all">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="text-center min-w-[50px] md:min-w-[60px]">
                      <p className="text-base md:text-lg font-black text-[#028090] leading-none">{app.time}</p>
                      <p className="text-[9px] md:text-[10px] text-slate-400 uppercase font-black tracking-wider mt-1">Início</p>
                    </div>
                    <div className="h-10 w-px bg-slate-100 hidden xs:block"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {app.daily_sequence && (
                          <span className="text-[10px] font-black text-[#028090] bg-[#E0F2F1] px-2 py-0.5 rounded border border-[#E0F2F1]">
                            AG{app.daily_sequence}
                          </span>
                        )}
                        <h3 className="font-bold text-slate-900 truncate">{app.patient?.name || 'Paciente'}</h3>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 uppercase font-bold whitespace-nowrap">
                          {app.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-slate-500">
                          <Clock size={12} />
                          45 min
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-slate-500">
                          <User size={12} />
                          Bradesco
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 md:gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                    {(app.status === 'confirmed' || app.status === 'scheduled') && (
                      <Dialog open={isNotesDialogOpen && selectedAppointment?.id === app.id} onOpenChange={(open) => {
                        setIsNotesDialogOpen(open);
                        if (open) setSelectedAppointment(app);
                      }}>
                        <DialogTrigger className={cn(buttonVariants({ variant: "default" }), "flex-1 sm:flex-initial bg-[#00A896] hover:bg-[#028090] text-white rounded-xl gap-2 h-9 text-sm font-bold")}>
                          Atender
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-2xl w-[95vw] sm:w-full">
                          <DialogHeader>
                            <DialogTitle>Atendimento: {app.patient?.name}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSaveNotes} className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="notes">Observações Clínicas</Label>
                              <Textarea 
                                id="notes" 
                                name="notes" 
                                placeholder="Descreva os sintomas, diagnóstico e conduta..." 
                                className="min-h-[200px] rounded-xl resize-none"
                                required
                              />
                            </div>
                            <DialogFooter>
                              <Button type="submit" className="w-full bg-[#00A896] hover:bg-[#028090] text-white rounded-xl font-bold">
                                Finalizar Atendimento
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}

                    {app.status === 'completed' && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 rounded-lg">
                        Concluído
                      </Badge>
                    )}

                    {app.status === 'cancelled' && (
                      <Badge variant="destructive" className="px-3 py-1 rounded-lg">
                        Cancelado
                      </Badge>
                    )}

                    {(app.status === 'confirmed' || app.status === 'scheduled') && (
                      !app.notes?.startsWith('[CALLING]') ? (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="text-[#028090] border-[#E0F2F1] hover:bg-[#E0F2F1]/50 rounded-xl h-9 w-9"
                          onClick={() => handleCallAppointment(app.id, true, app)}
                          title="Chamar Paciente"
                        >
                          <Bell size={18} />
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="text-[#FF6B35] border-[#FF6B35]/20 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/25 rounded-xl h-9 w-9 animate-pulse"
                          onClick={() => handleCallAppointment(app.id, false, app)}
                          title="Remover Chamado"
                        >
                          <BellOff size={18} />
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgendaPage;
