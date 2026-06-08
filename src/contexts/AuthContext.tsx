import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole, Specialty } from '@/src/types';
import { initSpecialties } from '@/src/lib/init-specialties';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';
import { createSecureToken, verifySecureToken } from '@/src/lib/SessionSecurity';
import { initDraftManager, clearAllDrafts } from '@/src/lib/DraftManager';

export interface Session {
  role: 'admin' | 'doctor' | 'attendant' | 'patient';
  user: any;
}

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoading: boolean;
  doctors: Profile[];
  specialties: Specialty[];
  removeSpecialty: (id: string) => Promise<void>;
  activeDoctorId: string;
  switchDoctor: (id: string) => void;
  addDoctor: (newDoc: Omit<Profile, 'id' | 'role' | 'created_at'>) => Promise<void>;
  updateDoctor: (id: string, updates: Partial<Profile>) => Promise<void>;
  removeDoctor: (id: string) => Promise<void>;
  attendants: Profile[];
  activeAttendantId: string;
  switchAttendant: (id: string) => void;
  addAttendant: (newAtt: Omit<Profile, 'id' | 'role' | 'created_at'>) => Promise<void>;
  updateAttendant: (id: string, updates: Partial<Profile>) => Promise<void>;
  removeAttendant: (id: string) => Promise<void>;
  patients: any[];
  addPatient: (newPatient: any) => Promise<void>;
  updatePatient: (id: string, updates: any) => Promise<void>;
  removePatient: (id: string) => Promise<void>;
  removeAppointment: (id: string) => Promise<void>;
  availabilities: Record<string, any[]>;
  exceptions: Record<string, any[]>;
  updateAvailability: (doctorId: string, availability: any[]) => Promise<void>;
  addException: (doctorId: string, exception: { date: string; reason: string }) => Promise<void>;
  removeException: (exceptionId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  isFullScreen: boolean;
  setIsFullScreen: (val: boolean) => void;
  session: Session | null;
  login: (loginInput: string, passwordInput: string, type: 'staff' | 'patient') => Promise<boolean>;
  logout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  originalAdminSession: Session | null;
  impersonate: (targetRole: 'doctor' | 'attendant' | 'patient', targetId: string) => void;
  stopImpersonating: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const formatDatabaseError = (error: any, context: 'doctor' | 'attendant' | 'patient') => {
  const msg = error?.message?.toLowerCase() || '';
  const code = error?.code || '';

  if (code === '23505' || msg.includes('unique constraint') || msg.includes('duplicate key') || msg.includes('já existe')) {
    if (msg.includes('email') || msg.includes('doctors_email_key') || msg.includes('attendants_email_key')) {
      return 'Este e-mail já está cadastrado para outro profissional na clínica.';
    }
    if (msg.includes('crm') || msg.includes('doctors_crm_key')) {
      return 'Este CRM já está cadastrado para outro médico.';
    }
    if (msg.includes('patients_pkey') || msg.includes('primary key') || context === 'patient') {
      return 'Este CPF/Identificador já está cadastrado para outro paciente.';
    }
    return 'Já existe um cadastro com essa informação de valor único (E-mail, CRM ou CPF já cadastrados).';
  }
  
  return error?.message || 'Erro desconhecido.';
};

export const generateRandomPassword = () => {
  const first = Math.floor(Math.random() * 10).toString();
  const last = Math.floor(Math.random() * 10).toString();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let middle = '';
  for (let i = 0; i < 6; i++) {
    middle += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${first}${middle}${last}`;
};

// Mock users for simulation
const INITIAL_DOCTORS: Profile[] = [
  {
    id: 'doc-1',
    name: 'Dr. Ricardo Silva',
    email: 'ricardo@clinica.com',
    role: 'doctor',
    specialty_id: 'spec-1',
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc-2',
    name: 'Dra. Helena Costa',
    email: 'helena@clinica.com',
    role: 'doctor',
    specialty_id: 'spec-2',
    created_at: new Date().toISOString(),
  }
];



const getDefaultAvailability = () => [
  { day: 'seg', label: 'Segunda-feira', active: true, slots: [{ id: '1', start: '08:00', end: '12:00' }, { id: '2', start: '13:30', end: '18:00' }] },
  { day: 'ter', label: 'Terça-feira', active: true, slots: [{ id: '3', start: '08:00', end: '12:00' }, { id: '4', start: '13:30', end: '18:00' }] },
  { day: 'qua', label: 'Quarta-feira', active: true, slots: [{ id: '5', start: '08:00', end: '12:00' }, { id: '6', start: '13:30', end: '18:00' }] },
  { day: 'qui', label: 'Quinta-feira', active: true, slots: [{ id: '7', start: '08:00', end: '12:00' }, { id: '8', start: '13:30', end: '18:00' }] },
  { day: 'sex', label: 'Sexta-feira', active: true, slots: [{ id: '9', start: '08:00', end: '12:00' }, { id: '10', start: '13:30', end: '18:00' }] },
  { day: 'sab', label: 'Sábado', active: false, slots: [] },
  { day: 'dom', label: 'Domingo', active: false, slots: [] },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const savedToken = localStorage.getItem('clinic_saved_session');
    if (savedToken) {
      const verification = verifySecureToken(savedToken);
      if (verification.success && verification.role && verification.user) {
        return {
          role: verification.role,
          user: verification.user
        };
      } else {
        // Remove token se expirado, corrompido ou copiado de outro computador/navegador
        localStorage.removeItem('clinic_saved_session');
      }
    }
    return null;
  });

  // Inicializa o gerenciador inteligente de rascunhos de input (autosave) com limpeza automática
  useEffect(() => {
    const cleanupDrafts = initDraftManager();
    return () => cleanupDrafts();
  }, []);

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('clinic_role');
    return (saved as UserRole) || 'attendant';
  });
  
  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [attendants, setAttendants] = useState<Profile[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [availabilities, setAvailabilities] = useState<Record<string, any[]>>({});
  const [exceptions, setExceptions] = useState<Record<string, any[]>>({});
  const [activeDoctorId, setActiveDoctorId] = useState<string>(() => {
    return localStorage.getItem('clinic_active_doctor_id') || '';
  });
  const [activeAttendantId, setActiveAttendantId] = useState<string>(() => {
    return localStorage.getItem('clinic_active_attendant_id') || '';
  });
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [originalAdminSession, setOriginalAdminSession] = useState<Session | null>(() => {
    const saved = localStorage.getItem('clinic_original_admin_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Initialize specialties if needed
      const initResult = await initSpecialties();
      if (!initResult.success) {
        console.warn('Initialization issue:', initResult.message);
        toast.error(initResult.message, { duration: 10000 });
      }
      
      // Fetch Doctors, Patients, Specialties, Availability and Exceptions
      const [docsRes, patsRes, specsRes, availRes, exceptRes] = await Promise.all([
        supabase.from('doctors').select('*').order('name'),
        supabase.from('patients').select('*').order('name'),
        supabase.from('specialties').select('*').order('name'),
        supabase.from('doctor_availability').select('*'),
        supabase.from('doctor_exceptions').select('*').order('date', { ascending: true }),
      ]);

      if (docsRes.error) {
        console.error('Doctors fetch error:', docsRes.error);
        if (docsRes.error.code === 'PGRST205' || docsRes.error.message.includes('not found')) {
          toast.error('Tabela "doctors" não encontrada. Verifique o SQL no Supabase.');
        }
        throw docsRes.error;
      }

      setPatients(patsRes.data || []);
      
      if (specsRes.error) {
        console.warn('Specialties table error:', specsRes.error);
        if (specsRes.error.message.includes('not found')) {
          toast.error('Tabela "specialties" não encontrada. Verifique se executou o arquivo "supabase_schema.sql" no Supabase.', { duration: 10000 });
        } else {
          toast.error(`Erro ao carregar especialidades: ${specsRes.error.message}`);
        }
      }
      
      if (availRes.error) {
        console.warn('Availability table error:', availRes.error);
      }
      
      if (exceptRes.error) {
        console.warn('Exceptions table error:', exceptRes.error);
      }

      const doctorsWithRole = (docsRes.data || []).map(doc => ({ ...doc, role: 'doctor' as const }));
      setDoctors(doctorsWithRole);
      setSpecialties(specsRes.data || []);

      const dayLabels: Record<string, string> = {
        seg: 'Segunda-feira',
        ter: 'Terça-feira',
        qua: 'Quarta-feira',
        qui: 'Quinta-feira',
        sex: 'Sexta-feira',
        sab: 'Sábado',
        dom: 'Domingo'
      };

      // Process Availabilities
      const transformedAvails: Record<string, any[]> = {};
      
      // Initialize with defaults for all doctors
      doctorsWithRole.forEach(doc => {
        transformedAvails[doc.id] = getDefaultAvailability();
      });

      // Override with DB data
      if (availRes.data) {
        availRes.data.forEach(row => {
          if (!transformedAvails[row.doctor_id]) {
            transformedAvails[row.doctor_id] = getDefaultAvailability();
          }
          
          const dayIdx = transformedAvails[row.doctor_id].findIndex(d => d.day === row.day_of_week);
          if (dayIdx !== -1) {
            transformedAvails[row.doctor_id][dayIdx] = {
              day: row.day_of_week,
              label: dayLabels[row.day_of_week],
              active: row.active,
              slots: row.slots || []
            };
          }
        });
      }

      setAvailabilities(transformedAvails);

      // Process Exceptions
      const transformedExcepts: Record<string, any[]> = {};
      doctorsWithRole.forEach(doc => {
        transformedExcepts[doc.id] = [];
      });

      if (exceptRes.data) {
        exceptRes.data.forEach(row => {
          if (!transformedExcepts[row.doctor_id]) {
            transformedExcepts[row.doctor_id] = [];
          }
          transformedExcepts[row.doctor_id].push(row);
        });
      }

      setExceptions(transformedExcepts);

      if (doctorsWithRole.length > 0 && !activeDoctorId) {
        const firstId = doctorsWithRole[0].id;
        setActiveDoctorId(firstId);
        localStorage.setItem('clinic_active_doctor_id', firstId);
      }

      // Fetch Attendants (Faithful query)
      let fetchedAttendants: any[] = [];
      try {
        const attsRes = await supabase.from('attendants').select('*').order('name');
        if (!attsRes.error) {
          fetchedAttendants = attsRes.data || [];
        } else {
          console.error('Error fetching attendants:', attsRes.error);
        }
      } catch (err) {
        console.error('Failed to query attendants table:', err);
      }

      const attendantsWithRole = fetchedAttendants.map(att => ({ ...att, role: 'attendant' as const }));
      setAttendants(attendantsWithRole);

      const savedAttId = localStorage.getItem('clinic_active_attendant_id');
      if (attendantsWithRole.length > 0 && (!savedAttId || !attendantsWithRole.some(a => a.id === savedAttId))) {
        const firstId = attendantsWithRole[0].id;
        setActiveAttendantId(firstId);
        localStorage.setItem('clinic_active_attendant_id', firstId);
      } else if (savedAttId) {
        setActiveAttendantId(savedAttId);
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Erro ao conectar com o banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (attendants.length > 0) {
      localStorage.setItem('clinic_cached_attendants', JSON.stringify(attendants));
    }
  }, [attendants]);

  // Synchronize state when session loads or is updated
  useEffect(() => {
    if (session) {
      if (session.role === 'doctor') {
        setRoleState('doctor');
        setActiveDoctorId(session.user.id);
      } else if (session.role === 'attendant') {
        setRoleState('attendant');
        setActiveAttendantId(session.user.id);
      }
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      if (session.role === 'admin') {
        setUser({ id: 'admin', name: 'Administrador', role: 'admin' as any });
        return;
      }
      if (session.role === 'doctor' && doctors.length > 0) {
        const freshDoc = doctors.find(d => d.id === session.user.id);
        if (freshDoc) {
          setUser(freshDoc);
          return;
        }
      } else if (session.role === 'attendant' && attendants.length > 0) {
        const freshAtt = attendants.find(a => a.id === session.user.id);
        if (freshAtt) {
          setUser(freshAtt);
          return;
        }
      } else if (session.role === 'patient' && patients.length > 0) {
        const freshPat = patients.find(p => p.id === session.user.id);
        if (freshPat) {
          setUser({ ...freshPat, role: 'patient' as any });
          return;
        }
      }
    }

    if (role === 'doctor') {
      if (doctors.length > 0) {
        const doc = doctors.find(d => d.id === activeDoctorId) || doctors[0];
        setUser(doc);
      } else {
        setUser(null);
      }
    } else {
      if (attendants.length > 0) {
        const att = attendants.find(a => a.id === activeAttendantId) || attendants[0];
        setUser(att);
      } else {
        setUser(null);
      }
    }
  }, [role, activeDoctorId, activeAttendantId, doctors, attendants, session, patients]);

  const setRole = (newRole: UserRole) => {
    if (session && session.role !== 'admin') {
      toast.error('Operação restrita para administradores.');
      return;
    }
    setRoleState(newRole);
    localStorage.setItem('clinic_role', newRole);
  };

  const switchDoctor = (id: string) => {
    if (session && session.role !== 'admin') {
      toast.error('Operação restrita para administradores.');
      return;
    }
    setActiveDoctorId(id);
    localStorage.setItem('clinic_active_doctor_id', id);
  };

  const addDoctor = async (newDoc: Omit<Profile, 'id' | 'role' | 'created_at'>) => {
    try {
      // Validação básica antes de enviar
      if (!newDoc.specialty_id) {
        throw new Error('Por favor, selecione uma especialidade.');
      }

      const generatedPassword = generateRandomPassword();

      const { data, error } = await supabase
        .from('doctors')
        .insert([{
          name: newDoc.name,
          email: newDoc.email,
          crm: newDoc.crm,
          phone: newDoc.phone,
          specialty_id: newDoc.specialty_id,
          cpf: newDoc.cpf || null,
          password: generatedPassword
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro Supabase (Médicos):', error);
        throw error;
      }

      const doctorWithRole = { ...data, role: 'doctor' as const };
      setDoctors(prev => [...prev, doctorWithRole]);
      
      // Save default availability to DB for the new doctor
      const defaultAvail = getDefaultAvailability();
      const insertAvail = defaultAvail.map(d => ({
        doctor_id: data.id,
        day_of_week: d.day,
        active: d.active,
        slots: d.slots
      }));

      await supabase.from('doctor_availability').insert(insertAvail);
      
      setAvailabilities(prev => ({ ...prev, [data.id]: defaultAvail }));
      
      toast.success('Médico cadastrado com sucesso!');
      switchDoctor(data.id);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error adding doctor:', error);
      const friendlyMsg = formatDatabaseError(error, 'doctor');
      toast.error(`Erro: ${friendlyMsg}`);
      throw error;
    }
  };

  const updateDoctor = async (id: string, updates: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setDoctors(prev => prev.map(doc => doc.id === id ? { ...doc, ...updates } : doc));
      toast.success('Informações do médico atualizadas!');
    } catch (error: any) {
      console.error('Error updating doctor:', error);
      const friendlyMsg = formatDatabaseError(error, 'doctor');
      toast.error(`Erro ao atualizar médico: ${friendlyMsg}`);
      throw error;
    }
  };

  const removeDoctor = async (id: string) => {
    try {
      // 1. Remove associated availability
      const { error: availErr } = await supabase.from('doctor_availability').delete().eq('doctor_id', id);
      if (availErr) {
        console.warn('Could not delete doctor availability in database:', availErr);
      }
      
      // 2. Remove associated exceptions
      const { error: exceptErr } = await supabase.from('doctor_exceptions').delete().eq('doctor_id', id);
      if (exceptErr) {
        console.warn('Could not delete doctor exceptions in database:', exceptErr);
      }
      
      // 3. Remove associated appointments
      const { error: apptErr } = await supabase.from('appointments').delete().eq('doctor_id', id);
      if (apptErr) {
        console.warn('Could not delete appointments in database:', apptErr);
      }

      // 4. Finally remove the doctor from the db table
      const { error } = await supabase.from('doctors').delete().eq('id', id);
      if (error) throw error;

      // Update state safely and synchronously inside setter
      setDoctors(prev => {
        const remaining = prev.filter(doc => doc.id !== id);
        
        if (activeDoctorId === id) {
          if (remaining.length > 0) {
            const nextActive = remaining[0].id;
            setActiveDoctorId(nextActive);
            localStorage.setItem('clinic_active_doctor_id', nextActive);
          } else {
            setActiveDoctorId('');
            localStorage.removeItem('clinic_active_doctor_id');
          }
        }
        return remaining;
      });

      toast.success('Médico removido diretamente do banco de dados.');
    } catch (error: any) {
      console.error('Error removing doctor from database:', error);
      toast.error(`Erro ao excluir médico do banco de dados: ${error.message || error}`);
      throw error;
    }
  };

  const switchAttendant = (id: string) => {
    if (session && session.role !== 'admin') {
      toast.error('Operação restrita para administradores.');
      return;
    }
    setActiveAttendantId(id);
    localStorage.setItem('clinic_active_attendant_id', id);
  };

  const addAttendant = async (newAtt: Omit<Profile, 'id' | 'role' | 'created_at'>) => {
    try {
      const generatedPassword = generateRandomPassword();
      const { data, error } = await supabase
        .from('attendants')
        .insert([{
          name: newAtt.name,
          email: newAtt.email,
          phone: newAtt.phone,
          cpf: newAtt.cpf,
          password: generatedPassword
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro Supabase (Atendentes):', error);
        throw error;
      }

      const attendantWithRole = { ...data, role: 'attendant' as const };
      setAttendants(prev => [...prev, attendantWithRole]);
      
      toast.success('Atendente cadastrado com sucesso!');
      switchAttendant(data.id);
    } catch (error: any) {
      console.error('Error adding attendant:', error);
      const friendlyMsg = formatDatabaseError(error, 'attendant');
      toast.error(`Erro: ${friendlyMsg}`);
      throw error;
    }
  };

  const updateAttendant = async (id: string, updates: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('attendants')
        .update({
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          cpf: updates.cpf,
        })
        .eq('id', id);

      if (error) throw error;

      setAttendants(prev => prev.map(att => att.id === id ? { ...att, ...updates } : att));
      toast.success('Informações do atendente atualizadas!');
    } catch (error: any) {
      console.error('Error updating attendant:', error);
      const friendlyMsg = formatDatabaseError(error, 'attendant');
      toast.error(`Erro ao atualizar atendente: ${friendlyMsg}`);
      throw error;
    }
  };

  const removeAttendant = async (id: string) => {
    try {
      const { error } = await supabase.from('attendants').delete().eq('id', id);
      if (error) throw error;

      setAttendants(prev => {
        const remaining = prev.filter(att => att.id !== id);
        
        // Save the updated list to localStorage right away!
        localStorage.setItem('clinic_cached_attendants', JSON.stringify(remaining));

        if (activeAttendantId === id) {
          if (remaining.length > 0) {
            const nextActive = remaining[0].id;
            setActiveAttendantId(nextActive);
            localStorage.setItem('clinic_active_attendant_id', nextActive);
          } else {
            setActiveAttendantId('');
            localStorage.removeItem('clinic_active_attendant_id');
          }
        }
        return remaining;
      });

      toast.success('Atendente removido diretamente do banco de dados.');
    } catch (error: any) {
      console.error('Error removing attendant from database:', error);
      toast.error(`Erro ao excluir atendente do banco de dados: ${error.message || error}`);
      throw error;
    }
  };

  const addPatient = async (newPatient: any) => {
    try {
      const generatedPassword = generateRandomPassword();
      const patientData = { ...newPatient, password: generatedPassword };
      const { data, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();

      if (error) throw error;

      setPatients(prev => [...prev, data]);
      toast.success('Paciente cadastrado com sucesso!');
    } catch (error: any) {
      console.error('Error adding patient:', error);
      const friendlyMsg = formatDatabaseError(error, 'patient');
      toast.error(`Erro: ${friendlyMsg}`);
      throw error;
    }
  };

  const updatePatient = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      toast.success('Dados do paciente atualizados!');
    } catch (error: any) {
      console.error('Error updating patient:', error);
      const friendlyMsg = formatDatabaseError(error, 'patient');
      toast.error(`Erro ao atualizar paciente: ${friendlyMsg}`);
      throw error;
    }
  };

  const removePatient = async (id: string) => {
    try {
      // 1. Remove associated appointments first
      const { error: apptErr } = await supabase.from('appointments').delete().eq('patient_id', id);
      if (apptErr) throw apptErr;

      // 2. Remove the patient
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;

      setPatients(prev => prev.filter(p => p.id !== id));
      toast.success('Paciente e consultas removidos diretamente do banco de dados.');
    } catch (error: any) {
      console.error('Error removing patient from database:', error);
      toast.error(`Erro ao excluir paciente do banco de dados: ${error.message || error}`);
      throw error;
    }
  };

  const removeAppointment = async (id: string) => {
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      toast.success('Agendamento removido.');
    } catch (error: any) {
      console.error('Error removing appointment:', error);
      toast.error('Erro ao remover agendamento.');
    }
  };

  const updateAvailability = async (doctorId: string, availability: any[]) => {
    try {
      const upsertData = availability.map(day => ({
        doctor_id: doctorId,
        day_of_week: day.day,
        active: day.active,
        slots: day.slots
      }));

      const { error } = await supabase
        .from('doctor_availability')
        .upsert(upsertData, { onConflict: 'doctor_id,day_of_week' });

      if (error) throw error;

      setAvailabilities(prev => ({ ...prev, [doctorId]: availability }));
      // toast is now called in the page
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast.error('Erro ao salvar disponibilidade no banco.');
      throw error;
    }
  };

  const addException = async (doctorId: string, exception: { date: string; reason: string }) => {
    try {
      const { data, error } = await supabase
        .from('doctor_exceptions')
        .insert([{ doctor_id: doctorId, date: exception.date, reason: exception.reason }])
        .select()
        .single();

      if (error) throw error;

      setExceptions(prev => ({
        ...prev,
        [doctorId]: [...(prev[doctorId] || []), data].sort((a, b) => a.date.localeCompare(b.date))
      }));
      toast.success('Bloqueio adicionado com sucesso!');
    } catch (error: any) {
      console.error('Error adding exception:', error);
      toast.error('Erro ao adicionar bloqueio.');
    }
  };

  const removeException = async (exceptionId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_exceptions')
        .delete()
        .eq('id', exceptionId);

      if (error) throw error;

      setExceptions(prev => {
        const newState = { ...prev };
        for (const docId in newState) {
          newState[docId] = newState[docId].filter(e => e.id !== exceptionId);
        }
        return newState;
      });
      toast.success('Bloqueio removido.');
    } catch (error: any) {
      console.error('Error removing exception:', error);
      toast.error('Erro ao remover bloqueio.');
    }
  };

  const removeSpecialty = async (id: string) => {
    try {
      // First, remove the relation from any doctors in the database
      const { error: updateDocError } = await supabase
        .from('doctors')
        .update({ specialty_id: null })
        .eq('specialty_id', id);

      if (updateDocError) {
        console.error('Error unlinking doctors from specialty:', updateDocError);
      }

      const { error } = await supabase
        .from('specialties')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setSpecialties(prev => prev.filter(spec => spec.id !== id));
      setDoctors(prev => prev.map(doc => doc.specialty_id === id ? { ...doc, specialty_id: null } : doc));
      toast.success('Especialidade excluída com sucesso.');
    } catch (error: any) {
      console.error('Error removing specialty:', error);
      toast.error(error.message || 'Erro ao excluir especialidade.');
      throw error;
    }
  };

  const login = async (loginInput: string, passwordInput: string, type: 'staff' | 'patient'): Promise<boolean> => {
    const input = loginInput.trim().toLowerCase();
    const password = passwordInput.trim();

    // 1. Check Administrator (both staff or patient are ok)
    if (input === 'admin' && password === 'admin123') {
      const adminUser = { id: 'admin', name: 'Administrador' };
      // Cria token de login criptografado seguro e device-bound
      const token = createSecureToken('admin', 'admin', adminUser);
      localStorage.setItem('clinic_saved_session', token);
      
      setSession({
        role: 'admin',
        user: adminUser
      });
      toast.success('Login bem-sucedido como Administrador!');
      return true;
    }

    if (type === 'staff') {
      // 2. Check Doctors
      const foundDoctor = doctors.find(doc => {
        const docCpf = doc.cpf ? doc.cpf.replace(/\D/g, '') : '';
        const inputCpf = input.replace(/\D/g, '');
        const isCpfMatch = inputCpf !== '' && docCpf === inputCpf;
        const isEmailMatch = doc.email?.toLowerCase() === input;
        return (isCpfMatch || isEmailMatch) && doc.password === password;
      });

      if (foundDoctor) {
        // Strip out the password property before creating the session token / local state
        const safeDoctor = { ...foundDoctor };
        delete safeDoctor.password;

        const token = createSecureToken(foundDoctor.id, 'doctor', safeDoctor);
        localStorage.setItem('clinic_saved_session', token);

        setSession({
          role: 'doctor',
          user: safeDoctor
        });
        setRoleState('doctor');
        setActiveDoctorId(foundDoctor.id);
        localStorage.setItem('clinic_active_doctor_id', foundDoctor.id);
        toast.success(`Bem-vindo, Dr(a). ${foundDoctor.name}!`);
        return true;
      }

      // 3. Check Attendants
      const foundAttendant = attendants.find(att => {
        const attCpf = att.cpf ? att.cpf.replace(/\D/g, '') : '';
        const inputCpf = input.replace(/\D/g, '');
        const isCpfMatch = inputCpf !== '' && attCpf === inputCpf;
        const isEmailMatch = att.email?.toLowerCase() === input;
        return (isCpfMatch || isEmailMatch) && att.password === password;
      });

      if (foundAttendant) {
        const safeAttendant = { ...foundAttendant };
        delete safeAttendant.password;

        const token = createSecureToken(foundAttendant.id, 'attendant', safeAttendant);
        localStorage.setItem('clinic_saved_session', token);

        setSession({
          role: 'attendant',
          user: safeAttendant
        });
        setRoleState('attendant');
        setActiveAttendantId(foundAttendant.id);
        localStorage.setItem('clinic_active_attendant_id', foundAttendant.id);
        toast.success(`Bem-vindo, ${foundAttendant.name}!`);
        return true;
      }
    } else {
      // 4. Check Patients (type === 'patient')
      const foundPatient = patients.find(pat => {
        const patCpf = pat.id ? pat.id.replace(/\D/g, '') : '';
        const inputCpf = input.replace(/\D/g, '');
        const isCpfMatch = inputCpf !== '' && patCpf === inputCpf;
        const isEmailMatch = pat.email?.toLowerCase() === input;
        return (isCpfMatch || isEmailMatch) && pat.password === password;
      });

      if (foundPatient) {
        const safePatient = { ...foundPatient };
        delete safePatient.password;

        const token = createSecureToken(foundPatient.id, 'patient', safePatient);
        localStorage.setItem('clinic_saved_session', token);

        setSession({
          role: 'patient',
          user: safePatient
        });
        toast.success(`Bem-vindo(a), ${foundPatient.name}!`);
        return true;
      }
    }

    toast.error('Usuário ou senha incorretos.');
    return false;
  };

  const logout = () => {
    setSession(null);
    setOriginalAdminSession(null);
    localStorage.removeItem('clinic_saved_session');
    localStorage.removeItem('clinic_original_admin_session');
    // Remove todos os tokens, rascunhos de formulários e valores temporários de inputs locais sob o logout
    clearAllDrafts();
    toast.success('Sessão encerrada com sucesso.');
  };

  const impersonate = (targetRole: 'doctor' | 'attendant' | 'patient', targetId: string) => {
    let adminSess = originalAdminSession;
    if (!adminSess) {
      adminSess = session;
      setOriginalAdminSession(adminSess);
      localStorage.setItem('clinic_original_admin_session', JSON.stringify(adminSess));
    }

    if (targetRole === 'doctor') {
      const doc = doctors.find(d => d.id === targetId);
      if (doc) {
        const simulatedSession: Session = { role: 'doctor', user: doc };
        setSession(simulatedSession);
        setRoleState('doctor');
        setActiveDoctorId(doc.id);
        localStorage.setItem('clinic_active_doctor_id', doc.id);
        toast.success(`Navegando como Médico: ${doc.name}`);
      } else {
        toast.error('Médico não encontrado.');
      }
    } else if (targetRole === 'attendant') {
      const att = attendants.find(a => a.id === targetId);
      if (att) {
        const simulatedSession: Session = { role: 'attendant', user: att };
        setSession(simulatedSession);
        setRoleState('attendant');
        setActiveAttendantId(att.id);
        localStorage.setItem('clinic_active_attendant_id', att.id);
        toast.success(`Navegando como Atendente: ${att.name}`);
      } else {
        toast.error('Atendente não encontrado.');
      }
    } else if (targetRole === 'patient') {
      const pat = patients.find(p => p.id === targetId);
      if (pat) {
        const simulatedSession: Session = { role: 'patient', user: pat };
        setSession(simulatedSession);
        toast.success(`Navegando como Paciente: ${pat.name}`);
      } else {
        toast.error('Paciente não encontrado.');
      }
    }
  };

  const stopImpersonating = () => {
    if (originalAdminSession) {
      setSession(originalAdminSession);
      setOriginalAdminSession(null);
      localStorage.removeItem('clinic_original_admin_session');
      toast.success('Retornou ao Painel do Administrador!');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      setRole, 
      isLoading,
      doctors,
      specialties,
      removeSpecialty,
      activeDoctorId,
      switchDoctor,
      addDoctor,
      updateDoctor,
      removeDoctor,
      attendants,
      activeAttendantId,
      switchAttendant,
      addAttendant,
      updateAttendant,
      removeAttendant,
      patients,
      addPatient,
      updatePatient,
      removePatient,
      removeAppointment,
      availabilities,
      exceptions,
      updateAvailability,
      addException,
      removeException,
      refreshData: fetchInitialData,
      isFullScreen,
      setIsFullScreen,
      session,
      login,
      logout,
      theme,
      toggleTheme,
      originalAdminSession,
      impersonate,
      stopImpersonating
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
