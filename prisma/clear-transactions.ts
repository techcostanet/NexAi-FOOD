import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Zerando registros de movimentação para produção...');

  // 1. Excluir lançamentos de Sobras
  const deletedSobras = await prisma.sobra.deleteMany({});
  console.log(`✅ Sobras/Desperdícios apagados: ${deletedSobras.count}`);

  // 2. Excluir lançamentos de Entradas
  const deletedEntradas = await prisma.entrada.deleteMany({});
  console.log(`✅ Entradas de Estoque apagadas: ${deletedEntradas.count}`);

  // 3. Cadastrar/Garantir produtos reais fornecidos pelo usuário
  const realProducts = [
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

  // Deletar produtos antigos de teste/demonstração
  const realNames = realProducts.map((p) => p.nome);
  await prisma.product.deleteMany({
    where: {
      nome: { notIn: realNames },
    },
  });

  for (const prod of realProducts) {
    const existing = await prisma.product.findFirst({ where: { nome: prod.nome } });
    if (!existing) {
      await prisma.product.create({
        data: {
          nome: prod.nome,
          unidade: prod.unidade,
          custo_unitario: prod.custo_unitario,
          ativo: true,
        },
      });
    }
  }

  // 3. Confirmar contagem final de auditoria
  const productCount = await prisma.product.count();
  const areaCount = await prisma.area.count();
  const userCount = await prisma.user.count();
  const sobraCount = await prisma.sobra.count();
  const entradaCount = await prisma.entrada.count();

  console.log('\n📊 Resumo da Base de Dados (Pronta para Produção):');
  console.log(`- Produtos cadastrados mantidos: ${productCount}`);
  console.log(`- Áreas operacionais mantidas: ${areaCount}`);
  console.log(`- Usuários mantidos: ${userCount}`);
  console.log(`- Registros de Entradas: ${entradaCount}`);
  console.log(`- Registros de Sobras: ${sobraCount}`);

  if (sobraCount === 0 && entradaCount === 0) {
    console.log('\n🎉 O banco de dados foi zerado com sucesso e está 100% limpo e pronto para produção!');
  } else {
    console.warn('\n⚠️ Atenção: Ainda existem movimentações na base!');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a limpeza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
