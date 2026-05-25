import { Environment } from '../types';

export const DEFAULT_ENVIRONMENTS: Environment[] = [
  {
    id: 'env-3',
    title: 'Salão de Eventos e Festas Tapajós Vista Rooftop',
    description: 'Impressione seus convidados nesse deslumbrante rooftop com vista panorâmica para o exuberante Rio Tapajós em Itaituba. Possui área gourmet com churrasqueira ecológica grande, forno de pizza a lenha, mesas modernas, ombrelones, sofás lounge ao ar livre e som ambiente de alta qualidade integrado por Bluetooth. Perfeito para casamentos, formaturas, aniversários, recepções empresariais de networking e jantares exclusivos.',
    category: 'party',
    pricePerHour: 220,
    capacity: 120,
    address: 'Av. Marechal Rondon, 1200 - Centro, Itaituba - PA',
    images: [
      'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'
    ],
    ownerId: 'owner-default-1',
    pixKey: '99988877766',
    pixType: 'cpf',
    contractRules: 'REGRAS DE CONTRATO - SALÃO TAPAJÓS VISTA\n\n1. LEI DO SILÊNCIO: A partir das 22h, o som de caixas acústicas deve ser mantido em nível baixo (som de fundo), respeitando as diretrizes internas da Convenção de Condomínio. Não são permitidas bandas ou DJs de alta potência.\n2. LIMPEZA DA CHURRASQUEIRA: A churrasqueira e os utensílios de cozinha utilizados deve ser limpos pelo locatário, ou será cobrada uma taxa de limpeza compulsória no valor fixo de R$ 150,00.\n3. BEBIDAS E VIDROS: Evitar copos e garrafas de vidro que possam quebrar na área externa perto das plantas.\n4. SEGURANÇA E ACESSO: O condomínio exige envio prévio da lista com nome e RG de todos os convidados para liberação na portaria até 12 horas antes do evento.',
    workingHours: {
      seg: { start: '10:00', end: '22:00', closed: false },
      ter: { start: '10:00', end: '22:00', closed: false },
      qua: { start: '10:00', end: '22:00', closed: false },
      qui: { start: '10:00', end: '22:00', closed: false },
      sex: { start: '10:00', end: '23:59', closed: false },
      sab: { start: '09:00', end: '23:59', closed: false },
      dom: { start: '09:00', end: '22:00', closed: false }
    },
    amenities: ['Vista para o Rio Tapajós', 'Churrasqueira', 'Forno de Pizza', 'Som Bluetooth Integrado', 'Geladeira Horizontal', 'Acessibilidade por Elevador'],
    createdAt: '2026-05-15T09:12:00Z',
    latitude: -4.2691,
    longitude: -55.9904
  },
  {
    id: 'env-1',
    title: 'Sala de Reuniões Executiva - Centro Empresarial Itaituba',
    description: 'Sala de reuniões moderna no coração corporativo de Itaituba com mesa para 12 pessoas, equipada com TV 4K de 75" para apresentações inovadoras, sistema de videoconferência Logitech, lousa de vidro e internet de alta velocidade. Perfeita para assembleias, reuniões importantes, treinamentos de negócios e assinaturas de contratos.',
    category: 'meeting',
    pricePerHour: 110,
    capacity: 12,
    address: 'Av. Getúlio Vargas, 450 - Centro, Itaituba - PA',
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80'
    ],
    ownerId: 'owner-default-1',
    pixKey: 'itaituba.espacos@alugaitb.com.br',
    pixType: 'email',
    contractRules: 'REGRAS DE CONTRATO DO ESPAÇO:\n\n1. CANCELAMENTO: Permitido com reembolso integral até 24 horas antes do início da reserva. Após este prazo, será retida uma taxa de 50% do valor total.\n2. LIMPEZA: O espaço deverá ser entregue em plenas condições de uso e higiene. Lixo deve ser depositado nos coletores apropriados.\n3. SILÊNCIO: Respeitar o limite sonoro de 45dB, compatível com o ambiente corporativo do edifício.\n4. EQUIPAMENTOS: O cliente é responsável por qualquer dano causado aos equipamentos de vídeo e videoconferência durante o período reservado.\n5. CAPACIDADE: Sob nenhuma circunstância é permitida a permanência de um número de pessoas superior ao limite máximo especificado para o ambiente (12 pessoas).',
    workingHours: {
      seg: { start: '08:00', end: '20:00', closed: false },
      ter: { start: '08:00', end: '20:00', closed: false },
      qua: { start: '08:00', end: '20:00', closed: false },
      qui: { start: '08:00', end: '20:00', closed: false },
      sex: { start: '08:00', end: '22:00', closed: false },
      sab: { start: '09:00', end: '16:00', closed: false },
      dom: { start: '00:00', end: '00:00', closed: true }
    },
    amenities: ['Ar-Condicionado', 'Televisão 4K', 'Videoconferência', 'Quadro Branco', 'Café & Água', 'Wi-Fi Ultraveloz'],
    createdAt: '2026-05-10T12:00:00Z',
    latitude: -4.2687,
    longitude: -55.9895
  },
  {
    id: 'env-2',
    title: 'Estúdio Audiovisual e Podcast Tapajós Studio',
    description: 'Estúdio profissional totalmente estruturado em Itaituba para gravação de podcasts, fotos, e vídeos institucionais. Equipado com fundo infinito móvel (preto, branco, chroma-key), softboxes de alta potência, iluminadores LED de última geração com controle de temperatura de cor e camarim privativo de apoio. O espaço perfeito para creators e empresas que exigem excelência.',
    category: 'studio',
    pricePerHour: 150,
    capacity: 8,
    address: 'Travessa Treze de Maio, 102 - Bela Vista, Itaituba - PA',
    images: [
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1520390138845-126468fc7d0a?auto=format&fit=crop&w=800&q=80'
    ],
    ownerId: 'owner-default-2',
    pixKey: '24.123.456/0001-99',
    pixType: 'cnpj',
    contractRules: 'REGRAS DE CONTRATO DO ESTÚDIO DE FOTOGRAFIA:\n\n1. USO DOS EQUIPAMENTOS: Todas as luzes e equipamentos do estúdio estão inclusos no preço da hora. O manuseio deve ser feito de forma cuidadosa. Se houver dúvidas, solicite apoio na portaria do prédio.\n2. AJUSTE DE CENÁRIO: O estúdio dispõe de 3 rolos de fundos de papel. Não pisar com calçados sujos sobre o fundo de papel. Caso haja sujeiras visíveis irreparáveis no papel, será cobrado R$ 40,00 por metro danificado.\n3. REPOSIÇÃO: Entregue o estúdio organizado, com os tripés e cabos recolhidos.\n4. ATRASOS: O tempo limite de tolerância é de 10 minutos. O uso além do período reservado será cobrado proporcionalmente em frações de 30 minutos.\n5. ANIMAIS: Permitido animais de estimação apenas se previamente aprovados pelo proprietário para ensaios pet.',
    workingHours: {
      seg: { start: '07:00', end: '22:00', closed: false },
      ter: { start: '07:00', end: '22:00', closed: false },
      qua: { start: '07:00', end: '22:00', closed: false },
      qui: { start: '07:00', end: '22:00', closed: false },
      sex: { start: '07:00', end: '23:00', closed: false },
      sab: { start: '08:00', end: '20:00', closed: false },
      dom: { start: '09:00', end: '18:00', closed: false }
    },
    amenities: ['Camarim Privado', 'Iluminação Completa', 'Fundo Infinito Móvel', 'Wi-Fi de Alta Velocidade', 'Frigobar Abastecido', 'Isolamento Acústico'],
    createdAt: '2026-05-12T15:30:00Z',
    latitude: -4.2705,
    longitude: -55.9870
  },
  {
    id: 'env-4',
    title: 'Consultório Integrado e Clínica - Perpétuo Socorro',
    description: 'Um espaço de saúde de alto padrão e total discrição em Itaituba. Desenvolvido para atendimentos clínicos, psicologia, psicanálise ou sessões de bem-estar. Conta com duas poltronas confortáveis, decoração sofisticada, difusor aromaterapêutico por ultrassom, iluminação aconchegante regulável e isolamento acústico premium nas paredes para máxima privacidade profissional.',
    category: 'consulting',
    pricePerHour: 60,
    capacity: 4,
    address: 'Rua Dr. Hugo de Mendonça, 889 - Perpétuo Socorro, Itaituba - PA',
    images: [
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=800&q=80'
    ],
    ownerId: 'owner-default-3',
    pixKey: 'contato@clinicaitb.com.br',
    pixType: 'email',
    contractRules: 'REGRAS DE CONTRATO DO CONSULTÓRIO:\n\n1. SIGILO E DISCRIÇÃO: Visando resguardar a privacidade e o sigilo profissional mútuo do consultório, é expressamente vetado tirar fotos na recepção em que apareçam outros pacientes.\n2. ISOLAMENTO ACÚSTICO: Manter a porta do consultório sempre fechada durante o atendimento.\n3. USO DO DIFUSOR: Fica liberada a escolha de óleos essenciais para o difusor elétrico. Ao final do uso, favor desligar o difusor da tomada.\n4. HORÁRIO E TOLERÂNCIA: Pedimos pontualidade absoluta. Não é permitida a ocupação antecipada caso haja outro profissional em atendimento anterior.\n5. ALIMENTAÇÃO: Não é permitido o consumo de refeições com odor forte (como almoços) dentro da sala de atendimento.',
    workingHours: {
      seg: { start: '07:00', end: '22:00', closed: false },
      ter: { start: '07:00', end: '22:00', closed: false },
      qua: { start: '07:00', end: '22:00', closed: false },
      qui: { start: '07:00', end: '22:00', closed: false },
      sex: { start: '07:00', end: '22:00', closed: false },
      sab: { start: '07:00', end: '18:00', closed: false },
      dom: { start: '00:00', end: '00:00', closed: true }
    },
    amenities: ['Isolamento Acústico', 'Iluminação Regulável', 'Aromaterapia', 'Poltronas Ergonômicas', 'Ar-Condicionado Silencioso', 'Chá & Água Cortesia'],
    createdAt: '2026-05-18T10:00:00Z',
    latitude: -4.2721,
    longitude: -55.9812
  }
];
