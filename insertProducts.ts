import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB8GxQB7iayGlwCPfnqtuLS11YjREK8YLI",
  authDomain: "nexai-food.firebaseapp.com",
  projectId: "nexai-food",
  storageBucket: "nexai-food.firebasestorage.app",
  messagingSenderId: "704351369612",
  appId: "1:704351369612:web:fdf626b69d38c601cbfea9",
  measurementId: "G-CVHNRPYJVX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const productsToInsert = [
  { nome: 'PÃO DOCE SEM MARGARINA - MANHÃ', unidade: 'un', custo_unitario: 0.60, ativo: true },
  { nome: 'PÃO DOCE COM MARGARINA - MANHÃ', unidade: 'un', custo_unitario: 0.69, ativo: true },
  { nome: 'PÃO DE SAL COM MARGARINA - MANHÃ', unidade: 'un', custo_unitario: 0.69, ativo: true },
  { nome: 'PÃO DOCE SEM MARGARINA - TARDE', unidade: 'un', custo_unitario: 0.60, ativo: true },
  { nome: 'PÃO DOCE COM MARGARINA - TARDE', unidade: 'un', custo_unitario: 0.69, ativo: true },
  { nome: 'PÃO DE SAL COM MARGARINA - TARDE', unidade: 'un', custo_unitario: 0.69, ativo: true },
  { nome: 'MARMITEX PACIENTE - ALMOÇO', unidade: 'un', custo_unitario: 19.33, ativo: true },
  { nome: 'MARMITEX PACIENTE - JANTAR', unidade: 'un', custo_unitario: 19.33, ativo: true },
  { nome: 'SOPA PACIENTE - ALMOÇO', unidade: 'un', custo_unitario: 19.33, ativo: true },
  { nome: 'SOPA PACIENTE - JANTAR', unidade: 'un', custo_unitario: 19.33, ativo: true },
  { nome: 'MARMITEX COLABORADOR - ALMOÇO', unidade: 'un', custo_unitario: 19.33, ativo: true }
];

async function run() {
  try {
    for (const p of productsToInsert) {
      const newId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const prod = {
        id: newId,
        nome: p.nome,
        unidade: p.unidade,
        custo_unitario: p.custo_unitario,
        ativo: p.ativo,
        criado_em: new Date().toISOString(),
      };
      await setDoc(doc(db, 'products', newId), prod);
      console.log(`Inserido: ${p.nome}`);
      // Sleep slightly to ensure distinct IDs if needed, though Math.random helps
      await new Promise(r => setTimeout(r, 50));
    }
    console.log("Todos os produtos foram cadastrados com sucesso na nuvem!");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao cadastrar produtos:", error);
    process.exit(1);
  }
}

run();
