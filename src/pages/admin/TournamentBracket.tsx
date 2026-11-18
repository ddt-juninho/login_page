import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shuffle,
  Trophy,
  Users,
  UserX,
  RotateCcw,
  Swords,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { PlayerRegistration } from '../../types/volunteer';
import DragonEmblem from '../../components/DragonEmblem';
import { supabase } from '../../lib/supabase';

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

export default function TournamentBracket() {
  const [confirmedPlayers, setConfirmedPlayers] = useState<PlayerRegistration[]>([]);
  const [bracket, setBracket] = useState<BracketState>({
    rounds: [],
    benchedPlayer: null,
    champion: null,
  });
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  const fighterColors = useMemo(
    () => buildDynamicPalette(confirmedPlayers),
    [confirmedPlayers]
  );

  const saveBracketState = useCallback((newState: BracketState) => {
    setBracket(newState);
    try {
      localStorage.setItem(BRACKET_STORAGE_KEY, JSON.stringify(newState));
    } catch {
      // Ignorar
    }
  }, []);

  const generateSmartDraw = useCallback(
    (playersList: PlayerRegistration[], animate = true) => {
      if (playersList.length < 2) {
        saveBracketState({ rounds: [], benchedPlayer: null, champion: null });
        return;
      }

      if (animate) setIsShuffling(true);

      window.setTimeout(
        () => {
          const pool = [...playersList];
          for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
          }

          let benched: PlayerRegistration | null = null;
          if (pool.length % 2 !== 0) {
            benched = pool.pop() || null;
          }

          const activeCount = pool.length;
          let bracketSlots = 2;
          while (bracketSlots < activeCount) {
            bracketSlots *= 2;
          }

          const round1: (PlayerRegistration | null)[] = Array(bracketSlots).fill(
            null
          );
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

          saveBracketState({
            rounds,
            benchedPlayer: benched,
            champion: null,
          });

          setIsShuffling(false);
        },
        animate ? 150 : 0
      );
    },
    [saveBracketState]
  );

  const fetchConfirmedFromSupabase = useCallback(async () => {
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
          created_at: row.created_at || new Date().toISOString(),
        })
      );

      setConfirmedPlayers(realConfirmed);

      if (realConfirmed.length < 2) {
        saveBracketState({ rounds: [], benchedPlayer: null, champion: null });
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
          // Ignorar
        }
      }

      generateSmartDraw(realConfirmed, false);
    } catch {
      setSyncError(
        'Não foi possível carregar os jogadores confirmados da base de dados. Verifica a ligação.'
      );
    } finally {
      setLoadingPlayers(false);
    }
  }, [generateSmartDraw, saveBracketState]);

  useEffect(() => {
    fetchConfirmedFromSupabase();
  }, [fetchConfirmedFromSupabase]);

  const handleSelectWinner = (
    roundIndex: number,
    slotIndex: number,
    player: PlayerRegistration | null
  ) => {
    if (!player) return;

    const updatedRounds = bracket.rounds.map((r) => [...r]);
    let updatedChampion = bracket.champion;

    if (roundIndex === updatedRounds.length - 1) {
      updatedChampion = player;
    } else {
      const nextRoundIndex = roundIndex + 1;
      const nextSlotIndex = Math.floor(slotIndex / 2);
      updatedRounds[nextRoundIndex][nextSlotIndex] = player;

      for (let r = nextRoundIndex + 1; r < updatedRounds.length; r++) {
        const downstreamSlot = Math.floor(
          slotIndex / Math.pow(2, r - roundIndex)
        );
        updatedRounds[r][downstreamSlot] = null;
      }
      updatedChampion = null;
    }

    saveBracketState({
      ...bracket,
      rounds: updatedRounds,
      champion: updatedChampion,
    });
  };

  const resetProgressOnly = () => {
    if (bracket.rounds.length === 0) return;
    const clearedRounds = bracket.rounds.map((round, idx) =>
      idx === 0 ? [...round] : Array(round.length).fill(null)
    );
    saveBracketState({
      ...bracket,
      rounds: clearedRounds,
      champion: null,
    });
  };

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
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/voluntarios"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-amber-400 bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Admin</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <DragonEmblem className="w-7 h-7" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-500">
                Chave Eliminatória • MK Arena
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchConfirmedFromSupabase}
              disabled={loadingPlayers}
              title="Sincronizar jogadores confirmados com a base de dados"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-800 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingPlayers ? 'text-amber-400' : ''
                }`}
              />
              <span className="hidden sm:inline">
                {loadingPlayers ? 'A sincronizar...' : 'Sincronizar'}
              </span>
            </button>

            {bracket.rounds.length > 0 && (
              <button
                onClick={resetProgressOnly}
                title="Limpar vencedores avançados mantendo o mesmo sorteio"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar Vencedores</span>
              </button>
            )}

            <button
              onClick={() => generateSmartDraw(confirmedPlayers, true)}
              disabled={confirmedPlayers.length < 2 || isShuffling || loadingPlayers}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              <Shuffle className="w-4 h-4" />
              <span>
                {isShuffling ? 'A Sortear...' : 'Sortear Candidatos'}
              </span>
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
              onClick={fetchConfirmedFromSupabase}
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
              Confirmados na Base de Dados:{' '}
              <strong className="text-white">
                {loadingPlayers ? '...' : confirmedPlayers.length}
              </strong>
            </span>
            {totalSlots > 0 && !loadingPlayers && (
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Swords className="w-4 h-4 text-red-400" />
                Capacidade gerada no mapa:{' '}
                <strong className="text-amber-400">{totalSlots} espaços</strong>
              </span>
            )}
          </div>
          <p className="text-zinc-400">
            Clica num lutador para avançá-lo para a fase seguinte do mapa.
          </p>
        </div>

        {loadingPlayers ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-3">
            <p className="text-xs font-semibold text-amber-400">
              A carregar lutadores confirmados da base de dados...
            </p>
          </div>
        ) : confirmedPlayers.length < 2 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">
              Jogadores Confirmados Insuficientes
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Existem atualmente <strong>{confirmedPlayers.length}</strong>{' '}
              candidatos confirmados na base de dados. É necessário confirmar pelo
              menos <strong>2 candidatos</strong> no painel administrativo para
              gerar o mapa.
            </p>
            <Link
              to="/admin/voluntarios"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs"
            >
              Confirmar Jogadores no Painel
            </Link>
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
                          const slotAIndex = matchIdx * 2;
                          const slotBIndex = matchIdx * 2 + 1;
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
                              <div className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg overflow-hidden">
                                {/* Jogador A */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSelectWinner(
                                      roundIdx,
                                      slotAIndex,
                                      playerA
                                    )
                                  }
                                  disabled={!playerA}
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
                                    playerA
                                      ? 'cursor-pointer'
                                      : 'bg-zinc-950 text-zinc-700 cursor-default h-8'
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
                                </button>

                                {/* Jogador B */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSelectWinner(
                                      roundIdx,
                                      slotBIndex,
                                      playerB
                                    )
                                  }
                                  disabled={!playerB}
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
                                    playerB
                                      ? 'cursor-pointer'
                                      : 'bg-zinc-950 text-zinc-700 cursor-default h-8'
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
                                </button>
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

            {/* Secção Inferior: Candidato De Fora */}
            {bracket.benchedPlayer && benchedStyle && (
              <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-lite">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                    <UserX className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                        Candidato De Fora (Número Ímpar)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-semibold">
                        Em Espera / Bye
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Como há{' '}
                      <strong className="text-white">
                        {confirmedPlayers.length} jogadores
                      </strong>{' '}
                      confirmados (número ímpar), este participante ficou fora
                      dos confrontos iniciais nesta rodada:
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
                  <p className="text-xs font-mono opacity-80">
                    {bracket.benchedPlayer.phone}
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