export type EnvironmentCategory = string;

export interface WorkingHours {
  start: string; // e.g. "08:00"
  end: string;   // e.g. "22:00"
  closed: boolean;
}

export interface WeeklyWorkingHours {
  [key: string]: WorkingHours; // weekday key: "seg", "ter", "qua", "qui", "sex", "sab", "dom"
}

export interface CustomPricingRule {
  id: string;
  date: string; // "YYYY-MM-DD"
  label: string; // e.g., "Feriado", "Alta temporada", "Festa junina"
  pricePerHour: number;
}

export interface Environment {
  id: string;
  title: string;
  description: string;
  category: EnvironmentCategory;
  pricePerHour: number;
  capacity: number;
  address: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  images: string[];
  ownerId: string;
  pixKey: string;
  pixType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  contractRules: string;
  workingHours: WeeklyWorkingHours;
  amenities: string[];
  createdAt: string;
  weekendPricePerHour?: number;
  customPricingRules?: CustomPricingRule[];
  latitude?: number;
  longitude?: number;
  isPromoted?: boolean;
  promotionStatus?: 'none' | 'pending' | 'active';
  promotionFeePaid?: number;
  promotionDaysLimit?: number; // duration in days e.g., 30
  promotionExpiresAt?: string; // Expiration date in "YYYY-MM-DD" format
  videoUrl?: string; // demonstration video URL (e.g. YouTube, Vimeo or direct mp4 file)
}

export interface PromotionPricing {
  dailyRate: number; // custom daily rate, e.g. R$ 2.50
  rate7Days: number; // predefined package for 7 days, e.g. 20
  rate15Days: number; // e.g. 40
  rate30Days: number; // e.g. 70
  rate90Days: number; // e.g. 180
  rate365Days: number; // e.g. 600
}

export interface Reservation {
  id: string;
  environmentId: string;
  renterEmail: string;
  renterName: string;
  renterPhone?: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  totalHours: number;
  totalPrice: number;
  pixCode: string;
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
  contractAccepted: boolean;
  createdAt: string;
  selectedPartnerIds?: string[];
  paymentOption?: 'full' | 'minimum' | 'custom';
  paidAmount?: number;
  cancelRequested?: boolean;
  observation?: string;
}

export interface UserProfile {
  email: string;
  name: string;
  role: 'renter' | 'owner' | 'admin';
  balance: number; // for owner/admin: accumulated earnings
}

export interface ServicePartner {
  id: string;
  name: string;
  contactName: string;
  category: 'decor' | 'buffet' | 'music' | 'cleanup' | 'photo' | 'other';
  description: string;
  phone: string;
  email: string;
  imageUrl?: string;
  priceMessage?: string; // e.g. "A partir de R$ 400"
  adFeePaid: number;    // administrative fee paid for listing, e.g. R$ 150
  isActive: boolean;
  createdAt: string;
  portfolioImages?: string[];
  menuOrCatalog?: string[];
  activationDaysLimit?: number; // duration of active slot in days e.g. 30
  activationExpiresAt?: string; // expiration "YYYY-MM-DD"
}

export interface EnvironmentReview {
  id: string;
  environmentId: string;
  renterEmail: string;
  renterName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}
