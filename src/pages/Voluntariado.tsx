import { useState, useEffect, useRef } from 'react';
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
  ArrowDown,
  GitFork,
  UserPlus,
} from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import DragonEmblem from '../components/DragonEmblem';
import {
  useRegistrationsCount,
  useCreateRegistration,
} from '../hooks/useRegistrations';
import { supabase } from '../lib/supabase';

interface LastSubmittedCandidate {
  full_name: string;
  phone: string;
}

interface FormErrors {
  full_name?: string;
  phone?: string;
}

export default function Voluntariado() {
  const [lastSubmitted, setLastSubmitted] =
    useState<LastSubmittedCandidate | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ full_name?: boolean; phone?: boolean }>({});
  const [duplicatePhoneError, setDuplicatePhoneError] = useState<string | null>(
    null
  );
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(true);

  const formRef = useRef<HTMLFormElement | null>(null);

  // Hooks do React Query + Supabase
  const { data: registeredCount = 0 } = useRegistrationsCount();
  const createRegistration = useCreateRegistration();

  // Observa se o formulário já está visível no ecrã mobile
  useEffect(() => {
    const formEl = formRef.current;
    if (!formEl || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowScrollButton(!entry.isIntersecting);
      },
      { threshold: 0.25 }
    );

    observer.observe(formEl);
    return () => observer.disconnect();
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
    if (duplicatePhoneError) setDuplicatePhoneError(null);

    if (touched.phone || digitsOnly.length === 9) {
      setErrors(validateFields(formData.full_name, digitsOnly));
    }
  };

  const handleBlur = (field: 'full_name' | 'phone') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateFields(formData.full_name, formData.phone));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ full_name: true, phone: true });
    setDuplicatePhoneError(null);

    const validationErrors = validateFields(formData.full_name, formData.phone);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setCheckingPhone(true);

    try {
      // Verifica na base de dados se este número já foi registado alguma vez
      const phoneVariants = [
        formData.phone,
        `+258 ${formData.phone}`,
        `+258${formData.phone}`,
        `258${formData.phone}`,
      ];

      const { data: existingRows, error: checkError } = await supabase
        .from('mk_registrations')
        .select('id')
        .in('phone', phoneVariants)
        .limit(1);

      if (checkError) {
        setDuplicatePhoneError(
          'Não foi possível validar o número agora. Verifica a tua ligação à internet.'
        );
        setCheckingPhone(false);
        return;
      }

      if (existingRows && existingRows.length > 0) {
        setDuplicatePhoneError(
          'Este número de telemóvel já está registado na base de dados. Insere um número diferente.'
        );
        setCheckingPhone(false);
        return;
      }
    } catch {
      setDuplicatePhoneError('Erro de ligação ao verificar disponibilidade do número.');
      setCheckingPhone(false);
      return;
    }

    setCheckingPhone(false);

    const submittedName = formData.full_name.trim();
    const submittedPhone = formData.phone;

    createRegistration.mutate(
      {
        full_name: submittedName,
        phone: submittedPhone,
      },
      {
        onSuccess: () => {
          setLastSubmitted({
            full_name: submittedName,
            phone: submittedPhone,
          });
          setFormData({ full_name: '', phone: '' });
          setTouched({});
          setErrors({});
          setDuplicatePhoneError(null);
        },
        onError: (err: any) => {
          const msg = String(err?.message || '').toLowerCase();
          if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('23505')) {
            setDuplicatePhoneError(
              'A base de dados recusou o registo: este número já foi usado. Apenas 1 número diferente por candidato.'
            );
          }
        },
      }
    );
  };

  const isNameValid = formData.full_name.trim().length >= 3;
  const isPhoneValid = /^8[2-7]\d{7}$/.test(formData.phone);
  const progressPercent = (isNameValid ? 50 : 0) + (isPhoneValid ? 50 : 0);

  if (createRegistration.isPending || checkingPhone) {
    return <LoadingScreen message="A registar lutador na arena..." />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between">
      {/* Barra Superior */}
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <DragonEmblem className="w-7 h-7 min-w-[28px] min-h-[28px] shrink-0" />
            <span className="font-extrabold tracking-wider uppercase text-zinc-200">
              MK Arena <span className="text-amber-500">• UniTiva</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Inscrições Abertas</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>
                <strong className="text-white">{registeredCount}</strong> inscritos
              </span>
            </div>

            <Link
              to="/mapa"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold border border-zinc-700"
            >
              <GitFork className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Mapa</span>
            </Link>

            <Link
              to="/admin/login"
              onClick={() => {
                sessionStorage.removeItem('mk_tournament_admin_authenticated');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-amber-500 text-amber-400 hover:text-zinc-950 font-bold border border-amber-500/40"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Área Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-7 sm:py-10 space-y-7 sm:space-y-9">
        {/* Cabeçalho Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-widest">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>Torneio Oficial de Combate</span>
            <Swords className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Campeonato de{' '}
            <span className="text-amber-400">Mortal Kombat</span>
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
          <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between space-y-5 card-lite">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Info className="w-4 h-4" />
                  <span>Briefing do Torneio</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  EDIÇÃO 2026
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <p className="font-bold text-sm text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Bem-vindo, Kombatente!
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Estás na página oficial de inscrição. Preenche os teus dados ao
                  lado para entrares na tabela de confrontos do campeonato.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <p className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  Regras da Arena
                </p>
                <ul className="text-xs text-zinc-400 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Combates 1v1 em formato eliminatório (Melhor de 3).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>
                      Cada número de telemóvel só pode ser registado uma única vez
                      na base de dados.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>
                      Após aprovação do administrador, o lutador entra no mapa de
                      combates.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mensagem Dinâmica Interativa */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
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
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden scroll-mt-4 card-lite"
          >
            {/* Barra de Progresso no topo do cartão */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
              <div
                className="h-full bg-amber-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-5">
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

                <DragonEmblem className="w-10 h-10 min-w-[40px] min-h-[40px] shrink-0" />
              </div>

              {/* Banner de Confirmação após registo bem-sucedido (mantém o formulário acessível) */}
              {lastSubmitted && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-200 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-emerald-300 text-sm">
                          Inscrição de {lastSubmitted.full_name} enviada com sucesso!
                        </p>
                        <p className="text-emerald-200/80">
                          Número registado:{' '}
                          <span className="font-mono font-bold text-white">
                            +258 {lastSubmitted.phone}
                          </span>{' '}
                          (Estado: Pendente). Podes acompanhar no mapa ou inscrever
                          outro participante usando um número diferente.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Link
                      to="/mapa"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-[11px] uppercase tracking-wider"
                    >
                      <GitFork className="w-3.5 h-3.5" />
                      <span>Ver Mapa do Torneio</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setLastSubmitted(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-[11px] border border-zinc-700 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Fechar aviso</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Alerta de Número Duplicado ou Erro da API */}
              {(duplicatePhoneError || createRegistration.isError) && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-xs text-red-300 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    {duplicatePhoneError || createRegistration.error?.message}
                  </span>
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
                    placeholder="Ex: Teu Nome"
                    className={`w-full rounded-xl bg-zinc-950 border px-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none ${
                      errors.full_name
                        ? 'border-red-500'
                        : isNameValid
                        ? 'border-emerald-500/60 focus:border-emerald-400'
                        : 'border-zinc-800 focus:border-amber-500'
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
                      className={`w-full rounded-xl bg-zinc-950 border pl-16 pr-4 py-3.5 text-sm text-white font-mono tracking-widest placeholder-zinc-600 focus:outline-none ${
                        errors.phone || duplicatePhoneError
                          ? 'border-red-500'
                          : isPhoneValid
                          ? 'border-emerald-500/60 focus:border-emerald-400'
                          : 'border-zinc-800 focus:border-amber-500'
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
                disabled={createRegistration.isPending || checkingPhone}
                className="w-full flex items-center justify-center gap-2.5 font-black uppercase tracking-wider py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Confirmar Registo no Campeonato</span>
              </button>

              <p className="text-[11px] text-center text-zinc-500">
                Cada número de telemóvel só pode ser registado uma única vez.
              </p>
            </div>
          </form>
        </div>
      </main>

      {/* Botão flutuante apenas na versão mobile para ir direto ao formulário */}
      {showScrollButton && (
        <button
          type="button"
          onClick={scrollToForm}
          aria-label="Ir para o formulário de inscrição"
          className="lg:hidden fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-amber-500 active:bg-amber-400 text-zinc-950 font-black uppercase tracking-wider text-xs border border-amber-300 cursor-pointer"
        >
          <span>Inscrever-se</span>
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Rodapé */}
      <footer className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-600">
        Campeonato de Mortal Kombat • UniTiva
      </footer>
    </div>
  );
}