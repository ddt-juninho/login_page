import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Users,
  UserX,
  Swords,
  AlertCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import type { PlayerRegistration } from '../types/volunteer';
import DragonEmblem from '../components/DragonEmblem';
import { supabase } from '../lib/supabase';

const BRACKET_STORAGE_KEY = 'mk_tournament_bracket_state_v2';

interface BracketState {
  rounds: (PlayerRegistration | null)[][];
  benchedPlayer: PlayerRegistration | null;
  champion: PlayerRegistration | null;
}

interface FighterColorStyle {
  baseBg: string;
  winBg: string;
  accentColor: string;
  textColor: string;
  badgeBg: string;
}

function buildDynamicPalette(
  players: PlayerRegistration[]
): Record<string, FighterColorStyle> {
  const map: Record<string, FighterColorStyle> = {};
  const goldenAngle = 137.508;
  const baseHueOffset = 38;

  players.forEach((player, index) => {
    const hue = Math.round((baseHueOffset + index * goldenAngle) % 360);
    map[player.id] = {
      baseBg: `hsl(${hue}, 45%, 14%)`,
      winBg: `hsl(${hue}, 65%, 24%)`,
      accentColor: `hsl(${hue}, 85%, 54%)`,
      textColor: `hsl(${hue}, 90%, 92%)`,
      badgeBg: `hsl(${hue}, 85%, 54%)`,
    };
  });

  return map;
}

function buildDeterministicInitialBracket(
  playersList: PlayerRegistration[]
): BracketState {
  if (playersList.length < 2) {
    return { rounds: [], benchedPlayer: null, champion: null };
  }

  const pool = [...playersList];
  let benched: PlayerRegistration | null = null;
  if (pool.length % 2 !== 0) {
    benched = pool.pop() || null;
  }

  const activeCount = pool.length;
  let bracketSlots = 2;
  while (bracketSlots < activeCount) {
    bracketSlots *= 2;
  }

  const round1: (PlayerRegistration | null)[] = Array(bracketSlots).fill(null);
  for (let i = 0; i < activeCount; i++) {
    round1[i] = pool[i];
  }

  const totalRounds = Math.log2(bracketSlots);
  const rounds: (PlayerRegistration | null)[][] = [round1];

  let currentSlots = bracketSlots / 2;
  for (let r = 1; r < totalRounds; r++) {
    rounds.push(Array(currentSlots).fill(null));
    currentSlots /= 2;
  }

  return {
    rounds,
    benchedPlayer: benched,
    champion: null,
  };
}

export default function PublicTournamentBracket() {
  const [confirmedPlayers, setConfirmedPlayers] = useState<PlayerRegistration[]>(
    []
  );
  const [bracket, setBracket] = useState<BracketState>({
    rounds: [],
    benchedPlayer: null,
    champion: null,
  });
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const fighterColors = useMemo(
    () => buildDynamicPalette(confirmedPlayers),
    [confirmedPlayers]
  );

  const fetchConfirmedPlayers = useCallback(async () => {
    setLoadingPlayers(true);
    setSyncError(null);

    try {
      const { data, error } = await supabase
        .from('mk_registrations')
        .select('id, full_name, name, phone, status, created_at')
        .eq('status', 'confirmado')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const realConfirmed: PlayerRegistration[] = (data || []).map(
        (row: any) => ({
          id: String(row.id),
          full_name: row.full_name || row.name || 'Sem nome',
          phone: row.phone || '',
          status: 'confirmado',
          created_at: row.created_at || '',
        })
      );

      setConfirmedPlayers(realConfirmed);

      if (realConfirmed.length < 2) {
        setBracket({ rounds: [], benchedPlayer: null, champion: null });
        return;
      }

      const validIds = new Set(realConfirmed.map((p) => p.id));
      const savedRaw = localStorage.getItem(BRACKET_STORAGE_KEY);

      if (savedRaw) {
        try {
          const parsed: BracketState = JSON.parse(savedRaw);
          const bracketIds = new Set<string>();

          parsed.rounds.forEach((round) =>
            round.forEach((slot) => {
              if (slot) bracketIds.add(slot.id);
            })
          );
          if (parsed.benchedPlayer) bracketIds.add(parsed.benchedPlayer.id);

          const isSameRoster =
            bracketIds.size === validIds.size &&
            Array.from(bracketIds).every((id) => validIds.has(id));

          if (isSameRoster && parsed.rounds.length > 0) {
            setBracket(parsed);
            return;
          }
        } catch {
          // Fallback abaixo
        }
      }

      setBracket(buildDeterministicInitialBracket(realConfirmed));
    } catch {
      setSyncError(
        'Não foi possível carregar o mapa de combates agora. Verifica a ligação.'
      );
    } finally {
      setLoadingPlayers(false);
    }
  }, []);

  useEffect(() => {
    fetchConfirmedPlayers();
  }, [fetchConfirmedPlayers]);

  const getRoundTitle = (roundIdx: number, totalRounds: number) => {
    const remaining = totalRounds - roundIdx;
    if (remaining === 1) return 'Final';
    if (remaining === 2) return 'Meias-Finais';
    if (remaining === 3) return 'Quartos-de-Final';
    if (remaining === 4) return 'Oitavos-de-Final';
    return `Fase ${roundIdx + 1}`;
  };

  const totalSlots = bracket.rounds[0]?.length || 0;
  const championStyle = bracket.champion
    ? fighterColors[bracket.champion.id]
    : null;
  const benchedStyle = bracket.benchedPlayer
    ? fighterColors[bracket.benchedPlayer.id]
    : null;

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between">
      {/* Cabeçalho Público (Sem botões administrativos) */}
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-amber-400 bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Página Inicial</span>
            </Link>

            <div className="flex items-center gap-2">
              <DragonEmblem className="w-7 h-7" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-500">
                Tabela Oficial • MK Arena
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-400">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Visualização</span>
            </span>

            <button
              onClick={fetchConfirmedPlayers}
              disabled={loadingPlayers}
              title="Atualizar confrontos"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-800 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingPlayers ? 'text-amber-400' : ''
                }`}
              />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 flex-1">
        {syncError && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{syncError}</span>
            </div>
            <button
              onClick={fetchConfirmedPlayers}
              className="underline font-bold text-red-200 hover:text-white cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3.5 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Users className="w-4 h-4 text-amber-400" />
              Lutadores Confirmados:{' '}
              <strong className="text-white">
                {loadingPlayers ? '...' : confirmedPlayers.length}
              </strong>
            </span>
            {totalSlots > 0 && !loadingPlayers && (
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Swords className="w-4 h-4 text-red-400" />
                Chave do Torneio:{' '}
                <strong className="text-amber-400">{totalSlots} vagas</strong>
              </span>
            )}
          </div>
          <p className="text-zinc-400">
            Acompanha aqui os confrontos oficiais e o avanço dos vencedores.
          </p>
        </div>

        {loadingPlayers ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-3">
            <p className="text-xs font-semibold text-amber-400">
              A carregar mapa de combates...
            </p>
          </div>
        ) : confirmedPlayers.length < 2 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">
              Mapa Ainda em Preparação
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              A organização está a confirmar os primeiros lutadores inscritos.
              Assim que os confrontos forem gerados, aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-[#0b0c10] border border-zinc-800 rounded-3xl p-5 sm:p-7 overflow-x-auto card-lite">
              <div className="min-w-[760px] flex items-stretch justify-between gap-6">
                {bracket.rounds.map((roundSlots, roundIdx) => {
                  const matches: [
                    PlayerRegistration | null,
                    PlayerRegistration | null
                  ][] = [];
                  for (let i = 0; i < roundSlots.length; i += 2) {
                    matches.push([roundSlots[i], roundSlots[i + 1]]);
                  }

                  return (
                    <div
                      key={roundIdx}
                      className="flex-1 flex flex-col justify-between min-w-[210px]"
                    >
                      <div className="text-center mb-5 pb-2 border-b border-zinc-800">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">
                          {getRoundTitle(roundIdx, bracket.rounds.length)}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col justify-around gap-4">
                        {matches.map((pair, matchIdx) => {
                          const playerA = pair[0];
                          const playerB = pair[1];

                          const styleA = playerA ? fighterColors[playerA.id] : null;
                          const styleB = playerB ? fighterColors[playerB.id] : null;

                          const nextSlotPlayer =
                            roundIdx < bracket.rounds.length - 1
                              ? bracket.rounds[roundIdx + 1][matchIdx]
                              : bracket.champion;

                          const isAWinner =
                            playerA &&
                            nextSlotPlayer &&
                            nextSlotPlayer.id === playerA.id;
                          const isBWinner =
                            playerB &&
                            nextSlotPlayer &&
                            nextSlotPlayer.id === playerB.id;

                          return (
                            <div
                              key={matchIdx}
                              className="relative flex items-center"
                            >
                              <div className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg overflow-hidden select-none">
                                {/* Jogador A (Somente visualização) */}
                                <div
                                  style={
                                    playerA && styleA
                                      ? {
                                          backgroundColor: isAWinner
                                            ? styleA.winBg
                                            : styleA.baseBg,
                                          color: styleA.textColor,
                                        }
                                      : undefined
                                  }
                                  className={`relative w-full pl-4 pr-3 py-2 text-left text-xs font-bold uppercase tracking-wide flex items-center justify-between border-b border-zinc-800 ${
                                    !playerA ? 'bg-zinc-950 text-zinc-700 h-8' : ''
                                  }`}
                                >
                                  {playerA && styleA && (
                                    <span
                                      style={{
                                        backgroundColor: styleA.accentColor,
                                      }}
                                      className="absolute left-0 top-0 bottom-0 w-1.5"
                                    />
                                  )}
                                  <span className="truncate">
                                    {playerA ? playerA.full_name : '—'}
                                  </span>
                                  {isAWinner && styleA && (
                                    <span
                                      style={{
                                        backgroundColor: styleA.badgeBg,
                                      }}
                                      className="text-[9px] text-zinc-950 px-1.5 py-0.5 rounded font-black ml-1.5 shrink-0"
                                    >
                                      WIN
                                    </span>
                                  )}
                                </div>

                                {/* Jogador B (Somente visualização) */}
                                <div
                                  style={
                                    playerB && styleB
                                      ? {
                                          backgroundColor: isBWinner
                                            ? styleB.winBg
                                            : styleB.baseBg,
                                          color: styleB.textColor,
                                        }
                                      : undefined
                                  }
                                  className={`relative w-full pl-4 pr-3 py-2 text-left text-xs font-bold uppercase tracking-wide flex items-center justify-between ${
                                    !playerB ? 'bg-zinc-950 text-zinc-700 h-8' : ''
                                  }`}
                                >
                                  {playerB && styleB && (
                                    <span
                                      style={{
                                        backgroundColor: styleB.accentColor,
                                      }}
                                      className="absolute left-0 top-0 bottom-0 w-1.5"
                                    />
                                  )}
                                  <span className="truncate">
                                    {playerB ? playerB.full_name : '—'}
                                  </span>
                                  {isBWinner && styleB && (
                                    <span
                                      style={{
                                        backgroundColor: styleB.badgeBg,
                                      }}
                                      className="text-[9px] text-zinc-950 px-1.5 py-0.5 rounded font-black ml-1.5 shrink-0"
                                    >
                                      WIN
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="w-6 flex items-center">
                                <div className="w-full h-[2px] bg-zinc-700" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Coluna Final do Troféu / Campeão */}
                <div className="flex flex-col justify-center items-center min-w-[200px] pl-2 border-l border-zinc-800">
                  <div className="text-center space-y-4 p-5 rounded-2xl bg-zinc-900 border border-amber-500/30 w-full">
                    <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
                      <Trophy
                        className={`w-7 h-7 ${
                          bracket.champion
                            ? 'text-amber-400'
                            : 'text-amber-500/60'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500">
                        Grande Campeão
                      </p>
                      <div
                        style={
                          bracket.champion && championStyle
                            ? {
                                backgroundColor: championStyle.winBg,
                                color: championStyle.textColor,
                              }
                            : undefined
                        }
                        className={`relative min-h-[38px] flex items-center justify-center px-3 py-1.5 rounded-lg border border-zinc-800 overflow-hidden ${
                          !bracket.champion ? 'bg-zinc-950 text-zinc-500' : ''
                        }`}
                      >
                        {bracket.champion && championStyle && (
                          <span
                            style={{
                              backgroundColor: championStyle.accentColor,
                            }}
                            className="absolute left-0 top-0 bottom-0 w-1.5"
                          />
                        )}
                        <span className="text-xs font-black uppercase tracking-wider truncate">
                          {bracket.champion
                            ? bracket.champion.full_name
                            : 'A definir'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidato De Fora (Sem exibir número de telefone por privacidade pública) */}
            {bracket.benchedPlayer && benchedStyle && (
              <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-lite">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                    <UserX className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                        Participante em Espera (Número Ímpar)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-semibold">
                        Bye
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Por haver um número ímpar de lutadores confirmados, este
                      participante aguarda a próxima rodada:
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: benchedStyle.baseBg,
                    color: benchedStyle.textColor,
                  }}
                  className="relative pl-4 pr-4 py-2.5 rounded-xl border border-zinc-700/80 overflow-hidden shrink-0"
                >
                  <span
                    style={{ backgroundColor: benchedStyle.accentColor }}
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                  />
                  <p className="text-sm font-black uppercase">
                    {bracket.benchedPlayer.full_name}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}