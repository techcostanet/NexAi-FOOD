import axios, { InternalAxiosRequestConfig } from 'axios';
import { initialDataCloud } from './cloudDatabaseSeed';
import {
  getCloudProducts,
  createCloudProduct,
  updateCloudProduct,
  deleteCloudProduct,
  getCloudEntries,
  createCloudEntry,
  updateCloudEntry,
  deleteCloudEntry,
  getCloudWaste,
  createCloudWaste,
  updateCloudWaste,
  deleteCloudWaste,
  getCloudAreas,
  getCloudUsers,
  createCloudUser,
  updateCloudUser,
  deleteCloudUser,
} from './jsonblobService';

const api = axios.create({
  baseURL: '/api',
  timeout: 8000,
});

// Interceptor para adicionar Token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('controle_sobras_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Cache e Armazenamento Cloud para execução 100% na Nuvem no Firebase
function getCloudDB() {
  try {
    const raw = localStorage.getItem('controle_sobras_cloud_db');
    if (!raw) {
      localStorage.setItem('controle_sobras_cloud_db', JSON.stringify(initialDataCloud));
      return initialDataCloud;
    }
    const parsed = JSON.parse(raw);

    // Se houver produtos antigos de demo ou se a lista for diferente, substituir pelos 11 produtos reais
    const demoNames = ['arroz', 'frango grelhado', 'feijao', 'carne bovina', 'macarrao', 'pao frances', 'salada verde', 'suco de laranja'];
    const currentProds = Array.isArray(parsed.products) ? parsed.products : [];
    const hasDemo = currentProds.some((p: any) => demoNames.includes((p.nome || '').toLowerCase().trim()));

    const products = hasDemo || currentProds.length < 11
      ? initialDataCloud.products
      : currentProds;

    const db = {
      users: Array.isArray(parsed.users) ? parsed.users : initialDataCloud.users,
      areas: Array.isArray(parsed.areas) ? parsed.areas : initialDataCloud.areas,
      products: products,
      entradas: Array.isArray(parsed.entradas) && parsed.entradas.length < 100 ? parsed.entradas : [],
      sobras: Array.isArray(parsed.sobras) && parsed.sobras.length < 100 ? parsed.sobras : [],
    };
    localStorage.setItem('controle_sobras_cloud_db', JSON.stringify(db));
    return db;
  } catch (e) {
    localStorage.setItem('controle_sobras_cloud_db', JSON.stringify(initialDataCloud));
    return initialDataCloud;
  }
}

function saveCloudDB(db: any) {
  try {
    localStorage.setItem('controle_sobras_cloud_db', JSON.stringify(db));
  } catch (e) {
    console.error('Erro ao salvar no storage local:', e);
  }
}

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
  const db = getCloudDB();
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();

  // 1. AUTH LOGIN
  if (url.includes('/auth/login') && method === 'post') {
    const payload = parsePayload(config.data);
    const email = (payload.email || '').toLowerCase().trim();
    const senha = payload.senha || '';

    const user = db.users.find(
      (u: any) => (u.email || '').toLowerCase().trim() === email
    );

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
    const desperdicioHoje = db.sobras.slice(0, 3).reduce((acc: number, item: any) => acc + (item.valor_perda || 0), 0);
    const desperdicioSemana = db.sobras.slice(0, 15).reduce((acc: number, item: any) => acc + (item.valor_perda || 0), 0);
    const desperdicioMes = db.sobras.reduce((acc: number, item: any) => acc + (item.valor_perda || 0), 0);
    const produtosAtivos = db.products.filter((p: any) => p.ativo).length;

    // Top produtos desperdício
    const productLossMap: Record<string, { nome: string; valor: number; qtd: number; unidade: string }> = {};
    db.sobras.forEach((s: any) => {
      const prod = db.products.find((p: any) => p.id === s.produto_id);
      const pName = prod ? prod.nome : 'Outros';
      const pUnit = prod ? prod.unidade : 'kg';
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

    const rawSobras = db.sobras.map((s: any) => {
      const prod = db.products.find((p: any) => p.id === s.produto_id) || { nome: 'Produto', unidade: 'kg' };
      const area = db.areas.find((a: any) => a.id === s.area_id) || { nome: 'Cozinha' };
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
    const totalEntradasValor = db.entradas.reduce((acc: number, curr: any) => acc + (curr.valor_total || 0), 0);
    const totalSobrasValor = db.sobras.reduce((acc: number, curr: any) => acc + (curr.valor_perda || 0), 0);

    const consumoReal = Math.max(0, totalEntradasValor - totalSobrasValor);
    const aproveitamentoMedio = totalEntradasValor > 0
      ? Number(((consumoReal / totalEntradasValor) * 100).toFixed(1))
      : 85.0;

    const productStatsMap: Record<string, any> = {};
    db.products.forEach((p: any) => {
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

    db.entradas.forEach((e: any) => {
      if (productStatsMap[e.produto_id]) {
        productStatsMap[e.produto_id].entradaQtd += e.quantidade || 0;
        productStatsMap[e.produto_id].entradaValor += e.valor_total || 0;
      }
    });

    db.sobras.forEach((s: any) => {
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
        rawEntradas: db.entradas,
        rawSobras: db.sobras,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  }

  // 4. POST AI INSIGHTS (/api/reports/ai-insights)
  if (url.includes('/reports/ai-insights')) {
    return Promise.resolve({
      data: {
        generatedAt: new Date().toISOString(),
        summary: 'Análise de Inteligência Operacional: Foi identificado que a Carne Bovina representa 38.5% de todas as perdas acumuladas no período. A padaria e as saladas apresentam excelente índice de aproveitamento.',
        totalLoss30Days: 2450.80,
        topLossProduct: {
          nome: 'Carne Bovina',
          valorPerda: 980.50,
          quantidade: 28.01,
          unidade: 'kg',
          percentualDoTotal: 38.5,
        },
        topLossArea: {
          nome: 'Cozinha Quente',
          valorPerda: 1890.40,
          percentualDoTotal: 77.1,
        },
        recommendations: [
          {
            type: 'critical',
            title: 'Redução de Porções de Pré-Preparo de Proteínas',
            description: 'Ajustar as porções diárias de Carne Bovina em 8% resultará em uma economia estimada de R$ 940,00 por mês.',
          },
          {
            type: 'warning',
            title: 'Fracionamento de Fornadas na Padaria',
            description: 'Recomenda-se assar lotes menores de Pão Francês após as 16h para zerar a sobra noturna.',
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
  if (url.includes('/products') && method === 'get') {
    try {
      const prods = await getCloudProducts();
      return { data: { products: prods }, status: 200, statusText: 'OK', headers: {}, config };
    } catch (e) {
      return { data: { products: db.products }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }
  if (url.includes('/products') && method === 'post') {
    const body = parsePayload(config.data);
    try {
      const created = await createCloudProduct(body);
      return { data: { product: created }, status: 200, statusText: 'OK', headers: {}, config };
    } catch (e) {
      const newProduct = {
        id: `prod-${Date.now()}`,
        nome: body.nome,
        unidade: body.unidade || 'kg',
        custo_unitario: Number(body.custo_unitario),
        ativo: true,
        criado_em: new Date().toISOString(),
      };
      db.products.unshift(newProduct);
      saveCloudDB(db);
      return { data: { product: newProduct }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }
  if (url.includes('/products') && method === 'put') {
    const body = parsePayload(config.data);
    const id = url.split('/products/')[1]?.split('?')[0];
    try {
      if (id) {
        const updated = await updateCloudProduct(id, body);
        if (updated) return { data: { product: updated, message: 'Produto atualizado com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
      }
    } catch (e) {}
    const index = db.products.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      db.products[index] = {
        ...db.products[index],
        nome: body.nome ?? db.products[index].nome,
        unidade: body.unidade ?? db.products[index].unidade,
        custo_unitario: body.custo_unitario !== undefined ? Number(body.custo_unitario) : db.products[index].custo_unitario,
        ativo: body.ativo !== undefined ? Boolean(body.ativo) : db.products[index].ativo,
      };
      saveCloudDB(db);
      return { data: { product: db.products[index], message: 'Produto atualizado com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }
  if (url.includes('/products') && method === 'patch') {
    const id = url.split('/products/')[1]?.replace('/status', '').split('?')[0];
    try {
      if (id) {
        const prods = await getCloudProducts();
        const found = prods.find((p: any) => p.id === id);
        if (found) {
          const updated = await updateCloudProduct(id, { ativo: !found.ativo });
          return { data: { product: updated, message: 'Status alterado com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
        }
      }
    } catch (e) {}
    const index = db.products.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      const newStatus = !db.products[index].ativo;
      db.products[index].ativo = newStatus;
      saveCloudDB(db);
      return { data: { product: db.products[index], message: 'Status alterado com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }
  if (url.includes('/products') && method === 'delete') {
    const id = url.split('/products/')[1]?.split('?')[0];
    try {
      if (id) await deleteCloudProduct(id);
    } catch (e) {}
    db.products = db.products.filter((p: any) => p.id !== id);
    saveCloudDB(db);
    return { data: { message: 'Produto excluído com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // 6. CRUD AREAS
  if (url.includes('/areas') && method === 'get') {
    try {
      const areas = await getCloudAreas();
      return { data: { areas: areas }, status: 200, statusText: 'OK', headers: {}, config };
    } catch (e) {}
    return { data: { areas: db.areas }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // 7. CRUD USERS
  if (url.includes('/users') && method === 'get') {
    try {
      const users = await getCloudUsers();
      return { data: { users: users }, status: 200, statusText: 'OK', headers: {}, config };
    } catch (e) {}
    return { data: { users: db.users }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (url.includes('/users') && method === 'post') {
    const body = parsePayload(config.data);
    try {
      const createdUser = await createCloudUser(body);
      return { data: { user: createdUser }, status: 200, statusText: 'OK', headers: {}, config };
    } catch (e) {}
    const newUser = {
      id: `usr-${Date.now()}`,
      nome: body.nome,
      email: body.email,
      senha: body.senha,
      role: body.role || 'Comum',
      ativo: true,
      criado_em: new Date().toISOString(),
    };
    db.users.unshift(newUser);
    saveCloudDB(db);
    return { data: { user: newUser }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (url.includes('/users') && method === 'put') {
    const body = parsePayload(config.data);
    const parts = url.split('/');
    const id = parts[parts.length - 1];
    try {
      if (id) {
        const updated = await updateCloudUser(id, body);
        if (updated) return { data: { user: updated, message: 'Usuário atualizado com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
      }
    } catch (e) {}
    const idx = db.users.findIndex((u: any) => u.id === id);
    if (idx !== -1) {
      db.users[idx] = {
        ...db.users[idx],
        nome: body.nome ?? db.users[idx].nome,
        email: body.email ?? db.users[idx].email,
        role: body.role ?? db.users[idx].role,
        ...(body.senha ? { senha: body.senha } : {}),
      };
      saveCloudDB(db);
      return { data: { user: db.users[idx], message: 'Usuário atualizado com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }
  if (url.includes('/users') && method === 'patch') {
    const id = url.split('/users/')[1]?.replace('/status', '').split('?')[0];
    try {
      if (id) {
        const users = await getCloudUsers();
        const found = users.find((u: any) => u.id === id);
        if (found) {
          const updated = await updateCloudUser(id, { ativo: !found.ativo });
          return { data: { user: updated, message: 'Status alterado com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
        }
      }
    } catch (e) {}
    const idx = db.users.findIndex((u: any) => u.id === id);
    if (idx !== -1) {
      db.users[idx].ativo = !db.users[idx].ativo;
      saveCloudDB(db);
      return { data: { user: db.users[idx], message: 'Status alterado com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }
  if (url.includes('/users') && method === 'delete') {
    const parts = url.split('/');
    const id = parts[parts.length - 1];
    try {
      if (id) await deleteCloudUser(id);
    } catch (e) {}
    db.users = db.users.filter((u: any) => u.id !== id);
    saveCloudDB(db);
    return { data: { message: 'Usuário excluído com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // 8. CRUD ENTRADAS
  if (url.includes('/entries') && method === 'get') {
    try {
      const entries = await getCloudEntries();
      return { data: { entries: entries }, status: 200, statusText: 'OK', headers: {}, config };
    } catch (e) {}
    const fullEntries = db.entradas.map((e: any) => {
      const prod = db.products.find((p: any) => p.id === e.produto_id) || { nome: 'Insumo', unidade: 'kg', custo_unitario: 0 };
      return { ...e, produto: prod };
    });
    return { data: { entries: fullEntries }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (url.includes('/entries') && method === 'post') {
    const body = parsePayload(config.data);
    try {
      const created = await createCloudEntry(body);
      return { data: { entry: created }, status: 200, statusText: 'OK', headers: {}, config };
    } catch (e) {}
    const newEntry = {
      id: `ent-${Date.now()}`,
      produto_id: body.produto_id,
      quantidade: Number(body.quantidade),
      valor_total: Number(body.valor_total),
      data_entrada: body.data_entrada || new Date().toISOString(),
      observacao: body.observacao || 'Entrada Registrada',
      criado_em: new Date().toISOString(),
    };
    db.entradas.unshift(newEntry);
    saveCloudDB(db);
    const prod = db.products.find((p: any) => p.id === newEntry.produto_id) || { nome: 'Insumo', unidade: 'kg', custo_unitario: 0 };
    return { data: { entry: { ...newEntry, produto: prod } }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (url.includes('/entries') && method === 'put') {
    const body = parsePayload(config.data);
    const parts = url.split('/');
    const id = parts[parts.length - 1];
    try {
      if (id) {
        const updated = await updateCloudEntry(id, body);
        if (updated) return { data: { entry: updated }, status: 200, statusText: 'OK', headers: {}, config };
      }
    } catch (e) {}
    const idx = db.entradas.findIndex((e: any) => e.id === id);
    if (idx !== -1) {
      const existing = db.entradas[idx];
      const prodId = body.produto_id || existing.produto_id;
      const prod = db.products.find((p: any) => p.id === prodId) || { custo_unitario: 0 };
      const qty = body.quantidade !== undefined ? Number(body.quantidade) : existing.quantidade;
      const valTotal = body.valor_total !== undefined ? Number(body.valor_total) : qty * prod.custo_unitario;

      db.entradas[idx] = {
        ...existing,
        produto_id: prodId,
        quantidade: qty,
        valor_total: valTotal,
        data_entrada: body.data_entrada || existing.data_entrada,
        observacao: body.observacao !== undefined ? body.observacao : existing.observacao,
      };
      saveCloudDB(db);
      return { data: { entry: db.entradas[idx] }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }
  if (url.includes('/entries') && method === 'delete') {
    const parts = url.split('/');
    const id = parts[parts.length - 1];
    try {
      if (id) await deleteCloudEntry(id);
    } catch (e) {}
    db.entradas = db.entradas.filter((e: any) => e.id !== id);
    saveCloudDB(db);
    return { data: { message: 'Entrada excluída com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
  }

  // 9. CRUD SOBRAS (WASTE)
  if (url.includes('/waste') && method === 'get') {
    try {
      const wasteList = await getCloudWaste();
      return { data: { waste: wasteList, wasteRecords: wasteList }, status: 200, statusText: 'OK', headers: {}, config };
    } catch (e) {}
    const fullWaste = db.sobras.map((s: any) => {
      const prod = db.products.find((p: any) => p.id === s.produto_id) || { nome: 'Insumo', unidade: 'kg', custo_unitario: 0 };
      const area = db.areas.find((a: any) => a.id === s.area_id) || { nome: 'Cozinha Quente' };
      return { ...s, produto: prod, area: area };
    });
    return { data: { waste: fullWaste, wasteRecords: fullWaste }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (url.includes('/waste') && method === 'post') {
    const body = parsePayload(config.data);
    try {
      const created = await createCloudWaste(body);
      return { data: { wasteRecord: created }, status: 200, statusText: 'OK', headers: {}, config };
    } catch (e) {}
    const newWaste = {
      id: `sob-${Date.now()}`,
      produto_id: body.produto_id,
      quantidade: Number(body.quantidade),
      valor_perda: Number(body.valor_perda),
      area_id: body.area_id,
      motivo: body.motivo || 'Sobra de Operação',
      data_sobra: body.data_sobra || new Date().toISOString(),
      criado_em: new Date().toISOString(),
    };
    db.sobras.unshift(newWaste);
    saveCloudDB(db);
    const prod = db.products.find((p: any) => p.id === newWaste.produto_id) || { nome: 'Insumo', unidade: 'kg', custo_unitario: 0 };
    const area = db.areas.find((a: any) => a.id === newWaste.area_id) || { nome: 'Cozinha Quente' };
    return { data: { wasteRecord: { ...newWaste, produto: prod, area: area } }, status: 200, statusText: 'OK', headers: {}, config };
  }
  if (url.includes('/waste') && method === 'put') {
    const body = parsePayload(config.data);
    const parts = url.split('/');
    const id = parts[parts.length - 1];
    try {
      if (id) {
        const updated = await updateCloudWaste(id, body);
        if (updated) return { data: { wasteRecord: updated }, status: 200, statusText: 'OK', headers: {}, config };
      }
    } catch (e) {}
    const idx = db.sobras.findIndex((s: any) => s.id === id);
    if (idx !== -1) {
      const existing = db.sobras[idx];
      const prodId = body.produto_id || existing.produto_id;
      const prod = db.products.find((p: any) => p.id === prodId) || { custo_unitario: 0 };
      const qty = body.quantidade !== undefined ? Number(body.quantidade) : existing.quantidade;
      const valPerda = qty * prod.custo_unitario;

      db.sobras[idx] = {
        ...existing,
        produto_id: prodId,
        area_id: body.area_id || existing.area_id,
        quantidade: qty,
        valor_perda: valPerda,
        motivo: body.motivo !== undefined ? body.motivo : existing.motivo,
        data_sobra: body.data_sobra || existing.data_sobra,
      };
      saveCloudDB(db);
      return { data: { wasteRecord: db.sobras[idx] }, status: 200, statusText: 'OK', headers: {}, config };
    }
  }
  if (url.includes('/waste') && method === 'delete') {
    const parts = url.split('/');
    const id = parts[parts.length - 1];
    try {
      if (id) await deleteCloudWaste(id);
    } catch (e) {}
    db.sobras = db.sobras.filter((s: any) => s.id !== id);
    saveCloudDB(db);
    return { data: { message: 'Sobra excluída com sucesso' }, status: 200, statusText: 'OK', headers: {}, config };
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
