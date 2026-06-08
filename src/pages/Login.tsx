import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { User, ShieldCheck, Mail, Lock, KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function Login({ onBack, defaultTab }: { onBack?: () => void; defaultTab?: 'staff' | 'patient'; }) {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'staff' | 'patient'>(defaultTab || 'staff');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const maskCPF = (value: string) => {
    // If it's email, don't mask
    if (value.includes('@') || /[a-zA-Z]/.test(value)) return value;
    
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
      .slice(0, 14);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIdentifier(maskCPF(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;

    setLoading(true);
    try {
      await login(identifier, password, activeTab);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-white dark:bg-[#0b1319] grid grid-cols-1 md:grid-cols-2 select-none transition-colors">
      
      {/* Coluna Esquerda: Formulário e Logo */}
      <div className="flex flex-col justify-center h-full max-h-full px-6 py-8 sm:px-12 md:px-16 lg:px-20 relative z-10 w-full max-w-xl mx-auto md:max-w-none overflow-hidden">
        
        <div className="space-y-5 md:space-y-6 w-full max-w-md mx-auto md:mx-0 my-auto">
          
          {/* Logo e Títulos */}
          <div>
            <div className="flex items-baseline justify-start select-none">
              <span className="font-display font-black text-3xl md:text-4xl tracking-tight text-[#028090] leading-none">Vida</span>
              <span className="font-display font-normal text-3xl md:text-4xl tracking-tight text-[#2D3748] dark:text-gray-100 leading-none ml-1">Plena</span>
              <span className="font-display font-black text-3xl md:text-4xl tracking-tight text-[#FF6B35] leading-none">.</span>
            </div>
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.55">Sistema Integrado de Gestão</p>
          </div>

          {/* Subtítulos */}
          <div className="space-y-1 pb-3 border-b border-gray-100 dark:border-slate-800">
            {onBack && (
              <button 
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#028090] hover:text-[#00A896] dark:text-[#00c9b6] dark:hover:text-[#5cecdb] transition-colors mb-1.5 cursor-pointer focus:outline-none uppercase tracking-wider"
                title="Voltar para a Página Inicial"
                id="login-back-button"
              >
                <ArrowLeft size={12} className="stroke-[2.5]" />
                <span>Voltar</span>
              </button>
            )}
            <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100">Portal de Acesso</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
              {activeTab === 'staff' ? 'Controles Administrativos, Médicos e Atendentes' : 'Acesso ao Portal do Paciente'}
            </p>
          </div>

          {/* Tabs Selector */}
          <div className="grid grid-cols-2 p-1 bg-[#E0F2F1]/60 dark:bg-slate-800/40 rounded-xl w-full">
            <button
              type="button"
              onClick={() => {
                setActiveTab('staff');
                setIdentifier('');
                setPassword('');
              }}
              className={cn(
                "py-2 px-2.5 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === 'staff'
                  ? "bg-white dark:bg-[#0b1319] text-[#028090] dark:text-[#00c9b6] shadow-sm"
                  : "text-[#2D3748]/60 dark:text-slate-400 hover:text-[#028090] dark:hover:text-[#00c9b6] hover:bg-white/30 dark:hover:bg-slate-800/20"
              )}
            >
              <ShieldCheck size={13} className="stroke-[2.5]" />
              Funcionários
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('patient');
                setIdentifier('');
                setPassword('');
              }}
              className={cn(
                "py-2 px-2.5 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === 'patient'
                  ? "bg-white dark:bg-[#0b1319] text-[#028090] dark:text-[#00c9b6] shadow-sm"
                  : "text-[#2D3748]/60 dark:text-slate-400 hover:text-[#028090] dark:hover:text-[#00c9b6] hover:bg-white/30 dark:hover:bg-slate-800/20"
              )}
            >
              <User size={13} className="stroke-[2.5]" />
              Pacientes
            </button>
          </div>

          {/* Formulário Plano (sem card) */}
          <form onSubmit={handleSubmit} className="space-y-3.5 w-full">
            <div className="space-y-1.5">
              <Label htmlFor="login-id" className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {activeTab === 'staff' ? 'CPF, E-mail ou Nome Admin' : 'CPF ou E-mail'}
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={14} />
                </span>
                <Input
                  id="login-id"
                  type="text"
                  required
                  placeholder={activeTab === 'staff' ? "Ex: CPF, E-mail ou 'admin'" : "CPF ou E-mail cadastrado"}
                  value={identifier}
                  onChange={handleInputChange}
                  className="pl-9 h-10 rounded-lg bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-[#00A896] hover:border-slate-300 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-[#0b1319] transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 border-none">
              <Label htmlFor="login-pass" className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Senha
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={14} />
                </span>
                <Input
                  id="login-pass"
                  type="password"
                  required
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 rounded-lg bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-[#00A896] hover:border-slate-300 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-[#0b1319] transition-all outline-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#00A896] hover:bg-[#028090] text-white font-black text-xs rounded-lg transition-all shadow-md shadow-[#00A896]/15 flex items-center justify-center gap-2 mt-2.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <KeyRound size={14} />
                  Entrar no Sistema
                </>
              )}
            </Button>
          </form>

          {/* Rodapé informativo */}
          <div className="pt-1.5">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-bold">
              Seu cadastro é realizado pelo administrador da clínica. As senhas são geradas de forma randômica e confidencial no sistema.
            </p>
          </div>

        </div>
      </div>

      {/* Coluna Direita: Imagem Ocupando 50% */}
      <div className="hidden md:block relative h-full w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
          alt="Clínica Vida Plena" 
          className="w-full h-full object-cover select-none pointer-events-none"
          referrerPolicy="no-referrer"
        />
        {/* Overlay translúcido */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#028090]/80 via-transparent to-[#028090]/10 pointer-events-none" />
      </div>

    </div>
  );
}
