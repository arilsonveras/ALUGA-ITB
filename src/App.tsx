import React, { useState, useEffect } from 'react';
import { 
  Search, SlidersHorizontal, Plus, ShieldCheck, Check, Sparkles, MapPin, 
  Users, DollarSign, Clock, FileText, ChevronRight, Filter, RefreshCw, Star, Info,
  Heart, Calendar, AlertTriangle, Trash2
} from 'lucide-react';

import { Environment, Reservation, UserProfile, EnvironmentCategory, ServicePartner, EnvironmentReview, PromotionPricing } from './types';
import { DEFAULT_ENVIRONMENTS } from './data/defaultEnvironments';
import { DEFAULT_PARTNERS } from './data/defaultPartners';
import { DEFAULT_REVIEWS } from './data/defaultReviews';
import AddEnvironmentModal from './components/AddEnvironmentModal';
import ReservationModal from './components/ReservationModal';
import OwnerDashboard from './components/OwnerDashboard';
import ClientDashboard from './components/ClientDashboard';
import ImageSlider from './components/ImageSlider';
import AdminPartnersDashboard from './components/AdminPartnersDashboard';
import BrandLogo from './components/BrandLogo';
import LoginModal from './components/LoginModal';

const GUEST_USER: UserProfile = {
  name: '',
  email: '',
  role: 'renter',
  balance: 0
};

const isPromotionActive = (env: Environment): boolean => {
  if (!env.isPromoted || env.promotionStatus !== 'active') return false;
  if (env.promotionExpiresAt) {
    const todayStr = new Date().toISOString().split('T')[0];
    return env.promotionExpiresAt >= todayStr;
  }
  return true;
};

export default function App() {
  // Load initial states from localStorage if they exist
  const [environments, setEnvironments] = useState<Environment[]>(() => {
    const saved = localStorage.getItem('aluguel_ambientes');
    return saved ? JSON.parse(saved) : DEFAULT_ENVIRONMENTS;
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('aluguel_reservas');
    return saved ? JSON.parse(saved) : [];
  });

  // Current active logged in user persona
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedUser = localStorage.getItem('aluguel_current_user');
    return savedUser ? JSON.parse(savedUser) : GUEST_USER;
  });

  // Navigation controls: 'browse' | 'client_dash' | 'owner_dash' | 'admin_dash'
  const [currentTab, setCurrentTab] = useState<'browse' | 'client_dash' | 'owner_dash' | 'admin_dash'>('browse');

  // Ad partners list registered by site admin
  const [partners, setPartners] = useState<ServicePartner[]>(() => {
    const saved = localStorage.getItem('aluguel_parceiros');
    return saved ? JSON.parse(saved) : DEFAULT_PARTNERS;
  });

  // Highlight / Top list sponsorship pricing rules configured by Admin
  const [promotionPricing, setPromotionPricing] = useState<PromotionPricing>(() => {
    const saved = localStorage.getItem('aluguel_promotion_pricing');
    return saved ? JSON.parse(saved) : {
      dailyRate: 3.50,
      rate7Days: 20.00,
      rate15Days: 35.00,
      rate30Days: 60.00,
      rate90Days: 150.00,
      rate365Days: 500.00
    };
  });

  useEffect(() => {
    localStorage.setItem('aluguel_promotion_pricing', JSON.stringify(promotionPricing));
  }, [promotionPricing]);

  // Venue renter reviews and ratings state
  const [reviews, setReviews] = useState<EnvironmentReview[]>(() => {
    const saved = localStorage.getItem('aluguel_reviews');
    return saved ? JSON.parse(saved) : DEFAULT_REVIEWS;
  });

  // Custom categories list
  const [categories, setCategories] = useState<{ id: string; name: string; emoji: string }[]>(() => {
    const saved = localStorage.getItem('aluguel_categorias');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      { id: 'party', name: 'SALÃO DE EVENTOS', emoji: '🥳' },
      { id: 'meeting', name: 'Sala de Reunião', emoji: '💼' },
      { id: 'studio', name: 'Estúdio / Fotos', emoji: '🎥' },
      { id: 'office', name: 'Coworking / Escritório', emoji: '💻' },
      { id: 'classroom', name: 'Sala de Aula / Workshops', emoji: '✏️' },
      { id: 'consulting', name: 'Consultório', emoji: '🩺' }
    ];
  });

  // Custom confirmation modal state to bypass the sandboxed iframe alert blocks
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false
  });

  // State to pass down newly completed reservations to show in bottom-left live list immediately
  const [onCompleteReservationTriggered, setOnCompleteReservationTriggered] = useState<Reservation | null>(null);

  // Authentication state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Raw native browser notification request function
  const triggerOwnerBrowserNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: 'https://cdn-icons-png.flaticon.com/512/3602/3602145.png'
          });
        } catch (e) {
          console.error('Failed to trigger standard browser Notification:', e);
        }
      }
    }
  };

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, isDanger = false) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
      isDanger
    });
  };

  useEffect(() => {
    localStorage.setItem('aluguel_categorias', JSON.stringify(categories));
  }, [categories]);

  const handleAddCategory = (newCat: { id: string; name: string; emoji: string }) => {
    setCategories((prev) => [...prev, newCat]);
    showToast(`Categoria "${newCat.name}" cadastrada com sucesso!`);
  };

  const handleUpdateCategory = (updatedCat: { id: string; name: string; emoji: string }) => {
    setCategories((prev) => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
    showToast(`Categoria "${updatedCat.name}" atualizada com sucesso!`);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter(c => c.id !== id));
    showToast(`Categoria removida.`);
  };

  const getLocalDateString = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Browsing filters
  const [selectedCategory, setSelectedCategory] = useState<EnvironmentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(300);
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('');
  
  // Favorites system
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('aluguel_favoritos');
    return saved ? JSON.parse(saved) : [];
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [bookingEnvironment, setBookingEnvironment] = useState<Environment | null>(null);

  // Toast alert system
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync back to localStorage when variables modify
  useEffect(() => {
    localStorage.setItem('aluguel_ambientes', JSON.stringify(environments));
  }, [environments]);

  useEffect(() => {
    localStorage.setItem('aluguel_reservas', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('aluguel_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('aluguel_favoritos', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('aluguel_parceiros', JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem('aluguel_reviews', JSON.stringify(reviews));
  }, [reviews]);

  const handleToggleFavorite = (envId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(envId);
      if (exists) {
        showToast('💔 Espaço removido dos favoritos');
        return prev.filter((id) => id !== envId);
      } else {
        showToast('❤️ Espaço adicionado aos favoritos!');
        return [...prev, envId];
      }
    });
  };

  const handleAddReview = (resId: string, reviewData: Omit<EnvironmentReview, 'id' | 'createdAt'>) => {
    const newReview: EnvironmentReview = {
      ...reviewData,
      id: `rev-${resId}`,
      createdAt: new Date().toISOString()
    };
    setReviews((prev) => {
      const filtered = prev.filter((r) => r.id !== newReview.id);
      return [...filtered, newReview];
    });
    showToast('⭐ Avaliação enviada com sucesso!');
  };

  const getAverageRating = (envId: string) => {
    const envReviews = reviews.filter((r) => r.environmentId === envId);
    if (envReviews.length === 0) return { avg: 5.0, count: 0, list: [] };
    const sum = envReviews.reduce((acc, curr) => acc + curr.rating, 0);
    return {
      avg: parseFloat((sum / envReviews.length).toFixed(1)),
      count: envReviews.length,
      list: envReviews
    };
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Real login and session authentication triggers
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('aluguel_current_user', JSON.stringify(user));
    setIsLoginModalOpen(false);
    
    if (user.role === 'owner') {
      setCurrentTab('owner_dash');
      showToast(`Bem-vindo, ${user.name}! Modo Anfitrião Ativo.`);
    } else if (user.role === 'admin') {
      setCurrentTab('admin_dash');
      showToast(`Bem-vindo, ${user.name}! Painel Administrativo Ativo.`);
    } else {
      setCurrentTab('browse');
      showToast(`Olá, ${user.name}! Acesso concedido.`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(GUEST_USER);
    localStorage.removeItem('aluguel_current_user');
    setCurrentTab('browse');
    showToast('Sessão encerrada! Você agora está navegando como visitante.');
  };

  // Add listing action
  const handleAddEnvironment = (newEnv: Environment, autoLoginUser?: UserProfile) => {
    if (autoLoginUser) {
      setCurrentUser(autoLoginUser);
      // Automatically redirect to owner dashboard
      setCurrentTab('owner_dash');
    }
    setEnvironments((prev) => [newEnv, ...prev]);
    setIsAddModalOpen(false);
    showToast('✨ Seu espaço foi anunciado com sucesso e já está disponível para reservas!');
  };

  // Remove list action
  const handleRemoveEnvironment = (id: string) => {
    triggerConfirm(
      'Remover Anúncio',
      'Tem certeza que deseja remover este anúncio definitivamente e retirar o local do ar?',
      () => {
        setEnvironments((prev) => prev.filter((env) => env.id !== id));
        showToast('Anúncio removido do banco de dados.');
      },
      true
    );
  };

  // Update listing action
  const handleUpdateEnvironment = (updatedEnv: Environment) => {
    setEnvironments((prev) => 
      prev.map((env) => env.id === updatedEnv.id ? updatedEnv : env)
    );
    showToast('✨ Anúncio editado e atualizado com sucesso!');
  };

  // Make booking action
  const handleCompleteReservation = (newRes: Reservation) => {
    setReservations((prev) => [newRes, ...prev]);
    setOnCompleteReservationTriggered(newRes);
    showToast(`✅ Reserva ${newRes.id} realizada! Pagamento confirmado.`);

    // Find the environment to specify in host notification
    const matchedEnv = environments.find(e => e.id === newRes.environmentId);
    const envTitle = matchedEnv ? matchedEnv.title : 'Seu espaço';
    const formattedDate = newRes.date.split('-').reverse().join('/');
    
    // Trigger native browser notification for the host
    triggerOwnerBrowserNotification(
      '🎉 Novo Aluguel Realizado!',
      `O espaço "${envTitle}" foi alugado por ${newRes.renterName} para o dia ${formattedDate} (${newRes.startTime} - ${newRes.endTime}).`
    );
  };

  // Approve manual payment / simulated status shift helper
  const handleApproveReservation = (id: string) => {
    setReservations((prev) => 
      prev.map((res) => 
        res.id === id ? { ...res, status: 'confirmed' } : res
      )
    );
    showToast('💳 Pagamento via PIX confirmado! Reserva ativa.');
  };

  const handlePayRemainder = (id: string) => {
    setReservations((prev) => 
      prev.map((res) => 
        res.id === id ? { ...res, paidAmount: res.totalPrice } : res
      )
    );
    showToast('💳 Saldo de garantia quitado! Diária 100% paga.');
  };

  const handleAddPartner = (newPartner: ServicePartner) => {
    setPartners((prev) => [newPartner, ...prev]);
    showToast(`🤝 Parceiro ${newPartner.name} adicionado com sucesso!`);
  };

  const handleUpdatePartner = (updatedPartner: ServicePartner) => {
    setPartners((prev) => 
      prev.map((p) => p.id === updatedPartner.id ? updatedPartner : p)
    );
    showToast(`🤝 Cadastro de ${updatedPartner.name} atualizado!`);
  };

  const handleDeletePartner = (id: string) => {
    triggerConfirm(
      'Remover Parceiro Publicitário',
      'Tem certeza de que deseja remover este parceiro comercial e suas publicações de forma permanente?',
      () => {
        setPartners((prev) => prev.filter((p) => p.id !== id));
        showToast('Parceiro publicitário removido.');
      },
      true
    );
  };

  // Request reservation cancellation (visitor needs owner approval)
  const handleRequestCancelReservation = (id: string) => {
    setReservations((prev) => 
      prev.map((res) => {
        if (res.id === id) {
          // Find the environment details
          const matchedEnv = environments.find(e => e.id === res.environmentId);
          const envTitle = matchedEnv ? matchedEnv.title : 'Seu espaço';
          const formattedDate = res.date.split('-').reverse().join('/');
          
          // Trigger browser notification for host
          triggerOwnerBrowserNotification(
            '⚠️ Cancelamento Solicitado',
            `O locatário ${res.renterName} solicitou o cancelamento de "${envTitle}" para o dia ${formattedDate}.`
          );
          
          return { ...res, cancelRequested: true };
        }
        return res;
      })
    );
    showToast('Solicitação de cancelamento enviada. Aguardando confirmação do anunciante.');
  };

  // Reject cancellation request (deny cancellation and keep active)
  const handleRejectCancelRequest = (id: string) => {
    setReservations((prev) => 
      prev.map((res) => 
        res.id === id ? { ...res, cancelRequested: false } : res
      )
    );
    showToast('Solicitação de cancelamento recusada. Reserva continua ativa.');
  };

  // Cancel reservation
  const handleCancelReservation = (id: string) => {
    setReservations((prev) => 
      prev.map((res) => 
        res.id === id ? { ...res, status: 'cancelled', cancelRequested: false } : res
      )
    );
    showToast('Locação cancelada.');
  };

  // Permanently delete/remove reservation from history
  const handleDeleteReservation = (id: string) => {
    setReservations((prev) => prev.filter((res) => res.id !== id));
    showToast('Histórico de reserva excluído definitivamente.');
  };

  // Helper to check if location is open and has available slot hours on selected date
  const isEnvironmentAvailableOnDate = (env: Environment, dateStr: string): boolean => {
    if (!dateStr) return true;

    try {
      const parts = dateStr.split('-');
      const parsedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const daysKeys = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
      const wkKey = daysKeys[parsedDate.getDay()];
      const config = env.workingHours[wkKey];

      // If closed, it is not available at all
      if (!config || config.closed) {
        return false;
      }

      // Calculate total available operating minutes
      const parseTimeToMinutes = (timeStr: string) => {
        const p = timeStr.split(':');
        return Number(p[0]) * 60 + Number(p[1]);
      };

      const startMinutes = parseTimeToMinutes(config.start);
      const endMinutes = parseTimeToMinutes(config.end);
      const totalWorkingMinutes = endMinutes - startMinutes;

      if (totalWorkingMinutes <= 0) return false;

      // Sum up active (non-cancelled) reservation durations for this environment on this date
      const dateReservations = reservations.filter(
        (res) => res.environmentId === env.id && res.date === dateStr && res.status !== 'cancelled'
      );

      let reservedMinutes = 0;
      dateReservations.forEach((res) => {
        const resStart = parseTimeToMinutes(res.startTime);
        const resEnd = parseTimeToMinutes(res.endTime);
        if (resEnd > resStart) {
          const clampedStart = Math.max(startMinutes, resStart);
          const clampedEnd = Math.min(endMinutes, resEnd);
          if (clampedEnd > clampedStart) {
            reservedMinutes += (clampedEnd - clampedStart);
          }
        }
      });

      // If reserved minutes spans or exceeds the total operating hours, it's NOT available
      if (reservedMinutes >= totalWorkingMinutes) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Availability check failed:", error);
      return true; // fallback
    }
  };

  // Filter computing for cards
  const filteredEnvironments = environments.filter((env) => {
    const matchesCategory = selectedCategory === 'all' || env.category === selectedCategory;
    const matchesSearch = 
      env.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      env.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      env.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      env.amenities.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPrice = env.pricePerHour <= maxPrice;
    const matchesCapacity = env.capacity >= minCapacity;
    
    // Check Date Availability Filter (PRIMARY FILTER)
    const matchesDate = !filterDate || isEnvironmentAvailableOnDate(env, filterDate);

    // Check Favorites Filter
    const matchesFavorites = !showOnlyFavorites || favorites.includes(env.id);

    return matchesCategory && matchesSearch && matchesPrice && matchesCapacity && matchesDate && matchesFavorites;
  }).sort((a, b) => {
    const aPromoted = isPromotionActive(a);
    const bPromoted = isPromotionActive(b);
    if (aPromoted && !bPromoted) return -1;
    if (!aPromoted && bPromoted) return 1;
    return 0; // maintain default listing structure
  });

  const getCategoryEmoji = (cat: EnvironmentCategory): string => {
    const matched = categories.find(c => c.id === cat);
    return matched ? matched.emoji : '🚪';
  };

  const getCategoryLabel = (cat: EnvironmentCategory): string => {
    const matched = categories.find(c => c.id === cat);
    return matched ? matched.name : cat;
  };

  // Helper to count active user reservations
  const activeUserReservationsCount = reservations.filter(
    (r) => r.renterEmail === currentUser.email && r.status !== 'cancelled'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans transition-all selection:bg-emerald-500/20">
      
      {/* Toast Alert pop */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-800 text-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
          <p className="text-xs font-semibold mr-2">{toastMessage}</p>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-xs text-slate-400 hover:text-white bg-transparent border-0 font-bold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Main Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Logo Brand */}
          <button 
            onClick={() => setCurrentTab('browse')} 
            className="flex items-center text-left hover:opacity-90 active:scale-98 transition-all cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            title="Ir para a página inicial"
          >
            <BrandLogo variant="header" />
          </button>

          {/* Navigation links & Switch simulated user */}
          <div className="flex flex-wrap items-center gap-3 mt-1 sm:mt-0">
            
            {/* Quick App Navigation Tabs */}
            <nav className="flex bg-slate-100/70 p-1 rounded-xl border border-slate-100 text-xs font-semibold">
              <button
                onClick={() => setCurrentTab('browse')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'browse'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🔍 Explorar Locais
              </button>

              <button
                onClick={() => setCurrentTab('client_dash')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  currentTab === 'client_dash'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🗓️ Minhas Reservas
                {activeUserReservationsCount > 0 && (
                  <span className="text-[9px] bg-emerald-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {activeUserReservationsCount}
                  </span>
                )}
              </button>

              {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
                <button
                  onClick={() => setCurrentTab('owner_dash')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    currentTab === 'owner_dash'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🔑 Meus Anúncios
                </button>
              )}

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setCurrentTab('admin_dash')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    currentTab === 'admin_dash'
                      ? 'bg-white text-indigo-950 font-bold shadow-sm'
                      : 'text-indigo-650 text-indigo-600 hover:text-indigo-850'
                  }`}
                >
                  🛠️ Painel Admin
                </button>
              )}
            </nav>

            {/* Real Auth button or profile dropdown */}
            {currentUser.email === '' ? (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                🔑 Entrar / Painel
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs border border-slate-200 bg-slate-50 rounded-xl p-1 shrink-0">
                <div className="px-2.5 py-1 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-700 truncate max-w-[120px]" title={currentUser.name}>
                    {currentUser.name.split(' ')[0]} 
                    <span className="text-[10px] text-slate-400 font-normal pl-1 leading-none">
                      ({currentUser.role === 'admin' ? 'Adm' : 'Anfitrião'})
                    </span>
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-2 py-1 bg-white hover:bg-red-50 hover:text-red-750 text-slate-500 hover:text-red-650 rounded-lg font-bold border border-slate-200 transition-all cursor-pointer"
                >
                  Sair
                </button>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-8">
        
        {/* VIEW: BROWSE SPACES */}
        {currentTab === 'browse' && (
          <div className="space-y-6">
            
             {/* Slimmer Dynamic Intro Welcome Banner */}
            <div className={`relative overflow-hidden bg-gradient-to-r from-brand-50/70 to-orange-50/30 border border-slate-150/50 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs animate-fade-in`}>
              <div className="absolute right-0 top-0 w-60 h-60 bg-logo-teal/[0.03] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 w-40 h-40 bg-logo-orange/[0.02] rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-1.5 z-10 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="text-[9px] font-black tracking-wider text-[#0E5A60] uppercase bg-[#e4f2f3] px-2 py-0.5 rounded border border-[#c1e2e4]">Aluguel Expresso Itaituba</span>
                  <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-450 font-bold">
                    <span>✓ Sem fiador</span>
                    <span>•</span>
                    <span>✓ Reserva em instantes</span>
                    <span>•</span>
                    <span>✓ Pagamento PIX Direto</span>
                  </div>
                </div>
                <h2 className="text-base sm:text-lg font-display font-bold text-slate-800">
                  Encontre o Espaço de Evento Ideal na Região
                </h2>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
                  Salões de festas, salas climatizadas, auditórios e estúdios para eventos no <strong className="text-[#0E5A60]">Aluga ITB</strong>. Faça sua reserva e pague diretamente via PIX com total segurança.
                </p>
              </div>

              {/* Action trigger to list spot quickly */}
              <div className="shrink-0 text-center space-y-1 z-10 flex items-center gap-3 md:flex-col md:space-y-1">
                <span className="text-[10px] text-slate-400 font-bold hidden md:inline">Quer anunciar seu ambiente?</span>
                <button
                  onClick={() => {
                    setIsAddModalOpen(true);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold active:scale-98 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Anunciar Espaço
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: STICKY FILTERS & PERSISTENT DATE CHECKER (Fica fixo enquanto rola o feed) */}
              <aside className="lg:col-span-3 lg:sticky lg:top-[74px] space-y-4 z-20">
                {/* PRIMARY CARD: EXPLICIT CHOOSE DATE */}
                <div 
                  id="sticky-date-card" 
                  className={`bg-emerald-50 border-2 border-emerald-500 rounded-3xl shadow-sm transition-all animate-in fade-in duration-200 ${
                    filterDate 
                      ? 'p-3.5 sm:p-5 space-y-2 sm:space-y-4' 
                      : 'p-5 space-y-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-emerald-950 font-bold text-xs uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🗓️</span>
                      <span>Qual o dia da Reserva?</span>
                    </div>
                    {filterDate && (
                      <span className="text-[9px] text-emerald-600 bg-white border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold sm:hidden animate-pulse">
                        Filtro Ativo
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] font-medium text-emerald-850 leading-normal ${filterDate ? 'hidden sm:block' : 'block'}`}>
                    Selecione a data planejada para calibrar tarifas dinâmicas e ver apenas ambientes livres para expedientes naquele dia!
                  </p>
                  
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-emerald-600">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      min={getLocalDateString()}
                      value={filterDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && val < getLocalDateString()) {
                          alert('Por favor, selecione a data de hoje ou posterior para filtrar.');
                          setFilterDate('');
                          return;
                        }
                        setFilterDate(val);
                        if (val) {
                          showToast(`📅 Filtro de data ativo: mostrando apenas locais disponíveis em ${val.split('-').reverse().join('/')}`);
                        }
                      }}
                      className="w-full pl-9 pr-8 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer shadow-xs"
                      title="Principal filtro: Selecione uma data para listar apenas locais com expediente livre"
                    />
                    {filterDate && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterDate('');
                          showToast('Filtro de data desativado.');
                        }}
                        className="absolute inset-y-0 right-3 flex items-center text-[10px] uppercase font-mono font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title="Limpar data"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Quick Date Shortcuts (Collapsed on mobile if filterDate is active to make space for listings) */}
                  <div className={`grid grid-cols-2 gap-1.5 pt-1 ${filterDate ? 'hidden sm:grid' : 'grid'}`}>
                    {[
                      { label: 'Hoje', val: new Date().toISOString().split('T')[0] },
                      { label: 'Amanhã', val: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
                      { label: 'Sáb Próx', val: (() => {
                        const d = new Date();
                        d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7);
                        return d.toISOString().split('T')[0];
                      })() },
                      { label: 'Dom Próx', val: (() => {
                        const d = new Date();
                        d.setDate(d.getDate() + (7 - d.getDay() + 7) % 7);
                        return d.toISOString().split('T')[0];
                      })() }
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => {
                          setFilterDate(btn.val);
                          showToast(`📅 Filtro rápido: exibindo locais para ${btn.label} (${btn.val.split('-').reverse().join('/')})`);
                        }}
                        className={`text-[10px] py-1.5 px-2 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                          filterDate === btn.val
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/10'
                            : 'bg-white border-emerald-250 text-emerald-800 hover:bg-emerald-100/40'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CATEGORIES SIDEBAR LIST (Desktop only) */}
                <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs space-y-3 hidden lg:block">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tipo de Aluguel</span>
                  <nav className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setShowOnlyFavorites(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                        selectedCategory === 'all' && !showOnlyFavorites
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-transparent text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      🌍 Todos os Itens
                    </button>

                    <button
                      onClick={() => {
                        setShowOnlyFavorites(!showOnlyFavorites);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                        showOnlyFavorites
                          ? 'bg-red-500 text-white shadow-xs'
                          : 'bg-transparent text-slate-650 hover:bg-slate-50 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-white text-white' : 'text-red-500'}`} />
                      <span>Meus Favoritos ({favorites.length})</span>
                    </button>

                    {categories.map((catObj) => {
                      const cat = catObj.id;
                      const isActive = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setShowOnlyFavorites(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-transparent text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          <span>{catObj.emoji}</span>
                          <span>{catObj.name}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </aside>

              {/* RIGHT COLUMN: MAIN CONTENT FEED & LISTINGS */}
              <div className="lg:col-span-9 space-y-6">
                
                {/* Search Text field & Price / Capacity filters */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    
                    {/* SEARCH QUERY TEXT FIELD */}
                    <div className="md:col-span-10 relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-5 h-5" />
                      </span>
                      <input
                        type="text"
                        placeholder="Pesquise por nome, comodidade (Ar, Wi-Fi...), ruas ou bairros..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 placeholder-slate-400 transition-colors"
                      />
                    </div>

                    {/* CONTROLS */}
                    <div className="md:col-span-2 flex gap-2">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          showFilters 
                            ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
                            : 'bg-white border-slate-250 text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        <SlidersHorizontal className="w-4 h-4" /> Filtros
                      </button>

                      {(searchQuery || selectedCategory !== 'all' || maxPrice < 300 || minCapacity > 0 || filterDate || showOnlyFavorites) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('all');
                            setMaxPrice(300);
                            setMinCapacity(0);
                            setFilterDate('');
                            setShowOnlyFavorites(false);
                            showToast('Filtros redefinidos');
                          }}
                          className="p-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                          title="Limpar todos os filtros"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* HIGH INTENT DISPLAY FOR DATE CHOSEN */}
                  {filterDate && (
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-100/50 text-[11px] font-medium animate-in fade-in duration-200">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                      <span>
                        Filtro principal ativo! Mostrando apenas locais <strong>disponíveis (com expediente livre)</strong> para o dia <strong>{filterDate.split('-').reverse().join('/')}</strong>. Os preços exibidos já consideram as tarifas de fim de semana ou feriados!
                      </span>
                    </div>
                  )}
                </div>

                {/* Collapsible filters box with range sliders */}
                {showFilters && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 mt-2 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-150">
                    
                    {/* Max price per day */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600">Faixa de Preço Máximo por Diária:</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-250/50 rounded-md font-bold text-xs font-mono">
                          R$ {maxPrice}/diária
                        </span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="300"
                        step="10"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>R$ 30</span>
                        <span>R$ 150</span>
                        <span>R$ 300+</span>
                      </div>

                      {/* Explicit Quick Range Labels */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Níveis de Preço Explícitos:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { label: 'Econômico (Até R$ 80)', val: 80 },
                            { label: 'Intermediário (Até R$ 150)', val: 150 },
                            { label: 'Premium (Até R$ 250)', val: 250 },
                            { label: 'Exclusivo (Até R$ 300+)', val: 300 }
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => setMaxPrice(opt.val)}
                              className={`text-[9.5px] px-2.5 py-1.5 rounded-lg border font-bold text-left transition-all ${
                                maxPrice === opt.val
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/10'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Min capacity for people */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600">Capacidade Mínima de Pessoas:</span>
                        <strong className="text-slate-800 font-bold">{minCapacity === 0 ? 'Qualquer tamanho' : `${minCapacity} pessoas ou mais`}</strong>
                      </div>
                      <div className="flex gap-1.5">
                        {[0, 2, 6, 12, 30].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setMinCapacity(num)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                              minCapacity === num
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            {num === 0 ? 'Tanto faz' : `${num}+`}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* Horizontal Categories Row (Only on Mobile/Tablet screens where vertical sidebar is hidden) */}
                <div className="flex lg:hidden gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setShowOnlyFavorites(false);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                      selectedCategory === 'all' && !showOnlyFavorites
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                        : 'bg-white border border-slate-200/60 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🌍 Todos os Itens
                  </button>

                  <button
                    onClick={() => {
                      setShowOnlyFavorites(!showOnlyFavorites);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      showOnlyFavorites
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/10 border border-red-500'
                        : 'bg-white border border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-white' : 'text-red-500'}`} />
                    <span>Meus Favoritos ({favorites.length})</span>
                  </button>

                  {categories.map((catObj) => {
                    const cat = catObj.id;
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10'
                            : 'bg-white border border-slate-200/60 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{catObj.emoji}</span>
                        <span>{catObj.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Listings Grid */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display font-semibold text-slate-800 text-sm">Ambientes para Alugar ({filteredEnvironments.length})</h3>
                    <span className="text-xs text-slate-400">Ar-condicionado e Wi-Fi inclusos por padrão</span>
                  </div>

                  {filteredEnvironments.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 my-4 max-w-md mx-auto">
                      <span className="text-2xl block mb-3">🔍</span>
                      <p className="text-xs font-semibold text-slate-600">Nenhum espaço condiz com os critérios.</p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Experimente resetar os filtros selecionados ou digite palavras chaves diferentes.</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setMaxPrice(300);
                          setMinCapacity(0);
                          setFilterDate('');
                          setShowOnlyFavorites(false);
                        }}
                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Resetar Filtros
                      </button>
                    </div>
                  ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEnvironments.map((env) => {
                    const isPromo = isPromotionActive(env);
                    return (
                      <article 
                        key={env.id} 
                        className={`bg-white rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-150 hover:shadow-lg hover:border-slate-300 group ${
                          isPromo
                            ? 'border-amber-300 ring-2 ring-amber-400/40 shadow-md shadow-amber-400/5 bg-gradient-to-b from-amber-50/10 to-transparent' 
                            : 'border-slate-150'
                        }`}
                      >
                        {/* Capa Image block */}
                        <div className="relative aspect-video overflow-hidden bg-slate-200 shrink-0">
                          <ImageSlider images={env.images} title={env.title} />
                          
                          {/* Price tag */}
                          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-mono text-xs font-bold flex items-center gap-0.5 animate-in slide-in-from-left-2 duration-120 z-10">
                            <span className="text-[9px] font-medium text-slate-300">R$</span> 
                            <span className="text-sm font-black">{env.pricePerHour}</span> 
                            <span className="text-[9px] font-medium text-slate-300">/diária</span>
                          </div>

                          {/* Video Tour Badge Indicator */}
                          {env.videoUrl && (
                            <div className="absolute top-14 left-3 bg-indigo-600/90 text-white backdrop-blur-xs px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md shadow-slate-900/10 flex items-center gap-1 z-10">
                              <span>🎥 Vídeo Tour</span>
                            </div>
                          )}
   
                          {/* Dynamic pricing badge indicator */}
                          {((env.weekendPricePerHour !== undefined && env.weekendPricePerHour > 0) || (env.customPricingRules && env.customPricingRules.length > 0)) && (
                            <div className="absolute bottom-3 left-3 bg-emerald-600/95 text-white backdrop-blur-xs px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md shadow-slate-900/10 flex items-center gap-1 animate-pulse z-10">
                              <Sparkles className="w-3 h-3 text-emerald-200" /> Tarifa Dinêmica Ativa
                            </div>
                          )}
   
                          {/* Sponsored Badge */}
                          {isPromo && (
                            <div className="absolute top-14 right-3 bg-amber-500 text-white shadow-md px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 z-10 animate-pulse">
                              <Star className="w-3 h-3 fill-white text-white" /> Patrocinado 👑
                            </div>
                          )}

                        {/* Category bubble */}
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 shadow-sm flex items-center gap-1 z-10">
                          <span>{getCategoryEmoji(env.category)}</span>
                          <span>{getCategoryLabel(env.category)}</span>
                        </div>

                        {/* FAVORITES HEART TRIGGER BUTTON */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleFavorite(env.id);
                          }}
                          className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-slate-500 hover:text-red-500 p-2 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-md flex items-center justify-center cursor-pointer z-10"
                          title={favorites.includes(env.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                          <Heart className={`w-3.5 h-3.5 transition-colors ${
                            favorites.includes(env.id) 
                              ? 'fill-red-500 text-red-500' 
                              : 'text-slate-400'
                          }`} />
                        </button>
                      </div>

                      {/* Info body */}
                      <div 
                        onClick={() => setBookingEnvironment(env)}
                        className="p-5 flex-1 flex flex-col justify-between space-y-4 cursor-pointer hover:bg-slate-50/40 transition-colors"
                        title="Clique para ver os detalhes completos e indisponibilidades"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                            <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> Máx {env.capacity} pes.</span>
                            <span>•</span>
                            <span className="truncate max-w-[150px] flex items-center gap-0.5"><Clock className="w-3 h-3" /> Horários flex</span>
                            
                            {filterDate && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-700 font-extrabold flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  ✓ Disponível dia {filterDate.split('-').reverse().slice(0, 2).join('/')}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Star Rating summary tag */}
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="flex items-center gap-0.5 bg-amber-50/70 text-amber-600 font-bold px-1.5 py-0.5 rounded border border-amber-100/50">
                              ⭐ {getAverageRating(env.id).avg.toFixed(1)}
                            </span>
                            <span className="text-slate-400 text-[10.5px]">
                              ({getAverageRating(env.id).count === 0 ? 'Novo' : `${getAverageRating(env.id).count} ${getAverageRating(env.id).count === 1 ? 'avaliação' : 'avaliações'}`})
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">{env.title}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{env.description}</p>
                        </div>

                        {/* Amenities lists summary */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {env.amenities.slice(0, 3).map((ame) => (
                            <span key={ame} className="text-[9px] font-semibold bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-md">
                              {ame}
                            </span>
                          ))}
                          {env.amenities.length > 3 && (
                            <span className="text-[9px] font-semibold bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded">
                              +{env.amenities.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Location address row */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                          <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <span className="truncate">{env.address}</span>
                        </div>

                        {/* Checkout button */}
                        <div className="space-y-2">
                          <button
                            onClick={() => setBookingEnvironment(env)}
                            className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 hover:shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Ver Disponibilidade & Reservar <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          {currentUser.role === 'admin' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveEnvironment(env.id);
                              }}
                              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-red-200"
                              title="Remover anúncio definitivamente como administrador"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir Anúncio (Admin)
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    )}

        {/* VIEW: CLIENT DYNAMIC RESERVATIONS HISTORY */}
        {currentTab === 'client_dash' && (
          <ClientDashboard
            reservations={reservations}
            environments={environments}
            onCancelReservation={handleCancelReservation}
            onApproveReservation={handleApproveReservation}
            onPayRemainder={handlePayRemainder}
            renterEmail={currentUser.email}
            onRequestCancelReservation={handleRequestCancelReservation}
            showConfirm={triggerConfirm}
            reviews={reviews}
            onAddReview={handleAddReview}
          />
        )}

        {/* VIEW: OWNER LISTINGS DYNAMIC WORKSPACE */}
        {currentTab === 'owner_dash' && (
          <OwnerDashboard
            environments={environments}
            reservations={reservations}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onRemoveEnvironment={handleRemoveEnvironment}
            onApproveReservation={handleApproveReservation}
            onCancelReservation={handleCancelReservation}
            onDeleteReservation={handleDeleteReservation}
            onCompleteReservation={handleCompleteReservation}
            onUpdateEnvironment={handleUpdateEnvironment}
            ownerId={currentUser.email}
            onRejectCancelRequest={handleRejectCancelRequest}
            categories={categories}
            showConfirm={triggerConfirm}
            promotionPricing={promotionPricing}
          />
        )}

        {/* VIEW: ADMIN PARTNERS AND SPONSORS DASHBOARD */}
        {currentTab === 'admin_dash' && (
          <AdminPartnersDashboard
            partners={partners}
            onAddPartner={handleAddPartner}
            onUpdatePartner={handleUpdatePartner}
            onDeletePartner={handleDeletePartner}
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onUpdateCategory={handleUpdateCategory}
            showConfirm={triggerConfirm}
            environments={environments}
            onUpdateEnvironment={handleUpdateEnvironment}
            promotionPricing={promotionPricing}
            onUpdatePromotionPricing={setPromotionPricing}
          />
        )}

      </main>

      {/* Main Page Footer */}
      <footer className="mt-12 bg-white border-t border-slate-150 py-8 px-4 text-center text-xs text-slate-400 space-y-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="font-semibold text-[#0E5A60]">© 2026 Aluga ITB — Aluguel de Espaços para Eventos Itaituba. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-4">
            <span className="hover:underline cursor-pointer hover:text-[#0E5A60] transition-colors">Termos de Uso</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer hover:text-[#0E5A60] transition-colors">Diretrizes de Locação</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer hover:text-[#0E5A60] transition-colors">Anunciar Espaço</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-300 italic">Aluga ITB - Conectando os melhores salões, quadras, sítios e espaços de Itaituba aos organizadores de eventos.</p>
      </footer>

      {/* OVERLAY MODAL: ADD / ANNOUNCE NEW ENVIRONMENT (for hosts) */}
      {isAddModalOpen && (
        <AddEnvironmentModal
          currentUser={currentUser}
          categories={categories}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddEnvironment}
        />
      )}

      {/* OVERLAY MODAL: CHECKOUT BOOKING AND PIX PROCESS (for renters) */}
      {bookingEnvironment && (
        <ReservationModal
          environment={bookingEnvironment}
          reservations={reservations}
          userEmail={currentUser.email}
          userName={currentUser.name}
          onClose={() => setBookingEnvironment(null)}
          onCompleteReservation={handleCompleteReservation}
          initialSelectedDate={filterDate}
          partners={partners}
          reviews={reviews}
        />
      )}

      {/* LOGIN MODAL COMPONENT */}
      {isLoginModalOpen && (
        <LoginModal 
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLogin}
        />
      )}

      {/* CUSTOM OVERLAY MODAL: BEAUTIFUL RELIABLE CONFIRMATION */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl shrink-0 ${confirmConfig.isDanger ? 'bg-red-50 text-red-650 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                {confirmConfig.isDanger ? <AlertTriangle className="w-5 h-5 animate-bounce" /> : <Info className="w-5 h-5 text-emerald-600" />}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-850">{confirmConfig.title}</h4>
                <p className="text-xs text-slate-400 leading-normal">{confirmConfig.message}</p>
              </div>
            </div>
            
            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-250/50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => confirmConfig.onConfirm()}
                className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
                  confirmConfig.isDanger 
                    ? 'bg-red-600 hover:bg-red-700 active:scale-98' 
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
                }`}
              >
                Prosseguir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
