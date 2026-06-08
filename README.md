# ClinicaMed - Sistema de Gestão Médica

Este é um sistema web completo para gestão de clínicas médicas, desenvolvido com React, Express, Tailwind CSS e Supabase.

## 🚀 Funcionalidades

### Perfil Médico
- **Dashboard**: Visão geral das consultas do dia e indicadores.
- **Minha Agenda**: Calendário interativo para gerenciar atendimentos.
- **Atendimento**: Registro de observações clínicas e finalização de consultas.
- **Histórico**: Acesso aos atendimentos realizados.

### Perfil Atendente (Recepção)
- **Dashboard**: Indicadores operacionais da clínica.
- **Agendamentos**: Marcação, remarcação e cancelamento de consultas.
- **Pacientes**: Cadastro completo e busca de pacientes.
- **Médicos**: Gestão do corpo clínico e especialidades.

## 🛠️ Tecnologias

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Motion.
- **UI Components**: shadcn/ui.
- **Backend**: Express.js (Full-stack architecture).
- **Banco de Dados**: Supabase (PostgreSQL).

## ⚙️ Configuração do Supabase

Para que o sistema funcione com dados reais, você precisa configurar o Supabase:

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No SQL Editor, crie as tabelas seguindo a estrutura definida em `supabase-blueprint.json`.
3. Obtenha sua `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
4. Adicione essas chaves no painel de **Secrets** do AI Studio ou no arquivo `.env`.

```env
VITE_SUPABASE_URL="sua-url-do-supabase"
VITE_SUPABASE_ANON_KEY="sua-chave-anon-do-supabase"
```

## 🔑 Acesso ao Sistema

O sistema não possui tela de login por padrão. Para alternar entre os perfis de **Médico** e **Atendente**, utilize o seletor localizado na parte inferior do menu lateral (Sidebar).

## 📁 Estrutura do Projeto

- `/src/components`: Componentes reutilizáveis da interface.
- `/src/pages`: Páginas principais do sistema.
- `/src/contexts`: Contextos do React (Autenticação simulada).
- `/src/lib`: Utilitários e configuração do Supabase.
- `/server.ts`: Servidor Express com middleware do Vite.

## 📈 Evolução Futura

- Integração com WhatsApp para lembretes automáticos.
- Prontuário eletrônico completo com anexos de exames.
- Módulo financeiro (Faturamento e convênios).
- Autenticação real com Supabase Auth.
