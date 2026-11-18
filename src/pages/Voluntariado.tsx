import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Phone,
  CheckCircle2,
  Send,
  Flame,
  ShieldAlert,
  Trophy,
  Info,
  AlertCircle,
  Swords,
  Sparkles,
  Users,
  ShieldCheck,
} from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import DragonEmblem from '../components/DragonEmblem';
import {
  useRegistrationsCount,
  useCreateRegistration,
} from '../hooks/useRegistrations';

interface FormErrors {
  full_name?: string;
  phone?: string;
}

export default function Voluntariado() {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ full_name?: boolean; phone?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);

  // Hooks do React Query + Supabase
  const { data: registeredCount = 0 } = useRegistrationsCount();
  const createRegistration = useCreateRegistration();

  const validateFields = (nameValue: string, phoneValue: string): FormErrors => {
    const newErrors: FormErrors = {};

    const cleanName = nameValue.trim();
    if (!cleanName) {
      newErrors.full_name = 'O nome completo é obrigatório.';
    } else if (cleanName.length < 3) {
      newErrors.full_name = 'O nome deve ter pelo menos 3 caracteres.';
    }

    if (!phoneValue) {
      newErrors.phone = 'O número de telefone é obrigatório.';
    } else if (phoneValue.length !== 9) {
      newErrors.phone = `O número deve ter exatamente 9 dígitos (faltam ${
        9 - phoneValue.length
      }).`;
    } else if (!/^8[2-7]\d{7}$/.test(phoneValue)) {
      newErrors.phone =
        'Insere um número válido de Moçambique (ex: 84, 85, 86, 87, 82 ou 83).';
    }

    return newErrors;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, full_name: value }));

    if (touched.full_name) {
      setErrors(validateFields(value, formData.phone));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 9);
    setFormData((prev) => ({ ...prev, phone: digitsOnly }));

    if (touched.phone || digitsOnly.length === 9) {
      setErrors(validateFields(formData.full_name, digitsOnly));
    }
  };

  const handleBlur = (field: 'full_name' | 'phone') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateFields(formData.full_name, formData.phone));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ full_name: true, phone: true });
    const validationErrors = validateFields(formData.full_name, formData.phone);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    createRegistration.mutate(
      {
        full_name: formData.full_name,
        phone: formData.phone,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
      }
    );
  };

  const isNameValid = formData.full_name.trim().length >= 3;
  const isPhoneValid = /^8[2-7]\d{7}$/.test(formData.phone);
  const progressPercent = (isNameValid ? 50 : 0) + (isPhoneValid ? 50 : 0);

  if (createRegistration.isPending) {
    return <LoadingScreen message="A registar lutador na arena..." />;
  }

  if (submitted) {
    return (
      <div className="relative min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-amber-500/25 blur-3xl animate-pulse" />

        <div className="relative max-w-md w-full bg-zinc-900/90 backdrop-blur-md border border-amber-500/40 rounded-3xl p-8 text-center space-y-6 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <DragonEmblem className="w-20 h-20 min-w-[80px] min-h-[80px] relative z-10" />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-zinc-950 rounded-full p-1.5 shadow-lg z-20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest">
              Kombatente Registado
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white uppercase">
              Inscrição Confirmada!
            </h2>
          </div>

          <p className="text-zinc-300 text-sm leading-relaxed">
            Bem-vindo à arena,{' '}
            <span className="text-amber-400 font-bold">
              {formData.full_name.trim()}
            </span>
            ! O teu lugar no{' '}
            <span className="text-white font-semibold">
              Campeonato de Mortal Kombat
            </span>{' '}
            está reservado.
          </p>

          <div className="text-xs text-zinc-400 bg-zinc-950/90 p-4 rounded-2xl border border-zinc-800 space-y-1">
            <p>Contacto oficial registado:</p>
            <p className="text-base font-mono font-bold text-amber-400">
              +258 {formData.phone}
            </p>
            <p className="text-[11px] text-zinc-500 pt-1">
              Receberás a chave dos combates e horários via WhatsApp.
            </p>
          </div>

          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({ full_name: '', phone: '' });
              setErrors({});
              setTouched({});
              createRegistration.reset();
            }}
            className="w-full py-3.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition text-sm cursor-pointer border border-zinc-700"
          >
            Registar outro lutador
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col justify-between">
      {/* Camada Decorativa de Fundo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-gradient-to-b from-amber-500/25 via-orange-500/15 to-transparent blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] sm:h-[560px] sm:w-[560px] rounded-full bg-amber-500/15 blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />

        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #f59e0b 1px, transparent 1px), linear-gradient(to bottom, #f59e0b 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:left-auto md:right-[-80px] md:translate-x-0 opacity-[0.16] md:opacity-[0.18] drop-shadow-[0_0_45px_rgba(245,158,11,0.45)] animate-[spin_35s_linear_infinite]">
          <DragonEmblem className="w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] md:w-[520px] md:h-[520px]" />
        </div>

        <span className="absolute top-[18%] left-[10%] h-2.5 w-2.5 rounded-full bg-amber-400/80 shadow-[0_0_10px_#fbbf24] animate-ping" />
        <span className="absolute top-[65%] left-[18%] h-2 w-2 rounded-full bg-amber-500/80 shadow-[0_0_8px_#f59e0b] animate-bounce" />
        <span className="absolute top-[28%] right-[14%] h-2.5 w-2.5 rounded-full bg-yellow-400/80 shadow-[0_0_10px_#facc15] animate-ping" />
        <span className="absolute bottom-[20%] right-[22%] h-2 w-2 rounded-full bg-orange-400/80 shadow-[0_0_8px_#fb923c] animate-pulse" />
      </div>

      {/* Barra Superior de Status + Botão Área Admin */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <DragonEmblem className="w-7 h-7 min-w-[28px] min-h-[28px] shrink-0" />
            <span className="font-extrabold tracking-wider uppercase text-zinc-200">
              MK Arena <span className="text-amber-500">• UniTiva</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="hidden md:flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Inscrições Abertas</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>
                <strong className="text-white">{registeredCount}</strong> inscritos
              </span>
            </div>

            <Link
              to="/admin/voluntarios"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-amber-500 text-amber-400 hover:text-zinc-950 font-bold border border-amber-500/40 transition duration-200 shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Área Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10">
        {/* Cabeçalho Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-500/15 to-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-widest shadow-sm">
            <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>Torneio Oficial de Combate</span>
            <Swords className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-white uppercase">
            Campeonato de{' '}
            <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-red-500 bg-clip-text text-transparent">
              Mortal Kombat
            </span>
          </h1>

          <p className="text-zinc-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Bem-vindo à arena! Esta página é dedicada ao registo oficial dos
            competidores. Garante a tua vaga, prepara o teu melhor lutador e entra
            na disputa pelo título.
          </p>
        </div>

        {/* Grid Principal: Mensagens da Arena + Formulário */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Coluna Esquerda: Mensagens e Detalhes do Torneio */}
          <div className="lg:col-span-5 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Info className="w-4 h-4" />
                  <span>Briefing do Torneio</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  EDIÇÃO 2026
                </span>
              </div>

              <div className="group p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 hover:border-amber-500/40 transition duration-300 space-y-1.5">
                <p className="font-bold text-sm text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  Bem-vindo, Kombatente!
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Estás na página oficial de inscrição. Preenche os teus dados ao
                  lado para entrares na tabela de confrontos do campeonato.
                </p>
              </div>

              <div className="group p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 hover:border-red-500/40 transition duration-300 space-y-2">
                <p className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                  Regras da Arena
                </p>
                <ul className="text-xs text-zinc-400 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Combates 1v1 em formato eliminatório (Melhor de 3).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Vagas limitadas confirmadas por ordem de inscrição.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>
                      A convocatória e horários serão enviados pelo número
                      registado.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mensagem Dinâmica Interativa */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-red-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="leading-relaxed">
                {isNameValid && isPhoneValid ? (
                  <span>
                    Tudo pronto,{' '}
                    <strong className="text-amber-400">
                      {formData.full_name.trim()}
                    </strong>
                    ! Clica no botão ao lado para selar a tua entrada no torneio.
                  </span>
                ) : formData.full_name.trim().length > 0 ? (
                  <span>
                    Boa sorte na arena,{' '}
                    <strong className="text-amber-400">
                      {formData.full_name.trim()}
                    </strong>
                    ! Agora insere os 9 dígitos do teu telefone para concluir.
                  </span>
                ) : (
                  <span>
                    Escreve o teu nome completo no formulário para desbloqueares o
                    teu registo de lutador.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Formulário de Inscrição */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="lg:col-span-7 bg-zinc-900/85 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            {/* Barra de Progresso no topo do cartão */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-6">
              {/* Cabeçalho do Formulário */}
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    Ficha de Registo
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Preenche os 2 campos obrigatórios abaixo para participar.
                  </p>
                </div>

                <div className="relative flex items-center justify-center shrink-0">
                  <div className="absolute inset-0 rounded-full bg-amber-500/25 blur-md animate-pulse" />
                  <DragonEmblem className="relative z-10 w-11 h-11 min-w-[44px] min-h-[44px] drop-shadow-[0_0_12px_rgba(245,158,11,0.45)]" />
                </div>
              </div>

              {/* Alerta de Erro da API (ex: número duplicado ou sem internet) */}
              {createRegistration.isError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-xs text-red-300 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{createRegistration.error.message}</span>
                </div>
              )}

              <div className="space-y-5">
                {/* Campo Nome */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-200 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-amber-400" />
                      Nome Completo *
                    </span>
                    {isNameValid && (
                      <span className="text-xs text-emerald-400 font-medium">
                        ✓ Válido
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleNameChange}
                    onBlur={() => handleBlur('full_name')}
                    placeholder="Ex: Carlos Tembe"
                    className={`w-full rounded-xl bg-zinc-950/90 border px-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition duration-200 ${
                      errors.full_name
                        ? 'border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : isNameValid
                        ? 'border-emerald-500/50 focus:border-emerald-400'
                        : 'border-zinc-800 focus:border-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    }`}
                  />
                  {errors.full_name && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.full_name}</span>
                    </p>
                  )}
                </div>

                {/* Campo Telefone (9 dígitos) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-amber-400" />
                      Telefone / WhatsApp *
                    </label>
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                        isPhoneValid
                          ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                          : 'bg-zinc-950 text-zinc-500'
                      }`}
                    >
                      {formData.phone.length}/9 dígitos
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-amber-400 select-none border-r border-zinc-800 pr-2.5">
                      +258
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      name="phone"
                      maxLength={9}
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      onBlur={() => handleBlur('phone')}
                      placeholder="840000000"
                      className={`w-full rounded-xl bg-zinc-950/90 border pl-16 pr-4 py-3.5 text-sm text-white font-mono tracking-widest placeholder-zinc-600 focus:outline-none transition duration-200 ${
                        errors.phone
                          ? 'border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                          : isPhoneValid
                          ? 'border-emerald-500/50 focus:border-emerald-400'
                          : 'border-zinc-800 focus:border-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      }`}
                    />
                  </div>

                  {errors.phone && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Botão de Submissão */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={createRegistration.isPending}
                className={`group w-full flex items-center justify-center gap-2.5 font-black uppercase tracking-wider py-4 px-6 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 ${
                  isNameValid && isPhoneValid
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 hover:brightness-110 text-zinc-950 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                    : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/15'
                }`}
              >
                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                <span>Confirmar Registo no Campeonato</span>
              </button>

              <p className="text-[11px] text-center text-zinc-500">
                Ao confirmar, os teus dados ficam registados na lista oficial de
                participantes do torneio.
              </p>
            </div>
          </form>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="relative z-10 border-t border-zinc-900 py-4 text-center text-xs text-zinc-600">
        • Campeonato de Mortal Kombat •
      </footer>
    </div>
  );
}