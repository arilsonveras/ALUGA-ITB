import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Lock, CheckCircle, AlertCircle, AlertTriangle, Plus, ChevronLeft, ChevronRight, Trash2, Smile, Phone, ChevronDown, ChevronUp, User, Mail } from 'lucide-react';
import { Environment, Reservation } from '../types';

interface OwnerCalendarModalProps {
  environment: Environment;
  reservations: Reservation[];
  onClose: () => void;
  onAddReservation: (newReservation: Reservation) => void;
  onCancelReservation: (id: string) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void, isDanger?: boolean) => void;
}

export default function OwnerCalendarModal({
  environment,
  reservations,
  onClose,
  onAddReservation,
  onCancelReservation,
  showConfirm
}: OwnerCalendarModalProps) {

  const handleConfirm = (title: string, msg: string, onOk: () => void, isDanger = false) => {
    if (showConfirm) {
      showConfirm(title, msg, onOk, isDanger);
    } else {
      if (confirm(msg)) onOk();
    }
  };
  
  // Current calendar view date pointer
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(2026); // Default matching metadata year
  const [currentMonth, setCurrentMonth] = useState(4);    // May (0-indexed base: 0=Jan, 4=May)

  // Selected calendar day inside current month
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  // Form states for the manual reserve booking
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [reason, setReason] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedResId, setExpandedResId] = useState<string | null>(null);

  // Sync opening hours with selected day (hours are not editable but informative)
  useEffect(() => {
    if (selectedDay) {
      const dayConf = getDayConfigByDayNum(selectedDay);
      if (dayConf && dayConf.config && !dayConf.config.closed) {
        setStartTime(dayConf.config.start);
        setEndTime(dayConf.config.end);
      }
    }
  }, [selectedDay, currentMonth, currentYear]);

  const MONTHS_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Helper date calculations
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const firstDayWeeklyIdx = getFirstDayOfMonth(currentYear, currentMonth);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
    setSelectedDay(null);
  };

  // Safe date pad format (YYYY-MM-DD)
  const getFormattedDateString = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  // Fetch reservations on a given day
  const getReservationsForDay = (day: number) => {
    const formattedStr = getFormattedDateString(day);
    return reservations.filter(
      (res) => res.environmentId === environment.id && res.date === formattedStr && res.status !== 'cancelled'
    );
  };

  // Check if day is weekend or closed in environment config
  const getDayConfigByDayNum = (day: number) => {
    const formattedStr = getFormattedDateString(day);
    const parts = formattedStr.split('-');
    const parsedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const daysKeys = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const wkKey = daysKeys[parsedDate.getDay()];
    return {
      key: wkKey,
      config: environment.workingHours[wkKey]
    };
  };

  // Compute status details for each day tile
  const getDayStatus = (day: number) => {
    const dayRes = getReservationsForDay(day);
    const { config } = getDayConfigByDayNum(day);
    
    if (!config || config.closed) {
      return { label: 'Fechado', color: 'bg-slate-100 text-slate-400 border-slate-200' };
    }
    
    if (dayRes.length === 0) {
      return { label: 'Livre', color: 'bg-emerald-50/50 text-emerald-800 border-emerald-100 hover:bg-emerald-50' };
    }
    
    // Check if the business day is totally filled
    // Just simple indicator: show "Reservado" or "Parcial"
    return { 
      label: `${dayRes.length} reserva(s)`, 
      color: 'bg-amber-50 text-amber-950 border-amber-200 hover:border-amber-300' 
    };
  };

  // Selected date details representation
  const selectedFormattedDate = selectedDay ? getFormattedDateString(selectedDay) : null;
  const selectedDayReservations = selectedDay ? getReservationsForDay(selectedDay) : [];
  const selectedDayConfig = selectedDay ? getDayConfigByDayNum(selectedDay) : null;

  // Add booking action
  const handleCreateManualReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay || !selectedFormattedDate) return;

    if (!reason.trim()) {
      setFormError('Por favor, indique o nome do cliente ou finalidade da reserva manual.');
      return;
    }

    if (!phone.trim()) {
      setFormError('Por favor, indique o número de telefone/WhatsApp do cliente para contato.');
      return;
    }

    // Boundaries check against working hours
    const dayConfig = selectedDayConfig?.config;
    if (!dayConfig || dayConfig.closed) {
      setFormError('O ambiente está FECHADO neste dia da semana.');
      return;
    }

    const parseTimeToMinutes = (timeStr: string) => {
      const parts = timeStr.split(':');
      return Number(parts[0]) * 60 + Number(parts[1]);
    };

    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    const officeStartMin = parseTimeToMinutes(dayConfig.start);
    const officeEndMin = parseTimeToMinutes(dayConfig.end);

    if (startMin >= endMin) {
      setFormError('O horário de término deve ser posterior ao início.');
      return;
    }

    if (startMin < officeStartMin || endMin > officeEndMin) {
      setFormError(`A reserva deve estar contida no expediente do local (das ${dayConfig.start} às ${dayConfig.end}).`);
      return;
    }

    // Check overlaps of manual reservation
    const isOverlapping = selectedDayReservations.some((currRes) => {
      const curStart = parseTimeToMinutes(currRes.startTime);
      const curEnd = parseTimeToMinutes(currRes.endTime);
      return startMin < curEnd && endMin > curStart;
    });

    if (isOverlapping) {
      setFormError('Já existe um agendamento conflitante neste intervalo de horários.');
      return;
    }

    setFormError(null);

    // Create Reservation
    const refId = `RESM-${Math.floor(Math.random() * 900000 + 100000)}`;
    const totalHours = Number(((endMin - startMin) / 60).toFixed(2));

    const newReservation: Reservation = {
      id: refId,
      environmentId: environment.id,
      renterEmail: environment.ownerId, // Set to owner as manual reserve
      renterName: `Reserva Manual: ${reason}`,
      renterPhone: phone.trim(),
      date: selectedFormattedDate,
      startTime,
      endTime,
      totalHours,
      totalPrice: 0, // Manual reserves are free of commission/platform simulated pricing
      pixCode: 'RESERVA_MANUAL_PROPRIETARIO',
      status: 'confirmed', // Instantly reserved
      contractAccepted: true,
      createdAt: new Date().toISOString()
    };

    onAddReservation(newReservation);
    setReason('');
    setPhone('');
    setFormError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-800 text-sm sm:text-base">
                Agenda Mensal & Reservas Manuais
              </h3>
              <p className="text-[11px] text-slate-400">Ambiente: <span className="font-bold text-slate-600">{environment.title}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Calendar Block (3 columns on large screens) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Months Selector */}
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-150">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 hover:bg-white rounded-lg text-slate-550 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {MONTHS_NAMES[currentMonth]} {currentYear}
                </span>
                <p className="text-[10px] text-slate-400 font-medium">Selecione um dia para visualizar ou agendar</p>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 hover:bg-white rounded-lg text-slate-550 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="border border-slate-150 rounded-2xl p-4 bg-white shadow-xs">
              
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_OF_WEEK.map((d) => (
                  <div key={d} className="text-center font-bold text-slate-400 text-[10px] uppercase py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day numbers */}
              <div className="grid grid-cols-7 gap-x-1.5 gap-y-2">
                
                {/* Blank days spacing at start */}
                {Array.from({ length: firstDayWeeklyIdx }).map((_, i) => (
                  <div key={`blank-${i}`} className="aspect-square bg-transparent" />
                ))}

                {/* Real Days list */}
                {Array.from({ length: daysCount }).map((_, i) => {
                  const dayNum = i + 1;
                  const isDaySelected = selectedDay === dayNum;
                  const { label, color } = getDayStatus(dayNum);
                  const isClosed = label === 'Fechado';
                  const isBusy = label.includes('reserva');

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => setSelectedDay(dayNum)}
                      className={`aspect-square p-1 rounded-xl border flex flex-col justify-between items-center transition-all cursor-pointer relative ${color} ${
                        isDaySelected 
                          ? 'ring-2 ring-emerald-500 ring-offset-1 border-emerald-500 scale-102 font-bold z-10' 
                          : ''
                      }`}
                    >
                      <span className={`text-xs font-mono font-bold mt-0.5 ${isDaySelected ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {dayNum}
                      </span>
                      
                      {/* Booking Tag indicator */}
                      {!isClosed && (
                        <span className={`text-[8px] tracking-tight font-extrabold px-1 rounded transform scale-90 truncate max-w-full ${
                          isBusy 
                            ? 'bg-amber-100 text-amber-800 font-bold' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isBusy ? 'Reservado' : 'Disponível'}
                        </span>
                      )}

                      {isClosed && (
                        <span className="text-[7.5px] font-semibold text-slate-400 bg-slate-100 px-1 rounded">
                          Fechado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calendar Legend Details for Clear View */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50/70 p-3 rounded-xl border border-slate-150 text-[10px] text-slate-600 font-semibold shadow-xs">
              <div className="flex items-center gap-1.5 justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300 shadow-xs shrink-0"></span>
                <span>Dia Livre</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-300 shadow-xs shrink-0"></span>
                <span>Ocupado / Reservado</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300 shadow-xs shrink-0"></span>
                <span>Espaço Fechado</span>
              </div>
            </div>

            {/* Bottom Info details */}
            <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
              <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-600">Sobre Reservas Manuais:</p>
                <p className="leading-relaxed mt-0.5">Reservas feitas nesta tela reservam imediatamente o horário escolhido. Clientes comuns não poderão alugar o mesmo espaço neste período.</p>
              </div>
            </div>
          </div>

          {/* Day Actions & Agenda Form (2 columns) */}
          <div className="lg:col-span-2 flex flex-col justify-between gap-6 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-6">
            
            {selectedDay ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                
                {/* Specific selected Agenda log */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">
                      Agenda de {String(selectedDay).padStart(2, '0')}/{String(currentMonth + 1).padStart(2, '0')}/{currentYear}
                    </h4>
                  </div>

                  {selectedDayConfig?.config.closed ? (
                    <div className="p-4 bg-red-50 text-red-800 rounded-xl text-xs flex items-center gap-2 border border-red-100">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>O estabelecimento está FECHADO aos {selectedDayConfig?.key === 'dom' ? 'Domingos' : selectedDayConfig?.key === 'sab' ? 'Sábados' : 'este dia'}.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 font-bold block w-fit">
                        ⏱️ Funcionamento: {selectedDayConfig?.config.start} às {selectedDayConfig?.config.end}
                      </span>

                      {selectedDayReservations.length === 0 ? (
                        <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center">
                          <p className="text-xs text-slate-400 font-semibold">Nenhuma reserva para este dia.</p>
                          <p className="text-[10px] text-slate-450 mt-0.5">Totalmente livre para receber reservas.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                          {selectedDayReservations.map((res) => {
                            const isBlock = res.renterEmail === environment.ownerId;
                            const isExpanded = expandedResId === res.id;
                            const displayRenterName = isBlock 
                              ? res.renterName.replace('Bloqueio Manual: ', '').replace('Reserva Manual: ', '') 
                              : res.renterName;

                            return (
                              <div 
                                key={res.id} 
                                className={`bg-gradient-to-br from-slate-50 to-white border rounded-xl overflow-hidden shadow-xs transition-all duration-200 ${
                                  isExpanded 
                                    ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/15' 
                                    : 'border-slate-150 hover:border-slate-350 hover:bg-slate-100/50'
                                }`}
                              >
                                {/* Clickable summary area */}
                                <div 
                                  onClick={() => setExpandedResId(isExpanded ? null : res.id)}
                                  className="p-3 flex items-center justify-between cursor-pointer select-none"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                                        isBlock ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {isBlock ? 'RESERVA MANUAL' : 'RESERVA'}
                                      </span>
                                      <strong className="text-slate-800 font-bold font-mono tracking-tight">{res.startTime} - {res.endTime}</strong>
                                    </div>
                                    <p className="text-[10px] text-slate-700 font-semibold mt-1">
                                      {isBlock ? displayRenterName : `Locatário: ${displayRenterName}`}
                                    </p>
                                    {!isExpanded && (
                                      <span className="text-[9px] text-slate-400 flex items-center gap-1 font-semibold">
                                        👉 Clique para ver detalhes completos...
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedResId(isExpanded ? null : res.id)}
                                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                      title={isExpanded ? "Ocultar detalhes" : "Ver mais detalhes"}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-emerald-600" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleConfirm(
                                          'Remover Reserva',
                                          'Tem certeza que deseja cancelar esta reserva e liberar essa data/faixa horária?',
                                          () => {
                                            onCancelReservation(res.id);
                                            if (isExpanded) setExpandedResId(null);
                                          },
                                          true
                                        );
                                      }}
                                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded-lg transition-colors cursor-pointer"
                                      title="Remover Reserva"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Expanded Details Drawer */}
                                {isExpanded && (
                                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-emerald-50/10 space-y-2 text-[10.5px] text-slate-600 leading-normal">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 border-b border-dashed border-slate-100 pb-2">
                                      <div>
                                        <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Nome do Cliente:</span>
                                        <span className="font-semibold text-slate-805 break-words flex items-center gap-1">
                                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {displayRenterName}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Email de Cadastro:</span>
                                        <span className="font-semibold text-slate-805 break-words flex items-center gap-1">
                                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {res.renterEmail}
                                        </span>
                                      </div>
                                      {res.renterPhone && (
                                        <div>
                                          <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">WhatsApp / Celular:</span>
                                          <span className="font-bold text-emerald-700 font-mono break-words flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 w-fit">
                                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" /> {res.renterPhone}
                                          </span>
                                        </div>
                                      )}
                                      <div>
                                        <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Código de Controle:</span>
                                        <span className="font-mono text-slate-650 bg-slate-100 px-1 py-0.5 rounded text-[9px] break-all w-fit block">
                                          #{res.id}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                                      <div>
                                        <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Data Selecionada:</span>
                                        <span className="font-medium text-slate-700">{res.date.split('-').reverse().join('/')}</span>
                                      </div>
                                      <div>
                                        <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Período Contratado:</span>
                                        <span className="font-medium text-slate-700">{res.startTime} às {res.endTime} ({res.totalHours}h)</span>
                                      </div>
                                      <div>
                                        <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Situação Financeira:</span>
                                        <span className={`inline-block font-bold px-1.5 py-0.2 text-[9px] rounded border ${
                                          res.status === 'confirmed' 
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
                                            : res.status === 'pending_payment'
                                              ? 'bg-amber-50 text-amber-800 border-amber-250'
                                              : 'bg-red-50 text-red-800 border-red-250'
                                        }`}>
                                          {res.status === 'confirmed' ? '✓ Pago / Confirmado' : res.status === 'pending_payment' ? '⏳ Aguardando Sinal' : '✗ Cancelado'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Adiantado / Total:</span>
                                        <span className="font-semibold text-slate-850">
                                          R$ {(res.paidAmount ?? res.totalPrice).toFixed(2).replace('.', ',')}
                                          {res.paymentOption === 'minimum' && ` (Sinal de R$ ${res.paidAmount?.toFixed(2).replace('.', ',')})`} / R$ {res.totalPrice.toFixed(2).replace('.', ',')}
                                        </span>
                                      </div>
                                    </div>

                                    {res.observation && (
                                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 mt-1">
                                        <span className="text-[8.5px] uppercase font-bold text-slate-500 block tracking-wider mb-0.5">📝 Observações & Pedidos:</span>
                                        <p className="text-slate-700 italic font-sans break-words text-[10px]">{res.observation}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Form to insert block */}
                {!selectedDayConfig?.config.closed && (
                  <form onSubmit={handleCreateManualReservation} className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3.5 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-1">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <h5 className="font-bold text-slate-700 text-xs">Agendar Reserva Manual</h5>
                    </div>

                    <div className="p-2.5 bg-amber-50 text-amber-900 rounded-lg text-[10px] border border-amber-250/30 leading-relaxed">
                      💡 <strong>Período Integral da Diária:</strong> O início e fim da reserva manual correspondem ao expediente do estabelecimento ({startTime} às {endTime}) e não são editáveis.
                    </div>

                    <div className="grid grid-cols-2 gap-3 opacity-80">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-550 mb-0.5 uppercase">Início</label>
                        <input
                          type="time"
                          disabled
                          value={startTime}
                          className="w-full px-2.5 py-1.5 border border-slate-150 bg-slate-100 rounded-lg text-xs font-semibold focus:outline-none cursor-not-allowed text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-550 mb-0.5 uppercase">Fim</label>
                        <input
                          type="time"
                          disabled
                          value={endTime}
                          className="w-full px-2.5 py-1.5 border border-slate-150 bg-slate-100 rounded-lg text-xs font-semibold focus:outline-none cursor-not-allowed text-slate-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-550 mb-0.5 uppercase">Nome do Cliente ou Finalidade *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: João Silva, Ensaio de Fotos, Confraternização..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-550 mb-0.5 uppercase flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> WhatsApp / Telefone do Cliente *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ex: (11) 99999-9999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium font-mono"
                      />
                    </div>

                    {formError && (
                      <div className="p-2.5 bg-red-50 text-red-800 rounded-lg text-[10px] flex items-start gap-1.5 leading-relaxed font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Registrar Reserva Manual
                    </button>
                  </form>
                )}

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Smile className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Nenhum dia selecionado</p>
                <p className="text-[10px] mt-0.5 text-slate-400">Clique em qualquer dia do calendário para ver a programação ou efetuar um bloqueio manual.</p>
              </div>
            )}

            {/* Bottom Footer block */}
            <div className="border-t border-slate-100 pt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 cursor-pointer"
              >
                Voltar ao Painel
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
