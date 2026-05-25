import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShieldAlert, Sparkles, Image as ImageIcon, MapPin, Users, DollarSign, Clock, Check } from 'lucide-react';
import { Environment, EnvironmentCategory, WeeklyWorkingHours, UserProfile } from '../types';
import MapPickerCard from './MapPickerCard';

interface AddEnvironmentModalProps {
  onClose: () => void;
  onAdd: (newEnv: Environment, autoLoginUser?: UserProfile) => void;
  currentUser: UserProfile;
  categories: { id: string; name: string; emoji: string }[];
  showConfirm?: (title: string, message: string, onConfirm: () => void, isDanger?: boolean) => void;
}

const PRESET_CONTRACTS = {
  meeting: `REGRAS DO ESPAÇO CORPORATIVO / SALA DE REUNIÃO:

1. CANCELAMENTO: Permitido com estorno total de valor se solicitado com até 24 horas de antecedência.
2. COMPORTAMENTO: Ambiente compartilhado corporativo. Respeite as regras de convívio do condomínio, evitando ruídos excessivos nas áreas externas.
3. CONVERSAÇÃO / SOM: Proibido som de nível de festa. Somente apresentações nas TVs ou projetor são permitidos dentro da sala fechada.
4. EQUIPAMENTOS: Eventuais quebras de adaptadores HDMI, controles ou TV deverão ser pagas pelo locatário.
5. HORÁRIO: Não há tolerância técnica para saídas em atraso devido ao cronograma de próximas reservas.`,

  studio: `CONTRATO E REGRAS DO ESTÚDIO DE GRAVAÇÃO/FOTO:

1. FUNDOS DE PAPEL: O papel de fundo de estúdio custa R$ 40,00 por metro se for rasgado ou receber sujeira grave de sapatos sujos. Use calçados limpos.
2. LUZES E EQUIPAMENTO: O anfitrião dará a instrução inicial. Equipamentos de alto valor devem ser mantidos nos tripés e manuseados com extremo zelo.
3. ORGANIZAÇÃO: Deixar cabos enrolados e luzes desligadas ao final da locação.
4. CAPACIDADE: Máximo de pessoas estrito para não sobrecarregar as linhas elétricas e causar superaquecimento.
5. ANIMAIS: Animais domésticos para ensaio fotográfico são permitidos sob aprovação prévia.`,

  party: `TERMO DE COMPROMISSO - SALÃO DE FESTAS / ESPAÇO DE EVENTOS:

1. LEI DO SILÊNCIO: Conforme as leis vigentes, o volume externo de som deve ser reduzido drasticamente após as 22h00.
2. TAXA DE LIMPEZA: O locatário é responsável pela remoção de detritos maiores e lixo de decoração. O salão é limpo, mas sujeira extrema resultará em multa de R$ 180,00.
3. SEGURANÇA E CONVIDADOS: É obrigatório enviar a lista de participantes com RG na véspera do check-in para liberação na guarita de controle.
4. BEBIDAS DE VIDRO: Proibidos copos ou garrafas de vidro perto da área externa/gramado. Priorize acrílicos ou copos de papel.
5. ENTRADA DE CRIANÇAS: Devem estar sempre acompanhadas de seus respectivos pais ou responsáveis legais.`,

  general: `DIRETRIZES GERAIS DE ALUGUEL DE AMBIENTE:

1. DA DISPONIBILIDADE: O espaço só poderá ser acessado nos horários estritamente reservados e confirmados nesta plataforma.
2. DA LIMPEZA E CUIDADO: Devolva o local nas mesmas condições que encontrou. Cuidado com o mobiliário.
3. DO CANCELAMENTO: Política flexível com até 48 horas de antecedência ou estorno total se o espaço apresentar problemas técnicos e o anfitrião cancelar.`
};

// Gallery of beautiful hand-picked space pictures by category
const CATEGORY_IMAGE_PRESETS: { [key in EnvironmentCategory]: string[] } = {
  meeting: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80'
  ],
  studio: [
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1520390138845-126468fc7d0a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1459706113486-66dce5af7cb2?auto=format&fit=crop&w=800&q=80'
  ],
  party: [
    'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80'
  ],
  office: [
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'
  ],
  classroom: [
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544535830-9dff9a014bb5?auto=format&fit=crop&w=800&q=80'
  ],
  consulting: [
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=800&q=80'
  ]
};

const DEFAULT_WEEKLY_WORKING_HOURS: WeeklyWorkingHours = {
  seg: { start: '08:00', end: '18:00', closed: false },
  ter: { start: '08:00', end: '18:00', closed: false },
  qua: { start: '08:00', end: '18:00', closed: false },
  qui: { start: '08:00', end: '18:00', closed: false },
  sex: { start: '08:00', end: '18:00', closed: false },
  sab: { start: '09:00', end: '14:00', closed: false },
  dom: { start: '00:00', end: '00:00', closed: true }
};

const SUGGESTED_AMENITIES = [
  'Ar-Condicionado', 'Wi-Fi de Alta Velocidade', 'Smart TV / Projetor', 
  'Quadro Branco / Flipchart', 'Café & Água Cortesia', 'Isolamento Acústico', 
  'Churrasqueira', 'Área Externa', 'Iluminação Fotográfica', 'Divã / Poltronas Confortáveis',
  'Estacionamento Pago no Prédio', 'Acessibilidade / Elevador', 'Segurança 24h'
];

export default function AddEnvironmentModal({ onClose, onAdd, currentUser, categories, showConfirm }: AddEnvironmentModalProps) {
  const handleConfirm = (title: string, msg: string, onOk: () => void, isDanger = false) => {
    if (showConfirm) {
      showConfirm(title, msg, onOk, isDanger);
    } else {
      if (confirm(msg)) onOk();
    }
  };

  const getCategoryPresets = (cat: string): string[] => {
    return CATEGORY_IMAGE_PRESETS[cat as any] || CATEGORY_IMAGE_PRESETS.party;
  };

  const getPresetContract = (cat: string): string => {
    if (cat === 'meeting') return PRESET_CONTRACTS.meeting;
    if (cat === 'studio') return PRESET_CONTRACTS.studio;
    if (cat === 'party') return PRESET_CONTRACTS.party;
    return PRESET_CONTRACTS.general;
  };

  // State variables for form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EnvironmentCategory>(categories[0]?.id || 'party');
  const [pricePerHour, setPricePerHour] = useState<number>(200);
  const [capacity, setCapacity] = useState<number>(50);
  const [address, setAddress] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('');
  const [addressCity, setAddressCity] = useState('');

  // Auth fields for final step
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Automatically update formatted full address from component fields
  useEffect(() => {
    const streetPart = addressStreet.trim();
    const numPart = addressNumber.trim();
    const compPart = addressComplement.trim();
    const neighPart = addressNeighborhood.trim();
    const cityPart = addressCity.trim();

    let formatted = '';
    if (streetPart) formatted += streetPart;
    if (numPart) formatted += `, nº ${numPart}`;
    if (compPart) formatted += ` - ${compPart}`;
    if (neighPart) formatted += `, Bairro: ${neighPart}`;
    if (cityPart) formatted += `, Cidade: ${cityPart}`;

    setAddress(formatted);
  }, [addressStreet, addressNumber, addressComplement, addressNeighborhood, addressCity]);
  const [latitude, setLatitude] = useState<number>(-4.2691);
  const [longitude, setLongitude] = useState<number>(-55.9904);
  const [description, setDescription] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixType, setPixType] = useState<'cpf' | 'cnpj' | 'email' | 'phone' | 'random'>('cpf');
  const [contractRules, setContractRules] = useState(PRESET_CONTRACTS.party);
  const [workingHours, setWorkingHours] = useState<WeeklyWorkingHours>(DEFAULT_WEEKLY_WORKING_HOURS);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['Ar-Condicionado', 'Wi-Fi de Alta Velocidade', 'Acessibilidade / Elevador', 'Segurança 24h']);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [images, setImages] = useState<string[]>(['https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=800&q=80']);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);

  // Tab control
  const [activeTab, setActiveTab] = useState<'basics' | 'hours' | 'agreement' | 'images' | 'auth'>('basics');
  const [modalError, setModalError] = useState<string | null>(null);

  const validateStep = (step: 'basics' | 'hours' | 'agreement' | 'images' | 'auth'): { valid: boolean; error: string | null } => {
    if (step === 'basics') {
      if (!title.trim()) {
        return { valid: false, error: 'Por favor, informe o título do espaço.' };
      }
      if (!addressStreet.trim()) {
        return { valid: false, error: 'Por favor, informe a Rua/Avenida do endereço.' };
      }
      if (!addressNumber.trim()) {
        return { valid: false, error: 'Por favor, informe o número do endereço.' };
      }
      if (!addressNeighborhood.trim()) {
        return { valid: false, error: 'Por favor, informe o bairro do endereço.' };
      }
      if (!addressCity.trim()) {
        return { valid: false, error: 'Por favor, informe a cidade do endereço.' };
      }
      if (!description.trim()) {
        return { valid: false, error: 'Por favor, adicione uma descrição detalhada do espaço.' };
      }
      if (!pixKey.trim()) {
        return { valid: false, error: 'Deixe sua chave PIX configurada para receber pagamentos.' };
      }
      if (pricePerHour <= 0 || isNaN(pricePerHour)) {
        return { valid: false, error: 'O valor por hora deve ser maior que zero R$.' };
      }
      if (capacity <= 0 || isNaN(capacity)) {
        return { valid: false, error: 'A capacidade de pessoas deve ser maior que zero.' };
      }
    }
    if (step === 'hours') {
      const hasAtLeastOneOpenDay = Object.values(workingHours).some(day => !(day as any).closed);
      if (!hasAtLeastOneOpenDay) {
        return { valid: false, error: 'Seu espaço comercial precisa estar aberto para reservas em pelo menos um dia da semana.' };
      }
    }
    if (step === 'agreement') {
      if (!contractRules.trim()) {
        return { valid: false, error: 'As regras do contrato não podem estar vazias.' };
      }
    }
    if (step === 'auth') {
      if (currentUser.email === '') {
        const emailVal = authEmail.trim().toLowerCase();
        const passVal = authPassword.trim();
        if (!emailVal || !passVal) {
          return { valid: false, error: 'Por favor, preencha o e-mail e a senha do anfitrião.' };
        }
        if (authMode === 'register') {
          const nameVal = authName.trim();
          const confirmVal = authConfirmPassword.trim();
          if (!nameVal) {
            return { valid: false, error: 'Por favor, informe seu nome completo.' };
          }
          if (passVal.length < 4) {
            return { valid: false, error: 'A senha do anfitrião deve ter pelo menos 4 caracteres.' };
          }
          if (passVal !== confirmVal) {
            return { valid: false, error: 'As senhas digitadas não coincidem.' };
          }
        }
      }
    }
    return { valid: true, error: null };
  };

  const handleTabTransition = (targetTab: 'basics' | 'hours' | 'agreement' | 'images' | 'auth') => {
    setModalError(null);
    const tabOrder: ('basics' | 'hours' | 'agreement' | 'images' | 'auth')[] = ['basics', 'hours', 'agreement', 'images', 'auth'];
    const currentIndex = tabOrder.indexOf(activeTab);
    const targetIndex = tabOrder.indexOf(targetTab);

    if (targetIndex > currentIndex) {
      for (let i = currentIndex; i < targetIndex; i++) {
        const stepToValidate = tabOrder[i];
        if (stepToValidate === 'auth' && currentUser.email !== '') continue;
        const check = validateStep(stepToValidate);
        if (!check.valid) {
          setModalError(check.error);
          setActiveTab(stepToValidate);
          return;
        }
      }
    }
    setActiveTab(targetTab);
  };

  // Set preset contract and default template images when category changes
  const handleCategoryChange = (cat: EnvironmentCategory) => {
    setCategory(cat);
    // Apply preset template
    setContractRules(getPresetContract(cat));

    // Seed empty image inputs with presets
    setImages([getCategoryPresets(cat)[0]]);
    setSelectedPresetIndex(0);
  };

  const selectPresetImage = (url: string, index: number) => {
    setImages([url]);
    setSelectedPresetIndex(index);
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    handleConfirm(
      'Remover Imagem',
      'Tem certeza que deseja remover esta foto/vídeo do anúncio?',
      () => {
        setImages((prev) => prev.filter((_, i) => i !== index));
      },
      true
    );
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities((prev) => prev.filter((item) => item !== amenity));
    } else {
      setSelectedAmenities((prev) => [...prev, amenity]);
    }
  };

  // Toggle working hours open/close
  const toggleDayClosed = (day: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        closed: !prev[day].closed
      }
    }));
  };

  // Update working hours for a specific day
  const updateTimes = (day: string, type: 'start' | 'end', val: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: val
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    // Validate all sequential tabs before submitting
    const tabOrder: ('basics' | 'hours' | 'agreement' | 'images' | 'auth')[] = ['basics', 'hours', 'agreement', 'images', 'auth'];
    for (const step of tabOrder) {
      if (step === 'auth' && currentUser.email !== '') continue;
      const check = validateStep(step);
      if (!check.valid) {
        setModalError(check.error);
        if (step === 'auth') {
          setAuthError(check.error);
        }
        setActiveTab(step);
        return;
      }
    }

    let finalOwnerEmail = currentUser.email;
    let autoLoginUserProfile: UserProfile | undefined = undefined;

    // If guest, they Must complete the final auth form
    if (currentUser.email === '') {
      setAuthError(null);
      const emailVal = authEmail.trim().toLowerCase();
      const passVal = authPassword.trim();

      if (authMode === 'register') {
        const nameVal = authName.trim();

        // Add to localStorage saved hosts
        const savedRaw = localStorage.getItem('aluga_itb_registered_hosts');
        let hosts: any[] = [];
        if (savedRaw) {
          try { hosts = JSON.parse(savedRaw); } catch(e) {}
        }
        
        if (hosts.some(h => h.email.toLowerCase() === emailVal)) {
          setAuthError('Este e-mail de anfitrião já está cadastrado.');
          setModalError('Este e-mail de anfitrião já está cadastrado.');
          setActiveTab('auth');
          return;
        }

        const newHost = { name: nameVal, email: emailVal, passwordHash: passVal };
        localStorage.setItem('aluga_itb_registered_hosts', JSON.stringify([...hosts, newHost]));

        autoLoginUserProfile = {
          name: nameVal,
          email: emailVal,
          role: 'owner',
          balance: 0
        };
        finalOwnerEmail = emailVal;
      } else {
        // Login mode verification
        const savedRaw = localStorage.getItem('aluga_itb_registered_hosts');
        let hosts: any[] = [
          { name: 'Beatriz S. (Anfitriã)', email: 'beatriz@alugaitb.com.br', passwordHash: '123456' },
          { name: 'Tapajós Studio Owner', email: 'studio@alugaitb.com.br', passwordHash: '123456' },
          { name: 'Clínica Perpétuo Socorro', email: 'clinica@alugaitb.com.br', passwordHash: '123456' }
        ];
        if (savedRaw) {
          try {
            const parsed = JSON.parse(savedRaw);
            if (Array.isArray(parsed)) {
              parsed.forEach(p => {
                if (!hosts.some(h => h.email.toLowerCase() === p.email.toLowerCase())) {
                  hosts.push(p);
                }
              });
            }
          } catch(e) {}
        }

        const match = hosts.find(h => h.email.toLowerCase() === emailVal && h.passwordHash === passVal);
        if (!match) {
          setAuthError('Credenciais incorretas de anfitrião. Tente novamente ou alterne para cadastro.');
          setModalError('Credenciais incorretas de anfitrião. Tente novamente ou alterne para cadastro.');
          setActiveTab('auth');
          return;
        }

        autoLoginUserProfile = {
          name: match.name,
          email: match.email,
          role: 'owner',
          balance: match.email === 'beatriz@alugaitb.com.br' ? 1450 : 0
        };
        finalOwnerEmail = emailVal;
      }
    }

    // Final image backup if host didn't select any
    const finalImages = images.length > 0 
      ? images 
      : [getCategoryPresets(category)[0]];

    const newEnvironment: Environment = {
      id: `env-${Date.now()}`,
      title,
      description,
      category,
      pricePerHour: Number(pricePerHour) || 40,
      capacity: Number(capacity) || 4,
      address,
      addressStreet: addressStreet.trim() || undefined,
      addressNumber: addressNumber.trim() || undefined,
      addressComplement: addressComplement.trim() || undefined,
      addressNeighborhood: addressNeighborhood.trim() || undefined,
      addressCity: addressCity.trim() || undefined,
      latitude: Number(latitude),
      longitude: Number(longitude),
      images: finalImages,
      ownerId: finalOwnerEmail,
      pixKey,
      pixType,
      contractRules,
      workingHours,
      amenities: selectedAmenities,
      videoUrl: videoUrl.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    onAdd(newEnvironment, autoLoginUserProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-slate-800">Anunciar Novo Espaço</h2>
              <p className="text-xs text-slate-500">Cadastre seu ambiente para locações por hora</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Tabs Nav */}
        <div className="flex border-b border-slate-100 text-sm overflow-x-auto bg-white shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => handleTabTransition('basics')}
            className={`px-5 py-3 border-b-2 font-medium transition-all ${
              activeTab === 'basics' 
                ? 'border-emerald-600 text-emerald-600 font-semibold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Informações Básicas
          </button>
          <button
            type="button"
            onClick={() => handleTabTransition('hours')}
            className={`px-5 py-3 border-b-2 font-medium transition-all ${
              activeTab === 'hours' 
                ? 'border-emerald-600 text-emerald-600 font-semibold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🕒 Funcionamento
          </button>
          <button
            type="button"
            onClick={() => handleTabTransition('agreement')}
            className={`px-5 py-3 border-b-2 font-medium transition-all ${
              activeTab === 'agreement' 
                ? 'border-emerald-600 text-emerald-600 font-semibold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📝 Regras do Contrato
          </button>
          <button
            type="button"
            onClick={() => handleTabTransition('images')}
            className={`px-5 py-3 border-b-2 font-medium transition-all ${
              activeTab === 'images' 
                ? 'border-emerald-600 text-emerald-600 font-semibold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🖼️ Fotos do Local
          </button>
          {currentUser.email === '' && (
            <button
              type="button"
              onClick={() => handleTabTransition('auth')}
              className={`px-5 py-3 border-b-2 font-medium transition-all ${
                activeTab === 'auth' 
                  ? 'border-emerald-600 text-emerald-600 font-semibold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              🔑 Conta do Anfitrião
            </button>
          )}
        </div>

        {/* Scrollable Form Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {modalError && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold rounded-2xl leading-relaxed flex items-center gap-3.5 animate-in fade-in slide-in-from-top-3 duration-200">
              <span className="p-1.5 bg-rose-100 text-rose-650 rounded-lg text-sm shrink-0">⚠️</span>
              <div className="space-y-0.5">
                <p className="font-bold text-rose-950 text-xs">Existem pendências nesta etapa</p>
                <p className="font-normal text-rose-700 text-[11px] leading-tight">{modalError}</p>
              </div>
            </div>
          )}
          
          {/* Tab: basics */}
          {activeTab === 'basics' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Título do Anúncio *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sala executiva equipada com TV 4K "
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria de Ambiente *</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as EnvironmentCategory)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Preço por Diária (R$) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pricePerHour}
                    onChange={(e) => setPricePerHour(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Capacidade Máxima *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Chave de Recebimento PIX *</label>
                  <div className="flex gap-1.5">
                    <select
                      value={pixType}
                      onChange={(e) => setPixType(e.target.value as any)}
                      className="px-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="phone">Celular</option>
                      <option value="random">Aleatória</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Chave PIX..."
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-semibold font-mono"
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

                {/* Intelligent maps geocoding pin positioner */}
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição Detalhada do Local *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Quais são as qualidades do ambiente? Detalhe o mobiliário, a facilidade de acesso, internet, e outros pontos de venda interessantes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 resize-none"
                />
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-3">Comodidades Inclusas no Valor</label>
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
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Hours */}
          {activeTab === 'hours' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 flex gap-3 text-sm text-blue-800">
                <Clock className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Períodos de Funcionamento</p>
                  <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                    Defina em quais dias da semana e horários seu espaço está aberto para receber reservas. Clientes não conseguirão agendar horários que estejam fora deste intervalo ou em dias assinalados como "Fechado".
                  </p>
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
                      <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 bg-slate-50/30">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleDayClosed(day)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                              !info.closed 
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {info.closed ? 'FECHADO' : 'ABERTO'}
                          </button>
                          <span className="text-sm font-semibold text-slate-700">{dayLabels[day]}</span>
                        </div>

                        {!info.closed && (
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="text-xs text-slate-500">Das</span>
                            <input
                              type="time"
                              required={!info.closed}
                              value={info.start}
                              onChange={(e) => updateTimes(day, 'start', e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <span className="text-xs text-slate-500">às</span>
                            <input
                              type="time"
                              required={!info.closed}
                              value={info.end}
                              onChange={(e) => updateTimes(day, 'end', e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        )}

                        {info.closed && (
                          <span className="text-xs text-slate-400 italic">Sem expedientes de locação</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Agreement */}
          {activeTab === 'agreement' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50 flex gap-3 text-sm text-amber-800">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Regras Contratuais e de Convivência</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    Defina os termos, responsabilidades sobre quebras, regras de barulho e orientações gerais do condomínio. O cliente será **obrigado** a declarar leitura e aceite digital deste contrato antes de prosseguir para o pagamento PIX da reserva.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-600">Escreva as cláusulas contratuais *</label>
                  <button
                    type="button"
                    onClick={() => setContractRules(getPresetContract(category))}
                    className="text-emerald-700 font-semibold text-xs hover:underline bg-transparent border-0 cursor-pointer"
                  >
                    Resetar para template padrão
                  </button>
                </div>
                <textarea
                  required
                  rows={10}
                  placeholder="Escreva os termos de uso..."
                  value={contractRules}
                  onChange={(e) => setContractRules(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-700 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Tab: Images */}
          {activeTab === 'images' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Selecione uma imagem excelente para a capa do anúncio</label>
                <div className="grid grid-cols-3 gap-3">
                  {getCategoryPresets(category)?.map((url, index) => {
                    const isSelected = images[0] === url || (images.length === 0 && index === 0);
                    return (
                      <button
                        type="button"
                        key={index}
                        onClick={() => selectPresetImage(url, index)}
                        className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20' 
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <img 
                          src={url} 
                          alt="Preset space" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white p-1 rounded-full">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

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

              {/* Visual Divider */}
              <div className="h-[1px] bg-slate-100 my-2" />

              {/* Upload from Mobile Gallery / Local computer */}
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
                  <span className="text-[10px] text-slate-400 mt-1">Carregar sem URLs • JPG, PNG, WEBP, MP4, MOV ou WEBM</span>
                </div>
              </div>

              {images.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 mb-2">Fotos & Vídeos Ativos do Espaço ({images.length})</h4>
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
                              alt="Space list" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute inset-0 bg-red-600/70 items-center justify-center text-white hidden group-hover:flex transition-opacity duration-150 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Auth (Host registration/login at the end of the listing process) */}
          {activeTab === 'auth' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3 items-start">
                <span className="p-2 bg-emerald-600 text-white rounded-xl text-lg shrink-0">✨</span>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-950">Último Passo: Identificação e Cadastro</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Parabéns pela qualidade do seu anúncio! Para publicá-lo permanentemente no portal de Itaituba e começar a receber agendamentos e repasses por Pix, preencha seus dados de acesso abaixo. Sua conta será ativada instantaneamente.
                  </p>
                </div>
              </div>

              {authError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold rounded-xl leading-relaxed flex items-center gap-2">
                  <span className="p-1 bg-rose-100 text-rose-600 rounded-md">⚠️</span>
                  {authError}
                </div>
              )}

              <div className="max-w-md mx-auto bg-white p-5 border border-slate-150 rounded-2xl shadow-xs space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setAuthError(null); }}
                    className={`flex-1 py-2 text-center rounded-lg transition-all ${
                      authMode === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Quero Criar Nova Conta
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(null); }}
                    className={`flex-1 py-2 text-center rounded-lg transition-all ${
                      authMode === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Já Tenho Cadastro
                  </button>
                </div>

                {authMode === 'register' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Nome Completo do Anfitrião *</label>
                      <input
                        type="text"
                        placeholder="Ex: Beatriz Lima Veras"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">E-mail para Contato *</label>
                      <input
                        type="email"
                        placeholder="Ex: beatriz@exemplo.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Crie uma Senha *</label>
                        <input
                          type="password"
                          placeholder="Mín. 4 dígitos"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Confirme a Senha *</label>
                        <input
                          type="password"
                          placeholder="Repita a senha"
                          value={authConfirmPassword}
                          onChange={(e) => setAuthConfirmPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">E-mail Cadastrado *</label>
                      <input
                        type="email"
                        placeholder="Ex: beatriz@alugaitb.com.br"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Senha do Painel *</label>
                      <input
                        type="password"
                        placeholder="Sua senha secreta"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-medium">
            Preencha todas as abas antes de enviar
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 max-h-10 text-slate-600 text-xs font-semibold hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 bg-white"
            >
              Cancelar
            </button>
            
            {activeTab !== 'images' && activeTab !== 'auth' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'basics') setActiveTab('hours');
                  else if (activeTab === 'hours') setActiveTab('agreement');
                  else if (activeTab === 'agreement') setActiveTab('images');
                }}
                className="px-4 py-2 max-h-10 text-white text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Avançar Passo
              </button>
            ) : activeTab === 'images' && currentUser.email === '' ? (
              <button
                type="button"
                onClick={() => setActiveTab('auth')}
                className="px-4 py-2 max-h-10 text-white text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Identificação do Anfitrião →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 max-h-10 text-white text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-500/10 flex items-center gap-1 animate-pulse cursor-pointer"
              >
                <Check className="w-4 h-4" /> {currentUser.email === '' ? 'Cadastrar & Publicar Anúncio' : 'Salvar & Publicar Anúncio'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
