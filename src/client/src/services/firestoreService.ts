import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { initialDataCloud } from './cloudDatabaseSeed';

// Coleções no Firestore
const PRODUCTS_COL = 'products';
const ENTRIES_COL = 'entries';
const WASTE_COL = 'waste';
const USERS_COL = 'users';
const AREAS_COL = 'areas';

// Inicializar banco Firestore na nuvem com dados padrão se estiver vazio
export async function seedFirestoreIfEmpty() {
  try {
    const productsSnap = await getDocs(collection(firestore, PRODUCTS_COL));
    if (productsSnap.empty) {
      console.log('🌱 Inicializando Firestore com os 11 produtos e cadastros principais...');
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
    console.error('Erro ao verificar/popular Firestore:', e);
  }
}

// 1. PRODUTOS
export async function getFirestoreProducts() {
  await seedFirestoreIfEmpty();
  const snap = await getDocs(collection(firestore, PRODUCTS_COL));
  const products: any[] = [];
  snap.forEach((docSnap) => {
    products.push({ id: docSnap.id, ...docSnap.data() });
  });
  return products;
}

export async function createFirestoreProduct(productData: any) {
  const newId = `prod-${Date.now()}`;
  const prod = {
    id: newId,
    nome: productData.nome,
    unidade: productData.unidade,
    custo_unitario: Number(productData.custo_unitario),
    ativo: productData.ativo !== undefined ? productData.ativo : true,
    criado_em: new Date().toISOString(),
  };
  await setDoc(doc(firestore, PRODUCTS_COL, newId), prod);
  return prod;
}

export async function updateFirestoreProduct(id: string, productData: any) {
  const ref = doc(firestore, PRODUCTS_COL, id);
  const dataToUpdate: any = {};
  if (productData.nome !== undefined) dataToUpdate.nome = productData.nome;
  if (productData.unidade !== undefined) dataToUpdate.unidade = productData.unidade;
  if (productData.custo_unitario !== undefined) dataToUpdate.custo_unitario = Number(productData.custo_unitario);
  if (productData.ativo !== undefined) dataToUpdate.ativo = productData.ativo;

  await updateDoc(ref, dataToUpdate);
  const updatedSnap = await getDoc(ref);
  return { id: updatedSnap.id, ...updatedSnap.data() };
}

export async function deleteFirestoreProduct(id: string) {
  await deleteDoc(doc(firestore, PRODUCTS_COL, id));
}

// 2. ENTRADAS
export async function getFirestoreEntries() {
  const snap = await getDocs(collection(firestore, ENTRIES_COL));
  const entries: any[] = [];
  snap.forEach((docSnap) => {
    entries.push({ id: docSnap.id, ...docSnap.data() });
  });
  const products = await getFirestoreProducts();

  return entries.map((e) => {
    const prod = products.find((p) => p.id === e.produto_id) || { nome: 'Insumo', unidade: 'un', custo_unitario: 0 };
    return { ...e, produto: prod };
  });
}

export async function createFirestoreEntry(entryData: any) {
  const newId = `ent-${Date.now()}`;
  const products = await getFirestoreProducts();
  const prod = products.find((p) => p.id === entryData.produto_id) || { custo_unitario: 0 };
  const qty = Number(entryData.quantidade);
  const valorTotal = entryData.valor_total !== undefined ? Number(entryData.valor_total) : qty * prod.custo_unitario;

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
  const ref = doc(firestore, ENTRIES_COL, id);
  const existingSnap = await getDoc(ref);
  const existing = existingSnap.data() || {};
  const products = await getFirestoreProducts();
  const prodId = entryData.produto_id || existing.produto_id;
  const prod = products.find((p) => p.id === prodId) || { custo_unitario: 0 };
  const qty = entryData.quantidade !== undefined ? Number(entryData.quantidade) : existing.quantidade;
  const valTotal = entryData.valor_total !== undefined ? Number(entryData.valor_total) : qty * prod.custo_unitario;

  const dataToUpdate = {
    produto_id: prodId,
    quantidade: qty,
    valor_total: valTotal,
    data_entrada: entryData.data_entrada || existing.data_entrada,
    observacao: entryData.observacao !== undefined ? entryData.observacao : existing.observacao,
  };

  await updateDoc(ref, dataToUpdate);
  return { id, ...existing, ...dataToUpdate, produto: prod };
}

export async function deleteFirestoreEntry(id: string) {
  await deleteDoc(doc(firestore, ENTRIES_COL, id));
}

// 3. SOBRAS (WASTE)
export async function getFirestoreWaste() {
  const snap = await getDocs(collection(firestore, WASTE_COL));
  const wasteList: any[] = [];
  snap.forEach((docSnap) => {
    wasteList.push({ id: docSnap.id, ...docSnap.data() });
  });

  const products = await getFirestoreProducts();
  const areas = await getFirestoreAreas();

  return wasteList.map((s) => {
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
  const valorPerda = qty * prod.custo_unitario;

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
  const ref = doc(firestore, WASTE_COL, id);
  const existingSnap = await getDoc(ref);
  const existing = existingSnap.data() || {};
  const products = await getFirestoreProducts();
  const areas = await getFirestoreAreas();

  const prodId = wasteData.produto_id || existing.produto_id;
  const prod = products.find((p) => p.id === prodId) || { custo_unitario: 0 };
  const areaId = wasteData.area_id || existing.area_id;
  const area = areas.find((a) => a.id === areaId) || { nome: 'Cozinha' };

  const qty = wasteData.quantidade !== undefined ? Number(wasteData.quantidade) : existing.quantidade;
  const valPerda = qty * prod.custo_unitario;

  const dataToUpdate = {
    produto_id: prodId,
    area_id: areaId,
    quantidade: qty,
    valor_perda: valPerda,
    motivo: wasteData.motivo !== undefined ? wasteData.motivo : existing.motivo,
    data_sobra: wasteData.data_sobra || existing.data_sobra,
  };

  await updateDoc(ref, dataToUpdate);
  return { id, ...existing, ...dataToUpdate, produto: prod, area: area };
}

export async function deleteFirestoreWaste(id: string) {
  await deleteDoc(doc(firestore, WASTE_COL, id));
}

// 4. ÁREAS
export async function getFirestoreAreas() {
  await seedFirestoreIfEmpty();
  const snap = await getDocs(collection(firestore, AREAS_COL));
  const areas: any[] = [];
  snap.forEach((docSnap) => {
    areas.push({ id: docSnap.id, ...docSnap.data() });
  });
  return areas;
}

// 5. USUÁRIOS & AUTH
export async function getFirestoreUsers() {
  await seedFirestoreIfEmpty();
  const snap = await getDocs(collection(firestore, USERS_COL));
  const users: any[] = [];
  snap.forEach((docSnap) => {
    users.push({ id: docSnap.id, ...docSnap.data() });
  });
  return users;
}
