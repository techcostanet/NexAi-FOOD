import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
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

// Inicializar banco Firestore na nuvem com dados padrão se estiver totalmente vazio
export async function seedFirestoreIfEmpty() {
  try {
    const productsSnap = await getDocs(collection(firestore, PRODUCTS_COL));
    if (productsSnap.empty) {
      console.log('🌱 Inicializando Firestore com produtos, áreas e usuários padrão...');
      for (const prod of initialDataCloud.products) {
        await setDoc(doc(firestore, PRODUCTS_COL, prod.id), prod);
      }
      for (const area of initialDataCloud.areas) {
        await setDoc(doc(firestore, AREAS_COL, area.id), area);
      }
      for (const user of initialDataCloud.users) {
        await setDoc(doc(firestore, USERS_COL, user.id), user);
      }
    }
  } catch (e) {
    console.warn('Firestore offline ou não semeado ainda:', e);
  }
}

// 1. PRODUTOS
export async function getFirestoreProducts(): Promise<any[]> {
  try {
    await seedFirestoreIfEmpty();
    const snap = await getDocs(collection(firestore, PRODUCTS_COL));
    if (!snap.empty) {
      const products: any[] = [];
      snap.forEach((docSnap) => {
        products.push({ id: docSnap.id, ...docSnap.data() });
      });
      setLocalCache('products', products);
      return products;
    }
  } catch (e) {
    console.warn('Usando cache local para produtos:', e);
  }
  return getLocalCache('products', initialDataCloud.products);
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

  try {
    await setDoc(doc(firestore, PRODUCTS_COL, newId), prod);
  } catch (e) {
    console.error('Erro ao salvar produto no Firestore:', e);
  }

  const cached = await getFirestoreProducts();
  const updated = [prod, ...cached.filter((p) => p.id !== newId)];
  setLocalCache('products', updated);
  return prod;
}

export async function updateFirestoreProduct(id: string, productData: any) {
  const dataToUpdate: any = {};
  if (productData.nome !== undefined) dataToUpdate.nome = productData.nome;
  if (productData.unidade !== undefined) dataToUpdate.unidade = productData.unidade;
  if (productData.custo_unitario !== undefined) dataToUpdate.custo_unitario = Number(productData.custo_unitario);
  if (productData.ativo !== undefined) dataToUpdate.ativo = Boolean(productData.ativo);

  try {
    const ref = doc(firestore, PRODUCTS_COL, id);
    await updateDoc(ref, dataToUpdate);
  } catch (e) {
    console.error('Erro ao atualizar produto no Firestore:', e);
  }

  const cached = await getFirestoreProducts();
  const idx = cached.findIndex((p) => p.id === id);
  if (idx !== -1) {
    cached[idx] = { ...cached[idx], ...dataToUpdate };
    setLocalCache('products', cached);
    return cached[idx];
  }
  return { id, ...dataToUpdate };
}

export async function deleteFirestoreProduct(id: string) {
  try {
    await deleteDoc(doc(firestore, PRODUCTS_COL, id));
  } catch (e) {
    console.error('Erro ao deletar produto do Firestore:', e);
  }
  const cached = await getFirestoreProducts();
  const updated = cached.filter((p) => p.id !== id);
  setLocalCache('products', updated);
}

// 2. ENTRADAS
export async function getFirestoreEntries(): Promise<any[]> {
  const products = await getFirestoreProducts();
  try {
    const snap = await getDocs(collection(firestore, ENTRIES_COL));
    const entries: any[] = [];
    snap.forEach((docSnap) => {
      entries.push({ id: docSnap.id, ...docSnap.data() });
    });

    entries.sort((a, b) => new Date(b.data_entrada || b.criado_em).getTime() - new Date(a.data_entrada || a.criado_em).getTime());

    const fullEntries = entries.map((e) => {
      const prod = products.find((p) => p.id === e.produto_id) || { nome: 'Insumo', unidade: 'un', custo_unitario: 0 };
      return { ...e, produto: prod };
    });

    setLocalCache('entries', fullEntries);
    return fullEntries;
  } catch (e) {
    console.warn('Usando cache local para entradas:', e);
  }
  const cached = getLocalCache('entries', []);
  return cached.map((e: any) => {
    const prod = products.find((p) => p.id === e.produto_id) || { nome: 'Insumo', unidade: 'un', custo_unitario: 0 };
    return { ...e, produto: prod };
  });
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

  try {
    await setDoc(doc(firestore, ENTRIES_COL, newId), entry);
  } catch (e) {
    console.error('Erro ao criar entrada no Firestore:', e);
  }

  const cached = getLocalCache('entries', []);
  const fullEntry = { ...entry, produto: prod };
  setLocalCache('entries', [fullEntry, ...cached.filter((e: any) => e.id !== newId)]);
  return fullEntry;
}

export async function updateFirestoreEntry(id: string, entryData: any) {
  const products = await getFirestoreProducts();
  const cached = getLocalCache('entries', []);
  const existing = cached.find((e: any) => e.id === id) || {};

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

  try {
    const ref = doc(firestore, ENTRIES_COL, id);
    await updateDoc(ref, dataToUpdate);
  } catch (e) {
    console.error('Erro ao atualizar entrada no Firestore:', e);
  }

  const updatedEntry = { id, ...existing, ...dataToUpdate, produto: prod };
  const updatedList = cached.map((e: any) => (e.id === id ? updatedEntry : e));
  setLocalCache('entries', updatedList);
  return updatedEntry;
}

export async function deleteFirestoreEntry(id: string) {
  try {
    await deleteDoc(doc(firestore, ENTRIES_COL, id));
  } catch (e) {
    console.error('Erro ao deletar entrada no Firestore:', e);
  }
  const cached = getLocalCache('entries', []);
  setLocalCache('entries', cached.filter((e: any) => e.id !== id));
}

// 3. SOBRAS (WASTE)
export async function getFirestoreWaste(): Promise<any[]> {
  const products = await getFirestoreProducts();
  const areas = await getFirestoreAreas();

  try {
    const snap = await getDocs(collection(firestore, WASTE_COL));
    const wasteList: any[] = [];
    snap.forEach((docSnap) => {
      wasteList.push({ id: docSnap.id, ...docSnap.data() });
    });

    wasteList.sort((a, b) => new Date(b.data_sobra || b.criado_em).getTime() - new Date(a.data_sobra || a.criado_em).getTime());

    const fullWaste = wasteList.map((s) => {
      const prod = products.find((p) => p.id === s.produto_id) || { nome: 'Insumo', unidade: 'un', custo_unitario: 0 };
      const area = areas.find((a) => a.id === s.area_id) || { nome: 'Cozinha' };
      return { ...s, produto: prod, area: area };
    });

    setLocalCache('waste', fullWaste);
    return fullWaste;
  } catch (e) {
    console.warn('Usando cache local para sobras:', e);
  }

  const cached = getLocalCache('waste', []);
  return cached.map((s: any) => {
    const prod = products.find((p) => p.id === s.produto_id) || { nome: 'Insumo', unidade: 'un', custo_unitario: 0 };
    const area = areas.find((a) => a.id === s.area_id) || { nome: 'Cozinha' };
    return { ...s, produto: prod, area: area };
  });
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

  try {
    await setDoc(doc(firestore, WASTE_COL, newId), waste);
  } catch (e) {
    console.error('Erro ao criar sobra no Firestore:', e);
  }

  const cached = getLocalCache('waste', []);
  const fullWaste = { ...waste, produto: prod, area: area };
  setLocalCache('waste', [fullWaste, ...cached.filter((w: any) => w.id !== newId)]);
  return fullWaste;
}

export async function updateFirestoreWaste(id: string, wasteData: any) {
  const products = await getFirestoreProducts();
  const areas = await getFirestoreAreas();
  const cached = getLocalCache('waste', []);
  const existing = cached.find((w: any) => w.id === id) || {};

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

  try {
    const ref = doc(firestore, WASTE_COL, id);
    await updateDoc(ref, dataToUpdate);
  } catch (e) {
    console.error('Erro ao atualizar sobra no Firestore:', e);
  }

  const updatedWaste = { id, ...existing, ...dataToUpdate, produto: prod, area: area };
  const updatedList = cached.map((w: any) => (w.id === id ? updatedWaste : w));
  setLocalCache('waste', updatedList);
  return updatedWaste;
}

export async function deleteFirestoreWaste(id: string) {
  try {
    await deleteDoc(doc(firestore, WASTE_COL, id));
  } catch (e) {
    console.error('Erro ao deletar sobra no Firestore:', e);
  }
  const cached = getLocalCache('waste', []);
  setLocalCache('waste', cached.filter((w: any) => w.id !== id));
}

// 4. ÁREAS
export async function getFirestoreAreas(): Promise<any[]> {
  try {
    await seedFirestoreIfEmpty();
    const snap = await getDocs(collection(firestore, AREAS_COL));
    if (!snap.empty) {
      const areas: any[] = [];
      snap.forEach((docSnap) => {
        areas.push({ id: docSnap.id, ...docSnap.data() });
      });
      setLocalCache('areas', areas);
      return areas;
    }
  } catch (e) {
    console.warn('Usando cache local para áreas:', e);
  }
  return getLocalCache('areas', initialDataCloud.areas);
}

// 5. USUÁRIOS
export async function getFirestoreUsers(): Promise<any[]> {
  try {
    await seedFirestoreIfEmpty();
    const snap = await getDocs(collection(firestore, USERS_COL));
    if (!snap.empty) {
      const users: any[] = [];
      snap.forEach((docSnap) => {
        users.push({ id: docSnap.id, ...docSnap.data() });
      });
      setLocalCache('users', users);
      return users;
    }
  } catch (e) {
    console.warn('Usando cache local para usuários:', e);
  }
  return getLocalCache('users', initialDataCloud.users);
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

  try {
    await setDoc(doc(firestore, USERS_COL, newId), newUser);
  } catch (e) {
    console.error('Erro ao criar usuário no Firestore:', e);
  }

  const cached = await getFirestoreUsers();
  const updated = [newUser, ...cached.filter((u) => u.id !== newId)];
  setLocalCache('users', updated);
  return newUser;
}

export async function updateFirestoreUser(id: string, userData: any) {
  const dataToUpdate: any = {};
  if (userData.nome !== undefined) dataToUpdate.nome = userData.nome;
  if (userData.email !== undefined) dataToUpdate.email = userData.email;
  if (userData.role !== undefined) dataToUpdate.role = userData.role;
  if (userData.ativo !== undefined) dataToUpdate.ativo = Boolean(userData.ativo);
  if (userData.senha) dataToUpdate.senha = userData.senha;

  try {
    const ref = doc(firestore, USERS_COL, id);
    await updateDoc(ref, dataToUpdate);
  } catch (e) {
    console.error('Erro ao atualizar usuário no Firestore:', e);
  }

  const cached = await getFirestoreUsers();
  const idx = cached.findIndex((u) => u.id === id);
  if (idx !== -1) {
    cached[idx] = { ...cached[idx], ...dataToUpdate };
    setLocalCache('users', cached);
    return cached[idx];
  }
  return { id, ...dataToUpdate };
}

export async function deleteFirestoreUser(id: string) {
  try {
    await deleteDoc(doc(firestore, USERS_COL, id));
  } catch (e) {
    console.error('Erro ao deletar usuário do Firestore:', e);
  }
  const cached = await getFirestoreUsers();
  setLocalCache('users', cached.filter((u) => u.id !== id));
}
