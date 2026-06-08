-- =========================================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- CLINICA DE ATENDIMENTOS E CONSULTAS
-- =========================================================================

-- Habilitar a extensão para geração de UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE ESPECIALIDADES MÉDICAS
CREATE TABLE IF NOT EXISTS specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA DE MÉDICOS
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    crm TEXT UNIQUE NOT NULL,
    phone TEXT,
    specialty_id UUID REFERENCES specialties(id) ON DELETE SET NULL,
    cpf TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2b. TABELA DE ATENDENTES
CREATE TABLE IF NOT EXISTS attendants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    cpf TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA DE PACIENTES
-- O id armazena o CPF formatado ou não, que atua como chave primária única
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY, -- CPF do paciente (Chave Primária, obrigatório)
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    birth_date DATE,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA DE CONSULTAS / AGENDAMENTOS
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL, -- Formato 'HH:mm'
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
    notes TEXT, -- Usado para históricos, prontuários ou fila de espera (ex: '[CALLING]')
    daily_sequence INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABELA DE DISPONIBILIDADE SEMANAL DOS MÉDICOS
-- Múltiplas entradas por médico (uma para cada dia da semana se ativo)
CREATE TABLE IF NOT EXISTS doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom')),
    active BOOLEAN DEFAULT true NOT NULL,
    slots JSONB DEFAULT '[]'::jsonb NOT NULL, -- Array de objetos JSON {start: 'HH:mm', end: 'HH:mm'}
    CONSTRAINT unique_doctor_day UNIQUE (doctor_id, day_of_week)
);

-- 6. TABELA DE EXCEÇÕES / BLOQUEIOS DOS MÉDICOS
-- Dias de folga ou feriados agendados onde o médico não atende
CREATE TABLE IF NOT EXISTS doctor_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- CONTROLE DE SEGURANÇA (RLS - ROW LEVEL SECURITY)
-- =========================================================================

-- Opção A: Desativar RLS para desenvolvimento rápido (Sandbox)
-- Caso queira que o app frontend funcione diretamente sem configurar políticas complexas de autenticação,
-- você pode executar as linhas abaixo para desabilitar o RLS de todas as tabelas:

ALTER TABLE specialties DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendants DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_exceptions DISABLE ROW LEVEL SECURITY;

-- Opção B: Caso queira utilizar RLS ativado com política pública permissiva (acesso total anon/auth)
/*
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Livre Especialidades" ON specialties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Livre Médicos" ON doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Livre Pacientes" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Livre Consultas" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Livre Disponibilidade" ON doctor_availability FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Livre Exceções" ON doctor_exceptions FOR ALL USING (true) WITH CHECK (true);
*/

-- =========================================================================
-- SEED DE INCIALIZAÇÃO (ESPECIALIDADES PADRÃO)
-- =========================================================================

INSERT INTO specialties (name) VALUES
    ('Clínica Geral'),
    ('Cardiologia'),
    ('Dermatologia'),
    ('Pediatria'),
    ('Ginecologia'),
    ('Ortopedia'),
    ('Endocrinologia'),
    ('Gastroenterologia'),
    ('Neurologia'),
    ('Psiquiatria')
ON CONFLICT (name) DO NOTHING;
