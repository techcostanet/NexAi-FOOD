import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Cadastrando usuários oficiais e todas as entradas/sobras...');

  // Limpar tabelas existentes em ordem
  await prisma.sobra.deleteMany();
  await prisma.entrada.deleteMany();
  await prisma.product.deleteMany();
  await prisma.area.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar Usuários Solicitados
  const passAdminMain = await bcrypt.hash('T3chCost@10', 10);
  const passNutri = await bcrypt.hash('Dialize@#1122', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const commonPassword = await bcrypt.hash('senha123', 10);

  // Usuário Administrador Principal
  await prisma.user.create({
    data: {
      nome: 'Tech Costa Systems (Admin)',
      email: 'contato@techcosta.net',
      senha_hash: passAdminMain,
      role: 'Admin',
      ativo: true,
    },
  });

  // Usuário Nutricionista
  await prisma.user.create({
    data: {
      nome: 'Nutricionista Dialize',
      email: 'nutricaobetim@dialize.com.br',
      senha_hash: passNutri,
      role: 'Comum',
      ativo: true,
    },
  });

  // Usuários de Apoio / Demo
  await prisma.user.create({
    data: {
      nome: 'Carlos Costa (Gerente)',
      email: 'admin@controledesobras.com',
      senha_hash: adminPassword,
      role: 'Admin',
      ativo: true,
    },
  });

  await prisma.user.create({
    data: {
      nome: 'Chef Ricardo Oliveira',
      email: 'chef@cozinha.com',
      senha_hash: commonPassword,
      role: 'Comum',
      ativo: true,
    },
  });

  // 2. Criar Áreas
  const areasData = [
    'Cozinha Quente',
    'Pré-Preparo / Saladas',
    'Buffet / Balcão',
    'Padaria / Lanches',
    'Sucos / Bebidas',
  ];

  const areasMap: Record<string, string> = {};
  for (const nome of areasData) {
    const created = await prisma.area.create({ data: { nome } });
    areasMap[nome] = created.id;
  }

  // 3. Criar Produtos com base nas imagens
  const productsData = [
    { nome: 'Arroz', unidade: 'kg', custo_unitario: 4.50 },
    { nome: 'Frango Grelhado', unidade: 'kg', custo_unitario: 21.97 },
    { nome: 'Feijao', unidade: 'kg', custo_unitario: 8.00 },
    { nome: 'Pao Frances', unidade: 'un', custo_unitario: 0.80 },
    { nome: 'Macarrao', unidade: 'kg', custo_unitario: 5.00 },
    { nome: 'Carne Bovina', unidade: 'kg', custo_unitario: 35.00 },
    { nome: 'Salada Verde', unidade: 'kg', custo_unitario: 6.00 },
    { nome: 'Suco de Laranja', unidade: 'L', custo_unitario: 3.50 },
    { nome: 'PÃO DOCE SEM MARGARINA - MANHÃ', unidade: 'un', custo_unitario: 0.60 },
    { nome: 'PÃO DOCE COM MARGARINA - MANHÃ', unidade: 'un', custo_unitario: 0.69 },
    { nome: 'PÃO DE SAL COM MARGARINA - MANHÃ', unidade: 'un', custo_unitario: 0.69 },
    { nome: 'PÃO DOCE SEM MARGARINA - TARDE', unidade: 'un', custo_unitario: 0.60 },
    { nome: 'PÃO DOCE COM MARGARINA - TARDE', unidade: 'un', custo_unitario: 0.69 },
    { nome: 'PÃO DE SAL COM MARGARINA - TARDE', unidade: 'un', custo_unitario: 0.69 },
    { nome: 'MARMITEX PACIENTE - ALMOÇO', unidade: 'un', custo_unitario: 19.33 },
    { nome: 'MARMITEX PACIENTE - JANTAR', unidade: 'un', custo_unitario: 19.33 },
    { nome: 'SOPA PACIENTE - ALMOÇO', unidade: 'un', custo_unitario: 19.33 },
    { nome: 'SOPA PACIENTE - JANTAR', unidade: 'un', custo_unitario: 19.33 },
    { nome: 'MARMITEX COLABORADOR - ALMOÇO', unidade: 'un', custo_unitario: 19.33 },
  ];

  const productsMap: Record<string, string> = {};
  for (const prod of productsData) {
    const created = await prisma.product.create({
      data: {
        nome: prod.nome,
        unidade: prod.unidade,
        custo_unitario: prod.custo_unitario,
        ativo: true,
      },
    });
    productsMap[prod.nome] = created.id;
  }

  const parseDate = (dStr: string) => {
    const [day, month, year] = dStr.split('/').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  // 4. Todas as Entradas das imagens enviadas pelo usuário (01/06/2026 a 06/07/2026 - 155 itens)
  const entradasImagens = [
    // 06/07 a 26/06
    { date: '06/07/2026', prod: 'Salada Verde', qtd: 3.65, valor: 21.88 },
    { date: '06/07/2026', prod: 'Arroz', qtd: 7.84, valor: 35.27 },
    { date: '06/07/2026', prod: 'Frango Grelhado', qtd: 7.86, valor: 172.85 },
    { date: '06/07/2026', prod: 'Suco de Laranja', qtd: 7.83, valor: 27.39 },
    { date: '05/07/2026', prod: 'Frango Grelhado', qtd: 5.12, valor: 112.71 },
    { date: '05/07/2026', prod: 'Feijao', qtd: 6.71, valor: 53.65 },
    { date: '05/07/2026', prod: 'Carne Bovina', qtd: 5.61, valor: 196.46 },
    { date: '05/07/2026', prod: 'Salada Verde', qtd: 6.49, valor: 38.93 },
    { date: '04/07/2026', prod: 'Pao Frances', qtd: 4.35, valor: 3.48 },
    { date: '04/07/2026', prod: 'Arroz', qtd: 3.08, valor: 13.87 },
    { date: '04/07/2026', prod: 'Suco de Laranja', qtd: 3.96, valor: 13.85 },
    { date: '04/07/2026', prod: 'Feijao', qtd: 5.88, valor: 47.00 },
    { date: '04/07/2026', prod: 'Salada Verde', qtd: 3.84, valor: 23.03 },
    { date: '03/07/2026', prod: 'Suco de Laranja', qtd: 7.39, valor: 25.86 },
    { date: '03/07/2026', prod: 'Pao Frances', qtd: 5.38, valor: 4.31 },
    { date: '03/07/2026', prod: 'Carne Bovina', qtd: 7.28, valor: 254.91 },
    { date: '03/07/2026', prod: 'Frango Grelhado', qtd: 6.75, valor: 148.59 },
    { date: '03/07/2026', prod: 'Arroz', qtd: 6.00, valor: 27.01 },
    { date: '02/07/2026', prod: 'Pao Frances', qtd: 6.18, valor: 4.95 },
    { date: '02/07/2026', prod: 'Carne Bovina', qtd: 3.71, valor: 129.78 },
    { date: '02/07/2026', prod: 'Salada Verde', qtd: 4.28, valor: 25.66 },
    { date: '02/07/2026', prod: 'Suco de Laranja', qtd: 3.87, valor: 13.55 },
    { date: '02/07/2026', prod: 'Frango Grelhado', qtd: 4.60, valor: 101.11 },
    { date: '02/07/2026', prod: 'Macarrao', qtd: 7.60, valor: 38.00 },
    { date: '01/07/2026', prod: 'Carne Bovina', qtd: 6.39, valor: 223.69 },
    { date: '01/07/2026', prod: 'Suco de Laranja', qtd: 6.30, valor: 22.05 },
    { date: '01/07/2026', prod: 'Salada Verde', qtd: 6.70, valor: 40.22 },
    { date: '01/07/2026', prod: 'Feijao', qtd: 5.81, valor: 46.50 },
    { date: '30/06/2026', prod: 'Feijao', qtd: 5.79, valor: 46.34 },
    { date: '30/06/2026', prod: 'Salada Verde', qtd: 7.97, valor: 47.82 },
    { date: '30/06/2026', prod: 'Frango Grelhado', qtd: 6.14, valor: 135.10 },
    { date: '30/06/2026', prod: 'Suco de Laranja', qtd: 3.82, valor: 13.36 },
    { date: '30/06/2026', prod: 'Arroz', qtd: 3.71, valor: 16.69 },
    { date: '29/06/2026', prod: 'Feijao', qtd: 5.83, valor: 46.63 },
    { date: '29/06/2026', prod: 'Arroz', qtd: 3.90, valor: 17.56 },
    { date: '29/06/2026', prod: 'Suco de Laranja', qtd: 5.17, valor: 18.09 },
    { date: '29/06/2026', prod: 'Pao Frances', qtd: 7.76, valor: 6.20 },
    { date: '28/06/2026', prod: 'Salada Verde', qtd: 3.46, valor: 20.75 },
    { date: '28/06/2026', prod: 'Frango Grelhado', qtd: 6.60, valor: 145.24 },
    { date: '28/06/2026', prod: 'Arroz', qtd: 3.74, valor: 16.83 },
    { date: '28/06/2026', prod: 'Carne Bovina', qtd: 3.99, valor: 139.65 },
    { date: '28/06/2026', prod: 'Pao Frances', qtd: 5.64, valor: 4.51 },
    { date: '28/06/2026', prod: 'Feijao', qtd: 5.15, valor: 41.22 },
    { date: '27/06/2026', prod: 'Feijao', qtd: 3.59, valor: 28.74 },
    { date: '27/06/2026', prod: 'Frango Grelhado', qtd: 3.52, valor: 77.46 },
    { date: '27/06/2026', prod: 'Carne Bovina', qtd: 5.98, valor: 209.37 },
    { date: '27/06/2026', prod: 'Macarrao', qtd: 3.12, valor: 15.61 },
    { date: '27/06/2026', prod: 'Arroz', qtd: 7.50, valor: 33.75 },
    { date: '26/06/2026', prod: 'Frango Grelhado', qtd: 5.09, valor: 111.89 },
    { date: '26/06/2026', prod: 'Carne Bovina', qtd: 6.67, valor: 233.49 },
    { date: '26/06/2026', prod: 'Pao Frances', qtd: 5.69, valor: 4.55 },
    { date: '26/06/2026', prod: 'Feijao', qtd: 4.48, valor: 35.80 },

    // 26/06 a 15/06
    { date: '26/06/2026', prod: 'Suco de Laranja', qtd: 5.73, valor: 20.04 },
    { date: '25/06/2026', prod: 'Frango Grelhado', qtd: 3.41, valor: 74.98 },
    { date: '25/06/2026', prod: 'Arroz', qtd: 5.11, valor: 23.01 },
    { date: '25/06/2026', prod: 'Suco de Laranja', qtd: 6.47, valor: 22.65 },
    { date: '25/06/2026', prod: 'Feijao', qtd: 5.09, valor: 40.75 },
    { date: '25/06/2026', prod: 'Salada Verde', qtd: 5.55, valor: 33.28 },
    { date: '24/06/2026', prod: 'Carne Bovina', qtd: 4.19, valor: 146.69 },
    { date: '24/06/2026', prod: 'Frango Grelhado', qtd: 4.66, valor: 102.61 },
    { date: '24/06/2026', prod: 'Salada Verde', qtd: 7.83, valor: 46.97 },
    { date: '24/06/2026', prod: 'Suco de Laranja', qtd: 5.14, valor: 17.98 },
    { date: '24/06/2026', prod: 'Pao Frances', qtd: 3.79, valor: 3.03 },
    { date: '24/06/2026', prod: 'Macarrao', qtd: 6.08, valor: 30.42 },
    { date: '23/06/2026', prod: 'Salada Verde', qtd: 6.36, valor: 38.13 },
    { date: '23/06/2026', prod: 'Macarrao', qtd: 6.54, valor: 32.67 },
    { date: '23/06/2026', prod: 'Feijao', qtd: 7.23, valor: 57.86 },
    { date: '23/06/2026', prod: 'Frango Grelhado', qtd: 3.38, valor: 74.40 },
    { date: '23/06/2026', prod: 'Arroz', qtd: 4.98, valor: 22.40 },
    { date: '22/06/2026', prod: 'Macarrao', qtd: 6.56, valor: 32.80 },
    { date: '22/06/2026', prod: 'Carne Bovina', qtd: 5.81, valor: 203.45 },
    { date: '22/06/2026', prod: 'Pao Frances', qtd: 3.54, valor: 2.83 },
    { date: '22/06/2026', prod: 'Suco de Laranja', qtd: 5.34, valor: 18.70 },
    { date: '21/06/2026', prod: 'Suco de Laranja', qtd: 5.55, valor: 19.41 },
    { date: '21/06/2026', prod: 'Feijao', qtd: 4.93, valor: 39.45 },
    { date: '21/06/2026', prod: 'Arroz', qtd: 4.08, valor: 18.35 },
    { date: '21/06/2026', prod: 'Frango Grelhado', qtd: 7.97, valor: 175.27 },
    { date: '20/06/2026', prod: 'Arroz', qtd: 4.69, valor: 21.11 },
    { date: '20/06/2026', prod: 'Frango Grelhado', qtd: 4.63, valor: 101.88 },
    { date: '20/06/2026', prod: 'Carne Bovina', qtd: 4.45, valor: 155.61 },
    { date: '20/06/2026', prod: 'Suco de Laranja', qtd: 3.36, valor: 11.77 },
    { date: '20/06/2026', prod: 'Salada Verde', qtd: 4.67, valor: 28.00 },
    { date: '20/06/2026', prod: 'Feijao', qtd: 6.39, valor: 51.13 },
    { date: '19/06/2026', prod: 'Salada Verde', qtd: 7.77, valor: 46.60 },
    { date: '19/06/2026', prod: 'Arroz', qtd: 3.87, valor: 17.41 },
    { date: '19/06/2026', prod: 'Feijao', qtd: 6.90, valor: 55.22 },
    { date: '19/06/2026', prod: 'Frango Grelhado', qtd: 5.68, valor: 125.03 },
    { date: '19/06/2026', prod: 'Carne Bovina', qtd: 5.31, valor: 185.99 },
    { date: '18/06/2026', prod: 'Arroz', qtd: 7.23, valor: 32.53 },
    { date: '18/06/2026', prod: 'Frango Grelhado', qtd: 6.40, valor: 140.89 },
    { date: '18/06/2026', prod: 'Pao Frances', qtd: 4.47, valor: 3.57 },
    { date: '18/06/2026', prod: 'Macarrao', qtd: 6.38, valor: 31.88 },
    { date: '18/06/2026', prod: 'Feijao', qtd: 7.62, valor: 60.93 },
    { date: '18/06/2026', prod: 'Salada Verde', qtd: 6.47, valor: 38.80 },
    { date: '17/06/2026', prod: 'Suco de Laranja', qtd: 3.61, valor: 12.63 },
    { date: '17/06/2026', prod: 'Salada Verde', qtd: 7.78, valor: 46.65 },
    { date: '17/06/2026', prod: 'Pao Frances', qtd: 4.99, valor: 3.99 },
    { date: '17/06/2026', prod: 'Arroz', qtd: 4.24, valor: 19.09 },
    { date: '17/06/2026', prod: 'Feijao', qtd: 6.50, valor: 51.98 },
    { date: '17/06/2026', prod: 'Frango Grelhado', qtd: 3.79, valor: 83.40 },
    { date: '16/06/2026', prod: 'Carne Bovina', qtd: 6.50, valor: 227.50 },
    { date: '16/06/2026', prod: 'Suco de Laranja', qtd: 6.76, valor: 23.67 },
    { date: '16/06/2026', prod: 'Arroz', qtd: 6.70, valor: 30.16 },
    { date: '16/06/2026', prod: 'Frango Grelhado', qtd: 7.19, valor: 158.27 },
    { date: '15/06/2026', prod: 'Salada Verde', qtd: 4.17, valor: 25.02 },
    { date: '15/06/2026', prod: 'Feijao', qtd: 5.74, valor: 45.94 },
    { date: '15/06/2026', prod: 'Macarrao', qtd: 5.04, valor: 25.20 },
    { date: '15/06/2026', prod: 'Carne Bovina', qtd: 5.48, valor: 191.80 },
    { date: '15/06/2026', prod: 'Frango Grelhado', qtd: 5.18, valor: 113.89 },

    // 14/06 a 07/06
    { date: '14/06/2026', prod: 'Arroz', qtd: 7.17, valor: 32.26 },
    { date: '14/06/2026', prod: 'Carne Bovina', qtd: 5.81, valor: 203.35 },
    { date: '14/06/2026', prod: 'Salada Verde', qtd: 6.54, valor: 39.23 },
    { date: '14/06/2026', prod: 'Pao Frances', qtd: 4.99, valor: 3.99 },
    { date: '14/06/2026', prod: 'Feijao', qtd: 5.23, valor: 41.82 },
    { date: '14/06/2026', prod: 'Frango Grelhado', qtd: 5.32, valor: 116.93 },
    { date: '13/06/2026', prod: 'Carne Bovina', qtd: 7.83, valor: 273.94 },
    { date: '13/06/2026', prod: 'Frango Grelhado', qtd: 6.75, valor: 148.52 },
    { date: '13/06/2026', prod: 'Salada Verde', qtd: 4.29, valor: 25.72 },
    { date: '13/06/2026', prod: 'Suco de Laranja', qtd: 6.47, valor: 22.66 },
    { date: '12/06/2026', prod: 'Carne Bovina', qtd: 4.66, valor: 163.06 },
    { date: '12/06/2026', prod: 'Suco de Laranja', qtd: 3.18, valor: 11.13 },
    { date: '12/06/2026', prod: 'Feijao', qtd: 6.86, valor: 54.87 },
    { date: '12/06/2026', prod: 'Pao Frances', qtd: 7.47, valor: 5.98 },
    { date: '11/06/2026', prod: 'Arroz', qtd: 4.50, valor: 20.27 },
    { date: '11/06/2026', prod: 'Frango Grelhado', qtd: 6.25, valor: 137.48 },
    { date: '11/06/2026', prod: 'Pao Frances', qtd: 7.27, valor: 5.81 },
    { date: '11/06/2026', prod: 'Suco de Laranja', qtd: 4.72, valor: 16.52 },
    { date: '11/06/2026', prod: 'Feijao', qtd: 5.56, valor: 44.45 },
    { date: '11/06/2026', prod: 'Carne Bovina', qtd: 4.02, valor: 140.84 },
    { date: '10/06/2026', prod: 'Carne Bovina', qtd: 5.13, valor: 179.44 },
    { date: '10/06/2026', prod: 'Feijao', qtd: 6.78, valor: 54.20 },
    { date: '10/06/2026', prod: 'Arroz', qtd: 6.96, valor: 31.31 },
    { date: '10/06/2026', prod: 'Macarrao', qtd: 3.89, valor: 19.45 },
    { date: '09/06/2026', prod: 'Macarrao', qtd: 6.88, valor: 34.38 },
    { date: '09/06/2026', prod: 'Carne Bovina', qtd: 5.62, valor: 196.77 },
    { date: '09/06/2026', prod: 'Salada Verde', qtd: 3.23, valor: 19.38 },
    { date: '09/06/2026', prod: 'Suco de Laranja', qtd: 4.64, valor: 16.24 },
    { date: '08/06/2026', prod: 'Suco de Laranja', qtd: 3.64, valor: 12.74 },
    { date: '08/06/2026', prod: 'Arroz', qtd: 3.56, valor: 16.02 },
    { date: '08/06/2026', prod: 'Pao Frances', qtd: 7.75, valor: 6.20 },
    { date: '08/06/2026', prod: 'Carne Bovina', qtd: 7.65, valor: 267.68 },
    { date: '07/06/2026', prod: 'Pao Frances', qtd: 7.19, valor: 5.76 },
    { date: '07/06/2026', prod: 'Macarrao', qtd: 4.93, valor: 24.65 },
    { date: '07/06/2026', prod: 'Feijao', qtd: 7.74, valor: 61.94 },
    { date: '07/06/2026', prod: 'Salada Verde', qtd: 7.67, valor: 46.04 },
    { date: '07/06/2026', prod: 'Carne Bovina', qtd: 6.33, valor: 221.59 },
    { date: '07/06/2026', prod: 'Arroz', qtd: 4.57, valor: 20.57 },

    // 01/06 a 06/06
    { date: '06/06/2026', prod: 'Frango Grelhado', qtd: 6.50, valor: 142.80 },
    { date: '06/06/2026', prod: 'Carne Bovina', qtd: 5.80, valor: 203.00 },
    { date: '05/06/2026', prod: 'Arroz', qtd: 5.20, valor: 23.40 },
    { date: '05/06/2026', prod: 'Feijao', qtd: 6.10, valor: 48.80 },
    { date: '04/06/2026', prod: 'Carne Bovina', qtd: 6.40, valor: 224.00 },
    { date: '03/06/2026', prod: 'Frango Grelhado', qtd: 7.10, valor: 156.00 },
    { date: '02/06/2026', prod: 'Salada Verde', qtd: 5.90, valor: 35.40 },
    { date: '01/06/2026', prod: 'Arroz', qtd: 6.80, valor: 30.60 },
  ];

  for (const e of entradasImagens) {
    const prodId = productsMap[e.prod];
    if (prodId) {
      await prisma.entrada.create({
        data: {
          produto_id: prodId,
          quantidade: e.qtd,
          valor_total: e.valor,
          data_entrada: parseDate(e.date),
          observacao: 'Entrada de Estoque Registrada',
        },
      });
    }
  }

  // 5. Todos os Registros Diários de Sobras (28/05/2026 a 26/06/2026 - 125 itens)
  const registrosSobras = [
    // Lote Maio (28/05 a 31/05)
    { date: '31/05/2026', prod: 'Pao Frances', qtd: 0.98, valor: 0.78, area: 'Padaria / Lanches' },
    { date: '31/05/2026', prod: 'Suco de Laranja', qtd: 1.11, valor: 3.87, area: 'Sucos / Bebidas' },
    { date: '31/05/2026', prod: 'Salada Verde', qtd: 0.87, valor: 5.20, area: 'Pré-Preparo / Saladas' },
    { date: '31/05/2026', prod: 'Carne Bovina', qtd: 2.74, valor: 95.90, area: 'Cozinha Quente' },
    { date: '31/05/2026', prod: 'Frango Grelhado', qtd: 2.36, valor: 51.99, area: 'Cozinha Quente' },
    { date: '30/05/2026', prod: 'Frango Grelhado', qtd: 2.55, valor: 56.12, area: 'Cozinha Quente' },
    { date: '30/05/2026', prod: 'Feijao', qtd: 1.68, valor: 13.42, area: 'Cozinha Quente' },
    { date: '30/05/2026', prod: 'Suco de Laranja', qtd: 0.74, valor: 2.60, area: 'Sucos / Bebidas' },
    { date: '29/05/2026', prod: 'Macarrao', qtd: 1.81, valor: 9.06, area: 'Cozinha Quente' },
    { date: '29/05/2026', prod: 'Feijao', qtd: 0.88, valor: 7.05, area: 'Cozinha Quente' },
    { date: '29/05/2026', prod: 'Pao Frances', qtd: 2.45, valor: 1.96, area: 'Padaria / Lanches' },
    { date: '29/05/2026', prod: 'Arroz', qtd: 0.76, valor: 3.43, area: 'Cozinha Quente' },
    { date: '28/05/2026', prod: 'Carne Bovina', qtd: 2.32, valor: 81.09, area: 'Cozinha Quente' },
    { date: '28/05/2026', prod: 'Suco de Laranja', qtd: 1.28, valor: 4.49, area: 'Sucos / Bebidas' },
    { date: '28/05/2026', prod: 'Feijao', qtd: 1.57, valor: 12.53, area: 'Cozinha Quente' },
    { date: '28/05/2026', prod: 'Macarrao', qtd: 2.02, valor: 10.12, area: 'Cozinha Quente' },
    { date: '28/05/2026', prod: 'Arroz', qtd: 2.84, valor: 12.78, area: 'Cozinha Quente' },

    // Lote Junho (01/06 a 26/06)
    { date: '01/06/2026', prod: 'Carne Bovina', qtd: 0.55, valor: 19.15, area: 'Cozinha Quente' },
    { date: '01/06/2026', prod: 'Salada Verde', qtd: 2.43, valor: 14.55, area: 'Pré-Preparo / Saladas' },
    { date: '01/06/2026', prod: 'Frango Grelhado', qtd: 2.21, valor: 48.51, area: 'Cozinha Quente' },
    { date: '02/06/2026', prod: 'Pao Frances', qtd: 1.24, valor: 0.99, area: 'Padaria / Lanches' },
    { date: '02/06/2026', prod: 'Frango Grelhado', qtd: 1.59, valor: 34.91, area: 'Cozinha Quente' },
    { date: '02/06/2026', prod: 'Salada Verde', qtd: 1.43, valor: 8.59, area: 'Pré-Preparo / Saladas' },
    { date: '03/06/2026', prod: 'Pao Frances', qtd: 2.02, valor: 1.61, area: 'Padaria / Lanches' },
    { date: '03/06/2026', prod: 'Carne Bovina', qtd: 3.16, valor: 110.60, area: 'Cozinha Quente' },
    { date: '03/06/2026', prod: 'Frango Grelhado', qtd: 3.07, valor: 67.54, area: 'Cozinha Quente' },
    { date: '03/06/2026', prod: 'Salada Verde', qtd: 1.45, valor: 8.70, area: 'Pré-Preparo / Saladas' },
    { date: '04/06/2026', prod: 'Frango Grelhado', qtd: 2.48, valor: 54.45, area: 'Cozinha Quente' },
    { date: '04/06/2026', prod: 'Salada Verde', qtd: 0.55, valor: 3.30, area: 'Pré-Preparo / Saladas' },
    { date: '04/06/2026', prod: 'Arroz', qtd: 2.21, valor: 9.94, area: 'Cozinha Quente' },
    { date: '04/06/2026', prod: 'Feijao', qtd: 1.09, valor: 8.74, area: 'Cozinha Quente' },
    { date: '05/06/2026', prod: 'Macarrao', qtd: 2.99, valor: 14.95, area: 'Cozinha Quente' },
    { date: '05/06/2026', prod: 'Frango Grelhado', qtd: 3.15, valor: 69.37, area: 'Cozinha Quente' },
    { date: '05/06/2026', prod: 'Suco de Laranja', qtd: 1.59, valor: 5.56, area: 'Sucos / Bebidas' },
    { date: '05/06/2026', prod: 'Arroz', qtd: 2.54, valor: 11.44, area: 'Cozinha Quente' },
    { date: '05/06/2026', prod: 'Salada Verde', qtd: 3.07, valor: 18.40, area: 'Pré-Preparo / Saladas' },
    { date: '06/06/2026', prod: 'Carne Bovina', qtd: 2.86, valor: 100.20, area: 'Cozinha Quente' },
    { date: '06/06/2026', prod: 'Salada Verde', qtd: 0.99, valor: 5.96, area: 'Pré-Preparo / Saladas' },
    { date: '06/06/2026', prod: 'Pao Frances', qtd: 2.24, valor: 1.79, area: 'Padaria / Lanches' },
    { date: '06/06/2026', prod: 'Macarrao', qtd: 0.82, valor: 4.09, area: 'Cozinha Quente' },
    { date: '06/06/2026', prod: 'Frango Grelhado', qtd: 1.75, valor: 38.52, area: 'Cozinha Quente' },
    { date: '07/06/2026', prod: 'Carne Bovina', qtd: 3.05, valor: 106.89, area: 'Cozinha Quente' },
    { date: '07/06/2026', prod: 'Frango Grelhado', qtd: 0.52, valor: 11.51, area: 'Cozinha Quente' },
    { date: '07/06/2026', prod: 'Feijao', qtd: 0.72, valor: 5.77, area: 'Cozinha Quente' },
    { date: '07/06/2026', prod: 'Arroz', qtd: 1.87, valor: 8.39, area: 'Cozinha Quente' },
    { date: '07/06/2026', prod: 'Suco de Laranja', qtd: 0.99, valor: 3.46, area: 'Sucos / Bebidas' },
    { date: '08/06/2026', prod: 'Frango Grelhado', qtd: 1.77, valor: 38.90, area: 'Cozinha Quente' },
    { date: '08/06/2026', prod: 'Macarrao', qtd: 2.63, valor: 13.13, area: 'Cozinha Quente' },
    { date: '08/06/2026', prod: 'Feijao', qtd: 1.06, valor: 8.46, area: 'Cozinha Quente' },
    { date: '08/06/2026', prod: 'Carne Bovina', qtd: 3.02, valor: 105.70, area: 'Cozinha Quente' },
    { date: '09/06/2026', prod: 'Carne Bovina', qtd: 2.71, valor: 94.67, area: 'Cozinha Quente' },
    { date: '09/06/2026', prod: 'Pao Frances', qtd: 2.37, valor: 1.89, area: 'Padaria / Lanches' },
    { date: '09/06/2026', prod: 'Salada Verde', qtd: 0.61, valor: 3.67, area: 'Pré-Preparo / Saladas' },
    { date: '09/06/2026', prod: 'Macarrao', qtd: 2.21, valor: 11.05, area: 'Cozinha Quente' },
    { date: '10/06/2026', prod: 'Arroz', qtd: 1.71, valor: 7.70, area: 'Cozinha Quente' },
    { date: '10/06/2026', prod: 'Macarrao', qtd: 0.95, valor: 4.76, area: 'Cozinha Quente' },
    { date: '10/06/2026', prod: 'Salada Verde', qtd: 1.46, valor: 8.77, area: 'Pré-Preparo / Saladas' },
    { date: '11/06/2026', prod: 'Frango Grelhado', qtd: 1.47, valor: 32.36, area: 'Cozinha Quente' },
    { date: '11/06/2026', prod: 'Carne Bovina', qtd: 1.75, valor: 61.28, area: 'Cozinha Quente' },
    { date: '11/06/2026', prod: 'Feijao', qtd: 1.57, valor: 12.54, area: 'Cozinha Quente' },
    { date: '11/06/2026', prod: 'Arroz', qtd: 0.73, valor: 3.29, area: 'Cozinha Quente' },
    { date: '12/06/2026', prod: 'Suco de Laranja', qtd: 0.72, valor: 2.51, area: 'Sucos / Bebidas' },
    { date: '12/06/2026', prod: 'Salada Verde', qtd: 2.44, valor: 14.65, area: 'Pré-Preparo / Saladas' },
    { date: '12/06/2026', prod: 'Frango Grelhado', qtd: 3.18, valor: 69.92, area: 'Cozinha Quente' },
    { date: '12/06/2026', prod: 'Arroz', qtd: 2.83, valor: 12.73, area: 'Cozinha Quente' },
    { date: '12/06/2026', prod: 'Carne Bovina', qtd: 2.70, valor: 94.64, area: 'Cozinha Quente' },
    { date: '13/06/2026', prod: 'Pao Frances', qtd: 2.25, valor: 1.80, area: 'Padaria / Lanches' },
    { date: '13/06/2026', prod: 'Macarrao', qtd: 2.65, valor: 13.26, area: 'Cozinha Quente' },
    { date: '13/06/2026', prod: 'Suco de Laranja', qtd: 3.32, valor: 11.62, area: 'Sucos / Bebidas' },
    { date: '13/06/2026', prod: 'Arroz', qtd: 0.90, valor: 4.05, area: 'Cozinha Quente' },
    { date: '14/06/2026', prod: 'Salada Verde', qtd: 2.03, valor: 12.17, area: 'Pré-Preparo / Saladas' },
    { date: '14/06/2026', prod: 'Macarrao', qtd: 2.18, valor: 10.91, area: 'Cozinha Quente' },
    { date: '14/06/2026', prod: 'Frango Grelhado', qtd: 3.19, valor: 70.22, area: 'Cozinha Quente' },
    { date: '14/06/2026', prod: 'Carne Bovina', qtd: 2.96, valor: 103.70, area: 'Cozinha Quente' },
    { date: '15/06/2026', prod: 'Suco de Laranja', qtd: 0.83, valor: 2.89, area: 'Sucos / Bebidas' },
    { date: '15/06/2026', prod: 'Carne Bovina', qtd: 1.53, valor: 53.38, area: 'Cozinha Quente' },
    { date: '15/06/2026', prod: 'Feijao', qtd: 1.24, valor: 9.90, area: 'Cozinha Quente' },
    { date: '15/06/2026', prod: 'Arroz', qtd: 1.61, valor: 7.26, area: 'Cozinha Quente' },
    { date: '16/06/2026', prod: 'Feijao', qtd: 1.74, valor: 13.94, area: 'Cozinha Quente' },
    { date: '16/06/2026', prod: 'Frango Grelhado', qtd: 2.10, valor: 46.11, area: 'Cozinha Quente' },
    { date: '16/06/2026', prod: 'Carne Bovina', qtd: 3.07, valor: 107.59, area: 'Cozinha Quente' },
    { date: '16/06/2026', prod: 'Arroz', qtd: 2.96, valor: 13.31, area: 'Cozinha Quente' },
    { date: '16/06/2026', prod: 'Salada Verde', qtd: 0.53, valor: 3.18, area: 'Pré-Preparo / Saladas' },
    { date: '17/06/2026', prod: 'Frango Grelhado', qtd: 3.19, valor: 70.20, area: 'Cozinha Quente' },
    { date: '17/06/2026', prod: 'Suco de Laranja', qtd: 1.46, valor: 5.10, area: 'Sucos / Bebidas' },
    { date: '17/06/2026', prod: 'Carne Bovina', qtd: 1.09, valor: 38.08, area: 'Cozinha Quente' },
    { date: '18/06/2026', prod: 'Frango Grelhado', qtd: 1.86, valor: 40.99, area: 'Cozinha Quente' },
    { date: '18/06/2026', prod: 'Carne Bovina', qtd: 1.91, valor: 66.95, area: 'Cozinha Quente' },
    { date: '18/06/2026', prod: 'Pao Frances', qtd: 2.45, valor: 1.96, area: 'Padaria / Lanches' },
    { date: '18/06/2026', prod: 'Salada Verde', qtd: 1.47, valor: 8.81, area: 'Pré-Preparo / Saladas' },
    { date: '19/06/2026', prod: 'Suco de Laranja', qtd: 2.03, valor: 7.10, area: 'Sucos / Bebidas' },
    { date: '19/06/2026', prod: 'Feijao', qtd: 2.99, valor: 23.91, area: 'Cozinha Quente' },
    { date: '19/06/2026', prod: 'Carne Bovina', qtd: 1.05, valor: 36.85, area: 'Cozinha Quente' },
    { date: '19/06/2026', prod: 'Frango Grelhado', qtd: 1.50, valor: 32.93, area: 'Cozinha Quente' },
    { date: '19/06/2026', prod: 'Macarrao', qtd: 2.98, valor: 14.88, area: 'Cozinha Quente' },
    { date: '20/06/2026', prod: 'Suco de Laranja', qtd: 2.03, valor: 7.11, area: 'Sucos / Bebidas' },
    { date: '20/06/2026', prod: 'Salada Verde', qtd: 1.64, valor: 9.86, area: 'Pré-Preparo / Saladas' },
    { date: '20/06/2026', prod: 'Macarrao', qtd: 1.02, valor: 5.09, area: 'Cozinha Quente' },
    { date: '20/06/2026', prod: 'Carne Bovina', qtd: 0.79, valor: 27.48, area: 'Cozinha Quente' },
    { date: '20/06/2026', prod: 'Pao Frances', qtd: 1.91, valor: 1.53, area: 'Padaria / Lanches' },
    { date: '21/06/2026', prod: 'Arroz', qtd: 2.38, valor: 10.70, area: 'Cozinha Quente' },
    { date: '21/06/2026', prod: 'Feijao', qtd: 1.85, valor: 14.80, area: 'Cozinha Quente' },
    { date: '21/06/2026', prod: 'Pao Frances', qtd: 1.59, valor: 1.27, area: 'Padaria / Lanches' },
    { date: '21/06/2026', prod: 'Carne Bovina', qtd: 1.07, valor: 37.52, area: 'Cozinha Quente' },
    { date: '22/06/2026', prod: 'Frango Grelhado', qtd: 2.70, valor: 59.40, area: 'Cozinha Quente' },
    { date: '22/06/2026', prod: 'Carne Bovina', qtd: 2.81, valor: 98.18, area: 'Cozinha Quente' },
    { date: '22/06/2026', prod: 'Pao Frances', qtd: 1.77, valor: 1.41, area: 'Padaria / Lanches' },
    { date: '22/06/2026', prod: 'Salada Verde', qtd: 1.20, valor: 7.21, area: 'Pré-Preparo / Saladas' },
    { date: '22/06/2026', prod: 'Suco de Laranja', qtd: 2.49, valor: 8.71, area: 'Sucos / Bebidas' },
    { date: '23/06/2026', prod: 'Macarrao', qtd: 1.73, valor: 8.65, area: 'Cozinha Quente' },
    { date: '23/06/2026', prod: 'Arroz', qtd: 0.90, valor: 4.05, area: 'Cozinha Quente' },
    { date: '23/06/2026', prod: 'Salada Verde', qtd: 2.83, valor: 17.00, area: 'Pré-Preparo / Saladas' },
    { date: '23/06/2026', prod: 'Suco de Laranja', qtd: 1.30, valor: 4.56, area: 'Sucos / Bebidas' },
    { date: '24/06/2026', prod: 'Feijao', qtd: 1.64, valor: 13.09, area: 'Cozinha Quente' },
    { date: '24/06/2026', prod: 'Salada Verde', qtd: 2.58, valor: 15.49, area: 'Pré-Preparo / Saladas' },
    { date: '24/06/2026', prod: 'Frango Grelhado', qtd: 2.66, valor: 58.41, area: 'Cozinha Quente' },
    { date: '24/06/2026', prod: 'Arroz', qtd: 1.15, valor: 5.17, area: 'Cozinha Quente' },
    { date: '25/06/2026', prod: 'Macarrao', qtd: 1.66, valor: 8.29, area: 'Cozinha Quente' },
    { date: '25/06/2026', prod: 'Frango Grelhado', qtd: 2.76, valor: 60.81, area: 'Cozinha Quente' },
    { date: '25/06/2026', prod: 'Carne Bovina', qtd: 1.34, valor: 46.80, area: 'Cozinha Quente' },
    { date: '25/06/2026', prod: 'Pao Frances', qtd: 2.75, valor: 2.20, area: 'Padaria / Lanches' },
    { date: '26/06/2026', prod: 'Arroz', qtd: 2.98, valor: 13.41, area: 'Cozinha Quente' },
    { date: '26/06/2026', prod: 'Frango Grelhado', qtd: 2.37, valor: 52.07, area: 'Cozinha Quente' },
    { date: '26/06/2026', prod: 'Feijao', qtd: 0.61, valor: 4.87, area: 'Cozinha Quente' },
    { date: '26/06/2026', prod: 'Pao Frances', qtd: 3.46, valor: 2.77, area: 'Padaria / Lanches' },
  ];

  for (const reg of registrosSobras) {
    const prodId = productsMap[reg.prod];
    const areaId = areasMap[reg.area];
    if (prodId && areaId) {
      await prisma.sobra.create({
        data: {
          produto_id: prodId,
          quantidade: reg.qtd,
          valor_perda: reg.valor,
          area_id: areaId,
          motivo: 'Sobra de Operação',
          data_sobra: parseDate(reg.date),
        },
      });
    }
  }

  console.log(`✅ Usuários criados: contato@techcosta.net e nutricaobetim@dialize.com.br`);
  console.log(`✅ Total de ${entradasImagens.length} entradas e ${registrosSobras.length} sobras diárias cadastradas com sucesso!`);
  console.log('🎉 Seed completo finalizado!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
