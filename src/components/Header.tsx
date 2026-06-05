import React from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Search, UserCircle, Menu, LogOut, Sun, Moon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { user, role, logout, theme, toggleTheme } = useAuth();

  return (
    <header className="h-16 md:h-20 bg-white dark:bg-[#111c24] border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden h-9 w-9 rounded-xl text-slate-500 dark:text-slate-400"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </Button>
        <div className="relative hidden md:block w-64 xl:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar..."
            className="w-full bg-slate-50 dark:bg-[#0b1319] border border-transparent dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#00A896]/20 transition-all font-medium focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Toggle de Tema Claro/Escuro */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
        >
          {theme === 'dark' ? (
            <Sun size={19} className="text-amber-500 stroke-[2.5] animate-scale" />
          ) : (
            <Moon size={19} className="text-slate-600 stroke-[2.5]" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 md:gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 p-1 md:p-1.5 rounded-2xl transition-colors cursor-pointer text-left focus:outline-none border-none">
            <div className="text-right hidden sm:block">
              <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">{user?.name}</p>
              <div className="mt-1 flex items-center justify-end gap-1.5">
                <Badge variant={role === 'doctor' ? 'default' : 'secondary'} className="text-[9px] md:text-[10px] h-3.5 md:h-4 px-1.5 uppercase font-black tracking-widest border-none">
                  {role === 'doctor' ? 'Médico' : 'Recepção'}
                </Badge>
              </div>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
              <UserCircle size={32} strokeWidth={1} className="md:w-10 md:h-10" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 bg-white dark:bg-[#111c24] p-2.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 font-sans z-50">
            <div className="px-2 py-1.5">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Conta Ativa</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate mt-0.5" title={user?.name}>
                {user?.name}
              </p>
              <p className="text-[10px] text-[#00A896] font-black uppercase tracking-widest mt-0.5">
                {role === 'doctor' ? 'Médico' : 'Recepção'}
              </p>
            </div>
            <DropdownMenuSeparator className="-mx-2.5 my-2 h-px bg-slate-100 dark:bg-slate-800" />
            <DropdownMenuItem 
              onClick={logout}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-500 focus:text-red-500 focus:bg-red-50/50 dark:focus:bg-red-950/20 cursor-pointer rounded-xl p-2 text-xs font-bold transition-all"
            >
              <LogOut size={13} className="text-slate-400 dark:text-slate-500 group-hover:text-red-500 shrink-0" />
              Sair da Conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
