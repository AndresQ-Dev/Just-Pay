// Test exhaustivo del algoritmo CORREGIDO de Just Pay!
class SettlementCalculator {
    calculateSettlements(participants, expenses) {
        console.log('\n🎯 === INICIANDO CÁLCULO CORRECTO DE TRANSFERENCIAS ===');

        // 1. Calcular cuánto debe pagar cada persona y cuánto pagó
        const totalGlobalDebt = new Map(); // Lo que cada persona debe en total
        const totalPaid = new Map(); // Lo que cada persona pagó
        
        // Inicializar
        participants.forEach(p => {
            totalGlobalDebt.set(p, 0);
            totalPaid.set(p, 0);
        });

        let totalExpenses = 0;

        console.log('\n📋 Procesando gastos individuales:');
        
        // Procesar cada gasto
        expenses.forEach((expense, index) => {
            const amount = parseFloat(expense.amount);
            const payer = expense.payer;
            const excluded = expense.excluded || [];

            totalExpenses += amount;

            // Participantes activos en este gasto
            const activeParticipants = participants.filter(p => !excluded.includes(p));
            
            if (activeParticipants.length === 0) {
                console.log(`⚠️ Gasto "${expense.description}": No hay participantes activos`);
                return;
            }

            const sharePerPerson = amount / activeParticipants.length;

            console.log(`\n  Gasto ${index + 1}: ${expense.description} - $${amount} (pagado por ${payer})`);
            console.log(`    👥 Participantes: ${activeParticipants.join(', ')} (${activeParticipants.length} personas)`);
            console.log(`    💵 Parte por persona: $${sharePerPerson.toFixed(2)}`);

            // El pagador suma al total que pagó
            totalPaid.set(payer, totalPaid.get(payer) + amount);
            console.log(`    ✅ ${payer} pagó: $${amount} (total pagado: $${totalPaid.get(payer).toFixed(2)})`);

            // Cada participante activo debe su parte
            activeParticipants.forEach(participant => {
                const currentDebt = totalGlobalDebt.get(participant);
                totalGlobalDebt.set(participant, currentDebt + sharePerPerson);
                console.log(`    💸 ${participant} debe: +$${sharePerPerson.toFixed(2)} (total debe: $${(currentDebt + sharePerPerson).toFixed(2)})`);
            });
        });

        // 2. Calcular balance final de cada persona
        console.log('\n� Calculando balances finales:');
        const finalBalances = new Map();
        
        participants.forEach(participant => {
            const paid = totalPaid.get(participant);
            const owes = totalGlobalDebt.get(participant);
            const balance = paid - owes; // Positivo = debe recibir, Negativo = debe pagar
            
            finalBalances.set(participant, balance);
            
            console.log(`  ${participant}: Pagó $${paid.toFixed(2)} - debe $${owes.toFixed(2)} = ${balance >= 0 ? '+' : ''}$${balance.toFixed(2)}`);
        });

        // 3. Crear transferencias directas (sin optimización compleja)
        console.log('\n💸 Generando transferencias:');
        const transfers = [];
        
        const creditors = []; // Personas que deben recibir dinero (balance positivo)
        const debtors = [];   // Personas que deben pagar dinero (balance negativo)
        
        participants.forEach(participant => {
            const balance = finalBalances.get(participant);
            if (balance > 0.01) {
                creditors.push({ name: participant, amount: balance });
            } else if (balance < -0.01) {
                debtors.push({ name: participant, amount: Math.abs(balance) });
            }
        });

        // Ordenar para optimizar
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);

        console.log(`  Acreedores: ${creditors.map(c => `${c.name}($${c.amount.toFixed(2)})`).join(', ')}`);
        console.log(`  Deudores: ${debtors.map(d => `${d.name}($${d.amount.toFixed(2)})`).join(', ')}`);

        // Emparejar deudores con acreedores
        let creditorIndex = 0;
        let debtorIndex = 0;

        while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
            const creditor = creditors[creditorIndex];
            const debtor = debtors[debtorIndex];
            
            const transferAmount = Math.min(creditor.amount, debtor.amount);
            
            if (transferAmount > 0.01) {
                transfers.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: Math.round(transferAmount * 100) / 100
                });
                
                console.log(`    ✅ ${debtor.name} → ${creditor.name}: $${transferAmount.toFixed(2)}`);
                
                creditor.amount -= transferAmount;
                debtor.amount -= transferAmount;
            }
            
            if (creditor.amount <= 0.01) creditorIndex++;
            if (debtor.amount <= 0.01) debtorIndex++;
        }

        return {
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            transfers: transfers,
            balances: finalBalances,
            totalPaid: totalPaid,
            totalGlobalDebt: totalGlobalDebt
        };
    }
}

function runTest(testName, participants, expenses, expectedTransfers) {
    console.log('\n' + '='.repeat(80));
    console.log(`🧪 TEST: ${testName}`);
    console.log('='.repeat(80));
    
    const calculator = new SettlementCalculator();
    
    console.log('\n📊 ESCENARIO:');
    console.log(`Participantes: ${participants.join(', ')}`);
    console.log('Gastos:');
    expenses.forEach((expense, i) => {
        const excluded = expense.excluded && expense.excluded.length > 0 ? 
            ` (excluidos: ${expense.excluded.join(', ')})` : '';
        console.log(`  ${i+1}. ${expense.description}: $${expense.amount} (pagado por ${expense.payer})${excluded}`);
    });
    
    try {
        const result = calculator.calculateSettlements(participants, expenses);
        
        console.log('\n📋 VERIFICACIÓN DE BALANCES:');
        console.log(`💰 Total gastado: $${result.totalExpenses}`);
        console.log(`👥 Participantes: ${participants.length}`);
        console.log(`💵 Parte justa por persona: $${result.fairShare.toFixed(2)}`);
        
        console.log('\n💰 Lo que cada uno pagó vs. lo que debe:');
        for (const [participant, paid] of result.amountPaid) {
            const balance = result.balances.get(participant);
            console.log(`  ${participant}: Pagó $${paid}, debe $${result.fairShare.toFixed(2)} → Balance: ${balance >= 0 ? '+' : ''}$${balance.toFixed(2)}`);
        }
        
        console.log('\n💸 TRANSFERENCIAS CALCULADAS:');
        if (result.transfers.length === 0) {
            console.log('  ✅ No se necesitan transferencias (todos equilibrados)');
        } else {
            result.transfers.forEach((transfer, i) => {
                console.log(`  ${i+1}. ${transfer.from} → ${transfer.to}: $${transfer.amount.toFixed(2)}`);
            });
        }
        
        // Verificar que las transferencias balancean correctamente
        console.log('\n🔍 VERIFICACIÓN DE CONSISTENCIA:');
        const netBalances = new Map();
        participants.forEach(p => netBalances.set(p, result.balances.get(p)));
        
        result.transfers.forEach(transfer => {
            const fromBalance = netBalances.get(transfer.from);
            const toBalance = netBalances.get(transfer.to);
            netBalances.set(transfer.from, fromBalance + transfer.amount);
            netBalances.set(transfer.to, toBalance - transfer.amount);
        });
        
        let allBalanced = true;
        for (const [participant, finalBalance] of netBalances) {
            if (Math.abs(finalBalance) > 0.01) {
                console.log(`  ❌ ${participant}: Balance final $${finalBalance.toFixed(2)} (debería ser $0.00)`);
                allBalanced = false;
            }
        }
        
        if (allBalanced) {
            console.log('  ✅ Todos los balances se equilibran correctamente después de las transferencias');
        }
        
        // Comparar con transferencias esperadas si se proporcionan
        if (expectedTransfers) {
            console.log('\n🎯 COMPARACIÓN CON RESULTADO ESPERADO:');
            if (result.transfers.length === expectedTransfers.length) {
                let allMatch = true;
                for (let i = 0; i < expectedTransfers.length; i++) {
                    const expected = expectedTransfers[i];
                    const actual = result.transfers.find(t => 
                        t.from === expected.from && t.to === expected.to && 
                        Math.abs(t.amount - expected.amount) < 0.01
                    );
                    if (actual) {
                        console.log(`  ✅ ${expected.from} → ${expected.to}: $${expected.amount} (correcto)`);
                    } else {
                        console.log(`  ❌ ${expected.from} → ${expected.to}: $${expected.amount} (no encontrado)`);
                        allMatch = false;
                    }
                }
                if (allMatch) {
                    console.log('  🎉 ¡TODAS LAS TRANSFERENCIAS COINCIDEN CON LO ESPERADO!');
                }
            } else {
                console.log(`  ❌ Número de transferencias incorrecto: esperado ${expectedTransfers.length}, obtenido ${result.transfers.length}`);
            }
        }
        
        return { success: true, result };
        
    } catch (error) {
        console.error('❌ Error en el test:', error.message);
        return { success: false, error: error.message };
    }
}

// ===============================================
// EJECUTAR TESTS
// ===============================================

console.log('🚀 SUITE DE TESTS EXHAUSTIVOS - JUST PAY!');
console.log('Verificando la lógica del algoritmo de cálculo de gastos compartidos');

// Test 1: Caso básico original
runTest(
    'Caso Básico - Ana y Carlos',
    ['Ana', 'Carlos', 'Alan', 'Luis'],
    [
        { description: 'Carne', amount: 20000, payer: 'Ana', excluded: [] },
        { description: 'Bebidas', amount: 10000, payer: 'Carlos', excluded: [] }
    ],
    [
        { from: 'Carlos', to: 'Ana', amount: 2500 },
        { from: 'Alan', to: 'Ana', amount: 5000 },
        { from: 'Luis', to: 'Ana', amount: 5000 },
        { from: 'Alan', to: 'Carlos', amount: 2500 },
        { from: 'Luis', to: 'Carlos', amount: 2500 }
    ]
);

// Test 2: Caso con exclusiones
runTest(
    'Caso con Exclusiones',
    ['Ana', 'Bob', 'Carlos', 'Diana'],
    [
        { description: 'Cena restaurante', amount: 120, payer: 'Ana', excluded: [] },
        { description: 'Gasolina viaje', amount: 80, payer: 'Bob', excluded: ['Diana'] }, // Diana no viajó
        { description: 'Museo', amount: 60, payer: 'Carlos', excluded: ['Bob'] }, // Bob no fue al museo
        { description: 'Compras supermercado', amount: 40, payer: 'Diana', excluded: [] }
    ]
);

// Test 3: Caso extremo - una persona paga todo
runTest(
    'Caso Extremo - Una Persona Paga Todo',
    ['Ana', 'Bob', 'Carlos'],
    [
        { description: 'Cena completa', amount: 150, payer: 'Ana', excluded: [] }
    ],
    [
        { from: 'Bob', to: 'Ana', amount: 50 },
        { from: 'Carlos', to: 'Ana', amount: 50 }
    ]
);

// Test 4: Caso equilibrado - todos pagan lo mismo
runTest(
    'Caso Equilibrado - Todos Pagan Igual',
    ['Ana', 'Bob', 'Carlos'],
    [
        { description: 'Desayuno', amount: 30, payer: 'Ana', excluded: [] },
        { description: 'Almuerzo', amount: 30, payer: 'Bob', excluded: [] },
        { description: 'Cena', amount: 30, payer: 'Carlos', excluded: [] }
    ],
    [] // No debería haber transferencias
);

// Test 5: Caso con múltiples exclusiones complejas
runTest(
    'Caso Complejo - Múltiples Exclusiones',
    ['Ana', 'Bob', 'Carlos', 'Diana', 'Eva'],
    [
        { description: 'Hotel todos', amount: 500, payer: 'Ana', excluded: [] },
        { description: 'Cena vegetariana', amount: 100, payer: 'Bob', excluded: ['Carlos'] }, // Carlos no es vegetariano
        { description: 'Actividad extrema', amount: 200, payer: 'Carlos', excluded: ['Diana', 'Eva'] }, // Solo Ana, Bob y Carlos
        { description: 'Spa mujeres', amount: 150, payer: 'Diana', excluded: ['Bob', 'Carlos'] }, // Solo Ana, Diana y Eva
        { description: 'Compras grupo', amount: 50, payer: 'Eva', excluded: [] }
    ]
);

console.log('\n' + '='.repeat(80));
console.log('🎯 TESTS COMPLETADOS');
console.log('='.repeat(80));
