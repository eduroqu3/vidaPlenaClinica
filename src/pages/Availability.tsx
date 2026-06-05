import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface DayAvailability {
  day: string;
  label: string;
  active: boolean;
  slots: TimeSlot[];
}

const INITIAL_AVAILABILITY: DayAvailability[] = [
  { day: 'seg', label: 'Segunda-feira', active: true, slots: [{ id: '1', start: '08:00', end: '12:00' }, { id: '2', start: '13:30', end: '18:00' }] },
  { day: 'ter', label: 'Terça-feira', active: true, slots: [{ id: '3', start: '08:00', end: '12:00' }, { id: '4', start: '13:30', end: '18:00' }] },
  { day: 'qua', label: 'Quarta-feira', active: true, slots: [{ id: '5', start: '08:00', end: '12:00' }, { id: '6', start: '13:30', end: '18:00' }] },
  { day: 'qui', label: 'Quinta-feira', active: true, slots: [{ id: '7', start: '08:00', end: '12:00' }, { id: '8', start: '13:30', end: '18:00' }] },
  { day: 'sex', label: 'Sexta-feira', active: true, slots: [{ id: '9', start: '08:00', end: '12:00' }, { id: '10', start: '13:30', end: '18:00' }] },
  { day: 'sab', label: 'Sábado', active: false, slots: [] },
  { day: 'dom', label: 'Domingo', active: false, slots: [] },
];

const AvailabilityPage = () => {
  const { activeDoctorId, availabilities, exceptions, updateAvailability, addException, removeException, session } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [localAvailability, setLocalAvailability] = useState<DayAvailability[]>([]);
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [newExceptionReason, setNewExceptionReason] = useState('');

  useEffect(() => {
    if (availabilities[activeDoctorId]) {
      setLocalAvailability(JSON.parse(JSON.stringify(availabilities[activeDoctorId])));
    }
  }, [activeDoctorId, availabilities]);

  // Auto-save whenever localAvailability changes
  useEffect(() => {
    if (localAvailability.length === 0) return;

    const timer = setTimeout(() => {
      // Logic to prevent initial save or saving if data is identical
      if (JSON.stringify(localAvailability) !== JSON.stringify(availabilities[activeDoctorId])) {
        handleSave();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [localAvailability]);

  const activeExceptions = exceptions[activeDoctorId] || [];

  const toggleDay = (dayIndex: number) => {
    const newAvail = [...localAvailability];
    newAvail[dayIndex].active = !newAvail[dayIndex].active;
    if (newAvail[dayIndex].active && newAvail[dayIndex].slots.length === 0) {
      newAvail[dayIndex].slots = [{ id: Math.random().toString(), start: '08:00', end: '12:00' }];
    }
    setLocalAvailability(newAvail);
  };

  const addSlot = (dayIndex: number) => {
    const newAvail = JSON.parse(JSON.stringify(localAvailability));
    newAvail[dayIndex].slots.push({
      id: Math.random().toString(),
      start: '14:00',
      end: '18:00'
    });
    setLocalAvailability(newAvail);
  };

  const removeSlot = (dayIndex: number, slotId: string) => {
    const newAvail = JSON.parse(JSON.stringify(localAvailability));
    newAvail[dayIndex].slots = newAvail[dayIndex].slots.filter((s: any) => s.id !== slotId);
    setLocalAvailability(newAvail);
  };

  const updateSlot = (dayIndex: number, slotId: string, field: 'start' | 'end', value: string) => {
    const newAvail = JSON.parse(JSON.stringify(localAvailability));
    const slot = newAvail[dayIndex].slots.find((s: any) => s.id === slotId);
    if (slot) {
      slot[field] = value;
    }
    setLocalAvailability(newAvail);
  };

  const handleSave = async () => {
    if (!activeDoctorId) return;
    setIsSaving(true);
    try {
      await updateAvailability(activeDoctorId, localAvailability);
      toast.success('Disponibilidade semanal salva!');
    } catch (error) {
      // toast is already in AuthContext
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddException = async () => {
    if (!newExceptionDate) {
      toast.error('Selecione uma data.');
      return;
    }
    await addException(activeDoctorId, { date: newExceptionDate, reason: newExceptionReason });
    setNewExceptionDate('');
    setNewExceptionReason('');
  };

  if (session?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-3xl border border-red-100 shadow-sm space-y-4">
        <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          A configuração de disponibilidade é permitida apenas para administradores da clínica. O médico logado não pode alterar sua própria disponibilidade.
        </p>
      </div>
    );
  }

  if (localAvailability.length === 0) {
    return <div className="p-8 text-center text-slate-500">Carregando horários...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurar Disponibilidade</h1>
          <p className="text-slate-500 text-sm">Defina os dias e horários que você atende na clínica.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all border",
            isSaving 
              ? "bg-[#E0F2F1] text-[#028090] border-[#E0F2F1]" 
              : "bg-emerald-50 text-emerald-600 border-emerald-100"
          )}>
            {isSaving ? (
              <>
                <Clock className="animate-spin" size={14} />
                <span className="uppercase tracking-widest">Salvando alterações...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span className="uppercase tracking-widest">Alterações salvas automaticamente</span>
              </>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
          <TabsTrigger value="weekly" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Horário Semanal
          </TabsTrigger>
          <TabsTrigger value="exceptions" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Bloqueios e Exceções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <div className="grid gap-4">
            {localAvailability.map((day, dayIdx) => (
              <Card key={day.day} className={cn(
                "border-none shadow-sm transition-all duration-200",
                day.active ? "bg-white ring-1 ring-slate-200" : "bg-slate-50 opacity-75"
              )}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <Switch 
                        checked={day.active} 
                        onCheckedChange={() => toggleDay(dayIdx)}
                        className="data-[state=checked]:bg-[#00A896]"
                      />
                      <span className={cn(
                        "font-bold text-lg",
                        day.active ? "text-slate-900" : "text-slate-400"
                      )}>
                        {day.label}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3">
                      {!day.active ? (
                        <p className="text-sm text-slate-400 italic">Indisponível para agendamentos</p>
                      ) : (
                        <div className="space-y-3">
                          {day.slots.map((slot) => (
                            <div key={slot.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                <Input 
                                  type="time" 
                                  value={slot.start} 
                                  onChange={(e) => updateSlot(dayIdx, slot.id, 'start', e.target.value)}
                                  className="w-24 border-none bg-transparent h-8 focus-visible:ring-0"
                                />
                                <span className="text-slate-400">até</span>
                                <Input 
                                  type="time" 
                                  value={slot.end} 
                                  onChange={(e) => updateSlot(dayIdx, slot.id, 'end', e.target.value)}
                                  className="w-24 border-none bg-transparent h-8 focus-visible:ring-0"
                                />
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeSlot(dayIdx, slot.id)}
                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => addSlot(dayIdx)}
                            className="text-[#00A896] hover:text-[#028090] hover:bg-[#E0F2F1]/50 rounded-lg gap-1.5 h-8 font-bold"
                          >
                            <Plus size={14} />
                            Adicionar intervalo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exceptions">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Datas Específicas</CardTitle>
              <CardDescription>
                Bloqueie datas para férias, congressos ou outros compromissos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-[#E0F2F1] border border-[#E0F2F1] rounded-xl p-4 flex gap-3">
                <Info className="text-[#028090] shrink-0" size={20} />
                <p className="text-sm text-[#028090] leading-relaxed">
                  Bloqueios de data impedem que a recepção agende qualquer consulta no dia selecionado. 
                  Consultas já agendadas precisarão ser remarcadas manualmente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <CalendarIcon size={18} className="text-slate-400" />
                    Adicionar Bloqueio
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input 
                        type="date" 
                        className="rounded-xl" 
                        value={newExceptionDate}
                        onChange={(e) => setNewExceptionDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo (Opcional)</Label>
                      <Input 
                        placeholder="Ex: Congresso Médico" 
                        className="rounded-xl" 
                        value={newExceptionReason}
                        onChange={(e) => setNewExceptionReason(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handleAddException}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                    >
                      Bloquear Data
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle size={18} className="text-slate-400" />
                    Bloqueios Ativos
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {activeExceptions.length === 0 ? (
                      <p className="text-sm text-slate-400 italic text-center py-8">Nenhum bloqueio cadastrado.</p>
                    ) : (
                      activeExceptions.map((ex) => (
                        <div key={ex.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {new Date(ex.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                            {ex.reason && <p className="text-xs text-slate-500">{ex.reason}</p>}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeException(ex.id)}
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AvailabilityPage;
