/**
 * Clase para manejar la lógica de cálculo de saldos y optimización de transferencias
 * entre participantes de un gasto compartido.
 */
class SettlementCalculator {
    /**
     * Calcula los saldos netos de cada participante y determina las transferencias
     * mínimas necesarias para saldar todas las deudas.
     *
     * @param {string[]} participants - Array de nombres de participantes.
     * @param {Array<object>} expenses - Array de objetos de gastos, cada uno con:
     * - description: Descripción del gasto (string)
     * - amount: Monto total del gasto (number)
     * - payer: Nombre del participante que pagó el gasto (string)
     * - excludedParticipants: Array de nombres de participantes excluidos de este gasto (string[])
     * @returns {string} Un string formateado con el resumen de las transferencias necesarias.
     */
    calculateSettlements(participants, expenses) {
        // 1. Inicializar saldos de cada participante
        const balances = new Map();
        participants.forEach(p => balances.set(p, 0));

        // 2. Calcular el saldo individual de cada participante
        expenses.forEach(expense => {
            const amount = expense.amount;
            const payer = expense.payer;
            const excluded = expense.excludedParticipants || [];

            balances.set(payer, balances.get(payer) + amount);

            const activeParticipants = participants.filter(p => !excluded.includes(p));

            if (activeParticipants.length > 0) {
                const sharePerPerson = amount / activeParticipants.length;
                activeParticipants.forEach(p => {
                    balances.set(p, balances.get(p) - sharePerPerson);
                });
            }
        });

        // 3. Separar deudores y acreedores
        const debtors = [];
        const creditors = [];

        balances.forEach((balance, name) => {
            const roundedBalance = parseFloat(balance.toFixed(2));
            if (roundedBalance < 0) {
                debtors.push({ name: name, amount: Math.abs(roundedBalance) });
            } else if (roundedBalance > 0) {
                creditors.push({ name: name, amount: roundedBalance });
            }
        });

        // 4. Optimizar las transferencias (algoritmo de "divide y vencerás")
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const transfers = [];

        while (debtors.length > 0 && creditors.length > 0) {
            const currentDebtor = debtors[0];
            const currentCreditor = creditors[0];

            const transferAmount = Math.min(currentDebtor.amount, currentCreditor.amount);
            const roundedTransferAmount = parseFloat(transferAmount.toFixed(2));

            if (roundedTransferAmount > 0) {
                transfers.push({
                    from: currentDebtor.name,
                    to: currentCreditor.name,
                    amount: roundedTransferAmount
                });
            }
            
            currentDebtor.amount -= transferAmount;
            currentCreditor.amount -= transferAmount;

            const tolerance = 0.01; 

            if (currentDebtor.amount <= tolerance) {
                debtors.shift();
            }
            if (currentCreditor.amount <= tolerance) {
                creditors.shift();
            }
        }

        // 5. Generar el resumen final formateado
        return this.formatSettlementSummary(participants, transfers, balances);
    }

    /**
     * Formatea el resumen de las transferencias para su visualización y envío.
     *
     * @param {string[]} originalParticipants - La lista original de nombres de participantes.
     * @param {Array<object>} transfers - Array de objetos de transferencia optimizados.
     * @param {Map<string, number>} finalBalances - Map de los saldos finales de cada participante.
     * @returns {string} El string formateado.
     */
    formatSettlementSummary(originalParticipants, transfers, finalBalances) {
        let summary = "💰 *Resumen de Gastos y Pagos* 💰\n\n";

        if (transfers.length === 0) {
            summary += "🎉 *¡Todos los saldos están en cero!* No se necesitan transferencias.";
            return summary;
        }

        summary += "💸 *Transferencias Necesarias:*\n";

        const debtorTransfers = new Map();
        transfers.forEach(t => {
            if (!debtorTransfers.has(t.from)) {
                debtorTransfers.set(t.from, []);
            }
            debtorTransfers.get(t.from).push({ to: t.to, amount: t.amount });
        });

        debtorTransfers.forEach((payments, debtorName) => {
            summary += `\n➡️ *${debtorName} debe transferir:*\n`;
            payments.forEach(p => {
                const displayAmount = p.amount >= 1 ? Math.round(p.amount) : p.amount.toFixed(2); 
                summary += `  • $${displayAmount} a *${p.to}*\n`;
            });
        });

        summary += "\n✨ *¡Cuentas claras, amistades largas!*";

        return summary;
    }
}

// Exportar una instancia de la clase para que pueda ser utilizada en otros módulos
export const calculator = new SettlementCalculator();