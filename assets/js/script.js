// assets/js/script.js

import { calculadora } from './calculator.js';

function formatearMoneda(monto) { return `$${monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function sanitizarHTML(texto) { const temp = document.createElement('div'); temp.textContent = texto; return temp.innerHTML; }
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
    let participantes = [];
    let gastos = [];

    // --- Referencias al DOM ---
    const backdrop = document.getElementById('backdrop');
    const calculateBtn = document.getElementById('calculateBtn');
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
    const participantsCountSpan = document.getElementById('participantsCount');
    const expensesCountSpan = document.getElementById('expensesCount');
    const totalExpensesText = document.getElementById('totalExpensesText');
    
    // --- Lógica de Inicialización ---
    function inicializarApp() {
        const preloader = document.getElementById('preloader');
        const container = document.querySelector('.container');
        setTimeout(() => { preloader.classList.add('hidden'); container.classList.add('loaded'); }, 3000);
        cargarDatos();
        configurarEventListeners();
        mostrarParticipantes();
        mostrarGastos();
    }
    
    // --- Lógica de Datos ---
    function guardarDatos() { try { localStorage.setItem('justPayParticipantes', JSON.stringify(participantes)); localStorage.setItem('justPayGastos', JSON.stringify(gastos)); } catch (e) { console.error("Error al guardar:", e); } }
    function cargarDatos() { try { const p = localStorage.getItem('justPayParticipantes'); if (p) participantes = JSON.parse(p); const g = localStorage.getItem('justPayGastos'); if (g) gastos = JSON.parse(g); } catch (e) { console.error("Error al cargar:", e); } }
    
    // --- Lógica de Eventos ---
    function configurarEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => cambiarPestana(b.dataset.target)));
        document.querySelectorAll('.close-btn, .close-modal-btn').forEach(b => b.addEventListener('click', cerrarTodosLosModales));
        backdrop.addEventListener('click', cerrarTodosLosModales);

        // AHORA EL BOTÓN FLOTANTE (+) MANEJA AMBAS ACCIONES
        document.getElementById('fabAdd').addEventListener('click', handleFabClick);
        
        // Ya no necesitamos un listener para el botón de la cabecera de participantes
        // document.getElementById('openAddParticipantModal').addEventListener('click', () => abrirModal('addParticipantModal'));
        
        addParticipantForm.addEventListener('submit', manejarSubmitParticipante);
        addExpenseForm.addEventListener('submit', manejarSubmitGasto);
        calculateBtn.addEventListener('click', calcularGastos);
        document.getElementById('shareWhatsappBtn')?.addEventListener('click', compartirResultadosWhatsapp);
        document.getElementById('copyResultsBtn')?.addEventListener('click', copiarResultados);
        inicializarMenuHamburguesa();
    }

    // --- Lógica de la Interfaz (UI) ---
    function cambiarPestana(targetId) {
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === targetId));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.target === targetId));
        // Ya no es necesario mostrar/ocultar el FAB
    }

    function handleFabClick() {
    const participantsPanel = document.getElementById('participantsPanel');
    if (participantsPanel.classList.contains('active')) {
        // Si estamos en la pestaña de participantes, siempre se puede agregar
        abrirModal('addParticipantModal');
    } else {
        // Si estamos en la pestaña de gastos, VALIDAMOS PRIMERO
        if (participantes.length >= 2) {
            actualizarSelectPagador();
            popularCheckboxesExcluidos();
            abrirModal('addExpenseModal');
        } else {
            // Si no hay suficientes, mostramos una notificación
            mostrarNotificacion('Necesitas al menos 2 participantes para agregar un gasto.', 'error');
        }
    }
}

    function actualizarContadores() { participantsCountSpan.textContent = `(${participantes.length})`; expensesCountSpan.textContent = `(${gastos.length})`; }
    function actualizarTotalGastosBarra() { const total = gastos.reduce((sum, gasto) => sum + gasto.amount, 0); totalExpensesText.textContent = formatearMoneda(total); }
    
    function abrirModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        backdrop.classList.add('active');
        modal.classList.add('active');
        setTimeout(() => { const input = modal.querySelector('input[type="text"], input[type="number"]'); if (input) input.focus(); }, 150);
    }
    function cerrarTodosLosModales() { document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active')); backdrop.classList.remove('active'); }
    
    function mostrarParticipantes() {
        participantList.innerHTML = '';
        const hay = participantes.length > 0;
        emptyParticipantsState.style.display = hay ? 'none' : 'flex';
        participantes.forEach((nombre, i) => {
            const div = document.createElement('div');
            div.className = 'participant';
            div.innerHTML = `<span>${sanitizarHTML(nombre)}</span><button class="remove-btn" data-index="${i}">&times;</button>`;
            div.querySelector('.remove-btn').addEventListener('click', () => eliminarParticipante(i));
            participantList.appendChild(div);
        });
        actualizarSelectPagador();
        verificarEstadoBotonCalcular();
        actualizarContadores();
    }
    
    function agregarParticipante(nombre) {
        if (participantes.find(p => p.toLowerCase() === nombre.toLowerCase())) { mostrarNotificacion('Este participante ya existe.', 'error'); participantNameInput.focus(); return; }
        participantes.push(nombre);
        guardarDatos();
        mostrarParticipantes();
        mostrarNotificacion('¡Participante añadido!', 'success');
        participantNameInput.value = '';
        participantNameInput.focus();
    }
    function eliminarParticipante(indice) {
        const pEliminado = participantes[indice];
        participantes.splice(indice, 1);
        gastos = gastos.filter(g => g.payer !== pEliminado);
        guardarDatos();
        mostrarParticipantes();
        mostrarGastos();
        mostrarNotificacion('Participante eliminado.', 'info');
    }
    function manejarSubmitParticipante(e) { e.preventDefault(); const n = sanitizarHTML(participantNameInput.value.trim()); if (n) agregarParticipante(n); else mostrarNotificacion('El nombre no puede estar vacío.', 'error'); }
    
    function mostrarGastos() {
        expenseList.innerHTML = '';
        const hay = gastos.length > 0;
        emptyExpensesState.style.display = hay ? 'none' : 'flex';
        gastos.forEach((gasto, i) => {
            const div = document.createElement('div');
            div.className = 'expense-item';
            const excluidos = gasto.excluded.length > 0 ? `<div class="expense-excluded">Excluidos: ${gasto.excluded.map(sanitizarHTML).join(', ')}</div>` : '';
            div.innerHTML = `<div class="expense-info"><div class="expense-description">${sanitizarHTML(gasto.description)}</div><div class="expense-payer">Pagó: ${sanitizarHTML(gasto.payer)}</div>${excluidos}</div><div class="expense-amount">${formatearMoneda(gasto.amount)}</div><button class="delete-btn" data-index="${i}">&times;</button>`;
            div.querySelector('.delete-btn').addEventListener('click', () => eliminarGasto(i));
            expenseList.appendChild(div);
        });
        verificarEstadoBotonCalcular();
        actualizarContadores();
        actualizarTotalGastosBarra();
    }
    
    function agregarGasto(desc, monto, pagador, excluidos) {
        if (participantes.length - (excluidos ? excluidos.length : 0) <= 0) { mostrarNotificacion('No puedes excluir a todos.', 'error'); return; }
        if (participantes.length < 2) { mostrarNotificacion('Necesitas al menos 2 participantes.', 'error'); return; }
        gastos.push({ description: desc, amount: parseFloat(monto), payer: pagador, excluded: excluidos || [] });
        guardarDatos();
        mostrarGastos();
        mostrarNotificacion('¡Gasto añadido!', 'success');
        addExpenseForm.reset();
        popularCheckboxesExcluidos();
        expenseDescriptionInput.focus();
    }
    function eliminarGasto(indice) { gastos.splice(indice, 1); guardarDatos(); mostrarGastos(); mostrarNotificacion('Gasto eliminado.', 'info'); }
    function manejarSubmitGasto(e) {
        e.preventDefault();
        const d = sanitizarHTML(expenseDescriptionInput.value.trim());
        const m = parseFloat(expenseAmountInput.value);
        const p = expensePayerSelect.value;
        const ex = Array.from(document.querySelectorAll('#excludedParticipantsList input:checked')).map(cb => cb.value);
        if (d && m > 0 && p) agregarGasto(d, m, p, ex);
        else mostrarNotificacion('Completa todos los campos.', 'error');
    }

    function actualizarSelectPagador() {
        expensePayerSelect.innerHTML = '<option value="" disabled selected>Selecciona quien pagó</option>';
        participantes.forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; expensePayerSelect.appendChild(o); });
    }
    function popularCheckboxesExcluidos() {
        excludedParticipantsList.innerHTML = '';
        participantes.forEach(n => { const i = document.createElement('label'); i.className = 'excluded-participant-item'; i.innerHTML = `<input type="checkbox" value="${n}"><span>${sanitizarHTML(n)}</span>`; excludedParticipantsList.appendChild(i); });
    }

    function verificarEstadoBotonCalcular() { calculateBtn.disabled = !(participantes.length >= 2 && gastos.length >= 1); }
    function calcularGastos() {
    if (calculateBtn.disabled || calculateBtn.classList.contains('loading')) return;

    // Iniciar la animación
    calculateBtn.classList.add('loading');
    calculateBtn.disabled = true;

    // Simular un pequeño retraso para que la animación sea visible
    setTimeout(() => {
        try {
            const resultados = calculadora.calcularLiquidaciones(participantes, gastos);
            mostrarResultados(resultados.formattedSummaryHtml, resultados.formattedSummaryPlainText);
        } catch (error) {
            console.error(error);
            mostrarNotificacion("Error al calcular. Revisa los datos.", "error");
        } finally {
            // Detener la animación, sin importar si hubo éxito o error
            calculateBtn.classList.remove('loading');
            // Habilitar el botón solo si las condiciones se cumplen
            verificarEstadoBotonCalcular();
        }
    }, 1200); // 750 milisegundos de animación
}
    function mostrarResultados(html, texto) {
        const resModal = document.getElementById('resultsModal');
        resModal.querySelector('#resultsText').innerHTML = html;
        resModal.querySelector('#resultsText').dataset.plainText = texto;
        abrirModal('resultsModal');
    }
    function compartirResultadosWhatsapp() { const t = document.getElementById('resultsText')?.dataset.plainText || ''; window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank'); }
    function copiarResultados() { const t = document.getElementById('resultsText')?.dataset.plainText || ''; navigator.clipboard.writeText(t).then(() => mostrarNotificacion('¡Copiado!', 'success')).catch(() => mostrarNotificacion('No se pudo copiar.', 'error')); }
    
    function inicializarMenuHamburguesa() {
    const openMenuBtn = document.getElementById('openMenu');
    const closeMenuBtn = document.getElementById('closeMenu');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    
    const abrirMenu = () => hamburgerMenu.classList.add('active');
    const cerrarMenu = () => hamburgerMenu.classList.remove('active');

    openMenuBtn.addEventListener('click', abrirMenu);
    closeMenuBtn.addEventListener('click', cerrarMenu);
    
    document.getElementById('aboutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        cerrarMenu();
        abrirModal('aboutModal');
    });

    document.getElementById('contactBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        cerrarMenu();
        abrirModal('contactModal');
    });

    // AÑADIR ESTE BLOQUE PARA EL NUEVO BOTÓN
    document.getElementById('helpBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        cerrarMenu();
        abrirModal('helpModal');
    });
}

    inicializarApp();
});