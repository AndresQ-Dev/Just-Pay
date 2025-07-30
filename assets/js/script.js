// assets/js/script.js

import { calculator } from './calculator.js';

document.addEventListener('DOMContentLoaded', () => {
    let participants = [];
    let expenses = [];

    // Variables para gestión de swipe
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwipeGesture = false;

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

    // Cerrar modal al hacer clic en el backdrop
    backdrop.addEventListener('click', closeAllModals);

    const shareWhatsappBtn = document.getElementById('shareWhatsappBtn');
    const copyResultsBtn = document.getElementById('copyResultsBtn');
    const resultsTextContainer = document.getElementById('resultsText');

    // FAB System Variables - FASE 3
    const fabContainer = document.getElementById('fabContainer');
    const mainFab = document.getElementById('mainFab');
    const mainFabIcon = document.getElementById('mainFabIcon');
    const miniFabs = document.getElementById('miniFabs');
    const addParticipantFab = document.getElementById('addParticipantFab');
    const addExpenseFab = document.getElementById('addExpenseFab');
    const calculateFab = document.getElementById('calculateFab');
    let fabExpanded = false;

    function openModal(modalElement) {
        modalElement.classList.add('active');
        backdrop.classList.add('active');
        
        // Auto-focus en el campo principal del modal con un pequeño delay
        // para asegurar que el modal esté completamente renderizado
        setTimeout(() => {
            if (modalElement === addParticipantModal) {
                participantNameInput.focus();
                participantNameInput.select(); // Selecciona todo el texto si hay alguno
            } else if (modalElement === addExpenseModal) {
                expenseDescriptionInput.focus();
                expenseDescriptionInput.select(); // Selecciona todo el texto si hay alguno
            }
        }, 100); // Pequeño delay para asegurar que la animación del modal termine
    }

    function closeModal(modalElement) {
        modalElement.classList.remove('active');
        backdrop.classList.remove('active');
        
        // Limpiar focus al cerrar modal
        if (document.activeElement && (
            document.activeElement === participantNameInput || 
            document.activeElement === expenseDescriptionInput ||
            document.activeElement === expenseAmountInput ||
            document.activeElement === expensePayerSelect
        )) {
            document.activeElement.blur();
        }
    }

    function closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        backdrop.classList.remove('active');
        
        // Limpiar focus al cerrar todos los modales
        if (document.activeElement && (
            document.activeElement === participantNameInput || 
            document.activeElement === expenseDescriptionInput ||
            document.activeElement === expenseAmountInput ||
            document.activeElement === expensePayerSelect
        )) {
            document.activeElement.blur();
        }
    }

    // ====== FUNCIONES DE SWIPE PARA TOUCH ======
    function initSwipeGestures() {
        // Swipe para participantes
        participantList.addEventListener('touchstart', handleTouchStart, { passive: true });
        participantList.addEventListener('touchmove', handleTouchMove, { passive: false });
        participantList.addEventListener('touchend', handleTouchEnd, { passive: true });

        // Swipe para gastos
        expenseList.addEventListener('touchstart', handleTouchStart, { passive: true });
        expenseList.addEventListener('touchmove', handleTouchMove, { passive: false });
        expenseList.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    function handleTouchStart(e) {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        isSwipeGesture = false;

        // Determinar si el toque es en un elemento swipeable
        const target = e.target.closest('.participant, .expense-item');
        if (target) {
            target.dataset.touchTarget = 'true';
        }
    }

    function handleTouchMove(e) {
        if (!e.touches[0]) return;
        
        const touch = e.touches[0];
        const diffX = touch.clientX - touchStartX;
        const diffY = touch.clientY - touchStartY;
        const target = e.target.closest('.participant, .expense-item');

        if (!target || !target.dataset.touchTarget) return;

        // Determinar si es un gesto de swipe horizontal
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
            isSwipeGesture = true;
            e.preventDefault(); // Prevenir scroll mientras se hace swipe
            
            // Mostrar hint visual de swipe si se mueve hacia la izquierda
            if (diffX < -50) {
                target.classList.add('swipe-hint');
            } else {
                target.classList.remove('swipe-hint');
            }
        }
    }

    function handleTouchEnd(e) {
        const target = e.target.closest('.participant, .expense-item');
        if (!target || !target.dataset.touchTarget) return;

        delete target.dataset.touchTarget;
        target.classList.remove('swipe-hint');

        if (!isSwipeGesture) return;

        const touch = e.changedTouches[0];
        const diffX = touch.clientX - touchStartX;
        const diffTime = Date.now() - touchStartTime;

        // Swipe rápido hacia la izquierda para eliminar
        if (diffX < -100 && diffTime < 300) {
            handleSwipeDelete(target);
        }

        isSwipeGesture = false;
    }

    function handleSwipeDelete(element) {
        // Vibración haptica si está disponible
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        element.classList.add('removing');
        
        setTimeout(() => {
            if (element.classList.contains('participant')) {
                const index = Array.from(element.parentNode.children).indexOf(element);
                removeParticipant(index);
            } else if (element.classList.contains('expense-item')) {
                const index = parseInt(element.querySelector('.delete-btn').dataset.index);
                removeExpense(index);
            }
        }, 300);
    }

    // Función auxiliar para feedback haptic
    function hapticFeedback(type = 'light') {
        if (navigator.vibrate) {
            switch(type) {
                case 'light': navigator.vibrate(25); break;
                case 'medium': navigator.vibrate(50); break;
                case 'heavy': navigator.vibrate([50, 25, 50]); break;
            }
        }
    }

    // ====== SISTEMA FAB - FASE 3 ======
    function initFABSystem() {
        // Toggle del FAB principal
        mainFab.addEventListener('click', toggleFAB);
        
        // Event listeners para mini FABs
        addParticipantFab.addEventListener('click', (e) => {
            e.stopPropagation();
            hapticFeedback('light');
            openModal(addParticipantModal);
            closeFAB();
        });
        
        addExpenseFab.addEventListener('click', (e) => {
            e.stopPropagation();
            hapticFeedback('light');
            if (participants.length > 0) {
                updatePayerSelect();
                populateExcludedParticipantsCheckboxes();
                openModal(addExpenseModal);
            } else {
                // Mostrar feedback visual si no hay participantes
                hapticFeedback('heavy');
                showToast('Primero debes agregar participantes');
            }
            closeFAB();
        });
        
        calculateFab.addEventListener('click', (e) => {
            e.stopPropagation();
            hapticFeedback('medium');
            if (participants.length > 0 && expenses.length > 0) {
                calculateExpenses();
            } else {
                hapticFeedback('heavy');
                showToast('Necesitas participantes y gastos para calcular');
            }
            closeFAB();
        });

        // Cerrar FAB al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (fabExpanded && !fabContainer.contains(e.target)) {
                closeFAB();
            }
        });

        // Cerrar FAB al abrir modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && fabExpanded) {
                closeFAB();
            }
        });
    }

    function toggleFAB() {
        hapticFeedback('light');
        
        if (fabExpanded) {
            closeFAB();
        } else {
            expandFAB();
        }
    }

    function expandFAB() {
        fabExpanded = true;
        mainFab.classList.add('expanded');
        miniFabs.classList.add('expanded');
        
        // Actualizar estado de mini FABs basado en condiciones
        updateFABStates();
    }

    function closeFAB() {
        fabExpanded = false;
        mainFab.classList.remove('expanded');
        miniFabs.classList.remove('expanded');
    }

    function updateFABStates() {
        // Deshabilitar gasto FAB si no hay participantes
        if (participants.length === 0) {
            addExpenseFab.style.opacity = '0.5';
            addExpenseFab.style.pointerEvents = 'none';
        } else {
            addExpenseFab.style.opacity = '1';
            addExpenseFab.style.pointerEvents = 'auto';
        }

        // Deshabilitar calcular FAB si no hay participantes o gastos
        if (participants.length === 0 || expenses.length === 0) {
            calculateFab.style.opacity = '0.5';
            calculateFab.style.pointerEvents = 'none';
        } else {
            calculateFab.style.opacity = '1';
            calculateFab.style.pointerEvents = 'auto';
        }
    }

    function showToast(message) {
        // Crear elemento toast si no existe
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 120px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                font-size: 14px;
                z-index: 1002;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';

        setTimeout(() => {
            toast.style.opacity = '0';
        }, 2000);
    }

    // ====== RENDERIZADO DE PARTICIPANTES ======

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
                hapticFeedback('medium'); // Feedback haptic al tocar
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
            
            // Feedback haptic de éxito
            hapticFeedback('light');
        } else if (participants.includes(name)) {
            // Feedback haptic de error
            hapticFeedback('heavy');
            alert('Este participante ya existe.');
            // Mantener focus en el input para corrección inmediata
            setTimeout(() => {
                participantNameInput.focus();
                participantNameInput.select();
            }, 100);
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
                <div class="expense-info">
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-payer">Pagó: ${expense.payer}</div>
                    ${expense.excluded.length > 0 ? `<div class="expense-excluded">Excluidos: ${expense.excluded.join(', ')}</div>` : ''}
                    <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                </div>
                <button class="delete-btn" data-index="${index}">&times;</button>
            `;
            expenseList.appendChild(expenseItem);
        });

        document.querySelectorAll('.expense-item .delete-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                hapticFeedback('medium'); // Feedback haptic al tocar
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
            
            // Feedback haptic de éxito
            hapticFeedback('light');
        } else {
            // Feedback haptic de error
            hapticFeedback('heavy');
            alert('Por favor, completa todos los campos del gasto correctamente.');
            
            // Mantener focus en el primer campo incompleto
            setTimeout(() => {
                if (!description) {
                    expenseDescriptionInput.focus();
                } else if (!amount || amount <= 0) {
                    expenseAmountInput.focus();
                } else if (!payer) {
                    expensePayerSelect.focus();
                }
            }, 100);
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
        
        // Actualizar estado de los FABs
        updateFABStates();
    }

    calculateBtn.addEventListener('click', () => {
        hapticFeedback('light'); // Feedback haptic al calcular
        calculateExpenses();
    });

    function calculateExpenses() {
        const calculationResults = calculator.calculateSettlements(participants, expenses);
        displayResults(calculationResults.formattedSummaryHtml, calculationResults.formattedSummaryPlainText);
    }

    function displayResults(htmlContent, plainTextContent) {
        resultsTextContainer.innerHTML = htmlContent;
        resultsTextContainer.dataset.plainText = plainTextContent;
        openModal(resultsModal);
    }

    openAddParticipantModalBtn.addEventListener('click', () => {
        hapticFeedback('light');
        openModal(addParticipantModal);
    });

    openAddExpenseModalBtn.addEventListener('click', () => {
        hapticFeedback('light');
        updatePayerSelect();
        populateExcludedParticipantsCheckboxes();
        openModal(addExpenseModal);
    });

    expensePayerSelect.addEventListener('change', () => {
        // Este evento se maneja ahora en initSelectCompatibility()
        // para evitar duplicación
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
        hapticFeedback('light');
        const textToShare = resultsTextContainer.dataset.plainText;
        const encodedText = encodeURIComponent(textToShare);
        const whatsappUrl = `https://wa.me/?text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
    });

    copyResultsBtn.addEventListener('click', () => {
        hapticFeedback('light');
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
    
    // ====== INICIALIZACIÓN DE SISTEMAS ======
    
    // Inicializar gestos de swipe
    initSwipeGestures();
    
    // ====== SISTEMA FAB - FASE 3 ======
    initFABSystem();
    
    // ====== NAVEGACIÓN POR TECLADO ======
    initKeyboardNavigation();
    
    // ====== CONFIGURACIÓN ANTI-AUTOCOMPLETE ======
    initAntiAutocomplete();
    
    // ====== VERIFICACIÓN DE COMPATIBILIDAD SELECT ======
    initSelectCompatibility();
    
    function initSelectCompatibility() {
        // Verificar que el select funcione correctamente en Chrome
        expensePayerSelect.addEventListener('click', (e) => {
            // Forzar focus si el click no lo activó
            if (document.activeElement !== expensePayerSelect) {
                expensePayerSelect.focus();
            }
        });
        
        // Agregar evento change mejorado
        expensePayerSelect.addEventListener('change', (e) => {
            hapticFeedback('light'); // Feedback al seleccionar
            populateExcludedParticipantsCheckboxes();
        });
        
        // Mejorar la experiencia táctil en móvil
        expensePayerSelect.addEventListener('touchstart', (e) => {
            // Asegurar que el select responda en touch
            e.target.style.transform = 'scale(1.02)';
        });
        
        expensePayerSelect.addEventListener('touchend', (e) => {
            e.target.style.transform = 'scale(1)';
        });
    }
    
    function initAntiAutocomplete() {
        // Desactivar autocomplete de forma agresiva SOLO EN INPUTS (no selects)
        const inputs = [participantNameInput, expenseDescriptionInput, expenseAmountInput];
        
        inputs.forEach(input => {
            // Atributos HTML
            input.setAttribute('autocomplete', 'new-password'); // Truco para confundir navegadores
            input.setAttribute('autocapitalize', 'off');
            input.setAttribute('autocorrect', 'off');
            input.setAttribute('spellcheck', 'false');
            
            // Eventos para limpiar historial de sugerencias
            input.addEventListener('focus', () => {
                input.setAttribute('readonly', 'readonly');
                setTimeout(() => {
                    input.removeAttribute('readonly');
                }, 10);
            });
        });
        
        // Para el select, solo configuraciones básicas sin romper funcionalidad
        expensePayerSelect.setAttribute('autocomplete', 'off');
    }
    
    function initKeyboardNavigation() {
        // ====== SHORTCUTS DE TECLADO - FASE 4 ======
        document.addEventListener('keydown', (e) => {
            // Prevenir shortcuts cuando hay modal abierto o input enfocado
            const modalActive = document.querySelector('.modal.active');
            const inputFocused = document.activeElement && 
                ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);
            
            if (modalActive || inputFocused) {
                // Solo permitir Escape para cerrar modales
                if (e.key === 'Escape') {
                    closeAllModals();
                    closeFAB();
                }
                return;
            }

            // Atajos globales (solo cuando no hay modal activo)
            switch(e.key.toLowerCase()) {
                case 'p': // Agregar Participante
                    e.preventDefault();
                    hapticFeedback('light');
                    openModal(addParticipantModal);
                    showShortcutFeedback('Agregar Participante (P)');
                    break;
                
                case 'g': // Agregar Gasto
                    e.preventDefault();
                    hapticFeedback('light');
                    if (participants.length > 0) {
                        updatePayerSelect();
                        populateExcludedParticipantsCheckboxes();
                        openModal(addExpenseModal);
                        showShortcutFeedback('Agregar Gasto (G)');
                    } else {
                        hapticFeedback('heavy');
                        showToast('Primero debes agregar participantes');
                    }
                    break;
                
                case 'c': // Calcular
                    e.preventDefault();
                    hapticFeedback('medium');
                    if (participants.length >= 2 && expenses.length >= 1) {
                        const calculationResults = calculator.calculateSettlements(participants, expenses);
                        displayResults(calculationResults.formattedSummaryHtml, calculationResults.formattedSummaryPlainText);
                        showShortcutFeedback('Calcular Gastos (C)');
                    } else {
                        hapticFeedback('heavy');
                        showToast('Necesitas al menos 2 participantes y 1 gasto');
                    }
                    break;
                
                case 'f': // Toggle FAB
                    e.preventDefault();
                    toggleFAB();
                    showShortcutFeedback('Toggle FAB (F)');
                    break;
                
                case 'r': // Reset/Clear all
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (confirm('¿Estás seguro de que quieres borrar todos los datos?')) {
                            clearAllData();
                            showShortcutFeedback('Datos borrados (Ctrl+R)');
                        }
                    }
                    break;
                
                case 's': // Save to localStorage
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        saveDataToStorage();
                        showShortcutFeedback('Datos guardados (Ctrl+S)');
                    }
                    break;
                
                case 'h': // Show help
                case '?':
                    e.preventDefault();
                    showKeyboardShortcuts();
                    break;
            }
        });
        
        // Navegación mejorada dentro de modales
        setupModalNavigation();
    }

    function setupModalNavigation() {
        // Navegación entre campos en modal de gastos con Tab
        expenseDescriptionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                expenseAmountInput.focus();
            }
        });
        
        expenseAmountInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                expensePayerSelect.focus();
            }
        });
        
        expensePayerSelect.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Si hay campos de exclusión visibles, ir al primero
                const firstCheckbox = document.querySelector('#excludedParticipantsList input[type="checkbox"]');
                if (firstCheckbox) {
                    firstCheckbox.focus();
                } else {
                    // Si no hay checkboxes, enviar formulario
                    addExpenseForm.dispatchEvent(new Event('submit'));
                }
            }
        });

        // Navegación en checkboxes de exclusión
        document.addEventListener('keydown', (e) => {
            if (e.target.matches('#excludedParticipantsList input[type="checkbox"]')) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    // Enviar formulario de gasto
                    addExpenseForm.dispatchEvent(new Event('submit'));
                } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    focusNextCheckbox(e.target);
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    focusPrevCheckbox(e.target);
                }
            }
        });
    }

    function focusNextCheckbox(currentCheckbox) {
        const checkboxes = document.querySelectorAll('#excludedParticipantsList input[type="checkbox"]');
        const currentIndex = Array.from(checkboxes).indexOf(currentCheckbox);
        const nextIndex = (currentIndex + 1) % checkboxes.length;
        checkboxes[nextIndex].focus();
    }

    function focusPrevCheckbox(currentCheckbox) {
        const checkboxes = document.querySelectorAll('#excludedParticipantsList input[type="checkbox"]');
        const currentIndex = Array.from(checkboxes).indexOf(currentCheckbox);
        const prevIndex = currentIndex === 0 ? checkboxes.length - 1 : currentIndex - 1;
        checkboxes[prevIndex].focus();
    }

    function showShortcutFeedback(message) {
        // Crear elemento para feedback de shortcuts si no existe
        let shortcutFeedback = document.getElementById('shortcut-feedback');
        if (!shortcutFeedback) {
            shortcutFeedback = document.createElement('div');
            shortcutFeedback.id = 'shortcut-feedback';
            shortcutFeedback.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #118AB2 0%, #0A7B8A 100%);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                z-index: 1003;
                opacity: 0;
                transform: translateX(100px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            `;
            document.body.appendChild(shortcutFeedback);
        }

        shortcutFeedback.textContent = message;
        shortcutFeedback.style.opacity = '1';
        shortcutFeedback.style.transform = 'translateX(0)';

        setTimeout(() => {
            shortcutFeedback.style.opacity = '0';
            shortcutFeedback.style.transform = 'translateX(100px)';
        }, 2000);
    }

    function showKeyboardShortcuts() {
        const helpModal = createHelpModal();
        document.body.appendChild(helpModal);
        helpModal.classList.add('active');
        backdrop.classList.add('active');
    }

    function createHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'modal modal-help-type';
        modal.id = 'helpModal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <span class="close-btn" onclick="closeHelpModal()">&times;</span>
                    <h2><i class="fas fa-keyboard"></i> Atajos de Teclado</h2>
                </div>
                <div class="modal-body">
                    <div class="shortcuts-grid">
                        <div class="shortcut-item">
                            <kbd>P</kbd>
                            <span>Agregar Participante</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>G</kbd>
                            <span>Agregar Gasto</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>C</kbd>
                            <span>Calcular Gastos</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>F</kbd>
                            <span>Toggle FAB Menu</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>S</kbd>
                            <span>Guardar Datos</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>R</kbd>
                            <span>Borrar Todo</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>H</kbd> o <kbd>?</kbd>
                            <span>Mostrar esta Ayuda</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Esc</kbd>
                            <span>Cerrar Modales</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Enter</kbd>
                            <span>Navegar entre campos</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>↑ ↓ ← →</kbd>
                            <span>Navegar checkboxes</span>
                        </div>
                    </div>
                    <div class="help-footer">
                        <p><i class="fas fa-lightbulb"></i> Tip: Los atajos solo funcionan cuando no tienes ningún campo seleccionado</p>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    // Función global para cerrar modal de ayuda
    window.closeHelpModal = function() {
        const helpModal = document.getElementById('helpModal');
        if (helpModal) {
            helpModal.classList.remove('active');
            backdrop.classList.remove('active');
            setTimeout(() => {
                helpModal.remove();
            }, 300);
        }
    }
});