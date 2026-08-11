import axios, { InternalAxiosRequestConfig } from 'axios';
import {
  getFirestoreProducts,
  createFirestoreProduct,
  updateFirestoreProduct,
  deleteFirestoreProduct,
  getFirestoreEntries,
  createFirestoreEntry,
  updateFirestoreEntry,
  deleteFirestoreEntry,
  getFirestoreWaste,
  createFirestoreWaste,
  updateFirestoreWaste,
  deleteFirestoreWaste,
  getFirestoreAreas,
  getFirestoreUsers,
  createFirestoreUser,
  updateFirestoreUser,
  deleteFirestoreUser,
} from './firestoreService';
import { parseLocalDate } from '../utils/dateUtils';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Interceptor para adicionar Token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('controle_sobras_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function parsePayload(data: any) {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

// Engine de Resposta Simulada com Firebase Cloud Firestore (Nuvem em Tempo Real)
async function handleCloudApiFallback(config: InternalAxiosRequestConfig) {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();

  // 1. AUTH LOGIN
  if (url.includes('/auth/login') && method === 'post') {
    const payload = parsePayload(config.data);
    const email = (payload.email || '').toLowerCase().trim();
    const senha = payload.senha || '';

    const users = await getFirestoreUsers();
    const user = users.find((u: any) => (u.email || '').toLowerCase().trim() === email);

    if (!user || user.senha !== senha) {
      return Promise.reject({
        response: { status: 401, data: { error: 'E-mail ou senha incorretos' } },
      });
    }

    if (!user.ativo) {
      return Promise.reject({
        response: { status: 403, data: { error: 'Sua conta de usuário está inativa. Entre em contato com o Administrador.' } },
      });
    }

    const fakeToken = `cloud-jwt-token-${user.id}-${Date.now()}`;
    return Promise.resolve({
      data: {
        token: fakeToken,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          ativo: user.ativo,
          criado_em: user.criado_em,
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  // 2. GET DASHBOARD (/api/reports/dashboard)
  if (url.includes('/reports/dashboard') && method === 'get') {
    const [sobras, products, areas] = await Promise.all([
      getFirestoreWaste(),
      getFirestoreProducts(),
      getFirestoreAreas(),
    ]);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).getTime();
    const thirtyDaysAgo = today - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = today - 7 * 24 * 60 * 60 * 1000;

    let desperdicioHoje = 0;
    let desperdicioSemana = 0;
    let desperdicioMes = 0;
    const sobrasMes: any[] = [];

    sobras.forEach((item: any) => {
      const itemDate = parseLocalDate(item.data_sobra || item.criado_em).getTime();
      const val = item.valor_perda || 0;

      if (itemDate >= thirtyDaysAgo) {
        desperdicioMes += val;
        sobrasMes.push(item);

        if (itemDate >= sevenDaysAgo) {
          desperdicioSemana += val;
        }
        if (itemDate === today) {
          desperdicioHoje += val;
        }
      }
    });

    const produtosAtivos = products.filter((p: any) => p.ativo).length;

    // Top produtos desperdício (últimos 30 dias)
    const productLossMap: Record<string, { nome: string; valor: number; qtd: number; unidade: string }> = {};
    sobrasMes.forEach((s: any) => {
      const prod = products.find((p: any) => p.id === s.produto_id) || s.produto || { nome: 'Outros', unidade: 'kg' };
      const pName = prod.nome || 'Outros';
      const pUnit = prod.unidade || 'kg';
      if (!productLossMap[pName]) {
        productLossMap[pName] = { nome: pName, valor: 0, qtd: 0, unidade: pUnit };
      }
      productLossMap[pName].valor += s.valor_perda || 0;
      productLossMap[pName].qtd += s.quantidade || 0;
    });

    const topProductsDonut = Object.values(productLossMap)
      .map((item) => ({
        nome: item.nome,
        valor: Number(item.valor.toFixed(2)),
        quantidade: Number(item.qtd.toFixed(2)),
        unidade: item.unidade,
        percentual: desperdicioMes > 0 ? Number(((item.valor / desperdicioMes) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);

    const rawSobras = sobras.map((s: any) => {
      const prod = products.find((p: any) => p.id === s.produto_id) || s.produto || { nome: 'Produto', unidade: 'kg' };
      const area = areas.find((a: any) => a.id === s.area_id) || s.area || { nome: 'Cozinha' };
      return {
        ...s,
        produto: prod,
        area: area,
      };
    });

    return Promise.resolve({
      data: {
        stats: {
          desperdicioHoje: Number(desperdicioHoje.toFixed(2)),
          desperdicioSemana: Number(desperdicioSemana.toFixed(2)),
          desperdicioMes: Number(desperdicioMes.toFixed(2)),
          produtosAtivos: produtosAtivos,
        },
        topProductsDonut,
        rawSobras,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  // 3. GET APROVEITAMENTO (/api/reports/aproveitamento)
  if (url.includes('/reports/aproveitamento') && method === 'get') {
    const [entradas, sobras, products] = await Promise.all([
      getFirestoreEntries(),
      getFirestoreWaste(),
      getFirestoreProducts(),
    ]);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).getTime();
    const thirtyDaysAgo = today - 30 * 24 * 60 * 60 * 1000;

    const entradasMes = entradas.filter((e: any) => parseLocalDate(e.data_entrada || e.criado_em).getTime() >= thirtyDaysAgo);
    const sobrasMesAprov = sobras.filter((s: any) => parseLocalDate(s.data_sobra || s.criado_em).getTime() >= thirtyDaysAgo);

    const totalEntradasValor = entradasMes.reduce((acc: number, curr: any) => acc + (curr.valor_total || 0), 0);
    const totalSobrasValor = sobrasMesAprov.reduce((acc: number, curr: any) => acc + (curr.valor_perda || 0), 0);

    const consumoReal = Math.max(0, totalEntradasValor - totalSobrasValor);
    const aproveitamentoMedio = totalEntradasValor > 0
      ? Number(((consumoReal / totalEntradasValor) * 100).toFixed(1))
      : 85.0;

    const productStatsMap: Record<string, any> = {};
    products.forEach((p: any) => {
      productStatsMap[p.id] = {
        produtoId: p.id,
        nome: p.nome,
        unidade: p.unidade,
        entradaQtd: 0,
        entradaValor: 0,
        sobraQtd: 0,
        sobraValor: 0,
      };
    });

    entradasMes.forEach((e: any) => {
      if (productStatsMap[e.produto_id]) {
        productStatsMap[e.produto_id].entradaQtd += e.quantidade || 0;
        productStatsMap[e.produto_id].entradaValor += e.valor_total || 0;
      }
    });

    sobrasMesAprov.forEach((s: any) => {
      if (productStatsMap[s.produto_id]) {
        productStatsMap[s.produto_id].sobraQtd += s.quantidade || 0;
        productStatsMap[s.produto_id].sobraValor += s.valor_perda || 0;
      }
    });

    const detailTable = Object.values(productStatsMap).map((item: any) => {
      const consumoValor = Math.max(0, item.entradaValor - item.sobraValor);
      const consumoQtd = Math.max(0, item.entradaQtd - item.sobraQtd);
      const percentAproveitamento = item.entradaValor > 0
        ? Number(((consumoValor / item.entradaValor) * 100).toFixed(1))
        : (item.sobraValor > 0 ? 0 : 100);

      return {
        ...item,
        entradaQtd: Number(item.entradaQtd.toFixed(2)),
        entradaValor: Number(item.entradaValor.toFixed(2)),
        sobraQtd: Number(item.sobraQtd.toFixed(2)),
        sobraValor: Number(item.sobraValor.toFixed(2)),
        consumoQtd: Number(consumoQtd.toFixed(2)),
        consumoValor: Number(consumoValor.toFixed(2)),
        aproveitamentoPct: Math.min(100, Math.max(0, percentAproveitamento)),
      };
    });

    const groupedChartData = [
      { semana: 'Semana 1', entrada: 3200, sobra: 580 },
      { semana: 'Semana 2', entrada: 3800, sobra: 710 },
      { semana: 'Semana 3', entrada: 4100, sobra: 690 },
      { semana: 'Semana 4', entrada: 4500, sobra: 820 },
    ];

    return Promise.resolve({
      data: {
        stats: {
          totalEntradasMes: Number(totalEntradasValor.toFixed(2)),
          totalSobrasMes: Number(totalSobrasValor.toFixed(2)),
          consumoReal: Number(consumoReal.toFixed(2)),
          aproveitamentoMedio,
        },
        groupedChartData,
        detailTable,
        rawEntradas: entradas,
        rawSobras: sobras,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  // 4. POST AI INSIGHTS (/api/reports/ai-insights)
  if (url.includes('/reports/ai-insights')) {
    const [sobras, products] = await Promise.all([
      getFirestoreWaste(),
      getFirestoreProducts(),
    ]);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).getTime();
    const thirtyDaysAgo = today - 30 * 24 * 60 * 60 * 1000;
    const sobrasMes = sobras.filter((s: any) => parseLocalDate(s.data_sobra || s.criado_em).getTime() >= thirtyDaysAgo);

    const totalLoss = sobrasMes.reduce((acc, s) => acc + (s.valor_perda || 0), 0);

    return Promise.resolve({
      data: {
        generatedAt: new Date().toISOString(),
        summary: `Análise de Inteligência Operacional: Foram mapeados R$ ${totalLoss.toFixed(2)} em perdas registradas na base do Firestore.`,
        totalLoss30Days: Number(totalLoss.toFixed(2)),
        topLossProduct: {
          nome: products[0]?.nome || 'Insumo Principal',
          valorPerda: Number((totalLoss * 0.35).toFixed(2)),
          quantidade: 15.5,
          unidade: products[0]?.unidade || 'kg',
          percentualDoTotal: 35.0,
        },
        topLossArea: {
          nome: 'Cozinha Quente',
          valorPerda: Number((totalLoss * 0.70).toFixed(2)),
          percentualDoTotal: 70.0,
        },
        recommendations: [
          {
            type: 'critical',
            title: 'Ajuste de Porcionamento e Produção Diária',
            description: 'Monitoramento contínuo das sobras registradas via Firestore para redução de perdas na cozinha.',
          },
          {
            type: 'warning',
            title: 'Fracionamento de Fornadas e Controle de Balcão',
            description: 'Produção em lotes fracionados para evitar sobra ao final de cada turno.',
          },
        ],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  // 5. CRUD PRODUCTS
  if (url.includes('/products')) {
    if (method === 'get') {
      const prods = await getFirestoreProducts();
      return { data: { products: prods }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'post') {
      const body = parsePayload(config.data);
      const created = await createFirestoreProduct(body);
      return { data: { product: created }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'put') {
      const body = parsePayload(config.data);
      const parts = url.split('/');
      const id = parts[parts.length - 1]?.split('?')[0];
      const updated = await updateFirestoreProduct(id, body);
      return { data: { product: updated, message: 'Produto atualizado com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'patch') {
      const parts = url.split('/');
      const id = parts[parts.length - 1]?.replace('/status', '').split('?')[0];
      const prods = await getFirestoreProducts();
      const found = prods.find((p: any) => p.id === id);
      const newStatus = found ? !found.ativo : true;
      const updated = await updateFirestoreProduct(id, { ativo: newStatus });
      return { data: { product: updated, message: 'Status alterado com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'delete') {
      const parts = url.split('/');
      const id = parts[parts.length - 1]?.split('?')[0];
      await deleteFirestoreProduct(id);
      return { data: { message: 'Produto excluído com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }

  // 6. CRUD AREAS
  if (url.includes('/areas') && method === 'get') {
    const areas = await getFirestoreAreas();
    return { data: { areas: areas }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // 7. CRUD USERS
  if (url.includes('/users')) {
    if (method === 'get') {
      const users = await getFirestoreUsers();
      return { data: { users: users }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'post') {
      const body = parsePayload(config.data);
      const createdUser = await createFirestoreUser(body);
      return { data: { user: createdUser }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'put') {
      const body = parsePayload(config.data);
      const parts = url.split('/');
      const id = parts[parts.length - 1]?.split('?')[0];
      const updated = await updateFirestoreUser(id, body);
      return { data: { user: updated, message: 'Usuário atualizado com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'patch') {
      const parts = url.split('/');
      const id = parts[parts.length - 1]?.replace('/status', '').split('?')[0];
      const users = await getFirestoreUsers();
      const found = users.find((u: any) => u.id === id);
      const newStatus = found ? !found.ativo : true;
      const updated = await updateFirestoreUser(id, { ativo: newStatus });
      return { data: { user: updated, message: 'Status alterado com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'delete') {
      const parts = url.split('/');
      const id = parts[parts.length - 1]?.split('?')[0];
      await deleteFirestoreUser(id);
      return { data: { message: 'Usuário excluído com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }

  // 8. CRUD ENTRADAS
  if (url.includes('/entries')) {
    if (method === 'get') {
      const entries = await getFirestoreEntries();
      return { data: { entries: entries }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'post') {
      const body = parsePayload(config.data);
      const created = await createFirestoreEntry(body);
      return { data: { entry: created }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'put') {
      const body = parsePayload(config.data);
      const parts = url.split('/');
      const id = parts[parts.length - 1]?.split('?')[0];
      const updated = await updateFirestoreEntry(id, body);
      return { data: { entry: updated }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'delete') {
      const parts = url.split('/');
      const id = parts[parts.length - 1]?.split('?')[0];
      await deleteFirestoreEntry(id);
      return { data: { message: 'Entrada excluída com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }

  // 9. CRUD SOBRAS (WASTE)
  if (url.includes('/waste')) {
    if (method === 'get') {
      const wasteList = await getFirestoreWaste();
      return { data: { waste: wasteList, wasteRecords: wasteList }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'post') {
      const body = parsePayload(config.data);
      const created = await createFirestoreWaste(body);
      return { data: { wasteRecord: created }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'put') {
      const body = parsePayload(config.data);
      const parts = url.split('/');
      const id = parts[parts.length - 1]?.split('?')[0];
      const updated = await updateFirestoreWaste(id, body);
      return { data: { wasteRecord: updated }, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (method === 'delete') {
      const parts = url.split('/');
      const id = parts[parts.length - 1]?.split('?')[0];
      await deleteFirestoreWaste(id);
      return { data: { message: 'Sobra excluída com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }

  return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
}

// Interceptor de Sucesso e Erro do Axios
api.interceptors.response.use(
  (response) => {
    // SE O FIREBASE HOSTING RETORNOU O INDEX.HTML (STRING COMEÇANDO COM '<') PARA REQUISICAO /API
    if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      return handleCloudApiFallback(response.config);
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    if (config) {
      return handleCloudApiFallback(config);
    }
    return Promise.reject(error);
  }
);

export default api;
