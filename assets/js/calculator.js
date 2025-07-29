// assets/js/calculator.js

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
     * - excluded: Array de nombres de participantes excluidos de este gasto (string[])
     * @returns {object} Un objeto con:
     * - totalExpenses: Monto total de todos los gastos (number)
     * - transfers: Array de objetos de transferencia optimizados (from, to, amount)
     * - formattedSummaryHtml: Un string HTML formateado con el resumen para displayResults (sin asteriscos).
     * - formattedSummaryPlainText: Un string de texto plano formateado con el resumen para copiar/compartir (con asteriscos).
     */
    calculateSettlements(participants, expenses) {
        // 1. Inicializar saldos de cada participante en 0
        const balances = new Map();
        participants.forEach(p => balances.set(p, 0));

        let totalExpenses = 0; // Para llevar un registro del total de todos los gastos

        // 2. Calcular el saldo individual de cada participante
        expenses.forEach(expense => {
            const amount = expense.amount;
            const payer = expense.payer;
            // Asegurarse de que 'excluded' es un array. Si es nulo o undefined, usar un array vacío.
            const excluded = expense.excluded || []; 

            totalExpenses += amount; // Sumar el monto del gasto al total general

            // Filtrar participantes activos (aquellos que NO están excluidos de este gasto)
            // IMPORTANTE: Un participante excluido de un gasto NO comparte el costo de ese gasto.
            const activeParticipantsForThisExpense = participants.filter(p => !excluded.includes(p));

            // Si no hay participantes activos para este gasto (todos excluidos o lista vacía),
            // el gasto recae enteramente en el pagador.
            if (activeParticipantsForThisExpense.length === 0) {
                // Si esto ocurre, el pagador no tiene a quién cobrarle su parte, por lo tanto,
                // el balance del pagador no necesita ajuste para este gasto específico aquí,
                // ya que su saldo no se disminuye por ninguna "parte a deber" a terceros de este gasto.
                // Simplemente se asume que él cubrió el 100% sin reparto.
                return; // Pasar al siguiente gasto sin modificar los balances adicionales
            }

            // Calcular la parte que le corresponde a cada participante activo
            const sharePerPerson = amount / activeParticipantsForThisExpense.length;

            // Ajustar los balances:
            // Para cada participante activo, se le resta su "parte ideal" de este gasto.
            // Esto incluye al pagador, ya que también debe su propia parte.
            activeParticipantsForThisExpense.forEach(p => {
                balances.set(p, balances.get(p) - sharePerPerson);
            });

            // Después de restar la parte a todos los activos,
            // al pagador se le suma el monto total que desembolsó.
            // De esta forma, si pagó $100 y le corresponden $25, su saldo final por este gasto será $100 - $25 = +$75.
            balances.set(payer, balances.get(payer) + amount);
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

        // 4. Optimizar las transferencias (algoritmo "greedy")
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

        // 5. Generar el resumen final formateado para HTML y texto plano
        const formattedResults = this.formatSettlementSummary(totalExpenses, transfers);

        return {
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            transfers: transfers,
            formattedSummaryHtml: formattedResults.html,
            formattedSummaryPlainText: formattedResults.plainText
        };
    }

    /**
     * Formatea el resumen de las transferencias para su visualización (HTML) y para copiar/compartir (texto plano).
     *
     * @param {number} totalExpenses - El monto total de todos los gastos.
     * @param {Array<object>} transfers - Array de objetos de transferencia optimizados.
     * @returns {object} Un objeto con 'html' y 'plainText' del resumen.
     */
    formatSettlementSummary(totalExpenses, transfers) {
        // --- Versión HTML (para el modal, sin asteriscos) ---
        let htmlSummary = `<h2>Total de Gastos: $${totalExpenses.toFixed(2)}</h2>`;
        
        if (transfers.length === 0) {
            htmlSummary += '<p class="modal-result-text">🎉 ¡Todos los saldos están en cero! No se necesitan transferencias.</p>';
        } else {
            htmlSummary += '<p class="modal-result-text">💸 Transferencias Necesarias para compensar:</p>';

            transfers.forEach(t => {
                const displayAmount = t.amount >= 1 ? Math.round(t.amount) : t.amount.toFixed(2);
                htmlSummary += `  • ${t.from} debe transferir a ${t.to} $${displayAmount}<br>`;
            });
        }
        htmlSummary += '<p class="modal-result-text">✨ ¡Cuentas claras, amistades largas!</p>';

        // --- Versión Texto Plano (para copiar/compartir, CON asteriscos para negrita) ---
        let plainTextSummary = `Total de Gastos: *$${totalExpenses.toFixed(2)}*\n\n`;

        if (transfers.length === 0) {
            plainTextSummary += '🎉 *¡Todos los saldos están en cero!* No se necesitan transferencias.';
        } else {
            plainTextSummary += '💸 *Transferencias Necesarias para compensar:*\n';

            transfers.forEach(t => {
                const displayAmount = t.amount >= 1 ? Math.round(t.amount) : t.amount.toFixed(2);
                plainTextSummary += `  • *${t.from}* debe transferir a *${t.to}* *$${displayAmount}*\n`;
            });
        }
        plainTextSummary += '\n✨ *¡Cuentas claras, amistades largas!*';

        return {
            html: htmlSummary,
            plainText: plainTextSummary
        };
    }
}

// Exportar una instancia de la clase para que pueda ser utilizada en otros módulos
export const calculator = new SettlementCalculator();