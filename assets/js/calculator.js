// assets/js/calculator.js

// Función para formatear números con separadores de miles (formato argentino)
function formatCurrency(amount) {
    return `$${amount.toLocaleString('es-AR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    })}`;
}

/**
 * Clase para manejar la lógica de cálculo de saldos y optimización de transferencias
 * entre participantes de un gasto compartido.
 */
class SettlementCalculator {
    /**
     * Calcula las transferencias necesarias usando matriz de deudas específicas y neteo bidireccional.
     * Algoritmo corregido que rastrea deudas por gasto específico y luego optimiza con neteo.
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
     * - balances: Map con los saldos finales de cada participante
     * - formattedSummaryHtml: Un string HTML formateado con el resumen para displayResults (sin asteriscos).
     * - formattedSummaryPlainText: Un string de texto plano formateado con el resumen para copiar/compartir (con asteriscos).
     */
    calculateSettlements(participants, expenses) {
        // Validar entrada
        const validationErrors = this.validateInput(participants, expenses);
        if (validationErrors.length > 0) {

            throw new Error(`Errores de validación:\n${validationErrors.join('\n')}`);
        }

        // 1. MATRIZ DE DEUDAS ESPECÍFICAS POR GASTO
        // Estructura: debtMatrix.get(debtor).get(creditor) = amount
        const debtMatrix = new Map();
        participants.forEach(p => {
            debtMatrix.set(p, new Map());
            participants.forEach(q => {
                debtMatrix.get(p).set(q, 0);
            });
        });

        let totalExpenses = 0;
        expenses.forEach((expense, index) => {
            totalExpenses += expense.amount;
            const includedParticipants = participants.filter(p => !expense.excluded.includes(p));
            const perPersonCost = expense.amount / includedParticipants.length;

            // Cada persona incluida (excepto quien pagó) debe dinero al pagador
            includedParticipants.forEach(person => {
                if (person !== expense.payer) {
                    const currentDebt = debtMatrix.get(person).get(expense.payer);
                    debtMatrix.get(person).set(expense.payer, currentDebt + perPersonCost);

                }
            });
        });

        participants.forEach(debtor => {
            participants.forEach(creditor => {
                const debt = debtMatrix.get(debtor).get(creditor);
                if (debt > 0) {

                }
            });
        });

        // 2. NETEO BIDIRECCIONAL

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

                        } else if (netDebt < 0) {
                            netMatrix.get(person2).set(person1, -netDebt);

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

        transfers.forEach((transfer, i) => {

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

        let totalBalance = 0;
        participants.forEach(person => {
            const balance = balances.get(person);
            totalBalance += balance;

        });

        // 5. Generar el resumen final formateado
        const formattedResults = this.formatSettlementSummary(totalExpenses, transfers, expenses);

        return {
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            transfers: transfers,
            balances: balances,
            formattedSummaryHtml: formattedResults.html,
            formattedSummaryPlainText: formattedResults.plainText
        };
    }

    /**
     * Formatea el resumen de las transferencias para su visualización (HTML) y para copiar/compartir (texto plano).
     *
     * @param {number} totalExpenses - El monto total de todos los gastos.
     * @param {Array<object>} transfers - Array de objetos de transferencia optimizados.
     * @param {Array<object>} expenses - Array de gastos para mostrar el resumen.
     * @returns {object} Un objeto con 'html' y 'plainText' del resumen.
     */
    formatSettlementSummary(totalExpenses, transfers, expenses = []) {
        // --- Versión HTML (para el modal, con estructura mejorada) ---
        let htmlSummary = `<div class="results-header">
            <h2> Resumen de Gastos Compartidos</h2>
        </div>`;
        
        // Resumen de gastos individuales
        if (expenses && expenses.length > 0) {
            htmlSummary += `<div class="results-section">
                <h3> Gastos Registrados</h3>
                <div class="expenses-summary">`;
            
            expenses.forEach((expense, index) => {
                let excludedText = '';
                if (expense.excluded && expense.excluded.length > 0) {
                    excludedText = ` <span class="excluded-note">(excluidos: ${expense.excluded.join(', ')})</span>`;
                }
                
                htmlSummary += `<div class="expense-summary-item">
                    <span class="expense-desc">${expense.description}</span>
                    <span class="expense-payer">pagó: ${expense.payer}</span>
                    <span class="expense-amount">${formatCurrency(expense.amount)}</span>
                    ${excludedText}
                </div>`;
            });
            
            htmlSummary += `</div></div>`;
        }
        
        htmlSummary += `<div class="results-total">
            <h3> Total de Gastos: ${formatCurrency(totalExpenses)}</h3>
        </div>`;
        
        if (transfers.length === 0) {
            htmlSummary += `<div class="results-section">
                <h3> ¡Excelente!</h3>
                <p class="modal-result-text">Todos los saldos están equilibrados. No se necesitan transferencias.</p>
            </div>`;
        } else {
            htmlSummary += `<div class="results-section">
                <h3> Transferencias Necesarias</h3>
                <p class="modal-result-text">Se necesitan ${transfers.length} transferencia${transfers.length > 1 ? 's' : ''} para equilibrar los gastos:</p>
                <div class="transfers-list">`;

            transfers.forEach((transfer, index) => {
                const displayAmount = formatCurrency(transfer.amount);
                
                htmlSummary += `<div class="transfer-item">
                    <span class="transfer-number">${index + 1}.</span>
                    <div class="transfer-description">
                        <span class="transfer-from">${transfer.from}</span>
                        <span class="transfer-arrow">→</span>
                        <span class="transfer-to">${transfer.to}</span>
                    </div>
                    <span class="transfer-amount">${displayAmount}</span>
                </div>`;
            });

            htmlSummary += `</div></div>`;
        }

        // --- Versión Texto Plano (para copiar/compartir) ---
        let plainTextSummary = ` *RESUMEN DE GASTOS COMPARTIDOS*
=================================

 *GASTOS REGISTRADOS:*
`;

        if (expenses && expenses.length > 0) {
            expenses.forEach((expense, index) => {
                let excludedText = '';
                if (expense.excluded && expense.excluded.length > 0) {
                    excludedText = ` (excluidos: ${expense.excluded.join(', ')})`;
                }
                plainTextSummary += `${index + 1}. ${expense.description} - ${formatCurrency(expense.amount)}
   Pagó: ${expense.payer}${excludedText}

`;
            });
        }

        plainTextSummary += ` *TOTAL DE GASTOS:* ${formatCurrency(totalExpenses)}

`;

        if (transfers.length === 0) {
            plainTextSummary += ' *¡PERFECTO!*\n Todos los saldos equilibrados\n No hay transferencias pendientes';
        } else {
            plainTextSummary += ` *TRANSFERENCIAS NECESARIAS*
Se necesitan *${transfers.length} transferencia${transfers.length > 1 ? 's' : ''}*:

`;

            transfers.forEach((transfer, index) => {
                const displayAmount = formatCurrency(transfer.amount).substring(1); // Removemos el $ inicial
                    
                plainTextSummary += `${index + 1}. *${transfer.from}* → *${transfer.to}*
    $${displayAmount}

`;
            });
        }
        
        plainTextSummary += '=================================\n Generado con *Just Pay!* \nhttps://justpayapp.netlify.app/';

        return {
            html: htmlSummary,
            plainText: plainTextSummary
        };
    }

    /**
     * Valida los datos de entrada antes de realizar los cálculos
     */
    validateInput(participants, expenses) {
        const errors = [];

        // Validar participantes
        if (!Array.isArray(participants) || participants.length === 0) {
            errors.push('Debe haber al menos un participante');
        }

        if (participants.some(p => !p || typeof p !== 'string' || p.trim() === '')) {
            errors.push('Todos los participantes deben tener nombres válidos');
        }

        // Validar gastos
        if (!Array.isArray(expenses) || expenses.length === 0) {
            errors.push('Debe haber al menos un gasto');
        }

        expenses.forEach((expense, index) => {
            if (!expense.description || expense.description.trim() === '') {
                errors.push(`Gasto ${index + 1}: La descripción es requerida`);
            }

            if (!expense.amount || isNaN(expense.amount) || expense.amount <= 0) {
                errors.push(`Gasto ${index + 1}: El monto debe ser un número positivo`);
            }

            if (!expense.payer || !participants.includes(expense.payer)) {
                errors.push(`Gasto ${index + 1}: El pagador debe ser un participante válido`);
            }

            if (expense.excluded) {
                const invalidExcluded = expense.excluded.filter(e => !participants.includes(e));
                if (invalidExcluded.length > 0) {
                    errors.push(`Gasto ${index + 1}: Participantes excluidos inválidos: ${invalidExcluded.join(', ')}`);
                }

                // Validar que no se excluyan a todos los participantes
                const activeParticipants = participants.filter(p => !expense.excluded.includes(p));
                if (activeParticipants.length === 0) {
                    errors.push(`Gasto ${index + 1}: No se puede excluir a todos los participantes. Debe haber al menos uno que participe del gasto.`);
                }
            }
        });

        return errors;
    }
}

// Exportar para uso en navegador (ES6 modules)
export const calculator = new SettlementCalculator();

// Exportar para uso en Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SettlementCalculator };
}