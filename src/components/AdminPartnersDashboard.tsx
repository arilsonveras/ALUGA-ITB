import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Phone, Mail, DollarSign, Image as ImageIcon, 
  MapPin, Check, X, Megaphone, ShieldCheck, Tag, Info, UserCheck, Sparkles, ExternalLink,
  Star, Clock
} from 'lucide-react';
import { ServicePartner, Environment, PromotionPricing } from '../types';

interface AdminPartnersDashboardProps {
  partners: ServicePartner[];
  onAddPartner: (partner: ServicePartner) => void;
  onUpdatePartner: (partner: ServicePartner) => void;
  onDeletePartner: (id: string) => void;
  categories: { id: string; name: string; emoji: string }[];
  onAddCategory: (category: { id: string; name: string; emoji: string }) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateCategory?: (category: { id: string; name: string; emoji: string }) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void, isDanger?: boolean) => void;
  environments?: Environment[];
  onUpdateEnvironment?: (updatedEnv: Environment) => void;
  promotionPricing?: PromotionPricing;
  onUpdatePromotionPricing?: (pricing: PromotionPricing) => void;
}

export default function AdminPartnersDashboard({
  partners,
  onAddPartner,
  onUpdatePartner,
  onDeletePartner,
  categories,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  showConfirm,
  environments = [],
  onUpdateEnvironment,
  promotionPricing,
  onUpdatePromotionPricing
}: AdminPartnersDashboardProps) {

  const handleConfirm = (title: string, msg: string, onOk: () => void, isDanger = false) => {
    if (showConfirm) {
      showConfirm(title, msg, onOk, isDanger);
    } else {
      if (confirm(msg)) onOk();
    }
  };
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<ServicePartner | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'partners' | 'categories' | 'sponsorships'>('sponsorships');

  // Category form management states
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; emoji: string } | null>(null);
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('');

  // Promotion period states determined by ADM
  const [selectedEnvForPeriod, setSelectedEnvForPeriod] = useState<string | null>(null);
  const [promotionDays, setPromotionDays] = useState<number>(30);
  const [filterEnvName, setFilterEnvName] = useState('');
  const [filterPartnerName, setFilterPartnerName] = useState('');
  const [expandedPartnerIds, setExpandedPartnerIds] = useState<string[]>([]);

  const togglePartnerExpand = (id: string) => {
    setExpandedPartnerIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // Partner activation period states
  const [selectedPartnerForPeriod, setSelectedPartnerForPeriod] = useState<string | null>(null);
  const [partnerDays, setPartnerDays] = useState<number>(30);

  const isPartnerActive = (partner: ServicePartner): boolean => {
    if (!partner.isActive) return false;
    if (partner.activationExpiresAt) {
      const todayStr = new Date().toISOString().split('T')[0];
      return partner.activationExpiresAt >= todayStr;
    }
    return true;
  };

  const getExpirationDateString = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Form states
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [category, setCategory] = useState<ServicePartner['category']>('decor');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [priceMessage, setPriceMessage] = useState('');
  const [adFeePaid, setAdFeePaid] = useState<number>(150);
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [portfolioUrlInput, setPortfolioUrlInput] = useState('');
  const [menuOrCatalog, setMenuOrCatalog] = useState<string[]>([]);
  const [menuItemInput, setMenuItemInput] = useState('');

  // Partner activation form states
  const [formDaysLimit, setFormDaysLimit] = useState<number>(30);
  const [formExpiresAt, setFormExpiresAt] = useState<string>('');

  // Stats calculation
  const totalAdvertisingRevenue = partners.reduce((sum, p) => sum + (p.adFeePaid || 0), 0);
  const activeAdsCount = partners.filter(isPartnerActive).length;

  const totalPromotionalRevenue = environments.reduce(
    (sum, env) => sum + (env.promotionFeePaid || 0), 
    0
  );
  const activePromoCount = environments.filter(env => env.isPromoted && env.promotionStatus === 'active').length;
  const pendingPromoCount = environments.filter(env => env.promotionStatus === 'pending').length;

  const resetForm = () => {
    setName('');
    setContactName('');
    setCategory('decor');
    setDescription('');
    setPhone('');
    setEmail('');
    setPriceMessage('');
    setAdFeePaid(150);
    setImageUrl('');
    setIsActive(true);
    setPortfolioImages([]);
    setPortfolioUrlInput('');
    setMenuOrCatalog([]);
    setMenuItemInput('');
    setEditingPartner(null);
    setFormDaysLimit(30);
    setFormExpiresAt('');
  };

  const getPresetImage = (currentCategory: ServicePartner['category']) => {
    const presets: { [key in ServicePartner['category']]: string } = {
      decor: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600',
      buffet: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=600',
      music: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600',
      cleanup: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600',
      photo: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600',
      other: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600'
    };
    return presets[currentCategory] || presets.other;
  };

  const loadPresetForCategory = (cat: ServicePartner['category']) => {
    setCategory(cat);
    setImageUrl(getPresetImage(cat));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !contactName || !phone || !email) {
      alert('Por favor, preencha todos os campos obrigatórios (*)');
      return;
    }

    const finalImage = imageUrl.trim() || getPresetImage(category);
    const finalExpiresAt = isActive 
      ? (formExpiresAt || getExpirationDateString(formDaysLimit))
      : undefined;
    const finalDaysLimit = isActive ? formDaysLimit : undefined;

    if (editingPartner) {
      onUpdatePartner({
        ...editingPartner,
        name,
        contactName,
        category,
        description,
        phone,
        email,
        priceMessage,
        adFeePaid: Number(adFeePaid),
        imageUrl: finalImage,
        isActive,
        portfolioImages,
        menuOrCatalog,
        activationDaysLimit: finalDaysLimit,
        activationExpiresAt: finalExpiresAt
      });
    } else {
      const newPartner: ServicePartner = {
        id: 'partner-' + Date.now().toString(),
        name,
        contactName,
        category,
        description,
        phone,
        email,
        priceMessage,
        adFeePaid: Number(adFeePaid),
        imageUrl: finalImage,
        isActive,
        portfolioImages,
        menuOrCatalog,
        activationDaysLimit: finalDaysLimit,
        activationExpiresAt: finalExpiresAt,
        createdAt: new Date().toISOString()
      };
      onAddPartner(newPartner);
    }

    setIsAddFormOpen(false);
    resetForm();
  };

  const startEdit = (partner: ServicePartner) => {
    setEditingPartner(partner);
    setName(partner.name);
    setContactName(partner.contactName);
    setCategory(partner.category);
    setDescription(partner.description);
    setPhone(partner.phone);
    setEmail(partner.email);
    setPriceMessage(partner.priceMessage || '');
    setAdFeePaid(partner.adFeePaid || 0);
    setImageUrl(partner.imageUrl || '');
    setIsActive(partner.isActive);
    setPortfolioImages(partner.portfolioImages || []);
    setPortfolioUrlInput('');
    setMenuOrCatalog(partner.menuOrCatalog || []);
    setMenuItemInput('');
    setFormDaysLimit(partner.activationDaysLimit || 30);
    setFormExpiresAt(partner.activationExpiresAt || '');
    setIsAddFormOpen(true);
  };

  const getCategoryTheme = (cat: ServicePartner['category']) => {
    const configs: { [key in ServicePartner['category']]: { label: string; bg: string; text: string; emoji: string } } = {
      decor: { label: 'Ornamentação & Decoração', bg: 'bg-pink-100', text: 'text-pink-800', emoji: '🌸' },
      buffet: { label: 'Buffet & Salgados', bg: 'bg-amber-100', text: 'text-amber-800', emoji: '🍹' },
      music: { label: 'Som, Banda & Iluminação', bg: 'bg-purple-100', text: 'text-purple-800', emoji: '🎵' },
      cleanup: { label: 'Equipe de Limpeza v/p', bg: 'bg-cyan-100', text: 'text-cyan-800', emoji: '✨' },
      photo: { label: 'Fotografia & Produção', bg: 'bg-indigo-100', text: 'text-indigo-800', emoji: '📸' },
      other: { label: 'Serviço Adicional', bg: 'bg-slate-100', text: 'text-slate-800', emoji: '⚡' }
    };
    return configs[cat] || configs.other;
  };

  return (
    <div className="space-y-6">
      
      {/* Overview stats header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-6 rounded-3xl text-white border border-indigo-800/40 relative overflow-hidden shadow-md">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/[0.04] rounded-full blur-2xl pointer-events-none" />
          <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold">Faturamento Total Admin</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-medium text-indigo-200">R$ </span>
            <span className="text-3xl font-black">{(totalAdvertisingRevenue + totalPromotionalRevenue).toFixed(2).replace('.', ',')}</span>
          </div>
          <p className="text-[10px] text-indigo-200 mt-2 font-medium">
            🤝 R$ {totalAdvertisingRevenue.toFixed(2).replace('.', ',')} (Parceiros) • 👑 R$ {totalPromotionalRevenue.toFixed(2).replace('.', ',')} (Saldos Ads)
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-150 flex flex-col justify-between shadow-xs">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Parceiros de Fornecimento</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{partners.length}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span>{activeAdsCount} anúncios de buffet/fotos em checkout</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-150 flex flex-col justify-between shadow-xs">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Ambientes Promovidos (Ads)</p>
            <h3 className="text-2xl font-black text-slate-850 mt-1">{activePromoCount}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-slate-500 font-semibold">{pendingPromoCount} pagamento(s) aguardando homologação do ADM</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs Selection Row */}
      <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-2xl gap-2 font-sans">
        <button
          type="button"
          onClick={() => { setActiveSubTab('sponsorships'); setIsAddFormOpen(false); }}
          className={`flex-1 py-2.5 px-4 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'sponsorships'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/55'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${activeSubTab === 'sponsorships' ? 'fill-amber-300 text-amber-300' : ''}`} />
          Locais Promovidos ({activePromoCount + pendingPromoCount})
        </button>
        <button
          type="button"
          onClick={() => { setActiveSubTab('partners'); }}
          className={`flex-1 py-2.5 px-4 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'partners'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/55'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Fornecedores Parceiros ({partners.length})
        </button>
        <button
          type="button"
          onClick={() => { setActiveSubTab('categories'); setIsAddFormOpen(false); }}
          className={`flex-1 py-2.5 px-4 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'categories'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/55'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Categorias ({categories.length})
        </button>
      </div>

      {activeSubTab === 'partners' && (
        <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-800 text-[10px] font-bold rounded-lg uppercase tracking-wide">Área Administrativa</span>
              <h2 className="text-lg font-bold text-slate-800">Parceiros e Adicionais do Portal</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Gerencie prestadores de serviços (decoração, buffet, som) que pagam taxas para anunciar opções de checkout.</p>
          </div>
          {!isAddFormOpen && (
            <button
              onClick={() => { resetForm(); setIsAddFormOpen(true); }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Novo Anunciante Parceiro
            </button>
          )}
        </div>

        {/* Dynamic Add/Edit Partner Section */}
        {isAddFormOpen && (
          <form onSubmit={handleSubmit} className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-4 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                {editingPartner ? 'Editar Anunciante Parceiro' : 'Cadastrar Novo Fornecedor (Espaço Pago)'}
              </h3>
              <button
                type="button"
                onClick={() => { setIsAddFormOpen(false); resetForm(); }}
                className="p-1 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Nome da Empresa / Profissional *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: DecorLuz Organizações"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Nome do Contato Principal *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Clara Mendes"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1 font-semibold">Categoria de Serviço *</label>
                <div className="flex gap-1.5">
                  <select
                    value={category}
                    onChange={(e) => loadPresetForCategory(e.target.value as ServicePartner['category'])}
                    className="flex-1 px-3 py-2 border border-slate-250 bg-white rounded-xl text-xs font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="decor">🌸 Ornamentação / Decoração</option>
                    <option value="buffet">🍹 Buffet / Comes & Bebes</option>
                    <option value="music">🎵 Som, Banda / DJ</option>
                    <option value="cleanup">✨ Limpeza de Evento</option>
                    <option value="photo">📸 Fotografia & Cobertura</option>
                    <option value="other">⚡ Outro Serviço Adicional</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Descrição Breve do Serviço Comercial *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Buffet completo com salgados artesanais, doces refinados..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> WhatsApp / Telefone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: (11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">E-mail Comercial *</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: comercial@fornecedor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Chamativa de Preço (Informativo para o cliente)</label>
                <input
                  type="text"
                  placeholder="Ex: Decoração de recepção a partir de R$ 399"
                  value={priceMessage}
                  onChange={(e) => setPriceMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1 flex items-center gap-1 text-emerald-700">
                  <DollarSign className="w-3 h-3" /> Taxa de Anúncio Paga (R$) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adFeePaid}
                  onChange={(e) => setAdFeePaid(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-emerald-350 bg-emerald-50/20 text-emerald-950 font-bold rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1 flex items-center gap-1 text-slate-650">
                  <span>📸</span> Carregar Foto de Banner (Celular / PC)
                </label>
                <div className="relative border border-dashed border-emerald-350 bg-emerald-50/10 rounded-xl p-3 text-center cursor-pointer hover:border-emerald-500 transition-all group flex flex-col items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImageUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <span className="text-[10px] font-bold text-emerald-800">Escolha do Celular ou PC</span>
                  <p className="text-[8px] text-slate-400 mt-0.5">Clique para carregar foto / logo do fornecedor</p>
                </div>
                {imageUrl && (
                  <div className="mt-1.5 text-center flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                    <span className="text-[9px] text-slate-500 truncate max-w-[124px] font-mono">{imageUrl.substring(0, 25)}...</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        handleConfirm(
                          'Remover Banner',
                          'Deseja realmente remover esta foto de banner?',
                          () => {
                            setImageUrl('');
                          },
                          true
                        );
                      }}
                      className="text-[9px] text-red-600 font-bold hover:underline cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Portfolio and Catalog Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-150">
              {/* Portfolio images section */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🖼️</span> Fotos do Portfólio Realizado
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Selecione direto fotos reais de eventos organizados (sem digitação de links).
                  </p>
                </div>

                <div className="relative border border-dashed border-indigo-300 bg-indigo-50/10 rounded-xl p-3 text-center cursor-pointer hover:border-indigo-500 transition-all group flex flex-col items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        Array.from(files).forEach((file: any) => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPortfolioImages(prev => [...prev, reader.result as string]);
                          };
                          reader.readAsDataURL(file);
                        });
                      }
                    }}
                  />
                  <span className="text-[10px] font-bold text-indigo-700">Adicionar Fotos do Celular/PC</span>
                  <p className="text-[8px] text-slate-450 mt-0.5">Selecione uma ou mais fotos reais</p>
                </div>

                {portfolioImages.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {portfolioImages.map((img, idx) => (
                      <div key={idx} className="relative h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => {
                            handleConfirm(
                              'Remover do Portfólio',
                              'Deseja realmente remover esta foto do portfólio?',
                              () => {
                                setPortfolioImages(prev => prev.filter((_, i) => i !== idx));
                              },
                              true
                            );
                          }}
                          className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Nenhuma imagem adicionada ao portfólio.</p>
                )}
              </div>

              {/* Menu and catalog section */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>📋</span> Detalhes do Cardápio & Serviços Oferecidos
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Insira tópicos detalhados sobre o que está contemplado nos serviços básicos oferecidos para o locatário.
                  </p>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Ex: Mesa de frios com mais de 15 variedades inclusas"
                    value={menuItemInput}
                    onChange={(e) => setMenuItemInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-250 bg-slate-50 text-xs rounded-xl focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (menuItemInput.trim()) {
                          setMenuOrCatalog(prev => [...prev, menuItemInput.trim()]);
                          setMenuItemInput('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (menuItemInput.trim()) {
                        setMenuOrCatalog(prev => [...prev, menuItemInput.trim()]);
                        setMenuItemInput('');
                      }
                    }}
                    className="px-3 bg-emerald-50 border border-emerald-150 text-emerald-700 hover:bg-emerald-100/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Inserir
                  </button>
                </div>

                {menuOrCatalog.length > 0 ? (
                  <div className="max-h-24 overflow-y-auto space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-150">
                    {menuOrCatalog.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-[11px] text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                        <span className="truncate flex-1">{item}</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleConfirm(
                              'Remover Item',
                              'Deseja realmente remover este item do cardápio/serviço?',
                              () => {
                                setMenuOrCatalog(prev => prev.filter((_, i) => i !== idx));
                              },
                              true
                            );
                          }}
                          className="text-red-500 hover:text-red-700 font-extrabold cursor-pointer placeholder-no-select"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Nenhum detalhe do cardápio cadastrado.</p>
                )}
              </div>
            </div>

            <div className="bg-slate-100/60 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      setIsActive(e.target.checked);
                      if (e.target.checked && !formExpiresAt) {
                        setFormExpiresAt(getExpirationDateString(formDaysLimit));
                      }
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                  />
                  Habilitar anúncio e ativar o período de publicação no checkout dos clientes
                </label>
              </div>

              {isActive && (
                <div className="pl-6 border-l-2 border-indigo-500 space-y-2 text-left animate-in slide-in-from-left-2">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wide">Período de Ativação Publicitária:</span>
                    <span className="text-[9px] font-bold text-slate-400 font-mono">Duração limite do Anúncio</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 flex-1">
                      {[7, 15, 30, 90, 180, 365].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setFormDaysLimit(d);
                            setFormExpiresAt(getExpirationDateString(d));
                          }}
                          className={`py-1 px-1.5 rounded-lg text-[9.5px] font-extrabold border transition-all cursor-pointer ${
                            formDaysLimit === d 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100'
                          }`}
                        >
                          {d} dias
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                      <input
                        type="number"
                        min="1"
                        value={formDaysLimit}
                        onChange={(e) => {
                          const d = Math.max(1, parseInt(e.target.value) || 30);
                          setFormDaysLimit(d);
                          setFormExpiresAt(getExpirationDateString(d));
                        }}
                        className="w-14 text-center py-1 rounded-lg text-[10px] font-black border border-slate-200 text-slate-700 bg-white"
                        placeholder="Dias"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">dias</span>
                    </div>
                  </div>

                  <div className="text-[10.5px] font-bold pt-1 flex items-center gap-1.5 text-slate-650">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>📅 Publicado até {formExpiresAt ? formExpiresAt.split('-').reverse().join('/') : getExpirationDateString(formDaysLimit).split('-').reverse().join('/')} ({formDaysLimit} dias a partir de hoje)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow-sm flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> 
                {editingPartner ? 'Confirmar Edição' : 'Concluir Cadastro e Registrar Pagamento'}
              </button>
            </div>
          </form>
        )}

        {/* Dynamic partners list */}
        <div className="p-6">
          {partners.length > 0 && (
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
              <div>
                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                  Filitrar e Buscar Parceiros
                </h4>
                <p className="text-[9.5px] text-slate-405 mt-0.5">Digite o nome do parceiro abaixo ou clique nele para expandir/ocultar os detalhes.</p>
              </div>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="🔍 Buscar parceiro por nome..."
                  value={filterPartnerName}
                  onChange={(e) => setFilterPartnerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 placeholder-slate-400 font-semibold transition-all shadow-2xs"
                />
              </div>
            </div>
          )}

          {partners.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">Nenhum parceiro de anúncios cadastrado.</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Cadastre agora para começar a faturar com anúncios premium no checkout.</p>
            </div>
          ) : (() => {
            const list = partners.filter(p => p.name.toLowerCase().includes(filterPartnerName.trim().toLowerCase()));

            if (list.length === 0) {
              return (
                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl col-span-full">
                  <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-500">Nenhum parceiro encontrado.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Não há anunciantes correspondentes à sua busca por "{filterPartnerName}".</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
              {list.map((partner) => {
                const config = getCategoryTheme(partner.category);
                const isExpanded = expandedPartnerIds.includes(partner.id);
                return (
                  <div 
                    key={partner.id} 
                    className={`bg-white border rounded-2xl flex flex-col justify-between transition-all hover:shadow-md ${
                      partner.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50 opacity-70'
                    }`}
                  >
                    {/* Top clickable header for expand/collapse */}
                    <div 
                      onClick={() => togglePartnerExpand(partner.id)}
                      className="p-4 flex gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors rounded-t-2xl select-none relative"
                    >
                      <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200/50 relative">
                        <img 
                          src={partner.imageUrl || getPresetImage(partner.category)} 
                          alt={partner.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 flex-1 pr-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${config.bg} ${config.text}`}>
                            {config.emoji} {config.label}
                          </span>
                          {!partner.isActive ? (
                            <span className="text-[8px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded-md">INATIVO</span>
                          ) : partner.activationExpiresAt ? (
                            new Date().toISOString().split('T')[0] > partner.activationExpiresAt ? (
                              <span className="text-[8px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 animate-pulse">
                                <Clock className="w-2.5 h-2.5 text-red-500" /> EXPIRADO ({partner.activationExpiresAt.split('-').reverse().join('/')})
                              </span>
                            ) : (
                              <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5 text-emerald-600" /> ATIVO até {partner.activationExpiresAt.split('-').reverse().join('/')}
                              </span>
                            )
                          ) : (
                            <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5 text-emerald-600" /> ATIVO PERMANENTE
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm mt-1 truncate">{partner.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Contato: {partner.contactName}</p>
                      </div>

                      {/* Chevron expand state indicator */}
                      <div className="absolute top-4.5 right-4 text-slate-400">
                        <svg 
                          className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180 text-amber-500' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                      {/* Expandable part - more details */}
                      {isExpanded ? (
                        <div className="border-t border-slate-100 p-4 bg-slate-50/20 space-y-4 animate-in fade-in duration-200">
                          {/* Description block */}
                          <p className="text-xs text-slate-500 leading-normal bg-white p-2.5 rounded-lg border border-slate-150">
                            {partner.description}
                          </p>

                          {/* Info and price highlight */}
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="bg-white p-2 rounded-lg border border-slate-150 font-medium">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Investimento do Anúncio</span>
                              <span className="text-emerald-700 font-black">R$ {partner.adFeePaid || 0}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-150 font-medium">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Investimento p/ Locatário</span>
                              <span className="text-slate-700 font-bold truncate block">{partner.priceMessage || 'Consulte valores'}</span>
                            </div>
                          </div>

                          {/* Phone and communication tools */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-slate-600 font-mono bg-white p-2.5 rounded-lg border border-slate-150 px-2 text-xs">
                            <span className="flex items-center gap-1 font-bold text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {partner.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {partner.email}
                            </span>
                          </div>

                          {/* Renewal panel */}
                          <div className="pt-3 border-t border-slate-200/60">
                            {selectedPartnerForPeriod === partner.id ? (
                              <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-2 text-left shadow-xs">
                                <div className="flex justify-between items-center gap-4 animate-in slide-in-from-top-1">
                                  <span className="text-[9.5px] font-extrabold text-indigo-700 uppercase tracking-wide">Ativar por um Período (Paga pessoalmente):</span>
                                  <span className="text-[9px] font-bold text-slate-450 font-mono">Offline / Dinheiro</span>
                                </div>
                                
                                <div className="flex items-center gap-1.55">
                                  <div className="grid grid-cols-4 gap-1 flex-1">
                                    {[7, 15, 30, 90, 180].map((d) => (
                                      <button
                                        key={d}
                                        type="button"
                                        onClick={() => setPartnerDays(d)}
                                        className={`py-0.5 px-0.5 rounded text-[8.5px] font-extrabold border transition-all cursor-pointer ${
                                          partnerDays === d 
                                            ? 'bg-slate-900 border-slate-900 text-white' 
                                            : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100'
                                        }`}
                                      >
                                        {d}d
                                      </button>
                                    ))}
                                  </div>
                                  <input
                                    type="number"
                                    min="1"
                                    value={partnerDays}
                                    onChange={(e) => setPartnerDays(Math.max(1, parseInt(e.target.value) || 30))}
                                    className="w-10 text-center py-0.5 rounded text-[9px] font-bold border border-slate-200 text-slate-700 bg-white"
                                    placeholder="Dias"
                                  />
                                </div>

                                <div className="flex items-center justify-between gap-2 border-t border-slate-150/50 pt-1.5 select-none font-medium">
                                  <span className="text-[9px] text-slate-500 font-bold whitespace-nowrap">
                                    📅 Ativo até: {getExpirationDateString(partnerDays).split('-').reverse().join('/')}
                                  </span>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onUpdatePartner({
                                          ...partner,
                                          isActive: true,
                                          activationDaysLimit: partnerDays,
                                          activationExpiresAt: getExpirationDateString(partnerDays),
                                          adFeePaid: partner.adFeePaid // maintains or registers
                                        });
                                        setSelectedPartnerForPeriod(null);
                                      }}
                                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold rounded text-[9px] cursor-pointer transition-colors"
                                    >
                                      Ativar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPartnerForPeriod(null)}
                                      className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-650 font-bold rounded text-[9px] cursor-pointer"
                                    >
                                      X
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[9.5px] text-slate-400 font-bold">
                                  {partner.activationExpiresAt ? `Expira em: ${partner.activationExpiresAt.split('-').reverse().join('/')}` : 'Sem expiração configurada'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPartnerForPeriod(partner.id);
                                    setPartnerDays(partner.activationDaysLimit || 30);
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                                >
                                  <Clock className="w-3 h-3 text-slate-500" /> Ativar / Renovar Período
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Controls Footer */}
                          <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase font-mono">
                              ID: {partner.id}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(partner)}
                                className="p-1.5 hover:bg-white border border-slate-200 shadow-3xs text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Editar fornecedor"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeletePartner(partner.id)}
                                className="p-1.5 hover:bg-red-50 hover:text-red-700 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Deletar parceiro"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Deletar
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Expand Button Hint for Collapsed Mode */
                        <div 
                          onClick={() => togglePartnerExpand(partner.id)}
                          className="px-4 py-2 border-t border-slate-100 bg-slate-50/20 text-center text-[10px] text-slate-450 font-bold hover:text-slate-800 cursor-pointer select-none rounded-b-2xl transition-colors"
                        >
                          Clique para ver mais detalhes e gerenciar ▾
                        </div>
                      )}
                    </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
    )}
      
      {/* Dynamic Categories Admin Box */}
      {activeSubTab === 'categories' && (
      <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg uppercase tracking-wide">Área Administrativa</span>
            <h2 className="text-lg font-bold text-slate-800">Categorias de Ambientes de Aluguel</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre ou edite as categorias de imóveis/ambientes para exibição nas buscas e seleções do site.
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add / Edit Category Form */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Emoji / Ícone</label>
                <input
                  type="text"
                  placeholder="Ex: 🥳, 🏡, 🌴"
                  value={catEmoji}
                  onChange={(e) => setCatEmoji(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: SALÃO DE EVENTOS"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                {editingCategory ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const nameVal = catName.trim();
                        const emojiVal = catEmoji.trim() || '🚪';
                        if (!nameVal) {
                          alert('Por favor, digite o nome da categoria!');
                          return;
                        }
                        if (onUpdateCategory) {
                          onUpdateCategory({
                            id: editingCategory.id,
                            name: nameVal,
                            emoji: emojiVal
                          });
                        }
                        setEditingCategory(null);
                        setCatName('');
                        setCatEmoji('');
                      }}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      Salvar Alterações
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCatName('');
                        setCatEmoji('');
                      }}
                      className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const nameVal = catName.trim();
                      const emojiVal = catEmoji.trim() || '🚪';
                      if (!nameVal) {
                        alert('Por favor, digite o nome da categoria!');
                        return;
                      }
                      const newId = nameVal.toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '') // remove accents
                        .replace(/[^a-z0-0а-яa-z_\s-]/g, '')
                        .replace(/\s+/g, '_')
                        .trim();
                      if (categories.some(c => c.id === newId)) {
                        alert('Uma categoria com esse nome ou ID aproximado já existe!');
                        return;
                      }
                      onAddCategory({ id: newId, name: nameVal, emoji: emojiVal });
                      setCatName('');
                      setCatEmoji('');
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    Adicionar Categoria
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Categorias Cadastradas</h3>
            <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat.id} className="p-3.5 flex items-center justify-between text-xs font-medium hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base bg-slate-100 p-1.5 rounded-lg">{cat.emoji}</span>
                    <div>
                      <p className="font-bold text-slate-800">{cat.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">ID: {cat.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(cat);
                        setCatName(cat.name);
                        setCatEmoji(cat.emoji);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar Categoria"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleConfirm(
                          'Remover Categoria',
                          `Tem certeza que deseja remover a categoria "${cat.name}"? Isso pode afetar os anúncios que a utilizam.`,
                          () => {
                            onDeleteCategory(cat.id);
                            if (editingCategory?.id === cat.id) {
                              setEditingCategory(null);
                              setCatName('');
                              setCatEmoji('');
                            }
                          },
                          true
                        );
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remover Categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* VIEW DE PROMOÇÕES / DESTAQUES ESTILO GOOGLE ADS */}
      {activeSubTab === 'sponsorships' && (
        <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-xs p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-amber-50 border border-amber-150 text-amber-800 text-[10px] font-bold rounded-lg uppercase tracking-wide">Google Ads estilo 👑</span>
              <h2 className="text-lg font-bold text-slate-850">Promoções de Locais e Ambientes</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Gerencie quais ambientes têm prioridade e aparecem no topo das buscas e na página inicial do portal após o pagamento do anfitrião.</p>
          </div>

          {/* PAINEL DE CONFIGURAÇÃO DE TARIFAS DE DESTAQUE PELO ADM */}
          {promotionPricing && onUpdatePromotionPricing ? (
            <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-amber-150 pb-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">Definição das Tarifas de Destaque (ADM)</h3>
                  <p className="text-[10.5px] text-amber-700/85">Configure os valores cobrados dos anfitriões para promover anúncios no topo. As alterações são aplicadas instantaneamente.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-amber-800">Diária (Individual)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-[10px] font-bold text-amber-700">R$</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={promotionPricing.dailyRate}
                      onChange={(e) => onUpdatePromotionPricing({ ...promotionPricing, dailyRate: Number(e.target.value) || 0 })}
                      className="w-full pl-7 pr-1.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-amber-800">Pacote 7 Dias</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-[10px] font-bold text-amber-700">R$</span>
                    <input
                      type="number"
                      min="0"
                      value={promotionPricing.rate7Days}
                      onChange={(e) => onUpdatePromotionPricing({ ...promotionPricing, rate7Days: Number(e.target.value) || 0 })}
                      className="w-full pl-7 pr-1.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-amber-800">Pacote 15 Dias</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-[10px] font-bold text-amber-700">R$</span>
                    <input
                      type="number"
                      min="0"
                      value={promotionPricing.rate15Days}
                      onChange={(e) => onUpdatePromotionPricing({ ...promotionPricing, rate15Days: Number(e.target.value) || 0 })}
                      className="w-full pl-7 pr-1.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-amber-800">Pacote 30 Dias</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-[10px] font-bold text-amber-700">R$</span>
                    <input
                      type="number"
                      min="0"
                      value={promotionPricing.rate30Days}
                      onChange={(e) => onUpdatePromotionPricing({ ...promotionPricing, rate30Days: Number(e.target.value) || 0 })}
                      className="w-full pl-7 pr-1.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-amber-800">Pacote 90 Dias</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-[10px] font-bold text-amber-700">R$</span>
                    <input
                      type="number"
                      min="0"
                      value={promotionPricing.rate90Days}
                      onChange={(e) => onUpdatePromotionPricing({ ...promotionPricing, rate90Days: Number(e.target.value) || 0 })}
                      className="w-full pl-7 pr-1.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-amber-800">Pacote 365 Dias</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-[10px] font-bold text-amber-700">R$</span>
                    <input
                      type="number"
                      min="0"
                      value={promotionPricing.rate365Days}
                      onChange={(e) => onUpdatePromotionPricing({ ...promotionPricing, rate365Days: Number(e.target.value) || 0 })}
                      className="w-full pl-7 pr-1.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* LISTA DE SOLICITAÇÕES PENDENTES */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Clock className="w-4 h-4 text-sky-600 shrink-0" />
              Solicitações Pendentes de Anfitriões ({pendingPromoCount})
            </h3>

            {environments.filter(env => env.promotionStatus === 'pending').length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-405 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                🎉 Nenhuma solicitação de destaque pendente no momento! Todos os pagamentos foram homologados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {environments.filter(env => env.promotionStatus === 'pending').map(env => (
                  <div key={env.id} className="p-4 bg-sky-50/40 border border-sky-150 rounded-2xl flex flex-col justify-between space-y-3">
                    <div className="flex gap-3">
                      <img 
                        src={env.images[0]} 
                        alt={env.title} 
                        className="w-14 h-14 object-cover rounded-xl shrink-0 border border-sky-200" 
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{env.title}</p>
                        <p className="text-[10px] text-slate-400">Dono: <span className="font-semibold text-slate-600">{env.ownerId}</span></p>
                        <p className="text-[10px] font-bold text-emerald-800 flex items-center gap-0.5">
                          💰 Taxa Simbólica de Destaque: R$ {env.promotionFeePaid || 75},00
                        </p>
                      </div>
                    </div>
                    
                    {selectedEnvForPeriod === env.id ? (
                      <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-3 text-left shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Estipular Período do Destaque:</span>
                          <span className="text-[9.5px] font-bold text-indigo-700 font-mono bg-indigo-50 px-1.5 py-0.2 rounded">R$ 75,00 Pago</span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-1">
                          {[7, 15, 30, 90, 365].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setPromotionDays(d)}
                              className={`py-1 rounded text-[9.5px] font-bold border transition-all cursor-pointer ${
                                promotionDays === d 
                                  ? 'bg-amber-500 border-amber-600 text-white' 
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {d === 365 ? '1 Ano' : `${d} dias`}
                            </button>
                          ))}
                          <input
                            type="number"
                            min="1"
                            value={promotionDays}
                            onChange={(e) => setPromotionDays(Math.max(1, parseInt(e.target.value) || 30))}
                            className="text-center py-1 rounded text-[9.5px] font-bold border border-slate-200 h-6 text-slate-700 bg-white"
                            placeholder="Dias"
                          />
                        </div>

                        <p className="text-[9.5px] text-slate-500 leading-relaxed font-semibold">
                          📅 Destaque ficará no topo até <span className="text-amber-700 bg-amber-50 font-bold px-1 rounded font-mono underline">{getExpirationDateString(promotionDays).split('-').reverse().join('/')}</span>.
                        </p>

                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateEnvironment) {
                                onUpdateEnvironment({
                                  ...env,
                                  isPromoted: true,
                                  promotionStatus: 'active',
                                  promotionDaysLimit: promotionDays,
                                  promotionExpiresAt: getExpirationDateString(promotionDays)
                                });
                                setSelectedEnvForPeriod(null);
                              }
                            }}
                            className="flex-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] transition-colors cursor-pointer"
                          >
                            Liberar e Ativar no Topo
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedEnvForPeriod(null)}
                            className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-lg text-[10px] cursor-pointer"
                          >
                            Voltar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEnvForPeriod(env.id);
                            setPromotionDays(30); // default 30 days
                          }}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors flex items-center justify-center gap-1 cursor-pointer border border-emerald-700"
                        >
                          <Check className="w-3.5 h-3.5" /> Aprovar e Ativar no Topo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateEnvironment) {
                              onUpdateEnvironment({
                                ...env,
                                isPromoted: false,
                                promotionStatus: 'none',
                                promotionFeePaid: 0
                              });
                            }
                          }}
                          className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                        >
                          Recusar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LISTA DE DESTAQUES ATIVOS */}
          <div className="space-y-3.5 pt-2">
            <h3 className="text-xs font-bold text-slate-705 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              Locais com Patrocínio Ativo ({activePromoCount})
            </h3>

            {environments.filter(env => env.isPromoted && env.promotionStatus === 'active').length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                Nenhum local ativo no topo das buscas atualmente. Os anfitriões podem solicitar promoção via painel!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {environments.filter(env => env.isPromoted && env.promotionStatus === 'active').map(env => (
                  <div key={env.id} className="p-3 bg-amber-50/30 border border-amber-200 rounded-2xl flex flex-col justify-between space-y-3">
                    <div>
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-2">
                        <img src={env.images[0]} alt={env.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2 right-2 bg-amber-500 text-white text-[9.5px] font-black px-1.5 py-0.5 rounded-lg shadow-sm">ATIVO NO TOPO</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800 line-clamp-1">{env.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate">Anfitrião: {env.ownerId}</p>
                      
                      {env.promotionExpiresAt && (
                        <div className="mt-2 p-1.5 bg-amber-100/40 border border-amber-200/55 rounded-lg text-[9px] font-bold text-amber-850 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Expira em: {env.promotionExpiresAt.split('-').reverse().join('/')} ({env.promotionDaysLimit || 30} dias)</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateEnvironment) {
                          onUpdateEnvironment({
                            ...env,
                            isPromoted: false,
                            promotionStatus: 'none'
                          });
                        }
                      }}
                      className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Remover Destaque
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TODOS OS OUTROS AMBIENTES */}
          <div className="border-t border-slate-100 pt-5 space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                  Outros Ambientes Cadastrados ({environments.length - activePromoCount - pendingPromoCount})
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Habilite o destaque diretamente para qualquer ambiente listado, mesmo se o dono não pagar online (por exemplo, cortesia manual do portal).</p>
              </div>

              <div className="w-full md:w-64">
                <input
                  type="text"
                  placeholder="🔍 Filtrar ambientes por nome..."
                  value={filterEnvName}
                  onChange={(e) => setFilterEnvName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-205 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 placeholder-slate-400 font-semibold transition-all shadow-2xs"
                />
              </div>
            </div>

            <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 max-h-72 overflow-y-auto bg-slate-50/50">
              {(() => {
                const list = environments
                  .filter(env => env.promotionStatus !== 'pending' && (!env.isPromoted || env.promotionStatus !== 'active'))
                  .filter(env => env.title.toLowerCase().includes(filterEnvName.trim().toLowerCase()));

                if (list.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-slate-400 font-medium">
                      {filterEnvName.trim() ? `Nenhum ambiente encontrado com o nome "${filterEnvName}"` : "Nenhum outro ambiente cadastrado no momento."}
                    </div>
                  );
                }

                return list.map(env => (
                  <div key={env.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={env.images[0]} alt={env.title} className="w-10 h-10 object-cover rounded-lg shrink-0 border" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{env.title}</p>
                      <p className="text-[9.5px] text-slate-400 truncate">Dono: {env.ownerId} | R$ {env.pricePerHour.toFixed(2).replace('.', ',')}/diária</p>
                    </div>
                  </div>

                  {selectedEnvForPeriod === env.id ? (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-2 max-w-sm ml-auto animate-in slide-in-from-top-1 text-left">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-[9.5px] font-extrabold text-indigo-700 uppercase tracking-wide">Cortesia de Destaque / Ads:</span>
                        <span className="text-[9px] font-bold text-slate-400 font-mono">Gratuito</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <div className="grid grid-cols-4 gap-1 flex-1">
                          {[7, 15, 30, 90].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setPromotionDays(d)}
                              className={`py-0.5 px-1 rounded text-[9px] font-extrabold border transition-all cursor-pointer ${
                                promotionDays === d 
                                  ? 'bg-slate-900 border-slate-900 text-white' 
                                  : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                              }`}
                            >
                              {d} dias
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          min="1"
                          value={promotionDays}
                          onChange={(e) => setPromotionDays(Math.max(1, parseInt(e.target.value) || 30))}
                          className="w-12 text-center py-0.5 rounded text-[9px] font-bold border border-slate-200 text-slate-700 bg-white"
                          placeholder="Dias"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5 select-none">
                        <span className="text-[9.5px] text-slate-500 font-bold whitespace-nowrap">
                          📅 Ativo até: {getExpirationDateString(promotionDays).split('-').reverse().join('/')}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateEnvironment) {
                                onUpdateEnvironment({
                                  ...env,
                                  isPromoted: true,
                                  promotionStatus: 'active',
                                  promotionDaysLimit: promotionDays,
                                  promotionExpiresAt: getExpirationDateString(promotionDays),
                                  promotionFeePaid: 0 // Manual activation / cortesia
                                });
                                setSelectedEnvForPeriod(null);
                              }
                            }}
                            className="px-2 py-0.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded text-[9.5px] cursor-pointer transition-colors"
                          >
                            Ativar
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedEnvForPeriod(null)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded text-[9.5px] cursor-pointer"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEnvForPeriod(env.id);
                        setPromotionDays(30);
                      }}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9.5px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Star className="w-3 h-3 fill-amber-300 text-amber-300 shrink-0" /> Ativar Destaque
                    </button>
                  )}
                </div>
              ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Notice section how it benefits the platform */}
      <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl flex gap-3 text-xs text-indigo-900 leading-relaxed font-medium">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <strong>Como esse sistema monetiza sua plataforma?</strong>
          <p className="text-[11px] text-indigo-700 mt-1">
            Os parceiros de buffet, decoração e limpeza pagam uma taxa recorrente ou por anúncio ativo para aparecer diretamente no painel de finalização de reservas dos seus clientes. Isso atrai público qualificado para eles e garante uma fonte de renda passiva limpa para você, administrador, sem intermediação complexa de pagamento.
          </p>
        </div>
      </div>

    </div>
  );
}
