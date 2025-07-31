// Prueba del algoritmo corregido con el ejemplo específico
class SettlementCalculator {
    calculateSettlements(participants, expenses) {
        console.log('\n🎯 === INICIANDO CÁLCULO CORRECTO DE TRANSFERENCIAS ===');

        let totalExpenses = 0;
        
        // Matriz de deudas: [deudor][acreedor] = monto
        const debtMatrix = new Map();
        participants.forEach(p1 => {
            debtMatrix.set(p1, new Map());
            participants.forEach(p2 => {
                debtMatrix.get(p1).set(p2, 0);
            });
        });

        // 1. Calcular las deudas directas por cada gasto
        console.log('\n📋 Procesando gastos individuales:');
        expenses.forEach((expense, index) => {
            const amount = parseFloat(expense.amount);
            const payer = expense.payer;
            const excluded = expense.excluded || [];

            totalExpenses += amount;

            // Filtrar participantes activos (aquellos que NO están excluidos de este gasto)
            const activeParticipants = participants.filter(p => !excluded.includes(p));

            if (activeParticipants.length === 0) {
                console.log(`⚠️ Gasto "${expense.description}": No hay participantes activos, se asigna solo al pagador`);
                return;
            }

            // Calcular la parte que le corresponde a cada participante activo
            const sharePerPerson = amount / activeParticipants.length;

            console.log(`\n  Gasto ${index + 1}: ${expense.description} - $${amount} (pagado por ${payer})`);
            console.log(`    👥 Participantes: ${activeParticipants.join(', ')} (${activeParticipants.length} personas)`);
            console.log(`    💵 Parte por persona: $${sharePerPerson.toFixed(2)}`);

            // Cada participante activo (excepto el pagador) debe su parte al pagador
            activeParticipants.forEach(participant => {
                if (participant !== payer) {
                    const currentDebt = debtMatrix.get(participant).get(payer);
                    debtMatrix.get(participant).set(payer, currentDebt + sharePerPerson);
                    console.log(`    💸 ${participant} debe a ${payer}: +$${sharePerPerson.toFixed(2)} (total: $${(currentDebt + sharePerPerson).toFixed(2)})`);
                }
            });
        });

        // 2. Netear las deudas bidireccionales
        console.log('\n🔄 Neteando transferencias bidireccionales:');
        const finalTransfers = [];
        
        for (let i = 0; i < participants.length; i++) {
            for (let j = i + 1; j < participants.length; j++) {
                const person1 = participants[i];
                const person2 = participants[j];
                
                const debt1to2 = debtMatrix.get(person1).get(person2);
                const debt2to1 = debtMatrix.get(person2).get(person1);
                
                if (debt1to2 > 0 || debt2to1 > 0) {
                    console.log(`  🔍 ${person1} ↔ ${person2}: ${person1} debe $${debt1to2.toFixed(2)}, ${person2} debe $${debt2to1.toFixed(2)}`);
                    
                    if (debt1to2 > debt2to1) {
                        const netAmount = debt1to2 - debt2to1;
                        if (netAmount > 0.01) {
                            finalTransfers.push({
                                from: person1,
                                to: person2,
                                amount: Math.round(netAmount * 100) / 100
                            });
                            console.log(`    ✅ Transferencia neta: ${person1} → ${person2}: $${netAmount.toFixed(2)}`);
                        }
                    } else if (debt2to1 > debt1to2) {
                        const netAmount = debt2to1 - debt1to2;
                        if (netAmount > 0.01) {
                            finalTransfers.push({
                                from: person2,
                                to: person1,
                                amount: Math.round(netAmount * 100) / 100
                            });
                            console.log(`    ✅ Transferencia neta: ${person2} → ${person1}: $${netAmount.toFixed(2)}`);
                        }
                    } else {
                        console.log(`    ⚖️ Deudas equilibradas, no se requiere transferencia`);
                    }
                }
            }
        }

        return {
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            transfers: finalTransfers
        };
    }
}

console.log('🧪 PRUEBA DEL ALGORITMO CORREGIDO');
console.log('=' .repeat(60));

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

console.log('\n🧮 LÓGICA ESPERADA:');
console.log('1. Por el gasto de Ana ($20,000):');
console.log('   - Carlos debe a Ana: $5,000');
console.log('   - Alan debe a Ana: $5,000');
console.log('   - Luis debe a Ana: $5,000');
console.log('');
console.log('2. Por el gasto de Carlos ($10,000):');
console.log('   - Ana debe a Carlos: $2,500');
console.log('   - Alan debe a Carlos: $2,500');
console.log('   - Luis debe a Carlos: $2,500');
console.log('');
console.log('3. Neteo Ana ↔ Carlos:');
console.log('   - Ana debe $2,500, recibe $5,000 → Carlos debe a Ana $2,500');
console.log('');
console.log('4. Transferencias finales esperadas:');
console.log('   - Carlos → Ana: $2,500');
console.log('   - Alan → Ana: $5,000');
console.log('   - Alan → Carlos: $2,500');
console.log('   - Luis → Ana: $5,000');
console.log('   - Luis → Carlos: $2,500');

try {
    const result = calculator.calculateSettlements(participants, expenses);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 RESULTADO DEL ALGORITMO CORREGIDO:');
    
    console.log('\n💸 TRANSFERENCIAS CALCULADAS:');
    result.transfers.forEach((transfer, i) => {
        console.log(`  ${i+1}. ${transfer.from} → ${transfer.to}: $${transfer.amount.toFixed(2)}`);
    });
    
    console.log(`\n💰 Total de gastos: $${result.totalExpenses}`);
    console.log(`🔄 Número de transferencias: ${result.transfers.length}`);
    
} catch (error) {
    console.error('❌ Error:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('🚀 Prueba completada');
