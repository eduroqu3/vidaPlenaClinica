import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Stethoscope, User, ShieldCheck, Mail, Lock, KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function Login({ onBack, defaultTab }: { onBack?: () => void; defaultTab?: 'staff' | 'patient'; }) {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'staff' | 'patient'>(defaultTab || 'staff');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const LogoIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 shrink-0">
      <path 
        d="M12 21C12 21 4 15.5 4 9.5C4 6.5 6.5 4 9.5 4C11 4 11.5 4.5 12 5.5C12.5 4.5 13 4 14.5 4C17.5 4 20 6.5 20 9.5C20 15.5 12 21 12 21Z" 
        fill="#00A896" 
      />
      <path 
        d="M12 20C12 20 12 6.5 12 5.5M12 9.5C14.5 8 16.5 9 17 11.5M12 13.5C9.5 12 7.5 13 7 15.5" 
        stroke="#ffffff" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
      />
    </svg>
  );

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
    <div className="min-h-screen bg-white dark:bg-[#0b1319] flex items-center justify-center p-4 md:p-8 select-none relative overflow-hidden transition-colors">
      {/* Decorative colored grid pattern in tone E0F2F1 */}
      <div className="absolute inset-0 bg-[radial-gradient(#00a896_0.8px,transparent_0.8px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {onBack && (
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-black text-[#028090] dark:text-[#E0F2F1] uppercase tracking-wider hover:text-[#00A896] transition-colors py-2 px-3.5 rounded-xl bg-[#E0F2F1] dark:bg-[#028090]/20 border border-[#00A896]/15 dark:border-slate-800 hover:shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} className="stroke-[2.5]" />
            Voltar ao Site
          </button>
        )}

        <div className="text-center">
          <div className="inline-flex w-16 h-16 bg-white dark:bg-[#111c24] rounded-2xl items-center justify-center shadow-xl shadow-[#028090]/10 mb-4 animate-fade-in border border-[#E0F2F1] dark:border-slate-800">
            <LogoIcon />
          </div>
          <div className="flex items-baseline justify-center text-center">
            <h1 className="font-extrabold text-3xl tracking-tight leading-none" style={{ color: '#00A896' }}>Vida</h1>
            <h1 className="font-light text-3xl tracking-tight leading-none ml-1 text-[#2D3748] dark:text-slate-300">Plena</h1>
          </div>
          <p className="text-xs font-bold text-[#2D3748]/60 dark:text-slate-400 mt-2 uppercase tracking-widest">Sistema Integrado de Gestão</p>
        </div>

        <Card className="border-[#E0F2F1] dark:border-slate-800 shadow-[0_15px_40px_rgba(2,128,144,0.06)] rounded-3xl bg-white dark:bg-[#111c24] overflow-hidden">
          <CardHeader className="pb-4 pt-6 text-center border-b border-slate-50 dark:border-slate-800">
            {/* Segmented Control / Card Tabs */}
            <div className="grid grid-cols-2 p-1.5 bg-[#E0F2F1] dark:bg-slate-800/40 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('staff');
                  setIdentifier('');
                  setPassword('');
                }}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === 'staff'
                    ? "bg-white dark:bg-[#0b1319] text-[#028090] dark:text-[#00c9b6] shadow-sm"
                    : "text-[#2D3748]/60 dark:text-slate-400 hover:text-[#028090] dark:hover:text-[#00c9b6] hover:bg-white/30 dark:hover:bg-slate-800/20"
                )}
              >
                <ShieldCheck size={14} className="stroke-[2.5]" />
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
                  "py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === 'patient'
                    ? "bg-white dark:bg-[#0b1319] text-[#028090] dark:text-[#00c9b6] shadow-sm"
                    : "text-[#2D3748]/60 dark:text-slate-400 hover:text-[#028090] dark:hover:text-[#00c9b6] hover:bg-white/30 dark:hover:bg-slate-800/20"
                )}
              >
                <User size={14} className="stroke-[2.5]" />
                Pacientes
              </button>
            </div>
            <CardDescription className="text-xs text-[#2D3748]/65 dark:text-slate-400 font-bold uppercase tracking-wider mt-4">
              {activeTab === 'staff' ? 'Controles Administrativos, Médicos e Atendentes' : 'Acesso ao Portal do Paciente'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-id" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {activeTab === 'staff' ? 'CPF, E-mail ou Nome Admin' : 'CPF ou E-mail'}
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </span>
                  <Input
                    id="login-id"
                    type="text"
                    required
                    placeholder={activeTab === 'staff' ? "Ex: CPF, E-mail ou 'admin'" : "CPF ou E-mail cadastrado"}
                    value={identifier}
                    onChange={handleInputChange}
                    className="pl-10 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-[#0b1319] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-[#00A896] hover:border-slate-300 dark:hover:border-slate-700 transition-all focus:ring-4 focus:ring-[#00A896]/10 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-pass" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                  <span>Senha</span>
                  {activeTab === 'staff' && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal normal-case">Dica admin: admin123</span>
                  )}
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </span>
                  <Input
                    id="login-pass"
                    type="password"
                    required
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-[#0b1319] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-[#00A896] hover:border-slate-300 dark:hover:border-slate-700 transition-all focus:ring-4 focus:ring-[#00A896]/10 shadow-inner"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#00A896] hover:bg-[#028090] text-white font-black text-sm rounded-xl transition-all shadow-md shadow-[#00A896]/15 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    Entrar no Sistema
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-2">
              <p className="text-[11px] text-[#2D3748]/55 dark:text-slate-400/60 leading-relaxed font-bold">
                Seu cadastro é realizado pelo administrador da clínica. As senhas são geradas de forma randômica e confidencial no sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
