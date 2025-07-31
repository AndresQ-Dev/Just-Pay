// Versión de la calculadora específica para testing en Node.js
class SettlementCalculator {
    /**
     * Calcula las transferencias necesarias para balancear los gastos compartidos.
     */
    calculateSettlements(participants, expenses) {
        // Validar entrada
        const validationErrors = this.validateInput(participants, expenses);
        if (validationErrors.length > 0) {
            console.error('❌ Errores de validación:', validationErrors);
            throw new Error(`Errores de validación:\n${validationErrors.join('\n')}`);
        }

        // 1. Inicializar saldos de cada participante en 0
        const balances = new Map();
        participants.forEach(p => balances.set(p, 0));

        let totalExpenses = 0;

        // 2. Calcular el saldo individual de cada participante
        expenses.forEach(expense => {
            const amount = parseFloat(expense.amount);
            const payer = expense.payer;
            const excluded = expense.excluded || [];

            totalExpenses += amount;

            // Filtrar participantes activos (aquellos que NO están excluidos de este gasto)
            const activeParticipants = participants.filter(p => !excluded.includes(p));

            // Si no hay participantes activos, el gasto es solo del pagador
            if (activeParticipants.length === 0) {
                console.log(`Gasto "${expense.description}": Solo para ${payer}, no se reparte`);
                return;
            }

            // Calcular la parte que le corresponde a cada participante activo
            const sharePerPerson = amount / activeParticipants.length;

            console.log(`Gasto "${expense.description}": $${amount}, pagado por ${payer}`);
            console.log(`Participantes activos: ${activeParticipants.join(', ')}`);
            console.log(`Parte por persona: $${sharePerPerson.toFixed(2)}`);

            // Cada participante activo debe su parte
            activeParticipants.forEach(participant => {
                const currentBalance = balances.get(participant);
                balances.set(participant, currentBalance - sharePerPerson);
                console.log(`${participant} debe $${sharePerPerson.toFixed(2)} (balance: $${(currentBalance - sharePerPerson).toFixed(2)})`);
            });

            // El pagador recibe el monto total que desembolsó
            const payerBalance = balances.get(payer);
            balances.set(payer, payerBalance + amount);
            console.log(`${payer} recibe $${amount.toFixed(2)} (balance final: $${(payerBalance + amount).toFixed(2)})`);
            console.log('---');
        });

        // 3. Optimizar transferencias
        const transfers = this.optimizeTransfers(balances);

        // 4. Generar el resumen final formateado
        const formattedResults = this.formatSettlementSummary(totalExpenses, transfers);

        return {
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            transfers: transfers,
            balances: balances,
            formattedSummaryHtml: formattedResults.html,
            formattedSummaryPlainText: formattedResults.plainText
        };
    }

    /**
     * Optimiza las transferencias utilizando un algoritmo mejorado
     */
    optimizeTransfers(balances) {
        // Crear copias de trabajo para no modificar los originales
        const debtors = [];  // Personas que deben dinero (balance negativo)
        const creditors = []; // Personas que deben recibir dinero (balance positivo)
        
        console.log('\n🔄 Optimizando transferencias...');

        // Separar deudores y acreedores
        for (const [participant, balance] of balances) {
            const roundedBalance = Math.round(balance * 100) / 100; // Redondear a centavos
            
            if (roundedBalance < -0.01) {
                debtors.push({ name: participant, amount: Math.abs(roundedBalance) });
                console.log(`  📉 ${participant} debe: $${Math.abs(roundedBalance).toFixed(2)}`);
            } else if (roundedBalance > 0.01) {
                creditors.push({ name: participant, amount: roundedBalance });
                console.log(`  📈 ${participant} debe recibir: $${roundedBalance.toFixed(2)}`);
            } else {
                console.log(`  ⚖️ ${participant} está equilibrado`);
            }
        }

        // Ordenar para optimizar las transferencias
        debtors.sort((a, b) => b.amount - a.amount);   // Mayor deuda primero
        creditors.sort((a, b) => b.amount - a.amount); // Mayor crédito primero

        const transfers = [];
        let debtorIndex = 0;
        let creditorIndex = 0;

        console.log('\n💸 Calculando transferencias óptimas...');

        // Algoritmo de optimización: emparejar deudores con acreedores
        while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
            const debtor = debtors[debtorIndex];
            const creditor = creditors[creditorIndex];

            // Calcular el monto de la transferencia
            const transferAmount = Math.min(debtor.amount, creditor.amount);

            // Solo crear transferencia si el monto es significativo (más de 1 centavo)
            if (transferAmount > 0.01) {
                transfers.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: Math.round(transferAmount * 100) / 100
                });

                console.log(`  ✅ ${debtor.name} → ${creditor.name}: $${transferAmount.toFixed(2)}`);

                // Actualizar los montos pendientes
                debtor.amount -= transferAmount;
                creditor.amount -= transferAmount;
            }

            // Mover al siguiente si ya no hay más deuda o crédito
            if (debtor.amount <= 0.01) debtorIndex++;
            if (creditor.amount <= 0.01) creditorIndex++;
        }

        console.log(`\n🎯 Transferencias optimizadas: ${transfers.length} transacciones necesarias`);
        
        return transfers;
    }

    formatSettlementSummary(totalExpenses, transfers) {
        let plainTextSummary = `📊 *RESUMEN DE GASTOS*
======================

💰 *TOTAL:* $${totalExpenses.toFixed(2)}

`;

        if (transfers.length === 0) {
            plainTextSummary += '🎉 *¡PERFECTO!*\n✅ Todos los saldos equilibrados\n✅ No hay transferencias pendientes';
        } else {
            plainTextSummary += `💸 *TRANSFERENCIAS NECESARIAS*
Se necesitan *${transfers.length} transferencia${transfers.length > 1 ? 's' : ''}*:

`;

            transfers.forEach((transfer, index) => {
                const displayAmount = transfer.amount % 1 === 0 ? 
                    transfer.amount.toFixed(0) : 
                    transfer.amount.toFixed(2);
                    
                plainTextSummary += `${index + 1}. *${transfer.from}* → *${transfer.to}*
   💵 $${displayAmount}

`;
            });
        }
        
        plainTextSummary += '======================\n✨ *¡Transfiere ahora...!*\n\n🚀 Generado con *Just Pay!*';

        return {
            html: '',
            plainText: plainTextSummary
        };
    }

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
            }
        });

        return errors;
    }
}

module.exports = { SettlementCalculator };
