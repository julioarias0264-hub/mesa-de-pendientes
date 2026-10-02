const PROFILES_KEY = 'julio-ticket-profiles-v1';
const ACTIVE_PROFILE_KEY = 'julio-active-profile-v1';

const COLOR_OPTIONS = [
  { name: 'Coral', value: '#f06a3c', hot: '#ff8051', ink: '#9c361b' },
  { name: 'Turquesa', value: '#38b6a4', hot: '#58d2be', ink: '#167568' },
  { name: 'Violeta', value: '#9887f4', hot: '#b0a2ff', ink: '#6652be' },
  { name: 'Azul', value: '#4d9de0', hot: '#6fb6ed', ink: '#2d679c' },
  { name: 'Mostaza', value: '#e7b84b', hot: '#f2ca65', ink: '#987414' },
  { name: 'Rosa', value: '#e8749b', hot: '#f08eae', ink: '#a13f61' },
  { name: 'Lima', value: '#a9cf78', hot: '#c1e294', ink: '#5d7e32' }
];

const DEFAULT_CATEGORIES = ['General', 'Proyectos', 'Clientes', 'Administración', 'Desarrollo', 'Operación', 'Documentación', 'Personal'];
const statusLabels = { new: 'Nuevo', review: 'En revisión', qa: 'Listo para avanzar', blocked: 'Bloqueado', done: 'Cerrado' };
const FORM_CONFIG_KEY = 'julio-form-config-v1';
const DEFAULT_FORM_CONFIG = window.MESA_FORM_DEFAULTS || { areas: [{ name: 'General', subareas: ['Consulta', 'Soporte', 'Seguimiento'] }], types: ['Solicitud', 'Bug', 'Mejora'], priorities: ['Media', 'Alta', 'Baja'], theme: { mode: 'workspace', accent: '#f06a3c', hot: '#ff8051', ink: '#9c361b', initials: 'J', workspaceName: 'Julio' } };

let profiles = loadProfiles();
let activeProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY) || profiles[0]?.id || null;
let currentProfile = profiles.find((profile) => profile.id === activeProfileId) || null;
let tickets = [];
let formConfig = loadFormConfig();
let selectedId = tickets[0]?.id || null;
let activeFilter = 'all';
let activeView = 'home';
let searchTerm = '';
let isNewTicket = false;
let onboardingColor = COLOR_OPTIONS[0].value;
let profileDraft = null;
let adminSession = null;

let formConfigDraft = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeId() {
  return window.crypto?.randomUUID?.() || `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function profileInitials(name) {
  const initials = String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('');
  return (initials || 'JT').toUpperCase().slice(0, 3);
}

function normalizeCategories(categories) {
  return [...new Set((Array.isArray(categories) ? categories : []).map((category) => String(category).trim()).filter(Boolean))].slice(0, 24);
}

function normalizeFormConfig(config) {
  return window.normalizeMesaFormConfig ? window.normalizeMesaFormConfig(config) : clone(DEFAULT_FORM_CONFIG);
}

function loadFormConfig() {
  try {
    return normalizeFormConfig(JSON.parse(localStorage.getItem(FORM_CONFIG_KEY)));
  } catch (error) {
    return normalizeFormConfig(DEFAULT_FORM_CONFIG);
  }
}

function persistFormConfig() {
  localStorage.setItem(FORM_CONFIG_KEY, JSON.stringify(formConfig));
}

function normalizeProfile(profile) {
  if (!profile || !profile.id || !profile.name) return null;
  const color = COLOR_OPTIONS.some((option) => option.value === profile.color) ? profile.color : COLOR_OPTIONS[0].value;
  const categories = normalizeCategories(profile.categories);
  return {
    id: String(profile.id),
    name: String(profile.name).trim().slice(0, 40),
    initials: String(profile.initials || profileInitials(profile.name)).replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 3) || profileInitials(profile.name),
    color,
    categories: categories.length ? categories : clone(DEFAULT_CATEGORIES),
    createdAt: profile.createdAt || new Date().toISOString()
  };
}

function loadProfiles() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILES_KEY));
    return Array.isArray(saved) ? saved.map(normalizeProfile).filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

function persistProfiles() {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function persist() {
  // Los tickets se guardan únicamente en el servidor, en DATA_DIR.
}

function isAdminSession() {
  return Boolean(adminSession);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || 'No se pudo completar la solicitud.');
    error.status = response.status;
    if (response.status === 401 && adminSession) { adminSession = null; showAuthGate(); }
    throw error;
  }
  return body;
}

function formatTicketTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `el ${date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).replace('.', '')} a las ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
}

function mapTicket(row) {
  return {
    id: row.id,
    title: row.title || '', description: row.description || '', area: row.area || '', subarea: row.subarea || '',
    type: row.type || '', priority: row.priority || '', module: row.module || '', requester: row.requester || '',
    requester_email: row.requester_email || '', environment: row.environment || 'Cliente', acceptance: row.acceptance || '',
    status: row.status || 'new', source: row.source || 'public', updated: formatTicketTime(row.updatedAt || row.updated),
    createdAt: row.createdAt || ''
  };
}

async function refreshTickets({ quiet = false } = {}) {
  if (!isAdminSession()) return false;
  try {
    tickets = (await apiRequest('/api/tickets')).map(mapTicket);
    selectedId = tickets[0]?.id || null;
    if (tickets[0]) { isNewTicket = false; fillForm(tickets[0]); }
    else { isNewTicket = true; clearForm(); }
    renderList();
    setView(activeView);
    updateSyncStatus();
    if (!quiet) showToast('Cola actualizada.');
    return true;
  } catch (error) {
    console.error(error);
    if (!quiet) showToast('No se pudo actualizar la cola.');
    return false;
  }
}

async function refreshFormConfig({ quiet = false } = {}) {
  try {
    const data = await apiRequest('/api/form-config');
    if (data?.config) {
      formConfig = normalizeFormConfig(data.config);
      persistFormConfig();
      renderFormOptions();
    }
    return true;
  } catch (error) {
    console.error(error);
    if (!quiet) showToast('No se pudo actualizar la configuración del formulario.');
    return false;
  }
}

async function saveServerFormConfig() {
  await apiRequest('/api/form-config', { method: 'PUT', body: JSON.stringify({ config: formConfig }) });
  return true;
}

function getWorkspaceTheme() {
  const color = colorOption(currentProfile?.color);
  return {
    mode: 'workspace',
    accent: color.value,
    hot: color.hot,
    ink: color.ink,
    initials: currentProfile?.initials || 'J',
    workspaceName: currentProfile?.name || 'Julio'
  };
}

function syncFormThemeFromWorkspace({ saveToServer = false } = {}) {
  if (!currentProfile || formConfig.theme?.mode === 'custom') return;
  formConfig.theme = getWorkspaceTheme();
  persistFormConfig();
  if (saveToServer) void saveServerFormConfig().catch((error) => console.error('No se pudo guardar la apariencia del formulario.', error));
}

async function createServerTicket(ticket) {
  const created = await apiRequest('/api/tickets', { method: 'POST', body: JSON.stringify(ticket) });
  return mapTicket(created);
}

async function updateServerTicket(ticket) {
  const updated = await apiRequest(`/api/tickets/${encodeURIComponent(ticket.id)}`, { method: 'PATCH', body: JSON.stringify(ticket) });
  return mapTicket(updated);
}

async function updateServerTicketStatus(ticket) {
  const updated = await apiRequest(`/api/tickets/${encodeURIComponent(ticket.id)}`, { method: 'PATCH', body: JSON.stringify({ status: ticket.status }) });
  return mapTicket(updated);
}

function priorityClass(priority) {
  return priority === 'Alta' ? 'high' : priority === 'Media' ? 'medium' : 'low';
}

function visibleTickets() {
  const categoryFilter = activeFilter.startsWith('category:') ? activeFilter.slice(9) : null;
  return tickets.filter((ticket) => {
    const matchesSearch = !searchTerm || [ticket.title, ticket.area, ticket.subarea, ticket.module, ticket.id].join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all'
      || activeFilter === 'high' && ticket.priority === 'Alta'
      || activeFilter === 'active' && ['review', 'qa'].includes(ticket.status)
      || activeFilter === 'history' && ticket.status === 'done'
      || ['new', 'review', 'qa', 'blocked'].includes(activeFilter) && ticket.status === activeFilter
      || Boolean(categoryFilter) && ticket.area === categoryFilter;
    return matchesSearch && matchesFilter;
  });
}

function renderList() {
  const list = $('#ticketList');
  const items = visibleTickets();
  $('#visibleCount').textContent = items.length;
  $('#emptyState').classList.toggle('is-hidden', items.length > 0);
  list.innerHTML = items.map((ticket) => `
    <button class="ticket-item ${ticket.id === selectedId ? 'is-selected' : ''}" type="button" data-id="${escapeHtml(ticket.id)}" aria-pressed="${ticket.id === selectedId}" aria-label="Abrir ${escapeHtml(ticket.title)}">
      <span class="ticket-frame" aria-hidden="true"></span>
      <span>
        <h3>${escapeHtml(ticket.title)}</h3>
        <span class="ticket-meta"><span>${escapeHtml(ticket.area)}</span>${ticket.subarea ? `<span>${escapeHtml(ticket.subarea)}</span>` : ''}<span>${escapeHtml(statusLabels[ticket.status] || 'Sin estado')}</span></span>
      </span>
      <span class="ticket-side"><span class="ticket-code">${escapeHtml(ticket.id)}</span><span class="priority-mark ${priorityClass(ticket.priority)}" title="Prioridad ${escapeHtml(ticket.priority)}"></span></span>
    </button>
  `).join('');
  $$('.ticket-item').forEach((item) => item.addEventListener('click', () => selectTicket(item.dataset.id)));
  updateCounts();
  updateScrollHint();
}

function renderHome() {
  if (!currentProfile) return;
  $('#homeName').textContent = currentProfile.name;
  $('#homeDate').textContent = $('#railDate').textContent;
  $('#homeTotal').textContent = tickets.length;
  $('#homeActive').textContent = tickets.filter((ticket) => ['review', 'qa'].includes(ticket.status)).length;
  $('#homeDone').textContent = tickets.filter((ticket) => ticket.status === 'done').length;

  const recent = tickets.slice(0, 4);
  $('#homeRecentList').innerHTML = recent.length ? recent.map((ticket) => `
    <button class="home-recent-item" type="button" data-ticket-id="${escapeHtml(ticket.id)}">
      <span class="home-recent-dot" aria-hidden="true"></span>
      <span><strong>${escapeHtml(ticket.title)}</strong><small>${escapeHtml(ticket.area)} · ${escapeHtml(statusLabels[ticket.status] || 'Sin estado')}</small></span>
      <span class="home-recent-id">${escapeHtml(ticket.id)}</span>
    </button>
  `).join('') : `
    <div class="home-recent-empty">
      <span><strong>Aún no hay movimientos.</strong><span>Tu primer ticket puede empezar aquí.</span></span>
      <button class="button button-quiet" type="button" data-view="receiving">Crear el primero</button>
    </div>
  `;
  $('#homeRecentList').querySelectorAll('[data-ticket-id]').forEach((item) => item.addEventListener('click', () => openTicket(item.dataset.ticketId)));

  const categoryCounts = currentProfile.categories.map((category) => ({ category, count: tickets.filter((ticket) => ticket.area === category).length }));
  $('#homeCategoryList').innerHTML = categoryCounts.map(({ category, count }) => `<span class="home-category-chip">${escapeHtml(category)}<strong>${count}</strong></span>`).join('');
}

function renderSecondaryList(view) {
  const isHistory = view === 'history';
  const items = tickets.filter((ticket) => isHistory ? ticket.status === 'done' : ['review', 'qa'].includes(ticket.status));
  const list = $(`#${isHistory ? 'historyTicketList' : 'activeTicketList'}`);
  const empty = $(`#${isHistory ? 'historyEmpty' : 'activeEmpty'}`);
  const total = $(`#${isHistory ? 'historyViewTotal' : 'activeViewTotal'}`);
  total.textContent = items.length;
  list.innerHTML = items.map((ticket) => `
    <button class="secondary-ticket" type="button" data-ticket-id="${escapeHtml(ticket.id)}">
      <span class="secondary-ticket-dot" aria-hidden="true"></span>
      <span><strong>${escapeHtml(ticket.title)}</strong><small>${escapeHtml(ticket.area)} · ${escapeHtml(statusLabels[ticket.status] || 'Sin estado')}</small></span>
      <span class="secondary-ticket-code">${escapeHtml(ticket.id)}</span>
    </button>
  `).join('');
  empty.classList.toggle('is-hidden', items.length > 0);
  list.classList.toggle('is-hidden', items.length === 0);
  list.querySelectorAll('[data-ticket-id]').forEach((item) => item.addEventListener('click', () => openTicket(item.dataset.ticketId)));
}

function openTicket(id) {
  setView('receiving');
  selectTicket(id);
}

function setView(view) {
  if (!currentProfile) return;
  activeView = view;
  $$('.app-view').forEach((section) => section.classList.toggle('is-hidden', section.id !== `${view}View`));
  $$('[data-view]').forEach((button) => {
    const selected = button.dataset.view === view;
    if (button.classList.contains('topnav-link')) {
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
  });
  if (view === 'home') renderHome();
  if (view === 'active' || view === 'history') renderSecondaryList(view);
  if (view === 'receiving') renderList();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
  renderHome();
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
  renderSubareaOptions(ticket.area || '', ticket.subarea || '');
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
  renderSubareaOptions('', '');
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
    title: $('#titleInput').value.trim(), description: $('#descriptionInput').value.trim(), area: $('#areaInput').value, subarea: $('#subareaInput').value, type: $('#typeInput').value, priority: $('#priorityInput').value,
    module: $('#moduleInput').value.trim(), requester: $('#requesterInput').value.trim(), environment: $('#environmentInput').value, acceptance: $('#acceptanceInput').value.trim()
  };
}

async function saveTicket(event) {
  event.preventDefault();
  const data = getFormData();
  if (!data.title || !data.description || !data.area || !data.type || !data.priority || !data.acceptance) {
    showFormError('Faltan datos obligatorios. Completa asunto, descripción, categoría, tipo, prioridad y criterios de aceptación.');
    showToast('Completa los campos obligatorios antes de guardar.');
    $('#ticketForm').querySelector(':invalid')?.focus();
    return;
  }
  hideFormError();
  const saveButton = $('#saveTicketButton');
  saveButton.disabled = true;
  saveButton.setAttribute('aria-busy', 'true');
  const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  try {
    if (isNewTicket) {
      const nextNumber = Math.max(...tickets.map((ticket) => Number(String(ticket.id).replace(/\D/g, ''))), 0) + 1;
      let ticket = { id: `JUL-${String(nextNumber).padStart(4, '0')}`, ...data, status: 'new', updated: `a las ${now}`, source: 'desk' };
      ticket = await createServerTicket(ticket);
      tickets = [ticket, ...tickets.filter((item) => item.id !== ticket.id)];
      selectedId = ticket.id;
      isNewTicket = false;
    } else {
      const index = tickets.findIndex((ticket) => ticket.id === selectedId);
      if (index !== -1) {
        let ticket = { ...tickets[index], ...data, updated: `a las ${now}` };
        ticket = await updateServerTicket(ticket);
        tickets[index] = ticket;
      }
    }
    persist();
    renderList();
    selectTicket(selectedId);
    showToast('Ticket guardado en la mesa.');
  } catch (error) {
    console.error(error);
    showFormError(error.message || 'No se pudo guardar el ticket. Revisa que el servidor siga activo e inténtalo de nuevo.');
    showToast('No se pudo guardar el ticket.');
  } finally {
    saveButton.disabled = false;
    saveButton.removeAttribute('aria-busy');
  }
}

async function advanceStatus() {
  if (isNewTicket) {
    showToast('Guarda el ticket antes de enviarlo a la cola.');
    return;
  }
  const ticket = tickets.find((item) => item.id === selectedId);
  if (!ticket) return;
  ticket.status = $('#advanceStatusButton').dataset.nextStatus;
  ticket.updated = 'ahora';
  const button = $('#advanceStatusButton');
  button.disabled = true;
  try {
    const updated = await updateServerTicketStatus(ticket);
    Object.assign(ticket, updated);
    persist();
    updateStatus(ticket.status);
    renderList();
    showToast(ticket.status === 'qa' ? 'Ticket marcado como listo para avanzar.' : ticket.status === 'review' ? 'Ticket devuelto a revisión.' : 'Ticket reabierto.');
  } catch (error) {
    console.error(error);
    showToast('No se pudo actualizar el estado.');
  } finally {
    button.disabled = false;
  }
}

function smartStructure() {
  const text = `${$('#titleInput').value} ${$('#descriptionInput').value}`.toLowerCase();
  if (!text.trim()) {
    showFormError('Escribe un asunto o una descripción antes de estructurar la solicitud.');
    showToast('Escribe primero un asunto o una descripción.');
    $('#titleInput').focus();
    return;
  }
  const category = (name) => formConfig.areas.some((area) => area.name === name) ? name : formConfig.areas[0]?.name || '';
  const areaRules = [
    { terms: ['cliente', 'usuario'], area: 'Clientes' },
    { terms: ['administr', 'gestión', 'documento', 'reporte'], area: 'Administración' },
    { terms: ['operación', 'proceso', 'coordinación'], area: 'Operación' },
    { terms: ['desarrollo', 'mejora', 'corrección'], area: 'Desarrollo' },
    { terms: ['proyecto', 'planificación', 'entrega'], area: 'Proyectos' }
  ];
  const matchedRule = areaRules.find((rule) => rule.terms.some((term) => text.includes(term)));
  const area = category(matchedRule?.area || 'General');
  const type = text.includes('bug') || text.includes('no ') || text.includes('error') || text.includes('falla') ? 'Bug' : 'Solicitud';
  $('#areaInput').value = area;
  $('#typeInput').value = type;
  if (!$('#priorityInput').value) $('#priorityInput').value = text.includes('no ') || text.includes('error') || text.includes('urg') ? 'Alta' : 'Media';
  if (!$('#acceptanceInput').value) $('#acceptanceInput').value = `El comportamiento solicitado funciona en ${area || 'la categoría elegida'}.\nLa prueba no genera errores ni afecta el flujo existente.`;
  updateReadiness();
  showToast('Solicitud estructurada: revisa y ajusta antes de guardar.');
}

function applyFilter(filter) {
  setView('receiving');
  activeFilter = filter;
  const firstVisible = visibleTickets()[0];
  if (firstVisible && firstVisible.id !== selectedId) {
    selectedId = firstVisible.id;
    isNewTicket = false;
    fillForm(firstVisible);
  }
  $$('[data-filter]').forEach((button) => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  renderList();
}

function findFormArea(areaName) {
  return formConfig.areas.find((area) => area.name === areaName);
}

function renderSubareaOptions(areaName = $('#areaInput')?.value, selectedValue = $('#subareaInput')?.value) {
  const field = $('#subareaField');
  const select = $('#subareaInput');
  if (!field || !select) return;
  const area = findFormArea(areaName);
  const subareas = area?.subareas || [];
  field.classList.toggle('is-hidden', subareas.length === 0);
  select.innerHTML = `<option value="">Seleccionar detalle</option>${subareas.map((subarea) => `<option value="${escapeHtml(subarea)}">${escapeHtml(subarea)}</option>`).join('')}`;
  select.value = subareas.includes(selectedValue) ? selectedValue : '';
}

function renderFormOptions() {
  const areaSelect = $('#areaInput');
  const typeSelect = $('#typeInput');
  const prioritySelect = $('#priorityInput');
  if (!areaSelect || !typeSelect || !prioritySelect) return;
  const selectedArea = areaSelect.value;
  const selectedType = typeSelect.value;
  const selectedPriority = prioritySelect.value;
  areaSelect.innerHTML = `<option value="">Seleccionar área</option>${formConfig.areas.map((area) => `<option value="${escapeHtml(area.name)}">${escapeHtml(area.name)}</option>`).join('')}`;
  typeSelect.innerHTML = `<option value="">Seleccionar tipo</option>${formConfig.types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('')}`;
  prioritySelect.innerHTML = `<option value="">Seleccionar prioridad</option>${formConfig.priorities.map((priority) => `<option value="${escapeHtml(priority)}">${escapeHtml(priority)}</option>`).join('')}`;
  areaSelect.value = formConfig.areas.some((area) => area.name === selectedArea) ? selectedArea : '';
  typeSelect.value = formConfig.types.includes(selectedType) ? selectedType : '';
  prioritySelect.value = formConfig.priorities.includes(selectedPriority) ? selectedPriority : '';
  renderSubareaOptions(areaSelect.value, $('#subareaInput')?.value || '');
}

function renderCategoryOptions() {
  renderFormOptions();
}

function renderFilterChips() {
  if (!currentProfile) return;
  const filters = [
    { label: 'Todos', value: 'all' },
    { label: 'Alta prioridad', value: 'high' },
    ...currentProfile.categories.map((category) => ({ label: category, value: `category:${category}` }))
  ];
  $('#categoryFilters').innerHTML = filters.map((filter) => `<button class="filter-chip ${activeFilter === filter.value ? 'is-active' : ''}" type="button" data-filter="${escapeHtml(filter.value)}" aria-pressed="${activeFilter === filter.value}">${escapeHtml(filter.label)}</button>`).join('');
}

function renderColorPicker(containerId, selectedColor, onSelect) {
  const container = $(`#${containerId}`);
  container.innerHTML = COLOR_OPTIONS.map((option) => `<button class="color-swatch ${option.value === selectedColor ? 'is-selected' : ''}" type="button" role="radio" aria-label="${option.name}" aria-checked="${option.value === selectedColor}" data-color="${option.value}" style="--swatch: ${option.value}"></button>`).join('');
  container.querySelectorAll('[data-color]').forEach((button) => button.addEventListener('click', () => {
    onSelect(button.dataset.color);
    renderColorPicker(containerId, button.dataset.color, onSelect);
  }));
}

function colorOption(value) {
  return COLOR_OPTIONS.find((option) => option.value === value) || COLOR_OPTIONS[0];
}

function applyProfileTheme() {
  if (!currentProfile) return;
  const color = colorOption(currentProfile.color);
  document.documentElement.style.setProperty('--profile-color', color.value);
  document.documentElement.style.setProperty('--profile-hot', color.hot);
  document.documentElement.style.setProperty('--profile-ink', color.ink);
  document.documentElement.style.setProperty('--orange', color.value);
  document.documentElement.style.setProperty('--orange-hot', color.hot);
  document.documentElement.style.setProperty('--orange-ink', color.ink);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = color.value;
}

function updateSyncStatus() {
  const node = $('#syncStatus');
  if (!node) return;
  node.textContent = isAdminSession() ? 'Guardado en el servidor local' : 'Sesión cerrada';
}

function updateProfileSummary() {
  if (!currentProfile) return;
  $('#brandMark').textContent = currentProfile.initials[0] || 'J';
  $('#brandWorkspace').textContent = `${currentProfile.name} · mesa local`;
  $('#profileButton').textContent = currentProfile.initials;
  $('#profileButton').setAttribute('aria-label', `Abrir perfil de ${currentProfile.name}`);
  $('#railWorkspace').textContent = currentProfile.name.toUpperCase();
  $('#railDate').textContent = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '').toUpperCase();
  $('#railEnvironment').textContent = currentProfile.name;
  $('#authMark').textContent = currentProfile.initials;
  updateSyncStatus();
}

function initializeWorkspace() {
  applyProfileTheme();
  syncFormThemeFromWorkspace({ saveToServer: isAdminSession() });
  updateProfileSummary();
  renderCategoryOptions();
  renderFilterChips();
  if (tickets[0]) {
    selectedId = tickets[0].id;
    isNewTicket = false;
    fillForm(tickets[0]);
  } else {
    selectedId = null;
    isNewTicket = true;
    clearForm();
    $('#editorTitle').textContent = 'Recibir ticket';
  }
  renderList();
  setView('home');
}

function renderProfileList() {
  const list = $('#profileList');
  if (!profiles.length) {
    list.innerHTML = '<p class="auth-note">Todavía no hay perfiles en este navegador.</p>';
    return;
  }
  list.innerHTML = profiles.map((profile) => `<button class="profile-choice" type="button" data-profile-id="${escapeHtml(profile.id)}"><span class="profile-choice-avatar" style="background: ${profile.color}">${escapeHtml(profile.initials)}</span><span><strong>${escapeHtml(profile.name)}</strong><small>${profile.categories.length} categorías · mesa local</small></span></button>`).join('');
  list.querySelectorAll('[data-profile-id]').forEach((button) => button.addEventListener('click', () => loginProfile(button.dataset.profileId)));
}

function showProfilePicker() {
  $('#profilePicker').classList.remove('is-hidden');
  $('#onboardingForm').classList.add('is-hidden');
  renderProfileList();
}

function showOnboarding() {
  $('#profilePicker').classList.add('is-hidden');
  $('#onboardingForm').classList.remove('is-hidden');
  $('#onboardingName').value = '';
  $('#onboardingInitials').value = '';
  onboardingColor = COLOR_OPTIONS[0].value;
  renderColorPicker('onboardingColors', onboardingColor, (color) => { onboardingColor = color; });
  setTimeout(() => $('#onboardingName').focus(), 0);
}

function setAdminAuthStatus(message, success = false) {
  const node = $('#adminAuthStatus');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('is-success', success);
}

function renderAdminAuthPanel() {
  const panel = $('#adminAuthPanel');
  if (!panel) return;
  panel.classList.toggle('is-hidden', Boolean(adminSession));
  $('#adminAuthTitle').textContent = 'Acceso de administrador';
  $('#adminAuthCopy').textContent = 'Ingresa la contraseña configurada para abrir la cola de solicitudes.';
  $('#adminAuthSubmit').textContent = 'Entrar';
}

function showAuthGate() {
  $('#authGate').setAttribute('aria-hidden', 'false');
  renderAdminAuthPanel();
  if (!adminSession) {
    $('#profilePicker').classList.add('is-hidden');
    $('#onboardingForm').classList.add('is-hidden');
    return;
  }
  if (profiles.length) showProfilePicker(); else showOnboarding();
}

function hideAuthGate() {
  $('#authGate').setAttribute('aria-hidden', 'true');
}

async function submitAdminAuth(event) {
  event.preventDefault();
  const password = $('#adminPasswordInput').value;
  const button = $('#adminAuthSubmit');
  button.disabled = true;
  setAdminAuthStatus('Verificando acceso…');
  try {
    await apiRequest('/api/session', { method: 'POST', body: JSON.stringify({ password }) });
    adminSession = { authenticated: true };
    $('#adminPasswordInput').value = '';
    setAdminAuthStatus('Acceso correcto.', true);
    await enterWorkspace();
  } catch (error) {
    setAdminAuthStatus(error.status === 401 ? 'La contraseña no es correcta.' : error.message || 'No se pudo iniciar sesión.');
  } finally {
    button.disabled = false;
  }
}

async function enterWorkspace() {
  const synced = await refreshTickets({ quiet: true });
  if (!synced) {
    adminSession = null;
    setAdminAuthStatus('No se pudo leer la cola. Revisa que el servidor siga activo e inténtalo de nuevo.');
    showAuthGate();
    return;
  }
  await refreshFormConfig({ quiet: true });
  renderAdminAuthPanel();
  if (currentProfile) {
    hideAuthGate();
    initializeWorkspace();
    showToast(`Bienvenido, ${currentProfile.name}.`);
  } else {
    showAuthGate();
  }
}

async function bootApp() {
  try {
    const session = await apiRequest('/api/session');
    adminSession = session?.authenticated ? { authenticated: true } : null;
    if (adminSession) await enterWorkspace();
    else showAuthGate();
  } catch (error) {
    adminSession = null;
    setAdminAuthStatus('No se pudo conectar con el servidor local. Inícialo con npm start e inténtalo de nuevo.');
    showAuthGate();
  }
}

function createProfile(event) {
  event.preventDefault();
  const name = $('#onboardingName').value.trim();
  if (!name) return;
  const rawInitials = $('#onboardingInitials').value.trim().replace(/[^a-z0-9]/gi, '').toUpperCase();
  const profile = normalizeProfile({ id: makeId(), name, initials: rawInitials || profileInitials(name), color: onboardingColor, categories: DEFAULT_CATEGORIES });
  profiles = [...profiles, profile];
  persistProfiles();
  loginProfile(profile.id);
}

function loginProfile(profileId) {
  const profile = profiles.find((item) => item.id === profileId);
  if (!profile) return;
  activeProfileId = profile.id;
  currentProfile = profile;
  localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
  tickets = tickets || [];
  selectedId = tickets[0]?.id || null;
  activeFilter = 'all';
  searchTerm = '';
  $('#searchInput').value = '';
  hideAuthGate();
  initializeWorkspace();
  showToast(`${isAdminSession() ? 'Mesa abierta' : 'Bienvenido'}, ${currentProfile.name}.`);
}

function readFormConfigDraft() {
  if (!formConfigDraft) return;
  const rows = [...$('#formAreaList').querySelectorAll('[data-form-area-row]')];
  formConfigDraft.areas = rows.map((row) => ({
    name: row.querySelector('[data-form-area-name]').value.trim(),
    subareas: row.querySelector('[data-form-area-subareas]').value.split(',').map((item) => item.trim()).filter(Boolean)
  }));
  formConfigDraft.types = $('#formTypesInput').value.split(',').map((item) => item.trim()).filter(Boolean);
  formConfigDraft.priorities = $('#formPrioritiesInput').value.split(',').map((item) => item.trim()).filter(Boolean);
  const mode = $('#formThemeModeInput').value;
  const workspaceTheme = getWorkspaceTheme();
  formConfigDraft.theme = mode === 'workspace'
    ? workspaceTheme
    : {
      mode: 'custom',
      accent: $('#formThemeColorInput').value,
      hot: $('#formThemeColorInput').value,
      ink: $('#formThemeColorInput').value,
      initials: $('#formThemeInitialsInput').value.trim(),
      workspaceName: $('#formThemeWorkspaceNameInput').value.trim()
    };
}

function renderFormThemeFields() {
  const mode = $('#formThemeModeInput').value;
  const customFields = $('#formCustomThemeFields');
  if (!customFields) return;
  customFields.classList.toggle('is-hidden', mode !== 'custom');
  const disabled = mode !== 'custom';
  ['#formThemeColorInput', '#formThemeInitialsInput', '#formThemeWorkspaceNameInput'].forEach((selector) => {
    const input = $(selector);
    if (input) input.disabled = disabled;
  });
}

function renderFormAreaList() {
  const list = $('#formAreaList');
  if (!list || !formConfigDraft) return;
  $('#formAreaCount').textContent = formConfigDraft.areas.length;
  list.innerHTML = formConfigDraft.areas.map((area, index) => `
    <div class="form-config-area-row" data-form-area-row>
      <div class="form-config-area-fields">
        <label class="field"><span>Área</span><input type="text" data-form-area-name maxlength="40" /></label>
        <label class="field"><span>Detalles dependientes <small>(separados por coma)</small></span><input type="text" data-form-area-subareas placeholder="Ej. soporte, seguimiento, revisión" /></label>
      </div>
      <button class="icon-button form-config-remove" type="button" data-remove-form-area="${index}" aria-label="Eliminar área">×</button>
    </div>
  `).join('');
  list.querySelectorAll('[data-form-area-row]').forEach((row, index) => {
    row.querySelector('[data-form-area-name]').value = formConfigDraft.areas[index].name;
    row.querySelector('[data-form-area-subareas]').value = formConfigDraft.areas[index].subareas.join(', ');
  });
  list.querySelectorAll('[data-remove-form-area]').forEach((button) => button.addEventListener('click', () => removeFormArea(button.dataset.removeFormArea)));
}

function openFormConfigModal() {
  if (!currentProfile) return;
  formConfigDraft = clone(formConfig);
  $('#formTypesInput').value = formConfigDraft.types.join(', ');
  $('#formPrioritiesInput').value = formConfigDraft.priorities.join(', ');
  $('#formThemeModeInput').value = formConfigDraft.theme.mode;
  $('#formThemeColorInput').value = formConfigDraft.theme.accent;
  $('#formThemeInitialsInput').value = formConfigDraft.theme.initials;
  $('#formThemeWorkspaceNameInput').value = formConfigDraft.theme.workspaceName;
  $('#formConfigError').classList.add('is-hidden');
  renderFormAreaList();
  renderFormThemeFields();
  $('#formConfigModal').classList.remove('is-hidden');
  $('#formConfigModal').setAttribute('aria-hidden', 'false');
  setTimeout(() => $('#newFormAreaInput').focus(), 0);
}

function closeFormConfigModal() {
  $('#formConfigModal').classList.add('is-hidden');
  $('#formConfigModal').setAttribute('aria-hidden', 'true');
  formConfigDraft = null;
}

function showFormConfigError(message) {
  const error = $('#formConfigError');
  error.textContent = message;
  error.classList.remove('is-hidden');
}

function addFormArea() {
  if (!formConfigDraft) return;
  readFormConfigDraft();
  const input = $('#newFormAreaInput');
  const name = input.value.trim().replace(/\s+/g, ' ');
  if (!name) return;
  if (formConfigDraft.areas.some((area) => area.name.toLowerCase() === name.toLowerCase())) {
    showFormConfigError('Esa área ya existe.');
    return;
  }
  if (formConfigDraft.areas.length >= 40) {
    showFormConfigError('Puedes tener hasta 40 áreas.');
    return;
  }
  formConfigDraft.areas.push({ name, subareas: [] });
  input.value = '';
  $('#formConfigError').classList.add('is-hidden');
  renderFormAreaList();
  input.focus();
}

function removeFormArea(index) {
  if (!formConfigDraft) return;
  readFormConfigDraft();
  if (formConfigDraft.areas.length <= 1) {
    showFormConfigError('Conserva al menos un área.');
    return;
  }
  formConfigDraft.areas.splice(Number(index), 1);
  renderFormAreaList();
}

function resetFormConfig() {
  formConfigDraft = clone(DEFAULT_FORM_CONFIG);
  formConfigDraft.theme = getWorkspaceTheme();
  $('#formTypesInput').value = formConfigDraft.types.join(', ');
  $('#formPrioritiesInput').value = formConfigDraft.priorities.join(', ');
  $('#formThemeModeInput').value = formConfigDraft.theme.mode;
  $('#formThemeColorInput').value = formConfigDraft.theme.accent;
  $('#formThemeInitialsInput').value = formConfigDraft.theme.initials;
  $('#formThemeWorkspaceNameInput').value = formConfigDraft.theme.workspaceName;
  $('#formConfigError').classList.add('is-hidden');
  renderFormAreaList();
  renderFormThemeFields();
}

async function saveFormConfig(event) {
  event.preventDefault();
  if (!formConfigDraft) return;
  readFormConfigDraft();
  const normalized = normalizeFormConfig(formConfigDraft);
  if (!normalized.areas.length || !normalized.types.length || !normalized.priorities.length) {
    showFormConfigError('Necesitas al menos un área, un tipo y una prioridad.');
    return;
  }
  const saveButton = $('#formConfigForm button[type="submit"]');
  saveButton.disabled = true;
  try {
    formConfig = normalized;
    persistFormConfig();
    await saveServerFormConfig();
    renderFormOptions();
    closeFormConfigModal();
    showToast('Formulario público actualizado.');
  } catch (error) {
    console.error(error);
    showFormConfigError('No se pudo guardar la configuración. Revisa que el servidor siga activo e inténtalo de nuevo.');
  } finally {
    saveButton.disabled = false;
  }
}

function openProfileModal() {
  if (!currentProfile) return;
  profileDraft = { ...clone(currentProfile), categories: clone(currentProfile.categories) };
  $('#profileNameInput').value = profileDraft.name;
  $('#profileInitialsInput').value = profileDraft.initials;
  renderColorPicker('profileColors', profileDraft.color, (color) => { profileDraft.color = color; });
  renderCategoryList();
  $('#profileError').classList.add('is-hidden');
  $('#profileModal').classList.remove('is-hidden');
  $('#profileModal').setAttribute('aria-hidden', 'false');
  setTimeout(() => $('#profileNameInput').focus(), 0);
}

function closeProfileModal() {
  $('#profileModal').classList.add('is-hidden');
  $('#profileModal').setAttribute('aria-hidden', 'true');
  profileDraft = null;
}

function renderCategoryList() {
  const list = $('#categoryList');
  const categories = profileDraft?.categories || [];
  $('#categoryCount').textContent = categories.length;
  list.innerHTML = categories.length ? categories.map((category) => `<span class="category-tag">${escapeHtml(category)}<button type="button" data-remove-category="${escapeHtml(category)}" aria-label="Eliminar ${escapeHtml(category)}">×</button></span>`).join('') : '<span class="category-empty">Agrega una categoría para empezar.</span>';
  list.querySelectorAll('[data-remove-category]').forEach((button) => button.addEventListener('click', () => removeCategory(button.dataset.removeCategory)));
}

function addCategory() {
  if (!profileDraft) return;
  const input = $('#categoryInput');
  const category = input.value.trim().replace(/\s+/g, ' ');
  if (!category) return;
  if (profileDraft.categories.some((item) => item.toLowerCase() === category.toLowerCase())) {
    showProfileError('Esa categoría ya existe en tu mesa.');
    return;
  }
  if (profileDraft.categories.length >= 24) {
    showProfileError('Puedes tener hasta 24 categorías por perfil.');
    return;
  }
  profileDraft.categories.push(category);
  input.value = '';
  hideProfileError();
  renderCategoryList();
  input.focus();
}

function removeCategory(category) {
  if (!profileDraft) return;
  if (profileDraft.categories.length <= 1) {
    showProfileError('Conserva al menos una categoría para poder clasificar tickets.');
    return;
  }
  profileDraft.categories = profileDraft.categories.filter((item) => item !== category);
  renderCategoryList();
}

function saveProfile(event) {
  event.preventDefault();
  if (!profileDraft) return;
  const name = $('#profileNameInput').value.trim();
  if (!name) {
    showProfileError('Escribe un nombre visible para tu perfil.');
    $('#profileNameInput').focus();
    return;
  }
  const initialsInput = $('#profileInitialsInput').value.trim().replace(/[^a-z0-9]/gi, '').toUpperCase();
  const initials = name !== profileDraft.name && initialsInput === profileDraft.initials
    ? profileInitials(name)
    : initialsInput || profileInitials(name);
  const updated = normalizeProfile({ ...profileDraft, name, initials });
  profiles = profiles.map((profile) => profile.id === updated.id ? updated : profile);
  currentProfile = updated;
  persistProfiles();
  applyProfileTheme();
  syncFormThemeFromWorkspace({ saveToServer: isAdminSession() });
  updateProfileSummary();
  renderHome();
  renderCategoryOptions();
  renderFilterChips();
  closeProfileModal();
  showToast('Perfil y categorías actualizados.');
}

async function logoutProfile() {
  closeProfileModal();
  try { await apiRequest('/api/session', { method: 'DELETE' }); } catch (error) { console.error(error); }
  adminSession = null;
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
  currentProfile = null;
  activeProfileId = null;
  tickets = [];
  showAuthGate();
}

function showFormError(message) {
  const error = $('#formError');
  error.textContent = message;
  error.classList.remove('is-hidden');
}

function hideFormError() {
  $('#formError').classList.add('is-hidden');
}

function showProfileError(message) {
  const error = $('#profileError');
  error.textContent = message;
  error.classList.remove('is-hidden');
}

function hideProfileError() {
  $('#profileError').classList.add('is-hidden');
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

function openNewTicket() {
  setView('receiving');
  isNewTicket = true;
  selectedId = null;
  clearForm();
  renderList();
  $('#editorTitle').textContent = 'Recibir ticket';
  $('#titleInput').focus();
}

$('#ticketForm').addEventListener('submit', saveTicket);
$('#advanceStatusButton').addEventListener('click', advanceStatus);
$('#structureButton').addEventListener('click', smartStructure);
$('#newTicketButton').addEventListener('click', openNewTicket);
$('#homeNewTicketButton').addEventListener('click', openNewTicket);
$('#homeSettingsButton').addEventListener('click', openProfileModal);
$('#homeProfileButton').addEventListener('click', openProfileModal);
$('#formConfigButton').addEventListener('click', openFormConfigModal);
$('#discardButton').addEventListener('click', () => { if (isNewTicket) { if (tickets[0]) selectTicket(tickets[0].id); else clearForm(); } else selectTicket(selectedId); showToast('Cambios descartados.'); });
$('#searchInput').addEventListener('input', (event) => { searchTerm = event.target.value; renderList(); });
$('#refreshButton').addEventListener('click', () => { if (isAdminSession()) void refreshTickets(); });
$('#profileButton').addEventListener('click', openProfileModal);
$('#homeLink').addEventListener('click', (event) => { event.preventDefault(); setView('home'); });
$('#createProfileButton').addEventListener('click', showOnboarding);
$('#backToProfilesButton').addEventListener('click', showProfilePicker);
$('#onboardingForm').addEventListener('submit', createProfile);
$('#profileForm').addEventListener('submit', saveProfile);
$('#addCategoryButton').addEventListener('click', addCategory);
$('#categoryInput').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); addCategory(); } });
$('#closeProfileButton').addEventListener('click', closeProfileModal);
$('#logoutButton').addEventListener('click', logoutProfile);
$('#closeFormConfigButton').addEventListener('click', closeFormConfigModal);
$('#formConfigForm').addEventListener('submit', saveFormConfig);
$('#addFormAreaButton').addEventListener('click', addFormArea);
$('#newFormAreaInput').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); addFormArea(); } });
$('#resetFormConfigButton').addEventListener('click', resetFormConfig);
$('#formThemeModeInput').addEventListener('change', renderFormThemeFields);
$('#areaInput').addEventListener('change', () => renderSubareaOptions($('#areaInput').value, ''));
$('#adminAuthForm')?.addEventListener('submit', submitAdminAuth);
document.addEventListener('click', (event) => {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) setView(viewButton.dataset.view);
  const filterButton = event.target.closest('[data-filter]');
  if (filterButton) applyFilter(filterButton.dataset.filter);
  if (event.target.matches('[data-close-profile]')) closeProfileModal();
  if (event.target.matches('[data-close-form-config]')) closeFormConfigModal();
});
$$('#ticketForm input, #ticketForm textarea, #ticketForm select').forEach((input) => input.addEventListener('input', () => { updateReadiness(); hideFormError(); }));
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') { event.preventDefault(); $('#searchInput').focus(); }
  if (event.key === 'Escape') { closeProfileModal(); closeFormConfigModal(); }
});
window.addEventListener('resize', updateScrollHint);

const authMark = document.querySelector('.auth-mark');
if (authMark) authMark.id = 'authMark';

void bootApp();
