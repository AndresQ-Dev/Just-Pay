// Prueba manual del algoritmo con datos exactos
console.log('🔍 PRUEBA MANUAL DEL ALGORITMO');
console.log('=' .repeat(50));

// Simulando exactamente lo que debería pasar
const participants = ['Ana', 'Carlos', 'Alan', 'Luis'];
const balances = new Map();

// Inicializar balances en 0
participants.forEach(p => balances.set(p, 0));

console.log('👥 Participantes:', participants.join(', '));

// Gasto 1: Ana compra carne por $20,000
const expense1 = { description: 'Carne', amount: 20000, payer: 'Ana' };
const sharePerPerson1 = expense1.amount / 4; // $5,000 por persona

console.log(`\n💰 Gasto 1: ${expense1.description} - $${expense1.amount} (pagado por ${expense1.payer})`);
console.log(`   Cada persona debe: $${sharePerPerson1}`);

// Ana recibe el monto que pagó
balances.set('Ana', balances.get('Ana') + expense1.amount);
console.log(`   Ana recibe: +$${expense1.amount} (balance: $${balances.get('Ana')})`);

// Todos deben su parte (incluyendo Ana)
participants.forEach(p => {
    balances.set(p, balances.get(p) - sharePerPerson1);
    console.log(`   ${p} debe: -$${sharePerPerson1} (balance: $${balances.get(p)})`);
});

// Gasto 2: Carlos compra bebidas por $10,000
const expense2 = { description: 'Bebidas', amount: 10000, payer: 'Carlos' };
const sharePerPerson2 = expense2.amount / 4; // $2,500 por persona

console.log(`\n💰 Gasto 2: ${expense2.description} - $${expense2.amount} (pagado por ${expense2.payer})`);
console.log(`   Cada persona debe: $${sharePerPerson2}`);

// Carlos recibe el monto que pagó
balances.set('Carlos', balances.get('Carlos') + expense2.amount);
console.log(`   Carlos recibe: +$${expense2.amount} (balance: $${balances.get('Carlos')})`);

// Todos deben su parte (incluyendo Carlos)
participants.forEach(p => {
    balances.set(p, balances.get(p) - sharePerPerson2);
    console.log(`   ${p} debe: -$${sharePerPerson2} (balance: $${balances.get(p)})`);
});

console.log('\n📊 BALANCES FINALES:');
for (const [participant, balance] of balances) {
    if (balance > 0) {
        console.log(`  ✅ ${participant}: +$${balance} (debe recibir)`);
    } else if (balance < 0) {
        console.log(`  ❌ ${participant}: $${Math.abs(balance)} (debe pagar)`);
    } else {
        console.log(`  ⚖️ ${participant}: $0 (equilibrado)`);
    }
}

// Verificar suma total
let total = 0;
for (const balance of balances.values()) {
    total += balance;
}
console.log(`\n🔍 Verificación: Suma total = $${total} (debe ser $0)`);

console.log('\n💸 TRANSFERENCIAS ÓPTIMAS:');
// Algoritmo simple de transferencias
const debtors = [];
const creditors = [];

for (const [name, balance] of balances) {
    if (balance < -0.01) {
        debtors.push({ name, amount: Math.abs(balance) });
    } else if (balance > 0.01) {
        creditors.push({ name, amount: balance });
    }
}

console.log('Deudores:', debtors.map(d => `${d.name}: $${d.amount}`).join(', '));
console.log('Acreedores:', creditors.map(c => `${c.name}: $${c.amount}`).join(', '));

// Generar transferencias
const transfers = [];
let debtorIndex = 0;
let creditorIndex = 0;

while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    
    const transferAmount = Math.min(debtor.amount, creditor.amount);
    
    transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: transferAmount
    });
    
    debtor.amount -= transferAmount;
    creditor.amount -= transferAmount;
    
    if (debtor.amount <= 0.01) debtorIndex++;
    if (creditor.amount <= 0.01) creditorIndex++;
}

transfers.forEach((t, i) => {
    console.log(`  ${i+1}. ${t.from} → ${t.to}: $${t.amount}`);
});

console.log('\n' + '='.repeat(50));
