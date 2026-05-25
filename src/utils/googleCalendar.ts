import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Reservation, Environment } from '../types';

// Safely initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Calendar scopes
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

// In-memory cache for token & user
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Token might have cleared, require active sign-in to populate credential
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o Token de Acesso do Google Calendar.');
    }

    cachedAccessToken = credential.accessToken;
    // Store in localStorage temporarily for page reloads status ONLY as a simple fallback or keep strictly in-memory?
    // The instructions say: "Do NOT store the access token in localStorage or sessionStorage."
    // "You MUST implement in-memory caching for the access token."
    // So we will adhere strictly to keeping actual access tokens in memory! We can store connected email as status marker only.
    localStorage.setItem('aluga_itb_google_connected_email', result.user.email || '');
    
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Erro na autenticação do Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedToken = (): string | null => {
  return cachedAccessToken;
};

export const disconnectGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  localStorage.removeItem('aluga_itb_google_connected_email');
  localStorage.removeItem('aluga_itb_google_selected_calendar');
  localStorage.removeItem('aluga_itb_google_auto_sync');
};

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
}

// Fetch list of user's calendars
export const fetchUserCalendars = async (token: string): Promise<GoogleCalendar[]> => {
  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) {
      throw new Error('Erro ao listar agendas do Google.');
    }
    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return [{ id: 'primary', summary: 'Agenda Principal', primary: true }];
  }
};

// Create Google Calendar event for a reservation
export const createGoogleCalendarEvent = async (
  token: string,
  calendarId: string,
  reservation: Reservation,
  environment: Environment
): Promise<{ success: boolean; eventId?: string; error?: string }> => {
  try {
    // Construct exact start & end ISO strings for the timezone of Itaituba (America/Belem is UTC-3)
    const startDateTime = `${reservation.date}T${reservation.startTime}:00`;
    const endDateTime = `${reservation.date}T${reservation.endTime}:00`;

    const eventBody = {
      summary: `[Aluga ITB] Reserva: ${environment.title}`,
      description: `=====================================\nRESERVA DE ESPAÇO - CONFIRMADO PELO DEPARTAMENTO DE LOCAÇÃO\n=====================================\n\n• Espaço: ${environment.title}\n• Localização: ${environment.address}\n\n• Cliente/Organizador: ${reservation.renterName}\n• E-mail do Cliente: ${reservation.renterEmail}\n• Telefone do Cliente: ${reservation.renterPhone || 'Não informado'}\n\n• Horário Reservado: das ${reservation.startTime} às ${reservation.endTime}\n• Total de Horas: ${reservation.totalHours}h\n• Valor Total Pago/Garantido: R$ ${reservation.totalPrice.toFixed(2)}\n• Status do Pagamento: ${reservation.status === 'confirmed' ? 'PAGO INTEGRAL (PIX)' : 'PENDENTE DE CONFIRMAÇÃO'}\n\n• Regras do Contrato Firmadas Eletronicamente:\n${environment.contractRules}\n\nCódigo da Reserva: ${reservation.id}\nGerado em: ${new Date(reservation.createdAt).toLocaleString('pt-BR')}\nPlataforma Aluga ITB - Aluguel Expresso Itaituba`,
      location: environment.address,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Belem'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Belem'
      },
      colorId: '5', // Yellow/Gold calendar color for easy visual identification
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 dia antes
          { method: 'popup', minutes: 60 }        // 1 hora antes
        ]
      }
    };

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventBody)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error?.message || 'Falha ao criar evento.');
    }

    const createdEvent = await res.json();
    return { success: true, eventId: createdEvent.id };
  } catch (error: any) {
    console.error('Erro ao adicionar evento ao Google Calendar:', error);
    return { success: false, error: error.message };
  }
};

// Check if an event exists or delete an event
export const deleteGoogleCalendarEvent = async (
  token: string,
  calendarId: string,
  eventId: string
): Promise<boolean> => {
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return res.ok;
  } catch (error) {
    console.error('Erro ao deletar evento do Google Calendar:', error);
    return false;
  }
};
