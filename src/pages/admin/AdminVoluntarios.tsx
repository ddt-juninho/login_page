import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  Phone,
  Trash2,
  Trophy,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserPlus,
  GitFork,
  RefreshCw,
  WifiOff,
  Sparkles,
  CheckCheck,
  QrCode,
  LogOut,
} from 'lucide-react';
import type {
  PlayerRegistration,
  RegistrationStatus,
} from '../../types/volunteer';
import DragonEmblem from '../../components/DragonEmblem';
import RegistrationQrModal from '../../components/RegistrationQrModal';
import { revokeAdminSession } from '../../components/ProtectedAdminRoute';
import { supabase } from '../../lib/supabase';

const CACHE_PLAYERS_KEY = 'mk_admin_players_cache_v1';
const SEEN_IDS_KEY = 'mk_admin_seen_ids_v1';
const LAST_SYNC_KEY = 'mk_admin_last_sync_v1';

const FETCH_TIMEOUT_MS = 8000;
const POLL_INTERVAL_MS = 25000;

function loadCachedPlayers(): PlayerRegistration[] {
  try {
    const raw = localStorage.getItem(CACHE_PLAYERS_KEY);
    return raw ? (JSON.parse(raw) as PlayerRegistration[]) : [];
  } catch {
    return [];
  }
}

function loadSeenIds(): Set<string> | null {
  try {
    const raw = localStorage.getItem(SEEN_IDS_KEY);
    if (!raw) return null;
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return null;
  }
}

function saveSeenIds(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignorar se storage estiver cheio
  }
}

export default function AdminVoluntarios() {
  const navigate = useNavigate();

  // Inicia logo com cache local para carregamento instantâneo em internet fraca
  const [players, setPlayers] = useState<PlayerRegistration[]>(() =>
    loadCachedPlayers()
  );
  const [seenIds, setSeenIds] = useState<Set<string>>(
    () => loadSeenIds() ?? new Set()
  );
  const [hasInitializedSeen, setHasInitializedSeen] = useState<boolean>(
    () => loadSeenIds() !== null
  );

  const [initialLoading, setInitialLoading] = useState<boolean>(
    () => loadCachedPlayers().length === 0
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastSync, setLastSync] = useState<string | null>(() =>
    localStorage.getItem(LAST_SYNC_KEY)
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | RegistrationStatus>('todos');
  const [isQrOpen, setIsQrOpen] = useState(false);

  const isFetchingRef = useRef(false);
  const retryTimeoutRef = useRef<number | null>(null);

  const handleLogout = () => {
    revokeAdminSession();
    navigate('/admin/login', { replace: true });
  };

  const fetchPlayers = useCallback(
    async (options?: { silent?: boolean; retryCount?: number }) => {
      const silent = options?.silent ?? false;
      const retryCount = options?.retryCount ?? 0;

      if (isFetchingRef.current) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
        setInitialLoading(false);
        return;
      }

      isFetchingRef.current = true;
      if (!silent && players.length === 0) setInitialLoading(true);
      setIsSyncing(true);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        FETCH_TIMEOUT_MS
      );

      try {
        // Select leve apenas com os campos necessários (poupa dados em rede lenta)
        const { data, error } = await supabase
          .from('mk_registrations')
          .select('id, full_name, name, phone, status, created_at')
          .order('created_at', { ascending: false })
          .abortSignal(controller.signal);

        window.clearTimeout(timeoutId);

        if (error) throw error;

        if (data) {
          const normalized: PlayerRegistration[] = data.map((row: any) => ({
            id: String(row.id),
            full_name: row.full_name || row.name || 'Sem nome',
            phone: row.phone || '',
            created_at: row.created_at || '',
            status:
              row.status === 'pending' || !row.status
                ? 'pendente'
                : (row.status as RegistrationStatus),
          }));

          setPlayers(normalized);
          setFetchError(null);

          // Guardar cache local
          try {
            localStorage.setItem(CACHE_PLAYERS_KEY, JSON.stringify(normalized));
            const nowStr = new Date().toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            setLastSync(nowStr);
            localStorage.setItem(LAST_SYNC_KEY, nowStr);
          } catch {
            // Ignorar erro de quota
          }

          // Na primeira abertura neste dispositivo, regista os atuais como já vistos
          // para que apenas os que entrarem depois apareçam como NOVO
          if (!hasInitializedSeen) {
            const initialSet = new Set(normalized.map((p) => p.id));
            setSeenIds(initialSet);
            saveSeenIds(initialSet);
            setHasInitializedSeen(true);
          }
        }
      } catch (err: any) {
        window.clearTimeout(timeoutId);
        const isAbort = err?.name === 'AbortError';
        console.warn('Falha na sincronização:', err);

        setFetchError(
          isAbort
            ? 'Ligação lenta (tempo esgotado). A mostrar dados guardados localmente.'
            : 'Sem ligação estável ao servidor. A mostrar cache local.'
        );

        // Até 2 tentativas automáticas com atraso progressivo
        if (retryCount < 2) {
          const delay = (retryCount + 1) * 3000;
          retryTimeoutRef.current = window.setTimeout(() => {
            fetchPlayers({ silent: true, retryCount: retryCount + 1 });
          }, delay);
        }
      } finally {
        isFetchingRef.current = false;
        setInitialLoading(false);
        setIsSyncing(false);
      }
    },
    [hasInitializedSeen, players.length]
  );

  // Marcar um jogador específico como visto
  const markAsSeen = useCallback((id: string) => {
    setSeenIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveSeenIds(next);
      return next;
    });
  }, []);

  // Marcar todos os atuais como vistos
  const markAllAsSeen = useCallback(() => {
    const next = new Set(seenIds);
    players.forEach((p) => next.add(p.id));
    setSeenIds(next);
    saveSeenIds(next);
  }, [players, seenIds]);

  useEffect(() => {
    fetchPlayers({ silent: players.length > 0 });

    // Monitorizar estado da internet
    const handleOnline = () => {
      setIsOnline(true);
      fetchPlayers({ silent: true });
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    // Atualizar quando o admin volta para o separador/app
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchPlayers({ silent: true });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    // Polling suave de segurança (caso WebSocket caia em rede móvel fraca)
    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        fetchPlayers({ silent: true });
      }
    }, POLL_INTERVAL_MS);

    // Realtime do Supabase (atualização imediata quando a rede permite)
    const channel = supabase
      .channel('mk_registrations_admin_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mk_registrations' },
        () => {
          fetchPlayers({ silent: true });
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(pollId);
      if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchPlayers, players.length]);

  const openWhatsAppApp = (
    player: PlayerRegistration,
    status: 'confirmado' | 'recusado'
  ) => {
    const cleanCandidateDigits = player.phone.replace(/\D/g, '');
    const waTargetNumber = cleanCandidateDigits.startsWith('258')
      ? cleanCandidateDigits
      : `258${cleanCandidateDigits}`;

    const message =
      status === 'confirmado'
        ? `Olá *${player.full_name}*! 🔥\n\nA tua inscrição no *Campeonato de Mortal Kombat (UniTiva)* foi *CONFIRMADA*! 🏆\n\nEm breve enviaremos a tabela de combates e os horários. Prepara-te para a arena!`
        : `Olá *${player.full_name}*.\n\nInformamos que, infelizmente, a tua inscrição no *Campeonato de Mortal Kombat (UniTiva)* foi *RECUSADA* nesta edição (vagas esgotadas ou dados incompletos).\n\nObrigado pelo interesse em participar!`;

    // Esquema nativo whatsapp:// para abrir diretamente a aplicação no iPhone (iOS) e Android
    const nativeWhatsappUri = `whatsapp://send?phone=${waTargetNumber}&text=${encodeURIComponent(
      message
    )}`;

    window.location.href = nativeWhatsappUri;
  };

  const handleDecision = async (
    player: PlayerRegistration,
    newStatus: 'confirmado' | 'recusado'
  ) => {
    if (!isOnline) {
      setFetchError(
        'Estás sem internet. Liga a rede para confirmar ou recusar este jogador.'
      );
      return;
    }

    setActionLoadingId(player.id);
    markAsSeen(player.id);

    // Atualização otimista na interface para resposta imediata
    const previousPlayers = [...players];
    const optimisticPlayers = players.map((p) =>
      p.id === player.id ? { ...p, status: newStatus } : p
    );
    setPlayers(optimisticPlayers);
    localStorage.setItem(CACHE_PLAYERS_KEY, JSON.stringify(optimisticPlayers));

    const { error } = await supabase
      .from('mk_registrations')
      .update({ status: newStatus })
      .eq('id', player.id);

    setActionLoadingId(null);

    if (error) {
      // Reverte se falhar no servidor
      setPlayers(previousPlayers);
      localStorage.setItem(CACHE_PLAYERS_KEY, JSON.stringify(previousPlayers));
      setFetchError(
        'Falha ao guardar no servidor devido à internet fraca. Tenta novamente.'
      );
      return;
    }

    openWhatsAppApp(player, newStatus);
  };

  const deletePlayer = async (id: string) => {
    if (!isOnline) {
      setFetchError('Estás sem internet. Não é possível eliminar offline.');
      return;
    }

    setActionLoadingId(id);

    const previousPlayers = [...players];
    const optimisticPlayers = players.filter((p) => p.id !== id);
    setPlayers(optimisticPlayers);
    localStorage.setItem(CACHE_PLAYERS_KEY, JSON.stringify(optimisticPlayers));

    const { error } = await supabase
      .from('mk_registrations')
      .delete()
      .eq('id', id);

    setActionLoadingId(null);

    if (error) {
      setPlayers(previousPlayers);
      localStorage.setItem(CACHE_PLAYERS_KEY, JSON.stringify(previousPlayers));
      setFetchError('Não foi possível eliminar o registo. Verifica a ligação.');
    }
  };

  const newPlayersCount = hasInitializedSeen
    ? players.filter((p) => !seenIds.has(p.id)).length
    : 0;

  const filteredList =
    filter === 'todos' ? players : players.filter((p) => p.status === filter);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between">
      <div>
        <header className="border-b border-zinc-800 bg-zinc-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <DragonEmblem className="w-7 h-7 min-w-[28px] min-h-[28px]" />
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-500">
                  Painel Admin • MK Arena
                </span>
                <span className="text-[10px] text-zinc-500">
                  {!isOnline
                    ? 'Modo Offline (cache local)'
                    : isSyncing
                    ? 'A sincronizar...'
                    : lastSync
                    ? `Atualizado às ${lastSync}`
                    : 'Pronto'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsQrOpen(true)}
                title="Abrir Código QR Oficial"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 rounded-xl border border-emerald-500/30 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>QR Code</span>
              </button>

              <button
                onClick={() => fetchPlayers({ silent: false })}
                disabled={isSyncing || !isOnline}
                title="Atualizar lista agora"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-200 bg-zinc-900 hover:bg-zinc-800 px-3 py-2 rounded-xl border border-zinc-800 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isSyncing ? 'text-amber-400' : ''}`}
                />
                <span className="hidden sm:inline">
                  {isSyncing ? 'A sincronizar...' : 'Atualizar'}
                </span>
              </button>

              <Link
                to="/admin/mapa"
                className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 rounded-xl border border-amber-500/40"
              >
                <GitFork className="w-4 h-4" />
                <span>Mapa / Sorteio</span>
              </Link>

              <Link
                to="/"
                onClick={revokeAdminSession}
                className="inline-flex items-center gap-2 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 px-3.5 py-2 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar ao Formulário</span>
                <span className="sm:hidden">Formulário</span>
              </Link>

              <button
                onClick={handleLogout}
                title="Terminar sessão do administrador"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-xl border border-red-500/30 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
          {/* Banner de estado Offline / Rede Fraca */}
          {!isOnline && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2.5">
              <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Sem ligação à internet. A mostrar os dados guardados no teu
                dispositivo. Assim que a rede voltar, a lista atualiza
                sozinha.
              </span>
            </div>
          )}

          {fetchError && isOnline && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{fetchError}</span>
              </div>
              <button
                onClick={() => fetchPlayers({ silent: false })}
                className="underline font-bold text-red-200 hover:text-white shrink-0 cursor-pointer"
              >
                Tentar já
              </button>
            </div>
          )}

          {/* Banner de Novas Inscrições Detetadas */}
          {newPlayersCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-200 font-semibold">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {newPlayersCount === 1
                    ? '1 nova inscrição desde a tua última visita!'
                    : `${newPlayersCount} novas inscrições desde a tua última visita!`}
                </span>
              </div>
              <button
                onClick={markAllAsSeen}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Marcar todos como vistos</span>
              </button>
            </div>
          )}

          {/* Cabeçalho da Lista + Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                Jogadores Inscritos
              </h1>
              <p className="text-sm text-zinc-400">
                Total de registos:{' '}
                <strong className="text-white">{players.length}</strong>
                {newPlayersCount > 0 && (
                  <span className="ml-2 text-amber-400 font-semibold">
                    • {newPlayersCount} {newPlayersCount === 1 ? 'novo' : 'novos'}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              {(['todos', 'pendente', 'confirmado', 'recusado'] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize cursor-pointer ${
                      filter === status
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Conteúdo da Lista */}
          {initialLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-36 rounded-2xl bg-zinc-900 border border-zinc-800"
                />
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-14 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
              <p className="text-zinc-400 text-sm">
                Nenhum jogador encontrado neste filtro.
              </p>
              <Link
                to="/"
                onClick={revokeAdminSession}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold border border-zinc-700"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ir para o Formulário de Inscrição</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredList.map((player) => {
                const isBusy = actionLoadingId === player.id;
                const isNew = hasInitializedSeen && !seenIds.has(player.id);

                return (
                  <div
                    key={player.id}
                    onClick={() => {
                      if (isNew) markAsSeen(player.id);
                    }}
                    className={`bg-zinc-900 rounded-2xl p-5 flex flex-col justify-between gap-4 card-lite ${
                      isNew
                        ? 'border-2 border-amber-500/80'
                        : 'border border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-lg text-white">
                            {player.full_name}
                          </h3>
                          {isNew && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-zinc-950">
                              NOVO
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-zinc-300 font-mono">
                          <Phone className="w-4 h-4 text-amber-400" />
                          <span>{player.phone}</span>
                        </div>

                        {player.created_at && (
                          <p className="text-[11px] text-zinc-500">
                            Inscrito em{' '}
                            {new Date(player.created_at).toLocaleString('pt-PT', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            player.status === 'confirmado'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : player.status === 'recusado'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {player.status}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePlayer(player.id);
                          }}
                          disabled={isBusy}
                          title="Eliminar registo"
                          className="p-1.5 text-zinc-500 hover:text-red-400 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {player.status === 'confirmado' ? (
                      <div className="pt-3 border-t border-zinc-800 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          Inscrição confirmada • Mensagem enviada ao jogador
                        </span>
                      </div>
                    ) : player.status === 'recusado' ? (
                      <div className="pt-3 border-t border-zinc-800 flex items-center gap-2 text-xs font-semibold text-red-400">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>Inscrição recusada • Candidato notificado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecision(player, 'confirmado');
                          }}
                          disabled={isBusy}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold cursor-pointer border border-emerald-500/20 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirmar + WhatsApp</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecision(player, 'recusado');
                          }}
                          disabled={isBusy}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold cursor-pointer border border-red-500/20 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          <span>Recusar + WhatsApp</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-zinc-900 py-5 px-4 text-center">
        <Link
          to="/"
          onClick={revokeAdminSession}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-amber-400"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Regressar à página de inscrição de lutadores</span>
        </Link>
      </footer>

      {/* Modal do Código QR Oficial */}
      <RegistrationQrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
      />
    </div>
  );
}