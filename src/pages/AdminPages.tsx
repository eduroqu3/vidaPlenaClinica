import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/lib/utils';
import { 
  Users, 
  UserPlus, 
  Stethoscope, 
  TrendingUp, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  Settings, 
  Mail, 
  Phone, 
  Briefcase, 
  HeartHandshake, 
  Grid, 
  Trash, 
  RefreshCw, 
  Check, 
  Building, 
  MapPin, 
  Eye, 
  HelpCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, addDays } from 'date-fns';
import { parseYYYYMMDD } from '@/src/lib/date-utils';

// Helper masks
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .substring(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .substring(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .substring(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

// ==========================================
// 1. ADMIN DASHBOARD
// ==========================================
export const AdminDashboard = () => {
  const { doctors, attendants, patients } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAttendants: 0,
    totalAppointments: 0,
    occupancyRate: '0%',
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [latestRegistrations, setLatestRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setIsLoading(true);
        const today = format(new Date(), 'yyyy-MM-dd');

        // Fetch counts
        const [patientsCount, appsRes] = await Promise.all([
          supabase.from('patients').select('id', { count: 'exact' }),
          supabase.from('appointments').select('*')
        ]);

        const allAppointments = appsRes.data || [];
        const todayApps = allAppointments.filter(app => app.date === today);

        const pats = patientsCount.count || patients.length;
        const docs = doctors.length;
        const atts = attendants.length;

        setStats({
          totalPatients: pats,
          totalDoctors: docs,
          totalAttendants: atts,
          totalAppointments: allAppointments.length,
          occupancyRate: docs > 0 ? `${Math.round((todayApps.length / (docs * 8)) * 100)}%` : '0%'
        });

        // 7-day trend
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
        const chartMap: Record<string, number> = {};
        for (let i = 0; i < 7; i++) {
          const d = addDays(new Date(), -6 + i);
          chartMap[format(d, 'yyyy-MM-dd')] = 0;
        }

        allAppointments.forEach(app => {
          if (chartMap[app.date] !== undefined) {
            chartMap[app.date]++;
          }
        });

        const formattedChartData = Object.entries(chartMap).map(([dateStr, count]) => ({
          name: days[parseYYYYMMDD(dateStr).getDay()],
          consultas: count
        }));

        setChartData(formattedChartData);

        // Fetch latest patients registered
        const { data: recentPats } = await supabase
          .from('patients')
          .select('*')
          .order('id', { ascending: false })
          .limit(4);

        setLatestRegistrations(recentPats || []);
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminStats();
  }, [doctors, attendants, patients]);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Painel Geral do Administrador</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Supervisão técnica, indicadores chave e gestão de recursos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-[#111c24] rounded-2xl shadow-sm hover:shadow transition-all border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-[#00A896]">
              <Users size={22} className="stroke-[2.5]" />
            </div>
            <Badge variant="outline" className="text-[9px] font-black uppercase border-emerald-200 text-[#00A896]">Total</Badge>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pacientes Cadastrados</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.totalPatients}</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-[#111c24] rounded-2xl shadow-sm hover:shadow transition-all border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Stethoscope size={22} className="stroke-[2.5]" />
            </div>
            <Badge variant="outline" className="text-[9px] font-black uppercase border-emerald-200 text-emerald-600">Equipe</Badge>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Médicos Ativos</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.totalDoctors}</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-[#111c24] rounded-2xl shadow-sm hover:shadow transition-all border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Briefcase size={22} className="stroke-[2.5]" />
            </div>
            <Badge variant="outline" className="text-[9px] font-black uppercase border-amber-200 text-amber-600">Atendimento</Badge>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recepcionistas/Atendentes</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.totalAttendants}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Graph and Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-[#111c24] rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Volume de Consultas na Clínica (Últimos 7 dias)</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-450">Estatísticas acumuladas de agendamentos de todos os médicos</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAdminCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A896" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#00A896" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
                <Area type="monotone" dataKey="consultas" stroke="#028090" strokeWidth={3} fillOpacity={1} fill="url(#colorAdminCons)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-[#111c24] rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Cadastros Recentes</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-450">Últimos pacientes adicionados no sistema</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {latestRegistrations.length > 0 ? (
                latestRegistrations.map((pat, i) => (
                  <div key={pat.id || i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[#028090] font-black text-xs uppercase shadow-sm">
                        {pat.name ? pat.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'PA'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{pat.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{pat.id ? maskCPF(pat.id) : '—'}</p>
                      </div>
                    </div>
                    {pat.phone && (
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-100 dark:bg-slate-850 px-2 py-1 rounded-lg">
                        {maskPhone(pat.phone)}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  Nenhum cadastro recente disponível.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


// ==========================================
// 2. GESTÃO DE FUNCIONÁRIOS (CRUD COMPLETO)
// ==========================================
export const AdminStaffManage = () => {
  const { 
    doctors, 
    attendants, 
    specialties, 
    addDoctor, 
    updateDoctor, 
    removeDoctor, 
    addAttendant, 
    updateAttendant, 
    removeAttendant,
    refreshData 
  } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'all' | 'doctor' | 'attendant'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  
  // Custom permissions state for assignment demonstration
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'view_schedule', 'manage_patients'
  ]);

  // Form values
  const [profile, setProfile] = useState<'doctor' | 'attendant'>('doctor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [crm, setCrm] = useState('');
  const [phone, setPhone] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');

  // Selected Doctor for Availability schedule visualization
  const [selectedDoctorForAvail, setSelectedDoctorForAvail] = useState<any>(null);
  const [deletingStaff, setDeletingStaff] = useState<any>(null);

  // Filter staff lists
  const filteredDoctors = doctors.map(d => ({ ...d, staffType: 'doctor' })).filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.cpf && d.cpf.includes(searchTerm))
  );

  const filteredAttendants = attendants.map(a => ({ ...a, staffType: 'attendant' })).filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.cpf && a.cpf.includes(searchTerm))
  );

  const mergedStaff = [
    ...(activeFilter === 'all' || activeFilter === 'doctor' ? filteredDoctors : []),
    ...(activeFilter === 'all' || activeFilter === 'attendant' ? filteredAttendants : [])
  ];

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setProfile('doctor');
    setName('');
    setEmail('');
    setCpf('');
    setCrm('');
    setPhone('');
    setSpecialtyId(specialties[0]?.id || '');
    setSelectedPermissions(['view_schedule', 'manage_patients']);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (staff: any) => {
    setEditingStaff(staff);
    setProfile(staff.staffType || (staff.crm ? 'doctor' : 'attendant'));
    setName(staff.name || '');
    setEmail(staff.email || '');
    setCpf(staff.cpf || '');
    setCrm(staff.crm || '');
    setPhone(staff.phone || '');
    setSpecialtyId(staff.specialty_id || '');
    setSelectedPermissions(
      staff.crm 
        ? ['view_schedule', 'clinical_notes', 'manage_patients'] 
        : ['view_schedule', 'schedule_appt', 'manage_patients']
    );
    setIsFormOpen(true);
  };

  const handleTogglePermission = (slug: string) => {
    setSelectedPermissions(prev => 
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      toast.error('CPF inválido. Deve conter exactamente 11 números.');
      return;
    }

    try {
      if (editingStaff) {
        // Mode UPDATE
        if (profile === 'doctor') {
          await updateDoctor(editingStaff.id, {
            name,
            email,
            crm,
            phone,
            specialty_id: specialtyId,
            cpf
          });
        } else {
          await updateAttendant(editingStaff.id, {
            name,
            email,
            phone,
            cpf
          });
        }
      } else {
        // Mode INSERT
        if (profile === 'doctor') {
          await addDoctor({
            name,
            email,
            crm,
            phone,
            specialty_id: specialtyId,
            cpf
          });
        } else {
          await addAttendant({
            name,
            email,
            phone,
            cpf
          });
        }
      }
      setIsFormOpen(false);
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (staff: any) => {
    if (!staff) return;
    const isDoc = staff.staffType === 'doctor' || staff.crm;
    try {
      if (isDoc) {
        await removeDoctor(staff.id);
      } else {
        await removeAttendant(staff.id);
      }
      refreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingStaff(null);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Gestão de Funcionários</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Cadastro, controle de credenciais, permissões e disponibilidade do corpo clínico</p>
        </div>
        <Button 
          onClick={handleOpenCreate}
          className="bg-[#00A896] hover:bg-[#028090] text-white font-black text-xs uppercase tracking-wider rounded-xl gap-2 h-10 px-5 transition-all shadow hover:shadow-md shrink-0 cursor-pointer"
        >
          <Plus size={15} className="stroke-[2.5]" />
          Adicionar Funcionário
        </Button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800 w-full sm:w-80 shrink-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              "py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider cursor-pointer",
              activeFilter === 'all' 
                ? "bg-white dark:bg-[#111c24] text-[#028090] dark:text-[#00c9b6] shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
            )}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveFilter('doctor')}
            className={cn(
              "py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider cursor-pointer",
              activeFilter === 'doctor' 
                ? "bg-white dark:bg-[#111c24] text-[#028090] dark:text-[#00c9b6] shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
            )}
          >
            Médicos
          </button>
          <button
            onClick={() => setActiveFilter('attendant')}
            className={cn(
              "py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider cursor-pointer",
              activeFilter === 'attendant' 
                ? "bg-white dark:bg-[#111c24] text-[#028090] dark:text-[#00c9b6] shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
            )}
          >
            Atendentes
          </button>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={14} className="text-slate-400" />
          </span>
          <Input
            placeholder="Buscar nome, CPF ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 rounded-xl border-slate-200/80 bg-white h-10 text-xs text-slate-700 font-medium"
          />
        </div>
      </div>

      {/* Staff lists table */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-[#111c24]">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Perfil</th>
                <th className="px-6 py-4">CPF (Login)</th>
                <th className="px-6 py-4">CRM / Especialidade</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {mergedStaff.length > 0 ? (
                mergedStaff.map((staff, i) => {
                  const isDoc = staff.crm || staff.staffType === 'doctor';
                  return (
                    <tr key={staff.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black uppercase border shadow-sm shrink-0",
                            isDoc ? "bg-teal-50/70 border-teal-100 text-[#028090] dark:bg-teal-950/20 dark:border-teal-900/40 dark:text-[#00c9b6]" : "bg-amber-50/70 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400"
                          )}>
                            {isDoc ? 'DR' : 'RC'}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 dark:text-slate-100">{staff.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">{staff.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={isDoc ? 'default' : 'secondary'} className="text-[9px] px-2 py-0.5 uppercase tracking-widest leading-none font-black">
                          {isDoc ? 'Médico' : 'Recepção'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {staff.cpf ? maskCPF(staff.cpf) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {isDoc ? (
                          <div className="space-y-0.5">
                            <p className="text-slate-800 dark:text-slate-100 font-bold">CRM {staff.crm}</p>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">
                              {specialties.find(s => s.id === staff.specialty_id)?.name || 'Médico'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">
                          {staff.phone ? maskPhone(staff.phone) : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenEdit(staff)}
                            className="h-8 w-8 text-[#028090] hover:bg-teal-50 hover:text-[#00A896] dark:text-[#00c9b6] dark:hover:bg-teal-950/30 rounded-lg cursor-pointer"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setDeletingStaff(staff)}
                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs italic">
                    Nenhum funcionário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL: CADASTRO / EDIÇÃO */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl bg-white text-slate-800 dark:bg-[#111c24] border dark:border-slate-800 font-sans max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">
              {editingStaff ? 'Editar Informações do Funcionário' : 'Novo Funcionário Corporativo'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2 text-slate-750">
            {/* User Profile Selector (Only changeable when Creating) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perfil Assistencial</Label>
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-250/20">
                <button
                  type="button"
                  disabled={!!editingStaff}
                  onClick={() => setProfile('doctor')}
                  className={cn(
                    "py-2 rounded-lg text-xs font-black transition-all uppercase tracking-wider cursor-pointer",
                    profile === 'doctor'
                      ? "bg-white dark:bg-[#111c24] text-[#028090] dark:text-[#00c9b6] shadow-sm"
                      : "text-slate-550 opacity-60"
                  )}
                >
                  Médico Assistente
                </button>
                <button
                  type="button"
                  disabled={!!editingStaff}
                  onClick={() => setProfile('attendant')}
                  className={cn(
                    "py-2 rounded-lg text-xs font-black transition-all uppercase tracking-wider cursor-pointer",
                    profile === 'attendant'
                      ? "bg-white dark:bg-[#111c24] text-[#028090] dark:text-[#00c9b6] shadow-sm"
                      : "text-slate-550 opacity-60"
                  )}
                >
                  Recepcionista / Atendente
                </button>
              </div>
            </div>

            {/* General form fields */}
            <div className="space-y-2">
              <Label htmlFor="staff-name">Nome Completo</Label>
              <Input 
                id="staff-name" 
                placeholder="Ex: Alberto Santos" 
                required 
                value={name}
                onChange={e => setName(e.target.value)}
                className="rounded-xl border-slate-200" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff-cpf">CPF (Será usado como login)</Label>
                <Input 
                  id="staff-cpf" 
                  placeholder="000.000.000-00" 
                  required 
                  value={cpf}
                  onChange={e => setCpf(maskCPF(e.target.value))}
                  className="rounded-xl border-slate-200" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-phone">Telefone</Label>
                <Input 
                  id="staff-phone" 
                  placeholder="(11) 99999-9999" 
                  required 
                  value={phone}
                  onChange={e => setPhone(maskPhone(e.target.value))}
                  className="rounded-xl border-slate-200" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-email">E-mail Corporativo</Label>
              <Input 
                id="staff-email" 
                type="email" 
                placeholder="nome@clinica.com" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="rounded-xl border-slate-200" 
              />
            </div>

            {profile === 'doctor' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-crm">CRM</Label>
                  <Input 
                    id="staff-crm" 
                    placeholder="00000-SP" 
                    required 
                    value={crm}
                    onChange={e => setCrm(e.target.value.toUpperCase())}
                    className="rounded-xl border-slate-200" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-specialty">Especialidade</Label>
                  <select 
                    id="staff-specialty"
                    required
                    value={specialtyId}
                    onChange={e => setSpecialtyId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  >
                    {specialties.map(spec => (
                      <option key={spec.id} value={spec.id}>{spec.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 border-t border-slate-50 dark:border-slate-850 pt-4">
              <Button 
                type="submit" 
                className="w-full bg-[#00A896] hover:bg-[#028090] text-white font-black text-xs uppercase tracking-wider rounded-xl h-11 cursor-pointer shadow hover:shadow-md transition-all"
              >
                {editingStaff ? 'Salvar Alterações' : 'Cadastrar e Concluir'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* VISUALIZAR DISPONIBILIDADE DO MÉDICO NA AGENDA STANDART */}
      <Dialog open={!!selectedDoctorForAvail} onOpenChange={open => !open && setSelectedDoctorForAvail(null)}>
        <DialogContent className="sm:max-w-[480px] bg-white text-slate-800 dark:bg-[#111c24] border dark:border-slate-800 rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase text-slate-900 tracking-wider">
              Disponibilidade Padrão do Médico
            </DialogTitle>
          </DialogHeader>
          
          {selectedDoctorForAvail && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-bold">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{selectedDoctorForAvail.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Disponibilidade de Turnos Semanais</p>
                </div>
              </div>

              {/* Informative text */}
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                As consultas e agendamentos respeitam estas janelas de funcionamento padrão para este profissional na plataforma.
              </p>

              {/* Default weekly hours template */}
              <div className="space-y-2 border border-slate-100 rounded-xl p-3 shadow-inner bg-slate-50/50">
                {[
                  { day: 'Segunda-feira', shift: '08:00 às 18:00 (Completo)' },
                  { day: 'Terça-feira', shift: '08:00 às 18:05 (Completo)' },
                  { day: 'Quarta-feira', shift: '08:00 às 18:00 (Completo)' },
                  { day: 'Quinta-feira', shift: '08:00 às 18:00 (Completo)' },
                  { day: 'Sexta-feira', shift: '08:05 às 17:50 (Completo)' },
                  { day: 'Sábado', shift: 'Somente sob consulta / Plantão' },
                  { day: 'Domingo', shift: 'Fechado' }
                ].map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-1 text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-350">{d.day}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md", 
                      d.shift.includes('Completo') ? "bg-[#E0F2F1] text-[#028090]" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                    )}>
                      {d.shift}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-50 dark:border-slate-850">
                <Button 
                  onClick={() => {
                    setSelectedDoctorForAvail(null);
                    toast.success('Disponibilidade do profissional salva em segurança!');
                  }}
                  className="bg-[#00A896] hover:bg-[#028090] text-white text-xs uppercase tracking-wider font-extrabold px-6 rounded-xl h-10 w-full"
                >
                  Confirmar Escala de Horas
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO DE FUNCIONÁRIO */}
      <Dialog open={!!deletingStaff} onOpenChange={open => !open && setDeletingStaff(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white text-slate-800 dark:bg-[#111c24] border dark:border-slate-800 rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2 text-red-600">
              <ShieldAlert size={18} className="text-red-500 shrink-0" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Tem certeza que deseja remover o(a) {deletingStaff?.staffType === 'doctor' || deletingStaff?.crm ? 'médico(a)' : 'atendente(a)'}{' '}
            <strong className="font-bold text-slate-900 dark:text-white">{deletingStaff?.name}</strong>? Esta ação não pode ser desfeita.
          </div>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeletingStaff(null)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleDelete(deletingStaff)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


// ==========================================
// 3. VISÃO GERAL DE PACIENTES & HIGIENIZAÇÃO/DEDUPLICAÇÃO
// ==========================================
export const AdminPatientsView = () => {
  const { patients, addPatient, updatePatient, removePatient, refreshData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [deletingPatient, setDeletingPatient] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Search filter
  const filteredPatients = patients.filter(p => {
    return p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.id?.includes(searchTerm) || 
           p.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
      refreshData();
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
      refreshData();
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  const handleDeletePatient = async (patient: any) => {
    if (!patient) return;
    try {
      await removePatient(patient.id);
      refreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingPatient(null);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Supervisão de Pacientes</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Monitoramento da base de pacientes, filtros qualificados e higienização cadastral</p>
        </div>
        <Button 
          type="button"
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-[#00A896] hover:bg-[#028090] text-white font-black text-xs uppercase tracking-wider rounded-xl gap-2 h-10 px-5 transition-all shadow-sm cursor-pointer"
        >
          <UserPlus size={15} className="stroke-[2.5]" />
          Adicionar Paciente
        </Button>
      </div>

      {/* Filter and query toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-end">
        <div className="relative w-full sm:max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} className="text-slate-400" />
          </span>
          <Input
            placeholder="Buscar por Nome do Paciente ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 rounded-xl border-slate-205/60 bg-white h-10 text-xs text-slate-700"
          />
        </div>
      </div>

      {/* Patient listings */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-[#111c24]">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                <th className="px-6 py-4">Ficha / Nome</th>
                <th className="px-6 py-4">CPF / Chave</th>
                <th className="px-6 py-4 font-normal">E-mail</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-medium text-slate-750 dark:text-slate-300">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p, i) => (
                  <tr key={p.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 uppercase">
                          {p.name ? p.name.split(' ').map((n: string) => n[0]).join('').substring(0,2) : 'PA'}
                        </div>
                        <p>{p.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">
                      {p.id ? maskCPF(p.id) : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-450">
                      {p.email || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="xs"
                          onClick={() => setEditingPatient(p)}
                          className="h-8 text-[10px] font-black uppercase tracking-wider text-[#028090] hover:bg-[#E0F2F1]/50 cursor-pointer"
                        >
                          <Edit size={12} className="mr-1 stroke-[2.5]" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeletingPatient(p)}
                          className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-xs italic">
                    Nenhum paciente registrado atende aos filtros declarados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL: ADICIONAR PACIENTE */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white text-slate-800 dark:bg-[#111c24] border dark:border-slate-800 rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider">
              Cadastrar Novo Paciente
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPatient} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome Completo</Label>
                <Input id="name" name="name" placeholder="Ex: Maria/João Silva" required className="rounded-xl h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="cpf" className="text-xs font-bold text-slate-700 dark:text-slate-300">CPF</Label>
                <Input 
                  id="cpf" 
                  name="cpf" 
                  placeholder="000.000.000-00" 
                  required 
                  className="rounded-xl h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  onChange={(e) => e.target.value = maskCPF(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="contato@email.com" required className="rounded-xl h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">Telefone</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  placeholder="(11) 99999-9999" 
                  required 
                  className="rounded-xl h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
                  onChange={(e) => e.target.value = maskPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date" className="text-xs font-bold text-slate-700 dark:text-slate-300">Data de Nascimento</Label>
                <Input id="birth_date" name="birth_date" type="date" required className="rounded-xl h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
              </div>
            </div>
            <DialogFooter className="pt-4 flex gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" className="px-4 py-2 bg-[#00A896] hover:bg-[#028090] text-white rounded-xl font-bold">
                Salvar Paciente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR PACIENTE */}
      <Dialog open={!!editingPatient} onOpenChange={(open) => !open && setEditingPatient(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white text-slate-800 dark:bg-[#111c24] border dark:border-slate-800 rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider">
              Editar Dados do Paciente
            </DialogTitle>
          </DialogHeader>
          {editingPatient && (
            <form onSubmit={handleUpdatePatient} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome Completo</Label>
                  <Input id="edit-name" name="name" defaultValue={editingPatient.name} required className="rounded-xl h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-cpf" className="text-xs font-bold text-slate-700 dark:text-slate-300">CPF (Não editável)</Label>
                  <Input 
                    id="edit-cpf" 
                    value={maskCPF(editingPatient.id)} 
                    disabled 
                    className="rounded-xl h-10 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-not-allowed text-slate-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">E-mail</Label>
                <Input id="edit-email" name="email" type="email" defaultValue={editingPatient.email} required className="rounded-xl h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">Telefone</Label>
                  <Input 
                    id="edit-phone" 
                    name="phone" 
                    defaultValue={editingPatient.phone}
                    required 
                    className="rounded-xl h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
                    onChange={(e) => e.target.value = maskPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-birth_date" className="text-xs font-bold text-slate-700 dark:text-slate-300">Data de Nascimento</Label>
                  <Input id="edit-birth_date" name="birth_date" type="date" defaultValue={editingPatient.birth_date} required className="rounded-xl h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                </div>
              </div>
              <DialogFooter className="pt-4 flex gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setEditingPatient(null)} className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" className="px-4 py-2 bg-[#00A896] hover:bg-[#028090] text-white rounded-xl font-bold">
                  Atualizar Paciente
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO DE PACIENTE */}
      <Dialog open={!!deletingPatient} onOpenChange={open => !open && setDeletingPatient(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white text-slate-800 dark:bg-[#111c24] border dark:border-slate-800 rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2 text-red-650">
              <ShieldAlert size={18} className="text-red-500 shrink-0" />
              Confirmar Exclusão
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
              onClick={() => handleDeletePatient(deletingPatient)}
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


// ==========================================
// 4. AGENDA GERAL (CALENDÁRIO MACRO READ-ONLY)
// ==========================================
export const AdminAgendaGeneral = () => {
  const { doctors, specialties } = useAuth();
  const [selectedDocId, setSelectedDocId] = useState('all');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        let query = supabase
          .from('appointments')
          .select('id, status, time, date, daily_sequence, doctor:doctors!appointments_doctor_id_fkey(name, id, specialty_id), patient:patients!appointments_patient_id_fkey(name)');

        const { data, error } = await query;
        if (error) throw error;
        setAppointments(data || []);
      } catch (err) {
        console.error('Error fetching admin agenda:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const filteredAppointments = selectedDocId === 'all'
    ? appointments
    : appointments.filter(app => app.doctor?.id === selectedDocId);

  // Group by date or display next scheduled
  const sortedAppointments = [...filteredAppointments].sort((a,b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Agenda Geral Consolidada</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Supervisão consolidada de todas as consultas e agendamentos da clínica (Apenas Leitura)</p>
        </div>
      </div>

      {/* Specialty or Doctor Filter Selection Bar */}
      <Card className="border-none shadow-sm rounded-2xl bg-white p-5 dark:bg-[#111c24]">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Label className="text-xs font-black text-slate-500 uppercase tracking-widest shrink-0">Visualizar consultas do Médico:</Label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#00A896] dark:bg-slate-900 dark:text-slate-200 flex-1 sm:max-w-md w-full"
          >
            <option value="all">TODOS OS MÉDICOS</option>
            {doctors.map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.name} — ({specialties.find(s => s.id === doc.specialty_id)?.name || 'Médico'})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Calendário visual renderizado em lista macro, com indicador de status */}
      <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest px-1">Calendário Consolidado de Consultas</h3>
      <div className="space-y-4">
        
        {/* Calendar consultations tables/cards */}
        <div className="space-y-4">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-[#111c24]">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Cronograma de Consultas Cadastradas</h4>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedAppointments.length > 0 ? (
                sortedAppointments.map((app, i) => (
                  <div key={app.id || i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/20 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-extrabold text-slate-550 flex-col leading-none">
                        <span className="text-[8px] uppercase font-black text-[#028090]">DATA</span>
                        <span className="text-xs font-black mt-1">{app.date.split('-').reverse()[0]}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {app.daily_sequence && (
                            <span className="text-[9px] font-black text-[#028090] bg-[#E0F2F1]/80 px-1 hover:opacity-90 rounded">
                              AG{app.daily_sequence}
                            </span>
                          )}
                          <p className="font-extrabold text-slate-850 dark:text-slate-100">{app.patient?.name}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">
                          Médico: {app.doctor?.name || 'Dr. Clínico'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center sm:text-right sm:justify-end gap-3 justify-between shrink-0 font-bold">
                      <div className="flex flex-col sm:text-right">
                        <span className="text-slate-800 dark:text-slate-100 flex items-center gap-1 sm:justify-end">
                          <Clock size={11} className="stroke-[2.5]" />
                          {app.time}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">{app.date}</span>
                      </div>
                      
                      <Badge variant={app.status === 'confirmed' ? 'default' : app.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-[9px] px-2 py-0.5 uppercase tracking-wide">
                        {app.status === 'confirmed' ? 'Confirmada' : app.status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center font-medium text-slate-400 text-xs italic">
                  Nenhum registro de consulta encontrado sob este filtro específico.
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};


// ==========================================
// 5. CONFIGURAÇÕES DA CLÍNICA & ESPECIALIDADES
// ==========================================
export const AdminClinicSettings = () => {
  const { specialties, refreshData, removeSpecialty } = useAuth();
  
  // Specialty quick insertion
  const [isSpecDialogOpen, setIsSpecDialogOpen] = useState(false);
  const [newSpecName, setNewSpecName] = useState('');
  const [deletingSpecialty, setDeletingSpecialty] = useState<any>(null);

  const handleAddSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecName) return;

    try {
      const { data, error } = await supabase
        .from('specialties')
        .insert([{
          name: newSpecName
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Nova especialidade cadastrada com sucesso!');
      setNewSpecName('');
      setIsSpecDialogOpen(false);
      refreshData();
    } catch (err: any) {
      toast.error(`Falha ao cadastrar especialidade: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in text-slate-755">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Gestão de Especialidades</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Especialidades médicas disponíveis para o corpo clínico</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Specialties Management block */}
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#111c24] p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Especialidades Ativas</h3>
            <Button 
              onClick={() => setIsSpecDialogOpen(true)}
              className="h-8 bg-emerald-50 hover:bg-emerald-100 text-[#00A896] border-none font-black text-[10px] uppercase rounded-xl transition-all gap-1 cursor-pointer shadow-sm hover:scale-[1.02]"
            >
              <Plus size={12} className="stroke-[2.5]" />
              Nova
            </Button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {specialties.length > 0 ? (
              specialties.map(spec => (
                <div key={spec.id} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors shadow-inner flex items-center justify-between gap-2 dark:border-slate-800 dark:bg-[#0b1319]">
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="text-xs font-extrabold text-[#028090] dark:text-teal-400 truncate">{spec.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setDeletingSpecialty(spec)}
                    className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 rounded-lg cursor-pointer"
                  >
                    <Trash size={12} />
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 italic text-xs">
                Nenhuma especialidade ativa no banco de dados.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* MODAL: ADD SPECIALTY FORM */}
      <Dialog open={isSpecDialogOpen} onOpenChange={setIsSpecDialogOpen}>
        <DialogContent className="sm:max-w-[380px] bg-white text-slate-800 dark:bg-[#111c24] border dark:border-slate-800 rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase text-slate-900 tracking-wider">
              Cadastrar Nova Especialidade
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddSpecialty} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sp-name">Nome da Especialidade médica</Label>
              <Input 
                id="sp-name"
                placeholder="Ex: Cardiologia"
                required
                value={newSpecName}
                onChange={e => setNewSpecName(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>

            <DialogFooter className="mt-4 border-t border-slate-50 dark:border-slate-850 pt-3">
              <Button 
                type="submit"
                className="w-full bg-[#00A896] hover:bg-[#028090] text-white font-black text-xs uppercase tracking-wider rounded-xl h-10 cursor-pointer"
              >
                Salvar Especialidade
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO DE ESPECIALIDADE */}
      <Dialog open={!!deletingSpecialty} onOpenChange={open => !open && setDeletingSpecialty(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white text-slate-800 dark:bg-[#111c24] border dark:border-slate-800 rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2 text-red-600">
              <ShieldAlert size={18} className="text-red-500 shrink-0" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
            <p>
              Tem certeza que deseja remover a especialidade{' '}
              <strong className="font-bold text-slate-900 dark:text-white">{deletingSpecialty?.name}</strong>?
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30 font-bold">
              Nota: Os médicos associados a essa especialidade não serão excluídos do sistema; eles apenas serão desvinculados desta especialidade.
            </p>
          </div>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => setDeletingSpecialty(null)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!deletingSpecialty) return;
                try {
                  await removeSpecialty(deletingSpecialty.id);
                  setDeletingSpecialty(null);
                  toast.success(`Especialidade "${deletingSpecialty?.name}" excluída com sucesso!`);
                  refreshData();
                } catch (err: any) {
                  toast.error(`Erro ao excluir especialidade: ${err.message || err}`);
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
