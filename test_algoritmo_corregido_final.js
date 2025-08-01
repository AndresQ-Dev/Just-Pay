// test_algoritmo_corregido_final.js
// Prueba del algoritmo corregido según la nueva lógica

console.log('🚀 === PRUEBA DEL ALGORITMO CORREGIDO FINAL ===\n');

/**
 * Clase para manejar la lógica de cálculo de saldos y optimización de transferencias
 */
class SettlementCalculator {
    calculateSettlements(participants, expenses) {
        console.log('\n🎯 === ALGORITMO CORREGIDO: BALANCES INDIVIDUALES + NETEO ===');

        // 1. CALCULAR CUÁNTO DEBE Y CUÁNTO PAGÓ CADA PERSONA
        const totalOwed = new Map(); // Cuánto debe cada persona en total
        const totalPaid = new Map(); // Cuánto pagó cada persona en total
        
        // Inicializar
        participants.forEach(p => {
            totalOwed.set(p, 0);
            totalPaid.set(p, 0);
        });

        console.log('📊 Procesando gastos y calculando balances individuales...');

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

            // El pagador suma al total que pagó
            const currentPaid = totalPaid.get(expense.payer);
            totalPaid.set(expense.payer, currentPaid + expense.amount);
            console.log(`   ✅ ${expense.payer} pagó: +$${expense.amount.toLocaleString()} (total pagado: $${(currentPaid + expense.amount).toLocaleString()})`);

            // Cada participante incluido debe su parte
            includedParticipants.forEach(person => {
                const currentOwed = totalOwed.get(person);
                totalOwed.set(person, currentOwed + perPersonCost);
                console.log(`   💸 ${person} debe: +$${perPersonCost.toLocaleString()} (total debe: $${(currentOwed + perPersonCost).toLocaleString()})`);
            });
        });

        console.log('\n📋 RESUMEN DE BALANCES INDIVIDUALES:');
        participants.forEach(person => {
            const paid = totalPaid.get(person);
            const owed = totalOwed.get(person);
            console.log(`   ${person}: Pagó $${paid.toLocaleString()} - Debe $${owed.toLocaleString()}`);
        });

        // 2. CALCULAR BALANCE NETO DE CADA PERSONA
        const netBalances = new Map();
        participants.forEach(person => {
            const paid = totalPaid.get(person);
            const owed = totalOwed.get(person);
            const balance = paid - owed; // Positivo = debe recibir, Negativo = debe pagar
            netBalances.set(person, balance);
        });

        console.log('\n📊 BALANCES NETOS:');
        participants.forEach(person => {
            const balance = netBalances.get(person);
            console.log(`   ${person}: ${balance >= 0 ? '+' : ''}$${balance.toLocaleString()}`);
        });

        // 3. GENERAR TRANSFERENCIAS USANDO ALGORITMO DE MINIMIZACIÓN
        console.log('\n🔄 Generando transferencias mínimas...');
        
        // Separar acreedores (balance positivo) y deudores (balance negativo)
        const creditors = [];
        const debtors = [];
        
        participants.forEach(person => {
            const balance = netBalances.get(person);
            if (balance > 0.01) {
                creditors.push({ name: person, amount: balance });
            } else if (balance < -0.01) {
                debtors.push({ name: person, amount: Math.abs(balance) });
            }
        });

        // Ordenar para optimizar (mayor cantidad primero)
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);

        console.log(`   Acreedores (deben recibir): ${creditors.map(c => `${c.name}($${c.amount.toLocaleString()})`).join(', ')}`);
        console.log(`   Deudores (deben pagar): ${debtors.map(d => `${d.name}($${d.amount.toLocaleString()})`).join(', ')}`);

        // Algoritmo de emparejamiento para minimizar transferencias
        const transfers = [];
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
                
                console.log(`   💸 ${debtor.name} → ${creditor.name}: $${transferAmount.toLocaleString()}`);
                
                creditor.amount -= transferAmount;
                debtor.amount -= transferAmount;
            }
            
            if (creditor.amount <= 0.01) creditorIndex++;
            if (debtor.amount <= 0.01) debtorIndex++;
        }

        console.log('\n💸 TRANSFERENCIAS FINALES:');
        transfers.forEach((transfer, i) => {
            console.log(`   ${i + 1}. ${transfer.from} → ${transfer.to}: $${transfer.amount.toLocaleString()}`);
        });

        // Verificación final
        let totalBalance = 0;
        netBalances.forEach(balance => totalBalance += balance);
        console.log(`\n✅ VERIFICACIÓN: Suma total = $${totalBalance.toFixed(2)} ${Math.abs(totalBalance) < 0.01 ? '(CORRECTO ✅)' : '(ERROR ❌)'}`);

        return {
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            transfers: transfers,
            balances: netBalances
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

console.log('\n🎉 ¡ALGORITMO CORREGIDO FUNCIONANDO!');
console.log('\n' + '='.repeat(60));
