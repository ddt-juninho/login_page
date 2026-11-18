import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  X,
  Phone,
  Trash2,
  Trophy,
  ArrowLeft,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserPlus,
} from 'lucide-react';
import type {
  PlayerRegistration,
  RegistrationStatus,
} from '../../types/volunteer';
import DragonEmblem from '../../components/DragonEmblem';

const STORAGE_KEY = 'mk_tournament_registrations';
const ADMIN_PHONE_KEY = 'mk_tournament_admin_phone';

export default function AdminVoluntarios() {
  const [players, setPlayers] = useState<PlayerRegistration[]>([]);
  const [filter, setFilter] = useState<'todos' | RegistrationStatus>('todos');

  const [adminPhone, setAdminPhone] = useState('');
  const [adminPhoneError, setAdminPhoneError] = useState<string | null>(null);
  const [adminSavedFeedback, setAdminSavedFeedback] = useState(false);

  useEffect(() => {
    const savedPlayers = localStorage.getItem(STORAGE_KEY);
    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers));
    }

    const savedAdminPhone = localStorage.getItem(ADMIN_PHONE_KEY);
    if (savedAdminPhone) {
      setAdminPhone(savedAdminPhone);
    }
  }, []);

  const handleAdminPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 9);
    setAdminPhone(digitsOnly);
    localStorage.setItem(ADMIN_PHONE_KEY, digitsOnly);

    if (digitsOnly.length === 9) {
      setAdminPhoneError(null);
      setAdminSavedFeedback(true);
      setTimeout(() => setAdminSavedFeedback(false), 2500);
    }
  };

  const sendWhatsAppNotification = (
    player: PlayerRegistration,
    status: 'confirmado' | 'recusado',
    validAdminDigits: string
  ) => {
    const cleanCandidateDigits = player.phone.replace(/\D/g, '');
    const waTargetNumber = cleanCandidateDigits.startsWith('258')
      ? cleanCandidateDigits
      : `258${cleanCandidateDigits}`;

    const message =
      status === 'confirmado'
        ? `Olá *${player.full_name}*! 🔥\n\nA tua inscrição no *Campeonato de Mortal Kombat (UniTiva)* foi *CONFIRMADA*! 🏆\n\nEm breve enviaremos a tabela de combates e os horários.\nQualquer dúvida, fala diretamente com a organização pelo número: *+258 ${validAdminDigits}*.`
        : `Olá *${player.full_name}*.\n\nInformamos que, infelizmente, a tua inscrição no *Campeonato de Mortal Kombat (UniTiva)* foi *RECUSADA* nesta edição (vagas esgotadas ou dados incompletos).\n\nPara mais informações, contacta a administração pelo número: *+258 ${validAdminDigits}*.`;

    const whatsappUrl = `https://wa.me/${waTargetNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDecision = (
    player: PlayerRegistration,
    newStatus: 'confirmado' | 'recusado'
  ) => {
    if (adminPhone.length !== 9) {
      setAdminPhoneError(
        'Insere primeiro o teu número de WhatsApp (9 dígitos) acima antes de confirmar ou recusar.'
      );
      return;
    }

    setAdminPhoneError(null);

    const updated = players.map((p) =>
      p.id === player.id ? { ...p, status: newStatus } : p
    );
    setPlayers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    sendWhatsAppNotification(player, newStatus, adminPhone);
  };

  const deletePlayer = (id: string) => {
    const updated = players.filter((p) => p.id !== id);
    setPlayers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const filteredList =
    filter === 'todos' ? players : players.filter((p) => p.status === filter);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between">
      <div>
        {/* Barra Superior */}
        <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <DragonEmblem className="w-7 h-7 min-w-[28px] min-h-[28px]" />
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-500">
                Painel Admin • MK Arena
              </span>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 px-3.5 py-2 rounded-xl transition shadow-md shadow-amber-500/15"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Formulário</span>
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
          {/* Card de Configuração do Número do Administrador */}
          <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  Número de WhatsApp do Administrador
                </h2>
                <p className="text-xs text-zinc-400">
                  Preenche o teu contacto (9 dígitos). Ele será incluído na
                  mensagem enviada ao candidato quando clicares em Confirmar ou
                  Recusar.
                </p>
              </div>

              <div className="w-full sm:w-72 shrink-0">
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-amber-400 select-none border-r border-zinc-800 pr-2.5">
                    +258
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    value={adminPhone}
                    onChange={handleAdminPhoneChange}
                    placeholder="840000000"
                    className={`w-full rounded-xl bg-zinc-950 border pl-16 pr-14 py-2.5 text-sm text-white font-mono tracking-widest placeholder-zinc-600 focus:outline-none transition ${
                      adminPhoneError
                        ? 'border-red-500'
                        : adminPhone.length === 9
                        ? 'border-emerald-500/60'
                        : 'border-zinc-800 focus:border-amber-500'
                    }`}
                  />
                  <span className="absolute right-3 text-[11px] font-mono text-zinc-500">
                    {adminPhone.length}/9
                  </span>
                </div>
              </div>
            </div>

            {adminPhoneError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{adminPhoneError}</span>
              </div>
            )}

            {adminSavedFeedback && !adminPhoneError && (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Número do administrador guardado com sucesso!</span>
              </div>
            )}
          </div>

          {/* Cabeçalho da Lista e Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                Jogadores Inscritos
              </h1>
              <p className="text-sm text-zinc-400">
                Total de registos:{' '}
                <strong className="text-white">{players.length}</strong>
              </p>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              {(['todos', 'pendente', 'confirmado', 'recusado'] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
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

          {/* Grid de Participantes */}
          {filteredList.length === 0 ? (
            <div className="text-center py-14 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
              <p className="text-zinc-400 text-sm">
                Nenhum jogador encontrado neste filtro.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold border border-zinc-700 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ir para o Formulário de Inscrição</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredList.map((player) => (
                <div
                  key={player.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-lg text-white">
                        {player.full_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-300 font-mono">
                        <Phone className="w-4 h-4 text-amber-400" />
                        <span>{player.phone}</span>
                      </div>
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
                        onClick={() => deletePlayer(player.id)}
                        title="Eliminar registo"
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Ações: mostra botões apenas se estiver pendente; caso contrário, exibe a mensagem de estado */}
                  {player.status === 'confirmado' ? (
                    <div className="pt-3 border-t border-zinc-800 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Inscrição confirmada • Mensagem enviada ao jogador</span>
                    </div>
                  ) : player.status === 'recusado' ? (
                    <div className="pt-3 border-t border-zinc-800 flex items-center gap-2 text-xs font-semibold text-red-400">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Inscrição recusada • Candidato notificado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
                      <button
                        onClick={() => handleDecision(player, 'confirmado')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold transition cursor-pointer border border-emerald-500/20"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirmar + WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleDecision(player, 'recusado')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold transition cursor-pointer border border-red-500/20"
                      >
                        <X className="w-4 h-4" />
                        <span>Recusar + WhatsApp</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Rodapé */}
      <footer className="border-t border-zinc-900 py-5 px-4 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Regressar à página de inscrição de lutadores</span>
        </Link>
      </footer>
    </div>
  );
}