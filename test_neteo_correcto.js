// Test del algoritmo corregido con neteo bidireccional
class SettlementCalculator {
    calculateSettlements(participants, expenses) {
        console.log('\n🎯 === INICIANDO CÁLCULO CORRECTO DE TRANSFERENCIAS ===');

        let totalExpenses = 0;
        
        // Matriz de deudas específicas: [deudor][acreedor] = monto
        const debtMatrix = new Map();
        participants.forEach(p1 => {
            debtMatrix.set(p1, new Map());
            participants.forEach(p2 => {
                debtMatrix.get(p1).set(p2, 0);
            });
        });

        // 1. Calcular deudas específicas por cada gasto individual
        console.log('\n📋 Procesando gastos individuales:');
        expenses.forEach((expense, index) => {
            const amount = parseFloat(expense.amount);
            const payer = expense.payer;
            const excluded = expense.excluded || [];

            totalExpenses += amount;

            // Filtrar participantes activos en este gasto específico
            const activeParticipants = participants.filter(p => !excluded.includes(p));

            if (activeParticipants.length === 0) {
                console.log(`⚠️ Gasto "${expense.description}": No hay participantes activos`);
                return;
            }

            // Calcular la parte que le corresponde a cada participante activo
            const sharePerPerson = amount / activeParticipants.length;

            console.log(`\n  Gasto ${index + 1}: ${expense.description} - $${amount} (pagado por ${payer})`);
            console.log(`    👥 Participantes: ${activeParticipants.join(', ')} (${activeParticipants.length} personas)`);
            console.log(`    💵 Parte por persona: $${sharePerPerson.toFixed(2)}`);

            // Cada participante activo (excepto el pagador) debe su parte específicamente al pagador
            activeParticipants.forEach(participant => {
                if (participant !== payer) {
                    const currentDebt = debtMatrix.get(participant).get(payer);
                    debtMatrix.get(participant).set(payer, currentDebt + sharePerPerson);
                    console.log(`    💸 ${participant} debe a ${payer}: +$${sharePerPerson.toFixed(2)} (total específico: $${(currentDebt + sharePerPerson).toFixed(2)})`);
                }
            });
        });

        // 2. Mostrar matriz de deudas antes del neteo
        console.log('\n📊 Matriz de deudas específicas antes del neteo:');
        for (const [debtor, creditors] of debtMatrix) {
            for (const [creditor, amount] of creditors) {
                if (amount > 0.01) {
                    console.log(`  ${debtor} debe a ${creditor}: $${amount.toFixed(2)}`);
                }
            }
        }

        // 3. Netear las deudas bidireccionales para minimizar transferencias
        console.log('\n🔄 Aplicando neteo bidireccional:');
        const finalTransfers = [];
        
        for (let i = 0; i < participants.length; i++) {
            for (let j = i + 1; j < participants.length; j++) {
                const person1 = participants[i];
                const person2 = participants[j];
                
                const debt1to2 = debtMatrix.get(person1).get(person2);
                const debt2to1 = debtMatrix.get(person2).get(person1);
                
                if (debt1to2 > 0.01 || debt2to1 > 0.01) {
                    console.log(`  🔍 ${person1} ↔ ${person2}: ${person1} debe $${debt1to2.toFixed(2)}, ${person2} debe $${debt2to1.toFixed(2)}`);
                    
                    if (debt1to2 > debt2to1 + 0.01) {
                        const netAmount = debt1to2 - debt2to1;
                        finalTransfers.push({
                            from: person1,
                            to: person2,
                            amount: Math.round(netAmount * 100) / 100
                        });
                        console.log(`    ✅ Transferencia neta: ${person1} → ${person2}: $${netAmount.toFixed(2)}`);
                    } else if (debt2to1 > debt1to2 + 0.01) {
                        const netAmount = debt2to1 - debt1to2;
                        finalTransfers.push({
                            from: person2,
                            to: person1,
                            amount: Math.round(netAmount * 100) / 100
                        });
                        console.log(`    ✅ Transferencia neta: ${person2} → ${person1}: $${netAmount.toFixed(2)}`);
                    } else {
                        console.log(`    ⚖️ Deudas equilibradas (diferencia: $${Math.abs(debt1to2 - debt2to1).toFixed(2)}), no se requiere transferencia`);
                    }
                }
            }
        }

        return {
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            transfers: finalTransfers,
            debtMatrix: debtMatrix
        };
    }
}

console.log('🧪 PRUEBA DEL ALGORITMO CORREGIDO CON NETEO BIDIRECCIONAL');
console.log('=' .repeat(70));

const calculator = new SettlementCalculator();

// Escenario del usuario: Ana y Carlos
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

console.log('\n🧮 LÓGICA ESPERADA CON NETEO:');
console.log('1. Deudas específicas por gasto:');
console.log('   Por carne de Ana ($20,000):');
console.log('     - Carlos debe a Ana: $5,000');
console.log('     - Alan debe a Ana: $5,000');
console.log('     - Luis debe a Ana: $5,000');
console.log('');
console.log('   Por bebidas de Carlos ($10,000):');
console.log('     - Ana debe a Carlos: $2,500');
console.log('     - Alan debe a Carlos: $2,500');
console.log('     - Luis debe a Carlos: $2,500');
console.log('');
console.log('2. Neteo bidireccional:');
console.log('   Ana ↔ Carlos: Ana debe $2,500, Carlos debe $5,000');
console.log('   → Carlos debe a Ana: $2,500 (neto)');
console.log('   Alan ↔ Ana: Alan debe $5,000, Ana debe $0');
console.log('   → Alan debe a Ana: $5,000');
console.log('   Alan ↔ Carlos: Alan debe $2,500, Carlos debe $0');
console.log('   → Alan debe a Carlos: $2,500');
console.log('   Luis ↔ Ana: Luis debe $5,000, Ana debe $0');
console.log('   → Luis debe a Ana: $5,000');
console.log('   Luis ↔ Carlos: Luis debe $2,500, Carlos debe $0');
console.log('   → Luis debe a Carlos: $2,500');
console.log('');
console.log('3. Transferencias finales esperadas:');
console.log('   - Carlos → Ana: $2,500');
console.log('   - Alan → Ana: $5,000');
console.log('   - Alan → Carlos: $2,500');
console.log('   - Luis → Ana: $5,000');
console.log('   - Luis → Carlos: $2,500');

try {
    const result = calculator.calculateSettlements(participants, expenses);
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 RESULTADO DEL ALGORITMO CORREGIDO:');
    
    console.log('\n💸 TRANSFERENCIAS FINALES:');
    if (result.transfers.length === 0) {
        console.log('  ✅ No se necesitan transferencias (todos equilibrados)');
    } else {
        result.transfers.forEach((transfer, i) => {
            console.log(`  ${i+1}. ${transfer.from} → ${transfer.to}: $${transfer.amount.toFixed(2)}`);
        });
    }
    
    console.log(`\n💰 Total de gastos: $${result.totalExpenses}`);
    console.log(`🔄 Número de transferencias: ${result.transfers.length}`);
    
    // Verificar que las transferencias equilibran
    console.log('\n🔍 VERIFICACIÓN:');
    const balanceCheck = new Map();
    participants.forEach(p => balanceCheck.set(p, 0));
    
    // Simular transferencias
    result.transfers.forEach(transfer => {
        balanceCheck.set(transfer.from, balanceCheck.get(transfer.from) - transfer.amount);
        balanceCheck.set(transfer.to, balanceCheck.get(transfer.to) + transfer.amount);
    });
    
    // Mostrar balances después de transferencias
    for (const [participant, balance] of balanceCheck) {
        console.log(`  ${participant}: ${balance >= 0 ? '+' : ''}$${balance.toFixed(2)} después de transferencias`);
    }
    
    // Verificar suma total
    let totalBalance = 0;
    for (const balance of balanceCheck.values()) {
        totalBalance += balance;
    }
    console.log(`  Suma total: $${totalBalance.toFixed(2)} (debe ser $0.00)`);
    
    if (Math.abs(totalBalance) < 0.01) {
        console.log('  ✅ Las transferencias están equilibradas correctamente');
    } else {
        console.log('  ❌ Error: Las transferencias no equilibran');
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
}

console.log('\n' + '='.repeat(70));
console.log('🚀 Prueba completada');
