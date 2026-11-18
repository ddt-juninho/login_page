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
import { ADMIN_AUTH_KEY } from '../../components/ProtectedAdminRoute';

const VALID_ADMIN_USER = 'Snyy';
const VALID_ADMIN_PASS = 'esumanjo';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo =
    (location.state as { from?: string } | null)?.from || '/admin/voluntarios';

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true') {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      emailOrUser.trim() === VALID_ADMIN_USER &&
      password === VALID_ADMIN_PASS
    ) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      navigate(redirectTo, { replace: true });
    } else {
      setError('Credenciais inválidas. Verifica o utilizador e a palavra-passe.');
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 overflow-hidden paint-contain">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.16) 0%, rgba(9, 9, 11, 0) 65%)',
        }}
      />

      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-zinc-950 border border-amber-500/30 flex items-center justify-center">
            <DragonEmblem className="w-11 h-11" />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              Acesso Restrito
            </span>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              Área do Administrador
            </h1>
            <p className="text-xs text-zinc-400">
              Confirma as tuas credenciais para gerir inscrições e o mapa do torneio.
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Email / Utilizador
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-amber-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={emailOrUser}
                onChange={(e) => {
                  setEmailOrUser(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Insere o utilizador"
                autoComplete="username"
                required
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors duration-150"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Palavra-passe
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 pl-10 pr-11 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors duration-150"
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
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-zinc-950 font-black uppercase tracking-wider text-xs transition-transform duration-150 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar no Painel</span>
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-800/80 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar à página de inscrição</span>
          </Link>
        </div>
      </div>
    </div>
  );
}