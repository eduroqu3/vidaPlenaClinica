import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Check,
  ChevronsUpDown,
  Trash2,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/src/lib/supabase';
import { Appointment, Patient } from '@/src/types';
import { formatDateSafe } from '@/src/lib/date-utils';

const MOCK_APPOINTMENTS = [
  { id: '1', doctorId: 'doc-1', patientId: '123.456.789-01', patient: 'Ana Costa', doctor: 'Dr. Ricardo Silva', date: '2026-04-13', time: '09:00', status: 'confirmed' },
  { id: '2', doctorId: 'doc-1', patientId: '234.567.890-12', patient: 'João Pereira', doctor: 'Dra. Helena Costa', date: '2026-04-13', time: '10:30', status: 'scheduled' },
  { id: '3', doctorId: 'doc-2', patientId: '345.678.901-23', patient: 'Carla Souza', doctor: 'Dr. Ricardo Silva', date: '2026-04-13', time: '14:00', status: 'scheduled' },
];

const AppointmentsPage = () => {
  const { doctors, specialties, availabilities, exceptions, patients, removeAppointment } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('all');
  const [editSelectedSpecialtyId, setEditSelectedSpecialtyId] = useState<string>('all');

  const getLocalDateString = () => {
    const d = new Date();
    try {
      const formatter = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(d);
    } catch (e) {
      const offset = d.getTimezoneOffset();
      const localDate = new Date(d.getTime() - offset * 60 * 1000);
      return localDate.toISOString().split('T')[0];
    }
  };

  useEffect(() => {
    setSelectedTime('');
  }, [selectedDoctorId, selectedDate]);

  useEffect(() => {
    if (!isAddDialogOpen) {
      setSelectedDoctorId('');
      setSelectedDate('');
      setSelectedTime('');
      setSelectedPatientId('');
      setSelectedSpecialtyId('all');
    }
  }, [isAddDialogOpen]);

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const autoCancelExpiredAppointments = async (apps: Appointment[]) => {
    const now = new Date();
    const expiredApps = apps.filter(app => {
      if (app.status !== 'scheduled') return false;
      
      const [year, month, day] = app.date.split('-').map(Number);
      const [hours, minutes] = app.time.split(':').map(Number);
      
      // Construct date in local time
      const appDate = new Date(year, month - 1, day, hours, minutes);
      const limitDate = new Date(appDate.getTime() + 30 * 60000); // + 30 minutes
      
      return now > limitDate;
    });

    if (expiredApps.length === 0) return;

    try {
      const idsToCancel = expiredApps.map(app => app.id);
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .in('id', idsToCancel);

      if (error) throw error;
      
      console.log(`Auto-cancelled ${expiredApps.length} expired appointments.`);
      // No need to toast success here as it's an automatic background process
    } catch (error) {
      console.error('Error auto-cancelling appointments:', error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch Appointments with joined data
      const { data: apps, error: appsError } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors!appointments_doctor_id_fkey(*),
          patient:patients!appointments_patient_id_fkey(*)
        `)
        .order('date', { ascending: false })
        .order('time', { ascending: true });

      if (appsError) {
        console.error('Appointments fetch error:', appsError);
        toast.error(`Erro nos agendamentos: ${appsError.message}`);
      } else {
        const now = new Date();
        const rawApps = apps || [];
        
        // Mark as cancelled locally if expired
        const processedApps = rawApps.map(app => {
          if (app.status !== 'scheduled') return app;
          
          const [year, month, day] = app.date.split('-').map(Number);
          const [hours, minutes] = app.time.split(':').map(Number);
          const appDate = new Date(year, month - 1, day, hours, minutes);
          const limitDate = new Date(appDate.getTime() + 30 * 60000);
          
          if (now > limitDate) {
            return { ...app, status: 'cancelled' as any };
          }
          return app;
        });

        setAppointments(processedApps);
        
        // Sync with Supabase in the background
        autoCancelExpiredAppointments(rawApps);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar agendamentos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAppointments = appointments.filter(app => {
    const search = searchTerm.toLowerCase();
    const patientName = app.patient?.name?.toLowerCase() || '';
    const doctorName = app.doctor?.name?.toLowerCase() || '';
    const patientId = app.patient_id?.toLowerCase() || '';
    const date = app.date || '';
    const time = app.time || '';
    
    return patientName.includes(search) || 
           doctorName.includes(search) || 
           patientId.includes(search) || 
           date.includes(search) || 
           time.includes(search);
  });

  // Helper to generate 30-min slots
  const generateTimeSlots = (start: string, end: string) => {
    const slots = [];
    let current = new Date(`2000-01-01T${start}:00`);
    const endTime = new Date(`2000-01-01T${end}:00`);
    
    while (current < endTime) {
      slots.push(current.toTimeString().substring(0, 5));
      current.setMinutes(current.getMinutes() + 30);
    }
    return slots;
  };

  const getAvailableSlotsFor = (docId: string, dateStr: string, excludeAppId?: string) => {
    if (!docId || !dateStr) return [];
    
    // Check if there is an exception (blocking) for this date
    const doctorExceptions = exceptions[docId] || [];
    const isBlocked = doctorExceptions.some(ex => ex.date === dateStr);
    if (isBlocked) return [];

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][dateObj.getDay()];
    const doctorAvail = availabilities[docId]?.find(a => a.day === dayOfWeek);
    
    if (!doctorAvail || !doctorAvail.active) return [];

    // Generate all possible slots from doctor's availability
    let allPossibleSlots: string[] = [];
    doctorAvail.slots.forEach((slot: any) => {
      allPossibleSlots = [...allPossibleSlots, ...generateTimeSlots(slot.start, slot.end)];
    });

    // If selected date is today, filter out past slots
    const todayStr = getLocalDateString();
    if (dateStr === todayStr) {
      const now = new Date();
      let currentH = now.getHours();
      let currentM = now.getMinutes();
      try {
        const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const parts = timeFormatter.format(now).split(':');
        currentH = Number(parts[0]);
        currentM = Number(parts[1]);
      } catch (err) {
        console.warn('Fallback to local time formatting:', err);
      }
      
      allPossibleSlots = allPossibleSlots.filter(slot => {
        const [h, m] = slot.split(':').map(Number);
        return h > currentH || (h === currentH && m > currentM);
      });
    }

    // Filter out already booked slots for this doctor on this date
    const bookedSlots = appointments
      .filter((app: any) => 
        app.doctor_id === docId && 
        app.date === dateStr && 
        app.status !== 'cancelled' &&
        (!excludeAppId || app.id !== excludeAppId)
      )
      .map((app: any) => app.time);

    return allPossibleSlots.filter(slot => !bookedSlots.includes(slot));
  };

  const getAvailableSlots = () => {
    return getAvailableSlotsFor(selectedDoctorId, selectedDate);
  };

  const handleAddAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const doctorId = formData.get('doctor') as string;
    const patientId = selectedPatientId;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;

    if (!patientId) {
      toast.error('Por favor, selecione um paciente.');
      return;
    }

    const todayString = getLocalDateString();
    if (date < todayString) {
      toast.error('Não é permitido agendar uma consulta antes do dia atual.');
      return;
    }

    const availableSlots = getAvailableSlotsFor(doctorId, date);
    if (!availableSlots.includes(time)) {
      toast.error('O horário selecionado não está disponível ou o médico está fora de serviço na data informada.');
      return;
    }

    try {
      // Check for conflict first
      const { data: conflict } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('date', date)
        .eq('time', time)
        .neq('status', 'cancelled')
        .maybeSingle();

      if (conflict) {
        toast.error('Este horário já está ocupado para este médico.');
        return;
      }

      // Get next sequential number for this date
      const { data: lastApp } = await supabase
        .from('appointments')
        .select('daily_sequence')
        .eq('date', date)
        .order('daily_sequence', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextSequence = lastApp?.daily_sequence ? lastApp.daily_sequence + 1 : 1;

      const { error } = await supabase
        .from('appointments')
        .insert([{
          doctor_id: doctorId,
          patient_id: patientId,
          date,
          time,
          status: 'scheduled',
          daily_sequence: nextSequence
        }]);

      if (error) throw error;

      toast.success('Consulta agendada com sucesso!');
      setIsAddDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast.error('Erro ao agendar consulta.');
    }
  };

  const handleUpdateAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAppointment) return;

    const formData = new FormData(e.currentTarget);
    const doctorId = formData.get('doctor') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;

    const todayString = getLocalDateString();
    if (date < todayString) {
      toast.error('Não é permitido agendar ou alterar uma consulta para datas no passado.');
      return;
    }

    const availableSlots = getAvailableSlotsFor(doctorId, date, editingAppointment.id);
    if (!availableSlots.includes(time)) {
      toast.error('O horário selecionado não está disponível ou o médico está fora de serviço na data informada.');
      return;
    }

    try {
      // Check for conflict first (excluding the current appointment)
      const { data: conflict } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('date', date)
        .eq('time', time)
        .neq('id', editingAppointment.id)
        .neq('status', 'cancelled')
        .maybeSingle();

      if (conflict) {
        toast.error('Este horário já está ocupado por outro agendamento.');
        return;
      }

      const { error } = await supabase
        .from('appointments')
        .update({
          doctor_id: doctorId,
          date,
          time,
        })
        .eq('id', editingAppointment.id);

      if (error) throw error;

      toast.success('Agendamento atualizado com sucesso!');
      setEditingAppointment(null);
      fetchData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Erro ao atualizar agendamento.');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await removeAppointment(id);
      setAppointments(prev => prev.filter(app => app.id !== id));
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setAppointments(prev => prev.map(app => 
        app.id === id ? { ...app, status: newStatus as any } : app
      ));
      toast.success(`Status atualizado para ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agendamentos</h1>
          <p className="text-slate-500 text-sm">Gerencie todas as consultas da clínica.</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger className={cn(buttonVariants({ variant: "default" }), "bg-[#00A896] hover:bg-[#028090] text-white rounded-xl px-6 gap-2 font-bold")}>
            <Plus size={18} />
            Novo Agendamento
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Agendar Nova Consulta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddAppointment} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Paciente</Label>
                <Select name="patient" required onValueChange={setSelectedPatientId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione o paciente">
                      {selectedPatientId 
                        ? (patients.find(p => p.id === selectedPatientId)?.name || 'Paciente selecionado') 
                        : 'Selecione o paciente'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} ({patient.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {patients.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 italic">
                    * Cadastre o paciente na aba "Pacientes" antes de agendar.
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty-filter">Filtrar por Especialidade</Label>
                  <Select 
                    value={selectedSpecialtyId} 
                    onValueChange={(val) => {
                      setSelectedSpecialtyId(val);
                      setSelectedDoctorId(''); // Reset selected doctor
                    }}
                  >
                    <SelectTrigger id="specialty-filter" className="rounded-xl">
                      <SelectValue placeholder="Todas as Especialidades">
                        {selectedSpecialtyId === 'all' 
                          ? 'Todas as Especialidades' 
                          : (specialties.find(spec => spec.id === selectedSpecialtyId)?.name || selectedSpecialtyId)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Especialidades</SelectItem>
                      {specialties.map(spec => (
                        <SelectItem key={spec.id} value={spec.id}>
                          {spec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor">Médico / Especialista</Label>
                  <Select name="doctor" required value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione o médico">
                        {selectedDoctorId 
                          ? (doctors.find(doc => doc.id === selectedDoctorId)?.name || selectedDoctorId) 
                          : 'Selecione o médico'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {doctors
                        .filter(doc => selectedSpecialtyId === 'all' || doc.specialty_id === selectedSpecialtyId)
                        .map(doc => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.name}
                          </SelectItem>
                        ))
                      }
                      {doctors.filter(doc => selectedSpecialtyId === 'all' || doc.specialty_id === selectedSpecialtyId).length === 0 && (
                        <SelectItem value="none" disabled>
                          Nenhum médico nesta especialidade
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    required 
                    min={getLocalDateString()}
                    className="rounded-xl" 
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Select name="time" required value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSlots().length > 0 ? (
                        getAvailableSlots().map(slot => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          Nenhum horário disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedDoctorId && selectedDate && (
                <div className="bg-[#E0F2F1] dark:bg-teal-950/20 p-3 rounded-xl border border-[#E0F2F1] dark:border-teal-900/30 shadow-inner space-y-2">
                  <p className="text-xs font-black text-[#028090] dark:text-teal-400 uppercase">Resumo da Disponibilidade:</p>
                  
                  {(() => {
                    const todayStr = getLocalDateString();
                    if (selectedDate < todayStr) {
                      return <p className="text-xs text-red-500 font-bold">⚠️ Data já passou. Não é possível agendar nesta data.</p>;
                    }

                    const [y, m, d] = selectedDate.split('-').map(Number);
                    const dayIdx = new Date(y, m - 1, d).getDay();
                    const dayOfWeek = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][dayIdx];
                    const avail = availabilities[selectedDoctorId]?.find(a => a.day === dayOfWeek);
                    const exception = (exceptions[selectedDoctorId] || []).find(ex => ex.date === selectedDate);
                    
                    if (exception) {
                      return (
                        <div className="space-y-1">
                          <p className="text-xs text-red-500 font-bold">⚠️ DIA BLOQUEADO (Agenda suspensa/Recesso)</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Motivo: {exception.reason || 'Recesso'}</p>
                        </div>
                      );
                    }

                    if (!avail || !avail.active || !avail.slots || avail.slots.length === 0) {
                      return <p className="text-xs text-red-500 font-bold">❌ Sem expediente cadastrado para este dia da semana ({dayOfWeek.toUpperCase()}).</p>;
                    }

                    const availSlots = getAvailableSlotsFor(selectedDoctorId, selectedDate);
                    
                    return (
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400">Expediente do Médico:</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {avail.slots.map((slot: any) => (
                              <Badge key={slot.id} variant="outline" className="bg-white/80 text-[#028090] dark:bg-teal-950/50 dark:text-teal-300 border-teal-100 border-[1.5px] font-bold py-0.5 text-[10px]">
                                {slot.start} - {slot.end}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400">Horários Livres ({availSlots.length}):</p>
                          {availSlots.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1 max-h-[80px] overflow-y-auto p-1 bg-white/40 dark:bg-black/10 rounded-lg">
                              {availSlots.map(slot => (
                                <span key={slot} className="text-[10px] font-mono font-bold bg-[#00A896]/15 text-[#00A896] dark:text-[#00c9b6] px-1.5 py-0.5 rounded border border-[#00A896]/20">
                                  {slot}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-red-500 font-bold mt-1">❌ Nenhum horário livre disponível para esta data.</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <p className="text-[9px] text-[#00A896] italic mt-1">* Apenas horários livres de 30 em 30 min correspondentes à agenda cadastrada são listados.</p>
                </div>
              )}

              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-[#00A896] hover:bg-[#028090] text-white rounded-xl font-bold">
                  Confirmar Agendamento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Editar Agendamento</DialogTitle>
            </DialogHeader>
            {editingAppointment && (
              <form onSubmit={handleUpdateAppointment} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <Input 
                    value={`${editingAppointment.patient?.name} (${editingAppointment.patient_id})`} 
                    disabled 
                    className="rounded-xl bg-slate-50" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-specialty-filter">Filtrar por Especialidade</Label>
                    <Select 
                      value={editSelectedSpecialtyId} 
                      onValueChange={(val) => {
                        setEditSelectedSpecialtyId(val);
                        // Only reset doctor if current selection is not under the new specialty
                        const currentDoc = doctors.find(d => d.id === selectedDoctorId);
                        if (val !== 'all' && currentDoc?.specialty_id !== val) {
                          setSelectedDoctorId('');
                        }
                      }}
                    >
                      <SelectTrigger id="edit-specialty-filter" className="rounded-xl">
                        <SelectValue placeholder="Todas as Especialidades">
                          {editSelectedSpecialtyId === 'all' 
                            ? 'Todas as Especialidades' 
                            : (specialties.find(spec => spec.id === editSelectedSpecialtyId)?.name || editSelectedSpecialtyId)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Especialidades</SelectItem>
                        {specialties.map(spec => (
                          <SelectItem key={spec.id} value={spec.id}>
                            {spec.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-doctor">Médico / Especialista</Label>
                    <Select name="doctor" value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                      <SelectTrigger id="edit-doctor" className="rounded-xl">
                        <SelectValue placeholder="Selecione o médico">
                          {selectedDoctorId 
                            ? (doctors.find(doc => doc.id === selectedDoctorId)?.name || selectedDoctorId) 
                            : 'Selecione o médico'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {doctors
                          .filter(doc => editSelectedSpecialtyId === 'all' || doc.specialty_id === editSelectedSpecialtyId)
                          .map(doc => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.name}
                            </SelectItem>
                          ))
                        }
                        {doctors.filter(doc => editSelectedSpecialtyId === 'all' || doc.specialty_id === editSelectedSpecialtyId).length === 0 && (
                          <SelectItem value="none" disabled>
                            Nenhum médico nesta especialidade
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-date">Data</Label>
                    <Input 
                      id="edit-date" 
                      name="date" 
                      type="date" 
                      defaultValue={editingAppointment.date}
                      required 
                      min={getLocalDateString()}
                      className="rounded-xl" 
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-time">Horário</Label>
                    <Select name="time" required value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger id="edit-time" className="rounded-xl">
                        <SelectValue placeholder="Selecione o horário" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Include current time in selection list if it's not in available slots */}
                        {!getAvailableSlotsFor(selectedDoctorId, selectedDate, editingAppointment.id).includes(editingAppointment.time) && (
                          <SelectItem value={editingAppointment.time}>{editingAppointment.time} (Atual)</SelectItem>
                        )}
                        {getAvailableSlotsFor(selectedDoctorId, selectedDate, editingAppointment.id).map(slot => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedDoctorId && selectedDate && (
                  <div className="bg-[#E0F2F1] dark:bg-teal-950/20 p-3 rounded-xl border border-[#E0F2F1] dark:border-teal-900/30 shadow-inner space-y-2 mt-2">
                    <p className="text-xs font-black text-[#028090] dark:text-teal-400 uppercase">Resumo da Disponibilidade:</p>
                    
                    {(() => {
                      const todayStr = getLocalDateString();
                      if (selectedDate < todayStr) {
                        return <p className="text-xs text-red-500 font-bold">⚠️ Data já passou. Não é possível alterar para esta data.</p>;
                      }

                      const [y, m, d] = selectedDate.split('-').map(Number);
                      const dayIdx = new Date(y, m - 1, d).getDay();
                      const dayOfWeek = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][dayIdx];
                      const avail = availabilities[selectedDoctorId]?.find(a => a.day === dayOfWeek);
                      const exception = (exceptions[selectedDoctorId] || []).find(ex => ex.date === selectedDate);
                      
                      if (exception) {
                        return (
                          <div className="space-y-1">
                            <p className="text-xs text-red-500 font-bold">⚠️ DIA BLOQUEADO (Agenda suspensa/Recesso)</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Motivo: {exception.reason || 'Recesso'}</p>
                          </div>
                        );
                      }

                      if (!avail || !avail.active || !avail.slots || avail.slots.length === 0) {
                        return <p className="text-xs text-red-500 font-bold">❌ Sem expediente cadastrado para este dia da semana ({dayOfWeek.toUpperCase()}).</p>;
                      }

                      const availSlots = getAvailableSlotsFor(selectedDoctorId, selectedDate, editingAppointment.id);
                      
                      return (
                        <div className="space-y-2">
                          <div>
                            <p className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400">Expediente do Médico:</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {avail.slots.map((slot: any) => (
                                <Badge key={slot.id} variant="outline" className="bg-white/80 text-[#028090] dark:bg-teal-950/50 dark:text-teal-300 border-teal-100 border-[1.5px] font-bold py-0.5 text-[10px]">
                                  {slot.start} - {slot.end}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400">Horários Livres ({availSlots.length}):</p>
                            {availSlots.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1 max-h-[80px] overflow-y-auto p-1 bg-white/40 dark:bg-black/10 rounded-lg">
                                {availSlots.map(slot => (
                                  <span key={slot} className="text-[10px] font-mono font-bold bg-[#00A896]/15 text-[#00A896] dark:text-[#00c9b6] px-1.5 py-0.5 rounded border border-[#00A896]/20">
                                    {slot}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-red-500 font-bold mt-1">❌ Nenhum horário livre disponível para esta data.</p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    <p className="text-[9px] text-[#00A896] italic mt-1">* Apenas horários livres de 30 em 30 min correspondentes à agenda cadastrada são listados.</p>
                  </div>
                )}

                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full bg-[#00A896] hover:bg-[#028090] text-white rounded-xl font-bold">
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Buscar por paciente, CPF, médico ou data..." 
            className="pl-10 bg-white border-slate-200 rounded-xl h-11" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 italic">Carregando agendamentos...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 italic">Nenhum agendamento encontrado.</div>
        ) : (
          filteredAppointments.map((app) => (
          <Card key={app.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="text-center min-w-[80px]">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{formatDateSafe(app.date, 'ccc')}</p>
                    <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{formatDateSafe(app.date, 'd')}</p>
                    <p className="text-sm font-bold text-[#00A896] mt-1">{app.time}</p>
                  </div>
                  
                  <div className="h-12 w-px bg-slate-100"></div>

                  <div>
                    <div className="flex items-center gap-2">
                      {app.daily_sequence && (
                        <span className="text-xs font-black text-[#028090] bg-[#E0F2F1] px-2 py-0.5 rounded-lg border border-[#E0F2F1]">
                          AG{app.daily_sequence}
                        </span>
                      )}
                      <h3 className="font-bold text-lg text-slate-900">{app.patient?.name || 'Paciente'}</h3>
                      {app.patient_id && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                          {app.patient_id}
                        </span>
                      )}
                      <Badge variant={app.status === 'confirmed' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5 uppercase font-bold">
                        {app.status === 'confirmed' ? 'Confirmado' : app.status === 'scheduled' ? 'Agendado' : app.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Stethoscope size={14} className="text-[#00A896]" />
                        {app.doctor?.name || 'Médico'}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <CalendarIcon size={14} />
                        {formatDateSafe(app.date)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-[#00A896] hover:bg-[#E0F2F1]/50 rounded-xl"
                    title="Confirmar"
                    onClick={() => handleStatusUpdate(app.id, 'confirmed')}
                  >
                    <CheckCircle2 size={20} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    title="Cancelar"
                    onClick={() => handleStatusUpdate(app.id, 'cancelled')}
                  >
                    <XCircle size={20} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-[#028090] hover:bg-[#E0F2F1]/50 rounded-xl"
                    title="Editar"
                    onClick={() => {
                      const assocDoc = doctors.find(d => d.id === app.doctor_id);
                      setEditingAppointment(app);
                      setSelectedDoctorId(app.doctor_id);
                      setEditSelectedSpecialtyId(assocDoc?.specialty_id || 'all');
                      setSelectedDate(app.date);
                      setSelectedTime(app.time);
                    }}
                  >
                    <Edit size={20} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    title="Excluir"
                    onClick={() => handleDeleteAppointment(app.id)}
                  >
                    <Trash2 size={20} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
