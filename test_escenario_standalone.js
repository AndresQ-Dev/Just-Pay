// test_escenario_standalone.js
// Prueba standalone del escenario problemático

console.log('🚀 === TEST STANDALONE DEL ESCENARIO PROBLEMÁTICO ===\n');

// Función de cálculo simplificada basada en el algoritmo corregido
function calculateSettlements(participants, expenses) {
    console.log('\n🎯 === ALGORITMO CORREGIDO: BALANCES INDIVIDUALES + NETEO ===');

    // 1. CALCULAR CUÁNTO DEBE Y CUÁNTO PAGÓ CADA PERSONA
    const totalOwed = new Map();
    const totalPaid = new Map();
    
    participants.forEach(p => {
        totalOwed.set(p, 0);
        totalPaid.set(p, 0);
    });

    let totalExpenses = 0;
    expenses.forEach((expense, index) => {
        totalExpenses += expense.amount;
        const includedParticipants = participants.filter(p => !expense.excluded.includes(p));
        const perPersonCost = expense.amount / includedParticipants.length;
        
        console.log(`\n💰 Gasto ${index + 1}: ${expense.description} - $${expense.amount.toLocaleString()}`);
        console.log(`   Pagado por: ${expense.payer}`);
        console.log(`   Costo por persona: $${perPersonCost.toLocaleString()}`);

        // El pagador suma al total que pagó
        const currentPaid = totalPaid.get(expense.payer);
        totalPaid.set(expense.payer, currentPaid + expense.amount);

        // Cada participante incluido debe su parte
        includedParticipants.forEach(person => {
            const currentOwed = totalOwed.get(person);
            totalOwed.set(person, currentOwed + perPersonCost);
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
        const balance = paid - owed;
        netBalances.set(person, balance);
    });

    console.log('\n📊 BALANCES NETOS:');
    participants.forEach(person => {
        const balance = netBalances.get(person);
        console.log(`   ${person}: ${balance >= 0 ? '+' : ''}$${balance.toLocaleString()}`);
    });

    // 3. GENERAR TRANSFERENCIAS USANDO ALGORITMO DE MINIMIZACIÓN
    console.log('\n🔄 Generando transferencias mínimas...');
    
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

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    console.log(`   Acreedores: ${creditors.map(c => `${c.name}($${c.amount.toLocaleString()})`).join(', ')}`);
    console.log(`   Deudores: ${debtors.map(d => `${d.name}($${d.amount.toLocaleString()})`).join(', ')}`);

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

    return { totalExpenses, transfers, balances: netBalances };
}

// Escenario problemático
const participants = ['Ana', 'Carlos', 'Alan', 'Luis'];
const expenses = [
    { description: 'Carne', amount: 20000, payer: 'Ana', excluded: [] },
    { description: 'Bebida', amount: 10000, payer: 'Carlos', excluded: [] },
    { description: 'Postre', amount: 10000, payer: 'Carlos', excluded: [] }
];

console.log('📋 ESCENARIO:');
console.log('Participantes:', participants);
console.log('Gastos:');
expenses.forEach((expense, i) => {
    console.log(`  ${i + 1}. ${expense.description}: $${expense.amount.toLocaleString()} (pagado por ${expense.payer})`);
});

console.log('\n🎯 RESULTADO ESPERADO:');
console.log('  Ana: +$10,000, Carlos: +$10,000, Alan: -$10,000, Luis: -$10,000');
console.log('  Transferencias óptimas: Alan→Ana $10k, Luis→Carlos $10k (2 transferencias)');

console.log('\n' + '='.repeat(60));

const result = calculateSettlements(participants, expenses);

console.log('\n🎯 RESULTADO FINAL:');
console.log(`💰 Total: $${result.totalExpenses.toLocaleString()}`);
console.log(`💸 Transferencias: ${result.transfers.length}`);

console.log('\n📋 TRANSFERENCIAS FINALES:');
result.transfers.forEach((transfer, i) => {
    console.log(`  ${i + 1}. ${transfer.from} → ${transfer.to}: $${transfer.amount.toLocaleString()}`);
});

console.log('\n📊 BALANCES FINALES:');
result.balances.forEach((balance, person) => {
    console.log(`  ${person}: ${balance >= 0 ? '+' : ''}$${balance.toLocaleString()}`);
});

console.log('\n🔍 ANÁLISIS:');
if (result.transfers.length === 2) {
    console.log('✅ CORRECTO: Número mínimo de transferencias (2)');
} else {
    console.log(`❌ PROBLEMA: ${result.transfers.length} transferencias en lugar de 2 óptimas`);
}

console.log('\n' + '='.repeat(60));
