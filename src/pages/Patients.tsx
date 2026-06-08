import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserPlus,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { Patient } from '@/src/types';
import { formatBrazillianDate } from '@/src/lib/date-utils';

const MOCK_PATIENTS = [
  { id: '123.456.789-01', name: 'Ana Costa', email: 'ana.costa@email.com', phone: '(11) 98765-4321', birth_date: '1990-05-15' },
  { id: '234.567.890-12', name: 'João Pereira', email: 'joao.p@email.com', phone: '(11) 91234-5678', birth_date: '1985-10-22' },
  { id: '345.678.901-23', name: 'Carla Souza', email: 'carla.souza@email.com', phone: '(11) 97777-8888', birth_date: '1995-02-10' },
  { id: '456.789.012-34', name: 'Marcos Lima', email: 'marcos.l@email.com', phone: '(11) 96666-5555', birth_date: '1978-12-30' },
  { id: '567.890.123-45', name: 'Beatriz Silva', email: 'bia.silva@email.com', phone: '(11) 95555-4444', birth_date: '2000-08-05' },
];

const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const PatientsPage = () => {
  const navigate = useNavigate();
  const { patients, addPatient, updatePatient, removePatient, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);

  const filteredPatients = patients.filter((p: Patient) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.includes(searchTerm)
  );

  const handleAddPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cpf = formData.get('cpf') as string;
    
    try {
      const cleanCpf = cpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        toast.error('CPF inválido. Deve conter 11 números.');
        return;
      }

      await addPatient({
        id: cleanCpf,
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        birth_date: formData.get('birth_date') as string,
      });

      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  const handleUpdatePatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPatient) return;
    
    const formData = new FormData(e.currentTarget);
    try {
      await updatePatient(editingPatient.id, {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        birth_date: formData.get('birth_date') as string,
      });
      setEditingPatient(null);
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  const handleDeletePatient = async (patient: Patient) => {
    if (!patient) return;
    try {
      await removePatient(patient.id);
    } catch (error) {
      console.error('Error deleting patient:', error);
    } finally {
      setDeletingPatient(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pacientes</h1>
          <p className="text-slate-500 text-sm">Gerencie o cadastro de pacientes da clínica.</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger className={cn(buttonVariants({ variant: "default" }), "bg-[#00A896] hover:bg-[#028090] text-white rounded-xl px-6 gap-2 font-bold")}>
            <UserPlus size={18} />
            Novo Paciente
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddPatient} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" name="name" placeholder="Ex: Maria Silva" required className="rounded-xl" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input 
                    id="cpf" 
                    name="cpf" 
                    placeholder="000.000.000-00" 
                    required 
                    className="rounded-xl"
                    onChange={(e) => e.target.value = maskCPF(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" placeholder="maria@email.com" required className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    placeholder="(11) 99999-9999" 
                    required 
                    className="rounded-xl" 
                    onChange={(e) => e.target.value = maskPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input id="birth_date" name="birth_date" type="date" required className="rounded-xl" />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-[#00A896] hover:bg-[#028090] text-white rounded-xl font-bold">
                  Salvar Paciente
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingPatient} onOpenChange={(open) => !open && setEditingPatient(null)}>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Editar Paciente</DialogTitle>
            </DialogHeader>
            {editingPatient && (
              <form onSubmit={handleUpdatePatient} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-name">Nome Completo</Label>
                    <Input id="edit-name" name="name" defaultValue={editingPatient.name} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-cpf">CPF (Não editável)</Label>
                    <Input 
                      id="edit-cpf" 
                      value={maskCPF(editingPatient.id)} 
                      disabled 
                      className="rounded-xl bg-slate-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">E-mail</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editingPatient.email} required className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Telefone</Label>
                    <Input 
                      id="edit-phone" 
                      name="phone" 
                      defaultValue={editingPatient.phone}
                      required 
                      className="rounded-xl" 
                      onChange={(e) => e.target.value = maskPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-birth_date">Data de Nascimento</Label>
                    <Input id="edit-birth_date" name="birth_date" type="date" defaultValue={editingPatient.birth_date} required className="rounded-xl" />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full bg-[#00A896] hover:bg-[#028090] text-white rounded-xl font-bold">
                    Atualizar Paciente
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Buscar por nome ou e-mail..." 
              className="pl-10 bg-white border-slate-200 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-bold text-slate-700">CPF</TableHead>
                <TableHead className="font-bold text-slate-700">Paciente</TableHead>
                <TableHead className="font-bold text-slate-700">Contato</TableHead>
                <TableHead className="font-bold text-slate-700">Nascimento</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-max">
                        {maskCPF(patient.id)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#E0F2F1] text-[#028090] rounded-full flex items-center justify-center font-black text-sm shadow-inner">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-semibold text-slate-900">{patient.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail size={12} />
                        {patient.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone size={12} />
                        {patient.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CalendarIcon size={14} className="text-slate-400" />
                      {formatBrazillianDate(patient.birth_date)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-[#00A896] hover:bg-[#E0F2F1]/50"
                        title="Ver Histórico"
                        onClick={() => navigate(`/historico?search=${patient.id}`)}
                      >
                        <ClipboardList size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-[#028090] hover:bg-[#E0F2F1]/50"
                        onClick={() => setEditingPatient(patient)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeletingPatient(patient)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPatients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                    Nenhum paciente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO DE PACIENTE (PAGINA PACIENTES) */}
      <Dialog open={!!deletingPatient} onOpenChange={open => !open && setDeletingPatient(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white text-slate-800 dark:bg-[#111c24] border dark:border-slate-800 rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2 text-red-650">
              <ClipboardList size={18} className="text-red-500 shrink-0" />
              Confirmar Exclusão de Paciente
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
            <p>
              Tem certeza que deseja remover o paciente{' '}
              <strong className="font-bold text-slate-900 dark:text-white">{deletingPatient?.name}</strong>?
            </p>
            <p className="text-xs text-red-650 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30 font-bold">
              Atenção: Ao remover o paciente, todas as suas consultas serão excluídas permanentemente do sistema de forma irreversível.
            </p>
          </div>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeletingPatient(null)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleDeletePatient(deletingPatient!)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientsPage;
