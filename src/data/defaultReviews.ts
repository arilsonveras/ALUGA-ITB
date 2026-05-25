import { EnvironmentReview } from '../types';

export const DEFAULT_REVIEWS: EnvironmentReview[] = [
  {
    id: 'rev-3-1',
    environmentId: 'env-3',
    renterEmail: 'lucas.barbosa@gmail.com',
    renterName: 'Lucas Barbosa',
    rating: 5,
    comment: 'Instalação impecável! O buffet parceiro foi excelente e a ornamentação estava belíssima no salão gourmet rooftop.',
    createdAt: '2026-05-15T18:30:00Z'
  },
  {
    id: 'rev-3-2',
    environmentId: 'env-3',
    renterEmail: 'carol.silva@hotmail.com',
    renterName: 'Carla Silva',
    rating: 4,
    comment: 'Excelente acústica e ar-condicionado super gelado. Perfeito para o aniversário do meu filho.',
    createdAt: '2026-05-10T14:20:00Z'
  },
  {
    id: 'rev-1-1',
    environmentId: 'env-1',
    renterEmail: 'marcos.viana@tech.com',
    renterName: 'Marcos Viana',
    rating: 5,
    comment: 'Excelente internet para nossa sprint meeting. O anfitrião foi extremamente atencioso.',
    createdAt: '2026-05-18T10:00:00Z'
  },
  {
    id: 'rev-2-1',
    environmentId: 'env-2',
    renterEmail: 'mariana.macedo@design.com',
    renterName: 'Mariana Macedo',
    rating: 5,
    comment: 'Melhor estúdio de fotos que já aluguei na plataforma! Iluminação natural belíssima.',
    createdAt: '2026-05-20T09:00:00Z'
  }
];
