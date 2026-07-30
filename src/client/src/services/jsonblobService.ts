import axios from 'axios';
import { initialDataCloud } from './cloudDatabaseSeed';

// URL do Banco de Dados em Nuvem em Tempo Real (Zero Config / Sincronização entre Todos os Navegadores)
const CLOUD_BLOB_ID = '019fb303-32e8-75ac-9872-702ac9082826';
const CLOUD_URL = `https://jsonblob.com/api/jsonBlob/${CLOUD_BLOB_ID}`;

export interface CloudDBState {
  users: any[];
  areas: any[];
  products: any[];
  entradas: any[];
  sobras: any[];
}

// Buscar o estado atual do banco na Nuvem
export async function fetchCloudState(): Promise<CloudDBState> {
  try {
    const res = await axios.get(CLOUD_URL, {
      headers: { Accept: 'application/json' },
      timeout: 5000,
    });
    if (res.data && Array.isArray(res.data.products) && res.data.products.length > 0) {
      // Salvar em cache local para agilizar navegação offline
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('controle_sobras_cloud_db', JSON.stringify(res.data));
      }
      return res.data;
    }
  } catch (e) {
    console.warn('Erro ao buscar banco da Nuvem, usando inicial/cache:', e);
  }

  // Fallback se a nuvem estiver vazia ou indisponível
  const initial = {
    users: initialDataCloud.users,
    areas: initialDataCloud.areas,
    products: initialDataCloud.products,
    entradas: [],
    sobras: [],
  };
  await updateCloudState(initial);
  return initial;
}

// Atualizar o banco na Nuvem em tempo real (Sincroniza instantaneamente com Chrome, Edge, Celular)
export async function updateCloudState(newState: CloudDBState): Promise<CloudDBState> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('controle_sobras_cloud_db', JSON.stringify(newState));
    }
    await axios.put(CLOUD_URL, newState, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 5000,
    });
  } catch (e) {
    console.error('Erro ao sincronizar com a Nuvem:', e);
  }
  return newState;
}

// 1. PRODUTOS
export async function getCloudProducts() {
  const state = await fetchCloudState();
  return state.products || [];
}

export async function createCloudProduct(prodData: any) {
  const state = await fetchCloudState();
  const newProd = {
    id: `prod-${Date.now()}`,
    nome: prodData.nome,
    unidade: prodData.unidade || 'un',
    custo_unitario: Number(prodData.custo_unitario),
    ativo: prodData.ativo !== undefined ? Boolean(prodData.ativo) : true,
    criado_em: new Date().toISOString(),
  };
  state.products.unshift(newProd);
  await updateCloudState(state);
  return newProd;
}

export async function updateCloudProduct(id: string, prodData: any) {
  const state = await fetchCloudState();
  const index = state.products.findIndex((p: any) => p.id === id);
  if (index !== -1) {
    state.products[index] = {
      ...state.products[index],
      nome: prodData.nome ?? state.products[index].nome,
      unidade: prodData.unidade ?? state.products[index].unidade,
      custo_unitario: prodData.custo_unitario !== undefined ? Number(prodData.custo_unitario) : state.products[index].custo_unitario,
      ativo: prodData.ativo !== undefined ? Boolean(prodData.ativo) : state.products[index].ativo,
    };
    await updateCloudState(state);
    return state.products[index];
  }
  return null;
}

export async function deleteCloudProduct(id: string) {
  const state = await fetchCloudState();
  state.products = state.products.filter((p: any) => p.id !== id);
  await updateCloudState(state);
}

// 2. ENTRADAS
export async function getCloudEntries() {
  const state = await fetchCloudState();
  return (state.entradas || []).map((e: any) => {
    const prod = state.products.find((p: any) => p.id === e.produto_id) || { nome: 'Insumo', unidade: 'un', custo_unitario: 0 };
    return { ...e, produto: prod };
  });
}

export async function createCloudEntry(entryData: any) {
  const state = await fetchCloudState();
  const prod = state.products.find((p: any) => p.id === entryData.produto_id) || { custo_unitario: 0 };
  const qty = Number(entryData.quantidade);
  const valTotal = entryData.valor_total !== undefined ? Number(entryData.valor_total) : qty * prod.custo_unitario;

  const newEntry = {
    id: `ent-${Date.now()}`,
    produto_id: entryData.produto_id,
    quantidade: qty,
    valor_total: valTotal,
    data_entrada: entryData.data_entrada || new Date().toISOString(),
    observacao: entryData.observacao || 'Entrada Registrada',
    criado_em: new Date().toISOString(),
  };

  state.entradas.unshift(newEntry);
  await updateCloudState(state);
  return { ...newEntry, produto: prod };
}

export async function updateCloudEntry(id: string, entryData: any) {
  const state = await fetchCloudState();
  const index = state.entradas.findIndex((e: any) => e.id === id);
  if (index !== -1) {
    const existing = state.entradas[index];
    const prodId = entryData.produto_id || existing.produto_id;
    const prod = state.products.find((p: any) => p.id === prodId) || { custo_unitario: 0 };
    const qty = entryData.quantidade !== undefined ? Number(entryData.quantidade) : existing.quantidade;
    const valTotal = entryData.valor_total !== undefined ? Number(entryData.valor_total) : qty * prod.custo_unitario;

    state.entradas[index] = {
      ...existing,
      produto_id: prodId,
      quantidade: qty,
      valor_total: valTotal,
      data_entrada: entryData.data_entrada || existing.data_entrada,
      observacao: entryData.observacao !== undefined ? entryData.observacao : existing.observacao,
    };
    await updateCloudState(state);
    return { ...state.entradas[index], produto: prod };
  }
  return null;
}

export async function deleteCloudEntry(id: string) {
  const state = await fetchCloudState();
  state.entradas = state.entradas.filter((e: any) => e.id !== id);
  await updateCloudState(state);
}

// 3. SOBRAS (WASTE)
export async function getCloudWaste() {
  const state = await fetchCloudState();
  return (state.sobras || []).map((s: any) => {
    const prod = state.products.find((p: any) => p.id === s.produto_id) || { nome: 'Insumo', unidade: 'un', custo_unitario: 0 };
    const area = state.areas.find((a: any) => a.id === s.area_id) || { nome: 'Cozinha' };
    return { ...s, produto: prod, area: area };
  });
}

export async function createCloudWaste(wasteData: any) {
  const state = await fetchCloudState();
  const prod = state.products.find((p: any) => p.id === wasteData.produto_id) || { custo_unitario: 0 };
  const area = state.areas.find((a: any) => a.id === wasteData.area_id) || { nome: 'Cozinha' };
  const qty = Number(wasteData.quantidade);
  const valPerda = qty * prod.custo_unitario;

  const newWaste = {
    id: `sob-${Date.now()}`,
    produto_id: wasteData.produto_id,
    area_id: wasteData.area_id,
    quantidade: qty,
    valor_perda: valPerda,
    motivo: wasteData.motivo || 'Sobra de Operação',
    data_sobra: wasteData.data_sobra || new Date().toISOString(),
    criado_em: new Date().toISOString(),
  };

  state.sobras.unshift(newWaste);
  await updateCloudState(state);
  return { ...newWaste, produto: prod, area: area };
}

export async function updateCloudWaste(id: string, wasteData: any) {
  const state = await fetchCloudState();
  const index = state.sobras.findIndex((s: any) => s.id === id);
  if (index !== -1) {
    const existing = state.sobras[index];
    const prodId = wasteData.produto_id || existing.produto_id;
    const prod = state.products.find((p: any) => p.id === prodId) || { custo_unitario: 0 };
    const areaId = wasteData.area_id || existing.area_id;
    const area = state.areas.find((a: any) => a.id === areaId) || { nome: 'Cozinha' };

    const qty = wasteData.quantidade !== undefined ? Number(wasteData.quantidade) : existing.quantidade;
    const valPerda = qty * prod.custo_unitario;

    state.sobras[index] = {
      ...existing,
      produto_id: prodId,
      area_id: areaId,
      quantidade: qty,
      valor_perda: valPerda,
      motivo: wasteData.motivo !== undefined ? wasteData.motivo : existing.motivo,
      data_sobra: wasteData.data_sobra || existing.data_sobra,
    };
    await updateCloudState(state);
    return { ...state.sobras[index], produto: prod, area: area };
  }
  return null;
}

export async function deleteCloudWaste(id: string) {
  const state = await fetchCloudState();
  state.sobras = state.sobras.filter((s: any) => s.id !== id);
  await updateCloudState(state);
}

// 4. ÁREAS
export async function getCloudAreas() {
  const state = await fetchCloudState();
  return state.areas || [];
}

// 5. USUÁRIOS
export async function getCloudUsers() {
  const state = await fetchCloudState();
  return state.users || [];
}

export async function createCloudUser(userData: any) {
  const state = await fetchCloudState();
  const newUser = {
    id: `usr-${Date.now()}`,
    nome: userData.nome,
    email: userData.email,
    senha: userData.senha,
    role: userData.role || 'Comum',
    ativo: true,
    criado_em: new Date().toISOString(),
  };
  state.users.unshift(newUser);
  await updateCloudState(state);
  return newUser;
}

export async function updateCloudUser(id: string, userData: any) {
  const state = await fetchCloudState();
  const index = state.users.findIndex((u: any) => u.id === id);
  if (index !== -1) {
    const existing = state.users[index];
    state.users[index] = {
      ...existing,
      nome: userData.nome ?? existing.nome,
      email: userData.email ?? existing.email,
      role: userData.role ?? existing.role,
      ativo: userData.ativo !== undefined ? Boolean(userData.ativo) : existing.ativo,
      ...(userData.senha ? { senha: userData.senha } : {}),
    };
    await updateCloudState(state);
    return state.users[index];
  }
  return null;
}

export async function deleteCloudUser(id: string) {
  const state = await fetchCloudState();
  state.users = state.users.filter((u: any) => u.id !== id);
  await updateCloudState(state);
}
