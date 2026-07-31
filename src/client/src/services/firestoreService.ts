import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { firestore } from './firebase';
import { initialDataCloud } from './cloudDatabaseSeed';

// Coleções no Firestore
const PRODUCTS_COL = 'products';
const ENTRIES_COL = 'entries';
const WASTE_COL = 'waste';
const USERS_COL = 'users';
const AREAS_COL = 'areas';

const CACHE_PREFIX = 'controle_sobras_fs_cache';

function getLocalCache(key: string, fallback: any) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalCache(key: string, data: any) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

// Inicializar banco Firestore em segundo plano se necessário (apenas se estiver vazio)
export async function seedFirestoreIfEmpty() {
    // Mantido vazio para evitar loops com onSnapshot. O seeding inicial foi feito.
}

// ---------------------------------------------------------
// REAL-TIME CACHE ENGINE
// ---------------------------------------------------------
const activeListeners: Record<string, boolean> = {};
const memoryCache: Record<string, any[]> = {};
const initPromises: Record<string, Promise<void>> = {};

async function ensureListener(
  colName: string, 
  cacheKey: string, 
  fallbackData: any[]
): Promise<any[]> {
  if (!activeListeners[colName]) {
    activeListeners[colName] = true;
    
    initPromises[colName] = new Promise<void>((resolve) => {
      let isResolved = false;
      
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          if (!memoryCache[colName]) {
            memoryCache[colName] = getLocalCache(cacheKey, fallbackData);
          }
          console.warn(`Timeout waiting for onSnapshot of ${colName}, using cache.`);
          resolve();
        }
      }, 3500); // 3.5 seconds timeout

      onSnapshot(collection(firestore, colName), (snap) => {
        const items: any[] = [];
        snap.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        memoryCache[colName] = items;
        setLocalCache(cacheKey, items);
        window.dispatchEvent(new CustomEvent('firestore:sync'));
        
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          resolve(); // Resolve on first load
        }
      }, (err) => {
        console.error(`Erro no onSnapshot de ${colName}:`, err);
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          if (!memoryCache[colName]) {
              memoryCache[colName] = getLocalCache(cacheKey, fallbackData);
          }
          resolve();
        }
      });
    });
  }

  await initPromises[colName];
  return memoryCache[colName] || getLocalCache(cacheKey, fallbackData);
}

// 1. PRODUTOS
export async function getFirestoreProducts(): Promise<any[]> {
  const products = await ensureListener(PRODUCTS_COL, 'products', initialDataCloud.products);
  return products.length > 0 ? products : initialDataCloud.products;
}

export async function createFirestoreProduct(productData: any) {
  const newId = `prod-${Date.now()}`;
  const prod = {
    id: newId,
    nome: productData.nome,
    unidade: productData.unidade || 'un',
    custo_unitario: Number(productData.custo_unitario || 0),
    ativo: productData.ativo !== undefined ? Boolean(productData.ativo) : true,
    criado_em: new Date().toISOString(),
  };

  await setDoc(doc(firestore, PRODUCTS_COL, newId), prod);
  return prod;
}

export async function updateFirestoreProduct(id: string, productData: any) {
  const dataToUpdate: any = {};
  if (productData.nome !== undefined) dataToUpdate.nome = productData.nome;
  if (productData.unidade !== undefined) dataToUpdate.unidade = productData.unidade;
  if (productData.custo_unitario !== undefined) dataToUpdate.custo_unitario = Number(productData.custo_unitario);
  if (productData.ativo !== undefined) dataToUpdate.ativo = Boolean(productData.ativo);

  await updateDoc(doc(firestore, PRODUCTS_COL, id), dataToUpdate);
  return { id, ...dataToUpdate };
}

export async function deleteFirestoreProduct(id: string) {
  await deleteDoc(doc(firestore, PRODUCTS_COL, id));
}

// 2. ENTRADAS
export async function getFirestoreEntries(): Promise<any[]> {
  const entries = await ensureListener(ENTRIES_COL, 'entries', []);
  const products = await getFirestoreProducts();

  const joined = entries.map((e: any) => {
    const prod = products.find((p) => p.id === e.produto_id) || { nome: 'Insumo', unidade: 'un', custo_unitario: 0 };
    return { ...e, produto: prod };
  });

  joined.sort((a, b) => new Date(b.data_entrada || b.criado_em).getTime() - new Date(a.data_entrada || a.criado_em).getTime());
  return joined;
}

export async function createFirestoreEntry(entryData: any) {
  const newId = `ent-${Date.now()}`;
  const products = await getFirestoreProducts();
  const prod = products.find((p) => p.id === entryData.produto_id) || { custo_unitario: 0 };
  const qty = Number(entryData.quantidade);
  const valorTotal = entryData.valor_total !== undefined ? Number(entryData.valor_total) : qty * (prod.custo_unitario || 0);

  const entry = {
    id: newId,
    produto_id: entryData.produto_id,
    quantidade: qty,
    valor_total: valorTotal,
    data_entrada: entryData.data_entrada || new Date().toISOString(),
    observacao: entryData.observacao || 'Entrada Registrada',
    criado_em: new Date().toISOString(),
  };

  await setDoc(doc(firestore, ENTRIES_COL, newId), entry);
  return { ...entry, produto: prod };
}

export async function updateFirestoreEntry(id: string, entryData: any) {
  const products = await getFirestoreProducts();
  const rawEntries = await ensureListener(ENTRIES_COL, 'entries', []);
  const existing = rawEntries.find((e: any) => e.id === id) || {};

  const prodId = entryData.produto_id || existing.produto_id;
  const prod = products.find((p) => p.id === prodId) || { custo_unitario: 0 };
  const qty = entryData.quantidade !== undefined ? Number(entryData.quantidade) : existing.quantidade;
  const valTotal = entryData.valor_total !== undefined ? Number(entryData.valor_total) : qty * (prod.custo_unitario || 0);

  const dataToUpdate = {
    produto_id: prodId,
    quantidade: qty,
    valor_total: valTotal,
    data_entrada: entryData.data_entrada || existing.data_entrada || new Date().toISOString(),
    observacao: entryData.observacao !== undefined ? entryData.observacao : existing.observacao,
  };

  await updateDoc(doc(firestore, ENTRIES_COL, id), dataToUpdate);
  return { id, ...existing, ...dataToUpdate, produto: prod };
}

export async function deleteFirestoreEntry(id: string) {
  await deleteDoc(doc(firestore, ENTRIES_COL, id));
}

// 3. SOBRAS (WASTE)
export async function getFirestoreWaste(): Promise<any[]> {
  const wasteList = await ensureListener(WASTE_COL, 'waste', []);
  const products = await getFirestoreProducts();
  const areas = await getFirestoreAreas();

  const joined = wasteList.map((s: any) => {
    const prod = products.find((p) => p.id === s.produto_id) || { nome: 'Insumo', unidade: 'un', custo_unitario: 0 };
    const area = areas.find((a) => a.id === s.area_id) || { nome: 'Cozinha' };
    return { ...s, produto: prod, area: area };
  });

  joined.sort((a, b) => new Date(b.data_sobra || b.criado_em).getTime() - new Date(a.data_sobra || a.criado_em).getTime());
  return joined;
}

export async function createFirestoreWaste(wasteData: any) {
  const newId = `sob-${Date.now()}`;
  const products = await getFirestoreProducts();
  const areas = await getFirestoreAreas();
  const prod = products.find((p) => p.id === wasteData.produto_id) || { custo_unitario: 0 };
  const area = areas.find((a) => a.id === wasteData.area_id) || { nome: 'Cozinha' };
  const qty = Number(wasteData.quantidade);
  const valorPerda = wasteData.valor_perda !== undefined ? Number(wasteData.valor_perda) : qty * (prod.custo_unitario || 0);

  const waste = {
    id: newId,
    produto_id: wasteData.produto_id,
    area_id: wasteData.area_id,
    quantidade: qty,
    valor_perda: valorPerda,
    motivo: wasteData.motivo || 'Sobra de Operação',
    data_sobra: wasteData.data_sobra || new Date().toISOString(),
    criado_em: new Date().toISOString(),
  };

  await setDoc(doc(firestore, WASTE_COL, newId), waste);
  return { ...waste, produto: prod, area: area };
}

export async function updateFirestoreWaste(id: string, wasteData: any) {
  const products = await getFirestoreProducts();
  const areas = await getFirestoreAreas();
  const rawWaste = await ensureListener(WASTE_COL, 'waste', []);
  const existing = rawWaste.find((w: any) => w.id === id) || {};

  const prodId = wasteData.produto_id || existing.produto_id;
  const prod = products.find((p) => p.id === prodId) || { custo_unitario: 0 };
  const areaId = wasteData.area_id || existing.area_id;
  const area = areas.find((a) => a.id === areaId) || { nome: 'Cozinha' };

  const qty = wasteData.quantidade !== undefined ? Number(wasteData.quantidade) : existing.quantidade;
  const valPerda = wasteData.valor_perda !== undefined ? Number(wasteData.valor_perda) : qty * (prod.custo_unitario || 0);

  const dataToUpdate = {
    produto_id: prodId,
    area_id: areaId,
    quantidade: qty,
    valor_perda: valPerda,
    motivo: wasteData.motivo !== undefined ? wasteData.motivo : existing.motivo,
    data_sobra: wasteData.data_sobra || existing.data_sobra || new Date().toISOString(),
  };

  await updateDoc(doc(firestore, WASTE_COL, id), dataToUpdate);
  return { id, ...existing, ...dataToUpdate, produto: prod, area: area };
}

export async function deleteFirestoreWaste(id: string) {
  await deleteDoc(doc(firestore, WASTE_COL, id));
}

// 4. ÁREAS
export async function getFirestoreAreas(): Promise<any[]> {
  const areas = await ensureListener(AREAS_COL, 'areas', initialDataCloud.areas);
  return areas.length > 0 ? areas : initialDataCloud.areas;
}

// 5. USUÁRIOS
export async function getFirestoreUsers(): Promise<any[]> {
  const users = await ensureListener(USERS_COL, 'users', initialDataCloud.users);
  return users.length > 0 ? users : initialDataCloud.users;
}

export async function createFirestoreUser(userData: any) {
  const newId = `usr-${Date.now()}`;
  const newUser = {
    id: newId,
    nome: userData.nome,
    email: userData.email,
    senha: userData.senha,
    role: userData.role || 'Comum',
    ativo: userData.ativo !== undefined ? Boolean(userData.ativo) : true,
    criado_em: new Date().toISOString(),
  };

  await setDoc(doc(firestore, USERS_COL, newId), newUser);
  return newUser;
}

export async function updateFirestoreUser(id: string, userData: any) {
  const dataToUpdate: any = {};
  if (userData.nome !== undefined) dataToUpdate.nome = userData.nome;
  if (userData.email !== undefined) dataToUpdate.email = userData.email;
  if (userData.role !== undefined) dataToUpdate.role = userData.role;
  if (userData.ativo !== undefined) dataToUpdate.ativo = Boolean(userData.ativo);
  if (userData.senha) dataToUpdate.senha = userData.senha;

  await updateDoc(doc(firestore, USERS_COL, id), dataToUpdate);
  return { id, ...dataToUpdate };
}

export async function deleteFirestoreUser(id: string) {
  await deleteDoc(doc(firestore, USERS_COL, id));
}
