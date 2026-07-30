import React, { useState } from 'react';
import { Lock, CheckCircle2, ShieldAlert, KeyRound } from 'lucide-react';
import api from '../services/api';

interface ResetPasswordProps {
  token: string;
  onSuccess: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onSuccess }) => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (novaSenha !== confirmarSenha) {
      setError('As senhas digitadas não coincidem');
      return;
    }

    if (novaSenha.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', { token, novaSenha });
      setSuccessMessage(res.data.message);
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao redefinir senha. O token pode ser inválido ou ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#f0f4e8] text-[#556b2f] mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-stone-900">Nova Senha de Acesso</h2>
            <p className="text-xs text-stone-500 mt-1">Crie uma senha forte para proteger seu acesso ao sistema.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage ? (
            <div className="p-4 rounded-xl bg-[#f0f4e8] border border-[#d4e1c5] text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#556b2f] mx-auto" />
              <p className="font-bold text-sm text-[#3d4e21]">{successMessage}</p>
              <p className="text-xs text-stone-600">Redirecionando para a tela de login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nova Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Digite novamente a nova senha"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#556b2f] hover:bg-[#415224] text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-sm disabled:opacity-50 mt-2"
              >
                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
