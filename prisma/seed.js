"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed do banco de dados Controle de Sobras...');
    // Limpar tabelas existentes em ordem
    await prisma.sobra.deleteMany();
    await prisma.entrada.deleteMany();
    await prisma.product.deleteMany();
    await prisma.area.deleteMany();
    await prisma.user.deleteMany();
    // 1. Criar Usuários
    const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
    const commonPassword = await bcryptjs_1.default.hash('senha123', 10);
    const admin = await prisma.user.create({
        data: {
            nome: 'Carlos Costa (Gerente)',
            email: 'admin@controledesobras.com',
            senha_hash: adminPassword,
            role: 'Admin',
            ativo: true,
        },
    });
    const chef = await prisma.user.create({
        data: {
            nome: 'Chef Ricardo Oliveira',
            email: 'chef@cozinha.com',
            senha_hash: commonPassword,
            role: 'Comum',
            ativo: true,
        },
    });
    const auxiliar = await prisma.user.create({
        data: {
            nome: 'Ana Souza (Pré-preparo)',
            email: 'ana@cozinha.com',
            senha_hash: commonPassword,
            role: 'Comum',
            ativo: false,
        },
    });
    console.log('✅ Usuários criados:', [admin.email, chef.email, auxiliar.email]);
    // 2. Criar Áreas
    const areasData = [
        'Cozinha Quente',
        'Pré-Preparo / Saladas',
        'Buffet / Balcão',
        'Confeitaria / Sobremesas',
        'Estoque / Câmara Fria',
    ];
    const areasMap = {};
    for (const nome of areasData) {
        const created = await prisma.area.create({ data: { nome } });
        areasMap[nome] = created.id;
    }
    console.log('✅ Áreas criadas:', Object.keys(areasMap));
    // 3. Criar Produtos
    const productsData = [
        { nome: 'Filé Mignon Bovino', unidade: 'kg', custo_unitario: 68.50 },
        { nome: 'Peito de Frango Desossado', unidade: 'kg', custo_unitario: 22.90 },
        { nome: 'Tomate Italiano', unidade: 'kg', custo_unitario: 8.50 },
        { nome: 'Queijo Mozzarella Fatiado', unidade: 'kg', custo_unitario: 44.00 },
        { nome: 'Azeite Extravirgem 500ml', unidade: 'L', custo_unitario: 38.00 },
        { nome: 'Farinha de Trigo Especial', unidade: 'kg', custo_unitario: 5.20 },
        { nome: 'Batata Monalisa', unidade: 'kg', custo_unitario: 6.80 },
        { nome: 'Arroz Tipo 1 (5kg)', unidade: 'kg', custo_unitario: 6.00 },
        { nome: 'Feijão Carioca', unidade: 'kg', custo_unitario: 7.90 },
        { nome: 'Creme de Leite Fresco', unidade: 'L', custo_unitario: 26.00 },
        { nome: 'Salmão Fresco em Postas', unidade: 'kg', custo_unitario: 89.90, ativo: false },
    ];
    const productsMap = {};
    for (const prod of productsData) {
        const created = await prisma.product.create({
            data: {
                nome: prod.nome,
                unidade: prod.unidade,
                custo_unitario: prod.custo_unitario,
                ativo: prod.ativo ?? true,
            },
        });
        productsMap[prod.nome] = { id: created.id, custo: prod.custo_unitario, unidade: prod.unidade };
    }
    console.log('✅ Produtos criados:', Object.keys(productsMap).length);
    // 4. Criar Entradas (Histórico de Insumos dos últimos 30 dias)
    const now = new Date();
    // Helper para gerar datas passadas
    const subDays = (days) => {
        const d = new Date(now);
        d.setDate(d.getDate() - days);
        return d;
    };
    const entradasSeeds = [
        { prod: 'Filé Mignon Bovino', qtd: 40, dias: 25, obs: 'Compra quinzenal frigorífico' },
        { prod: 'Filé Mignon Bovino', qtd: 35, dias: 10, obs: 'Reposição final de semana' },
        { prod: 'Peito de Frango Desossado', qtd: 80, dias: 28, obs: 'Lote semanal' },
        { prod: 'Peito de Frango Desossado', qtd: 75, dias: 14, obs: 'Lote semanal' },
        { prod: 'Peito de Frango Desossado', qtd: 60, dias: 2, obs: 'Lote recente' },
        { prod: 'Tomate Italiano', qtd: 100, dias: 20, obs: 'CEASA semanal' },
        { prod: 'Tomate Italiano', qtd: 90, dias: 12, obs: 'CEASA semanal' },
        { prod: 'Tomate Italiano', qtd: 85, dias: 4, obs: 'CEASA recente' },
        { prod: 'Queijo Mozzarella Fatiado', qtd: 30, dias: 22, obs: 'Laticínios Santo Antônio' },
        { prod: 'Queijo Mozzarella Fatiado', qtd: 25, dias: 7, obs: 'Reposição laticínios' },
        { prod: 'Azeite Extravirgem 500ml', qtd: 20, dias: 26, obs: 'Caixa fechada 20L' },
        { prod: 'Farinha de Trigo Especial', qtd: 150, dias: 29, obs: 'Fardo de 50kg x3' },
        { prod: 'Batata Monalisa', qtd: 120, dias: 18, obs: 'Saco grande' },
        { prod: 'Batata Monalisa', qtd: 100, dias: 5, obs: 'Saco grande' },
        { prod: 'Arroz Tipo 1 (5kg)', qtd: 200, dias: 25, obs: 'Estoque mensal' },
        { prod: 'Feijão Carioca', qtd: 100, dias: 25, obs: 'Estoque mensal' },
        { prod: 'Creme de Leite Fresco', qtd: 40, dias: 15, obs: 'Para sobremesas e molhos' },
        { prod: 'Creme de Leite Fresco', qtd: 30, dias: 3, obs: 'Reposição recente' },
    ];
    for (const item of entradasSeeds) {
        const p = productsMap[item.prod];
        if (p) {
            await prisma.entrada.create({
                data: {
                    produto_id: p.id,
                    quantidade: item.qtd,
                    valor_total: item.qtd * p.custo,
                    data_entrada: subDays(item.dias),
                    observacao: item.obs,
                },
            });
        }
    }
    console.log('✅ Entradas registradas!');
    // 5. Criar Sobras (Registros de Desperdício nos últimos 30 dias)
    const sobrasSeeds = [
        // Hoje
        { prod: 'Tomate Italiano', qtd: 4.5, area: 'Pré-Preparo / Saladas', motivo: 'Tomates muito maduros / descarte', dias: 0 },
        { prod: 'Batata Monalisa', qtd: 3.2, area: 'Cozinha Quente', motivo: 'Sobra de fritura / descarte', dias: 0 },
        { prod: 'Filé Mignon Bovino', qtd: 0.8, area: 'Cozinha Quente', motivo: 'Apara excessiva na limpeza', dias: 0 },
        // Esta Semana (1-6 dias atrás)
        { prod: 'Peito de Frango Desossado', qtd: 5.0, area: 'Cozinha Quente', motivo: 'Excesso de produção na grelha', dias: 1 },
        { prod: 'Queijo Mozzarella Fatiado', qtd: 1.5, area: 'Buffet / Balcão', motivo: 'Sobras expostas no buffet', dias: 2 },
        { prod: 'Creme de Leite Fresco', qtd: 2.0, area: 'Confeitaria / Sobremesas', motivo: 'Validade aproximada / talhado', dias: 3 },
        { prod: 'Tomate Italiano', qtd: 6.0, area: 'Pré-Preparo / Saladas', motivo: 'Dano no transporte / amassado', dias: 4 },
        { prod: 'Arroz Tipo 1 (5kg)', qtd: 8.0, area: 'Buffet / Balcão', motivo: 'Excesso de cozimento fim de expediente', dias: 5 },
        { prod: 'Filé Mignon Bovino', qtd: 1.2, area: 'Cozinha Quente', motivo: 'Sobra de grelhados', dias: 6 },
        // Semanas Anteriores (7-28 dias atrás)
        { prod: 'Feijão Carioca', qtd: 6.5, area: 'Cozinha Quente', motivo: 'Sobra de caldeirão', dias: 8 },
        { prod: 'Tomate Italiano', qtd: 8.0, area: 'Pré-Preparo / Saladas', motivo: 'Casca danificada / podridão', dias: 11 },
        { prod: 'Queijo Mozzarella Fatiado', qtd: 2.2, area: 'Buffet / Balcão', motivo: 'Ressecamento na pista fria', dias: 14 },
        { prod: 'Peito de Frango Desossado', qtd: 6.5, area: 'Cozinha Quente', motivo: 'Sobras de travessa do almoço', dias: 16 },
        { prod: 'Batata Monalisa', qtd: 7.0, area: 'Pré-Preparo / Saladas', motivo: 'Casca grossa / brotos', dias: 19 },
        { prod: 'Filé Mignon Bovino', qtd: 2.5, area: 'Cozinha Quente', motivo: 'Queimado no ponto de cozimento', dias: 21 },
        { prod: 'Azeite Extravirgem 500ml', qtd: 0.5, area: 'Cozinha Quente', motivo: 'Derramamento em bancada', dias: 23 },
        { prod: 'Farinha de Trigo Especial', qtd: 4.0, area: 'Confeitaria / Sobremesas', motivo: 'Umidade no saco de armazenamento', dias: 27 },
    ];
    for (const s of sobrasSeeds) {
        const p = productsMap[s.prod];
        const areaId = areasMap[s.area];
        if (p && areaId) {
            await prisma.sobra.create({
                data: {
                    produto_id: p.id,
                    quantidade: s.qtd,
                    valor_perda: s.qtd * p.custo,
                    area_id: areaId,
                    motivo: s.motivo,
                    data_sobra: subDays(s.dias),
                },
            });
        }
    }
    console.log('✅ Sobras (Desperdício) registradas!');
    console.log('🎉 Seed finalizado com sucesso!');
}
main()
    .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
