import React, { useState } from 'react';
import { Leaf, Lock, Mail, ArrowRight, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { User } from '../types';
import { CURRENT_VERSION, DEVELOPER_BRAND } from '../data/versions';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
  onNavigateToForgotPassword: () => void;
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onNavigateToForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, senha });
      onLoginSuccess(res.data.user, res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#556b2f] text-white shadow-md mb-3">
            <Leaf className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Controle de Sobras</h1>
            <span className="text-[11px] font-bold text-[#3d4e21] bg-[#f0f4e8] border border-[#d4e1c5] px-2 py-0.5 rounded-full">
              v{CURRENT_VERSION}
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-1">SaaS de Gestão de Estoque, Desperdício e Aproveitamento</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-stone-900">Acesse sua conta</h2>
            <p className="text-xs text-stone-500 mt-0.5">Informe seu e-mail e senha cadastrados para entrar.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@restaurante.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">Senha de Acesso</label>
                <button
                  type="button"
                  onClick={onNavigateToForgotPassword}
                  className="text-xs font-semibold text-[#556b2f] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#556b2f] hover:bg-[#415224] text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Global Footer com Versão Automática */}
        <p className="text-center text-xs text-stone-400 mt-6 font-medium">
          Desenvolvido por {DEVELOPER_BRAND} © 2026 - v{CURRENT_VERSION}
        </p>
      </div>
    </div>
  );
};
