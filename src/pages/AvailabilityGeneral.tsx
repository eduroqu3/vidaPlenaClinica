import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon,
  AlertCircle,
  Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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

export default function AvailabilityGeneral() {
  const { 
    doctors, 
    availabilities, 
    exceptions, 
    updateAvailability, 
    addException, 
    removeException 
  } = useAuth();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Selected doctor local state
  const [docAvail, setDocAvail] = useState<DayAvailability[]>([]);
  const [newExDate, setNewExDate] = useState('');
  const [newExReason, setNewExReason] = useState('');

  // Auto-set first doctor if available and selectedDoctorId is empty
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  // Load doctor availability when selected doctor changes OR context data changes
  useEffect(() => {
    if (selectedDoctorId && availabilities[selectedDoctorId]) {
      setDocAvail(JSON.parse(JSON.stringify(availabilities[selectedDoctorId])));
    } else {
      setDocAvail([]);
    }
  }, [selectedDoctorId, availabilities]);

  // DOCTOR SPECIFIC ACTIONS
  const toggleDocDay = (idx: number) => {
    if (docAvail.length === 0) return;
    const updated = [...docAvail];
    updated[idx].active = !updated[idx].active;
    if (updated[idx].active && updated[idx].slots.length === 0) {
      updated[idx].slots = [{ id: Math.random().toString(), start: '08:00', end: '12:00' }];
    }
    setDocAvail(updated);
  };

  const addDocSlot = (idx: number) => {
    if (docAvail.length === 0) return;
    const updated = JSON.parse(JSON.stringify(docAvail));
    updated[idx].slots.push({
      id: Math.random().toString(),
      start: '14:00',
      end: '18:00'
    });
    setDocAvail(updated);
  };

  const removeDocSlot = (dayIdx: number, slotId: string) => {
    if (docAvail.length === 0) return;
    const updated = JSON.parse(JSON.stringify(docAvail));
    updated[dayIdx].slots = updated[dayIdx].slots.filter((s: TimeSlot) => s.id !== slotId);
    setDocAvail(updated);
  };

  const updateDocSlot = (dayIdx: number, slotId: string, field: 'start' | 'end', val: string) => {
    if (docAvail.length === 0) return;
    const updated = JSON.parse(JSON.stringify(docAvail));
    const slot = updated[dayIdx].slots.find((s: TimeSlot) => s.id === slotId);
    if (slot) {
      slot[field] = val;
    }
    setDocAvail(updated);
  };

  const handleSaveDocAvail = async () => {
    if (!selectedDoctorId || docAvail.length === 0) return;
    setIsSaving(true);
    try {
      await updateAvailability(selectedDoctorId, docAvail);
      toast.success(`Disponibilidade de ${selectedDoctor?.name} atualizada com sucesso!`);
    } catch (e) {
      toast.error('Ocorreu um erro ao salvar a agenda.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddException = async () => {
    if (!selectedDoctorId) {
      toast.error('Escolha um médico.');
      return;
    }
    if (!newExDate) {
      toast.error('Escolha a data da exceção.');
      return;
    }
    try {
      setIsSaving(true);
      await addException(selectedDoctorId, { date: newExDate, reason: newExReason });
      setNewExDate('');
      setNewExReason('');
      toast.success('Exceção/Bloqueio temporário adicionado com sucesso!');
    } catch (e) {
      toast.error('Falhou ao salvar exceção.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveException = async (exId: string) => {
    try {
      setIsSaving(true);
      await removeException(exId);
      toast.success('Exceção removida!');
    } catch (e) {
      toast.error('Erro ao excluir exceção.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
  const activeExceptions = selectedDoctorId ? (exceptions[selectedDoctorId] || []) : [];

  return (
    <div id="availability-general-container" className="max-w-6xl mx-auto space-y-8 animate-fade-in font-sans">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2.5">
            <Clock className="text-[#028090] stroke-[2.5]" size={24} />
            Disponibilidade dos Profissionais
          </h1>
          <p className="text-xs text-slate-500 font-medium">Controle de grades específicas de médicos e bloqueios temporários de agenda</p>
        </div>
        
        {isSaving && (
          <Badge className="bg-[#E0F2F1] text-[#028090] dark:bg-slate-900 border border-transparent font-bold text-[10px] uppercase px-3 py-1 animate-pulse">
            Sincronizando Base...
          </Badge>
        )}
      </div>

      {/* Doctor Selection Tool */}
      <div className="bg-white dark:bg-[#111c24] border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-in">
          <div className="space-y-1 w-full sm:max-w-md">
            <Label className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Selecionar Médico Responsável</Label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-[#028090] cursor-pointer"
            >
              <option value="" disabled>Selecione um médico...</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} {d.crm ? `(CRM: ${d.crm})` : ''}</option>
              ))}
            </select>
          </div>

          {selectedDoctor && (
            <div className="flex items-center gap-3 w-full sm:w-auto py-1 justify-end">
              <Button
                onClick={handleSaveDocAvail}
                className="h-11 px-6 text-[10px] font-black uppercase bg-[#028090] hover:bg-[#00a896] text-white tracking-wider rounded-xl cursor-pointer shadow-sm w-full sm:w-auto transition-colors"
                id="btn-save-availability"
              >
                Salvar Disponibilidade
              </Button>
            </div>
          )}
        </div>
      </div>

      {!selectedDoctor ? (
        <Card className="border-none bg-slate-100/50 dark:bg-slate-900/40 p-12 text-center rounded-2xl">
          <Stethoscope className="mx-auto text-slate-300 animate-pulse mb-3" size={32} />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nenhum profissional de saúde cadastrado no sistema ou selecionado.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Weekly availability grids */}
          <div className="lg:col-span-2 space-y-4">
            <div className="px-1">
              <h3 className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-widest">Grade Semanal: {selectedDoctor.name}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Determine os limites assistenciais para este profissional para cada dia útil.</p>
            </div>

            <div className="space-y-3">
              {docAvail.length === 0 ? (
                <div className="p-8 text-center text-slate-450 italic text-xs bg-white rounded-2xl border border-slate-150/40 dark:border-slate-800">
                  Sem horários definidos para este médico.
                </div>
              ) : (
                docAvail.map((day, dIdx) => (
                  <Card key={day.day} className={cn(
                    "border-none shadow-sm transition-all overflow-hidden rounded-2xl",
                    day.active ? "bg-white ring-1 ring-slate-150/40 dark:bg-[#111c24] dark:ring-slate-800" : "bg-slate-100/40 dark:bg-slate-900/30 opacity-70"
                  )}>
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-[150px]">
                        <Switch 
                          checked={day.active} 
                          onCheckedChange={() => toggleDocDay(dIdx)}
                          className="scale-90 data-[state=checked]:bg-[#00a896]"
                        />
                        <span className={cn(
                          "font-extrabold text-xs uppercase tracking-wide",
                          day.active ? "text-slate-800 dark:text-slate-100" : "text-slate-400"
                        )}>
                          {day.label}
                        </span>
                      </div>

                      <div className="flex-1">
                        {!day.active ? (
                          <p className="text-[10px] text-slate-400 italic font-medium">Fora de atendimento</p>
                        ) : (
                          <div className="flex flex-wrap items-center gap-3 justify-start">
                            {day.slots.map((slot) => (
                              <div key={slot.id} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-150/50 dark:border-slate-800">
                                <Input 
                                  type="time" 
                                  value={slot.start} 
                                  onChange={(e) => updateDocSlot(dIdx, slot.id, 'start', e.target.value)}
                                  className="w-[85px] border-none bg-transparent h-6 text-xs px-1 py-0.5 text-center focus-visible:ring-0 font-bold dark:text-slate-150"
                                />
                                <span className="text-[9px] font-bold text-slate-400 text-center w-4">às</span>
                                <Input 
                                  type="time" 
                                  value={slot.end} 
                                  onChange={(e) => updateDocSlot(dIdx, slot.id, 'end', e.target.value)}
                                  className="w-[85px] border-none bg-transparent h-6 text-xs px-1 py-0.5 text-center focus-visible:ring-0 font-bold dark:text-slate-150"
                                />
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeDocSlot(dIdx, slot.id)}
                                  className="h-5 w-5 text-slate-455 hover:text-red-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                                >
                                  <Trash2 size={11} />
                                </Button>
                              </div>
                            ))}
                            
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="sm" 
                              onClick={() => addDocSlot(dIdx)}
                              className="text-[#00A896] hover:bg-[#E0F2F1]/40 rounded-xl h-7 px-2 font-black text-[9px] uppercase tracking-wider"
                            >
                              + Horário
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Temporary exceptions and block dates */}
          <div className="space-y-6">
            
            {/* Block Creator card */}
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#111c24]">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <CalendarIcon size={16} className="text-[#028090]" />
                  Incluir Exceção / Bloqueio
                </CardTitle>
                <CardDescription className="text-xs">
                  Bloqueie datas completas por férias, licenças ou compromissos. Nenhuma consulta poderá ser agendada na data bloqueada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-450">Data de Bloqueio</Label>
                  <Input 
                    type="date" 
                    value={newExDate}
                    onChange={(e) => setNewExDate(e.target.value)}
                    className="rounded-xl border-slate-200" 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-450">Motivo ou Nome do Evento</Label>
                  <Input 
                    placeholder="Ex: Congresso de Cardiologia" 
                    value={newExReason}
                    onChange={(e) => setNewExReason(e.target.value)}
                    className="rounded-xl border-slate-200" 
                  />
                </div>

                <Button 
                  onClick={handleAddException}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-[#028090] dark:hover:bg-[#00A896] font-bold text-xs uppercase tracking-widest rounded-xl h-10 mt-2 cursor-pointer shadow-sm"
                >
                  Bloquear Data
                </Button>
              </CardContent>
            </Card>

            {/* Blocked Dates List */}
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#111c24]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-500" />
                  Bloqueios Ativos ({activeExceptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {activeExceptions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic text-xs">
                      Nenhum dia bloqueado ativo.
                    </div>
                  ) : (
                    [...activeExceptions]
                      .sort((a,b) => a.date.localeCompare(b.date))
                      .map((ex) => (
                        <div key={ex.id} className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800 rounded-xl transition-all">
                          <div>
                            <p className="text-xs font-black text-slate-850 dark:text-slate-100">
                              {new Date(ex.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                            {ex.reason && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{ex.reason}</p>}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveException(ex.id)}
                            className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-850 rounded-lg shrink-0 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      )}
    </div>
  );
}
