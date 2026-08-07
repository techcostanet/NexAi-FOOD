import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Search,
  Plus,
  ShieldAlert,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import api from '../services/api';
import { Sobra, Product, Area } from '../types';
import { Modal } from '../components/Modal';
import { formatDateBR, formatDateInput } from '../utils/dateUtils';

interface RegistrosSobrasProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export const RegistrosSobras: React.FC<RegistrosSobrasProps> = ({
  isModalOpen,
  setIsModalOpen,
}) => {
  const [wasteList, setWasteList] = useState<Sobra[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form & Edit State
  const [editingWaste, setEditingWaste] = useState<Sobra | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [valorPerdaEstimado, setValorPerdaEstimado] = useState(0);
  const [motivo, setMotivo] = useState('');
  const [dataSobra, setDataSobra] = useState(formatDateInput(new Date()));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resWaste, resProducts, resAreas] = await Promise.all([
        api.get('/waste'),
        api.get('/products?ativo=true'),
        api.get('/areas'),
      ]);
      // Tratar ambas as chaves de resposta possíveis (waste / wasteRecords)
      const list = resWaste.data.waste || resWaste.data.wasteRecords || [];
      setWasteList(list);
      setProducts(resProducts.data.products || []);
      setAreas(resAreas.data.areas || []);
    } catch (err) {
      console.error('Erro ao buscar registros de sobras:', err);
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
    setEditingWaste(null);
    setSelectedProductId('');
    setSelectedAreaId('');
    setQuantidade('');
    setValorPerdaEstimado(0);
    setMotivo('');
    setDataSobra(formatDateInput(new Date()));
    setError(null);
  };

  const handleOpenNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (waste: Sobra) => {
    setEditingWaste(waste);
    setSelectedProductId(waste.produto_id);
    setSelectedAreaId(waste.area_id);
    setQuantidade(String(waste.quantidade));
    setValorPerdaEstimado(waste.valor_perda || 0);
    setMotivo(waste.motivo || '');
    setDataSobra(formatDateInput(waste.data_sobra));
    setError(null);
    setIsModalOpen(true);
  };

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod && quantidade) {
      const qty = parseFloat(quantidade);
      if (!isNaN(qty)) {
        setValorPerdaEstimado(qty * prod.custo_unitario);
      }
    }
  };

  const handleQuantidadeChange = (val: string) => {
    setQuantidade(val);
    const qty = parseFloat(val);
    const prod = products.find((p) => p.id === selectedProductId);
    if (prod && !isNaN(qty)) {
      setValorPerdaEstimado(qty * prod.custo_unitario);
    } else {
      setValorPerdaEstimado(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qtyNum = parseFloat(quantidade);
    if (!selectedProductId || !selectedAreaId || isNaN(qtyNum) || qtyNum <= 0) {
      setError('Selecione o produto, a área da cozinha e informe uma quantidade válida');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        produto_id: selectedProductId,
        area_id: selectedAreaId,
        quantidade: qtyNum,
        motivo,
        data_sobra: dataSobra,
      };

      if (editingWaste) {
        await api.put(`/waste/${editingWaste.id}`, payload);
        setSuccess('Registro de sobra/desperdício atualizado com sucesso!');
      } else {
        await api.post('/waste', payload);
        setSuccess('Registro de desperdício/sobra salvo!');
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar registro de sobra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este registro de descarte/sobra?')) {
      try {
        await api.delete(`/waste/${id}`);
        setSuccess('Registro de descarte/sobra excluído com sucesso!');
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao remover sobra');
      }
    }
  };

  const filteredWaste = wasteList.filter(
    (w) =>
      w.produto?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.area?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.motivo && w.motivo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPerdaMes = wasteList.reduce((acc, curr) => acc + (curr.valor_perda || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-stone-900">Registros de Descartes e Perdas</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Exibindo <strong>{wasteList.length}</strong> registro(s) de sobras. Valor total acumulado:{' '}
            <strong className="text-terracotta-600">R$ {totalPerdaMes.toFixed(2)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por produto, área ou motivo..."
              className="pl-10 pr-4 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
            />
          </div>

          <button
            onClick={handleOpenNewModal}
            className="flex items-center justify-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Sobra</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#fff7ed] border border-[#fed7aa] text-xs font-bold text-[#9a3412] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#ea580c]" />
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
                <th className="py-3.5 px-4">Produto Descartado</th>
                <th className="py-3.5 px-4">Área da Cozinha</th>
                <th className="py-3.5 px-4">Quantidade</th>
                <th className="py-3.5 px-4">Perda Financeira (R$)</th>
                <th className="py-3.5 px-4">Motivo do Descarte</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    Carregando registros de sobras...
                  </td>
                </tr>
              ) : filteredWaste.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    Nenhum registro de sobra/desperdício encontrado.
                  </td>
                </tr>
              ) : (
                filteredWaste.map((w) => (
                  <tr key={w.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-stone-600">
                      {formatDateBR(w.data_sobra)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-stone-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#fff7ed] text-[#ea580c] flex items-center justify-center font-bold text-xs shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </div>
                      <span>{w.produto?.nome || 'Insumo'}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="bg-stone-100 text-stone-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                        {w.area?.nome || 'Cozinha'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-stone-700">
                      {w.quantidade} {w.produto?.unidade}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-terracotta-600">
                      R$ {w.valor_perda.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate">
                      {w.motivo || 'Não especificado'}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(w)}
                          title="Editar Sobra"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-[#ea580c] hover:bg-[#fff7ed] transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(w.id)}
                          title="Excluir Registro"
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

      {/* Modal Registrar/Editar Sobra */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWaste ? 'Editar Registro de Sobra' : 'Registrar Sobra / Desperdício'}
        subtitle={editingWaste ? 'Atualize as informações sobre o descarte.' : 'Informe os dados da perda para alimentar os relatórios operacionais.'}
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Insumo Descartado</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
            >
              <option value="">-- Escolha um produto do catálogo --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.unidade}) — Custo: R$ {p.custo_unitario.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Área da Cozinha</label>
              <select
                required
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
              >
                <option value="">-- Selecione a área --</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Quantidade Descartada</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={quantidade}
                onChange={(e) => handleQuantidadeChange(e.target.value)}
                placeholder="Ex: 2.5"
                className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
              />
            </div>
          </div>

          {valorPerdaEstimado > 0 && (
            <div className="p-3 rounded-xl bg-[#fff7ed] border border-[#fed7aa] text-xs text-[#9a3412] flex items-center justify-between font-bold">
              <span>Custo Total da Perda Calculado:</span>
              <span className="text-base text-[#ea580c]">
                R$ {valorPerdaEstimado.toFixed(2)}
              </span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Motivo do Descarte</label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
            >
              <option value="">-- Selecione o motivo principal --</option>
              <option value="Excesso de Produção">Excesso de Produção (Sobras de Travessa)</option>
              <option value="Validade Expirada">Validade Expirada / Vencimento</option>
              <option value="Erro de Pré-Preparo">Erro de Pré-Preparo / Aparas Excessivas</option>
              <option value="Sobras de Prato">Sobras de Prato (Devolução de Clientes)</option>
              <option value="Temperatura Inadequada">Falha em Equipamento / Pista Quente/Fria</option>
              <option value="Outros">Outros Motivos</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Data do Ocorrido</label>
            <input
              type="date"
              required
              value={dataSobra}
              onChange={(e) => setDataSobra(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
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
              className="px-5 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : editingWaste ? 'Atualizar Sobra' : 'Salvar Desperdício'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
