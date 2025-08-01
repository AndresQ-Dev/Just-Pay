// test_escenario_problematico.js
// Prueba del escenario específico que tiene el problema

const { SettlementCalculator } = require('./assets/js/calculator.js');

console.log('🚀 === TEST DEL ESCENARIO PROBLEMÁTICO ===\n');

const calculator = new SettlementCalculator();

// Escenario problemático:
// Ana pagó carne $20,000
// Carlos pagó bebida $10,000 + postre $10,000 = $20,000
// Alan y Luis no pagaron nada
const participants = ['Ana', 'Carlos', 'Alan', 'Luis'];
const expenses = [
    {
        description: 'Carne',
        amount: 20000,
        payer: 'Ana',
        excluded: []
    },
    {
        description: 'Bebida',
        amount: 10000,
        payer: 'Carlos',
        excluded: []
    },
    {
        description: 'Postre',
        amount: 10000,
        payer: 'Carlos',
        excluded: []
    }
];

console.log('📋 ESCENARIO:');
console.log('Participantes:', participants);
console.log('Gastos:');
expenses.forEach((expense, i) => {
    console.log(`  ${i + 1}. ${expense.description}: $${expense.amount.toLocaleString()} (pagado por ${expense.payer})`);
});
console.log('Total esperado: $40,000');
console.log('Cada persona debe: $10,000');

console.log('\n📊 ANÁLISIS ESPERADO:');
console.log('  Ana: Pagó $20,000 - Debe $10,000 = +$10,000 (debe recibir)');
console.log('  Carlos: Pagó $20,000 - Debe $10,000 = +$10,000 (debe recibir)');
console.log('  Alan: Pagó $0 - Debe $10,000 = -$10,000 (debe pagar)');
console.log('  Luis: Pagó $0 - Debe $10,000 = -$10,000 (debe pagar)');

console.log('\n🎯 TRANSFERENCIAS ÓPTIMAS ESPERADAS (solo 2):');
console.log('  1. Alan → Ana: $10,000');
console.log('  2. Luis → Carlos: $10,000');

console.log('\n' + '='.repeat(60));

try {
    const result = calculator.calculateSettlements(participants, expenses);
    
    console.log('\n🎯 RESULTADO DEL ALGORITMO:');
    console.log(`💰 Total: $${result.totalExpenses.toLocaleString()}`);
    console.log(`💸 Transferencias: ${result.transfers.length}`);
    
    console.log('\n📋 TRANSFERENCIAS GENERADAS:');
    result.transfers.forEach((transfer, i) => {
        console.log(`  ${i + 1}. ${transfer.from} → ${transfer.to}: $${transfer.amount.toLocaleString()}`);
    });
    
    console.log('\n📊 BALANCES:');
    result.balances.forEach((balance, person) => {
        console.log(`  ${person}: ${balance >= 0 ? '+' : ''}$${balance.toLocaleString()}`);
    });
    
    // Análisis del resultado
    console.log('\n🔍 ANÁLISIS:');
    if (result.transfers.length === 2) {
        console.log('✅ CORRECTO: Número mínimo de transferencias (2)');
    } else {
        console.log(`❌ INCORRECTO: ${result.transfers.length} transferencias en lugar de 2 óptimas`);
    }
    
    console.log('\n📝 RESUMEN TEXTO PLANO:');
    console.log(result.formattedSummaryPlainText);
    
} catch (error) {
    console.error('❌ ERROR:', error.message);
}

console.log('\n' + '='.repeat(60));
