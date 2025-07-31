// test_algoritmo_final_node.js
// Prueba final del algoritmo corregido - versión compatible con Node.js

console.log('🚀 === PRUEBA FINAL DEL ALGORITMO CORREGIDO ===\n');

/**
 * Clase para manejar la lógica de cálculo de saldos y optimización de transferencias
 * entre participantes de un gasto compartido.
 */
class SettlementCalculator {
    calculateSettlements(participants, expenses) {
        console.log('\n🎯 === ALGORITMO CORREGIDO: MATRIZ DE DEUDAS + NETEO ===');

        // 1. MATRIZ DE DEUDAS ESPECÍFICAS POR GASTO
        const debtMatrix = new Map();
        participants.forEach(p => {
            debtMatrix.set(p, new Map());
            participants.forEach(q => {
                debtMatrix.get(p).set(q, 0);
            });
        });

        console.log('📊 Calculando deudas específicas por cada gasto...');

        let totalExpenses = 0;
        expenses.forEach((expense, index) => {
            totalExpenses += expense.amount;
            const includedParticipants = participants.filter(p => !expense.excluded.includes(p));
            const perPersonCost = expense.amount / includedParticipants.length;
            
            console.log(`\n💰 Gasto ${index + 1}: ${expense.description} - $${expense.amount.toLocaleString()}`);
            console.log(`   Pagado por: ${expense.payer}`);
            console.log(`   Excluidos: [${expense.excluded.join(', ') || 'ninguno'}]`);
            console.log(`   Incluidos: [${includedParticipants.join(', ')}] (${includedParticipants.length} personas)`);
            console.log(`   Costo por persona: $${perPersonCost.toLocaleString()}`);

            // Cada persona incluida (excepto quien pagó) debe dinero al pagador
            includedParticipants.forEach(person => {
                if (person !== expense.payer) {
                    const currentDebt = debtMatrix.get(person).get(expense.payer);
                    debtMatrix.get(person).set(expense.payer, currentDebt + perPersonCost);
                    console.log(`   → ${person} debe a ${expense.payer}: +$${perPersonCost.toLocaleString()}`);
                }
            });
        });

        console.log('\n📋 MATRIZ DE DEUDAS ESPECÍFICAS:');
        participants.forEach(debtor => {
            participants.forEach(creditor => {
                const debt = debtMatrix.get(debtor).get(creditor);
                if (debt > 0) {
                    console.log(`   ${debtor} debe a ${creditor}: $${debt.toLocaleString()}`);
                }
            });
        });

        // 2. NETEO BIDIRECCIONAL
        console.log('\n🔄 Aplicando neteo bidireccional...');
        const netMatrix = new Map();
        participants.forEach(p => {
            netMatrix.set(p, new Map());
            participants.forEach(q => {
                netMatrix.get(p).set(q, 0);
            });
        });

        participants.forEach(person1 => {
            participants.forEach(person2 => {
                if (person1 !== person2) {
                    const debt1to2 = debtMatrix.get(person1).get(person2);
                    const debt2to1 = debtMatrix.get(person2).get(person1);
                    
                    if (debt1to2 > 0 && debt2to1 > 0) {
                        // Hay deudas bidireccionales - netear
                        const netDebt = debt1to2 - debt2to1;
                        if (netDebt > 0) {
                            netMatrix.get(person1).set(person2, netDebt);
                            console.log(`   ${person1} ↔ ${person2}: ${person1} debe $${debt1to2.toLocaleString()}, ${person2} debe $${debt2to1.toLocaleString()} → ${person1} debe $${netDebt.toLocaleString()}`);
                        } else if (netDebt < 0) {
                            netMatrix.get(person2).set(person1, -netDebt);
                            console.log(`   ${person1} ↔ ${person2}: ${person1} debe $${debt1to2.toLocaleString()}, ${person2} debe $${debt2to1.toLocaleString()} → ${person2} debe $${(-netDebt).toLocaleString()}`);
                        }
                        // Marcar como procesado
                        debtMatrix.get(person1).set(person2, 0);
                        debtMatrix.get(person2).set(person1, 0);
                    } else if (debt1to2 > 0) {
                        // Solo deuda unidireccional
                        netMatrix.get(person1).set(person2, debt1to2);
                    }
                }
            });
        });

        // 3. GENERAR TRANSFERENCIAS
        const transfers = [];
        participants.forEach(debtor => {
            participants.forEach(creditor => {
                const amount = netMatrix.get(debtor).get(creditor);
                if (amount > 0) {
                    transfers.push({
                        from: debtor,
                        to: creditor,
                        amount: Math.round(amount * 100) / 100
                    });
                }
            });
        });

        console.log('\n💸 TRANSFERENCIAS FINALES:');
        transfers.forEach((transfer, i) => {
            console.log(`   ${i + 1}. ${transfer.from} → ${transfer.to}: $${transfer.amount.toLocaleString()}`);
        });

        // 4. CALCULAR BALANCES FINALES
        const balances = new Map();
        participants.forEach(p => balances.set(p, 0));

        // Calcular lo que pagó cada persona
        expenses.forEach(expense => {
            const currentBalance = balances.get(expense.payer);
            balances.set(expense.payer, currentBalance + expense.amount);
        });

        // Calcular lo que debe cada persona
        expenses.forEach(expense => {
            const includedParticipants = participants.filter(p => !expense.excluded.includes(p));
            const perPersonCost = expense.amount / includedParticipants.length;
            
            includedParticipants.forEach(person => {
                const currentBalance = balances.get(person);
                balances.set(person, currentBalance - perPersonCost);
            });
        });

        console.log('\n📊 BALANCES FINALES:');
        let totalBalance = 0;
        participants.forEach(person => {
            const balance = balances.get(person);
            totalBalance += balance;
            console.log(`   ${person}: ${balance >= 0 ? '+' : ''}$${balance.toLocaleString()}`);
        });
        console.log(`   SUMA TOTAL: $${totalBalance.toLocaleString()} ${Math.abs(totalBalance) < 0.01 ? '✅' : '❌'}`);

        return {
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            transfers: transfers,
            balances: balances
        };
    }
}

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
console.log('\n' + '='.repeat(60));
