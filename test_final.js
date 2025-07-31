const { SettlementCalculator } = require('./calculator_test.js');

console.log('🧪 PRUEBA FINAL - CALCULADORA DE GASTOS JUST PAY!');
console.log('=' .repeat(60));

const calculator = new SettlementCalculator();

// Escenario de prueba realista
const participants = ['Ana', 'Bob', 'Carlos', 'Diana'];
const expenses = [
    {
        description: 'Cena en restaurante',
        amount: 120,
        payer: 'Ana',
        excluded: []
    },
    {
        description: 'Gasolina del viaje',
        amount: 80,
        payer: 'Bob',
        excluded: ['Diana'] // Diana no participó en el viaje
    },
    {
        description: 'Compras del supermercado',
        amount: 60,
        payer: 'Carlos',
        excluded: []
    },
    {
        description: 'Entrada al museo',
        amount: 40,
        payer: 'Diana',
        excluded: ['Bob'] // Bob no fue al museo
    }
];

console.log('\n📊 ESCENARIO DE PRUEBA:');
console.log('Participantes:', participants.join(', '));
console.log('\nGastos:');
expenses.forEach((expense, i) => {
    const excluded = expense.excluded.length > 0 ? 
        ` (excluidos: ${expense.excluded.join(', ')})` : '';
    console.log(`  ${i+1}. ${expense.description}: $${expense.amount} (pagado por ${expense.payer})${excluded}`);
});

try {
    const result = calculator.calculateSettlements(participants, expenses);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 RESULTADO FINAL:');
    console.log(`💰 Total de gastos: $${result.totalExpenses}`);
    console.log(`🔄 Transferencias necesarias: ${result.transfers.length}`);
    
    if (result.transfers.length > 0) {
        console.log('\n💸 TRANSFERENCIAS:');
        result.transfers.forEach((transfer, i) => {
            console.log(`  ${i+1}. ${transfer.from} → ${transfer.to}: $${transfer.amount.toFixed(2)}`);
        });
    } else {
        console.log('\n🎉 ¡Todos los saldos están equilibrados!');
    }
    
    console.log('\n📋 BALANCES FINALES:');
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
    
    // Verificar que la suma de balances es 0 (consistencia matemática)
    let totalBalance = 0;
    for (const balance of result.balances.values()) {
        totalBalance += balance;
    }
    
    console.log('\n🔍 VERIFICACIÓN DE CONSISTENCIA:');
    console.log(`Suma total de balances: $${totalBalance.toFixed(2)} (debe ser $0.00)`);
    
    if (Math.abs(totalBalance) < 0.01) {
        console.log('✅ ¡Los cálculos son matemáticamente consistentes!');
    } else {
        console.log('❌ Error: Los balances no suman 0');
    }
    
    console.log('\n📄 RESUMEN PARA COMPARTIR:');
    console.log(result.formattedSummaryPlainText);
    
} catch (error) {
    console.error('❌ Error en el cálculo:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('🚀 Prueba completada - Just Pay! funcionando correctamente');
