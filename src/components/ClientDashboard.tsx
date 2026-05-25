import React, { useState } from 'react';
import { Calendar, Clock, DollarSign, FileText, CheckCircle, Shield, X, AlertTriangle, Info, Copy, Check, Star } from 'lucide-react';
import { Reservation, Environment, EnvironmentReview } from '../types';
import { generatePixPayload } from '../utils/pix';

interface ClientDashboardProps {
  reservations: Reservation[];
  environments: Environment[];
  onCancelReservation: (id: string) => void;
  onApproveReservation: (id: string) => void; // for simulated payment completion
  onPayRemainder?: (id: string) => void;
  renterEmail: string;
  onRequestCancelReservation?: (id: string) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void, isDanger?: boolean) => void;
  reviews?: EnvironmentReview[];
  onAddReview?: (resId: string, review: Omit<EnvironmentReview, 'id' | 'createdAt'>) => void;
}

export default function ClientDashboard({
  reservations,
  environments,
  onCancelReservation,
  onApproveReservation,
  onPayRemainder,
  renterEmail,
  onRequestCancelReservation,
  showConfirm,
  reviews = [],
  onAddReview
}: ClientDashboardProps) {

  const [reviewingResId, setReviewingResId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // States to pay remaining outstanding balance
  const [payingRemainderResId, setPayingRemainderResId] = useState<string | null>(null);
  const [copiedRemainderId, setCopiedRemainderId] = useState<string | null>(null);

  const getReservationReview = (resId: string) => {
    return reviews.find(r => r.id === `rev-${resId}`);
  };

  const hasExistingReview = (resId: string) => {
    return !!getReservationReview(resId);
  };

  const handleConfirm = (title: string, msg: string, onOk: () => void, isDanger = false) => {
    if (showConfirm) {
      showConfirm(title, msg, onOk, isDanger);
    } else {
      if (confirm(msg)) onOk();
    }
  };

  const myReservations = reservations.filter((r) => r.renterEmail === renterEmail);

  const [selectedContractRes, setSelectedContractRes] = useState<Reservation | null>(null);
  const [copiedResId, setCopiedResId] = useState<string | null>(null);

  const getEnvDetails = (id: string): Environment | undefined => {
    return environments.find((e) => e.id === id);
  };

  const isTodayOrAfter = (dateStr: string): boolean => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    return todayStr >= dateStr;
  };

  const copyPix = (code: string, resId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedResId(resId);
    setTimeout(() => setCopiedResId(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h2 className="font-display font-semibold text-slate-800 text-lg">Minhas Reservas Agendadas</h2>
        <p className="text-xs text-slate-400 mt-0.5">Veja todas as suas locações contratadas, consulte regras assinadas e liquide pendências de pagamento</p>
      </div>

      {myReservations.length === 0 ? (
        <div className="bg-white p-12 text-center border border-slate-100 rounded-2xl max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto text-lg">
            🗺️
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-700">Nenhuma reserva encontrada</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">Você ainda não alugou nenhum espaço. Dê uma olhada nos ambientes disponíveis na página inicial e faça seu agendamento já!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myReservations.map((res) => {
            const env = getEnvDetails(res.environmentId);
            if (!env) return null;

            return (
              <div 
                key={res.id} 
                className={`bg-white rounded-2xl border p-5 space-y-4 transition-all flex flex-col justify-between ${
                  res.status === 'confirmed' 
                    ? 'border-emerald-100 shadow-emerald-500/[0.01]' 
                    : res.status === 'pending_payment'
                      ? 'border-amber-150 border-amber-200'
                      : 'border-slate-100 opacity-75'
                }`}
              >
                {/* Header card summary */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">CÓD: {res.id}</span>
                      <h3 className="font-bold text-slate-800 text-sm truncate mt-0.5">{env.title}</h3>
                      <p className="text-[11px] text-slate-500 truncate">{env.address}</p>
                    </div>
                    
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                      res.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : res.status === 'pending_payment'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-red-50 text-red-700 border border-red-50'
                    }`}>
                      {res.status === 'confirmed' && 'RESERVADO & PAGO'}
                      {res.status === 'pending_payment' && 'AGUARDANDO PAGAMENTO'}
                      {res.status === 'cancelled' && 'CANCELADO'}
                    </span>
                  </div>

                  {/* Scheduled period variables */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs text-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wide">Data Agendada</span>
                        <strong className="text-slate-700 font-bold">{res.date.split('-').reverse().join('/')}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wide">Horário Alugado</span>
                        <strong className="text-slate-700 font-bold">{res.startTime} - {res.endTime}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 bg-emerald-50/20 p-2 px-1 rounded-xl border border-emerald-100/40 text-[10.5px] text-center font-sans">
                      <div>
                        <span className="text-[8.5px] text-slate-400 block uppercase font-extrabold tracking-wide">Total Geral</span>
                        <strong className="text-slate-600 font-bold">R$ {res.totalPrice.toFixed(2).replace('.', ',')}</strong>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-emerald-800/80 block uppercase font-extrabold tracking-wide">Valor Pago</span>
                        <strong className="text-emerald-700 font-bold">R$ {(res.paidAmount ?? res.totalPrice).toFixed(2).replace('.', ',')}</strong>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-amber-800/80 block uppercase font-extrabold tracking-wide">A Pagar</span>
                        <strong className={`font-extrabold ${res.totalPrice - (res.paidAmount ?? res.totalPrice) > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                          R$ {(res.totalPrice - (res.paidAmount ?? res.totalPrice)).toFixed(2).replace('.', ',')}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional PIX / Contract widgets if pending */}
                {res.status === 'pending_payment' && (
                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-amber-800">Finalizar Locação via PIX</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Use o código Pix Copia e Cola para pagar online.</p>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-700">R$ {res.totalPrice.toFixed(2)}</span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => copyPix(res.pixCode, res.id)}
                        className="flex-1 py-1.5 px-3 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copiedResId === res.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copiar PIX
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onApproveReservation(res.id)}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        Pagar Agora (Simulador)
                      </button>
                    </div>
                  </div>
                )}

                {/* Chosen third party partners / sponsors */}
                {res.status === 'confirmed' && res.selectedPartnerIds && res.selectedPartnerIds.length > 0 && (
                  <div className="space-y-2 p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-xl">
                    <span className="font-bold text-indigo-950 block text-[10px] uppercase tracking-wider flex items-center gap-1">
                      🌟 Serviços Opcionais Contratados
                    </span>
                    <div className="space-y-1.5">
                      {res.selectedPartnerIds.map(partnerId => {
                        const savedPartnersRaw = localStorage.getItem('aluguel_parceiros');
                        const allPartners: any[] = savedPartnersRaw ? JSON.parse(savedPartnersRaw) : [];
                        const partner = allPartners.find(p => p.id === partnerId);
                        if (!partner) return null;
                        const catLabel = partner.category === 'decor' ? '🌸 Ornamentação' : partner.category === 'buffet' ? '🍹 Buffet' : partner.category === 'music' ? '🎵 DJ/Iluminação' : partner.category === 'cleanup' ? '✨ Limpeza' : partner.category === 'photo' ? '📸 Fotografia' : '⚡ Serviço';
                        return (
                          <div key={partner.id} className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-100 flex flex-col gap-0.5">
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-slate-800">{partner.name}</span>
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">{catLabel}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">{partner.description}</p>
                            <span className="text-slate-600 font-bold text-[9.5px] mt-0.5 font-mono">
                              📱 Falar com {partner.contactName}: {partner.phone}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Outstanding remaining balance PIX payment */}
                {res.status === 'confirmed' && (res.totalPrice - (res.paidAmount ?? res.totalPrice)) > 0 && (
                  <div className="p-3.5 bg-sky-50/70 border border-sky-150 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-sky-900 flex items-center gap-1">
                          💳 Saldo Restante Pendente
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Você fez um pagamento parcial. Quite os restantes 100% via PIX agora.
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-sky-850 px-2 py-1 bg-sky-100/50 rounded-xl font-mono shrink-0">
                        R$ {(res.totalPrice - (res.paidAmount ?? res.totalPrice)).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {payingRemainderResId === res.id ? (
                      <div className="space-y-2.5 p-2.5 bg-white rounded-xl border border-sky-100 animate-in slide-in-from-top-1">
                        <div className="text-center space-y-1">
                          <span className="text-[9px] uppercase font-bold text-slate-400">Código PIX "Copia e Cola"</span>
                          <span className="block text-[10px] bg-slate-50 p-2 rounded border border-slate-100 break-all select-all font-mono text-slate-650 text-left">
                            {(() => {
                              const amt = res.totalPrice - (res.paidAmount ?? 0);
                              return generatePixPayload(env.pixKey || 'admin@alugaambiente.com.br', amt, `REM-${res.id}`);
                            })()}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const amt = res.totalPrice - (res.paidAmount ?? 0);
                              const code = generatePixPayload(env.pixKey || 'admin@alugaambiente.com.br', amt, `REM-${res.id}`);
                              navigator.clipboard.writeText(code);
                              setCopiedRemainderId(res.id);
                              setTimeout(() => setCopiedRemainderId(null), 2000);
                            }}
                            className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            {copiedRemainderId === res.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-505" /> Copiar PIX
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onPayRemainder?.(res.id);
                              setPayingRemainderResId(null);
                            }}
                            className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            Quitar Agora (Simulador)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPayingRemainderResId(res.id)}
                        className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        ⚡ Pagar Saldo Restante com Pix
                      </button>
                    )}
                  </div>
                )}

                {/* Bottom line actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-3.5 mt-2 text-xs gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedContractRes(res)}
                      className="text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 self-start sm:self-auto"
                    >
                      <FileText className="w-3.5 h-3.5" /> Ver Contrato Assinado
                    </button>

                    {res.status === 'confirmed' && (
                      isTodayOrAfter(res.date) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingResId(reviewingResId === res.id ? null : res.id);
                            const existing = getReservationReview(res.id);
                            if (existing) {
                              setRating(existing.rating);
                              setComment(existing.comment);
                            } else {
                              setRating(5);
                              setComment('');
                            }
                          }}
                          className="text-amber-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 flex items-center"
                        >
                          <Star className={`w-3.5 h-3.5 mr-1 ${hasExistingReview(res.id) ? 'fill-amber-400 text-amber-500' : 'text-amber-500'}`} />
                          {hasExistingReview(res.id) ? 'Ver Minha Avaliação' : 'Avaliar este Local'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg" title="Você poderá avaliar o local no dia agendado ou depois">
                          🔒 Avaliação disponível em {res.date.split('-').reverse().join('/')}
                        </span>
                      )
                    )}
                  </div>

                               {res.status === 'confirmed' && (
                      res.cancelRequested ? (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-250 px-2.5 py-1 rounded animate-pulse" title="A solicitação de cancelamento foi enviada e está aguardando a aprovação do anfitrião">
                          ⏰ Cancelamento Solicitado (Aguardando Anfitrião)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            handleConfirm(
                              'Solicitar Cancelamento',
                              'Tem certeza de que deseja solicitar o cancelamento desta reserva? O anfitrião será notificado para aceitar ou recusar.',
                              () => {
                                onRequestCancelReservation?.(res.id);
                              },
                              true
                            );
                          }}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-bold border border-red-200 rounded-lg text-[10px] transition-colors cursor-pointer"
                          title="Enviar pedido de cancelamento para o anfitrião aprovar"
                        >
                          Solicitar Cancelamento
                        </button>
                      )
                    )}

                    {res.status === 'pending_payment' && (
                      <button
                        type="button"
                        onClick={() => {
                          handleConfirm(
                            'Desistir da Reserva',
                            'Deseja realmente cancelar esta reserva pendente? O horário correspondente será totalmente liberado.',
                            () => {
                              onCancelReservation(res.id);
                            },
                            true
                          );
                        }}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-red-600 font-bold border border-slate-200 rounded-lg text-[10px] transition-colors cursor-pointer"
                        title="Desistir desta reserva pendente de Pix"
                      >
                        Desistir / Cancelar
                      </button>
                    )}

                    {res.status === 'cancelled' && (
                      <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 font-bold px-2 py-1 rounded">
                        Reserva Cancelada definitivamente
                      </span>
                    )}
                  </div>

                {/* COLLAPSIBLE REVIEW ACCORDION PANEL */}
                {reviewingResId === res.id && (
                  <div className="mt-3 bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3 animate-in slide-in-from-top-1 duration-150">
                    {hasExistingReview(res.id) ? (
                      <div className="space-y-1.5 font-sans">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Sua Avaliação Realizada</span>
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">✓ Enviada</span>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-4 h-4 ${idx < getReservationReview(res.id)!.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100">
                          "{getReservationReview(res.id)!.comment || 'Sem comentários textuais.'}"
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-700">Como foi a sua experiência com a locação?</h4>
                          <p className="text-[10px] text-slate-400">Sua avaliação ajuda outros visitantes a encontrar os melhores espaços.</p>
                        </div>

                        {/* Interactive Star grid */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, idx) => {
                            const val = idx + 1;
                            const isActive = (hoverRating !== null ? hoverRating : rating) >= val;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setRating(val)}
                                onMouseEnter={() => setHoverRating(val)}
                                onMouseLeave={() => setHoverRating(null)}
                                className="cursor-pointer hover:scale-110 active:scale-95 transition-all focus:outline-none"
                              >
                                <Star
                                  className={`w-5.5 h-5.5 ${isActive ? 'fill-amber-400 text-amber-500' : 'text-slate-350 text-slate-300'}`}
                                />
                              </button>
                            );
                          })}
                        </div>

                        {/* Comments text input area */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">Escreva um breve comentário (opcional):</label>
                          <textarea
                            rows={2}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Exemplo: Espaço limpo, boa iluminação, anfitrião atencioso no check-in..."
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700 placeholder-slate-400 outline-none"
                          />
                        </div>

                        {/* Submit Actions */}
                        <div className="flex justify-end gap-2 text-xs pt-1">
                          <button
                            type="button"
                            onClick={() => setReviewingResId(null)}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onAddReview?.(res.id, {
                                environmentId: res.environmentId,
                                renterEmail: renterEmail,
                                renterName: res.renterName,
                                rating,
                                comment: comment.trim()
                              });
                              setReviewingResId(null);
                            }}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs hover:shadow-sm cursor-pointer"
                          >
                            Enviar Avaliação
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      )}

      {/* Contract Reader Modal */}
      {selectedContractRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-display font-semibold text-slate-800 text-sm">Contrato de Locação Assinado</h3>
                <p className="text-[11px] text-slate-400">Assinado digitalmente em {new Date(selectedContractRes.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <button
                onClick={() => setSelectedContractRes(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100/60 flex gap-2.5 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-950">Acordo Digital Formalizado</p>
                  <p className="text-emerald-800 mt-0.5 leading-relaxed">
                    O locatário <strong>{selectedContractRes.renterName} (email: {selectedContractRes.renterEmail})</strong> declarou aceite pleno a todas as cláusulas e multas abaixo para fruição do local.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Cláusulas de Locação</h4>
                <div className="w-full h-80 bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs font-mono text-slate-600 leading-relaxed overflow-y-auto whitespace-pre-wrap">
                  {getEnvDetails(selectedContractRes.environmentId)?.contractRules || 'Cláusulas Gerais Padrão da Plataforma.'}
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedContractRes(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
