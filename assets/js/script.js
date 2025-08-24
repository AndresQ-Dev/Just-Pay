// assets/js/script.js

import { calculadora } from './calculator.js';

/**
 * Formatea un número como moneda en formato argentino (ej. $1.234,56).
 */
function formatearMoneda(monto) {
    return `$${monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Sanitiza una cadena de texto para prevenir XSS.
 */
function sanitizarHTML(texto) {
    const temp = document.createElement('div');
    temp.textContent = texto;
    return temp.innerHTML;
}

/**
 * Muestra una notificación toast en la pantalla.
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacionExistente = document.querySelector('.toast-notification');
    if (notificacionExistente) notificacionExistente.remove();

    const notificacion = document.createElement('div');
    notificacion.className = `toast-notification ${tipo}`;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);

    setTimeout(() => notificacion.classList.add('show'), 10);

    setTimeout(() => {
        notificacion.classList.remove('show');
        notificacion.addEventListener('transitionend', () => notificacion.remove());
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    // ====================================================
    //              ESTADO Y ELEMENTOS DEL DOM
    // ====================================================
    let participantes = [];
    let gastos = [];

    const participantList = document.getElementById('participantList');
    const addParticipantForm = document.getElementById('addParticipantForm');
    const participantNameInput = document.getElementById('participantName');
    const emptyParticipantsState = document.getElementById('emptyParticipantsState');
    const expenseList = document.getElementById('expenseList');
    const addExpenseForm = document.getElementById('addExpenseForm');
    const expenseDescriptionInput = document.getElementById('expenseDescription');
    const expenseAmountInput = document.getElementById('expenseAmount');
    const expensePayerSelect = document.getElementById('expensePayer');
    const excludedParticipantsList = document.getElementById('excludedParticipantsList');
    const emptyExpensesState = document.getElementById('emptyExpensesState');
    const calculateBtn = document.getElementById('calculateBtn');
    const addParticipantModal = document.getElementById('addParticipantModal');
    const addExpenseModal = document.getElementById('addExpenseModal');
    const resultsModal = document.getElementById('resultsModal');
    const backdrop = document.getElementById('backdrop');
    
    // ====================================================
    //                   INICIALIZACIÓN
    // ====================================================
    inicializarApp();

    function inicializarApp() {
        const preloader = document.getElementById('preloader');
        const container = document.querySelector('.container');
        setTimeout(() => {
            preloader.classList.add('hidden');
            container.classList.add('loaded');
        }, 3000);
        cargarDatos();
        configurarEventListeners();
        mostrarParticipantes();
        mostrarGastos();
        verificarEstadoBotonCalcular();
    }
    
    // ====================================================
    //      PERSISTENCIA DE DATOS (LocalStorage)
    // ====================================================
    function guardarDatos() {
        try {
            localStorage.setItem('justPayParticipantes', JSON.stringify(participantes));
            localStorage.setItem('justPayGastos', JSON.stringify(gastos));
        } catch (error) {
            console.error("Error al guardar datos:", error);
            mostrarNotificacion("No se pudieron guardar los datos.", "error");
        }
    }

    function cargarDatos() {
        try {
            const participantesGuardados = localStorage.getItem('justPayParticipantes');
            const gastosGuardados = localStorage.getItem('justPayGastos');
            if (participantesGuardados) participantes = JSON.parse(participantesGuardados);
            if (gastosGuardados) gastos = JSON.parse(gastosGuardados);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            participantes = [];
            gastos = [];
            mostrarNotificacion("Datos corruptos, se ha reseteado la sesión.", "error");
        }
    }
    
    // ====================================================
    //               MANEJO DE EVENTOS
    // ====================================================
    function configurarEventListeners() {
        document.querySelectorAll('.close-btn').forEach(b => b.addEventListener('click', cerrarTodosLosModales));
        document.querySelectorAll('.close-modal-btn').forEach(b => b.addEventListener('click', cerrarTodosLosModales));
        backdrop.addEventListener('click', cerrarTodosLosModales);

        document.getElementById('openAddParticipantModal').addEventListener('click', () => abrirModal(addParticipantModal));
        document.getElementById('openAddExpenseModal').addEventListener('click', () => {
            actualizarSelectPagador();
            popularCheckboxesExcluidos();
            abrirModal(addExpenseModal);
        });
        
        addParticipantForm.addEventListener('submit', manejarSubmitParticipante);
        addExpenseForm.addEventListener('submit', manejarSubmitGasto);
        calculateBtn.addEventListener('click', calcularGastos);
        document.getElementById('shareWhatsappBtn').addEventListener('click', compartirResultadosWhatsapp);
        document.getElementById('copyResultsBtn').addEventListener('click', copiarResultados);
        
        inicializarSistemaFAB();
        inicializarMenuHamburguesa();
    }
    
    // ====================================================
    //               MANEJO DE MODALES
    // ====================================================
    function abrirModal(modal) {
        modal.classList.add('active');
        backdrop.classList.add('active');
        setTimeout(() => {
            const input = modal.querySelector('input[type="text"], input[type="number"]');
            if (input) input.focus();
        }, 150);
    }

    function cerrarModal(modal) {
        modal.classList.remove('active');
        // *** FIX: Asegurarse de que el backdrop siempre se cierre con el modal ***
        if (!document.querySelector('.modal.active')) {
            backdrop.classList.remove('active');
        }
    }

    function cerrarTodosLosModales() {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        backdrop.classList.remove('active');
    }
    
    // ====================================================
    //            LÓGICA DE PARTICIPANTES
    // ====================================================
    function mostrarParticipantes() {
        participantList.innerHTML = '';
        const hayParticipantes = participantes.length > 0;
        
        emptyParticipantsState.style.display = hayParticipantes ? 'none' : 'flex';
        participantList.style.display = hayParticipantes ? 'grid' : 'none';
        document.getElementById('openAddExpenseModal').disabled = participantes.length < 2;

        participantes.forEach((nombre, indice) => {
            const div = document.createElement('div');
            div.className = 'participant';
            div.innerHTML = `<span>${sanitizarHTML(nombre)}</span><button class="remove-btn" data-index="${indice}">&times;</button>`;
            participantList.appendChild(div);
        });
        
        participantList.querySelectorAll('.remove-btn').forEach(btn => btn.addEventListener('click', (e) => eliminarParticipante(e.target.dataset.index)));

        actualizarSelectPagador();
        verificarEstadoBotonCalcular();
    }
    
    function agregarParticipante(nombre) {
        if (participantes.find(p => p.toLowerCase() === nombre.toLowerCase())) {
            mostrarNotificacion('Este participante ya existe.', 'error');
            participantNameInput.focus();
            return;
        }
        
        participantes.push(nombre);
        guardarDatos();
        mostrarParticipantes();
        mostrarNotificacion('¡Participante añadido!', 'success');

        // *** NUEVO FLUJO: Limpiar y enfocar para el siguiente ***
        participantNameInput.value = '';
        participantNameInput.focus();
    }

    function eliminarParticipante(indice) {
        const participanteEliminado = participantes[indice];
        participantes.splice(indice, 1);
        gastos = gastos.filter(gasto => gasto.payer !== participanteEliminado);
        guardarDatos();
        mostrarParticipantes();
        mostrarGastos();
        mostrarNotificacion('Participante eliminado.', 'info');
    }
    
    function manejarSubmitParticipante(e) {
        e.preventDefault();
        const nombre = sanitizarHTML(participantNameInput.value.trim());
        if (nombre) {
            agregarParticipante(nombre);
        } else {
            mostrarNotificacion('El nombre no puede estar vacío.', 'error');
        }
    }
    
    // ====================================================
    //                 LÓGICA DE GASTOS
    // ====================================================
    function mostrarGastos() {
        expenseList.innerHTML = '';
        const hayGastos = gastos.length > 0;

        emptyExpensesState.style.display = hayGastos ? 'none' : 'flex';
        expenseList.style.display = hayGastos ? 'block' : 'none';

        gastos.forEach((gasto, indice) => {
            const div = document.createElement('div');
            div.className = 'expense-item';
            const excluidos = gasto.excluded.length > 0 ? `<div class="expense-excluded">Excluidos: ${gasto.excluded.map(sanitizarHTML).join(', ')}</div>` : '';
            div.innerHTML = `
                <div class="expense-info">
                    <div class="expense-description">${sanitizarHTML(gasto.description)}</div>
                    <div class="expense-payer">Pagó: ${sanitizarHTML(gasto.payer)}</div>
                    ${excluidos}
                </div>
                <div class="expense-amount">${formatearMoneda(gasto.amount)}</div>
                <button class="delete-btn" data-index="${indice}">&times;</button>
            `;
            expenseList.appendChild(div);
        });

        expenseList.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', e => eliminarGasto(e.target.dataset.index)));
        verificarEstadoBotonCalcular();
    }
    
    function agregarGasto(descripcion, monto, pagador, excluidos) {
        const participantesEnGasto = participantes.length - (excluidos ? excluidos.length : 0);
        if (participantesEnGasto <= 0) {
            mostrarNotificacion('No puedes excluir a todos los participantes.', 'error');
            return;
        }

        gastos.push({ 
            description: descripcion, 
            amount: parseFloat(monto), 
            payer: pagador, 
            excluded: excluidos || [] 
        });
        
        guardarDatos();
        mostrarGastos();
        mostrarNotificacion('¡Gasto añadido!', 'success');

        // *** NUEVO FLUJO: Limpiar y enfocar para el siguiente ***
        addExpenseForm.reset();
        popularCheckboxesExcluidos();
        expenseDescriptionInput.focus();
    }

    function eliminarGasto(indice) {
        gastos.splice(indice, 1);
        guardarDatos();
        mostrarGastos();
        mostrarNotificacion('Gasto eliminado.', 'info');
    }

    function manejarSubmitGasto(e) {
        e.preventDefault();
        const descripcion = sanitizarHTML(expenseDescriptionInput.value.trim());
        const monto = parseFloat(expenseAmountInput.value);
        const pagador = expensePayerSelect.value;
        const checkboxesExcluidos = document.querySelectorAll('#excludedParticipantsList input:checked');
        const excluidos = Array.from(checkboxesExcluidos).map(cb => cb.value);
        
        if (descripcion && monto > 0 && pagador) {
            agregarGasto(descripcion, monto, pagador, excluidos);
        } else {
            mostrarNotificacion('Por favor, completa todos los campos del gasto.', 'error');
        }
    }

    function actualizarSelectPagador() {
        expensePayerSelect.innerHTML = '<option value="" disabled selected>Selecciona quien pagó</option>';
        participantes.forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            option.textContent = nombre;
            expensePayerSelect.appendChild(option);
        });
    }

    function popularCheckboxesExcluidos() {
        excludedParticipantsList.innerHTML = '';
        if (participantes.length === 0) return;
        participantes.forEach(nombre => {
            const item = document.createElement('label');
            item.className = 'excluded-participant-item';
            item.innerHTML = `<input type="checkbox" value="${nombre}"><span>${sanitizarHTML(nombre)}</span>`;
            excludedParticipantsList.appendChild(item);
        });
    }

    // ====================================================
    //            LÓGICA DE CÁLCULO Y RESULTADOS
    // ====================================================
    function verificarEstadoBotonCalcular() {
        calculateBtn.disabled = !(participantes.length >= 2 && gastos.length >= 1);
    }

    function calcularGastos() {
        if (calculateBtn.disabled) return;
        try {
            const resultados = calculadora.calcularLiquidaciones(participantes, gastos);
            mostrarResultados(resultados.formattedSummaryHtml, resultados.formattedSummaryPlainText);
        } catch (error) {
            console.error(error);
            mostrarNotificacion("Error al calcular. Revisa los datos.", "error");
        }
    }

    function mostrarResultados(html, textoPlano) {
        document.getElementById('resultsText').innerHTML = html;
        document.getElementById('resultsText').dataset.plainText = textoPlano;
        abrirModal(resultsModal);
    }

    function compartirResultadosWhatsapp() {
        const texto = document.getElementById('resultsText').dataset.plainText;
        window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
    }

    function copiarResultados() {
        const texto = document.getElementById('resultsText').dataset.plainText;
        navigator.clipboard.writeText(texto)
            .then(() => mostrarNotificacion('¡Resultados copiados!', 'success'))
            .catch(() => mostrarNotificacion('No se pudo copiar el texto.', 'error'));
    }

    // ====================================================
    //        SISTEMAS AUXILIARES (FAB, MENÚ)
    // ====================================================
    function inicializarSistemaFAB() {
        const mainFab = document.getElementById('mainFab');
        const miniFabs = document.getElementById('miniFabs');
        const fabContainer = document.getElementById('fabContainer');
        
        mainFab.addEventListener('click', (e) => {
            e.stopPropagation();
            miniFabs.classList.toggle('expanded');
        });
        
        document.addEventListener('click', (e) => {
            if (!fabContainer.contains(e.target) && miniFabs.classList.contains('expanded')) {
                miniFabs.classList.remove('expanded');
            }
        });
        
        document.getElementById('addParticipantFab').addEventListener('click', () => {
            abrirModal(addParticipantModal);
            miniFabs.classList.remove('expanded');
        });

        document.getElementById('addExpenseFab').addEventListener('click', () => {
            if (participantes.length >= 2) {
                actualizarSelectPagador();
                popularCheckboxesExcluidos();
                abrirModal(addExpenseModal);
            } else {
                mostrarNotificacion("Necesitas al menos 2 participantes.", "error");
            }
            miniFabs.classList.remove('expanded');
        });
        
        document.getElementById('calculateFab').addEventListener('click', () => {
            if (!calculateBtn.disabled) {
                calcularGastos();
            } else {
                mostrarNotificacion("Añade participantes y gastos para calcular.", "error");
            }
            miniFabs.classList.remove('expanded');
        });
    }

    function inicializarMenuHamburguesa() {
        const openMenuBtn = document.getElementById('openMenu');
        const closeMenuBtn = document.getElementById('closeMenu');
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        
        const abrirMenu = () => hamburgerMenu.classList.add('active');
        const cerrarMenu = () => hamburgerMenu.classList.remove('active');

        openMenuBtn.addEventListener('click', abrirMenu);
        closeMenuBtn.addEventListener('click', cerrarMenu);
        
        document.getElementById('aboutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            cerrarMenu();
            abrirModal(document.getElementById('aboutModal'));
        });

        document.getElementById('contactBtn').addEventListener('click', (e) => {
            e.preventDefault();
            cerrarMenu();
            abrirModal(document.getElementById('contactModal'));
        });
    }
});