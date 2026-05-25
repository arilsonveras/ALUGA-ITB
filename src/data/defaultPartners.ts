import { ServicePartner } from '../types';

export const DEFAULT_PARTNERS: ServicePartner[] = [
  {
    id: 'partner-1',
    name: 'Espaço & Brilho Festas Itaituba',
    contactName: 'Lucia Helena',
    category: 'decor',
    description: 'Especialistas em ornamentação de eventos, arranjos de flores nobres da Amazônia e personalizações decorativas premium de salões de festas e recepções corporativas em Itaituba.',
    phone: '(93) 98114-1299',
    email: 'contato@espacobrilhofestas.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600',
    priceMessage: 'Decoração completa a partir de R$ 350',
    adFeePaid: 150,
    isActive: true,
    createdAt: '2026-05-01T10:00:00Z',
    portfolioImages: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=400'
    ],
    menuOrCatalog: [
      'Arranjos florais de alto padrão para centros de mesa',
      'Painéis de folhagem realística com iluminação LED especial de fundo',
      'Mobiliário rústico e moderno completo (mesas de bolo, aparadores, poltronas)',
      'Tapete passarela para entrada e sinalizadores sofisticados de eventos'
    ]
  },
  {
    id: 'partner-2',
    name: 'Tapajós Gourmet Express',
    contactName: 'Chef Roberto Alves',
    category: 'buffet',
    description: 'Finger foods com toques regionais e contemporâneos, coffee breaks de alta qualidade para reuniões executivas e banquetes inteiros para convenções e casamentos em Itaituba.',
    phone: '(93) 99125-9988',
    email: 'roberto@gourmetexpress.com',
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=600',
    priceMessage: 'Coffee break corporativo a partir de R$ 25/pessoa',
    adFeePaid: 200,
    isActive: true,
    createdAt: '2026-05-03T14:30:00Z',
    portfolioImages: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=400'
    ],
    menuOrCatalog: [
      'Finger foods quentes (mini quiches, folhados gourmet regional, dadinhos de tapioca)',
      'Coffee Break Premium: Croissants recheados, bolos finos, sucos amazônicos e café expresso',
      'Buffet Completo de Evento: Saladas tropicais, risoto com castanha-do-pará ou filets requintados',
      'Bebidas inclusas: Guaraná da Amazônia, refrigerantes, sucos regionais e águas saborizadas'
    ]
  },
  {
    id: 'partner-3',
    name: 'Vibe Áudio & Som Itaituba',
    contactName: 'DJ Marcelo',
    category: 'music',
    description: 'Som de alta potência jbl, iluminação cênica digital de última geração, DJs especializados em ritmos e festas corporativas, telões de led e sonorização para workshops em Itaituba.',
    phone: '(93) 98402-1234',
    email: 'reservas@vibeaudio.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600',
    priceMessage: 'Sonorização e DJ a partir de R$ 500/período',
    adFeePaid: 120,
    isActive: true,
    createdAt: '2026-05-05T09:15:00Z',
    portfolioImages: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1482440308425-276ad0f28b19?auto=format&fit=crop&q=80&w=400'
    ],
    menuOrCatalog: [
      '2 Caixas de som ativas de alta definição com tripé JBL',
      'Mesa de DJ profissional completa com controladora Pioneer Digital',
      'Kit de iluminação cênica (8 refletores LED de alta potência para pontos estratégicos)',
      'Microfone sem fio Shure para palestrantes, mestres de cerimônia e discursos'
    ]
  }
];
