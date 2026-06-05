import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Stethoscope,
  Mail,
  Phone,
  Award
} from 'lucide-react';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { Specialty, Profile } from '@/src/types';

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
    .slice(0, 15);
};

const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskCRM = (value: string) => {
  const cleaned = value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  const numbers = cleaned.replace(/[A-Z]/g, '');
  const letters = cleaned.replace(/[0-9]/g, '').slice(0, 2);
  
  if (letters.length > 0) {
    return `${numbers}-${letters}`;
  }
  return numbers;
};

const DoctorsPage = () => {
  const { doctors, specialties, addDoctor, updateDoctor, removeDoctor, refreshData, isLoading: authLoading, role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Profile | null>(null);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    specialties.find(s => s.id === d.specialty_id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cpf = formData.get('cpf') as string;
    
    try {
      const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '';
      if (cleanCpf.length !== 11) {
        toast.error('CPF inválido. Deve conter 11 números.');
        return;
      }

      await addDoctor({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        crm: formData.get('crm') as string,
        specialty_id: formData.get('specialty_id') as string,
        cpf: cpf,
      });

      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding doctor:', error);
    }
  };

  const handleUpdateDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDoctor) return;
    
    const formData = new FormData(e.currentTarget);
    const cpf = formData.get('cpf') as string;

    try {
      const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '';
      if (cleanCpf.length !== 11) {
        toast.error('CPF inválido. Deve conter 11 números.');
        return;
      }

      await updateDoctor(editingDoctor.id, {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        crm: formData.get('crm') as string,
        specialty_id: formData.get('specialty_id') as string,
        cpf: cpf,
      });
      setEditingDoctor(null);
    } catch (error) {
      console.error('Error updating doctor:', error);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    await removeDoctor(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Médicos</h1>
          <p className="text-slate-500 text-sm">Gerencie o corpo clínico e suas especialidades.</p>
        </div>

        {role === 'doctor' && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger className={cn(buttonVariants({ variant: "default" }), "bg-[#00A896] hover:bg-[#028090] text-white rounded-xl px-6 gap-2 font-bold")}>
              <Plus size={18} />
              Novo Médico
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Médico</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDoctor} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" name="name" placeholder="Ex: Dr. João Silva" required className="rounded-xl" />
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
                  <div className="space-y-2">
                    <Label htmlFor="crm">CRM</Label>
                    <Input 
                      id="crm" 
                      name="crm" 
                      placeholder="00000-UF" 
                      required 
                      className="rounded-xl"
                      onChange={(e) => e.target.value = maskCRM(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty_id">Especialidade</Label>
                    {specialties.length === 0 ? (
                      <div className="text-xs text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-100 flex flex-col gap-1.5">
                        <span>Nenhuma especialidade no banco de dados.</span>
                        <Button 
                          type="button" 
                          onClick={async () => {
                            const toastId = toast.loading("Carregando e cadastrando especialidades padrão...");
                            try {
                              await refreshData();
                              toast.success("Dados recarregados!", { id: toastId });
                            } catch (err) {
                              toast.error("Falha ao recarregar.", { id: toastId });
                            }
                          }} 
                          className="h-7 text-[10px] bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 w-max"
                        >
                          Sincronizar especialidades
                        </Button>
                      </div>
                    ) : (
                      <Select name="specialty_id" required>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialties.map(spec => (
                            <SelectItem key={spec.id} value={spec.id}>{spec.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail Profissional</Label>
                  <Input id="email" name="email" type="email" placeholder="medico@clinica.com" required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    placeholder="(11) 99999-9999" 
                    required 
                    className="rounded-xl"
                    onChange={(e) => e.target.value = maskPhone(e.target.value)}
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full bg-[#00A896] hover:bg-[#028090] text-white rounded-xl font-bold">
                    Salvar Cadastro
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={!!editingDoctor} onOpenChange={(open) => !open && setEditingDoctor(null)}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Editar Médico</DialogTitle>
            </DialogHeader>
            {editingDoctor && (
              <form onSubmit={handleUpdateDoctor} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-name">Nome Completo</Label>
                    <Input id="edit-name" name="name" defaultValue={editingDoctor.name} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-cpf">CPF</Label>
                    <Input 
                      id="edit-cpf" 
                      name="cpf" 
                      defaultValue={editingDoctor.cpf || ''}
                      placeholder="000.000.000-00" 
                      required
                      className="rounded-xl"
                      onChange={(e) => e.target.value = maskCPF(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-crm">CRM</Label>
                    <Input 
                      id="edit-crm" 
                      name="crm" 
                      defaultValue={editingDoctor.crm}
                      required 
                      className="rounded-xl"
                      onChange={(e) => e.target.value = maskCRM(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-specialty">Especialidade</Label>
                    {specialties.length === 0 ? (
                      <div className="text-xs text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-100 flex flex-col gap-1.5">
                        <span>Nenhuma especialidade no banco de dados.</span>
                        <Button 
                          type="button" 
                          onClick={async () => {
                            const toastId = toast.loading("Carregando e cadastrando especialidades padrão...");
                            try {
                              await refreshData();
                              toast.success("Dados recarregados!", { id: toastId });
                            } catch (err) {
                              toast.error("Falha ao recarregar.", { id: toastId });
                            }
                          }} 
                          className="h-7 text-[10px] bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 w-max"
                        >
                          Sincronizar especialidades
                        </Button>
                      </div>
                    ) : (
                      <Select name="specialty_id" defaultValue={editingDoctor.specialty_id}>
                        <SelectTrigger id="edit-specialty" className="rounded-xl">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialties.map(spec => (
                            <SelectItem key={spec.id} value={spec.id}>{spec.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">E-mail Profissional</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editingDoctor.email} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone / WhatsApp</Label>
                  <Input 
                    id="edit-phone" 
                    name="phone" 
                    defaultValue={editingDoctor.phone}
                    required 
                    className="rounded-xl"
                    onChange={(e) => e.target.value = maskPhone(e.target.value)}
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full bg-[#00A896] hover:bg-[#028090] text-white rounded-xl font-bold">
                    Atualizar Cadastro
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
              placeholder="Buscar por nome ou especialidade..." 
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
                <TableHead className="font-bold text-slate-700">Médico</TableHead>
                <TableHead className="font-bold text-slate-700">Especialidade</TableHead>
                <TableHead className="font-bold text-slate-700">CRM</TableHead>
                <TableHead className="font-bold text-slate-700">Contato</TableHead>
                {role === 'doctor' && <TableHead className="text-right font-bold text-slate-700">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.map((doctor) => (
                <TableRow key={doctor.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#E0F2F1] rounded-xl flex items-center justify-center text-[#028090] shadow-sm">
                        <Stethoscope size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{doctor.name}</span>
                        {doctor.cpf && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            CPF: {maskCPF(doctor.cpf)}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-[#E0F2F1] text-[#028090] hover:bg-[#E0F2F1] border-none px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                      {specialties.find(s => s.id === doctor.specialty_id)?.name || 'Geral'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-mono">
                      <Award size={14} className="text-slate-400" />
                      {doctor.crm}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail size={12} />
                        {doctor.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone size={12} />
                        {doctor.phone}
                      </div>
                    </div>
                  </TableCell>
                  {role === 'doctor' && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {confirmDeleteDocId === doctor.id ? (
                          <div className="flex items-center gap-2 bg-red-50 px-2 py-0.5 border border-red-200 rounded-xl">
                            <span className="text-xs font-bold text-red-600">Excluir?</span>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg px-2"
                              onClick={() => {
                                handleDeleteDoctor(doctor.id);
                                setConfirmDeleteDocId(null);
                              }}
                            >
                              Sim
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-slate-200 text-slate-700 rounded-lg px-2 hover:bg-slate-100 bg-white"
                              onClick={() => setConfirmDeleteDocId(null)}
                            >
                              Não
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-[#028090] hover:bg-[#E0F2F1]/50"
                              onClick={() => setEditingDoctor(doctor)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setConfirmDeleteDocId(doctor.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorsPage;
