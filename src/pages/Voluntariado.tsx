import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Clock,
  XCircle,
  GitFork,
  RefreshCw,
} from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import DragonEmblem from '../components/DragonEmblem';
import {
  useRegistrationsCount,
  useCreateRegistration,
} from '../hooks/useRegistrations';
import { supabase } from '../lib/supabase';
import type { RegistrationStatus } from '../types/volunteer';

const DEVICE_LOCK_KEY = 'mk_device_registered_candidate_v1';

interface DeviceRegistrationRecord {
  full_name: string;
  phone: string;
  status: RegistrationStatus;
  submitted_at: string;
}

interface FormErrors {
  full_name?: string;
  phone?: string;
}

function loadDeviceRegistration(): DeviceRegistrationRecord | null {
  try {
    const raw = localStorage.getItem(DEVICE_LOCK_KEY);
    return raw ? (JSON.parse(raw) as DeviceRegistrationRecord) : null;
  } catch {
    return null;
  }
}

export default function Voluntariado() {
  const navigate = useNavigate();

  const [deviceRecord, setDeviceRecord] =
    useState<DeviceRegistrationRecord | null>(() => loadDeviceRegistration());

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
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);

  // Hooks do React Query + Supabase
  const { data: registeredCount = 0 } = useRegistrationsCount();
  const createRegistration = useCreateRegistration();

  // Observa se o formulário já está visível no ecrã mobile
  useEffect(() => {
    if (deviceRecord) return;
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
  }, [deviceRecord]);

  // Verifica no Supabase o estado atual da inscrição deste dispositivo
  useEffect(() => {
    if (!deviceRecord) return;

    const cleanDigits = deviceRecord.phone.replace(/\D/g, '');
    const digits9 = cleanDigits.startsWith('258')
      ? cleanDigits.slice(3)
      : cleanDigits;
    const possiblePhones = [
      digits9,
      `+258 ${digits9}`,
      `+258${digits9}`,
      `258${digits9}`,
    ];

    let isMounted = true;

    const checkApprovalStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('mk_registrations')
          .select('id, status')
          .in('phone', possiblePhones)
          .limit(1);

        if (error || !isMounted) return;

        if (data && data.length > 0) {
          const serverStatus = (data[0].status || 'pendente') as RegistrationStatus;
          if (serverStatus !== deviceRecord.status) {
            const updated: DeviceRegistrationRecord = {
              ...deviceRecord,
              status: serverStatus,
            };
            setDeviceRecord(updated);
            localStorage.setItem(DEVICE_LOCK_KEY, JSON.stringify(updated));
          }
        }
      } catch {
        // Ignorar falhas temporárias de rede
      }
    };

    checkApprovalStatus();

    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        checkApprovalStatus();
      }
    }, 10000);

    const channel = supabase
      .channel(`candidate_status_${digits9}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'mk_registrations' },
        () => {
          checkApprovalStatus();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      window.clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [deviceRecord]);

  // Redireciona automaticamente para o mapa público quando for aceito
  useEffect(() => {
    if (deviceRecord?.status !== 'confirmado') return;

    setRedirectCountdown(3);
    const timer = window.setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev === null || prev <= 1) {
          window.clearInterval(timer);
          navigate('/mapa', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [deviceRecord?.status, navigate]);

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

    // Bloqueio extra caso este dispositivo já tenha submetido
    if (deviceRecord) return;

    setTouched({ full_name: true, phone: true });
    setDuplicatePhoneError(null);

    const validationErrors = validateFields(formData.full_name, formData.phone);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setCheckingPhone(true);

    try {
      // Verifica se o número já existe na base de dados (em qualquer formato)
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
          'Este número de telemóvel já está registado no campeonato. Não é permitido repetir inscrições.'
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

    createRegistration.mutate(
      {
        full_name: formData.full_name.trim(),
        phone: formData.phone,
      },
      {
        onSuccess: () => {
          const savedRecord: DeviceRegistrationRecord = {
            full_name: formData.full_name.trim(),
            phone: formData.phone,
            status: 'pendente',
            submitted_at: new Date().toISOString(),
          };
          localStorage.setItem(DEVICE_LOCK_KEY, JSON.stringify(savedRecord));
          setDeviceRecord(savedRecord);
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

  // Ecrã de conclusão e acompanhamento de estado (Bloqueia nova inscrição neste telemóvel)
  if (deviceRecord) {
    const isConfirmed = deviceRecord.status === 'confirmado';
    const isRejected = deviceRecord.status === 'recusado';

    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-amber-500/40 rounded-3xl p-7 text-center space-y-5">
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div
              className={`absolute inset-0 rounded-full border-2 ${
                isConfirmed
                  ? 'border-emerald-500/50'
                  : isRejected
                  ? 'border-red-500/50'
                  : 'border-amber-500/50'
              }`}
            />
            <DragonEmblem className="w-16 h-16 min-w-[64px] min-h-[64px]" />
            <div
              className={`absolute -bottom-1 -right-1 rounded-full p-1 text-zinc-950 ${
                isConfirmed
                  ? 'bg-emerald-500'
                  : isRejected
                  ? 'bg-red-500 text-white'
                  : 'bg-amber-500'
              }`}
            >
              {isConfirmed ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isRejected ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {isConfirmed ? (
              <>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                  Estado: Aceite / Confirmado
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                  Inscrição Aprovada!
                </h2>
              </>
            ) : isRejected ? (
              <>
                <span className="inline-block px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-widest">
                  Estado: Recusado
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                  Inscrição Não Aceite
                </h2>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Estado: Pendente</span>
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                  Candidatura Enviada!
                </h2>
              </>
            )}
          </div>

          <p className="text-zinc-300 text-sm leading-relaxed">
            {isConfirmed ? (
              <>
                Parabéns,{' '}
                <span className="text-amber-400 font-bold">
                  {deviceRecord.full_name}
                </span>
                ! O administrador aceitou a tua inscrição. A redirecionar para o
                mapa de combates
                {redirectCountdown !== null ? ` em ${redirectCountdown}s...` : '...'}
              </>
            ) : isRejected ? (
              <>
                Olá{' '}
                <span className="text-white font-bold">
                  {deviceRecord.full_name}
                </span>
                . Infelizmente a tua candidatura foi recusada pela organização
                nesta edição do torneio.
              </>
            ) : (
              <>
                Olá,{' '}
                <span className="text-amber-400 font-bold">
                  {deviceRecord.full_name}
                </span>
                ! A tua inscrição está{' '}
                <strong className="text-amber-300">pendente</strong> até o
                administrador aceitar ou recusar. Assim que for aceite, serás
                redirecionado automaticamente para o mapa do torneio.
              </>
            )}
          </p>

          <div className="text-xs text-zinc-400 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-1.5">
            <p>Número vinculado a este dispositivo:</p>
            <p className="text-base font-mono font-bold text-amber-400">
              +258 {deviceRecord.phone}
            </p>
            <p className="text-[11px] text-zinc-500 pt-1">
              Por segurança, cada dispositivo permite apenas uma inscrição oficial.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {isConfirmed ? (
              <Link
                to="/mapa"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black uppercase tracking-wider rounded-xl text-xs"
              >
                <GitFork className="w-4 h-4" />
                <span>Ver Mapa de Combates Agora</span>
              </Link>
            ) : (
              <Link
                to="/mapa"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs border border-zinc-700"
              >
                <GitFork className="w-4 h-4 text-amber-400" />
                <span>Visualizar Mapa do Torneio</span>
              </Link>
            )}

            {!isConfirmed && !isRejected && (
              <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
                <RefreshCw className="w-3 h-3 text-amber-400" />
                <span>A aguardar validação do administrador...</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
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
                    <span>Apenas 1 inscrição permitida por número e telemóvel.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>
                      Após aprovação do administrador, terás acesso direto ao
                      mapa de combates.
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
                Ao confirmar, este dispositivo ficará associado à tua inscrição
                oficial.
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