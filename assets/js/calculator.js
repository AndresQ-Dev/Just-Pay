// assets/js/calculator.js

/**
 * Formatea un número como moneda en formato argentino (ej. $1.234,56).
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
     * Calcula las transferencias necesarias usando una matriz de deudas y neteo bidireccional.
     * Este algoritmo es robusto y minimiza las deudas directas entre personas.
     *
     * @param {string[]} participantes - Array de nombres de participantes.
     * @param {Array<object>} gastos - Array de objetos de gastos.
     * @returns {object} Un objeto con los resultados del cálculo y los resúmenes formateados.
     */
    calcularLiquidaciones(participantes, gastos) {
        // Valida que los datos de entrada sean correctos.
        const errores = this.validarEntradas(participantes, gastos);
        if (errores.length > 0) {
            console.error("Errores de validación en el cálculo:", errores);
            throw new Error(`Errores de validación:\n${errores.join('\n')}`);
        }

        // PASO 1: Crear una matriz de deudas para rastrear quién le debe a quién.
        // Estructura: matrizDeudas.get(deudor).get(acreedor) = monto.
        const matrizDeudas = new Map();
        participantes.forEach(p1 => {
            matrizDeudas.set(p1, new Map());
            participantes.forEach(p2 => {
                matrizDeudas.get(p1).set(p2, 0);
            });
        });

        // PASO 2: Procesar cada gasto y distribuir las deudas.
        let totalGastos = 0;
        gastos.forEach(gasto => {
            totalGastos += gasto.amount;
            const participantesIncluidos = participantes.filter(p => !gasto.excluded.includes(p));
            const costoPorPersona = gasto.amount / participantesIncluidos.length;

            // Cada participante incluido (excepto quien pagó) ahora le debe al pagador.
            participantesIncluidos.forEach(persona => {
                if (persona !== gasto.payer) {
                    const deudaActual = matrizDeudas.get(persona).get(gasto.payer);
                    matrizDeudas.get(persona).set(gasto.payer, deudaActual + costoPorPersona);
                }
            });
        });

        // PASO 3: Netear deudas bidireccionales.
        // Si A le debe 10 a B, y B le debe 5 a A, el resultado es que A solo le debe 5 a B.
        const matrizNeta = new Map();
        participantes.forEach(p => matrizNeta.set(p, new Map()));

        for (let i = 0; i < participantes.length; i++) {
            for (let j = i + 1; j < participantes.length; j++) {
                const p1 = participantes[i];
                const p2 = participantes[j];

                const deudaP1aP2 = matrizDeudas.get(p1).get(p2);
                const deudaP2aP1 = matrizDeudas.get(p2).get(p1);

                const deudaNeta = deudaP1aP2 - deudaP2aP1;
                if (deudaNeta > 0) {
                    matrizNeta.get(p1).set(p2, deudaNeta);
                } else if (deudaNeta < 0) {
                    matrizNeta.get(p2).set(p1, -deudaNeta);
                }
            }
        }
        
        // PASO 4: Generar la lista final de transferencias a partir de la matriz neta.
        const transferencias = [];
        matrizNeta.forEach((deudas, deudor) => {
            deudas.forEach((monto, acreedor) => {
                if (monto > 0) {
                    transferencias.push({
                        from: deudor,
                        to: acreedor,
                        amount: Math.round(monto * 100) / 100 // Redondeo a 2 decimales
                    });
                }
            });
        });

        // PASO 5: Generar el resumen final formateado.
        const resumenFormateado = this.formatearResumenLiquidacion(totalGastos, transferencias, gastos);

        return {
            totalExpenses: parseFloat(totalGastos.toFixed(2)),
            transfers: transferencias,
            formattedSummaryHtml: resumenFormateado.html,
            formattedSummaryPlainText: resumenFormateado.plainText
        };
    }

    /**
     * Formatea el resumen de las transferencias para su visualización (HTML) y para texto plano.
     * @param {number} totalGastos - El monto total de todos los gastos.
     * @param {Array<object>} transferencias - Array de objetos de transferencia optimizados.
     * @param {Array<object>} gastos - Array de gastos para mostrar el resumen.
     * @returns {object} Un objeto con 'html' y 'plainText' del resumen.
     */
    formatearResumenLiquidacion(totalGastos, transferencias, gastos = []) {
        // --- Versión HTML (para el modal) ---
        let resumenHtml = `<div class="results-header"><h2>Resumen de Gastos Compartidos</h2></div>`;
        
        if (gastos && gastos.length > 0) {
            resumenHtml += `<div class="results-section"><h3>Gastos Registrados</h3><div class="expenses-summary">`;
            gastos.forEach(gasto => {
                let textoExcluidos = gasto.excluded && gasto.excluded.length > 0 ? `<span class="excluded-note">(excluidos: ${gasto.excluded.join(', ')})</span>` : '';
                resumenHtml += `<div class="expense-summary-item">
                    <span class="expense-desc">${gasto.description}</span>
                    <span class="expense-payer">pagó: ${gasto.payer}</span>
                    <span class="expense-amount">${formatearMoneda(gasto.amount)}</span>
                    ${textoExcluidos}
                </div>`;
            });
            resumenHtml += `</div></div>`;
        }
        
        resumenHtml += `<div class="results-total"><h3>Total de Gastos: ${formatearMoneda(totalGastos)}</h3></div>`;
        
        if (transferencias.length === 0) {
            resumenHtml += `<div class="results-section"><h3>¡Excelente!</h3><p>Todos los saldos están equilibrados. No se necesitan transferencias.</p></div>`;
        } else {
            resumenHtml += `<div class="results-section"><h3>Transferencias Necesarias</h3><p>Se necesitan ${transferencias.length} transferencia${transferencias.length > 1 ? 's' : ''} para equilibrar los gastos:</p><div class="transfers-list">`;
            transferencias.forEach((t, i) => {
                resumenHtml += `<div class="transfer-item">
                    <span class="transfer-number">${i + 1}.</span>
                    <div class="transfer-description">
                        <span class="transfer-from">${t.from}</span>
                        <i class="fas fa-arrow-right transfer-arrow"></i>
                        <span class="transfer-to">${t.to}</span>
                    </div>
                    <span class="transfer-amount">${formatearMoneda(t.amount)}</span>
                </div>`;
            });
            resumenHtml += `</div></div>`;
        }
        resumenHtml += `<p class="results-footer-text">Generado con Just Pay!</p>`;

        // --- Versión Texto Plano (para copiar/compartir) ---
        let resumenTextoPlano = `*RESUMEN DE GASTOS COMPARTIDOS*\n=================================\n\n*GASTOS REGISTRADOS:*\n`;

        if (gastos && gastos.length > 0) {
            gastos.forEach((gasto, i) => {
                let textoExcluidos = gasto.excluded && gasto.excluded.length > 0 ? ` (excluidos: ${gasto.excluded.join(', ')})` : '';
                resumenTextoPlano += `${i + 1}. ${gasto.description} - ${formatearMoneda(gasto.amount)}\n   Pagó: ${gasto.payer}${textoExcluidos}\n\n`;
            });
        }

        resumenTextoPlano += `*TOTAL DE GASTOS:* ${formatearMoneda(totalGastos)}\n\n`;

        if (transferencias.length === 0) {
            resumenTextoPlano += '*¡PERFECTO!*\nTodos los saldos equilibrados. No hay transferencias pendientes.';
        } else {
            resumenTextoPlano += `*TRANSFERENCIAS NECESARIAS*\nSe necesitan *${transferencias.length} transferencia${transferencias.length > 1 ? 's' : ''}*:\n\n`;
            transferencias.forEach((t, i) => {
                resumenTextoPlano += `${i + 1}. *${t.from}* → *${t.to}*\n    ${formatearMoneda(t.amount)}\n\n`;
            });
        }
        
        resumenTextoPlano += '=================================\nGenerado con *Just Pay!*';

        return {
            html: resumenHtml,
            plainText: resumenTextoPlano
        };
    }

    /**
     * Valida los datos de entrada antes de realizar los cálculos.
     */
    validarEntradas(participantes, gastos) {
        const errores = [];
        if (!Array.isArray(participantes) || participantes.length < 2) {
            errores.push('Debe haber al menos dos participantes.');
        }
        if (participantes.some(p => !p || typeof p !== 'string' || p.trim() === '')) {
            errores.push('Todos los participantes deben tener nombres válidos.');
        }
        if (!Array.isArray(gastos) || gastos.length === 0) {
            errores.push('Debe haber al menos un gasto.');
        }
        gastos.forEach((gasto, i) => {
            if (!gasto.description || gasto.description.trim() === '') errores.push(`Gasto ${i + 1}: La descripción es requerida.`);
            if (!gasto.amount || isNaN(gasto.amount) || gasto.amount <= 0) errores.push(`Gasto ${i + 1}: El monto debe ser un número positivo.`);
            if (!gasto.payer || !participantes.includes(gasto.payer)) errores.push(`Gasto ${i + 1}: El pagador debe ser un participante válido.`);
            if (gasto.excluded) {
                const participantesActivos = participantes.filter(p => !gasto.excluded.includes(p));
                if (participantesActivos.length === 0) {
                    errores.push(`Gasto ${i + 1}: No se puede excluir a todos los participantes.`);
                }
            }
        });
        return errores;
    }
}

// Exportar la instancia para uso en la aplicación.
export const calculadora = new CalculadoraLiquidaciones();