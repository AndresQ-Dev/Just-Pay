// Test completo para verificar la nueva lógica del calculador
// Importar la clase (simulando el módulo)

class SettlementCalculator {
    calculateSettlements(participants, expenses) {
        const balances = new Map();
        participants.forEach(p => balances.set(p, 0));

        let totalExpenses = 0;

        expenses.forEach(expense => {
            const amount = parseFloat(expense.amount);
            const payer = expense.payer;
            const excluded = expense.excluded || [];

            totalExpenses += amount;

            const activeParticipants = participants.filter(p => !excluded.includes(p));

            if (activeParticipants.length === 0) {
                console.log(`Gasto "${expense.description}": Solo para ${payer}, no se reparte`);
                return;
            }

            const sharePerPerson = amount / activeParticipants.length;

            console.log(`Gasto "${expense.description}": $${amount}, pagado por ${payer}`);
            console.log(`Participantes activos: ${activeParticipants.join(', ')}`);
            console.log(`Parte por persona: $${sharePerPerson.toFixed(2)}`);

            activeParticipants.forEach(participant => {
                const currentBalance = balances.get(participant);
                balances.set(participant, currentBalance - sharePerPerson);
                console.log(`${participant} debe $${sharePerPerson.toFixed(2)} (balance: $${(currentBalance - sharePerPerson).toFixed(2)})`);
            });

            const payerBalance = balances.get(payer);
            balances.set(payer, payerBalance + amount);
            console.log(`${payer} recibe $${amount.toFixed(2)} (balance final: $${(payerBalance + amount).toFixed(2)})`);
            console.log('---');
        });

        const transfers = this.optimizeTransfers(balances);

        return {
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            transfers: transfers,
            balances: balances
        };
    }

    optimizeTransfers(balances) {
        const workingBalances = new Map();
        balances.forEach((balance, name) => {
            const roundedBalance = Math.round(balance * 100) / 100;
            workingBalances.set(name, roundedBalance);
        });

        const debtors = [];
        const creditors = [];

        workingBalances.forEach((balance, name) => {
            if (Math.abs(balance) < 0.01) {
                return;
            }
            
            if (balance < 0) {
                debtors.push({ name: name, amount: Math.abs(balance) });
            } else if (balance > 0) {
                creditors.push({ name: name, amount: balance });
            }
        });

        console.log('Deudores:', debtors);
        console.log('Acreedores:', creditors);

        const totalDebt = debtors.reduce((sum, d) => sum + d.amount, 0);
        const totalCredit = creditors.reduce((sum, c) => sum + c.amount, 0);
        
        if (Math.abs(totalDebt - totalCredit) > 0.01) {
            console.error(`Error: Total deuda ($${totalDebt.toFixed(2)}) no coincide con total crédito ($${totalCredit.toFixed(2)})`);
        }

        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const transfers = [];

        while (debtors.length > 0 && creditors.length > 0) {
            const debtor = debtors[0];
            const creditor = creditors[0];

            const transferAmount = Math.min(debtor.amount, creditor.amount);
            
            if (transferAmount >= 0.01) {
                transfers.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: Math.round(transferAmount * 100) / 100
                });

                console.log(`Transferencia: ${debtor.name} → ${creditor.name}: $${transferAmount.toFixed(2)}`);
            }

            debtor.amount -= transferAmount;
            creditor.amount -= transferAmount;

            if (debtor.amount < 0.01) {
                debtors.shift();
            }
            if (creditor.amount < 0.01) {
                creditors.shift();
            }
        }

        return transfers;
    }
}

// Test cases
const calculator = new SettlementCalculator();

// Caso 1: 3 participantes, gastos cruzados
console.log('=== CASO 1: 3 participantes con gastos cruzados ===');
const test1 = calculator.calculateSettlements(
    ['Ana', 'Bob', 'Carlos'],
    [
        { description: 'Cena', amount: 120, payer: 'Ana', excluded: [] },
        { description: 'Taxi', amount: 30, payer: 'Bob', excluded: [] },
        { description: 'Entradas', amount: 60, payer: 'Carlos', excluded: [] }
    ]
);

console.log('\nResultado final:');
console.log('Total:', test1.totalExpenses);
test1.balances.forEach((balance, name) => {
    console.log(`${name}: $${balance.toFixed(2)}`);
});
console.log('Transferencias:', test1.transfers);

// Caso 2: Con participante excluido
console.log('\n\n=== CASO 2: Con participante excluido ===');
const test2 = calculator.calculateSettlements(
    ['Ana', 'Bob', 'Carlos'],
    [
        { description: 'Cena (solo Ana y Bob)', amount: 100, payer: 'Ana', excluded: ['Carlos'] },
        { description: 'Café (todos)', amount: 30, payer: 'Bob', excluded: [] }
    ]
);

console.log('\nResultado final:');
console.log('Total:', test2.totalExpenses);
test2.balances.forEach((balance, name) => {
    console.log(`${name}: $${balance.toFixed(2)}`);
});
console.log('Transferencias:', test2.transfers);
