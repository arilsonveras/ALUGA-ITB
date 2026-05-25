import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Check, X, Calendar, Clock, Sparkles, Building, Trash2, TrendingUp, DollarSign, Edit2, AlertTriangle, Copy, Megaphone, Star, CalendarDays, RefreshCw, Unplug } from 'lucide-react';
import { Environment, Reservation, PromotionPricing } from '../types';
import OwnerCalendarModal from './OwnerCalendarModal';
import EditEnvironmentModal from './EditEnvironmentModal';
import { generatePixPayload } from '../utils/pix';
import {
  signInWithGoogle,
  disconnectGoogle,
  fetchUserCalendars,
  createGoogleCalendarEvent,
  GoogleCalendar,
  getCachedToken,
  auth
} from '../utils/googleCalendar';


interface OwnerDashboardProps {
  environments: Environment[];
  reservations: Reservation[];
  onOpenAddModal: () => void;
  onRemoveEnvironment: (id: string) => void;
  onApproveReservation: (id: string) => void;
  onCancelReservation: (id: string) => void;
  onDeleteReservation?: (id: string) => void;
  onCompleteReservation: (newReservation: Reservation) => void;
  onUpdateEnvironment: (updatedEnv: Environment) => void;
  ownerId: string;
  onRejectCancelRequest?: (id: string) => void;
  categories: { id: string; name: string; emoji: string }[];
  showConfirm?: (title: string, message: string, onConfirm: () => void, isDanger?: boolean) => void;
  promotionPricing?: PromotionPricing;
}

export default function OwnerDashboard({
  environments,
  reservations,
  onOpenAddModal,
  onRemoveEnvironment,
  onApproveReservation,
  onCancelReservation,
  onDeleteReservation,
  onCompleteReservation,
  onUpdateEnvironment,
  ownerId,
  onRejectCancelRequest,
  categories,
  showConfirm,
  promotionPricing
}: OwnerDashboardProps) {

  // Filter environments and reservations belonging to this host. Admin sees and can modify/delete ALL of them!
  const myEnvironments = ownerId === 'admin@alugaambiente.com.br' ? environments : environments.filter((env) => env.ownerId === ownerId);
  const myEnvironmentIds = myEnvironments.map((env) => env.id);
  const myIncomingReservationsRaw = ownerId === 'admin@alugaambiente.com.br' ? reservations : reservations.filter((res) => myEnvironmentIds.includes(res.environmentId));

  // Sort from closest date/time to furthest date/time (chronological ascending)
  const myIncomingReservations = [...myIncomingReservationsRaw].sort((a, b) => {
    const dateTimeA = `${a.date}T${a.startTime || '00:00'}`;
    const dateTimeB = `${b.date}T${b.startTime || '00:00'}`;
    return dateTimeA.localeCompare(dateTimeB);
  });

  // Quick stats calculations
  const totalListed = myEnvironments.length;
  const confirmedReservations = myIncomingReservations.filter((res) => res.status === 'confirmed');
  const pendingReservations = myIncomingReservations.filter((res) => res.status === 'pending_payment');
  
  // Real received earnings (amounts actually paid by users)
  const totalEarnings = confirmedReservations.reduce((acc, curr) => acc + (curr.paidAmount ?? curr.totalPrice), 0);
  
  // Remaining unpaid balance of confirmed reservations
  const remainingConfirmedBalance = confirmedReservations.reduce((acc, curr) => acc + (curr.totalPrice - (curr.paidAmount ?? curr.totalPrice)), 0);
  
  // Potential earnings from reservations awaiting initial payment
  const pendingReservationsPrice = pendingReservations.reduce((acc, curr) => acc + curr.totalPrice, 0);
  
  // Future earnings (reservas) include both the pending reservations AND the unpaid balance of confirmed reservations
  const projectedEarnings = pendingReservationsPrice + remainingConfirmedBalance;

  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  const handleRequestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          new Notification('🔔 Notificações Ativadas!', {
            body: 'Excelente! Você receberá avisos automáticos de novas locações e pedidos de cancelamento.',
          });
        }
      });
    }
  };

  const handleConfirm = (title: string, msg: string, onOk: () => void, isDanger = false) => {
    if (showConfirm) {
      showConfirm(title, msg, onOk, isDanger);
    } else {
      if (confirm(msg)) onOk();
    }
  };
  
  // Selected environment for managing the agenda calendar / manual reserve blocks
  const [selectedEnvForCalendar, setSelectedEnvForCalendar] = useState<Environment | null>(null);

  // Google Calendar Integration states
  const [googleConnectedEmail, setGoogleConnectedEmail] = useState<string | null>(() => {
    return localStorage.getItem('aluga_itb_google_connected_email');
  });
  const [googleToken, setGoogleToken] = useState<string | null>(() => getCachedToken());
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>(() => {
    return localStorage.getItem('aluga_itb_google_selected_calendar') || 'primary';
  });
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return localStorage.getItem('aluga_itb_google_auto_sync') === 'true';
  });
  const [syncedReservations, setSyncedReservations] = useState<{ [resId: string]: string }>(() => {
    const saved = localStorage.getItem('aluga_itb_synced_reservations');
    return saved ? JSON.parse(saved) : {};
  });
  const [syncStatus, setSyncStatus] = useState<{ [resId: string]: 'idle' | 'syncing' | 'success' | 'error' }>({});
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  // Load calendars list whenever we have a token
  useEffect(() => {
    if (googleToken) {
      fetchUserCalendars(googleToken).then((list) => {
        setGoogleCalendars(list);
        if (list.length > 0 && !list.some(c => c.id === selectedCalendarId)) {
          const primaryCal = list.find(c => c.primary)?.id || list[0].id;
          setSelectedCalendarId(primaryCal);
          localStorage.setItem('aluga_itb_google_selected_calendar', primaryCal);
        }
      });
    }
  }, [googleToken, selectedCalendarId]);

  // Persist settings changes
  const handleToggleAutoSync = (checked: boolean) => {
    setAutoSync(checked);
    localStorage.setItem('aluga_itb_google_auto_sync', checked ? 'true' : 'false');
  };

  const handleSelectCalendar = (id: string) => {
    setSelectedCalendarId(id);
    localStorage.setItem('aluga_itb_google_selected_calendar', id);
  };

  // Connect Google account flow
  const handleConnectGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      if (result) {
        setGoogleConnectedEmail(result.user.email);
        setGoogleToken(result.accessToken);
        if (showConfirm) {
          // Provide instant friendly feedback
          alert(`Google Agenda vinculado à conta ${result.user.email} com sucesso!`);
        }
      }
    } catch (err: any) {
      alert(`Erro ao vincular Google Agenda: ${err.message || err}`);
    }
  };

  // Disconnect Google flow
  const handleDisconnectGoogle = async () => {
    handleConfirm(
      'Desvincular Google Agenda',
      'Tem certeza de que deseja desvincular sua conta Google e desativar a sincronização automática de compromissos?',
      async () => {
        await disconnectGoogle();
        setGoogleConnectedEmail(null);
        setGoogleToken(null);
        setGoogleCalendars([]);
      }
    );
  };

  // Sync a single reservation to Google Calendar
  const handleSyncReservationToGoogle = async (res: Reservation) => {
    if (!googleToken) {
      alert('Sua conta do Google não está conectada. Por favor, conecte para sincronizar.');
      return;
    }

    const env = environments.find(e => e.id === res.environmentId);
    if (!env) {
      alert('Espaço correspondente não encontrado.');
      return;
    }

    // Check if already synced
    if (syncedReservations[res.id]) {
      const reSync = window.confirm(`Esta reserva já está sincronizada no Google Agenda. Deseja recriar o evento na agenda selecionada?`);
      if (!reSync) return;
    } else {
      // Must prompt user before executing mutating call to protect user data (as per Workspace integration rules)
      const proceed = window.confirm(`Deseja criar um evento na sua agenda "${googleCalendars.find(c => c.id === selectedCalendarId)?.summary || 'Selecionada'}" para a reserva de ${res.renterName} no dia ${res.date.split('-').reverse().join('/')}?`);
      if (!proceed) return;
    }

    setSyncStatus(prev => ({ ...prev, [res.id]: 'syncing' }));

    const response = await createGoogleCalendarEvent(googleToken, selectedCalendarId, res, env);

    if (response.success && response.eventId) {
      const updatedSyncs = { ...syncedReservations, [res.id]: response.eventId };
      setSyncedReservations(updatedSyncs);
      localStorage.setItem('aluga_itb_synced_reservations', JSON.stringify(updatedSyncs));
      setSyncStatus(prev => ({ ...prev, [res.id]: 'success' }));
    } else {
      setSyncStatus(prev => ({ ...prev, [res.id]: 'error' }));
      alert(`Falha ao sincronizar: ${response.error || 'Erro desconhecido'}`);
    }
  };

  // Sync all approved and unsynced reservations in bulk
  const handleBulkSyncReservations = async () => {
    if (!googleToken) return;

    // Filter confirmed reservations that are not synced yet
    const unsynced = myIncomingReservations.filter(res => res.status === 'confirmed' && !syncedReservations[res.id]);
    if (unsynced.length === 0) {
      alert('Todas as reservas confirmadas já estão sincronizadas!');
      return;
    }

    const proceed = window.confirm(`Deseja sincronizar em lote ${unsynced.length} reserva(s) confirmada(s) para sua Agenda do Google agora?`);
    if (!proceed) return;

    setIsBulkSyncing(true);
    let successCount = 0;
    const newSynced = { ...syncedReservations };

    for (const res of unsynced) {
      const env = environments.find(e => e.id === res.environmentId);
      if (!env) continue;

      setSyncStatus(prev => ({ ...prev, [res.id]: 'syncing' }));
      const response = await createGoogleCalendarEvent(googleToken, selectedCalendarId, res, env);
      if (response.success && response.eventId) {
        newSynced[res.id] = response.eventId;
        setSyncStatus(prev => ({ ...prev, [res.id]: 'success' }));
        successCount++;
      } else {
        setSyncStatus(prev => ({ ...prev, [res.id]: 'error' }));
      }
    }

    setSyncedReservations(newSynced);
    localStorage.setItem('aluga_itb_synced_reservations', JSON.stringify(newSynced));
    setIsBulkSyncing(false);

    alert(`Sincronização concluída! ${successCount} de ${unsynced.length} reservas inseridas com sucesso na sua agenda.`);
  };

  // Automatic sync hook trigger on new confirmed reservation approvals!
  useEffect(() => {
    if (autoSync && googleToken && myIncomingReservations.length > 0) {
      // Find newly confirmed reservations that aren't on Google space yet
      const unsyncedConfirmed = myIncomingReservations.filter(
        res => res.status === 'confirmed' && !syncedReservations[res.id] && syncStatus[res.id] !== 'syncing' && syncStatus[res.id] !== 'success'
      );

      if (unsyncedConfirmed.length > 0) {
        unsyncedConfirmed.forEach(async (res) => {
          const env = environments.find(e => e.id === res.environmentId);
          if (env) {
            setSyncStatus(prev => ({ ...prev, [res.id]: 'syncing' }));
            const response = await createGoogleCalendarEvent(googleToken, selectedCalendarId, res, env);
            if (response.success && response.eventId) {
              setSyncedReservations(prev => {
                const next = { ...prev, [res.id]: response.eventId! };
                localStorage.setItem('aluga_itb_synced_reservations', JSON.stringify(next));
                return next;
              });
              setSyncStatus(prev => ({ ...prev, [res.id]: 'success' }));
            } else {
              setSyncStatus(prev => ({ ...prev, [res.id]: 'error' }));
            }
          }
        });
      }
    }
  }, [myIncomingReservationsRaw, googleToken, autoSync, selectedCalendarId]);

  
  // Selected environment for editing custom features / pricing rules
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  
  // Custom states for tracking location/space promotion actions (like Google local ads)
  const [promotingEnvId, setPromotingEnvId] = useState<string | null>(null);
  const [copiedPromoId, setCopiedPromoId] = useState<string | null>(null);

  // Dynamic promo day counts chosen by host per venue
  const [promoPeriod, setPromoPeriod] = useState<{ [envId: string]: number }>({});

  const getPromoPriceForDays = (envId: string): number => {
    // default to 30 days if not chosen yet
    const days = promoPeriod[envId] || 30;
    const pricing = promotionPricing || {
      dailyRate: 3.50,
      rate7Days: 20.00,
      rate15Days: 35.00,
      rate30Days: 60.00,
      rate90Days: 150.00,
      rate365Days: 500.00
    };

    switch (days) {
      case 1: return pricing.dailyRate;
      case 7: return pricing.rate7Days;
      case 15: return pricing.rate15Days;
      case 30: return pricing.rate30Days;
      case 90: return pricing.rate90Days;
      case 365: return pricing.rate365Days;
      default: return pricing.dailyRate * days;
    }
  };
  
  const getEnvTitle = (id: string) => {
    const found = myEnvironments.find((e) => e.id === id);
    return found ? found.title : 'Espaço Desconhecido';
  };
  const getEnvCap = (id: string) => {
    const found = myEnvironments.find((e) => e.id === id);
    return found ? found.capacity : 0;
  };

  const getCategoryBadgeDetails = (cat: string) => {
    const matched = categories.find(c => c.id === cat);
    if (matched) {
      let bg = 'bg-slate-50 border-slate-150';
      let text = 'text-slate-700';
      if (cat === 'party') { bg = 'bg-emerald-50 border-emerald-150'; text = 'text-emerald-700'; }
      else if (cat === 'meeting') { bg = 'bg-indigo-50 border-indigo-150'; text = 'text-indigo-700'; }
      else if (cat === 'studio') { bg = 'bg-purple-50 border-purple-150'; text = 'text-purple-700'; }
      else if (cat === 'office') { bg = 'bg-sky-50 border-sky-150'; text = 'text-sky-700'; }
      else if (cat === 'classroom') { bg = 'bg-amber-50 border-amber-150'; text = 'text-amber-700'; }
      else if (cat === 'consulting') { bg = 'bg-rose-50 border-rose-150'; text = 'text-rose-700'; }
      return { label: matched.name, bg, text, emoji: matched.emoji };
    }
    return { label: cat, bg: 'bg-slate-50 border-slate-150', text: 'text-slate-700', emoji: '🚪' };
  };

  return (
    <div className="space-y-6">
      
      {/* Intro banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-md relative overflow-hidden">
        {/* Abstract design elements matching high design philosophy */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800/40">Painel do Anunciante</span>
          <h2 className="text-xl font-display font-semibold mt-1.5">Gerencie seus Ambientes de Locação</h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-lg">Crie novos anúncios de espaços comerciais, configure períodos de vigência, anexe cláusulas contratuais personalizadas e veja seus proventos acumulados via PIX.</p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center gap-1.5 relative z-10 active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Anunciar Novo Local
        </button>
      </div>

      {/* Browser Notification Banner */}
      {notificationPermission !== 'granted' && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/25 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200 shadow-xs relative overflow-hidden group">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/5 to-transparent pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex gap-3 items-center">
            <span className="text-2xl p-2 bg-white/80 border border-slate-100 rounded-xl leading-none flex items-center justify-center shadow-xs">🔔</span>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                Ativar Notificações do Navegador 
                <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-95">Recomendado</span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
                Deseja ser alertado instantaneamente quando um cliente <strong>alugar um de seus espaços</strong> ou <strong>solicitar o cancelamento</strong> de uma reserva ativa?
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestNotificationPermission}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 hover:shadow-md hover:shadow-slate-900/10 active:scale-98"
          >
            Habilitar Notificações
          </button>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Gross Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Faturamento Confirmado (Recebido)</span>
            <p className="text-2xl font-bold font-mono text-emerald-700">
              R$ {totalEarnings.toFixed(2).replace('.', ',')}
            </p>
            <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md w-fit">
              <TrendingUp className="w-3 h-3" /> Já pago via PIX pelos clientes
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold">
            R$
          </div>
        </div>

        {/* Card 2: Projected Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Ganhos Futuros (Reservados / Saldos)</span>
            <p className="text-2xl font-bold font-mono text-indigo-700">
              R$ {projectedEarnings.toFixed(2).replace('.', ',')}
            </p>
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-400 font-medium">
                ⏱️ {pendingReservations.length} pendente(s) de Pix Inicial: <span className="font-bold text-slate-600">R$ {pendingReservationsPrice.toFixed(2).replace('.', ',')}</span>
              </p>
              {remainingConfirmedBalance > 0 && (
                <p className="text-[10px] text-sky-600 font-bold flex items-center gap-0.5">
                  🛡️ Saldo Restante a receber (Sinal 50%): <span className="font-mono bg-sky-50 px-1 py-0.2 rounded font-extrabold text-[10px] text-sky-800">R$ {remainingConfirmedBalance.toFixed(2).replace('.', ',')}</span>
                </p>
              )}
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Active listings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Ambientes Ativos</span>
            <p className="text-2xl font-bold font-mono text-slate-800">{totalListed}</p>
            <span className="text-[10px] text-slate-400">Totalmente anunciados ao público</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Booking statistics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Reservas do Mês</span>
            <p className="text-2xl font-bold font-mono text-slate-800">{myIncomingReservations.length}</p>
            <span className="text-[10px] text-slate-400">Taxa de conversão: 100%</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* GOOGLE CALENDAR COUPLING & SYNCHRONIZER */}
      <div className="bg-slate-50 border border-slate-200/85 rounded-2xl p-6 space-y-5 shadow-xs relative overflow-hidden">
        {/* Background design accents similar to premium high design philosophy */}
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-150 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl leading-none flex items-center justify-center shadow-xs">
              📅
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                Integração com Google Agenda (Host)
                {googleConnectedEmail ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Ativo / Vinculado
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase">
                    Inativo
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-500 leading-normal mt-0.5">
                Vincule o Google Agenda do anfitrião às reservas efetuadas pelos clientes para agendar e bloquear compromissos automaticamente.
              </p>
            </div>
          </div>

          {!googleConnectedEmail ? (
            <button
              onClick={handleConnectGoogle}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 font-display transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.63 5.63 0 018.35 12.87a5.63 5.63 0 015.641-5.638c2.455 0 4.418 1.545 5.166 3.636l3.961-3.07C21.14 4.5 17.877 2 13.991 2 7.369 2 2 7.37 2 14s5.369 12 11.991 12c6.91 0 12.009-4.86 12.009-12 0-.825-.075-1.5-.225-2.285h-13.535z"/>
              </svg>
              Conectar Google Agenda
            </button>
          ) : (
            <button
              onClick={handleDisconnectGoogle}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 transition-all"
            >
              <Unplug className="w-3.5 h-3.5" />
              Desvincular Conta
            </button>
          )}
        </div>

        {googleConnectedEmail ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Calendar list and autosync controls */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
              <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Configurações da Agenda de Destino
              </h5>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Conta Google Integrada:
                  </label>
                  <p className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    {googleConnectedEmail}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Selecionar Agenda para Reservas
                  </label>
                  {googleCalendars.length === 0 ? (
                    <div className="text-slate-400 text-xs py-2 flex items-center gap-2 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Carregando agendas...
                    </div>
                  ) : (
                    <select
                      value={selectedCalendarId}
                      onChange={(e) => handleSelectCalendar(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {googleCalendars.map((cal) => (
                        <option key={cal.id} value={cal.id}>
                          {cal.summary} {cal.primary ? '(Principal)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Sincronização Automática
                    </label>
                    <span className="text-[10px] text-slate-400 block leading-normal">
                      Insere automaticamente as reservas na sua agenda assim que o Pix do cliente for confirmado / liberado.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => handleToggleAutoSync(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Sync summary & bulk action */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div className="space-y-3">
                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Painel de Sincronização
                </h5>
                <div className="space-y-2 text-slate-600 text-[11px] leading-relaxed">
                  <p className="flex justify-between border-b border-slate-50 pb-1">
                    <span>👥 Total de Reservas Recebidas:</span>
                    <strong className="text-slate-800">{myIncomingReservations.length}</strong>
                  </p>
                  <p className="flex justify-between border-b border-slate-50 pb-1">
                    <span>✅ Reservas Confirmadas (Pagas):</span>
                    <strong className="text-slate-800">{confirmedReservations.length}</strong>
                  </p>
                  <p className="flex justify-between border-b border-slate-50 pb-1">
                    <span>🌟 Já inseridas no Google Calendar:</span>
                    <strong className="text-emerald-700 font-extrabold font-mono">
                      {confirmedReservations.filter((r) => syncedReservations[r.id]).length}
                    </strong>
                  </p>
                  <p className="flex justify-between">
                    <span>⏳ Pendentes de Inserção:</span>
                    <strong className="text-amber-700 font-extrabold font-mono">
                      {confirmedReservations.filter((r) => !syncedReservations[r.id]).length}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={handleBulkSyncReservations}
                  disabled={isBulkSyncing || confirmedReservations.filter((r) => !syncedReservations[r.id]).length === 0}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBulkSyncing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sincronizando reservas...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Tudo Pendente Agora
                    </>
                  )}
                </button>
                <p className="text-[9px] text-slate-400 text-center leading-normal">
                  Sincronização em tempo real segura. As reservas contam com lembretes automáticos criados no seu calendário do celular de 1 dia e 1 hora antes de iniciar o aluguel.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-slate-150 flex items-start gap-3">
            <span className="text-base">💡</span>
            <p className="text-[11px] text-slate-500 leading-normal font-sans">
              <strong>Como funciona?</strong> Vincule sua Agenda do Google com o Aluga ITB para importar seus compromissos e agendar automaticamente as locações de clientes. Evite sobreposições indesejadas e gerencie seu negócio de espaços e eventos diretamente do seu aplicativo de calendário de preferência.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 1: MEUS ANÚNCIOS (AMPLO & DETALHADO) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-150">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-display font-semibold text-slate-800 text-sm">Meus Ambientes Anunciados</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Gerencie seus espaços disponíveis, edite taxas, regras ou acesse o calendário individual para bloquear datas e agendar manualmente.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg shrink-0">
            {myEnvironments.length} {myEnvironments.length === 1 ? 'espaço ativo' : 'espaços ativos'}
          </span>
        </div>

        {myEnvironments.length === 0 ? (
          <div className="text-center py-10 space-y-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <Building className="w-8 h-8 text-slate-350 mx-auto" />
            <div className="space-y-1">
              <p className="text-slate-500 text-xs font-semibold">Nenhum anúncio cadastrado ainda neste perfil.</p>
              <p className="text-[10px] text-slate-400">Uma vez criado seu primeiro anúncio comercial, os detalhes aparecerão de forma completa aqui!</p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Anunciar Novo Local
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myEnvironments.map((env) => {
              const badge = getCategoryBadgeDetails(env.category);
              return (
                <div 
                  key={env.id} 
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between transition-all hover:border-slate-350 hover:shadow-sm"
                >
                  <div>
                    {/* Imagem do Espaço em Destaque */}
                    <div className="relative h-44 w-full bg-slate-100">
                      <img 
                        src={env.images[0]} 
                        alt={env.title} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border shadow-xs bg-white ${badge.text} ${badge.bg}`}>
                          {badge.emoji} {badge.label}
                        </span>
                        <span className="text-[9.5px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md shadow-xs">
                          👥 Cap: {env.capacity} pessoas
                        </span>
                      </div>
                    </div>

                    {/* Conteúdo Informativo */}
                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{env.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{env.description}</p>
                      
                      {/* Valores */}
                      <div className="flex items-center gap-1.5 text-xs pt-1">
                        <span className="text-slate-400 font-semibold uppercase text-[9px]">Taxa de Aluguel:</span>
                        <span className="text-emerald-700 font-black font-mono text-xs">R$ {env.pricePerHour.toFixed(2)}/diária</span>
                        {env.weekendPricePerHour && (
                          <span className="text-indigo-600 font-bold font-mono text-[10.5px]">
                            • Fim de semana: R$ {env.weekendPricePerHour.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BLOCO DA AGENDA - Altamente Visível e Explicado */}
                  <div className="px-4 pb-4 space-y-3">
                    <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                          📅 Agenda & Lançamento de Bloqueios
                        </span>
                        <p className="text-[10.5px] text-slate-500 leading-normal">
                          Deseja fechar datas indisponíveis, planejar manutenções ou agendar locações de outros canais (como telefone)? Acesse o calendário!
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedEnvForCalendar(env)}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-700"
                        title="Ver Agenda / Agendar Manual ou Bloquear"
                      >
                        <Calendar className="w-4 h-4 shrink-0" />
                        Gerenciar Agenda & Bloquear Dias
                      </button>
                    </div>

                    {/* BLOCO DE PROMOÇÃO / ANÚNCIO (ESTILO GOOGLE ADS) */}
                    <div className="p-3.5 rounded-xl border border-slate-150 space-y-2.5 transition-all text-left">
                      {env.isPromoted && env.promotionStatus === 'active' ? (
                        <div className="bg-amber-50/70 border-amber-200 text-amber-900 rounded-lg p-2.5 space-y-1.5 ring-2 ring-amber-400/20">
                          <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-amber-850">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            Anúncio Patrocinado Ativo 👑
                          </div>
                          <p className="text-[10px] leading-relaxed text-slate-600">
                            Este espaço está habilitado para aparecer no <strong>topo dos resultados de busca</strong> e destaque na página inicial, igual o Google Ads faz!
                          </p>
                          {env.promotionExpiresAt && (
                            <div className="text-[9.5px] p-1.5 bg-amber-100/40 border border-amber-200/50 text-amber-900 rounded-md font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                              <span>Expira em: {env.promotionExpiresAt.split('-').reverse().join('/')} ({env.promotionDaysLimit || 30} dias)</span>
                            </div>
                          )}
                          <div className="text-[9px] font-mono font-semibold text-slate-400 flex justify-between items-center pt-1 border-t border-slate-100">
                            <span>Taxa de Destaque:</span>
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">R$ {env.promotionFeePaid || 75},00 (Pago)</span>
                          </div>
                        </div>
                      ) : env.promotionStatus === 'pending' ? (
                        <div className="bg-sky-50/70 border-sky-150 text-sky-900 rounded-lg p-2.5 space-y-1.5 animate-pulse">
                          <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-sky-850">
                            <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            Aprovação Pendente no ADM ⏳
                          </div>
                          <p className="text-[10px] leading-relaxed text-slate-600 font-medium">
                            Você solicitou a promoção deste ambiente e pagou a taxa recomendada de <strong>R$ {(env.promotionFeePaid ?? 75.00).toFixed(2)} via PIX</strong> ({env.promotionDaysLimit || 30} dias). Aguarde a validação do ADM para ativar o topo.
                          </p>
                          <div className="text-[9px] text-sky-700 font-bold bg-sky-100/50 py-1 px-1.5 rounded text-center">
                            🛡️ Identificação de Pix registrada no portal
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border-slate-200 text-slate-800 rounded-lg p-2.5 space-y-2">
                          <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-slate-700">
                            <Megaphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            Promover Local no Topo das Buscas ⚡
                          </div>
                          <p className="text-[10px] leading-relaxed text-slate-500">
                            Coloque este ambiente no topo das pesquisas e na tela principal do portal por uma pequena taxa mensal. Ganhe até <strong className="text-emerald-600">5x mais visibilidade</strong>!
                          </p>

                          {promotingEnvId === env.id ? (
                            <div className="space-y-2.5 pt-2 border-t border-slate-200/60 animate-in slide-in-from-top-1">
                              
                              <div className="space-y-1">
                                <label className="block text-[9.5px] uppercase font-bold text-slate-550">Escolha o período do Destaque:</label>
                                <select
                                  value={promoPeriod[env.id] || 30}
                                  onChange={(e) => setPromoPeriod({ ...promoPeriod, [env.id]: Number(e.target.value) })}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-850"
                                >
                                  <option value={1}>1 Diária (R$ {(promotionPricing?.dailyRate || 3.50).toFixed(2)})</option>
                                  <option value={7}>7 Dias (R$ {(promotionPricing?.rate7Days || 20.00).toFixed(2)})</option>
                                  <option value={15}>15 Dias (R$ {(promotionPricing?.rate15Days || 35.00).toFixed(2)})</option>
                                  <option value={30}>30 Dias (R$ {(promotionPricing?.rate30Days || 60.00).toFixed(2)})</option>
                                  <option value={90}>90 Dias (R$ {(promotionPricing?.rate90Days || 150.00).toFixed(2)})</option>
                                  <option value={365}>365 Dias (R$ {(promotionPricing?.rate365Days || 500.00).toFixed(2)})</option>
                                </select>
                              </div>

                              <div className="p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 text-[9px] text-indigo-900 font-medium">
                                <span className="font-bold block text-indigo-950">💡 Como Funciona:</span>
                                Pague o valor de veiculação (R$ {getPromoPriceForDays(env.id).toFixed(2)}) via PIX e o Administrador habilitará o destaque imediatamente.
                              </div>

                              <div className="text-center space-y-1">
                                <span className="text-[9px] uppercase font-bold text-slate-400">Código de Pagamento PIX Copia e Cola</span>
                                <span className="block text-[8.5px] bg-slate-105 p-1.5 rounded border border-slate-200 break-all select-all font-mono text-slate-600 text-left">
                                  {generatePixPayload('admin@alugaambiente.com.br', getPromoPriceForDays(env.id), `PROM-${env.id}`, 'PROMOTOCO')}
                                </span>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const code = generatePixPayload('admin@alugaambiente.com.br', getPromoPriceForDays(env.id), `PROM-${env.id}`, 'PROMOTOCO');
                                    navigator.clipboard.writeText(code);
                                    setCopiedPromoId(env.id);
                                    setTimeout(() => setCopiedPromoId(null), 2000);
                                  }}
                                  className="flex-1 py-1 px-2 bg-white hover:bg-slate-55 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {copiedPromoId === env.id ? 'Copiado! ✅' : 'Copiar PIX 📋'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentCost = getPromoPriceForDays(env.id);
                                    onUpdateEnvironment({
                                      ...env,
                                      promotionStatus: 'pending',
                                      promotionFeePaid: currentCost,
                                      promotionDaysLimit: promoPeriod[env.id] || 30,
                                      isPromoted: true // default helper flag
                                    });
                                    setPromotingEnvId(null);
                                  }}
                                  className="flex-1 py-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                >
                                  Confirmar Pago (PIX)
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setPromoPeriod({ ...promoPeriod, [env.id]: 30 });
                                setPromotingEnvId(env.id);
                              }}
                              className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              🚀 Quero Anunciar no Topo (A partir de R$ {(promotionPricing?.dailyRate || 3.50).toFixed(2)})
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Ações de Gestão de Anúncio normais */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">ID: {env.id}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingEnv(env)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => onRemoveEnvironment(env.id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                          title="Remover este anúncio definitivamente"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: CONTROLE DE RESERVAS RECEBIDAS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4 shadow-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-sm">Controle de Reservas Recebidas</h3>
            <p className="text-xs text-slate-400">Gerencie contatos e confirmados de clientes</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">{myIncomingReservations.length} total</span>
        </div>

        {myIncomingReservations.length === 0 ? (
          <div className="text-center py-12 space-y-2 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-400 text-xs font-semibold">Nenhum cliente agendou seus recintos ainda.</p>
            <p className="text-[10px] text-slate-400">Uma vez que usuários normais efetuarem reservas por PIX, elas aparecerão aqui!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myIncomingReservations.map((res) => (
              <div key={res.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      res.status === 'confirmed' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : res.status === 'pending_payment'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {res.status === 'confirmed' ? 'PAGO / CONFIRMADO' : res.status === 'pending_payment' ? 'AGUARDANDO PIX' : 'CANCELADO'}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{getEnvTitle(res.environmentId)}</span>
                  </div>

                  <div className="grid grid-cols-1 md:flex md:items-center md:flex-wrap gap-x-4 gap-y-1.5 text-slate-500 text-[11px] mt-1.5">
                    <span className="font-medium flex items-center gap-1">👤 Renter: <strong className="text-slate-700">{res.renterName}</strong></span>
                    <span className="font-medium flex items-center gap-1">🗓️ Dia: <strong className="text-slate-700">{res.date.split('-').reverse().join('/')}</strong></span>
                    <span className="font-medium flex items-center gap-1">🕒 Período: <strong className="text-slate-700">{res.startTime} - {res.endTime}</strong></span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono bg-slate-200/50 px-1.5 py-0.5 rounded text-emerald-700 font-bold" title="Valor Total da Reserva">Total: R$ {res.totalPrice.toFixed(2)}</span>
                      <span className={`px-1.5 py-0.5 rounded font-extrabold text-[9px] border uppercase ${
                        res.paymentOption === 'minimum'
                          ? 'bg-amber-50 text-amber-800 border-amber-250'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-250'
                      }`}>
                        {res.paymentOption === 'minimum'
                          ? `Sinal 50% Pago (R$ ${(res.totalPrice / 2).toFixed(2)}) • Restante no Evento (R$ ${(res.totalPrice / 2).toFixed(2)})`
                          : 'Integral 100% Pago'}
                      </span>
                    </div>
                  </div>

                  {res.status === 'confirmed' && res.selectedPartnerIds && res.selectedPartnerIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-wide bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        🌟 Adicionais:
                      </span>
                      {res.selectedPartnerIds.map(partnerId => {
                        const savedPartnersRaw = localStorage.getItem('aluguel_parceiros');
                        const allPartners: any[] = savedPartnersRaw ? JSON.parse(savedPartnersRaw) : [];
                        const partner = allPartners.find(p => p.id === partnerId);
                        if (!partner) return null;
                        return (
                          <span 
                            key={partnerId} 
                            className="text-[9.5px] font-semibold bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded cursor-help" 
                            title={`${partner.description} • Fone: ${partner.phone} (${partner.contactName})`}
                          >
                            {partner.name} ({partner.category === 'decor' ? 'Decoração' : partner.category === 'buffet' ? 'Buffet' : 'Serviço'})
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions depending on state */}
                {res.status === 'pending_payment' && (
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-end md:self-auto">
                    <button
                      onClick={() => {
                        handleConfirm(
                          'Cancelar / Recusar Reserva',
                          'Tem certeza de que deseja CANCELAR / RECUSAR esta reserva pendente de pagamento? O slot de data e hora correspondente será liberado imediatamente.',
                          () => {
                            onCancelReservation(res.id);
                          },
                          true
                        );
                      }}
                      className="px-2.5 py-1.5 bg-white border border-red-250 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="Registrar desistência ou cancelar reserva pendente de PIX"
                    >
                      <X className="w-3.5 h-3.5" /> Cancelar / Recusar Reserva
                    </button>
                    <button
                      onClick={() => {
                        handleConfirm(
                          'Confirmar Recebimento Pix',
                          'Você confirma que conferiu seu extrato bancário e realmente recebeu o pagamento PIX para esta reserva? Ao confirmar, o agendamento será ativado.',
                          () => {
                            onApproveReservation(res.id);
                          }
                        );
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer border border-emerald-700"
                      title="Afirmar que o PIX foi verificado e recebido com sucesso"
                    >
                      <Check className="w-3.5 h-3.5" /> Confirmar Pagamento Pix (Recebido)
                    </button>
                  </div>
                )}

                {res.status === 'confirmed' && (
                  res.cancelRequested ? (
                    <div className="text-xs text-slate-500 font-medium flex flex-col gap-2 bg-amber-50 border border-amber-200 p-3 rounded-xl shrink-0 self-end md:self-auto max-w-xs sm:max-w-sm">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-amber-800 flex items-center gap-1 uppercase block text-[10px] tracking-wide">
                          ⚠️ SOLICITAÇÃO DE CANCELAMENTO RECEBIDA
                        </span>
                        <p className="text-[10px] text-amber-700 leading-normal font-sans">
                          O visitante solicitou cancelamento. Conforme o contrato assinado, verifique eventuais multas e retenções de valores antes de confirmar.
                        </p>
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          onClick={() => {
                            handleConfirm(
                              'Recusar Pedido de Cancelamento',
                              'Deseja realmente recusar o pedido de cancelamento e manter a reserva confirmada?',
                              () => {
                                onRejectCancelRequest?.(res.id);
                              }
                            );
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                        >
                          Recusar Pedido
                        </button>
                        <button
                          onClick={() => {
                            handleConfirm(
                              'Efetivar Cancelamento',
                              'Deseja aprovar e efetivar o cancelamento definitivo? A data será liberada e o reembolso será processado pelas regras e multas vigentes.',
                              () => {
                                onCancelReservation(res.id);
                              },
                              true
                            );
                          }}
                          className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] shadow-sm transition-all cursor-pointer"
                        >
                          Aprovar Cancelamento
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 font-medium flex flex-col sm:flex-row sm:items-center gap-3 bg-emerald-50/70 border border-emerald-150 px-3.5 py-2.5 rounded-xl shrink-0 self-end md:self-auto font-sans">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-bold text-emerald-800 block">Pagamento Pix Efetivado</span>
                          <button 
                            onClick={() => {
                              handleConfirm(
                                'Desfazer e Cancelar Reserva',
                                'Você tem certeza de que deseja DESFAZER o recebimento e CANCELAR esta reserva de forma administrativa? A data será liberada para novos agendamentos e o status mudará para Cancelado.',
                                () => {
                                  onCancelReservation(res.id);
                                },
                                true
                              );
                            }}
                            className="text-[10px] text-red-500 hover:text-red-700 hover:underline font-bold block mt-0.5 text-left cursor-pointer"
                            title="Desfazer a confirmação do PIX e cancelar a reserva"
                          >
                            Desfazer / Cancelar Reserva
                          </button>
                        </div>
                      </div>

                      {/* Google Agenda Integration Button specific to this reservation */}
                      <div className="border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-2 sm:pt-0 sm:pl-3.5 flex flex-col gap-1 shrink-0">
                        {googleConnectedEmail ? (
                          syncedReservations[res.id] ? (
                            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[10px] bg-white border border-emerald-100 px-2.5 py-1.5 rounded-lg shadow-2xs">
                              <span className="text-[11px]">📆</span> Sincronizado no Google
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSyncReservationToGoogle(res)}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Sincronizar esta locação individualmente com o Google Agenda"
                            >
                              {syncStatus[res.id] === 'syncing' ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" /> Sincronizando...
                                </>
                              ) : (
                                <>
                                  Sincronizar no Google Agenda
                                </>
                              )}
                            </button>
                          )
                        ) : (
                          <button
                            onClick={handleConnectGoogle}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Vincule sua conta Google primeiro para poder agendar no Calendário"
                          >
                            Conectar Google Agenda
                          </button>
                        )}
                      </div>
                    </div>
                  )
                )}

                {res.status === 'cancelled' && (
                  <div className="text-xs text-slate-500 font-medium flex items-center justify-between gap-3 bg-red-50 border border-red-150 p-2.5 rounded-lg shrink-0 self-end md:self-auto">
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-500" />
                      <div>
                        <span className="font-bold text-red-800 block">Reserva Cancelada</span>
                        <div className="flex flex-col sm:flex-row gap-x-3 gap-y-1 mt-0.5">
                          <button 
                            type="button"
                            onClick={() => onApproveReservation(res.id)}
                            className="text-[10px] text-emerald-600 hover:text-emerald-850 hover:underline font-bold text-left cursor-pointer"
                            title="Reativar esta reserva se o cliente realizou o Pix atrasado"
                          >
                            Reativar & Efetivar Pix
                          </button>
                          {onDeleteReservation && (
                            <button 
                              type="button"
                              onClick={() => {
                                handleConfirm(
                                  'Excluir do Histórico',
                                  'Tem certeza de que deseja EXCLUIR DEFINITIVAMENTE esta reserva cancelada do seu histórico?',
                                  () => onDeleteReservation(res.id),
                                  true
                                );
                              }}
                              className="text-[10px] text-red-600 hover:text-red-800 hover:underline font-bold text-left flex items-center gap-0.5 cursor-pointer"
                              title="Excluir do histórico de reservas permanentemente"
                            >
                              <Trash2 className="w-3 h-3 inline-block" /> Excluir Histórico
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OWNER INTERACTIVE CALENDAR & MANUAL BOOKING MODAL */}
      {selectedEnvForCalendar && (
        <OwnerCalendarModal
          environment={selectedEnvForCalendar}
          reservations={reservations}
          onClose={() => setSelectedEnvForCalendar(null)}
          onAddReservation={onCompleteReservation}
          onCancelReservation={onCancelReservation}
          showConfirm={showConfirm}
        />
      )}

      {/* ADVERTISER EDIT ENVIRONMENT MODAL */}
      {editingEnv && (
        <EditEnvironmentModal
          environment={editingEnv}
          categories={categories}
          onClose={() => setEditingEnv(null)}
          onSave={(updatedEnv) => {
            onUpdateEnvironment(updatedEnv);
            setEditingEnv(null);
          }}
          showConfirm={showConfirm}
        />
      )}

    </div>
  );
}
