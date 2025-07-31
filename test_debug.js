const { SettlementCalculator } = require('./calculator_test.js');

console.log('🔍 DEPURACIÓN DEL CASO ESPECÍFICO');
console.log('=' .repeat(50));

const calculator = new SettlementCalculator();

// Escenario exacto del usuario
const participants = ['Ana', 'Carlos', 'Alan', 'Luis'];
const expenses = [
    {
        description: 'Carne',
        amount: 20000,
        payer: 'Ana',
        excluded: []
    },
    {
        description: 'Bebidas',
        amount: 10000,
        payer: 'Carlos',
        excluded: []
    }
];

console.log('\n📊 ESCENARIO:');
console.log('Participantes:', participants.join(', '));
console.log('Gastos:');
expenses.forEach((expense, i) => {
    console.log(`  ${i+1}. ${expense.description}: $${expense.amount} (pagado por ${expense.payer})`);
});

console.log('\n🧮 CÁLCULO MANUAL ESPERADO:');
console.log('Total gastos: $30,000');
console.log('Participantes: 4');
console.log('Cada uno debe: $30,000 ÷ 4 = $7,500');
console.log('\nBalances esperados:');
console.log('  Ana: Pagó $20,000 - debe $7,500 = +$12,500 (debe recibir)');
console.log('  Carlos: Pagó $10,000 - debe $7,500 = +$2,500 (debe recibir)');
console.log('  Alan: Pagó $0 - debe $7,500 = -$7,500 (debe pagar)');
console.log('  Luis: Pagó $0 - debe $7,500 = -$7,500 (debe pagar)');

console.log('\nTransferencias esperadas:');
console.log('  1. Alan → Ana: $7,500');
console.log('  2. Luis → Carlos: $2,500');  
console.log('  3. Luis → Ana: $5,000');

try {
    const result = calculator.calculateSettlements(participants, expenses);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 RESULTADO DEL ALGORITMO:');
    
    console.log('\n📋 BALANCES CALCULADOS:');
    for (const [participant, balance] of result.balances) {
        const formattedBalance = Math.abs(balance) < 0.01 ? 0 : balance;
        if (formattedBalance > 0) {
            console.log(`  ✅ ${participant}: +$${formattedBalance.toFixed(2)} (debe recibir)`);
        } else if (formattedBalance < 0) {
            console.log(`  ❌ ${participant}: $${Math.abs(formattedBalance).toFixed(2)} (debe pagar)`);
        } else {
            console.log(`  ⚖️ ${participant}: $0.00 (equilibrado)`);
        }
    }
    
    console.log('\n💸 TRANSFERENCIAS CALCULADAS:');
    result.transfers.forEach((transfer, i) => {
        console.log(`  ${i+1}. ${transfer.from} → ${transfer.to}: $${transfer.amount.toFixed(2)}`);
    });
    
    console.log('\n📄 RESUMEN GENERADO:');
    console.log(result.formattedSummaryPlainText);
    
} catch (error) {
    console.error('❌ Error:', error.message);
}

console.log('\n' + '='.repeat(50));
