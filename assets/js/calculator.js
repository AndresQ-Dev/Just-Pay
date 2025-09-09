/**
 * Formatea un número como moneda en formato argentino (ej. de 12345.67 a un string así: $12.345,67).
 * @param {number} monto - La cantidad a formatear.
 * @returns {string} El monto formateado como string.
 */
function formatearMoneda(monto) {
    return `$${monto.toLocaleString('es-AR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    })}`;
}

/**
 * Clase para manejar la lógica de cálculo de saldos y optimización de transferencias.
 */
class CalculadoraLiquidaciones {
    /**
     * Calcula las transferencias mínimas necesarias para saldar todas las deudas.
     *
     * @param {string[]} participantes - Array de nombres de participantes.
     * @param {Array<object>} gastos - Array de objetos de gastos.
     * @returns {object} Un objeto con los resultados del cálculo y los resúmenes formateados.
     */
    calcularLiquidaciones(participantes, gastos) {
        const errores = this.validarEntradas(participantes, gastos);
        if (errores.length > 0) {
            throw new Error(`Errores de validación:\n${errores.join('\n')}`);
        }

        // PASO 1: Calcular el saldo final de cada persona.
        // Un saldo positivo significa que la persona es acreedora (le deben dinero).
        // Un saldo negativo significa que la persona es deudora (debe dinero).
        const saldos = new Map(participantes.map(p => [p, 0]));
        let totalGastos = 0;

        gastos.forEach(gasto => {
            totalGastos += gasto.amount;
            // Sumar lo que cada persona pagó a su saldo.
            saldos.set(gasto.payer, saldos.get(gasto.payer) + gasto.amount);
            
            const participantesIncluidos = participantes.filter(p => !gasto.excluded.includes(p));
            if (participantesIncluidos.length > 0) {
                const costoPorPersona = gasto.amount / participantesIncluidos.length;
                // Restar lo que cada persona debería haber pagado de su saldo.
                participantesIncluidos.forEach(persona => {
                    saldos.set(persona, saldos.get(persona) - costoPorPersona);
                });
            }
        });

        // PASO 2: Separar a los participantes en dos grupos: deudores y acreedores.
        const deudores = [];
        const acreedores = [];
        saldos.forEach((saldo, persona) => {
            if (saldo < 0) {
                deudores.push({ persona, monto: -saldo });
            } else if (saldo > 0) {
                acreedores.push({ persona, monto: saldo });
            }
        });

        // PASO 3: Realizar las transferencias para saldar las cuentas.
        // Este algoritmo minimiza el número de transacciones.
        const transferencias = [];
        while (deudores.length > 0 && acreedores.length > 0) {
            const deudor = deudores[0];
            const acreedor = acreedores[0];
            const montoTransferencia = Math.min(deudor.monto, acreedor.monto);

            // Redondeo para evitar problemas con decimales flotantes.
            const montoRedondeado = Math.round(montoTransferencia * 100) / 100;

            if (montoRedondeado > 0) {
                transferencias.push({
                    from: deudor.persona,
                    to: acreedor.persona,
                    amount: montoRedondeado
                });
            }

            deudor.monto -= montoRedondeado;
            acreedor.monto -= montoRedondeado;

            // Si un deudor o acreedor ya saldó su cuenta, se elimina de la lista.
            if (deudor.monto < 0.01) deudores.shift();
            if (acreedor.monto < 0.01) acreedores.shift();
        }

        // PASO 4: Generar el resumen final formateado.
        const resumenFormateado = this.formatearResumenLiquidacion(totalGastos, transferencias, gastos);

        return {
            totalExpenses: parseFloat(totalGastos.toFixed(2)),
            transfers: transferencias,
            formattedSummaryHtml: resumenFormateado.html,
            formattedSummaryPlainText: resumenFormateado.plainText
        };
    }

    formatearResumenLiquidacion(totalGastos, transferencias, gastos = []) {
        let resumenHtml = ``;
        if (gastos && gastos.length > 0) {
            resumenHtml += `<div class="results-section"><h3>Gastos Registrados</h3><div class="expenses-summary">`;
            gastos.forEach(gasto => {
                let textoExcluidos = gasto.excluded && gasto.excluded.length > 0 ? `<span class="excluded-note">(excluidos: ${gasto.excluded.join(', ')})</span>` : '';
                resumenHtml += `<div class="expense-summary-item"><span class="expense-desc">${gasto.description}</span><span class="expense-payer">pagó: ${gasto.payer}</span><span class="expense-amount">${formatearMoneda(gasto.amount)}</span>${textoExcluidos}</div>`;
            });
            resumenHtml += `</div></div>`;
        }
        resumenHtml += `<div class="results-total"><h3>Total Gastado: ${formatearMoneda(totalGastos)}</h3></div>`;
        if (transferencias.length === 0) {
            resumenHtml += `<div class="results-section"><h3>¡Cuentas Saldadas!</h3><p>Todos los saldos están equilibrados. No se necesitan transferencias.</p></div>`;
        } else {
            resumenHtml += `<div class="results-section"><h3>Transferencias Necesarias</h3><div class="transfers-list">`;
            transferencias.forEach((t, i) => {
                resumenHtml += `<div class="transfer-item"><span class="transfer-number">${i + 1}.</span><div class="transfer-description"><span class="transfer-from">${t.from}</span><i class="fas fa-arrow-right transfer-arrow"></i><span class="transfer-to">${t.to}</span></div><span class="transfer-amount">${formatearMoneda(t.amount)}</span></div>`;
            });
            resumenHtml += `</div></div>`;
        }
        
        let resumenTextoPlano = `*RESUMEN DE GASTOS COMPARTIDOS*\n=================================\n\n`;
        resumenTextoPlano += `*TOTAL DE GASTOS:* ${formatearMoneda(totalGastos)}\n\n*TRANSFERENCIAS NECESARIAS:*\n`;
        if (transferencias.length === 0) {
            resumenTextoPlano += 'No hay transferencias pendientes.';
        } else {
            transferencias.forEach((t, i) => {
                resumenTextoPlano += `${i + 1}. *${t.from}* → *${t.to}*\n    ${formatearMoneda(t.amount)}\n\n`;
            });
        }
        resumenTextoPlano += '=================================\nGenerado con *Just Pay!*\nhttps://justpayapp.netlify.app/';
        return { html: resumenHtml, plainText: resumenTextoPlano };
    }

    validarEntradas(participantes, gastos) {
        const errores = [];
        if (!Array.isArray(participantes) || participantes.length < 2) errores.push('Debe haber al menos dos participantes.');
        if (!Array.isArray(gastos) || gastos.length === 0) errores.push('Debe haber al menos un gasto.');
        return errores;
    }
}

export const calculadora = new CalculadoraLiquidaciones();