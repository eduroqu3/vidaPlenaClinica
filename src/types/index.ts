export type UserRole = 'doctor' | 'attendant';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  specialty_id?: string;
  crm?: string;
  phone?: string;
  cpf?: string;
  password?: string;
  created_at: string;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  password?: string;
  created_at: string;
}

export interface Availability {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0-6
  start_time: string; // HH:mm
  end_time: string; // HH:mm
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  daily_sequence?: number; // Sequential number for the day
  is_called?: boolean; // If the appointment is currently being called
  created_at: string;
  doctor?: Profile;
  patient?: Patient;
}

export interface MedicalNote {
  id: string;
  appointment_id: string;
  content: string;
  created_at: string;
}
