import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { Product } from '../types';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';

export const Produtos: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('kg');
  const [custoUnitario, setCustoUnitario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const handleSync = () => fetchProducts();
    window.addEventListener('firestore:sync', handleSync);
    return () => window.removeEventListener('firestore:sync', handleSync);
  }, []);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setNome('');
    setUnidade('kg');
    setCustoUnitario('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setNome(p.nome);
    setUnidade(p.unidade);
    setCustoUnitario(p.custo_unitario.toString());
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const costNum = parseFloat(custoUnitario);
    if (!nome.trim() || !unidade || isNaN(costNum) || costNum < 0) {
      setError('Preencha um nome, unidade e custo unitário válido (>= 0)');
      return;
    }

    setSubmitting(true);

    try {
      if (editingProduct) {
        // Update
        await api.put(`/products/${editingProduct.id}`, {
          nome,
          unidade,
          custo_unitario: costNum,
        });
        setSuccess('Produto atualizado com sucesso!');
      } else {
        // Create
        await api.post('/products', {
          nome,
          unidade,
          custo_unitario: costNum,
        });
        setSuccess('Novo produto cadastrado!');
      }

      setIsModalOpen(false);
      fetchProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar produto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/products/${id}/status`);
      fetchProducts();
    } catch (err) {
      console.error('Erro ao alternar status:', err);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Deseja realmente excluir o produto "${nome}"?`)) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao excluir produto');
      }
    }
  };

  const filteredProducts = products.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produto por nome..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f] focus:border-transparent transition-all"
          />
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-[#556b2f] hover:bg-[#415224] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
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
                <th className="py-3.5 px-6">Nome do Insumo</th>
                <th className="py-3.5 px-4">Unidade</th>
                <th className="py-3.5 px-4">Custo Unitário (R$)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Criado em</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Carregando catálogo de produtos...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-stone-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#f0f4e8] text-[#556b2f] flex items-center justify-center font-bold text-xs shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <span>{p.nome}</span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-stone-600">
                      <span className="bg-stone-100 px-2 py-0.5 rounded text-[11px] uppercase">
                        {p.unidade}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      R$ {p.custo_unitario.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.ativo ? (
                        <Badge variant="olive">Ativo</Badge>
                      ) : (
                        <Badge variant="terracotta">Inativo</Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-stone-400">
                      {new Date(p.criado_em).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(p.id)}
                          title={p.ativo ? 'Desativar Produto' : 'Ativar Produto'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            p.ativo
                              ? 'text-stone-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-stone-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(p)}
                          title="Editar Produto"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-[#556b2f] hover:bg-[#f0f4e8] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(p.id, p.nome)}
                          title="Excluir Produto"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar Produto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
        subtitle="Informe os detalhes do insumo para cálculo automatizado de perdas."
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Nome do Insumo</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Tomate Italiano, Filé Mignon Bovino"
              className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Unidade de Medida</label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
              >
                <option value="kg">Quilograma (kg)</option>
                <option value="L">Litro (L)</option>
                <option value="un">Unidade (un)</option>
                <option value="g">Grama (g)</option>
                <option value="ml">Mililitro (ml)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Custo Unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={custoUnitario}
                onChange={(e) => setCustoUnitario(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
              />
            </div>
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
              {submitting ? 'Salvação...' : editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
