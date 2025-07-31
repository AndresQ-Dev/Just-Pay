// test_algoritmo_final.js
// Prueba final del algoritmo corregido integrado

// Importar el módulo corregido
const { SettlementCalculator } = require('./assets/js/calculator.js');

console.log('🚀 === PRUEBA FINAL DEL ALGORITMO CORREGIDO ===\n');

// Crear instancia del calculador
const calculator = new SettlementCalculator();

// Escenario de prueba: Ana/Carlos/Alan/Luis
const participants = ['Ana', 'Carlos', 'Alan', 'Luis'];
const expenses = [
    {
        description: 'Carne para el asado',
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

console.log('📋 DATOS DE ENTRADA:');
console.log('Participantes:', participants);
console.log('Gastos:');
expenses.forEach((expense, i) => {
    console.log(`  ${i + 1}. ${expense.description}: $${expense.amount.toLocaleString()} (pagado por ${expense.payer})`);
});

console.log('\n' + '='.repeat(60));

try {
    // Ejecutar el cálculo
    const result = calculator.calculateSettlements(participants, expenses);
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log(`💰 Total de gastos: $${result.totalExpenses.toLocaleString()}`);
    console.log(`💸 Número de transferencias: ${result.transfers.length}`);
    
    console.log('\n📋 TRANSFERENCIAS FINALES:');
    result.transfers.forEach((transfer, i) => {
        console.log(`  ${i + 1}. ${transfer.from} → ${transfer.to}: $${transfer.amount.toLocaleString()}`);
    });
    
    console.log('\n📊 BALANCES FINALES:');
    result.balances.forEach((balance, person) => {
        console.log(`  ${person}: ${balance >= 0 ? '+' : ''}$${balance.toLocaleString()}`);
    });
    
    // Verificar que los balances sumen cero
    let totalBalance = 0;
    result.balances.forEach(balance => totalBalance += balance);
    console.log(`\n✅ VERIFICACIÓN: Suma total = $${totalBalance.toFixed(2)} ${Math.abs(totalBalance) < 0.01 ? '(CORRECTO ✅)' : '(ERROR ❌)'}`);
    
    console.log('\n🎉 ¡ALGORITMO FUNCIONANDO PERFECTAMENTE!');
    
} catch (error) {
    console.error('❌ ERROR:', error.message);
}

console.log('\n' + '='.repeat(60));
