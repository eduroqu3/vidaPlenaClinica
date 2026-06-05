import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  UserPlus,
  Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { supabase } from '@/src/lib/supabase';
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseYYYYMMDD } from '@/src/lib/date-utils';

const DoctorDashboard = () => {
  const { user, activeDoctorId } = useAuth();
  const [stats, setStats] = useState({
    today: 0,
    waiting: 0,
    confirmed: 0,
    cancelled: 0
  });
  const [nextPatients, setNextPatients] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!activeDoctorId) return;
      
      try {
        setIsLoading(true);
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Fetch today's appointments for stats
        const { data: todayApps, error: statsError } = await supabase
          .from('appointments')
          .select('status, time, daily_sequence, patient:patients!appointments_patient_id_fkey(name)')
          .eq('doctor_id', activeDoctorId)
          .eq('date', today);

        if (statsError) throw statsError;

        const confirmed = todayApps?.filter(a => a.status === 'confirmed').length || 0;
        const cancelled = todayApps?.filter(a => a.status === 'cancelled').length || 0;
        const scheduled = todayApps?.filter(a => a.status === 'scheduled').length || 0;
        
        setStats({
          today: todayApps?.length || 0,
          waiting: scheduled,
          confirmed: confirmed,
          cancelled: cancelled
        });

        // Next patients
        const sortedApps = todayApps
          ?.filter(a => a.status !== 'cancelled' && a.status !== 'completed')
          .sort((a, b) => a.time.localeCompare(b.time))
          .slice(0, 4) || [];
        
        setNextPatients(sortedApps);

        // Chart data (last 7 days)
        const start = format(addDays(new Date(), -6), 'yyyy-MM-dd');
        const { data: weekApps } = await supabase
          .from('appointments')
          .select('date')
          .eq('doctor_id', activeDoctorId)
          .gte('date', start)
          .lte('date', today);

        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
        const chartMap: Record<string, number> = {};
        
        // Initialize last 6 days + today
        for (let i = 0; i < 7; i++) {
          const d = addDays(new Date(), -6 + i);
          chartMap[format(d, 'yyyy-MM-dd')] = 0;
        }

        weekApps?.forEach(app => {
          if (chartMap[app.date] !== undefined) {
            chartMap[app.date]++;
          }
        });

        const formattedChartData = Object.entries(chartMap).map(([dateStr, count]) => ({
          name: days[parseYYYYMMDD(dateStr).getDay()],
          consultas: count
        }));

        setChartData(formattedChartData);

      } catch (error) {
        console.error('Error fetching doctor dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeDoctorId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900">Bem-vindo, {user?.name}</h2>
        <p className="text-slate-500">Aqui está o resumo dos seus atendimentos para hoje.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Consultas Hoje" value={stats.today} icon={Calendar} color="blue" trend="Total do dia" />
        <StatCard title="Agendadas" value={stats.waiting} icon={Clock} color="amber" trend="Aguardando" />
        <StatCard title="Confirmadas" value={stats.confirmed} icon={CheckCircle2} color="green" trend="Presença confirmada" />
        <StatCard title="Canceladas" value={stats.cancelled} icon={AlertCircle} color="red" trend="Desistências" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-slate-900">Volume de Atendimentos (Últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A896" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#00A896" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="consultas" stroke="#028090" strokeWidth={3} fillOpacity={1} fill="url(#colorConsultas)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900">Próximos Pacientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {nextPatients.length > 0 ? (
                nextPatients.map((app, i) => (
                  <PatientItem 
                    key={i} 
                    name={app.patient?.name || 'Paciente'} 
                    time={app.time} 
                    type="Consulta" 
                    status={app.status} 
                    sequence={app.daily_sequence}
                  />
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Nenhum paciente agendado para hoje.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AttendantDashboard = () => {
  const { doctors } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    newAppointments: 0,
    activeDoctors: 0,
    occupancy: '0%'
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttendantData = async () => {
      try {
        setIsLoading(true);
        const today = format(new Date(), 'yyyy-MM-dd');

        // Stats
        const [patientsRes, appsRes] = await Promise.all([
          supabase.from('patients').select('id', { count: 'exact' }),
          supabase.from('appointments').select('id, status, time, daily_sequence, doctor:doctors!appointments_doctor_id_fkey(name), patient:patients!appointments_patient_id_fkey(name)').eq('date', today)
        ]);

        const totalPatients = patientsRes.count || 0;
        const todayApps = appsRes.data || [];
        
        setStats({
          totalPatients,
          newAppointments: todayApps.length,
          activeDoctors: doctors.length,
          occupancy: doctors.length > 0 ? `${Math.round((todayApps.length / (doctors.length * 10)) * 100)}%` : '0%'
        });

        // Chart Data
        const start = format(addDays(new Date(), -6), 'yyyy-MM-dd');
        const { data: weekApps } = await supabase
          .from('appointments')
          .select('date')
          .gte('date', start)
          .lte('date', today);

        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
        const chartMap: Record<string, number> = {};
        for (let i = 0; i < 7; i++) {
          const d = addDays(new Date(), -6 + i);
          chartMap[format(d, 'yyyy-MM-dd')] = 0;
        }

        weekApps?.forEach(app => {
          if (chartMap[app.date] !== undefined) chartMap[app.date]++;
        });

        const formattedChartData = Object.entries(chartMap).map(([dateStr, count]) => ({
          name: days[parseYYYYMMDD(dateStr).getDay()],
          consultas: count
        }));

        setChartData(formattedChartData);

      } catch (error) {
        console.error('Error fetching attendant dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendantData();
  }, [doctors]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Pacientes" value={stats.totalPatients.toLocaleString()} icon={Users} color="blue" trend="Base total" />
        <StatCard title="Agendamentos Hoje" value={stats.newAppointments} icon={UserPlus} color="indigo" trend="Total geral" />
        <StatCard title="Médicos Ativos" value={stats.activeDoctors} icon={Stethoscope} color="emerald" trend="No corpo clínico" />
        <StatCard title="Taxa de Ocupação" value={stats.occupancy} icon={TrendingUp} color="violet" trend="Média estimada" />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-slate-900">Agendamentos por Dia (Clínica Geral)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="consultas" fill="#00A896" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => {
  const colors: any = {
    blue: "bg-[#E0F2F1] text-[#028090]",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-[#E0F2F1] text-[#00A896]",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-[#E0F2F1] text-[#028090]",
  };

  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-xl", colors[color])}>
            <Icon size={24} />
          </div>
          <span className="text-xs font-medium text-slate-400">{trend}</span>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const PatientItem = ({ name, time, type, status, sequence }: any) => (
  <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-sm">
        {name.split(' ').map((n: string) => n[0]).join('')}
      </div>
      <div>
        <div className="flex items-center gap-2">
          {sequence && (
            <span className="text-[10px] font-black text-[#028090] bg-[#E0F2F1]/80 px-1.5 py-0.5 rounded">
              AG{sequence}
            </span>
          )}
          <p className="text-sm font-bold text-slate-900">{name}</p>
        </div>
        <p className="text-xs text-slate-500">{type}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-bold text-slate-900">{time}</p>
      <Badge variant={status === 'confirmed' ? 'outline' : 'secondary'} className="text-[10px] h-4 px-1 mt-1">
        {status === 'confirmed' ? 'Confirmado' : 'Pendente'}
      </Badge>
    </div>
  </div>
);

const Dashboard = () => {
  const { role } = useAuth();
  return role === 'doctor' ? <DoctorDashboard /> : <AttendantDashboard />;
};

export default Dashboard;
