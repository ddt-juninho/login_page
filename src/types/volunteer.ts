export type RegistrationStatus = 'pendente' | 'confirmado' | 'recusado';

export interface PlayerRegistration {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  status: RegistrationStatus;
}