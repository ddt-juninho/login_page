import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  Lock,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  LogIn,
} from 'lucide-react';
import DragonEmblem from '../../components/DragonEmblem';
import {
  grantAdminSession,
  revokeAdminSession,
} from '../../components/ProtectedAdminRoute';

const ADMIN_CREDENTIALS_STORAGE_KEY = 'mk_tournament_admin_credentials_v1';
const DEFAULT_ADMIN_EMAIL = 'Snyy';
const DEFAULT_ADMIN_CODE = 'esumanjo';

function getStoredAdminCredentials(): { email: string; password: string } {
  try {
    const raw = localStorage.getItem(ADMIN_CREDENTIALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email && parsed?.password) {
        return parsed;
      }
    }
  } catch {
    // Fallback para as credenciais padrão
  }

  const defaults = { email: DEFAULT_ADMIN_EMAIL, password: DEFAULT_ADMIN_CODE };
  try {
    localStorage.setItem(
      ADMIN_CREDENTIALS_STORAGE_KEY,
      JSON.stringify(defaults)
    );
  } catch {
    // Ignorar se storage estiver indisponível
  }
  return defaults;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo =
    (location.state as { from?: string } | null)?.from || '/admin/voluntarios';

  // Garante que qualquer sessão antiga está limpa e que as credenciais padrão existem localmente
  useEffect(() => {
    revokeAdminSession();
    getStoredAdminCredentials();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const stored = getStoredAdminCredentials();

    if (
      emailInput.trim() === stored.email &&
      codeInput === stored.password
    ) {
      grantAdminSession();
      navigate(redirectTo, { replace: true });
    } else {
      setError('Email ou código incorreto. Confirma os dados do administrador.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-zinc-950 border border-amber-500/30 flex items-center justify-center">
            <DragonEmblem className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              Confirmação Obrigatória
            </span>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              Área do Administrador
            </h1>
            <p className="text-xs text-zinc-400">
              Insere o teu email e o código de acesso para entrar no painel.
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Email / Utilizador
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-amber-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Insere o email do admin"
                autoComplete="off"
                required
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Código de Acesso
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Insere o código"
                autoComplete="new-password"
                required
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 pl-10 pr-11 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black uppercase tracking-wider text-xs cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Confirmar e Entrar</span>
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-800 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-amber-400"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar à página de inscrição</span>
          </Link>
        </div>
      </div>
    </div>
  );
}