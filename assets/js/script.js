// Listas dinámicas para participantes y gastos
let participants = [];
let expenses = [];

// Referencias a elementos del DOM
const backdrop = document.querySelector('.backdrop');
const participantList = document.getElementById('participantList');
const expenseList = document.getElementById('expenseList');
const addParticipantForm = document.getElementById('addParticipantForm');
const addExpenseForm = document.getElementById('addExpenseForm');
const calculateBtn = document.querySelector('.calculate-btn');

/**
 * Crea y muestra un modal dinámico para agregar participantes o gastos.
 * @param {string} type - El tipo de modal a crear ('participant' o 'expense').
 * @returns {object} Un objeto con las referencias al modal, el formulario y el botón de cierre.
 */
function createAndShowModal(type) {
  // Elimina cualquier modal existente para evitar duplicados
  const existingModal = document.querySelector('.modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }

  // Creación de elementos básicos del modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  const closeBtn = document.createElement('span');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = '×';

  let formHtml = '';

  // Contenido del modal para agregar participante
  if (type === 'participant') {
    formHtml = `
      <form class="modal-form">
        <input type="text" id="participantName" placeholder="Nombre del participante" required autocomplete="off">
        <button type="submit">Agregar</button>
      </form>
    `;
  // Contenido del modal para agregar gasto
  } else if (type === 'expense' && participants.length > 0) {
    // Genera las opciones del select para el pagador
    const participantOptions = participants.map(p => `<option value="${p}">${p}</option>`).join('');

    // Genera los checkboxes para excluir participantes del gasto
    const excludedCheckboxes = participants.map(p => `
      <label class="excluded-participant-item">
        <input type="checkbox" name="excludedParticipants" value="${p}">
        <span>${p}</span>
      </label>
    `).join('');

    formHtml = `
      <form class="modal-form">
        <input type="text" id="expenseDescription" placeholder="Descripción del gasto" required autocomplete="off">
        <input type="number" id="expenseAmount" step="0.01" placeholder="Monto ($)" required min="0">
        <select id="expensePayer" required>
          <option value="" disabled selected hidden>Selecciona quién pagó</option>
          ${participantOptions}
        </select>

        <div class="excluded-participants-section">
          <h3>Excluir del pago:</h3>
          <div id="excludedParticipantsList" class="excluded-participants-list">
            ${excludedCheckboxes}
          </div>
        </div>

        <button type="submit">Agregar</button>
      </form>
    `;
  }

  // Agrega el contenido al modal
  modalContent.appendChild(closeBtn);
  modalContent.insertAdjacentHTML('beforeend', formHtml);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Activa el backdrop y el modal para hacerlos visibles con transiciones CSS
  backdrop.classList.add('active');
  modal.classList.add('active');

  // Auto-enfoque del campo de nombre del participante si es el modal de participante
  if (type === 'participant') {
    const participantNameInput = document.getElementById('participantName');
    if (participantNameInput) {
      participantNameInput.focus();
    }
  }

  return { modal, form: modalContent.querySelector('.modal-form'), closeBtn };
}

// Event Listener para el formulario de "Agregar Participante"
addParticipantForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Previene el envío del formulario por defecto
  const { modal, form, closeBtn } = createAndShowModal('participant');

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('participantName').value.trim();
    // Agrega el participante solo si el nombre no está vacío y no existe ya
    if (name && !participants.includes(name)) {
      participants.push(name);
      renderParticipants(); // Vuelve a renderizar la lista de participantes y llama a updateFormStates() desde allí
      cleanAndHideModal(modal); // Cierra el modal
    } else if (!name) {
      alert('El nombre del participante no puede estar vacío.');
    } else {
      alert(`El participante "${name}" ya existe.`);
    }
  };

  const handleClose = () => cleanAndHideModal(modal);

  // Asigna los event listeners al formulario y al botón de cierre
  form.addEventListener('submit', handleSubmit);
  closeBtn.addEventListener('click', handleClose);
  backdrop.addEventListener('click', handleClose); // Cierra el modal al hacer clic fuera
});

// Event Listener para el formulario de "Agregar Gasto"
addExpenseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // Solo permite abrir el modal de gasto si hay suficientes participantes (2 o más)
  if (participants.length >= 2) {
    const { modal, form, closeBtn } = createAndShowModal('expense');

    const handleSubmit = (e) => {
      e.preventDefault();
      const description = document.getElementById('expenseDescription').value.trim();
      const amount = parseFloat(document.getElementById('expenseAmount').value);
      const payer = document.getElementById('expensePayer').value.trim();

      // Recopila los participantes marcados para ser excluidos
      const excludedCheckboxes = form.querySelectorAll('input[name="excludedParticipants"]:checked');
      const excludedParticipants = Array.from(excludedCheckboxes).map(checkbox => checkbox.value);

      // Calcula quiénes serían los participantes activos para este gasto
      const activeParticipantsForThisExpense = participants.filter(p => !excludedParticipants.includes(p));

      // Validación clave: No se puede excluir a todos los participantes, debe quedar al menos uno.
      if (activeParticipantsForThisExpense.length === 0) {
        alert('No se puede excluir a todos los participantes del gasto. Al menos una persona (incluyendo al pagador) debe contribuir al mismo.');
        return; // Detiene el envío del formulario
      }

      // Valida que todos los campos requeridos estén llenos y el monto sea válido
      if (description && !isNaN(amount) && amount > 0 && payer) {
        // Agrega el nuevo gasto a la lista de gastos
        expenses.push({ description, amount, payer, excludedParticipants });
        renderExpenses(); // Vuelve a renderizar la lista de gastos
        cleanAndHideModal(modal); // Cierra el modal
        updateFormStates(); // Actualiza el estado del botón "Calcular"
      } else {
        alert('Por favor, asegúrate de completar todos los campos del gasto correctamente (descripción y monto deben ser válidos).');
      }
    };

    const handleClose = () => cleanAndHideModal(modal);

    // Asigna los event listeners al formulario y al botón de cierre
    form.addEventListener('submit', handleSubmit);
    closeBtn.addEventListener('click', handleClose);
    backdrop.addEventListener('click', handleClose); // Cierra el modal al hacer clic fuera
  } else {
    // Si se intenta agregar un gasto con menos de 2 participantes
    alert('Necesitas al menos dos participantes para poder agregar un gasto y dividirlo.');
  }
});

/**
 * Cierra y oculta el modal, removiéndolo del DOM después de una breve transición.
 * @param {HTMLElement} modal - La referencia al elemento modal a cerrar.
 */
function cleanAndHideModal(modal) {
  modal.classList.remove('active');
  backdrop.classList.remove('active');
  // Espera a que la transición CSS termine antes de remover el modal del DOM
  setTimeout(() => {
    if (modal.parentNode) { // Verifica si el modal aún está en el DOM
      modal.parentNode.removeChild(modal);
    }
  }, 300); // 300ms, coincide con la duración de la transición CSS
}

/**
 * Renderiza la lista de participantes en el DOM.
 * Muestra un mensaje de estado vacío si no hay participantes.
 */
function renderParticipants() {
  participantList.innerHTML = ''; // Limpia la lista actual
  if (participants.length === 0) {
    // Estado vacío con icono de Font Awesome
    participantList.innerHTML = '<div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-user-group"></i></span><p>Agrega participantes para empezar.</p></div>';
  } else {
    participants.forEach(participant => {
      const div = document.createElement('div');
      div.className = 'participant';
      div.innerHTML = `<span>${participant}</span> <span class="remove-btn" data-name="${participant}">×</span>`;
      participantList.appendChild(div);
    });
    // Agrega event listeners a los botones de eliminar participante
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        
        // Elimina los gastos donde este participante era el pagador
        expenses = expenses.filter(expense => expense.payer !== name);
        // Además, si el participante era un excluido de algún gasto, lo elimina de esa lista
        expenses.forEach(expense => {
            expense.excludedParticipants = expense.excludedParticipants.filter(p => p !== name);
        });

        // Elimina el participante de la lista principal
        participants = participants.filter(p => p !== name);
        
        renderParticipants(); // Vuelve a renderizar participantes (y llama a updateFormStates() desde allí)
        renderExpenses(); // Vuelve a renderizar gastos (por si se eliminaron gastos relacionados)
      });
    });
  }
  // Se llama updateFormStates() aquí para asegurar que los botones reflejen el estado actual de participants
  updateFormStates(); 
}

/**
 * Renderiza la lista de gastos en el DOM.
 * Muestra un mensaje de estado vacío si no hay gastos.
 */
function renderExpenses() {
  expenseList.innerHTML = ''; // Limpia la lista actual
  if (expenses.length === 0) {
    // Estado vacío con icono de Font Awesome
    expenseList.innerHTML = '<div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-receipt"></i></span><p>Registra tus primeros gastos una vez tengas al menos 2 participantes.</p></div>';
  } else {
    expenses.forEach(expense => {
      const div = document.createElement('div');
      div.className = 'expense-item';

      let excludedHtml = '';
      // Muestra la lista de excluidos si existe y no está vacía
      if (expense.excludedParticipants && expense.excludedParticipants.length > 0) {
        excludedHtml = `<span class="excluded-info">Excluidos: ${expense.excludedParticipants.join(', ')}</span>`;
      }

      // Estructura HTML modificada para la nueva disposición
      div.innerHTML = `
        <div class="expense-details">
            <div class="expense-description">${expense.description}</div>
            <div class="expense-payer">Pagado por: ${expense.payer}</div>
            ${excludedHtml ? `<div class="expense-excluded">${excludedHtml}</div>` : ''}
        </div>
        <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
      `;

      expenseList.appendChild(div);
    });
  }
}

/**
 * Actualiza el estado de los botones "Agregar Gasto" y "Calcular"
 * basándose en la cantidad de participantes y gastos.
 */
function updateFormStates() {
  // El botón de agregar gasto se deshabilita si hay menos de 2 participantes
  addExpenseForm.disabled = participants.length < 2; 
  // El botón de calcular se deshabilita si no hay participantes O no hay gastos
  calculateBtn.disabled = participants.length === 0 || expenses.length === 0;
}

// --- Inicialización de la Aplicación ---
// Estas llamadas iniciales configuran el estado al cargar la página.
// renderParticipants() ya llama a updateFormStates().
renderParticipants();
renderExpenses();

// Event listener para el botón de menú (funcionalidad no implementada en este ejemplo)
document.querySelector('.menu').addEventListener('click', () => {
  alert('Menú funcionalidad no implementada en este ejemplo.');
});

// Event listener para el botón "Calcular"
document.querySelector('.calculate-btn').addEventListener('click', () => {
  let calculationDetails = 'Funcionalidad de cálculo:\n';

  if (participants.length === 0 || expenses.length === 0) {
      calculationDetails += "No hay suficientes datos para calcular. Agrega participantes y gastos.";
  } else {
      expenses.forEach(expense => {
          // Filtra los participantes para incluir solo a los que deben pagar este gasto
          const activeParticipants = participants.filter(p => !expense.excludedParticipants.includes(p));

          if (activeParticipants.length === 0) {
              // Caso donde todos los participantes (incluido el pagador si es el único) están excluidos.
              // El pagador asume todo el monto.
              calculationDetails += `\n${expense.description} ($${expense.amount.toFixed(2)}) pagado por ${expense.payer}:\n`;
              calculationDetails += `  ¡Advertencia! Este gasto no tiene participantes activos. El pagador asume todo el monto.\n`;
          } else {
              // Calcula la parte que cada participante activo debe pagar
              const share = expense.amount / activeParticipants.length;
              calculationDetails += `\n${expense.description} ($${expense.amount.toFixed(2)}) pagado por ${expense.payer}:\n`;
              calculationDetails += `  Participantes activos: ${activeParticipants.join(', ')}\n`;
              calculationDetails += `  Cada uno debe pagar: $${share.toFixed(2)}\n`;
          }
      });
  }
  alert(calculationDetails);
});

// background:radial-gradient(at 74.66291976475527% 33.59636644446846%, hsla(248.1818181818182, 40.74074074074074%, 10.588235294117647%, 1) 0%, hsla(248.1818181818182, 40.74074074074074%, 10.588235294117647%, 0) 100%), radial-gradient(at 18.537292996460387% 50.713633955508676%, hsla(207.972972972973, 80.43478260869567%, 36.07843137254902%, 1) 0%, hsla(207.972972972973, 80.43478260869567%, 36.07843137254902%, 0) 100%), radial-gradient(at 59.57365029328492% 92.94809542831514%, hsla(208.00000000000003, 70.86614173228347%, 49.80392156862745%, 1) 0%, hsla(208.00000000000003, 70.86614173228347%, 49.80392156862745%, 0) 100%), radial-gradient(at 46.228319291459655% 29.92738701801445%, hsla(209.99999999999997, 8.47457627118644%, 23.137254901960784%, 1) 0%, hsla(209.99999999999997, 8.47457627118644%, 23.137254901960784%, 0) 100%), radial-gradient(at 19.879885628012552% 86.14043586817574%, hsla(0, 0%, 94.90196078431372%, 1) 0%, hsla(0, 0%, 94.90196078431372%, 0) 100%), radial-gradient(at 68.98392209896174% 0.3122073821022475%, hsla(248.1818181818182, 40.74074074074074%, 10.588235294117647%, 1) 0%, hsla(248.1818181818182, 40.74074074074074%, 10.588235294117647%, 0) 100%), radial-gradient(at 46.39597239154809% 47.39373517605854%, hsla(207.972972972973, 80.43478260869567%, 36.07843137254902%, 1) 0%, hsla(207.972972972973, 80.43478260869567%, 36.07843137254902%, 0) 100%), radial-gradient(at 16.884529076944798% 28.86242022575598%, hsla(208.00000000000003, 70.86614173228347%, 49.80392156862745%, 1) 0%, hsla(208.00000000000003, 70.86614173228347%, 49.80392156862745%, 0) 100%);