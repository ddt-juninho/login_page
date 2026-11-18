import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PlayerRegistration } from '../types/volunteer';

export interface CreateRegistrationDTO {
  full_name: string;
  phone: string;
}

const REGISTRATIONS_KEY = ['mk_registrations'];

// 1. Buscar total de lutadores inscritos (ultra-leve, só conta na BD)
export function useRegistrationsCount() {
  return useQuery({
    queryKey: [...REGISTRATIONS_KEY, 'count'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('mk_registrations')
        .select('*', { count: 'exact', head: true });

      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    staleTime: 1000 * 60, // Cache válido por 1 minuto
  });
}

// 2. Listar todos os inscritos (útil para a página /admin/voluntarios)
export function useRegistrationsList() {
  return useQuery({
    queryKey: REGISTRATIONS_KEY,
    queryFn: async (): Promise<PlayerRegistration[]> => {
      const { data, error } = await supabase
        .from('mk_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as PlayerRegistration[]) ?? [];
    },
  });
}

// 3. Registar um novo lutador
export function useCreateRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateRegistrationDTO): Promise<PlayerRegistration> => {
      const formattedData = {
        full_name: payload.full_name.trim(),
        phone: `+258 ${payload.phone.trim()}`,
        status: 'pendente' as const,
      };

      const { data, error } = await supabase
        .from('mk_registrations')
        .insert([formattedData])
        .select()
        .single();

      if (error) {
        // Código 23505 no PostgreSQL = violação de chave única (telefone já registado)
        if (error.code === '23505') {
          throw new Error('Este número de telefone já está inscrito no campeonato.');
        }
        throw new Error('Erro ao registar inscrição. Tenta novamente.');
      }

      return data as PlayerRegistration;
    },
    onSuccess: () => {
      // Atualiza automaticamente o contador e a lista após inserir
      queryClient.invalidateQueries({ queryKey: REGISTRATIONS_KEY });
    },
  });
}