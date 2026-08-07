import React, { useState, useEffect } from 'react';
import {
  PackagePlus,
  Search,
  Trash2,
  Calendar,
  DollarSign,
  Package,
  ShieldAlert,
  CheckCircle2,
  Plus,
  Pencil,
} from 'lucide-react';
import api from '../services/api';
import { Entrada, Product } from '../types';
import { Modal } from '../components/Modal';
import { formatDateBR, formatDateInput } from '../utils/dateUtils';

interface EntradasProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export const Entradas: React.FC<EntradasProps> = ({ isModalOpen, setIsModalOpen }) => {
  const [entries, setEntries] = useState<Entrada[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form & Edit State
  const [editingEntry, setEditingEntry] = useState<Entrada | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [dataEntrada, setDataEntrada] = useState(formatDateInput(new Date()));
  const [observacao, setObservacao] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resEntries, resProducts] = await Promise.all([
        api.get('/entries'),
        api.get('/products?ativo=true'),
      ]);
      setEntries(resEntries.data.entries || []);
      setProducts(resProducts.data.products || []);
    } catch (err) {
      console.error('Erro ao buscar dados de entradas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleSync = () => fetchData();
    window.addEventListener('firestore:sync', handleSync);
    return () => window.removeEventListener('firestore:sync', handleSync);
  }, []);

  const resetForm = () => {
    setEditingEntry(null);
    setSelectedProductId('');
    setQuantidade('');
    setValorTotal('');
    setDataEntrada(formatDateInput(new Date()));
    setObservacao('');
    setError(null);
  };

  const handleOpenNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (entry: Entrada) => {
    setEditingEntry(entry);
    setSelectedProductId(entry.produto_id);
    setQuantidade(String(entry.quantidade));
    setValorTotal(entry.valor_total ? String(entry.valor_total.toFixed(2)) : '');
    setDataEntrada(formatDateInput(entry.data_entrada));
    setObservacao(entry.observacao || '');
    setError(null);
    setIsModalOpen(true);
  };

  // Quando seleciona um produto, autocalcula valor total estimado baseado no custo unitário
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod && quantidade) {
      const qty = parseFloat(quantidade);
      if (!isNaN(qty)) {
        setValorTotal((qty * prod.custo_unitario).toFixed(2));
      }
    }
  };

  const handleQuantidadeChange = (val: string) => {
    setQuantidade(val);
    const qty = parseFloat(val);
    const prod = products.find((p) => p.id === selectedProductId);
    if (prod && !isNaN(qty)) {
      setValorTotal((qty * prod.custo_unitario).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qtyNum = parseFloat(quantidade);
    if (!selectedProductId || isNaN(qtyNum) || qtyNum <= 0) {
      setError('Selecione o produto e informe uma quantidade maior que zero');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        produto_id: selectedProductId,
        quantidade: qtyNum,
        valor_total: valorTotal ? parseFloat(valorTotal) : undefined,
        data_entrada: dataEntrada,
        observacao,
      };

      if (editingEntry) {
        await api.put(`/entries/${editingEntry.id}`, payload);
        setSuccess('Entrada de insumo atualizada com sucesso!');
      } else {
        await api.post('/entries', payload);
        setSuccess('Entrada de insumo registrada com sucesso!');
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar entrada');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente remover este registro de entrada?')) {
      try {
        await api.delete(`/entries/${id}`);
        setSuccess('Registro de entrada excluído com sucesso!');
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao excluir entrada');
      }
    }
  };

  const filteredEntries = entries.filter((e) =>
    e.produto?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAcumuladoMes = entries.reduce((acc, curr) => acc + curr.valor_total, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-stone-900">Histórico de Entradas de Estoque</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Total acumulado registrado: <strong className="text-[#556b2f]">R$ {totalAcumuladoMes.toFixed(2)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por produto..."
              className="pl-10 pr-4 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
            />
          </div>

          <button
            onClick={handleOpenNewModal}
            className="flex items-center justify-center gap-2 bg-[#556b2f] hover:bg-[#415224] text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Entrada</span>
          </button>
        </div>
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
                <th className="py-3.5 px-6">Data</th>
                <th className="py-3.5 px-4">Produto / Insumo</th>
                <th className="py-3.5 px-4">Quantidade</th>
                <th className="py-3.5 px-4">Valor Total (R$)</th>
                <th className="py-3.5 px-4">Observação</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Carregando entradas...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Nenhuma entrada de estoque registrada.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-stone-600">
                      {formatDateBR(e.data_entrada)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-stone-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#f0f4e8] text-[#556b2f] flex items-center justify-center font-bold text-xs shrink-0">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <span>{e.produto?.nome || 'Insumo'}</span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-stone-700">
                      {e.quantidade} {e.produto?.unidade}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#556b2f]">
                      R$ {e.valor_total.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500 italic max-w-xs truncate">
                      {e.observacao || '—'}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(e)}
                          title="Editar Entrada"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-[#556b2f] hover:bg-[#f0f4e8] transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          title="Excluir Entrada"
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

      {/* Modal Registrar/Editar Entrada */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'Editar Entrada de Insumo' : 'Nova Entrada de Insumo'}
        subtitle={editingEntry ? 'Atualize as informações do registro de entrada.' : 'Adicione a compra ou reposição de mercadoria ao estoque.'}
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Selecionar Insumo</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
            >
              <option value="">-- Escolha um produto do catálogo --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.unidade}) — Custo Ref: R$ {p.custo_unitario.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Quantidade</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={quantidade}
                onChange={(e) => handleQuantidadeChange(e.target.value)}
                placeholder="Ex: 10.5"
                className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Valor Total (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                placeholder="Calculado automaticamente"
                className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Data da Entrada</label>
            <input
              type="date"
              required
              value={dataEntrada}
              onChange={(e) => setDataEntrada(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Observação / Nota Fiscal</label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Fornecedor Frigorífico X, NF #10294"
              className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
            />
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
              {submitting ? 'Salvando...' : editingEntry ? 'Atualizar Entrada' : 'Salvar Entrada'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
