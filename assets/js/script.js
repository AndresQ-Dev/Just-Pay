// assets/js/script.js

import { calculator } from './calculator.js';

document.addEventListener('DOMContentLoaded', () => {
    let participants = [];
    let expenses = [];

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

    const openAddParticipantModalBtn = document.getElementById('openAddParticipantModal');
    const openAddExpenseModalBtn = document.getElementById('openAddExpenseModal');

    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    const shareWhatsappBtn = document.getElementById('shareWhatsappBtn');
    const copyResultsBtn = document.getElementById('copyResultsBtn');
    const resultsTextContainer = document.getElementById('resultsText');

    function openModal(modalElement) {
        modalElement.classList.add('active');
        backdrop.classList.add('active');
    }

    function closeModal(modalElement) {
        modalElement.classList.remove('active');
        backdrop.classList.remove('active');
    }

    function closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        backdrop.classList.remove('active');
    }

    function renderParticipants() {
        participantList.innerHTML = '';

        if (participants.length === 0) {
            emptyParticipantsState.style.display = 'flex';
            participantList.style.display = 'none';
            openAddExpenseModalBtn.disabled = true;
            return;
        } else {
            emptyParticipantsState.style.display = 'none';
            participantList.style.display = 'grid';
            openAddExpenseModalBtn.disabled = false;
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

        document.querySelectorAll('.participant .remove-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = parseInt(event.target.dataset.index);
                removeParticipant(index);
            });
        });

        updatePayerSelect();
        checkCalculateButtonStatus();
    }

    function addParticipant(name) {
        if (name && !participants.includes(name)) {
            participants.push(name);
            renderParticipants();
            participantNameInput.value = '';
            closeModal(addParticipantModal);
        } else if (participants.includes(name)) {
            alert('Este participante ya existe.');
        }
    }

    function removeParticipant(index) {
        const removedParticipant = participants[index];
        participants.splice(index, 1);

        expenses = expenses.filter(expense => expense.payer !== removedParticipant);

        renderParticipants();
        renderExpenses();
        checkCalculateButtonStatus();
    }

    function updatePayerSelect() {
        expensePayerSelect.innerHTML = '<option value="" disabled selected>Selecciona quien pagó</option>';
        participants.forEach(participantName => {
            const option = document.createElement('option');
            option.value = participantName;
            option.textContent = participantName;
            expensePayerSelect.appendChild(option);
        });
    }

    function populateExcludedParticipantsCheckboxes() {
        excludedParticipantsList.innerHTML = '';

        if (participants.length === 0) {
            excludedParticipantsList.innerHTML = '<p style="color: rgba(204,214,223,0.6); font-size: 0.9em;">Agrega participantes primero.</p>';
            return;
        }

        participants.forEach(pName => {
            const item = document.createElement('label');
            item.classList.add('excluded-participant-item');
            item.innerHTML = `
                <input type="checkbox" value="${pName}">
                <span>${pName}</span>
            `;
            excludedParticipantsList.appendChild(item);
        });
    }

    function renderExpenses() {
        expenseList.innerHTML = '';

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
            expenseDescriptionInput.value = '';
            expenseAmountInput.value = '';
            expensePayerSelect.value = '';
            populateExcludedParticipantsCheckboxes();
            closeModal(addExpenseModal);
        } else {
            alert('Por favor, completa todos los campos del gasto correctamente.');
        }
    }

    function removeExpense(index) {
        expenses.splice(index, 1);
        renderExpenses();
        checkCalculateButtonStatus();
    }

    function checkCalculateButtonStatus() {
        if (participants.length >= 2 && expenses.length >= 1) {
            calculateBtn.disabled = false;
        } else {
            calculateBtn.disabled = true;
        }
    }

    calculateBtn.addEventListener('click', () => {
        const calculationResults = calculator.calculateSettlements(participants, expenses);
        displayResults(calculationResults.formattedSummaryHtml, calculationResults.formattedSummaryPlainText);
    });

    function displayResults(htmlContent, plainTextContent) {
        resultsTextContainer.innerHTML = htmlContent;
        resultsTextContainer.dataset.plainText = plainTextContent;
        openModal(resultsModal);
    }

    openAddParticipantModalBtn.addEventListener('click', () => {
        openModal(addParticipantModal);
    });

    openAddExpenseModalBtn.addEventListener('click', () => {
        updatePayerSelect();
        populateExcludedParticipantsCheckboxes();
        openModal(addExpenseModal);
    });

    expensePayerSelect.addEventListener('change', () => {
        populateExcludedParticipantsCheckboxes();
    });

    addParticipantForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = participantNameInput.value.trim();
        addParticipant(name);
    });

    addExpenseForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const description = expenseDescriptionInput.value.trim();
        const amount = parseFloat(expenseAmountInput.value);
        const payer = expensePayerSelect.value;

        const excludedCheckboxes = document.querySelectorAll('#excludedParticipantsList input[type="checkbox"]:checked');
        const excludedParticipants = Array.from(excludedCheckboxes).map(cb => cb.value);

        addExpense(description, amount, payer, excludedParticipants);
    });

    shareWhatsappBtn.addEventListener('click', () => {
        const textToShare = resultsTextContainer.dataset.plainText;
        const encodedText = encodeURIComponent(textToShare);
        const whatsappUrl = `https://wa.me/?text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
    });

    copyResultsBtn.addEventListener('click', () => {
        const textToCopy = resultsTextContainer.dataset.plainText;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
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

    renderParticipants();
    renderExpenses();
    checkCalculateButtonStatus();
});