document.addEventListener('DOMContentLoaded', () => {
    // --- Variables Globales ---
    let participants = []; // Almacena los nombres de los participantes
    let expenses = [];     // Almacena los objetos de gastos

    // --- Referencias a elementos del DOM ---
    const participantList = document.getElementById('participantList');
    const addParticipantForm = document.getElementById('addParticipantForm');
    const participantNameInput = document.getElementById('participantName');
    const emptyParticipantsState = document.getElementById('emptyParticipantsState');

    const expenseList = document.getElementById('expenseList');
    const addExpenseForm = document.getElementById('addExpenseForm');
    const expenseDescriptionInput = document.getElementById('expenseDescription');
    const expenseAmountInput = document.getElementById('expenseAmount');
    const expensePayerSelect = document.getElementById('expensePayer');
    const emptyExpensesState = document.getElementById('emptyExpensesState');

    const calculateBtn = document.getElementById('calculateBtn');

    // Modales
    const addParticipantModal = document.getElementById('addParticipantModal');
    const addExpenseModal = document.getElementById('addExpenseModal');
    const resultsModal = document.getElementById('resultsModal');
    const backdrop = document.getElementById('backdrop');

    // Botones para abrir modales
    const openAddParticipantModalBtn = document.getElementById('openAddParticipantModal');
    const openAddExpenseModalBtn = document.getElementById('openAddExpenseModal');

    // Botones de cerrar modales (comunes para todos los modales)
    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    // Botones del modal de resultados
    const shareWhatsappBtn = document.getElementById('shareWhatsappBtn');
    const copyResultsBtn = document.getElementById('copyResultsBtn');
    const resultsTextContainer = document.getElementById('resultsText'); // Para mostrar los resultados

    // --- Funciones de Utilidad del Modal ---
    function openModal(modalElement) {
        modalElement.classList.add('active');
        backdrop.classList.add('active');
    }

    function closeModal(modalElement) {
        modalElement.classList.remove('active');
        backdrop.classList.remove('active');
    }

    function closeAllModals() {
        // Cierra todos los modales activos
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        backdrop.classList.remove('active');
    }

    // --- Gestión de Participantes ---

    function renderParticipants() {
        participantList.innerHTML = ''; // Limpiar la lista actual

        if (participants.length === 0) {
            emptyParticipantsState.style.display = 'flex';
            participantList.style.display = 'none'; // Ocultar grid si no hay participantes
            // Deshabilitar botón de añadir gasto si no hay participantes
            openAddExpenseModalBtn.disabled = true;
            return;
        } else {
            emptyParticipantsState.style.display = 'none';
            participantList.style.display = 'grid'; // Mostrar grid si hay participantes
            openAddExpenseModalBtn.disabled = false; // Habilitar si hay participantes
        }

        participants.forEach((participantName, index) => {
            const participantDiv = document.createElement('div');
            participantDiv.classList.add('participant');
            participantDiv.innerHTML = `
                <span>${participantName}</span>
                <button class="remove-btn" data-index="${index}">&times;</button>
            `;
            participantList.appendChild(participantDiv);
        });

        // Añadir event listeners para eliminar participantes
        document.querySelectorAll('.participant .remove-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = parseInt(event.target.dataset.index);
                removeParticipant(index);
            });
        });

        // Actualizar el select de pagadores en el formulario de gastos
        updatePayerSelect();
        checkCalculateButtonStatus();
    }

    function addParticipant(name) {
        if (name && !participants.includes(name)) { // Evitar duplicados
            participants.push(name);
            renderParticipants();
            participantNameInput.value = ''; // Limpiar input
            closeModal(addParticipantModal); // Cerrar el modal después de añadir
        } else if (participants.includes(name)) {
            alert('Este participante ya existe.');
        }
    }

    function removeParticipant(index) {
        const removedParticipant = participants[index];
        participants.splice(index, 1);

        // También elimina cualquier gasto asociado a este participante si fue pagador
        // O si está excluido de algún gasto (aunque eso se maneja dinámicamente)
        expenses = expenses.filter(expense => expense.payer !== removedParticipant);
        // Si el participante removido estaba excluido de algún gasto, no hay problema porque
        // la lista de excluidos se genera dinámicamente al abrir el modal de gastos.

        renderParticipants();
        renderExpenses(); // Re-renderizar gastos por si algún pagador fue eliminado
        checkCalculateButtonStatus(); // Verificar si aún se puede calcular
    }

    // --- Gestión de Gastos ---

    function updatePayerSelect() {
        expensePayerSelect.innerHTML = '<option value="" disabled selected>Selecciona quien pagó</option>';
        participants.forEach(participantName => {
            const option = document.createElement('option');
            option.value = participantName;
            option.textContent = participantName;
            expensePayerSelect.appendChild(option);
        });
    }

    function renderExpenses() {
        expenseList.innerHTML = ''; // Limpiar la lista actual

        if (expenses.length === 0) {
            emptyExpensesState.style.display = 'flex';
            return;
        } else {
            emptyExpensesState.style.display = 'none';
        }

        expenses.forEach((expense, index) => {
            const expenseItem = document.createElement('div');
            expenseItem.classList.add('expense-item');
            expenseItem.innerHTML = `
                <div>
                    <strong>${expense.description}</strong><br>
                    Pagó: ${expense.payer} | Monto: $${expense.amount.toFixed(2)}
                    ${expense.excluded.length > 0 ? `<br>Excluidos: ${expense.excluded.join(', ')}` : ''}
                </div>
                <button class="delete-btn" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
            `;
            expenseList.appendChild(expenseItem);
        });

        // Añadir event listeners para eliminar gastos
        document.querySelectorAll('.expense-item .delete-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = parseInt(event.target.dataset.index);
                removeExpense(index);
            });
        });

        checkCalculateButtonStatus();
    }

    function addExpense(description, amount, payer, excludedParticipants) {
        if (description && amount > 0 && payer) {
            expenses.push({
                description: description,
                amount: parseFloat(amount),
                payer: payer,
                excluded: excludedParticipants || []
            });
            renderExpenses();
            // Limpiar formulario
            expenseDescriptionInput.value = '';
            expenseAmountInput.value = '';
            expensePayerSelect.value = ''; // Resetear el select
            closeModal(addExpenseModal); // Cerrar el modal
        }
    }

    function removeExpense(index) {
        expenses.splice(index, 1);
        renderExpenses();
        checkCalculateButtonStatus();
    }

    // --- Lógica del Botón Calcular ---

    function checkCalculateButtonStatus() {
        // Habilita el botón calcular si hay al menos 2 participantes y 1 gasto
        if (participants.length >= 2 && expenses.length >= 1) {
            calculateBtn.disabled = false;
        } else {
            calculateBtn.disabled = true;
        }
    }

    // --- Cálculo y Modal de Resultados ---

    // Esta función simula la lógica de calculator.js
    // En una app real, podrías importar un módulo o llamar a una función global
    function calculateSettlements(participants, expenses) {
        const balances = {};
        participants.forEach(p => balances[p] = 0);

        expenses.forEach(expense => {
            const payer = expense.payer;
            const amount = expense.amount;
            const includedParticipants = participants.filter(p => !expense.excluded.includes(p));

            if (includedParticipants.length === 0) {
                // Si no hay participantes incluidos, el pagador asume el 100% del gasto
                // (su balance no se modifica si ya lo pagó completamente)
                // O se podría considerar un error o un gasto no compartido.
                // Para este caso, asumimos que si pagó, ya está en su balance como un "pago adelantado"
                // y como nadie más contribuye, su balance no cambia por este cálculo.
                return;
            }

            const perPersonCost = amount / includedParticipants.length;

            balances[payer] += amount; // El pagador añade lo que pagó a su balance

            includedParticipants.forEach(p => {
                balances[p] -= perPersonCost; // Cada participante (incluido) resta su cuota
            });
        });

        // Separar deudores y acreedores
        const debtors = [];
        const creditors = [];

        for (const p in balances) {
            const balance = parseFloat(balances[p].toFixed(2)); // Redondear a 2 decimales
            if (balance < 0) {
                debtors.push({ name: p, amount: Math.abs(balance) });
            } else if (balance > 0) {
                creditors.push({ name: p, amount: balance });
            }
        }

        // Algoritmo de optimización de transferencias (ejemplo simple)
        const transfers = {};

        // Ordenar para una liquidación más eficiente
        debtors.sort((a, b) => b.amount - a.amount); // De mayor deudor a menor
        creditors.sort((a, b) => b.amount - a.amount); // De mayor acreedor a menor

        let i = 0; // índice para deudores
        let j = 0; // índice para acreedores

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            if (debtor.amount === 0) {
                i++;
                continue;
            }
            if (creditor.amount === 0) {
                j++;
                continue;
            }

            const amountToTransfer = Math.min(debtor.amount, creditor.amount);

            if (!transfers[debtor.name]) {
                transfers[debtor.name] = {};
            }
            transfers[debtor.name][creditor.name] = amountToTransfer;

            debtor.amount -= amountToTransfer;
            creditor.amount -= amountToTransfer;

            if (debtor.amount === 0) {
                i++;
            }
            if (creditor.amount === 0) {
                j++;
            }
        }

        return transfers;
    }

    function displayResults(transfers) {
        let resultsHtml = '<h2>💰 *Resumen de Gastos y Pagos* 💰</h2>';
        let resultsPlainText = '💰 *Resumen de Gastos y Pagos* 💰\n\n';

        if (Object.keys(transfers).length === 0) {
            resultsHtml += '<p class="modal-result-text">🎉 *¡Todos los saldos están en cero!* No se necesitan transferencias.</p>';
            resultsPlainText += '🎉 *¡Todos los saldos están en cero!* No se necesitan transferencias.\n';
        } else {
            resultsHtml += '<p class="modal-result-text">💸 *Transferencias Necesarias:*</p>';
            resultsPlainText += '💸 *Transferencias Necesarias:*\n\n';

            for (const payer in transfers) {
                resultsHtml += `<p class="modal-result-text">➡️ *${payer} debe transferir:*\n`;
                resultsPlainText += `➡️ *${payer} debe transferir:*\n`;
                for (const receiver in transfers[payer]) {
                    const amount = transfers[payer][receiver].toFixed(2);
                    resultsHtml += `  • $${amount} a *${receiver}*<br>`;
                    resultsPlainText += `  • $${amount} a *${receiver}*\n`;
                }
                resultsHtml += `</p>`; // Cierra el p para cada deudor
                resultsPlainText += "\n"; // Salto de línea entre deudores en texto plano
            }
        }
        resultsHtml += '<p class="modal-result-text">✨ *¡Cuentas claras, amistades largas!*</p>';
        resultsPlainText += '✨ *¡Cuentas claras, amistades largas!*';


        resultsTextContainer.innerHTML = resultsHtml;
        resultsTextContainer.dataset.plainText = resultsPlainText; // Guarda el texto plano para compartir/copiar
        openModal(resultsModal);
    }

    // --- Event Listeners ---

    // Abrir modal de añadir participante
    openAddParticipantModalBtn.addEventListener('click', () => {
        openModal(addParticipantModal);
    });

    // Abrir modal de añadir gasto
    openAddExpenseModalBtn.addEventListener('click', () => {
        // Asegúrate de actualizar el select de pagadores cada vez que se abre el modal
        updatePayerSelect();

        // Limpiar y generar la lista de participantes excluidos
        const excludedParticipantsContainer = document.getElementById('excludedParticipantsList');
        excludedParticipantsContainer.innerHTML = ''; // Limpiar lista anterior

        // Solo mostrar participantes que no son el pagador seleccionado
        const selectedPayer = expensePayerSelect.value;

        // Si no hay pagador seleccionado, mostrar todos los participantes para exclusión
        const participantsForExclusion = participants.filter(p => p !== selectedPayer);

        participantsForExclusion.forEach(pName => {
            const item = document.createElement('label');
            item.classList.add('excluded-participant-item');
            item.innerHTML = `
                <input type="checkbox" value="${pName}">
                <span>${pName}</span>
            `;
            excludedParticipantsContainer.appendChild(item);
        });

        openModal(addExpenseModal);
    });

    // Event listener para actualizar la lista de excluidos dinámicamente
    expensePayerSelect.addEventListener('change', () => {
        const excludedParticipantsContainer = document.getElementById('excludedParticipantsList');
        excludedParticipantsContainer.innerHTML = '';
        const selectedPayer = expensePayerSelect.value;

        const participantsForExclusion = participants.filter(p => p !== selectedPayer);

        if (participantsForExclusion.length === 0) {
            excludedParticipantsContainer.innerHTML = '<p style="color: rgba(204,214,223,0.6); font-size: 0.9em;">No hay otros participantes para excluir.</p>';
        } else {
            participantsForExclusion.forEach(pName => {
                const item = document.createElement('label');
                item.classList.add('excluded-participant-item');
                item.innerHTML = `
                    <input type="checkbox" value="${pName}">
                    <span>${pName}</span>
                `;
                excludedParticipantsContainer.appendChild(item);
            });
        }
    });

    // Enviar formulario de añadir participante
    addParticipantForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = participantNameInput.value.trim();
        addParticipant(name);
    });

    // Enviar formulario de añadir gasto
    addExpenseForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const description = expenseDescriptionInput.value.trim();
        const amount = parseFloat(expenseAmountInput.value);
        const payer = expensePayerSelect.value;

        const excludedCheckboxes = document.querySelectorAll('#excludedParticipantsList input[type="checkbox"]:checked');
        const excludedParticipants = Array.from(excludedCheckboxes).map(cb => cb.value);

        addExpense(description, amount, payer, excludedParticipants);
    });

    // Botón Calcular (main logic)
    calculateBtn.addEventListener('click', () => {
        const transfers = calculateSettlements(participants, expenses);
        displayResults(transfers);
    });

    // Botón de compartir por WhatsApp
    shareWhatsappBtn.addEventListener('click', () => {
        const textToShare = resultsTextContainer.dataset.plainText;
        // ¡Aquí está la magia! Codifica el texto para la URL
        const encodedText = encodeURIComponent(textToShare); 
        const whatsappUrl = `https://wa.me/?text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
    });

    // Botón de copiar resultados
    copyResultsBtn.addEventListener('click', () => {
        const textToCopy = resultsTextContainer.dataset.plainText;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                // Pequeño feedback visual
                copyResultsBtn.textContent = '¡Copiado!';
                setTimeout(() => {
                    copyResultsBtn.textContent = 'Copiar Resultados';
                }, 1500);
            })
            .catch(err => {
                console.error('Error al copiar el texto: ', err);
                alert('No se pudo copiar el texto. Por favor, intente manualmente.');
            });
    });

    // --- Inicialización al cargar la página ---
    renderParticipants();
    renderExpenses();
    checkCalculateButtonStatus();
});