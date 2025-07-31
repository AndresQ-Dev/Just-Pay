// Test para verificar la lógica del calculador
// Caso de prueba: 3 participantes con gastos cruzados

// Datos de prueba
const participants = ['Ana', 'Bob', 'Carlos'];

const expenses = [
    { description: 'Cena', amount: 120, payer: 'Ana', excluded: [] },
    { description: 'Taxi', amount: 30, payer: 'Bob', excluded: [] },
    { description: 'Entradas', amount: 60, payer: 'Carlos', excluded: [] }
];

// Cálculo manual esperado:
// Total gastos: $210
// Parte por persona: $210 / 3 = $70

// Saldos esperados:
// Ana: pagó $120, debe $70 → saldo +$50 (le deben $50)
// Bob: pagó $30, debe $70 → saldo -$40 (debe $40)
// Carlos: pagó $60, debe $70 → saldo -$10 (debe $10)

// Transferencias esperadas:
// Bob → Ana: $40
// Carlos → Ana: $10

console.log('=== CASO DE PRUEBA ===');
console.log('Participantes:', participants);
console.log('Gastos:', expenses);
console.log('\n=== CÁLCULO MANUAL ESPERADO ===');
console.log('Total: $210');
console.log('Por persona: $70');
console.log('Ana: +$50 (le deben)');
console.log('Bob: -$40 (debe)');
console.log('Carlos: -$10 (debe)');
console.log('\nTransferencias esperadas:');
console.log('Bob → Ana: $40');
console.log('Carlos → Ana: $10');

// Simular la lógica actual
function testCurrentLogic() {
    const balances = new Map();
    participants.forEach(p => balances.set(p, 0));

    let totalExpenses = 0;

    expenses.forEach(expense => {
        const amount = expense.amount;
        const payer = expense.payer;
        const excluded = expense.excluded || [];

        totalExpenses += amount;

        const activeParticipantsForThisExpense = participants.filter(p => !excluded.includes(p));
        
        if (activeParticipantsForThisExpense.length === 0) {
            return;
        }

        const sharePerPerson = amount / activeParticipantsForThisExpense.length;

        // Restar la parte a cada participante activo
        activeParticipantsForThisExpense.forEach(p => {
            balances.set(p, balances.get(p) - sharePerPerson);
        });

        // Sumar el monto total al pagador
        balances.set(payer, balances.get(payer) + amount);
    });

    console.log('\n=== RESULTADO ACTUAL ===');
    console.log('Total:', totalExpenses);
    balances.forEach((balance, name) => {
        console.log(`${name}: ${balance.toFixed(2)}`);
    });

    return balances;
}

testCurrentLogic();
