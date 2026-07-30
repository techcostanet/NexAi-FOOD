import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../services/api';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ message: string; devResetLink?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccessInfo({
        message: res.data.message,
        devResetLink: res.data.devResetLink,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para o Login</span>
          </button>

          <h2 className="text-xl font-bold text-stone-900">Recuperação de Senha</h2>
          <p className="text-xs text-stone-500 mt-1 mb-6">
            Informe seu e-mail cadastrado. Enviaremos um link seguro para você redefinir sua senha via Resend.
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successInfo ? (
            <div className="p-4 rounded-xl bg-[#f0f4e8] border border-[#d4e1c5] text-stone-800 space-y-3">
              <div className="flex items-center gap-2 text-[#3d4e21] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-[#556b2f]" />
                <span>Solicitação Enviada!</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">{successInfo.message}</p>

              {successInfo.devResetLink && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-[#d4e1c5] text-xs">
                  <p className="font-bold text-[#556b2f] mb-1">🔗 Link gerado no ambiente local (Mock Dev):</p>
                  <a
                    href={successInfo.devResetLink}
                    className="text-[#6b8e23] underline break-all font-mono text-[11px]"
                  >
                    {successInfo.devResetLink}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail Cadastrado</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#556b2f] hover:bg-[#415224] text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow disabled:opacity-50"
              >
                {loading ? (
                  <span>Enviando e-mail...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Link de Recuperação</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
