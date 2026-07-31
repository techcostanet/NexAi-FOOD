import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { User } from '../types';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';

export const Usuarios: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<'Admin' | 'Comum'>('Comum');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const handleSync = () => fetchUsers();
    window.addEventListener('firestore:sync', handleSync);
    return () => window.removeEventListener('firestore:sync', handleSync);
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setNome('');
    setEmail('');
    setSenha('');
    setRole('Comum');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    setNome(u.nome);
    setEmail(u.email);
    setSenha('');
    setRole(u.role);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim() || !email.trim()) {
      setError('Preencha o nome e o e-mail do usuário');
      return;
    }

    if (!editingUser && (!senha || senha.length < 6)) {
      setError('A senha inicial deve ter pelo menos 6 caracteres');
      return;
    }

    setSubmitting(true);

    try {
      if (editingUser) {
        // Update
        await api.put(`/users/${editingUser.id}`, {
          nome,
          email,
          role,
          ...(senha ? { senha } : {}),
        });
        setSuccess('Dados do usuário atualizados!');
      } else {
        // Create
        await api.post('/users', {
          nome,
          email,
          senha,
          role,
        });
        setSuccess('Novo usuário cadastrado com sucesso!');
      }

      setIsModalOpen(false);
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentAtivo: boolean) => {
    try {
      await api.patch(`/users/${id}/status`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao alterar acesso do usuário');
    }
  };

  const handleDelete = async (u: User) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${u.nome}"?`)) {
      try {
        await api.delete(`/users/${u.id}`);
        setSuccess(`Usuário "${u.nome}" excluído com sucesso!`);
        fetchUsers();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao excluir usuário');
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all"
          />
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-[#556b2f] hover:bg-[#415224] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#f0f4e8] border border-[#d4e1c5] text-xs font-bold text-[#3d4e21] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#556b2f]" />
          <span>{success}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Usuário</th>
                <th className="py-3.5 px-4">E-mail</th>
                <th className="py-3.5 px-4">Nível de Acesso (Role)</th>
                <th className="py-3.5 px-4">Status de Acesso</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    Carregando lista de usuários...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-stone-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#f0f4e8] text-[#556b2f] flex items-center justify-center font-bold text-xs shrink-0">
                        {u.nome.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.nome}</span>
                    </td>

                    <td className="py-3.5 px-4 text-stone-600 font-medium">{u.email}</td>

                    <td className="py-3.5 px-4">
                      {u.role === 'Admin' ? (
                        <Badge variant="olive">
                          <ShieldCheck className="w-3 h-3 mr-1 inline" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="gray">Operacional (Comum)</Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {/* Interactive Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={u.ativo}
                          onChange={() => handleToggleStatus(u.id, u.ativo)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#556b2f]"></div>
                        <span className="ml-2 text-xs font-semibold text-stone-600">
                          {u.ativo ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </label>
                    </td>

                    <td className="py-3.5 px-6 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        title="Editar Usuário"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-[#556b2f] hover:bg-[#f0f4e8] transition-colors inline-flex items-center justify-center"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        title="Excluir Usuário"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar Usuário */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        subtitle="Gerencie credenciais e nível de acesso ao sistema."
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Chef Carlos Alberto"
              className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">E-mail Corporativo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@restaurante.com"
              className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              {editingUser ? 'Nova Senha (deixe em branco se não desejar alterar)' : 'Senha Inicial'}
            </label>
            <input
              type="password"
              required={!editingUser}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Nível de Acesso (Role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'Admin' | 'Comum')}
              className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
            >
              <option value="Comum">Operacional (Comum)</option>
              <option value="Admin">Administrador (Total)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#556b2f] hover:bg-[#415224] text-white font-bold shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
