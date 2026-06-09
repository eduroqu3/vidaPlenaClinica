versão anterior: https://cl-nica-funcional.vercel.app/
ClinicaMed - Sistema de Gestão Médica
Este é um sistema web completo para gestão de clínicas médicas, desenvolvido com React, Express, Tailwind CSS e Supabase.

🛠️ Tecnologias
Frontend: React 19, Vite, Tailwind CSS, Lucide Icons, Motion.
UI Components: shadcn/ui.
Backend: Express.js (Full-stack architecture).
Banco de Dados: Supabase (PostgreSQL).
⚙️ Configuração do Supabase
Para que o sistema funcione com dados reais, você precisa configurar o Supabase:

Crie um projeto no Supabase.
No SQL Editor, crie as tabelas seguindo a estrutura definida em supabase-blueprint.json.
Obtenha sua SUPABASE_URL e SUPABASE_ANON_KEY.
Adicione essas chaves no painel de Secrets do AI Studio ou no arquivo .env.
VITE_SUPABASE_URL="sua-url-do-supabase"
VITE_SUPABASE_ANON_KEY="sua-chave-anon-do-supabase"
📁 Estrutura do Projeto
/src/components: Componentes reutilizáveis da interface.
/src/pages: Páginas principais do sistema.
/src/contexts: Contextos do React (Autenticação simulada).
/src/lib: Utilitários e configuração do Supabase.
/server.ts: Servidor Express com middleware do Vite.
📈 Evolução Futura
Integração com WhatsApp para lembretes automáticos.
Prontuário eletrônico completo com anexos de exames.
Módulo financeiro (Faturamento e convênios).
Autenticação real com Supabase Auth.
