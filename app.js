const STORAGE_KEY = 'julio-ticket-intake-v2';

const seedTickets = [];

const statusLabels = { new: 'Nuevo', review: 'En revisión', qa: 'Listo para avanzar', blocked: 'Bloqueado', done: 'Cerrado' };
let tickets = loadTickets();
let selectedId = tickets[0]?.id || null;
let activeFilter = 'all';
let searchTerm = '';
let isNewTicket = false;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadTickets() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.length ? saved : structuredClone(seedTickets);
  } catch (error) {
    return structuredClone(seedTickets);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function priorityClass(priority) {
  return priority === 'Alta' ? 'high' : priority === 'Media' ? 'medium' : 'low';
}

function visibleTickets() {
  return tickets.filter((ticket) => {
    const matchesSearch = !searchTerm || [ticket.title, ticket.area, ticket.module, ticket.id].join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || activeFilter === 'high' && ticket.priority === 'Alta' || activeFilter === 'odoo' && ticket.area === 'Odoo' || activeFilter === 'active' && ['review', 'qa'].includes(ticket.status) || activeFilter === 'history' && ticket.status === 'done' || ['new', 'review', 'qa', 'blocked'].includes(activeFilter) && ticket.status === activeFilter;
    return matchesSearch && matchesFilter;
  });
}

function renderList() {
  const list = $('#ticketList');
  const items = visibleTickets();
  $('#visibleCount').textContent = items.length;
  $('#emptyState').classList.toggle('is-hidden', items.length > 0);
  list.innerHTML = items.map((ticket) => `
    <button class="ticket-item ${ticket.id === selectedId ? 'is-selected' : ''}" type="button" data-id="${ticket.id}" aria-pressed="${ticket.id === selectedId}" aria-label="Abrir ${escapeHtml(ticket.title)}">
      <span class="ticket-frame" aria-hidden="true"></span>
      <span>
        <h3>${escapeHtml(ticket.title)}</h3>
        <span class="ticket-meta"><span>${escapeHtml(ticket.area)}</span><span>${escapeHtml(statusLabels[ticket.status] || 'Sin estado')}</span></span>
      </span>
      <span class="ticket-side"><span class="ticket-code">${ticket.id}</span><span class="priority-mark ${priorityClass(ticket.priority)}" title="Prioridad ${escapeHtml(ticket.priority)}"></span></span>
    </button>
  `).join('');
  $$('.ticket-item').forEach((item) => item.addEventListener('click', () => selectTicket(item.dataset.id)));
  updateCounts();
  updateScrollHint();
}

function updateCounts() {
  $('#railTotal').textContent = tickets.length;
  $('#allCount').textContent = `${tickets.length} ticket${tickets.length === 1 ? '' : 's'}`;
  ['new', 'review', 'qa', 'blocked'].forEach((status) => {
    const count = tickets.filter((ticket) => ticket.status === status).length;
    const node = $(`#${status}Count`);
    if (node) node.textContent = `${count} ticket${count === 1 ? '' : 's'}`;
  });
  const activeCount = tickets.filter((ticket) => ['review', 'qa'].includes(ticket.status)).length;
  $('#activeCount').textContent = activeCount;
}

function updateScrollHint() {
  const list = $('#ticketList');
  const hint = $('#scrollHint');
  if (!list || !hint) return;
  const isNarrow = window.matchMedia('(max-width: 930px)').matches;
  hint.classList.toggle('is-hidden', !isNarrow || list.scrollHeight <= list.clientHeight + 4);
}

function selectTicket(id) {
  selectedId = id;
  isNewTicket = false;
  const ticket = tickets.find((item) => item.id === id);
  if (ticket) fillForm(ticket);
  renderList();
  $('#editorTitle').textContent = 'Editar ticket';
}

function fillForm(ticket) {
  $('#editorId').textContent = ticket.id;
  $('#saveLabel').textContent = ticket.updated ? `Guardado ${ticket.updated}` : 'Sin guardar';
  $('#titleInput').value = ticket.title || '';
  $('#descriptionInput').value = ticket.description || '';
  $('#areaInput').value = ticket.area || '';
  $('#typeInput').value = ticket.type || '';
  $('#priorityInput').value = ticket.priority || '';
  $('#moduleInput').value = ticket.module || '';
  $('#requesterInput').value = ticket.requester || '';
  $('#environmentInput').value = ticket.environment || 'Local';
  $('#acceptanceInput').value = ticket.acceptance || '';
  updateStatus(ticket.status);
  updateReadiness();
}

function clearForm() {
  $('#editorId').textContent = 'NUEVO';
  $('#saveLabel').textContent = 'Borrador sin guardar';
  $('#ticketForm').reset();
  $('#environmentInput').value = 'Local';
  updateStatus('new');
  updateReadiness();
}

function updateStatus(status) {
  const label = statusLabels[status] || statusLabels.new;
  $('#statusLabel').textContent = label;
  $('#statusHelp').textContent = status === 'qa' ? 'La ficha está lista para avanzar' : status === 'blocked' ? 'Falta una respuesta para continuar' : status === 'done' ? 'Este ticket está en el historial' : status === 'new' ? 'Recién recibida' : 'Falta confirmar un criterio';
  $('#advanceStatusText').textContent = status === 'qa' ? 'Devolver a revisión' : status === 'done' ? 'Reabrir ticket' : 'Marcar listo para avanzar';
  $('#advanceStatusButton').querySelector('.inline-icon').innerHTML = status === 'qa' || status === 'done' ? '<path d="M19 12H6m5 6-6-6 6-6" />' : '<path d="M5 12h13m-5-6 6 6-6 6" />';
  $('#advanceStatusButton').dataset.nextStatus = status === 'qa' || status === 'done' ? 'review' : 'qa';
}

function updateReadiness() {
  const values = ['#titleInput', '#descriptionInput', '#areaInput', '#typeInput', '#priorityInput', '#acceptanceInput'].map((selector) => $(selector).value.trim());
  const completed = values.filter(Boolean).length;
  const percent = Math.round((completed / values.length) * 100);
  $('#readinessValue').textContent = `${percent}%`;
  $('#readinessTitle').textContent = percent === 100 ? 'Ficha lista para circular' : 'Ficha incompleta';
  $('#readinessCopy').textContent = percent === 100 ? 'Puedes guardarla y enviarla a la cola.' : `Completa ${values.length - completed} campo${values.length - completed === 1 ? '' : 's'} marcado${values.length - completed === 1 ? '' : 's'}.`;
  const ring = $('.readiness-ring');
  ring.style.borderRightColor = percent === 100 ? 'var(--good)' : 'var(--orange)';
  ring.style.borderTopColor = percent > 24 ? 'var(--orange)' : 'var(--paper-deep)';
}

function getFormData() {
  return {
    title: $('#titleInput').value.trim(), description: $('#descriptionInput').value.trim(), area: $('#areaInput').value, type: $('#typeInput').value, priority: $('#priorityInput').value,
    module: $('#moduleInput').value.trim(), requester: $('#requesterInput').value.trim(), environment: $('#environmentInput').value, acceptance: $('#acceptanceInput').value.trim()
  };
}

function saveTicket(event) {
  event.preventDefault();
  const data = getFormData();
  if (!data.title || !data.description || !data.area || !data.type || !data.priority || !data.acceptance) {
    showFormError('Faltan datos obligatorios. Completa asunto, descripción, área, tipo, prioridad y criterios de aceptación.');
    showToast('Completa los campos obligatorios antes de guardar.');
    $('#ticketForm').querySelector(':invalid')?.focus();
    return;
  }
  hideFormError();
  const saveButton = $('#saveTicketButton');
  saveButton.disabled = true;
  saveButton.setAttribute('aria-busy', 'true');
  const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  if (isNewTicket) {
    const nextNumber = Math.max(...tickets.map((ticket) => Number(ticket.id.replace(/\D/g, ''))), 0) + 1;
    const ticket = { id: `JUL-${String(nextNumber).padStart(4, '0')}`, ...data, status: 'new', updated: `a las ${now}` };
    tickets = [ticket, ...tickets];
    selectedId = ticket.id;
    isNewTicket = false;
  } else {
    const index = tickets.findIndex((ticket) => ticket.id === selectedId);
    if (index !== -1) tickets[index] = { ...tickets[index], ...data, updated: `a las ${now}` };
  }
  persist();
  saveButton.disabled = false;
  saveButton.removeAttribute('aria-busy');
  renderList();
  selectTicket(selectedId);
  showToast('Ticket guardado en la mesa.');
}

function advanceStatus() {
  if (isNewTicket) {
    showToast('Guarda el ticket antes de enviarlo a la cola.');
    return;
  }
  const ticket = tickets.find((item) => item.id === selectedId);
  if (!ticket) return;
  ticket.status = $('#advanceStatusButton').dataset.nextStatus;
  ticket.updated = 'ahora';
  persist();
  updateStatus(ticket.status);
  renderList();
  showToast(ticket.status === 'qa' ? 'Ticket marcado como listo para avanzar.' : ticket.status === 'review' ? 'Ticket devuelto a revisión.' : 'Ticket reabierto.');
}

function smartStructure() {
  const text = `${$('#titleInput').value} ${$('#descriptionInput').value}`.toLowerCase();
  if (!text.trim()) {
    showFormError('Escribe un asunto o una descripción antes de estructurar la solicitud.');
    showToast('Escribe primero un asunto o una descripción.');
    $('#titleInput').focus();
    return;
  }
  const area = text.includes('pos') || text.includes('caja') || text.includes('ticket') || text.includes('vale') || text.includes('pdv') || text.includes('compra') || text.includes('proveedor') || text.includes('inventario') || text.includes('recepc') ? 'Odoo' : text.includes('factura') || text.includes('contab') ? 'Administración' : text.includes('cliente') ? 'Clientes' : text.includes('automat') || text.includes('hoja') || text.includes('flujo') ? 'Automatización' : 'Desarrollo';
  const type = text.includes('bug') || text.includes('no ') || text.includes('error') || text.includes('falla') ? 'Bug' : 'Solicitud';
  $('#areaInput').value = area;
  $('#typeInput').value = type;
  if (!$('#priorityInput').value) $('#priorityInput').value = text.includes('no ') || text.includes('error') || text.includes('urg') ? 'Alta' : 'Media';
  if (!$('#acceptanceInput').value) $('#acceptanceInput').value = `El comportamiento solicitado funciona en ${area}.\nLa prueba no genera errores ni afecta el flujo existente.`;
  updateReadiness();
  showToast('Solicitud estructurada: revisa y ajusta antes de guardar.');
}

function applyFilter(filter) {
  activeFilter = filter;
  const firstVisible = visibleTickets()[0];
  if (firstVisible && firstVisible.id !== selectedId) {
    selectedId = firstVisible.id;
    isNewTicket = false;
    fillForm(firstVisible);
  }
  $$('.filter-chip, .rail-stop, .topnav-link[data-filter]').forEach((button) => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  renderList();
}

function showFormError(message) {
  const error = $('#formError');
  error.textContent = message;
  error.classList.remove('is-hidden');
}

function hideFormError() {
  $('#formError').classList.add('is-hidden');
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('is-visible'), 3300);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

$('#ticketForm').addEventListener('submit', saveTicket);
$('#advanceStatusButton').addEventListener('click', advanceStatus);
$('#structureButton').addEventListener('click', smartStructure);
$('#newTicketButton').addEventListener('click', () => { isNewTicket = true; selectedId = null; clearForm(); renderList(); $('#editorTitle').textContent = 'Recibir ticket'; $('#titleInput').focus(); });
$('#discardButton').addEventListener('click', () => { if (isNewTicket) selectTicket(tickets[0]?.id); else selectTicket(selectedId); showToast('Cambios descartados.'); });
$('#searchInput').addEventListener('input', (event) => { searchTerm = event.target.value; renderList(); });
$('#refreshButton').addEventListener('click', () => { renderList(); showToast('Cola actualizada.'); });
$$('[data-filter]').forEach((button) => button.addEventListener('click', () => applyFilter(button.dataset.filter)));
$$('#ticketForm input, #ticketForm textarea, #ticketForm select').forEach((input) => input.addEventListener('input', () => { updateReadiness(); hideFormError(); }));
document.addEventListener('keydown', (event) => { if (event.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') { event.preventDefault(); $('#searchInput').focus(); } });
window.addEventListener('resize', updateScrollHint);

if (tickets[0]) {
  fillForm(tickets[0]);
} else {
  isNewTicket = true;
  clearForm();
  $('#editorTitle').textContent = 'Recibir ticket';
}
renderList();
