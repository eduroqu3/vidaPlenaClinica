import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Menu, X, CheckCircle2, ArrowRight, 
  Stethoscope, ShieldCheck, Clock, Star, MapPin, 
  Phone, Mail, Calendar, Users, Award, Sun, Moon,
  ChevronLeft, ChevronRight, Brain, Baby, Eye, Dna, Info, CalendarDays,
  ClipboardList, AlertCircle, Clock3, Maximize2, Minimize2, Volume2, VolumeX, Monitor
} from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LandingPageProps {
  onEnterStaff: () => void;
  onEnterPatient: () => void;
}

interface Doctor {
  full_name: string;
  specialty: string;
  crm: string;
  bio?: string;
  image_url?: string;
  availability: string[];
}

const LogoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 shrink-0">
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

export default function LandingPage({ onEnterStaff, onEnterPatient }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [queueAppointments, setQueueAppointments] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [isQueueFullScreen, setIsQueueFullScreen] = useState(false);
  const [playSelectSound, setPlaySelectSound] = useState(true);
  const [lastCalledId, setLastCalledId] = useState<string | null>(null);

  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSubmitted(true);
      // clear status after 4 seconds
      setTimeout(() => {
        setContactSubmitted(false);
      }, 4000);
    }, 1200);
  };

  const playCallChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 523.25; // C5
      osc1.type = 'sine';
      
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 392.00; // G4
      osc2.type = 'sine';
      
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.35);
      gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.45);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
      
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.6);
      osc2.start(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 1.1);
    } catch (err) {
      console.warn('Audio play failed', err);
    }
  };
  
  const { theme, toggleTheme } = useAuth();
  const isDarkMode = theme === 'dark';
  const toggleDarkMode = toggleTheme;

  const fetchTodayAppointments = async () => {
    try {
      setQueueLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('id, notes, daily_sequence, doctor:doctors(name)')
        .eq('date', today)
        .like('notes', '[CALLING]%');

      if (error) throw error;

      // Extract call time and sort
      const processed = (data || []).map(app => {
        const parts = (app.notes || '').split('|');
        const callTime = parts[0].replace('[CALLING]', '');
        const doctorObj = Array.isArray(app.doctor) ? app.doctor[0] : app.doctor;
        return {
          ...app,
          doctor_name: doctorObj?.name || 'Médico',
          call_timestamp: new Date(callTime).getTime()
        };
      }).sort((a, b) => b.call_timestamp - a.call_timestamp);

      setQueueAppointments(processed);
    } catch (error) {
      console.error('Error fetching today queue in landing page:', error);
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAppointments();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:appointments-landing')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'appointments' 
      }, () => {
        fetchTodayAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (queueAppointments.length > 0) {
      const topApp = queueAppointments[0];
      if (lastCalledId && lastCalledId !== topApp.id) {
        if (playSelectSound) {
          playCallChime();
        }
      }
      setLastCalledId(topApp.id);
    } else {
      setLastCalledId(null);
    }
  }, [queueAppointments, lastCalledId, playSelectSound]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsQueueFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const specialties = [
    {
      icon: <Brain className="w-8 h-8 text-[#00A896]" />,
      title: "Neurologia & Saúde Mental",
      desc: "Equipe especializada no diagnóstico de distúrbios neurológicos e suporte à saúde mental integrativa."
    },
    {
      icon: <Baby className="w-8 h-8 text-[#00A896]" />,
      title: "Pediatria",
      desc: "Acompanhamento do crescimento, imunização, nutrição de recém-nascidos e cuidado carinhoso em todas as fases da infância."
    },
    {
      icon: <Heart className="w-8 h-8 text-[#00A896]" />,
      title: "Cardiologia",
      desc: "Tratamento preventivo, exames cardiológicos integrados e acompanhamento da saúde do coração para todas as idades."
    },
    {
      icon: <Stethoscope className="w-8 h-8 text-[#00A896]" />,
      title: "Clínica Geral",
      desc: "Atendimento primário contínuo, diagnósticos preventivos e orientação geral de tratamentos de rotina."
    },
    {
      icon: <Eye className="w-8 h-8 text-[#00A896]" />,
      title: "Oftalmologia",
      desc: "Tecnologia de ponta e exames completos para proteger a visão e tratar patologias oculares com excelência."
    },
    {
      icon: <Dna className="w-8 h-8 text-[#00A896]" />,
      title: "Dermatologia & Estética",
      desc: "Tratamentos modernos e dermatologia clínica dedicada à proteção, cuidado e rejuvenescimento da pele."
    }
  ];

  const galleryImages = [
    {
      url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&auto=format&fit=crop&q=80",
      title: "Recepção Ampla e Confortável",
      desc: "Ambiente higienizado, climatizado e preparado para receber sua família com total acolhimento."
    },
    {
      url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=80",
      title: "Consultórios Equipados",
      desc: "Salas de consulta modernas com privacidade completa e tecnologia clínica avançada."
    },
    {
      url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500&auto=format&fit=crop&q=80",
      title: "Central de Diagnósticos",
      desc: "Equipamentos de última geração para exames laboratoriais e exames de imagem ágeis."
    },
    {
      url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&auto=format&fit=crop&q=80",
      title: "Sala de Exames Avançados",
      desc: "Ambiente estéril equipado para checkups especializados e procedimentos de rotina."
    },
    {
      url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=80",
      title: "Espaço Kids de Acolhimento",
      desc: "Área especial para que as crianças se sintam seguras e confortáveis durante as consultas."
    },
    {
      url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80",
      title: "Sala de Medicação e Repouso",
      desc: "Espaço privado com poltronas ergonômicas para repouso imediato e aplicação rápida de medicamentos."
    },
    {
      url: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=500&auto=format&fit=crop&q=80",
      title: "Posto de Coleta Integrada",
      desc: "Instalações modernas de biologia clínica com foco em precisão e máxima rapidez nos resultados."
    },
    {
      url: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=500&auto=format&fit=crop&q=80",
      title: "Posto de Triagem Avançada",
      desc: "Tecnologia embarcada para garantir priorização humanizada e menor tempo de espera."
    }
  ];

  const testimonials = [
    {
      text: "O atendimento na Clínica Vida Plena é absolutamente impecável. Do acolhimento inicial na recepção à consulta detalhada com o Dr. Carlos, sinto-me genuinamente cuidada e segura em todos os momentos.",
      name: "Clara Mendes de Oliveira",
      role: "Paciente de Cardiologia",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80"
    },
    {
      text: "Levei meus dois filhos para a Dra. Helena e fiquei encantada com a dedicação e o carinho pedagógico com que ela conduz a consulta. Ter as receitas na hora e a possibilidade de agendar online facilita muito a nossa rotina.",
      name: "Camila Ribeiro Rocha",
      role: "Mãe do Lucas e Julia (Pacientes da Dra. Helena)",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
    },
    {
      text: "Uma estrutura fantástica e muito higienizada. O agendamento por parte da equipe é rápido e pude realizar meus exames lipídicos fundamentais e ver os resultados diretamente na área do paciente. Recomendo fortemente!",
      name: "Marcos Lima Fonseca",
      role: "Paciente de Clínica Geral",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
    },
    {
      text: "Fiquei extremamente satisfeita com a consulta com a especialista em nutrição. O plano alimentar foi todo customizado para a minha rotina de trabalho corrida, e sinto minha disposição muito melhor no dia a dia.",
      name: "Juliana Tavares Almeida",
      role: "Paciente de Medicina Integrada",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80"
    },
    {
      text: "Excelente infraestrutura e agilidade. Fiz o agendamento preventivo de rotina e o atendimento foi de altíssimo nível. Além disso, pude acessar os atestados e o histórico de evolução médica direto pela área do paciente.",
      name: "Renato Martins Filho",
      role: "Paciente de Checkup Geral",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80"
    },
    {
      text: "Sem dúvidas a melhor clínica de São Paulo. A Dra. Patrícia na dermatologia é super atenciosa, explicou detalhadamente todos os meus exames preventivos e o ambiente transmite muita paz e segurança.",
      name: "Fernanda Castro Costa",
      role: "Paciente de Dermatologia",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&auto=format&fit=crop&q=80"
    }
  ];

  const localDoctors: Doctor[] = [
    {
      full_name: "Dr. Ricardo Silva",
      specialty: "Cardiologia Plena",
      crm: "CRM 12345-SP",
      bio: "Especialista em cardiologia preventiva, com mais de 15 anos de atuação nos maiores hospitais do Brasil.",
      image_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300",
      availability: ["Seg", "Qua", "Sex"]
    },
    {
      full_name: "Dr. Marcos Santos",
      specialty: "Neurologia Clínica",
      crm: "CRM 78910-SP",
      bio: "Especializado em distúrbios cognitivos e monitoramento de distúrbios do sono e cefaleias refratárias.",
      image_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300",
      availability: ["Seg", "Ter", "Qui"]
    },
    {
      full_name: "Dra. Patrícia Lima",
      specialty: "Dermatologia & Estética",
      crm: "CRM 45678-SP",
      bio: "Focada no rejuvenescimento facial seguro, tratamentos clínicos integrados e tricologia avançada.",
      image_url: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=300&h=300",
      availability: ["Qua", "Sex"]
    },
    {
      full_name: "Dra. Amanda Ramos",
      specialty: "Ginecologia & Obstetrícia",
      crm: "CRM 89012-SP",
      bio: "Dedicação à saúde integral da mulher, com foco em medicina preventiva, climatério e planejamento familiar.",
      image_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
      availability: ["Ter", "Qua", "Sex"]
    },
    {
      full_name: "Dr. Bruno Alencar",
      specialty: "Ortopedia & Traumatologia",
      crm: "CRM 34567-SP",
      bio: "Especialista em traumatologia esportiva e reabilitação articular, focado em devolver qualidade de vida aos pacientes.",
      image_url: "https://images.unsplash.com/photo-1637059824899-a441006a6875?auto=format&fit=crop&q=80&w=300&h=300",
      availability: ["Seg", "Qua", "Qui"]
    }
  ];

  // Carousel States & Handlers
  const [docIndex, setDocIndex] = useState(0);
  const [docVisibleCount, setDocVisibleCount] = useState(3);

  const [testIndex, setTestIndex] = useState(0);
  const [testVisibleCount, setTestVisibleCount] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      // For Doctors Carousel
      if (window.innerWidth >= 1024) {
        setDocVisibleCount(3);
      } else if (window.innerWidth >= 640) {
        setDocVisibleCount(2);
      } else {
        setDocVisibleCount(1);
      }

      // For Testimonials Slider
      if (window.innerWidth >= 1024) {
        setTestVisibleCount(3);
      } else if (window.innerWidth >= 768) {
        setTestVisibleCount(2);
      } else {
        setTestVisibleCount(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxDocIndex = Math.max(0, localDoctors.length - docVisibleCount);
  const nextDoctor = () => {
    setDocIndex((prev) => (prev >= maxDocIndex ? 0 : prev + 1));
  };
  const prevDoctor = () => {
    setDocIndex((prev) => (prev === 0 ? maxDocIndex : prev - 1));
  };

  const maxTestIndex = Math.max(0, testimonials.length - testVisibleCount);
  const nextTestimonial = () => {
    setTestIndex((prev) => (prev >= maxTestIndex ? 0 : prev + 1));
  };
  const prevTestimonial = () => {
    setTestIndex((prev) => (prev === 0 ? maxTestIndex : prev - 1));
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen text-[#2D3748] dark:text-gray-100 font-sans antialiased text-base selection:bg-[#00A896] selection:text-white transition-colors duration-300">
      
      {/* HEADER FIXO */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/60 dark:bg-slate-950/60 shadow-sm backdrop-blur-md z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center cursor-pointer select-none" onClick={() => scrollToSection('home')}>
            <span className="font-display font-black text-2xl md:text-3xl tracking-tight text-[#028090] leading-none">Vida</span>
            <span className="font-display font-normal text-2xl md:text-3xl tracking-tight text-[#2D3748] dark:text-gray-100 leading-none">Plena</span>
            <span className="font-display font-black text-2xl md:text-3xl tracking-tight text-[#FF6B35] leading-none">.</span>
          </div>

          {/* Navegação Desktop */}
          <nav className="hidden xl:flex items-center space-x-8">
            {/* Home Dropdown on Hover with Down Arrow */}
            <div className="relative group/home py-2.5">
              <button 
                onClick={() => scrollToSection('home')} 
                className="flex items-center gap-1.5 font-bold text-[#2D3748]/80 dark:text-gray-200 hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors cursor-pointer text-sm"
              >
                Home
                <svg className="w-3.5 h-3.5 transition-transform duration-250 group-hover/home:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              {/* Dropdown list appearing smoothly on hover */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-0 w-48 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl shadow-xl py-3.5 px-2.5 opacity-0 invisible group-hover/home:opacity-100 group-hover/home:visible transition-all duration-200 z-50">
                <div className="space-y-1">
                  <button onClick={() => scrollToSection('home')} className="w-full text-left font-semibold py-2 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/40 dark:hover:bg-slate-800/65 transition-colors text-xs cursor-pointer">
                    Hero
                  </button>
                  <button onClick={() => scrollToSection('sobre')} className="w-full text-left font-semibold py-2 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/40 dark:hover:bg-slate-800/65 transition-colors text-xs cursor-pointer">
                    Sobre Nós
                  </button>
                  <button onClick={() => scrollToSection('especialidades')} className="w-full text-left font-semibold py-2 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/40 dark:hover:bg-slate-800/65 transition-colors text-xs cursor-pointer">
                    Especialidades
                  </button>
                  <button onClick={() => scrollToSection('estrutura')} className="w-full text-left font-semibold py-2 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/40 dark:hover:bg-slate-800/65 transition-colors text-xs cursor-pointer">
                    Estrutura
                  </button>
                  <button onClick={() => scrollToSection('feedbacks')} className="w-full text-left font-semibold py-2 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/40 dark:hover:bg-slate-800/65 transition-colors text-xs cursor-pointer">
                    Feedbacks
                  </button>
                  <button onClick={() => scrollToSection('equipe')} className="w-full text-left font-semibold py-2 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/40 dark:hover:bg-slate-800/65 transition-colors text-xs cursor-pointer">
                    Equipe Médica
                  </button>
                  <button onClick={() => scrollToSection('contato')} className="w-full text-left font-semibold py-2 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/40 dark:hover:bg-slate-800/65 transition-colors text-xs cursor-pointer">
                    Contato
                  </button>
                </div>
              </div>
            </div>

            {/* Fila de espera */}
            <button onClick={() => setShowQueueModal(true)} className="font-bold text-[#2D3748]/80 dark:text-gray-200 hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors cursor-pointer text-sm flex items-center gap-1.5">
              Fila de Espera 
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>

            {/* Contato */}
            <button onClick={() => scrollToSection('contato')} className="font-bold text-[#2D3748]/80 dark:text-gray-200 hover:text-[#00A896] dark:hover:text-[#00A896] transition-colors cursor-pointer text-sm">
              Contato
            </button>
          </nav>

          {/* Botões de Ação */}
          <div className="hidden xl:flex items-center space-x-3">
            <button 
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-[#E0F2F1]/50 dark:hover:bg-slate-800 transition-all cursor-pointer border border-slate-100 dark:border-slate-800"
              title={isDarkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>

            <button 
              onClick={onEnterPatient}
              className="px-5 py-2.5 text-xs font-black text-white bg-[#00A896] hover:bg-[#028090] tracking-wide shadow-md hover:shadow-lg rounded-xl transition-all font-bold cursor-pointer"
            >
              Acessar Portal
            </button>
          </div>

          {/* Hamburguer / Menu Sidebar (Apenas visível em telas menores que não comportam a navegação desktop) */}
          <div className="flex items-center space-x-2 xl:hidden">
            <div className="flex items-center">
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-150 dark:hover:bg-slate-800 transition-all cursor-pointer"
                title={isDarkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md text-[#2D3748] dark:text-gray-200 hover:text-[#00A896] hover:bg-gray-150 flex items-center gap-1.5 font-bold text-xs cursor-pointer"
              title="Menu Lateral"
            >
              <Menu className="w-6 h-6" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>

        </div>

        {/* Sidebar Lateral Slide-Out Completa */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop de Fundo */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] cursor-pointer"
              />

              {/* Painel da Sidebar */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-[#111c24] shadow-2xl z-[10000] flex flex-col p-6 h-screen border-l border-slate-100 dark:border-slate-800 transition-colors duration-350"
              >
                {/* Header do Menu */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center cursor-pointer select-none">
                    <span className="font-display font-black text-2xl tracking-tight text-[#028090] leading-none">Vida</span>
                    <span className="font-display font-normal text-2xl tracking-tight text-[#2D3748] dark:text-gray-100 leading-none">Plena</span>
                    <span className="font-display font-black text-2xl tracking-tight text-[#FF6B35] leading-none">.</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Lista Completa de Opções */}
                <div className="flex-1 overflow-y-auto py-6 space-y-1 pr-1">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-3">
                    Navegação
                  </p>
                  
                  <button 
                    onClick={() => { setMobileMenuOpen(false); scrollToSection('home'); }} 
                    className="block w-full text-left font-bold py-3 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/30 dark:hover:bg-slate-800/50 transition-colors text-sm"
                  >
                    Home
                  </button>

                  <button 
                    onClick={() => { setMobileMenuOpen(false); scrollToSection('sobre'); }} 
                    className="block w-full text-left font-bold py-3 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/30 dark:hover:bg-slate-800/50 transition-colors text-sm"
                  >
                    Sobre Nós
                  </button>
                  
                  <button 
                    onClick={() => { setMobileMenuOpen(false); scrollToSection('especialidades'); }} 
                    className="block w-full text-left font-bold py-3 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/30 dark:hover:bg-slate-800/50 transition-colors text-sm"
                  >
                    Especialidades
                  </button>

                  <button 
                    onClick={() => { setMobileMenuOpen(false); scrollToSection('estrutura'); }} 
                    className="block w-full text-left font-bold py-3 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/30 dark:hover:bg-slate-800/50 transition-colors text-sm"
                  >
                    Estrutura
                  </button>

                  <button 
                    onClick={() => { setMobileMenuOpen(false); scrollToSection('feedbacks'); }} 
                    className="block w-full text-left font-bold py-3 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/30 dark:hover:bg-slate-800/50 transition-colors text-sm"
                  >
                    Feedbacks
                  </button>
                  
                  <button 
                    onClick={() => { setMobileMenuOpen(false); scrollToSection('equipe'); }} 
                    className="block w-full text-left font-bold py-3 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/30 dark:hover:bg-slate-800/50 transition-colors text-sm"
                  >
                    Equipe Médica
                  </button>
                  
                  <button 
                    onClick={() => { setMobileMenuOpen(false); scrollToSection('contato'); }} 
                    className="block w-full text-left font-bold py-3 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/30 dark:hover:bg-slate-800/50 transition-colors text-sm"
                  >
                    Contato
                  </button>
                  
                  <button 
                    onClick={() => { setMobileMenuOpen(false); setShowQueueModal(true); }} 
                    className="w-full text-left font-bold py-3 px-3 rounded-xl text-slate-700 dark:text-gray-200 hover:text-[#00A896] hover:bg-[#E0F2F1]/30 dark:hover:bg-slate-800/50 transition-colors text-sm flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      Fila de Espera
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </span>
                  </button>
                </div>

                {/* Footer / Portais de Acesso */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                    Portais de Acesso
                  </p>
                  <button 
                    onClick={() => { setMobileMenuOpen(false); onEnterPatient(); }}
                    className="w-full text-center py-3 rounded-xl text-xs font-black text-white bg-[#00A896] hover:bg-[#028090] transition-all cursor-pointer font-bold shadow-md duration-250"
                  >
                    Acessar Portal
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section id="home" className="min-h-screen flex items-center pt-32 pb-20 md:py-28 overflow-hidden relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1758691461935-202e2ef6b69f?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>
        {/* Backdrop color overlay supporting dark/light mode readability - highly transparent on the right to show the image, more opaque on the left for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-transparent z-0"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Texto do Hero */}
            <div className="lg:col-span-8 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-[#00A896]/10 text-[#028090] dark:text-[#5cecdb] px-3.5 py-1.5 rounded-full text-xs font-bold">
                <Heart className="w-4 h-4 text-[#00A896]" />
                <span>Gestão Humanizada & Tecnologia Integrada</span>
              </div>
              
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-[#2D3748] dark:text-white leading-tight tracking-tight">
                Cuidar de você é a nossa <span className="text-[#028090] dark:text-[#00c9b4]">prioridade.</span>
              </h1>
              
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 font-medium">
                A Clínica Vida Plena combina acolhimento familiar com as melhores práticas de medicina diagnóstica e preventiva de São Paulo. Agende suas consultas, acompanhe seus prontuários e receba seus exames de forma 100% digital e segura.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button 
                  onClick={() => scrollToSection('contato')}
                  className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-white bg-[#FF6B35] hover:bg-[#e45b27] rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Agendar Consulta Agora
                </button>
                <button 
                  onClick={() => scrollToSection('sobre')}
                  className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-[#028090] dark:text-[#5cecdb] bg-white/80 dark:bg-slate-900/80 hover:bg-[#E0F2F1]/30 dark:hover:bg-slate-800 rounded-xl border border-gray-200/60 dark:border-slate-800 transition-all cursor-pointer"
                >
                  Conhecer Nossos Diferenciais
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SOBRE NÓS / DIFERENCIAIS */}
      <section id="sobre" className="min-h-screen flex flex-col justify-center py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#00a896_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.05]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full space-y-16 lg:space-y-24">
          
          {/* Fileira 1: Imagem na Esquerda, Conteúdo na Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Foto decorativa */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#00A896] to-[#028090] rounded-3xl blur opacity-10 pointer-events-none" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900">
                <img 
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80" 
                  alt="Estrutura de Atendimento" 
                  className="rounded-2xl w-full object-cover aspect-square hover:scale-105 transition-transform duration-550"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-900 border border-[#E0F2F1] dark:border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-3 z-20">
                <div className="w-10 h-10 bg-[#FF6B35] rounded-xl flex items-center justify-center text-white font-extrabold">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-[#028090] leading-none uppercase font-extrabold">ISO 9001</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-gray-400 mt-0.5">Certificação de Excelência</p>
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[#00A896] uppercase text-xs font-bold tracking-widest block font-extrabold">Sobre Nós</span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-[#028090] dark:text-white leading-tight">Excelência no Cuidado com a Sua Saúde</h2>
              <p className="text-sm font-medium text-slate-600 dark:text-gray-300 leading-relaxed">
                Fundada com a premissa de humanizar a medicina de alta complexidade, a Clínica Vida Plena combina profissionais de renome científico com ferramentas digitais exclusivas para monitorar sua saúde passo a passo. 
              </p>

              {/* Lista de diferenciais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#00A896] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#028090] dark:text-[#5cecdb] uppercase tracking-wide">Prontuário Online Confidencial</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Veja prescrições médicas na hora através do Portal do Paciente.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#00A896] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#028090] dark:text-[#5cecdb] uppercase tracking-wide">Senha do Dia Transparente</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Acompanhe na recepção seu horário de modo digital e justo.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#00A896] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#028090] dark:text-[#5cecdb] uppercase tracking-wide">Corpo Clínico Integrador</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Médicos qualificados com prontuários compartilhados.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#00A896] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#028090] dark:text-[#5cecdb] uppercase tracking-wide">Consultório Conforto</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Instalações amplas e ambientes climatizados.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Fileira 2: Conteúdo na Esquerda, Imagem na Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Conteúdo */}
            <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
              <span className="text-[#00A896] uppercase text-xs font-bold tracking-widest block font-extrabold">Missão & Compromisso</span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-[#028090] dark:text-white leading-tight">Cuidado Integrado Próximo e Acessível</h2>
              <p className="text-sm font-medium text-slate-600 dark:text-gray-300 leading-relaxed">
                Nossa missão é guiar você na jornada por uma vida ativa, saudável e equilibrada, integrando respeito humano, empatia no atendimento e as tecnologias diagnósticas mais integradas.
              </p>

              {/* Lista de diferenciais de Missão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#00A896] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#028090] dark:text-[#5cecdb] uppercase tracking-wide">Atendimento Sem Filas</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-medium">Agendamento ágil, lembretes no celular e controle do paciente.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#00A896] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#028090] dark:text-[#5cecdb] uppercase tracking-wide">Inovação e Rigor Técnico</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-medium">Equipamentos modernos e protocolos médicos baseados em evidência.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#00A896] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#028090] dark:text-[#5cecdb] uppercase tracking-wide">Prevenção Proativa</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-medium">Equipe focada no acompanhamento continuado antes que os sintomas surjam.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#00A896] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#028090] dark:text-[#5cecdb] uppercase tracking-wide">Acolhimento Centrado</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-medium">Abordagem integrativa para tratar você como um todo, não apenas os sintomas.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Foto decorativa */}
            <div className="lg:col-span-5 relative order-1 lg:order-2">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#028090] to-[#00A896] rounded-3xl blur opacity-10 pointer-events-none" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900">
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80" 
                  alt="Atendimento de Excelência" 
                  className="rounded-2xl w-full object-cover aspect-square hover:scale-105 transition-transform duration-550"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-900 border border-[#E0F2F1] dark:border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-3 z-20">
                <div className="w-10 h-10 bg-[#00A896] rounded-xl flex items-center justify-center text-white">
                  <Heart size={20} className="fill-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#028090] leading-none uppercase font-extrabold">Cuidado Total</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-gray-400 mt-0.5">Empatia e Bem-Estar</p>
                </div>
              </div>
            </div>

          </div>

          {/* Botão Acessar Portal alinhado no meio horizontal */}
          <div className="flex justify-center pt-8 lg:pt-12 w-full">
            <button
              onClick={onEnterPatient}
              className="px-8 py-4 rounded-xl text-xs sm:text-sm font-black text-white bg-[#00A896] hover:bg-[#028090] tracking-wide shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
            >
              Acessar Portal
            </button>
          </div>

        </div>
      </section>

      {/* ESPECIALIDADES SECTION */}
      <section id="especialidades" className="py-24 bg-[#E0F2F1]/30 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="text-[#00A896] uppercase text-xs font-bold tracking-widest block">Nosso Portfólio</h2>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#028090] dark:text-white">Especialidades Médicas Completas</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-350">
              Equipe multidisciplinar dedicada a oferecer tratamentos focados no paciente com tecnologia clínica avançada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {specialties.map((spec, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-[#E0F2F1] dark:border-slate-800 hover:border-[#00A896]/30 hover:shadow-xl hover:shadow-[#028090]/5 transition-all group duration-300"
              >
                <div className="w-12 h-12 bg-[#E0F2F1] dark:bg-[#00A896]/25 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#00A896] group-hover:text-white transition-all duration-300">
                  <div className="text-[#00A896] group-hover:text-white transition-all duration-300 [&_svg]:!text-current">
                    {spec.icon}
                  </div>
                </div>
                <h3 className="font-display font-black text-lg text-[#028090] dark:text-white mb-2">{spec.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-semibold">{spec.desc}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* TOUR PELA NOSSA ESTRUTURA */}
      <section id="estrutura" className="py-24 bg-[#E0F2F1]/20 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="text-[#00A896] uppercase text-xs font-bold tracking-widest animate-pulse">Nossa Estrutura</h2>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#028090] dark:text-white">Tour pela Nossa Estrutura</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-350">
              Equipamentos de alta tecnologia e salas confortáveis pensadas no seu repouso e atendimento com privacidade.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleryImages.map((img, idx) => (
              <div 
                key={idx}
                className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-[#E0F2F1] dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-[#00a896]/30 transition-all duration-300 flex flex-col cursor-pointer"
              >
                <div className="relative overflow-hidden aspect-[4/3] bg-slate-50 dark:bg-slate-850 shrink-0">
                  <img 
                    src={img.url} 
                    alt={img.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h4 className="font-display font-bold text-xs sm:text-sm text-[#028090] dark:text-white mb-1.5">{img.title}</h4>
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-gray-405 font-medium">{img.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FEEDBACKS DOS PACIENTES */}
      <section id="feedbacks" className="py-24 bg-white dark:bg-slate-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="text-[#00A896] uppercase text-xs font-bold tracking-widest">Opinião de quem confia</h2>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#028090] dark:text-white">O que dizem os nossos pacientes</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-350">
              A satisfação dos nossos pacientes é a nossa maior recompensa. Confira relatos reais recolhidos de nossas pesquisas pós-atendimento.
            </p>
          </div>

          {/* Testimonial slider track */}
          <div className="relative overflow-hidden w-full px-1">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${testIndex * (100 / (testVisibleCount || 1))}%)` }}
            >
              {testimonials.map((test, idx) => {
                let widthClass = "w-full shrink-0 p-3";
                if (testVisibleCount === 2) {
                  widthClass = "w-1/2 shrink-0 p-3";
                } else if (testVisibleCount === 3) {
                  widthClass = "w-1/3 shrink-0 p-3";
                }
                return (
                  <div 
                    key={idx}
                    className={`${widthClass} flex flex-col`}
                  >
                    <div className="bg-white dark:bg-slate-900 border border-[#E0F2F1] dark:border-slate-800 p-8 rounded-3xl flex flex-col justify-between hover:border-[#00A896]/30 hover:shadow-lg transition-all h-full">
                      <div className="space-y-4">
                        {/* Estrelas */}
                        <div className="flex space-x-1">
                          {[...Array(test.stars)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-[#FF6B35] text-[#FF6B35]" />
                          ))}
                        </div>
                        <p className="text-sm italic text-gray-600 dark:text-gray-300 leading-relaxed font-semibold">
                          "{test.text}"
                        </p>
                      </div>

                      <div className="flex items-center space-x-4 pt-6 mt-6 border-t border-gray-100 dark:border-slate-800">
                        <img 
                          src={test.avatar} 
                          alt={test.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-bold text-xs text-[#028090] dark:text-white">{test.name}</h4>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{test.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls for testimonials */}
          <div className="flex justify-center items-center space-x-6 mt-12">
            <button 
              onClick={prevTestimonial}
              className="p-3 bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-800 text-[#028090] dark:text-[#5cecdb] hover:bg-[#E0F2F1] dark:hover:bg-slate-800 rounded-full hover:shadow transition-all cursor-pointer"
              title="Depoimento Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Bullets */}
            <div className="flex space-x-2">
              {[...Array(testimonials.length - testVisibleCount + 1)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${testIndex === i ? 'bg-[#00A896] w-6' : 'bg-gray-300 dark:bg-slate-700'}`}
                  title={`Slide ${i + 1}`}
                />
              ))}
            </div>

            <button 
              onClick={nextTestimonial}
              className="p-3 bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-800 text-[#028090] dark:text-[#5cecdb] hover:bg-[#E0F2F1] dark:hover:bg-slate-800 rounded-full hover:shadow transition-all cursor-pointer"
              title="Próximo Depoimento"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </section>

      {/* CORPO CLÍNICO */}
      <section id="equipe" className="py-24 bg-[#E0F2F1]/30 dark:bg-slate-900/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="text-[#00A896] uppercase text-xs font-bold tracking-widest">Nossos Profissionais</h2>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#028090] dark:text-white">Corpo Clínico Especializado</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-350">
              Equipe médica altamente certificada, ativa no desenvolvimento científico e apaixonada pelo bem-estar geral.
            </p>
          </div>

          <div className="relative overflow-hidden w-full px-1">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${docIndex * (100 / (docVisibleCount || 1))}%)` }}
            >
              {localDoctors.map((doc, idx) => {
                let widthClass = "w-full shrink-0 p-3";
                if (docVisibleCount === 2) {
                  widthClass = "w-1/2 shrink-0 p-3";
                } else if (docVisibleCount === 3) {
                  widthClass = "w-1/3 shrink-0 p-3";
                }
                return (
                  <div key={idx} className={`${widthClass} flex flex-col`}>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-150 dark:border-slate-800 flex flex-col items-center text-center group hover:shadow-lg transition-all h-full justify-between">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#E0F2F1] dark:border-teal-950 group-hover:border-[#00A896] transition-all mb-4 relative shrink-0 bg-slate-50">
                          <img 
                            src={doc.image_url} 
                            alt={doc.full_name}
                            className="w-full h-full object-cover animate-fade-in"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        
                        <h3 className="font-display font-black text-base text-[#028090] dark:text-gray-100">{doc.full_name}</h3>
                        <span className="text-[10px] font-black tracking-wider text-[#00A896] bg-[#E0F2F1]/50 dark:bg-[#00A896]/20 px-3 py-1 rounded-full mt-1.5 uppercase">
                          {doc.specialty}
                        </span>

                        <p className="text-[9px] text-slate-400 dark:text-gray-400 font-bold font-mono mt-1 leading-none uppercase">{doc.crm}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-3 leading-relaxed px-4 italic font-semibold">
                          "{doc.bio}"
                        </p>
                      </div>

                      <div className="w-full mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Horários de Atendimento</h5>
                        <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                          {doc.availability.map((avail, sIdx) => (
                            <span key={sIdx} className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-gray-300 font-bold px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700">
                              {avail}
                            </span>
                          ))}
                        </div>

                        <button 
                          onClick={() => scrollToSection('contato')}
                          className="mt-6 mx-auto flex items-center space-x-1 text-xs text-[#028090] dark:text-[#5cecdb] hover:text-[#00A896] font-bold cursor-pointer"
                        >
                          <span>Falar sobre consulta</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls for Doctors */}
          <div className="flex justify-center items-center space-x-6 mt-12">
            <button 
              onClick={prevDoctor}
              className="p-3 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 text-[#028090] dark:text-[#5cecdb] hover:bg-[#E0F2F1] dark:hover:bg-slate-800 rounded-full hover:shadow transition-all cursor-pointer"
              title="Profissional Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Bullets */}
            <div className="flex space-x-2">
              {[...Array(Math.max(0, localDoctors.length - docVisibleCount + 1))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setDocIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${docIndex === i ? 'bg-[#00A896] w-6' : 'bg-gray-300 dark:bg-slate-700'}`}
                  title={`Slide ${i + 1}`}
                />
              ))}
            </div>

            <button 
              onClick={nextDoctor}
              className="p-3 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 text-[#028090] dark:text-[#5cecdb] hover:bg-[#E0F2F1] dark:hover:bg-slate-800 rounded-full hover:shadow transition-all cursor-pointer"
              title="Próximo Profissional"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </section>

      {/* CONTATO SECTION */}
      <section id="contato" className="min-h-screen flex items-center justify-center py-20 relative bg-cover bg-center bg-no-repeat transition-colors duration-300" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1624727828489-a1e03b79bba8?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>
        {/* Softening overlay with opacity and blur to reduce background image sharpness and elevate text clarity */}
        <div className="absolute inset-0 bg-slate-50/90 dark:bg-slate-950/92 backdrop-blur-[5px] z-0 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col items-center justify-center gap-10">
          
          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl">
            <span className="text-[#00A896] dark:text-[#5cecdb] uppercase text-xs font-black tracking-widest block bg-[#00A896]/10 px-3.5 py-1.5 rounded-full w-fit mx-auto">Atendimento</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#028090] dark:text-[#5cecdb]">Fale Conosco</h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
              Tem dúvidas sobre especialidades, exames específicos ou atendimento? Entre em contato preenchendo as informações abaixo.
            </p>
          </div>

          {/* INFORMAÇÕES - Cards centralizados horizontalmente e com conteúdo alinhado no topo verticalmente */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-center">
            {/* Endereço */}
            <div className="space-y-4 p-6 bg-white/90 dark:bg-slate-900/95 border border-gray-200/80 dark:border-slate-800/80 shadow-sm rounded-2xl flex flex-col items-center justify-start text-center min-h-[185px] transition-all hover:shadow-md backdrop-blur-sm">
              <div className="flex items-center justify-center gap-3 select-none">
                <div className="w-9 h-9 bg-[#028090]/15 dark:bg-[#5cecdb]/15 text-[#028090] dark:text-[#5cecdb] rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h4 className="font-display font-black text-sm text-[#028090] dark:text-white tracking-tight">Localização</h4>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-bold">
                Av. Paulista, 1200 - Conj. 50 • Bela Vista<br />São Paulo - SP • CEP: 01310-100
              </p>
              <p className="text-[10px] text-[#00A896] dark:text-[#5cecdb] font-black uppercase tracking-wider mt-auto pt-2">Estação Trianon Masp a 200m</p>
            </div>

            {/* Telefones */}
            <div className="space-y-4 p-6 bg-white/90 dark:bg-slate-900/95 border border-gray-200/80 dark:border-slate-800/80 shadow-sm rounded-2xl flex flex-col items-center justify-start text-center min-h-[185px] transition-all hover:shadow-md backdrop-blur-sm">
              <div className="flex items-center justify-center gap-3 select-none">
                <div className="w-9 h-9 bg-[#028090]/15 dark:bg-[#5cecdb]/15 text-[#028090] dark:text-[#5cecdb] rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h4 className="font-display font-black text-sm text-[#028090] dark:text-white tracking-tight">Telefones</h4>
              </div>
              <p className="text-xs text-slate-705 dark:text-slate-205 leading-relaxed font-bold">
                <strong>Fixo:</strong> (11) 3244-1020<br />
                <span className="block mt-1"><strong className="text-[#00A896] dark:text-[#5cecdb]">WhatsApp:</strong> (11) 98765-4321</span>
              </p>
            </div>

            {/* E-mail / Funcionamento */}
            <div className="space-y-4 p-6 bg-white/90 dark:bg-slate-900/95 border border-gray-200/80 dark:border-slate-800/80 shadow-sm rounded-2xl flex flex-col items-center justify-start text-center min-h-[185px] transition-all hover:shadow-md backdrop-blur-sm">
              <div className="flex items-center justify-center gap-3 select-none">
                <div className="w-9 h-9 bg-[#028090]/15 dark:bg-[#5cecdb]/15 text-[#028090] dark:text-[#5cecdb] rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h4 className="font-display font-black text-sm text-[#028090] dark:text-white tracking-tight">E-mail</h4>
              </div>
              <p className="text-xs text-slate-705 dark:text-slate-220 leading-relaxed font-bold truncate max-w-full" title="contato@vidaplenaclinica.com">
                contato@vidaplenaclinica.com
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase leading-tight mt-auto pt-2">
                Seg a Sex: 08h às 18h • Sab: 08h às 12h
              </p>
            </div>
          </div>

          {/* CAMPOS PARA PREENCHIMENTO - Centralizados */}
          <div className="w-full">
            {contactSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-8 rounded-[24px] text-center space-y-3 shadow-md backdrop-blur-lg"
              >
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="font-display font-black text-lg text-emerald-800 dark:text-emerald-300">Mensagem Enviada com Sucesso!</h3>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-200 max-w-sm mx-auto">
                  Agradecemos seu contato. Nossa equipe de acolhimento analisará sua solicitação e retornará via WhatsApp ou E-mail em até 2 horas úteis.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleContactSubmit} className="bg-white/95 dark:bg-slate-900/95 shadow-md border border-gray-200/80 dark:border-slate-800/80 p-6 sm:p-8 rounded-[24px] space-y-4 w-full backdrop-blur-sm">
                <div className="text-center sm:text-left space-y-1.5 pb-3 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="font-display font-black text-lg sm:text-xl text-[#028090] dark:text-[#5cecdb]">Formulário de Atendimento</h3>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Envie suas perguntas, sugestões ou solicitações de agendamento</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    required
                    placeholder="Seu Nome Completo"
                    className="w-full text-xs font-semibold bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 focus:border-[#00A896] dark:focus:border-[#00a896] focus:ring-1 focus:ring-[#00a896] rounded-xl px-4 py-3.5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
                  />
                  <input 
                    type="email" 
                    required
                    placeholder="Seu E-mail de Contato"
                    className="w-full text-xs font-semibold bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 focus:border-[#00A896] dark:focus:border-[#00a896] focus:ring-1 focus:ring-[#00a896] rounded-xl px-4 py-3.5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="tel" 
                    required
                    placeholder="Telefone / WhatsApp (com DDD)"
                    className="w-full text-xs font-semibold bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 focus:border-[#00A896] dark:focus:border-[#00a896] focus:ring-1 focus:ring-[#00a896] rounded-xl px-4 py-3.5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
                  />
                  <select 
                    defaultValue=""
                    required
                    className="w-full text-xs font-semibold bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 focus:border-[#00A896] dark:focus:border-[#00a896] focus:ring-1 focus:ring-[#00a896] rounded-xl px-4 py-3.5 text-slate-800 dark:text-white outline-none transition-all"
                  >
                    <option value="" disabled>Selecione uma especialidade / assunto</option>
                    <option value="Agendamento">Agendar uma Consulta ou Exame</option>
                    <option value="Dúvidas">Dúvidas Clínicas / Atendimento</option>
                    <option value="Exames">Resultados de Exames / Portal</option>
                    <option value="Suporte">Dificuldades de Acesso</option>
                    <option value="Sugestões">Sugestões e Feedbacks</option>
                  </select>
                </div>

                <textarea 
                  rows={3}
                  required
                  placeholder="Escreva como a Clínica Vida Plena pode ajudar no seu bem-estar hoje..."
                  className="w-full text-xs font-semibold bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 focus:border-[#00A896] dark:focus:border-[#00a896] focus:ring-1 focus:ring-[#00a896] rounded-xl px-4 py-3.5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none transition-all"
                />

                <button 
                  type="submit"
                  disabled={contactLoading}
                  className="w-full py-3.5 bg-[#00A896] hover:bg-[#028090] text-white text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {contactLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Enviar Mensagem</span>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* FOOTER VERDE-ESCURO */}
      <footer className="bg-[#028090] dark:bg-slate-950 text-white pt-16 pb-8 border-t border-[#00A896]/30 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-[#00A896]/20 dark:border-slate-800">
            
            {/* Coluna 1: Logo e Descrição */}
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="text-white select-none">
                  <span className="font-display font-black text-2xl tracking-tight text-white leading-none">Vida</span>
                  <span className="font-display font-normal text-2xl tracking-tight text-white leading-none">Plena</span>
                  <span className="font-display font-black text-2xl tracking-tight text-[#FF6B35] leading-none">.</span>
                </div>
              </div>
              <p className="text-xs text-[#E0F2F1] dark:text-gray-300 leading-relaxed font-bold">
                Oferecer medicina moderna, acessível e acima de tudo humana é a diretriz que nos move desde a nossa fundação. Cuidamos do seu coração e da sua família.
              </p>
            </div>

            {/* Coluna 2: Links rápidos */}
            <div className="space-y-4">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white">Navegação</h4>
              <ul className="space-y-2 text-xs text-[#E0F2F1] dark:text-gray-300 font-bold">
                <li><button onClick={() => scrollToSection('home')} className="hover:text-[#FF6B35] transition-colors cursor-pointer text-left">Home</button></li>
                <li><button onClick={() => scrollToSection('sobre')} className="hover:text-[#FF6B35] transition-colors cursor-pointer text-left">Sobre Nós</button></li>
                <li><button onClick={() => scrollToSection('especialidades')} className="hover:text-[#FF6B35] transition-colors cursor-pointer text-left">Especialidades</button></li>
                <li><button onClick={() => scrollToSection('estrutura')} className="hover:text-[#FF6B35] transition-colors cursor-pointer text-left">Estrutura</button></li>
                <li><button onClick={() => scrollToSection('feedbacks')} className="hover:text-[#FF6B35] transition-colors cursor-pointer text-left">Feedbacks</button></li>
                <li><button onClick={() => scrollToSection('equipe')} className="hover:text-[#FF6B35] transition-colors cursor-pointer text-left">Equipe Médica</button></li>
                <li><button onClick={() => scrollToSection('contato')} className="hover:text-[#FF6B35] transition-colors cursor-pointer text-left">Contato</button></li>
              </ul>
            </div>

            {/* Coluna 3: Endereço */}
            <div className="space-y-4">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                <MapPin size={13} className="text-[#00A896]" />
                Onde Estamos
              </h4>
              <p className="text-xs text-[#E0F2F1] dark:text-gray-300 leading-relaxed font-bold">
                Av. Paulista, 1200 - Conj. 50<br />
                Bela Vista, São Paulo - SP<br />
                CEP: 01310-100
              </p>
              <div className="text-[10px] text-[#E0F2F1] font-bold space-y-1.5 bg-white/5 border border-white/10 p-3 rounded-xl">
                <p>• Apenas 200m do Metrô Trianon-Masp</p>
                <p>• Estacionamento conveniado no local</p>
                <p>• Acessibilidade integral para cadeirantes</p>
              </div>
            </div>

            {/* Coluna 4: Área Especializada */}
            <div className="space-y-4">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white">Portais do Sistema</h4>
              <p className="text-xs text-[#E0F2F1] dark:text-gray-300 font-bold leading-normal">
                Acesse agendamentos, prontuários, emissão de atestados e ferramentas corporativas.
              </p>
              <div className="flex flex-col space-y-2 pt-2">
                <button 
                  onClick={onEnterPatient}
                  className="text-xs bg-[#00A896] hover:bg-[#00A896]/95 text-white font-black py-2.5 px-3 rounded-xl text-center shadow transition-colors cursor-pointer"
                >
                  Área do Paciente
                </button>
                <button 
                  onClick={onEnterStaff}
                  className="text-xs bg-white/10 hover:bg-white/15 text-[#E0F2F1] dark:text-gray-300 font-bold py-2.5 px-3 rounded-xl text-center transition-colors cursor-pointer border border-white/10"
                >
                  Área de Funcionários
                </button>
              </div>
            </div>

          </div>

          {/* Linha final */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#E0F2F1]/80 space-y-4 sm:space-y-0">
            <div>
              <span className="font-bold uppercase tracking-widest text-[9px]">&copy; {new Date().getFullYear()} Clínica Vida Plena. Todos os direitos reservados.</span>
            </div>
            <div className="flex space-x-6 text-[9px] font-bold uppercase tracking-widest">
              <span>CNPJ: 12.345.678/0001-90</span>
              <span>CRM Responsável Técnico: CRM/SP 123456</span>
            </div>
          </div>

        </div>
      </footer>

      {/* REAL-TIME CALL BOARD MODAL OVERLAY */}
      <AnimatePresence>
        {showQueueModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 dark:bg-black/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto ${
              isQueueFullScreen ? 'p-0 sm:p-0' : ''
            }`}
          >
            {isQueueFullScreen ? (
              /* FULLSCREEN MODE DISPLAY (TV CALLBOARD LOOK) */
              <div className="w-full h-full bg-slate-950 text-white flex flex-col justify-between p-8 md:p-16 relative overflow-hidden transition-colors">
                {/* Background ambient flares */}
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#028090]/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Fullscreen Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center z-10 border-b border-white/5 pb-6 gap-4">
                  <div className="flex items-center space-x-3">
                    <span className="flex h-3.5 w-3.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </span>
                    <div>
                      <h1 className="font-display font-black text-2xl tracking-tight text-[#00c9b4]">PAINEL VIDA PLENA</h1>
                      <p className="text-[10px] tracking-widest text-[#00c9b4] font-bold uppercase">Sincronizado em tempo real</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <span className="text-xl font-mono font-bold text-slate-200 bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl">
                      {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                    <button
                      onClick={() => setPlaySelectSound(!playSelectSound)}
                      className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all cursor-pointer"
                      title={playSelectSound ? "Mutar Som" : "Ativar Som"}
                    >
                      {playSelectSound ? <Volume2 className="w-6 h-6 text-emerald-400" /> : <VolumeX className="w-6 h-6 text-rose-500" />}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          if (document.exitFullscreen && document.fullscreenElement) {
                            await document.exitFullscreen();
                          }
                        } catch (err) {
                          console.warn(err);
                        }
                        setIsQueueFullScreen(false);
                      }}
                      className="flex items-center space-x-2 px-5 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-rose-500/30 cursor-pointer"
                    >
                      <Minimize2 className="w-4 h-4" />
                      <span>Sair da Tela Inteira</span>
                    </button>
                  </div>
                </div>

                {/* Fullscreen Body (Big Password) */}
                <div className="flex-1 flex flex-col justify-center items-center py-6 z-10 text-center">
                  {queueLoading ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Sincronizando fila...</p>
                    </div>
                  ) : queueAppointments.length > 0 ? (
                    <div className="space-y-8 max-w-5xl w-full">
                      <div className="inline-block px-12 py-4 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[32px] text-xs font-black tracking-widest text-emerald-400 uppercase">
                        SENHA SENDO CHAMADA AGORA
                      </div>
                      
                      {/* Massive sequence password */}
                      <div className="animate-pulse duration-1000">
                        <span className="text-9xl sm:text-[12rem] md:text-[14rem] lg:text-[16rem] font-black tracking-tighter text-[#00c9b4] drop-shadow-[0_0_50px_rgba(0,168,150,0.35)]">
                          AG{queueAppointments[0].daily_sequence}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">POR FAVOR, PROSSIGA PARA O CONSULTÓRIO</p>
                        <p className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight">
                          Dr(a). {queueAppointments[0].doctor_name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="mx-auto w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 shadow-inner">
                        <ClipboardList className="text-slate-600 w-12 h-12" />
                      </div>
                      <h3 className="text-slate-400 font-bold text-lg uppercase tracking-widest px-4">Aguardando chamada...</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">As senhas aparecerão neste painel de forma automática ao serem chamadas pela recepção da clínica.</p>
                    </div>
                  )}
                </div>

                {/* Fullscreen Footer (Previous calls) */}
                <div className="z-10 bg-slate-900/60 backdrop-blur-md rounded-[32px] border border-white/5 p-6 sm:p-8">
                  <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="shrink-0 text-center md:text-left space-y-1">
                      <p className="text-[#00c9b4] font-black uppercase tracking-widest text-xs">Chamadas Anteriores</p>
                      <p className="text-[10px] text-slate-400 font-semibold font-sans">Os 3 últimos atendimentos convocados</p>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-4 w-full">
                      {queueAppointments.slice(1, 4).length > 0 ? (
                        queueAppointments.slice(1, 4).map((app) => (
                          <div key={app.id} className="bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-4 text-center hover:border-emerald-500/30 transition-all">
                            <span className="text-2xl sm:text-3xl font-black text-slate-200">AG{app.daily_sequence}</span>
                            <p className="text-[10px] font-bold text-slate-400 truncate italic mt-1">{app.doctor_name}</p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Nenhuma chamada anterior na lista
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* STANDARD DIALOG/MODAL DECORATION */
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full max-w-3xl bg-white dark:bg-[#111c24] rounded-[36px] overflow-hidden shadow-2xl border-t-[8px] border-[#00A896] relative transition-colors max-h-[90vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-[#111c24] z-20">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#E0F2F1] dark:bg-[#00c9b4]/15 rounded-xl flex items-center justify-center text-[#028090] dark:text-[#00c9b4]">
                      <ClipboardList className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-lg text-slate-800 dark:text-white leading-tight">Fila de Espera</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acompanhamento em Tempo Real</p>
                    </div>
                  </div>

                  {/* Actions Header bar */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPlaySelectSound(!playSelectSound)}
                      className="p-2.5 bg-slate-150 hover:bg-slate-200 dark:bg-[#162530] dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                      title={playSelectSound ? "Desativar Sonorização" : "Ativar Sonorização"}
                    >
                      {playSelectSound ? <Volume2 size={18} className="text-emerald-500" /> : <VolumeX size={18} className="text-rose-400" />}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          if (document.documentElement.requestFullscreen) {
                            await document.documentElement.requestFullscreen();
                          }
                        } catch (err) {
                          console.warn(err);
                        }
                        setIsQueueFullScreen(true);
                      }}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#E0F2F1] hover:bg-[#00A896] text-[#028090] hover:text-white dark:bg-[#00c9b4]/10 dark:text-[#00c9b4] dark:hover:bg-[#00c9b4]/20 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-[#00A896]/10 cursor-pointer"
                    >
                      <Maximize2 size={14} />
                      <span className="hidden sm:inline">Tela Inteira</span>
                    </button>
                    <button
                      onClick={() => setShowQueueModal(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 font-sans">
                  <div className="bg-slate-50/50 dark:bg-[#162530] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden shadow-inner">
                    <div className="absolute top-4 left-4 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    
                    {queueLoading ? (
                      <div className="py-12 text-center space-y-3">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">Atualizando dados...</p>
                      </div>
                    ) : queueAppointments.length > 0 ? (
                      <div className="space-y-6">
                        <span className="text-[#028090] dark:text-[#00c9b4] font-black uppercase tracking-[0.25em] text-[10px] block">
                          Sendo Chamado Agora
                        </span>
                        
                        <div className="inline-block px-12 py-6 bg-white dark:bg-[#111c24] border-2 border-[#00A896]/20 dark:border-[#00c9b4]/15 rounded-[24px] shadow-sm">
                          <span className="text-6xl md:text-8xl font-black text-[#028090] dark:text-[#00c9b4] tracking-tighter animate-pulse duration-1000">
                            AG{queueAppointments[0].daily_sequence}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Consultório Médico</p>
                          <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100 pb-1">
                            Dr(a). {queueAppointments[0].doctor_name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 text-center">
                        <ClipboardList className="mx-auto text-slate-300 dark:text-slate-600 w-12 h-12 mb-3" />
                        <h4 className="text-slate-400 dark:text-slate-500 font-bold text-sm uppercase tracking-wider">Ninguém na fila neste instante</h4>
                        <p className="text-xs text-slate-400 mt-1">Ao chamar a senha na recepção, ela piscará aqui de forma automática.</p>
                      </div>
                    )}
                  </div>

                  {/* Previous calls */}
                  {!queueLoading && queueAppointments.slice(1, 4).length > 0 && (
                    <div className="mt-8 font-sans">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 text-center">Últimas senhas chamadas</p>
                      <div className="grid grid-cols-3 gap-3">
                        {queueAppointments.slice(1, 4).map((app) => (
                          <div key={app.id} className="bg-slate-50/50 dark:bg-[#162530]/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-center transition-colors">
                            <p className="text-lg font-black text-slate-600 dark:text-slate-300">AG{app.daily_sequence}</p>
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-full italic" title={app.doctor_name}>
                              {app.doctor_name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer warning */}
                <div className="bg-slate-50 dark:bg-[#162530] p-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-150 dark:border-slate-800 font-sans">
                  <span>Ative o som para alertas em tempo real. Pressione ESC para fechar a tela inteira.</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
