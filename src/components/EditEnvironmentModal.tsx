import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, ShieldAlert, Sparkles, Image as ImageIcon, MapPin, Users, DollarSign, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { Environment, EnvironmentCategory, WeeklyWorkingHours, CustomPricingRule } from '../types';
import MapPickerCard from './MapPickerCard';

interface EditEnvironmentModalProps {
  environment: Environment;
  onClose: () => void;
  onSave: (updatedEnv: Environment) => void;
  categories: { id: string; name: string; emoji: string }[];
  showConfirm?: (title: string, message: string, onConfirm: () => void, isDanger?: boolean) => void;
}

const SUGGESTED_AMENITIES = [
  'Ar-Condicionado', 'Wi-Fi de Alta Velocidade', 'Smart TV / Projetor', 
  'Quadro Branco / Flipchart', 'Café & Água Cortesia', 'Isolamento Acústico', 
  'Churrasqueira', 'Área Externa', 'Iluminação Fotográfica', 'Divã / Poltronas Confortáveis',
  'Estacionamento Pago no Prédio', 'Acessibilidade / Elevador', 'Segurança 24h'
];

export default function EditEnvironmentModal({ environment, onClose, onSave, categories, showConfirm }: EditEnvironmentModalProps) {
  const handleConfirm = (title: string, msg: string, onOk: () => void, isDanger = false) => {
    if (showConfirm) {
      showConfirm(title, msg, onOk, isDanger);
    } else {
      if (confirm(msg)) onOk();
    }
  };

  // Main form states
  const [title, setTitle] = useState(environment.title);
  const [category, setCategory] = useState<EnvironmentCategory>(environment.category);
  const [pricePerHour, setPricePerHour] = useState<number>(environment.pricePerHour);
  const [capacity, setCapacity] = useState<number>(environment.capacity);
  const [address, setAddress] = useState(environment.address);
  const [addressStreet, setAddressStreet] = useState(environment.addressStreet || '');
  const [addressNumber, setAddressNumber] = useState(environment.addressNumber || '');
  const [addressComplement, setAddressComplement] = useState(environment.addressComplement || '');
  const [addressNeighborhood, setAddressNeighborhood] = useState(environment.addressNeighborhood || '');
  const [addressCity, setAddressCity] = useState(environment.addressCity || '');

  // Synchronize compiled address
  useEffect(() => {
    const streetPart = addressStreet.trim();
    const numPart = addressNumber.trim();
    const compPart = addressComplement.trim();
    const neighPart = addressNeighborhood.trim();
    const cityPart = addressCity.trim();

    if (streetPart || numPart || compPart || neighPart || cityPart) {
      let formatted = '';
      if (streetPart) formatted += streetPart;
      if (numPart) formatted += `, nº ${numPart}`;
      if (compPart) formatted += ` - ${compPart}`;
      if (neighPart) formatted += `, Bairro: ${neighPart}`;
      if (cityPart) formatted += `, Cidade: ${cityPart}`;
      setAddress(formatted);
    }
  }, [addressStreet, addressNumber, addressComplement, addressNeighborhood, addressCity]);
  const [latitude, setLatitude] = useState<number>(environment.latitude || -23.5616);
  const [longitude, setLongitude] = useState<number>(environment.longitude || -46.6560);
  const [description, setDescription] = useState(environment.description);
  const [pixKey, setPixKey] = useState(environment.pixKey);
  const [pixType, setPixType] = useState(environment.pixType || 'cpf');
  const [contractRules, setContractRules] = useState(environment.contractRules || '');
  const [workingHours, setWorkingHours] = useState<WeeklyWorkingHours>(environment.workingHours);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(environment.amenities || []);
  const [images, setImages] = useState<string[]>(environment.images || []);
  const [videoUrl, setVideoUrl] = useState(environment.videoUrl || '');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Surcharges / Custom day rate states
  const [enableWeekendOverride, setEnableWeekendOverride] = useState<boolean>(
    environment.weekendPricePerHour !== undefined && environment.weekendPricePerHour > 0
  );
  const [weekendPricePerHour, setWeekendPricePerHour] = useState<number>(
    environment.weekendPricePerHour || Math.round(environment.pricePerHour * 1.25)
  );
  
  // Custom date-based pricing table
  const [customPricingRules, setCustomPricingRules] = useState<CustomPricingRule[]>(
    environment.customPricingRules || []
  );

  // Individual new dynamic pricing rule state
  const [newRuleDate, setNewRuleDate] = useState('');
  const [newRuleLabel, setNewRuleLabel] = useState('');
  const [newRulePrice, setNewRulePrice] = useState<number>(100);
  const [ruleError, setRuleError] = useState<string | null>(null);

  // Active sub-section tab inside editor modal
  const [activeTab, setActiveTab] = useState<'basics' | 'hours' | 'agreement' | 'pricing' | 'images'>('basics');

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities((prev) => prev.filter((item) => item !== amenity));
    } else {
      setSelectedAmenities((prev) => [...prev, amenity]);
    }
  };

  const toggleDayClosed = (day: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        closed: !prev[day].closed
      }
    }));
  };

  const updateTimes = (day: string, type: 'start' | 'end', val: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: val
      }
    }));
  };

  const handleAddCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleDate || !newRuleLabel.trim() || newRulePrice <= 0) {
      setRuleError('Por favor, preencha a data, o nome descritivo e o preço corretamente.');
      return;
    }

    // Verify duplication
    if (customPricingRules.some((r) => r.date === newRuleDate)) {
      setRuleError('Já existe uma regra cadastrada para esta data específica.');
      return;
    }

    setRuleError(null);

    const newRule: CustomPricingRule = {
      id: `rule-${Date.now()}`,
      date: newRuleDate,
      label: newRuleLabel.trim(),
      pricePerHour: Number(newRulePrice)
    };

    setCustomPricingRules((prev) => [...prev, newRule]);
    setNewRuleDate('');
    setNewRuleLabel('');
    setNewRulePrice(Math.round(pricePerHour * 1.5));
  };

  const handleRemoveCustomRule = (id: string) => {
    handleConfirm(
      'Remover Regra Especial',
      'Deseja realmente remover esta regra especial de precificação?',
      () => {
        setCustomPricingRules((prev) => prev.filter((rule) => rule.id !== id));
      },
      true
    );
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    handleConfirm(
      'Remover Imagem',
      'Deseja realmente remover esta foto/vídeo do anúncio?',
      () => {
        setImages((prev) => prev.filter((_, i) => i !== index));
      },
      true
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !address.trim() || !description.trim() || !pixKey.trim()) {
      alert('Por favor, certifique que preencheu todos os campos essenciais nas abas.');
      return;
    }

    if (images.length === 0) {
      alert('É recomendado inserir ao menos uma foto ilustrativa de seu espaço comercial.');
      return;
    }

    const updatedEnvironment: Environment = {
      ...environment,
      title: title.trim(),
      category,
      pricePerHour: Number(pricePerHour),
      capacity: Number(capacity),
      address: address.trim(),
      addressStreet: addressStreet.trim() || undefined,
      addressNumber: addressNumber.trim() || undefined,
      addressComplement: addressComplement.trim() || undefined,
      addressNeighborhood: addressNeighborhood.trim() || undefined,
      addressCity: addressCity.trim() || undefined,
      latitude: Number(latitude),
      longitude: Number(longitude),
      description: description.trim(),
      pixKey: pixKey.trim(),
      pixType,
      contractRules: contractRules.trim(),
      workingHours,
      amenities: selectedAmenities,
      images,
      videoUrl: videoUrl.trim() || undefined,
      weekendPricePerHour: enableWeekendOverride ? Number(weekendPricePerHour) : undefined,
      customPricingRules: customPricingRules
    };

    onSave(updatedEnvironment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-800 text-sm sm:text-base">
                Personalizar & Editar Anúncio
              </h3>
              <p className="text-[11px] text-slate-400">ID do Recinto: <span className="font-mono font-bold text-slate-500">{environment.id}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Tabs Navigator */}
        <div className="flex border-b border-slate-100 text-xs sm:text-sm overflow-x-auto bg-white shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`px-5 py-3 border-b-2 font-semibold transition-all whitespace-nowrap ${
              activeTab === 'basics' 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-slate-550 hover:text-slate-800'
            }`}
          >
            📋 Principal & PIX
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-5 py-3 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pricing' 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-slate-550 hover:text-slate-800'
            }`}
          >
            💰 Tarifas Diferenciadas
            {(enableWeekendOverride || customPricingRules.length > 0) && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hours')}
            className={`px-5 py-3 border-b-2 font-semibold transition-all whitespace-nowrap ${
              activeTab === 'hours' 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-slate-550 hover:text-slate-800'
            }`}
          >
            🕒 Funcionamento
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agreement')}
            className={`px-5 py-3 border-b-2 font-semibold transition-all whitespace-nowrap ${
              activeTab === 'agreement' 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-slate-550 hover:text-slate-800'
            }`}
          >
            📝 Regras do Contrato
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`px-5 py-3 border-b-2 font-semibold transition-all whitespace-nowrap ${
              activeTab === 'images' 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-slate-550 hover:text-slate-800'
            }`}
          >
            🖼️ Galeria de Fotos
          </button>
        </div>

        {/* Scrollable Editor Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* TAB: BASICS */}
            {activeTab === 'basics' && (
              <div className="space-y-5 animate-in fade-in duration-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Título do Anúncio *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria de Espaço *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as EnvironmentCategory)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-semibold"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Preço Padrão por Diária (R$) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(Math.max(1, Number(e.target.value)))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Capacidade Máxima de Pessoas *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={capacity}
                      onChange={(e) => setCapacity(Math.max(1, Number(e.target.value)))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                    />
                  </div>

                  <div className="col-span-2 md:col-span-1 border border-slate-100 p-2 rounded-xl bg-slate-50 flex flex-col justify-center">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Chave Recebimento PIX</label>
                    <div className="flex gap-1">
                      <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-sans flex items-center">{pixType}</span>
                      <input
                        type="text"
                        required
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent text-xs font-mono font-bold text-slate-850 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Detalhes do Endereço *
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Endereço (Rua, Av, etc) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Av. Brigadeiro Luís Antônio"
                        value={addressStreet}
                        onChange={(e) => setAddressStreet(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Nº *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 2300"
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Complemento</label>
                      <input
                        type="text"
                        placeholder="Ex: Sala 41"
                        value={addressComplement}
                        onChange={(e) => setAddressComplement(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Bairro *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Bela Vista"
                        value={addressNeighborhood}
                        onChange={(e) => setAddressNeighborhood(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Cidade e UF *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: São Paulo - SP"
                        value={addressCity}
                        onChange={(e) => setAddressCity(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  {address && (
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-slate-600 text-xs mt-3">
                      <span className="font-bold text-slate-800">Endereço Compilado para Busca:</span> {address}
                    </div>
                  )}

                  {/* Positioning pin inside visual Google Maps simulator */}
                  <div className="mt-3">
                    <MapPickerCard
                      latitude={latitude}
                      longitude={longitude}
                      onChange={(lat, lng) => {
                        setLatitude(lat);
                        setLongitude(lng);
                      }}
                      address={address}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição Comercial do Local *</label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 text-slate-800 resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-3">Comodidades Disponibilizadas</label>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_AMENITIES.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity);
                      return (
                        <button
                          type="button"
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-55 bg-emerald-50 border-emerald-550 border-emerald-500 text-emerald-800'
                              : 'bg-slate-50 border-slate-250/50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PRICING ( weekend surcharges & holidays rates ) */}
            {activeTab === 'pricing' && (
              <div className="space-y-6 animate-in fade-in duration-100">
                
                <div className="p-4 bg-emerald-50/55 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-1.5 leading-relaxed shadow-sm">
                  <p className="font-bold flex items-center gap-1 text-emerald-950 text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    Gerenciamento Avançado de Tarifas Dinâmicas
                  </p>
                  <p>
                    Diga adeus ao preço fixo! Conquiste o melhor aproveitamento de sua ocupação personalizando o valor por hora de acordo com a temporada ou fins de semana (sábado e domingo). Quando um locatário escolher um desses períodos, o valor será reajustado eletronicamente no cálculo final da reserva.
                  </p>
                </div>

                {/* Sub section A: Weekend Pricing override */}
                <div className="p-5 border border-slate-150 rounded-2xl bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 complex">Tarifa Diferenciada de Fim de Semana (Sáb/Dom)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Determine tarifas por hora exclusivas para datas que caiam no sábado ou domingo</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableWeekendOverride}
                        onChange={(e) => setEnableWeekendOverride(e.target.checked)}
                        className="sr-only peer cursor-pointer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {enableWeekendOverride && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 animate-in slide-in-from-top-1.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Preço Especial Sábado/Domingo (R$ / Diária) *</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={weekendPricePerHour}
                            onChange={(e) => setWeekendPricePerHour(Math.max(1, Number(e.target.value)))}
                            className="w-32 px-3 py-1.5 border border-slate-250 bg-slate-50 rounded-lg text-xs font-bold text-slate-800"
                          />
                          <span className="text-[10px] text-slate-400 font-medium">Preço normal de semana é R$ {pricePerHour}/diária</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub section B: Specific Holidays & Dates Overrides list creator */}
                <div className="p-5 border border-slate-150 rounded-2xl bg-white space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Preços para Feriados, Eventos Visados ou Datas Específicas</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Mapeie datas específicas do ano (como Ano Novo, Natal, Convenções) com valores de diária exclusivos</p>
                  </div>

                  {/* Form to insert custom rules */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3.5">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Adicionar Regra de Data Comercial</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase">Mapear Data *</label>
                        <input
                          type="date"
                          value={newRuleDate}
                          onChange={(e) => setNewRuleDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase">Nome / Descrição (Motivo) *</label>
                        <input
                          type="text"
                          placeholder="Ex: Natal, Carnaval, Show especial"
                          value={newRuleLabel}
                          onChange={(e) => setNewRuleLabel(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase">Preço Especial (R$ / Diária) *</label>
                        <input
                          type="number"
                          min="1"
                          value={newRulePrice}
                          onChange={(e) => setNewRulePrice(Math.max(1, Number(e.target.value)))}
                          className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs font-bold focus:outline-none text-emerald-800"
                        />
                      </div>
                    </div>

                    {ruleError && (
                      <div className="p-2.5 bg-red-50 text-red-800 border border-red-100 rounded-lg text-[10px] flex items-start gap-1.5 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>{ruleError}</span>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddCustomRule}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Regra Técnica
                      </button>
                    </div>
                  </div>

                  {/* Rendering active rules lists */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suas Regras por Data Ativas ({customPricingRules.length})</span>
                    {customPricingRules.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">Nenhuma tarifa específica de feriado ou alta temporada cadastrada.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
                        {customPricingRules.map((rule) => (
                          <div key={rule.date} className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl flex items-center justify-between text-xs transition-colors hover:border-slate-350">
                            <div className="space-y-1">
                              <span className="font-bold text-slate-800 font-mono">{rule.date.split('-').reverse().join('/')}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1 rounded font-bold uppercase">{rule.label}</span>
                                <span className="text-slate-600 font-bold">R$ {rule.pricePerHour}/diária</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomRule(rule.id)}
                              className="p-1 hover:bg-red-50 text-slate-450 hover:text-red-650 rounded-lg transition-colors cursor-pointer"
                              title="Remover regra de datas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* TAB: HOURS */}
            {activeTab === 'hours' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="p-4 bg-blue-50/45 rounded-xl border border-blue-100 flex gap-3 text-sm text-blue-900 leading-relaxed">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                  <div>
                    <h5 className="font-semibold text-blue-950 text-xs sm:text-sm">Intervalos de Aluguel</h5>
                    <p className="text-xs text-blue-800 mt-0.5">Determine em quais dias e horários seu espaço está disponível ao público.</p>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                  <div className="grid grid-cols-1 divide-y divide-slate-100">
                    {Object.keys(workingHours).map((day) => {
                      const info = workingHours[day];
                      const dayLabels: { [key: string]: string } = {
                        seg: 'Segunda-feira', ter: 'Terça-feira', qua: 'Quarta-feira',
                        qui: 'Quinta-feira', sex: 'Sexta-feira', sab: 'Sábado', dom: 'Domingo'
                      };

                      return (
                        <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 bg-slate-50/20">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleDayClosed(day)}
                              className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                                !info.closed 
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {info.closed ? 'FECHADO' : 'ABERTO'}
                            </button>
                            <span className="text-xs font-semibold text-slate-700">{dayLabels[day]}</span>
                          </div>

                          {!info.closed && (
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <span className="text-xs text-slate-550">Das</span>
                              <input
                                type="time"
                                required={!info.closed}
                                value={info.start}
                                onChange={(e) => updateTimes(day, 'start', e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                              />
                              <span className="text-xs text-slate-550">às</span>
                              <input
                                type="time"
                                required={!info.closed}
                                value={info.end}
                                onChange={(e) => updateTimes(day, 'end', e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          )}

                          {info.closed && (
                            <span className="text-xs text-slate-400 italic">Indisponível para locação</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AGREEMENT RULES */}
            {activeTab === 'agreement' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 flex gap-3 text-xs sm:text-sm text-yellow-905">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-slate-700">Regulamento Civil e Cláusulas Contratuais</h5>
                    <p className="text-[11px] text-slate-550 mt-0.5">Cláusulas de multa, barulho, check-out e integridade que o cliente deve concordar digitalmente antes de pagar.</p>
                  </div>
                </div>

                <textarea
                  required
                  rows={10}
                  value={contractRules}
                  onChange={(e) => setContractRules(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-xs font-mono text-slate-700 leading-relaxed"
                />
              </div>
            )}

            {/* TAB: IMAGES GALLERY */}
            {activeTab === 'images' && (
              <div className="space-y-5 animate-in fade-in duration-100">
                {/* Video URL Input Field */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                  <label className="block text-xs font-bold text-slate-705 flex items-center gap-1.5">
                    🎥 Link do Vídeo de Demonstração (Tour Virtual)
                  </label>
                  <input
                    type="url"
                    placeholder="Cole aqui o link do YouTube, Vimeo ou link direto MP4 (Ex: https://www.youtube.com/watch?v=...)"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 placeholder-slate-400 font-semibold transition-all"
                  />
                  <p className="text-[10px] text-slate-400">Excelente para dar confiança ao locatário! O portal habilitará um tocador dedicado nas páginas de detalhes e agendamento.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Carregar Foto ou Vídeo do Celular ou Computador *
                  </label>
                  <div className="relative border-2 border-dashed border-emerald-250/60 hover:border-emerald-500 bg-emerald-55/10 rounded-xl p-5 transition-all flex flex-col items-center justify-center text-center cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64String = reader.result as string;
                            setImages((prev) => [...prev, base64String]);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <ImageIcon className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-emerald-800">Clique para escolher foto ou vídeo da galeria do celular ou do PC</span>
                    <span className="text-[10px] text-slate-400 mt-1">Carregar sem URLs de forma limpa • JPG, PNG, WEBP, MP4 ou MOV</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500">Fotos & Vídeos Cadastrados ({images.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((img, index) => {
                      const isVid = img.startsWith('data:video/') || img.endsWith('.mp4') || img.endsWith('.mov') || img.endsWith('.webm') || img.includes('video');
                      return (
                        <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group">
                          {isVid ? (
                            <video src={img} className="w-full h-full object-cover" muted playsInline />
                          ) : (
                            <img 
                              src={img} 
                              alt="" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute inset-0 bg-red-650/80 bg-red-600/70 items-center justify-center text-white hidden group-hover:flex transition-opacity duration-150 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Clique em Salvar para atualizar as configurações</span>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-xl text-slate-650 bg-white hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Salvar Alterações
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
