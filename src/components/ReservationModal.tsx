import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, FileText, CheckCircle, Shield, Copy, Check, X, AlertCircle, Sparkles, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Environment, Reservation, ServicePartner, EnvironmentReview } from '../types';
import { generatePixPayload } from '../utils/pix';
import { getPriceForDate } from '../utils/pricing';
import MapPickerCard from './MapPickerCard';

function getYouTubeEmbedUrl(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url?.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url?.match(/(?:vimeo)\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i);
  if (match && match[3]) {
    return `https://player.vimeo.com/video/${match[3]}`;
  }
  return null;
}

function VideoPlayer({ url }: { url: string }) {
  if (!url) return null;

  const ytUrl = getYouTubeEmbedUrl(url);
  if (ytUrl) {
    return (
      <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <iframe
          src={ytUrl}
          title="Vídeo de Demonstração"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  const vimeoUrl = getVimeoEmbedUrl(url);
  if (vimeoUrl) {
    return (
      <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <iframe
          src={vimeoUrl}
          title="Vídeo de Demonstração"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  // Fallback direct Standard video element
  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-black">
      <video
        src={url}
        controls
        playsInline
        className="w-full aspect-video object-contain"
      />
    </div>
  );
}

interface ReservationModalProps {
  environment: Environment;
  reservations: Reservation[];
  userEmail: string;
  userName: string;
  onClose: () => void;
  onCompleteReservation: (newReservation: Reservation) => void;
  initialSelectedDate?: string;
  partners?: ServicePartner[];
  reviews?: EnvironmentReview[];
}

export default function ReservationModal({ 
  environment, 
  reservations,
  userEmail, 
  userName, 
  onClose, 
  onCompleteReservation,
  initialSelectedDate,
  partners = [],
  reviews = []
}: ReservationModalProps) {
  
  // Stages: 'setup' | 'contract' | 'payment' | 'success'
  const [stage, setStage] = useState<'setup' | 'contract' | 'payment' | 'success'>('setup');

  // Gest contact details
  const [renterNameInput, setRenterNameInput] = useState(userName || '');
  const [renterEmailInput, setRenterEmailInput] = useState(userEmail || '');
  const [renterPhoneInput, setRenterPhoneInput] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);

  // Sync state when props shift
  useEffect(() => {
    if (userName) setRenterNameInput(userName);
    if (userEmail) setRenterEmailInput(userEmail);
  }, [userName, userEmail]);
  
  // Custom reviews extraction for current environment
  const envReviews = reviews.filter((r) => r.environmentId === environment.id);
  const avgRating = envReviews.length > 0
    ? parseFloat((envReviews.reduce((sum, r) => sum + r.rating, 0) / envReviews.length).toFixed(1))
    : 5.0;

  // Date & Time states
  const [date, setDate] = useState(initialSelectedDate || '');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(() => {
    if (initialSelectedDate) {
      const parsed = new Date(initialSelectedDate + 'T12:00:00');
      if (!isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      }
    }
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  
  // Ad sponsors / partners selection states
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  const isPartnerActive = (partner: ServicePartner): boolean => {
    if (!partner.isActive) return false;
    if (partner.activationExpiresAt) {
      const todayStr = new Date().toISOString().split('T')[0];
      return partner.activationExpiresAt >= todayStr;
    }
    return true;
  };
  
  // Rules Agreement state
  const [contractAccepted, setContractAccepted] = useState(true);
  const [paymentOption, setPaymentOption] = useState<'full' | 'minimum' | 'custom'>('full');
  const [customReais, setCustomReais] = useState<number>(0);
  const [copiado, setCopiado] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300); // 5-minute checkout timer
  const [observation, setObservation] = useState('');
  
  // Error message state
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [workingLimitsText, setWorkingLimitsText] = useState<string>('');

  // Generated Reservation State to hold reference before completion
  const [pendingReservation, setPendingReservation] = useState<Reservation | null>(null);

  const getLocalDateString = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse Portuguese weekday name based on YYYY-MM-DD input
  const getWeekdayKey = (dateString: string): string => {
    if (!dateString) return '';
    // Format timezone safely to capture correct day
    const parts = dateString.split('-');
    const parsedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return days[parsedDate.getDay()];
  };

  const getWeekdayLabel = (key: string): string => {
    const labels: { [key: string]: string } = {
      seg: 'Segunda-feira', ter: 'Terça-feira', qua: 'Quarta-feira',
      qui: 'Quinta-feira', sex: 'Sexta-feira', sab: 'Sábado', dom: 'Domingo'
    };
    return labels[key] || '';
  };

  // Auto-sync reservation start/end times with dynamic operation hours on date selection
  useEffect(() => {
    if (date) {
      const dayKey = getWeekdayKey(date);
      const dayConfig = environment.workingHours[dayKey];
      if (dayConfig && !dayConfig.closed) {
        setStartTime(dayConfig.start);
        setEndTime(dayConfig.end);
      }
      const pricing = getPriceForDate(environment, date);
      setCustomReais(Math.round(pricing.pricePerHour * 0.6));
    }
  }, [date, environment]);

  // Run dynamic hours checking as date/time changes
  useEffect(() => {
    if (!date) {
      setHoursError('Por favor, selecione a data desejada.');
      setWorkingLimitsText('');
      return;
    }

    const dayKey = getWeekdayKey(date);
    const dayConfig = environment.workingHours[dayKey];

    if (!dayConfig || dayConfig.closed) {
      setHoursError(`O estabelecimento está FECHADO aos domingos ou no dia correspondente (${getWeekdayLabel(dayKey)}).`);
      setWorkingLimitsText('Fechado');
      return;
    }

    setWorkingLimitsText(`Horário de Funcionamento na ${getWeekdayLabel(dayKey)}: das ${dayConfig.start} às ${dayConfig.end}`);

    // Parse minutes to do bounds checking
    const parseTimeToMinutes = (timeStr: string) => {
      const parts = timeStr.split(':');
      return Number(parts[0]) * 60 + Number(parts[1]);
    };

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    const officeStartMin = parseTimeToMinutes(dayConfig.start);
    const officeEndMin = parseTimeToMinutes(dayConfig.end);

    if (startMinutes >= endMinutes) {
      setHoursError('O horário de término deve ser posterior ao horário de início.');
      return;
    }

    if (startMinutes < officeStartMin || endMinutes > officeEndMin) {
      setHoursError(`A reserva deve estar contida no horário permitido de expediente (${dayConfig.start} às ${dayConfig.end}).`);
      return;
    }

    // Minimum 1 hour duration
    if (endMinutes - startMinutes < 30) {
      setHoursError('O período mínimo permitido para locação é de 30 minutos.');
      return;
    }

    // Since renting is per day (diária), if there's any active booking for this date, the environment is occupied.
    const conflicts = reservations.filter(
      (res) => res.environmentId === environment.id && res.date === date && res.status !== 'cancelled'
    );

    if (conflicts.length > 0) {
      setHoursError('Desculpe, este espaço já possui um aluguel confirmado ou pendente para esta diária/data selecionada.');
      return;
    }

    setHoursError(null);
  }, [date, startTime, endTime, environment, reservations]);

  // Countdown clock effect for payment stage
  useEffect(() => {
    if (stage !== 'payment') return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  const calculateHours = () => {
    const partsStart = startTime.split(':');
    const partsEnd = endTime.split(':');
    const diff = (Number(partsEnd[0]) * 60 + Number(partsEnd[1])) - (Number(partsStart[0]) * 60 + Number(partsStart[1]));
    return Number((diff / 60).toFixed(2));
  };

  const handleAdvanceToContract = () => {
    if (hoursError) return;
    setContactError(null);

    if (!renterNameInput.trim()) {
      setContactError('Por favor, informe o seu nome completo para a reserva.');
      return;
    }
    if (!renterEmailInput.trim() || !renterEmailInput.includes('@')) {
      setContactError('Por favor, informe um e-mail válido para contato.');
      return;
    }
    if (!renterPhoneInput.trim()) {
      setContactError('Por favor, informe um celular/WhatsApp para poder receber notificações de agendamento.');
      return;
    }

    setStage('contract');
  };

  const handleAdvanceToPayment = () => {
    if (!contractAccepted) return;

    const totalHours = calculateHours();
    const pricing = getPriceForDate(environment, date);
    const totalPrice = pricing.pricePerHour; // Use flat daily rate!
    
    let codeAmount = totalPrice;
    if (paymentOption === 'minimum') {
      codeAmount = totalPrice * 0.5;
    } else if (paymentOption === 'custom') {
      codeAmount = customReais;
    }

    const refId = `RES-${Math.floor(Math.random() * 900000 + 100000)}`;
    const pixCopiaECola = generatePixPayload(environment.pixKey, codeAmount, refId, environment.title);

    const reservation: Reservation = {
      id: refId,
      environmentId: environment.id,
      renterEmail: renterEmailInput.trim(),
      renterName: renterNameInput.trim(),
      renterPhone: renterPhoneInput.trim(),
      date,
      startTime,
      endTime,
      totalHours,
      totalPrice,
      pixCode: pixCopiaECola,
      status: 'pending_payment',
      contractAccepted: true,
      createdAt: new Date().toISOString(),
      selectedPartnerIds,
      paymentOption: paymentOption,
      paidAmount: codeAmount,
      observation: observation.trim() || undefined
    };

    setPendingReservation(reservation);
    setStage('payment');
  };

  // Simulated Payment Action
  const handleSimulatePaymentCompletion = () => {
    if (!pendingReservation) return;

    const finalReservation: Reservation = {
      ...pendingReservation,
      status: 'confirmed'
    };

    onCompleteReservation(finalReservation);
    setStage('success');
  };

  const copyToClipboard = () => {
    if (pendingReservation) {
      navigator.clipboard.writeText(pendingReservation.pixCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const formattedTimeLeft = () => {
    const min = Math.floor(secondsLeft / 60);
    const sec = secondsLeft % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-xs">
              PASSO {stage === 'setup' ? '1' : stage === 'contract' ? '2' : stage === 'payment' ? '3' : '✓'}
            </span>
            <h3 className="font-display font-semibold text-slate-800 text-sm sm:text-base">
              {stage === 'setup' && 'Configurar Reserva'}
              {stage === 'contract' && 'Regras & Assinatura de Contrato'}
              {stage === 'payment' && 'Pagamento Online via PIX'}
              {stage === 'success' && 'Reserva Confirmada!'}
            </h3>
          </div>
          {stage !== 'success' && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Wizard Navigation */}
        <div className="flex bg-slate-50 border-b border-slate-10 border-slate-100 shrink-0 text-xs font-semibold select-none">
          <div className={`flex-1 py-2 text-center border-b-2 ${stage === 'setup' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400'}`}>
            1. Período
          </div>
          <div className={`flex-1 py-2 text-center border-b-2 ${stage === 'contract' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400'}`}>
            2. Contrato
          </div>
          <div className={`flex-1 py-2 text-center border-b-2 ${stage === 'payment' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400'}`}>
            3. Pagamento
          </div>
          <div className={`flex-1 py-2 text-center border-b-2 ${stage === 'success' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400'}`}>
            Confirmado
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* STAGE: SETUP DATE & TIMES */}
          {stage === 'setup' && (
            <div className="space-y-5">
              
              {/* Space Quick summary block */}
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <img 
                  src={environment.images[0]} 
                  alt={environment.title} 
                  className="w-20 h-16 rounded-lg object-cover bg-slate-200 shadow-sm shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 justify-between">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{environment.title}</h4>
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100/50 flex items-center gap-0.5 shrink-0">
                      ⭐ {avgRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{environment.address}</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">Valor: R$ {environment.pricePerHour}/diária • Cap: {environment.capacity} pes. • ({envReviews.length} avaliações)</p>
                </div>
              </div>

              {/* Google Maps Location Embed */}
              <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">🗺️ Localização no Google Maps</span>
                <div className="w-full h-40 bg-slate-200 rounded-lg overflow-hidden relative shadow-inner border border-slate-200">
                  <iframe
                    title="Google Map"
                    width="105%"
                    height="100%"
                    style={{ border: 0, marginLeft: '-2.5%' }}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(environment.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[70%]">{environment.address}</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(environment.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline shrink-0"
                  >
                    Abrir no Google Maps ↗
                  </a>
                </div>
              </div>

              {/* Demonstration Video Player Option */}
              {environment.videoUrl && (
                <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-550 block flex items-center gap-1">
                    🎥 Tour Virtual / Vídeo de Demonstração
                  </span>
                  <VideoPlayer url={environment.videoUrl} />
                </div>
              )}

              {/* Visitor Written Reviews Segment */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">⭐ Opinião dos Visitantes ({envReviews.length})</span>
                  <div className="flex items-center gap-0.5 text-xs text-amber-600 font-bold">
                    <span>{avgRating.toFixed(1)}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  </div>
                </div>

                {envReviews.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">Nenhuma avaliação enviada ainda para este local.</p>
                ) : (
                  <div className="max-h-52 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                    {envReviews.map((rev) => (
                      <div key={rev.id} className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-slate-700">{rev.renterName}</span>
                          <span className="text-[9px] text-slate-400">
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('pt-BR') : 'Recente'}
                          </span>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`} 
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 leading-normal italic">
                          "{rev.comment || 'Sem comentários adicionais.'}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Working hours limits info helper */}
              {workingLimitsText && (
                <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{workingLimitsText}</span>
                </div>
              )}

              {/* Form entries */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                    <Calendar className="w-4 h-4 text-emerald-600" /> Escolha o Dia do Aluguel
                  </label>
                  
                  {/* Visually Stunning Custom Month Calendar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
                    {/* Calendar Month Header Controller */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          const prev = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1);
                          const today = new Date();
                          const minVal = new Date(today.getFullYear(), today.getMonth(), 1);
                          if (prev >= minVal) {
                            setCurrentCalendarMonth(prev);
                          } else {
                            alert("Não é possível navegar para meses passados.");
                          }
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
                        title="Mês anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <strong className="text-sm font-bold text-slate-800 px-2 font-display">
                        {[
                          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                        ][currentCalendarMonth.getMonth()]} de {currentCalendarMonth.getFullYear()}
                      </strong>

                      <button
                        type="button"
                        onClick={() => {
                          const next = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1);
                          setCurrentCalendarMonth(next);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
                        title="Próximo mês"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Weekday Names Row */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((wd, idx) => (
                        <span key={idx} className="text-[10px] font-extrabold text-slate-400 tracking-wider">
                          {wd}
                        </span>
                      ))}
                    </div>

                    {/* Calendar Days Matrix */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {(() => {
                        const days = [];
                        const baseDate = currentCalendarMonth;
                        const year = baseDate.getFullYear();
                        const month = baseDate.getMonth();
                        
                        // padding
                        const firstDayInstance = new Date(year, month, 1);
                        const weekdayOfFirst = firstDayInstance.getDay();
                        const prevMonthTotalDays = new Date(year, month, 0).getDate();
                        
                        for (let i = weekdayOfFirst - 1; i >= 0; i--) {
                          const dayNum = prevMonthTotalDays - i;
                          const pMonth = month === 0 ? 11 : month - 1;
                          const pYear = month === 0 ? year - 1 : year;
                          const dStr = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          days.push({ dStr, dayNum, isPadding: true });
                        }
                        
                        // current month
                        const totalDays = new Date(year, month + 1, 0).getDate();
                        for (let i = 1; i <= totalDays; i++) {
                          const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                          days.push({ dStr, dayNum: i, isPadding: false });
                        }
                        
                        const todayStr = getLocalDateString();

                        return days.map((dayObj, i) => {
                          const { dStr, dayNum, isPadding } = dayObj;
                          const isPast = dStr < todayStr;
                          const isOccupied = reservations.some(
                            (res) => res.environmentId === environment.id && res.date === dStr && res.status !== 'cancelled'
                          );
                          const isSelected = date === dStr;

                          // past or padding days are unclickable and style muted
                          if (isPadding || isPast) {
                            return (
                              <button
                                key={i}
                                type="button"
                                disabled
                                className="aspect-square w-full rounded-xl flex items-center justify-center text-xs font-medium text-slate-305 line-through bg-slate-50/40 opacity-40 relative"
                              >
                                {dayNum}
                              </button>
                            );
                          }

                          // occupied days show special alert on click or block selection
                          if (isOccupied) {
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  alert(`🗓️ Indisponível: O dia ${dStr.split('-').reverse().join('/')} já está reservado e não pode ser selecionado.`);
                                }}
                                className="aspect-square w-full rounded-xl flex flex-col items-center justify-center text-xs font-bold text-red-500 bg-red-50 border border-red-100 hover:bg-red-105 active:scale-95 transition-all cursor-pointer relative"
                                title="Data Reservada"
                              >
                                <span>{dayNum}</span>
                                <span className="text-[7px] uppercase tracking-tighter text-red-600 block leading-none font-extrabold mt-0.5">Ocupado</span>
                              </button>
                            );
                          }

                          // free standard days
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setDate(dStr);
                              }}
                              className={`aspect-square w-full rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all cursor-pointer relative ${
                                isSelected 
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold scale-102 ring-2 ring-emerald-500/10'
                                  : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500 border border-transparent'
                              }`}
                            >
                              <span>{dayNum}</span>
                              <span className={`text-[7px] uppercase tracking-tighter block leading-none mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400 font-bold'}`}>Livre</span>
                            </button>
                          );
                        });
                      })()}
                    </div>

                    {/* Subordinate Legends block */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-semibold font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block" />
                        <span>Selecionado</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-slate-50 border border-slate-200 rounded-lg inline-block" />
                        <span>Livre / Disponível</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-red-50 border border-red-100 rounded-lg inline-block" />
                        <span>Ocupado</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-slate-100 rounded-lg inline-block opacity-40" />
                        <span className="line-through">Passado</span>
                      </div>
                    </div>
                  </div>

                  {/* Non-editable output feedback bar */}
                  {date ? (
                    <div className="mt-2.5 bg-emerald-50/50 border border-emerald-100/60 p-2.5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-800">Dia Selecionado:</span>
                      </div>
                      <span className="text-xs font-mono font-extrabold text-emerald-800 bg-emerald-100/50 py-0.5 px-2.5 rounded">
                        {date.split('-').reverse().join('/')}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2.5 bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-center text-xs text-amber-800 font-bold">
                      ⚠️ Selecione um dia Livre no calendário acima para prosseguir
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Entrada da Diária
                    </label>
                    <input
                      type="time"
                      disabled
                      value={startTime}
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-505 text-slate-500 font-semibold cursor-not-allowed shadow-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Saída da Diária
                    </label>
                    <input
                      type="time"
                      disabled
                      value={endTime}
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-505 text-slate-500 font-semibold cursor-not-allowed shadow-none"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-500 leading-relaxed">
                  💡 <strong>Período de Uso:</strong> O aluguel é cobrado por diária fechada. O horário de entrada e saída é pré-definido com base no expediente de funcionamento do espaço selecionado e não é editável.
                </div>

                {/* Guest Contact Information Section */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-550 block flex items-center gap-1">
                    👤 Dados do Locatário (Para Contrato e PIX)
                  </span>
                  
                  {contactError && (
                    <div className="p-2.5 bg-red-50 border border-red-150 text-red-600 rounded-lg text-xs font-semibold animate-shake">
                      ⚠️ {contactError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-35 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Nome Completo</label>
                      <input
                        type="text"
                        value={renterNameInput}
                        onChange={(e) => {
                          setRenterNameInput(e.target.value);
                          setContactError(null);
                        }}
                        placeholder="Seu nome"
                        className="w-full text-xs font-sans bg-white border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Endereço de E-mail</label>
                      <input
                        type="email"
                        value={renterEmailInput}
                        onChange={(e) => {
                          setRenterEmailInput(e.target.value);
                          setContactError(null);
                        }}
                        placeholder="Ex: seuemail@gmail.com"
                        className="w-full text-xs font-sans bg-white border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 text-slate-700 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">WhatsApp / Telefone de Contato</label>
                    <input
                      type="tel"
                      value={renterPhoneInput}
                      onChange={(e) => {
                        setRenterPhoneInput(e.target.value);
                        setContactError(null);
                      }}
                      placeholder="Ex: (93) 99999-8888"
                      className="w-full text-xs font-sans bg-white border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 text-slate-700 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="res_observation" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    📝 Observações / Pedidos Especiais (Opcional):
                  </label>
                  <textarea
                    id="res_observation"
                    rows={2}
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Adicione observações importantes para o anfitrião (ex: configuração de mesas, regras especiais, necessidades técnicas, etc.)"
                    className="w-full text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-700 placeholder-slate-400 outline-none"
                  />
                </div>

                {/* Visual info showing existing bookings today to prevent double booking */}
                {date && reservations.filter(r => r.environmentId === environment.id && r.date === date && r.status !== 'cancelled').length > 0 && (
                  <div className="p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs text-amber-900 space-y-1.5 animate-in slide-in-from-top-2">
                    <p className="font-bold text-[11px] text-amber-850 flex items-center gap-1">
                      ⚠️ Horários indisponíveis hoje:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {reservations
                        .filter(r => r.environmentId === environment.id && r.date === date && r.status !== 'cancelled')
                        .map(r => (
                          <span key={r.id} className="bg-amber-100/70 border border-amber-200/40 text-amber-950 px-2.5 py-0.5 rounded font-mono font-bold text-[10px]">
                            {r.startTime} - {r.endTime}
                          </span>
                        ))
                      }
                    </div>
                  </div>
                )}

                {hoursError ? (
                  <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-lg text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <span>{hoursError}</span>
                  </div>
                ) : (() => {
                  const pricing = getPriceForDate(environment, date);
                  return (
                    <div className="p-4 bg-emerald-50/50 text-emerald-950 border border-emerald-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-sm border-b border-emerald-100 pb-2">
                        <span className="font-medium text-slate-700">Período de Aluguel:</span>
                        <span className="font-bold text-slate-800">1 Diária Completa ({startTime} às {endTime})</span>
                      </div>
                      
                      {pricing.isCustom && (
                        <div className="flex items-center gap-1.5 p-2 bg-emerald-100/60 border border-emerald-200/40 rounded-lg text-[10px] font-bold text-emerald-900 animate-in fade-in duration-200">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{pricing.reason} • R$ {pricing.pricePerHour}/diária ativo!</span>
                        </div>
                      )}

                      {!pricing.isCustom && (
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>Tarifa Padrão da Diária:</span>
                          <span className="font-bold">R$ {environment.pricePerHour}/diária</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-1">
                        <span className="font-semibold text-emerald-900 text-xs flex flex-col">
                          <span>VALOR TOTAL DO ALUGUEL:</span>
                          {pricing.isCustom && <span className="text-[9px] font-medium text-emerald-700 font-sans">Tarifa diferenciada de diária aplicada</span>}
                        </span>
                        <span className="text-xl font-bold font-display text-emerald-700">
                          R$ {pricing.pricePerHour.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* STAGE: CONTRACT RULES SIGN */}
          {stage === 'contract' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/40 border border-emerald-100 text-emerald-900 rounded-xl space-y-1">
                <p className="font-semibold text-sm flex items-center gap-1 text-emerald-800">
                  <Shield className="w-4 h-4 text-emerald-600" /> Assinatura Eletrônica de Cláusulas
                </p>
                <p className="text-xs text-emerald-700/90 leading-relaxed">
                  Para resguardar ambas as partes, revise com atenção as regras de responsabilidade civil e uso estipuladas pelo anfitrião a seguir.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Contrato de Uso de Infraestrutura - {environment.title}</label>
                <div className="w-full border border-slate-250 bg-slate-50 rounded-xl p-4 h-64 overflow-y-auto text-slate-700 text-xs font-mono leading-relaxed whitespace-pre-wrap select-all">
                  {environment.contractRules || 'Nenhum termo contratual adicional inserido para este local. São válidas as disposições padrão estipuladas nacionalmente.'}
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer select-none hover:bg-slate-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={contractAccepted}
                  onChange={(e) => setContractAccepted(e.target.checked)}
                  className="mt-1 w-4.5 h-4.5 accent-emerald-600 rounded border-slate-300 focus:ring-0 cursor-pointer"
                />
                <div className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Declaro que li atentamente e <span className="text-slate-800 font-bold">estou de pleno acordo</span> com todos os termos contratuais e políticas de convivência para o aluguel deste ambiente.
                </div>
              </label>

              {/* Payment Option Selection */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Escolha a Opção de Pagamento Inicial:</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div 
                    onClick={() => setPaymentOption('full')}
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      paymentOption === 'full' 
                        ? 'border-emerald-600 bg-emerald-50/50 text-slate-800 ring-1 ring-emerald-600/20' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-sans">🔑 Valor Integral (100%)</span>
                        <input 
                          type="radio" 
                          name="payment_opt"
                          checked={paymentOption === 'full'}
                          onChange={() => setPaymentOption('full')}
                          className="accent-emerald-600 cursor-pointer h-3.5 w-3.5"
                        />
                      </div>
                      <p className="text-[10px] mt-1 text-slate-400 leading-tight">
                        Quite o valor integral agora via PIX em parcela única.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-750 mt-2 block">
                      R$ {getPriceForDate(environment, date).pricePerHour.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div 
                    onClick={() => setPaymentOption('minimum')}
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      paymentOption === 'minimum' 
                        ? 'border-emerald-600 bg-emerald-50/50 text-slate-800 ring-1 ring-emerald-600/20' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-sans">💰 Sinal Co-Garantido (50% Mín.)</span>
                        <input 
                          type="radio" 
                          name="payment_opt"
                          checked={paymentOption === 'minimum'}
                          onChange={() => setPaymentOption('minimum')}
                          className="accent-emerald-600 cursor-pointer h-3.5 w-3.5"
                        />
                      </div>
                      <p className="text-[10px] mt-1 text-slate-400 leading-tight">
                        Garanta a data com 50% e pague o restante no local.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-750 mt-2 block">
                      R$ {(getPriceForDate(environment, date).pricePerHour * 0.5).toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div 
                    onClick={() => {
                      setPaymentOption('custom');
                    }}
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      paymentOption === 'custom' 
                        ? 'border-emerald-600 bg-emerald-50/50 text-slate-800 ring-1 ring-emerald-600/20' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-sans">⚡ Outro Valor (Em Reais R$)</span>
                        <input 
                          type="radio" 
                          name="payment_opt"
                          checked={paymentOption === 'custom'}
                          onChange={() => setPaymentOption('custom')}
                          className="accent-emerald-600 cursor-pointer h-3.5 w-3.5"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Digitar Sinal (R$):</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-400">R$</span>
                          <input
                            type="number"
                            min={Math.ceil(getPriceForDate(environment, date).pricePerHour * 0.5)}
                            max={getPriceForDate(environment, date).pricePerHour}
                            value={customReais || ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              setCustomReais(val);
                              setPaymentOption('custom');
                            }}
                            onBlur={() => {
                              const totalP = getPriceForDate(environment, date).pricePerHour;
                              const minVal = Math.ceil(totalP * 0.5);
                              if (customReais < minVal) {
                                alert(`O sinal de garantia customizado precisa ser de pelo menos R$ ${minVal} (50% do valor total).`);
                                setCustomReais(minVal);
                              } else if (customReais > totalP) {
                                alert(`O valor customizado não pode exceder o valor total do aluguel (R$ ${totalP}).`);
                                setCustomReais(totalP);
                              }
                            }}
                            className="w-20 px-1.5 py-0.5 border border-slate-250 bg-white rounded-md text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 mt-2 block">
                      Restante a pagar depois: R$ {(getPriceForDate(environment, date).pricePerHour - customReais).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE: PIX PAYMENT SCREEN */}
          {stage === 'payment' && pendingReservation && (
            <div className="space-y-6">
              
              <div className="text-center space-y-1 bg-amber-50/40 p-4 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-800 font-medium uppercase tracking-wider font-semibold">
                  Aguardando Pagamento da Reserva (PIX)
                </p>
                <p className="text-xl font-display font-bold text-amber-700">
                  R$ {(pendingReservation.paidAmount ?? pendingReservation.totalPrice).toFixed(2).replace('.', ',')}
                </p>
                {pendingReservation.paymentOption === 'minimum' ? (
                  <div className="mt-1 text-[10.5px] font-bold text-amber-800 bg-amber-100/50 rounded-md py-1 px-2.5 inline-block border border-amber-200">
                    Sinal de Garantia Mínimo (50%) • Pago: R$ {pendingReservation.paidAmount?.toFixed(2).replace('.', ',')} • Restante: R$ {(pendingReservation.totalPrice - (pendingReservation.paidAmount ?? 0)).toFixed(2).replace('.', ',')} pago no local
                  </div>
                ) : pendingReservation.paymentOption === 'custom' ? (
                  <div className="mt-1 text-[10.5px] font-bold text-amber-800 bg-amber-100/50 rounded-md py-1 px-2.5 inline-block border border-amber-200">
                    Sinal Customizado • Pago: R$ {pendingReservation.paidAmount?.toFixed(2).replace('.', ',')} • Restante: R$ {(pendingReservation.totalPrice - (pendingReservation.paidAmount ?? 0)).toFixed(2).replace('.', ',')} pago no local
                  </div>
                ) : (
                  <div className="mt-1 text-[10.5px] font-bold text-emerald-800 bg-emerald-50 rounded-md py-1 px-2.5 inline-block border border-emerald-100">
                    Valor Integral (100%) • Pago: R$ {pendingReservation.paidAmount?.toFixed(2).replace('.', ',')} • Restante: R$ 0,00 (Quitado!)
                  </div>
                )}
                <p className="text-[11px] text-slate-500 pt-1">
                  Esta chave expira em <span className="font-bold text-red-600 font-mono">{formattedTimeLeft()}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                
                {/* SVG Mock QR Code */}
                <div className="w-40 h-40 bg-white p-3.5 border border-slate-200 rounded-xl flex flex-col justify-between items-center relative shrink-0 shadow-sm">
                  {/* Styled Pix Logo in the exact center of QR code matrix */}
                  <div className="grid grid-cols-5 gap-1.5 w-full h-full opacity-85">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`rounded-xs ${
                          (i % 3 === 0 || i < 5 || i % 5 === 0 || (i > 18 && i !== 22)) 
                            ? 'bg-emerald-800' 
                            : 'bg-slate-300'
                        }`} 
                      />
                    ))}
                  </div>
                  
                  {/* Central emblem simulating Pix Symbol */}
                  <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm">
                    <span className="text-[9px] font-bold tracking-tight text-emerald-600 font-display">P I X</span>
                  </div>
                </div>

                <div className="space-y-3 flex-1 min-w-0">
                  <div>
                    <h5 className="font-semibold text-slate-700 text-xs">Pague escaneando o QR Code ou Use o Pix Copia e Cola:</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">Clique no botão para copiar o código e pagar no aplicativo do seu banco preferido.</p>
                  </div>

                  <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      readOnly
                      value={pendingReservation.pixCode}
                      className="flex-1 min-w-0 px-3 py-1.5 bg-transparent border-0 text-xs font-mono text-slate-500 focus:ring-0 focus:outline-none truncate"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-700 transition-colors flex items-center gap-1.5 shrink-0 grow-0"
                    >
                      {copiado ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar Código
                        </>
                      )}
                    </button>
                  </div>

                  <div className="h-[1px] bg-slate-200" />

                  {/* Simulator hook for offline validation */}
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-emerald-950">
                    <p className="text-xs font-semibold flex items-center gap-1">
                      💡 Ambiente de Testes Ativado
                    </p>
                    <p className="text-[11px] text-emerald-800 leading-relaxed mt-1">
                      No sistema real o banco confirma por webhook instantâneo. Para testar o fluxo de ponta a ponta, clique no botão simular abaixo para concluir a reserva de imediato.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE: SUCCESS EXPLOSION */}
          {stage === 'success' && pendingReservation && (
            <div className="text-center py-8 px-4 space-y-4">
              <div className="inline-flex p-3.5 bg-emerald-100 text-emerald-600 rounded-full animate-bounce">
                <CheckCircle className="w-12 h-12" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-slate-800 text-xl">Reserva Feita com Sucesso!</h4>
                <p className="text-xs text-slate-500">Seu pagamento via PIX foi confirmado eletronicamente com sucesso!</p>
              </div>

              {/* Booking receipt details card */}
              <div className="max-w-md mx-auto p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left text-xs divide-y divide-slate-100">
                <div className="pb-2.5 flex justify-between">
                  <span className="text-slate-400">Espaço:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[250px]">{environment.title}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Data Agendada:</span>
                  <span className="font-bold text-slate-800">{date.split('-').reverse().join('/')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Tempo Agendado:</span>
                  <span className="font-bold text-slate-800">Das {startTime} às {endTime} (Diária Completa)</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Código de Locação:</span>
                  <span className="font-bold font-mono text-emerald-700">{pendingReservation.id}</span>
                </div>
                <div className="pt-2.5 flex justify-between">
                  <span className="text-slate-400">Forma de Pagamento:</span>
                  <span className="font-semibold text-slate-800">PIX Online Direto</span>
                </div>
              </div>

              {/* SERVICES & PARTNERS AFTER THE PAYMENT AND BELOW RECEIPT */}
              {partners && partners.filter(isPartnerActive).length > 0 && (
                <div className="max-w-md mx-auto space-y-3.5 pt-4 border-t border-slate-150 text-left">
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-indigo-50/50 p-3 rounded-xl border border-emerald-100 shadow-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
                    <div>
                      <h4 className="text-[11.5px] font-bold text-slate-800">Serviços Adicionais Indicados</h4>
                      <p className="text-[10px] text-slate-500 leading-normal">Turbine seu evento contratando decoração, buffet, som ou limpeza diretamente com os nossos parceiros homologados por WhatsApp!</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {partners.filter(isPartnerActive).map(partner => {
                      const isExpanded = expandedPartnerId === partner.id;
                      const catConfig = (() => {
                        const c = partner.category;
                        if (c === 'decor') return { label: 'Decor & Ornamentação', bg: 'bg-pink-105 text-pink-700 bg-pink-50 border border-pink-100', emoji: '🌸' };
                        if (c === 'buffet') return { label: 'Buffet & Gastro', bg: 'bg-amber-105 text-amber-700 bg-amber-50 border border-amber-100', emoji: '🍹' };
                        if (c === 'music') return { label: 'Som e Iluminação', bg: 'bg-purple-105 text-purple-705 bg-purple-50 border border-purple-100', emoji: '🎵' };
                        if (c === 'cleanup') return { label: 'Limpeza de Apoio', bg: 'bg-cyan-105 text-cyan-705 bg-cyan-50 border border-cyan-100', emoji: '✨' };
                        if (c === 'photo') return { label: 'Fotógrafo / Cobertura', bg: 'bg-indigo-105 text-indigo-75 bg-indigo-50 border border-indigo-100', emoji: '📸' };
                        return { label: 'Serviço Adicional', bg: 'bg-slate-100 text-slate-850', emoji: '⚡' };
                      })();

                      return (
                        <div 
                          key={partner.id}
                          className="border border-slate-150 bg-white rounded-xl p-3.5 space-y-3 transition-all relative"
                        >
                          <div className="flex gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="space-y-1 block">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-850 text-xs truncate">{partner.name}</span>
                                  <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${catConfig.bg}`}>
                                    {catConfig.emoji} {catConfig.label}
                                  </span>
                                  <span className="text-[8px] bg-emerald-50 border border-emerald-100/50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded tracking-wide shrink-0 font-mono">
                                    APROVADO
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-500 leading-normal">{partner.description}</p>
                                
                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <p className="text-[10px] text-emerald-700 font-bold font-mono">
                                    {partner.priceMessage || 'Valores sob consulta'}
                                  </p>
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setExpandedPartnerId(isExpanded ? null : partner.id);
                                    }}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 cursor-pointer text-center font-sans"
                                  >
                                    {isExpanded ? '🔼 Ocultar Detalhes' : '📸 Ver Serviços & Fotos'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details Panel: Photos from past events & Menus / Catalogs */}
                          {isExpanded && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-3.5 animate-in fade-in slide-in-from-top-1">
                              {/* Portfolio Photos from past events */}
                              {partner.portfolioImages && partner.portfolioImages.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block font-sans">
                                    🖼️ Eventos Realizados (Clique para Ampliar)
                                  </span>
                                  <div className="grid grid-cols-3 gap-2">
                                    {partner.portfolioImages.map((imgUrl, idx) => (
                                      <div 
                                        key={idx} 
                                        onClick={() => setZoomedPhoto(imgUrl)}
                                        className="relative h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 cursor-zoom-in hover:opacity-90 active:scale-98 transition-all"
                                      >
                                        <img 
                                          src={imgUrl} 
                                          alt={`Portfólio ${idx + 1}`} 
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-all" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Cardápio / Itens inclusos no catalogo */}
                              {partner.menuOrCatalog && partner.menuOrCatalog.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block font-sans">
                                    📋 Serviços Oferecidos
                                  </span>
                                  <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                                    {partner.menuOrCatalog.map((item, idx) => (
                                      <div key={idx} className="flex items-start gap-1 text-[11px] text-slate-600 leading-snug">
                                        <span className="text-emerald-500 font-extrabold shrink-0">✓</span>
                                        <span>{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Contact Info Row */}
                          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                            <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-2">
                              <span>Atendente: <strong className="text-slate-600">{partner.contactName}</strong></span>
                              <span>•</span>
                              <span>E-mail: <strong className="text-slate-600">{partner.email}</strong></span>
                            </div>
                            
                            <a
                              href={`https://wa.me/${partner.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Olá ${partner.contactName}! Vi seu serviço de "${catConfig.label}" indicado na confirmação do meu aluguel no espaço "${environment.title}" para o dia ${date.split('-').reverse().join('/')}. Gostaria de solicitar um orçamento e saber mais sobre seus serviços!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 shadow-xs hover:shadow-xs cursor-pointer no-underline text-center font-sans block decoration-transparent"
                            >
                              <span className="text-base leading-none">💬</span> Entrar em contato via WhatsApp ({partner.phone})
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="text-center">
                <p className="text-[11px] text-slate-400 italic">As diretrizes e o contrato assinado foram guardados em seu histórico.</p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Wizard Actions inside Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div>
            {stage === 'setup' && (
              <span className="text-xs text-slate-400">Período locado por Diária Inteira</span>
            )}
            {stage === 'contract' && (
              <span className="text-xs text-slate-400">Aceite digital é obrigatório</span>
            )}
            {stage === 'payment' && (
              <span className="text-xs text-slate-400">Disponibilidade pré-reservada</span>
            )}
          </div>

          <div className="flex gap-2">
            {stage === 'setup' && (
              <button
                type="button"
                disabled={!!hoursError}
                onClick={handleAdvanceToContract}
                className={`px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-sm transition-all ${
                  hoursError 
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10'
                }`}
              >
                Avançar para o Contrato
              </button>
            )}

            {stage === 'contract' && (
              <>
                <button
                  type="button"
                  onClick={() => setStage('setup')}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-xl text-slate-600 bg-white hover:bg-slate-50"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={!contractAccepted}
                  onClick={handleAdvanceToPayment}
                  className={`px-5 py-2 text-xs font-semibold rounded-xl text-white transition-all ${
                    contractAccepted
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Ver Chave PIX de Pagamento
                </button>
              </>
            )}

            {stage === 'payment' && (
              <>
                <button
                  type="button"
                  onClick={() => setStage('contract')}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-xl text-slate-600 bg-white hover:bg-slate-55 hover:bg-slate-50"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleSimulatePaymentCompletion}
                  className="px-5 py-2 text-white text-xs font-semibold bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm hover:scale-102 hover:shadow-md transition-all animate-shimmer"
                >
                  ✨ Simular Pagamento PIX
                </button>
              </>
            )}

            {stage === 'success' && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-white text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-xl shadow-md transition-all"
              >
                Concluir & Voltar ao Site
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Zoomed Photo Lightbox Backdrop overlay */}
      {zoomedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs transition-opacity pointer-events-auto"
          onClick={() => setZoomedPhoto(null)}
        >
          <div 
            className="relative max-w-xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-80 sm:h-96 w-full bg-slate-950 flex items-center justify-center">
              <img 
                src={zoomedPhoto} 
                alt="Detalhamento Ampliado" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="absolute top-3 right-3 bg-black/75 hover:bg-black text-white rounded-full p-2 transition-all text-xs font-bold shrink-0 cursor-pointer border border-white/20 hover:scale-105"
              >
                ✕ Fechar
              </button>
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-semibold border-t border-slate-200">
              <span>🔎 Portfólio Ampliado / Serviços Do Parceiro</span>
              <span className="text-indigo-600">Clique em fechar ou fora para sair</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
