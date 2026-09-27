const config = window.MESA_SUPABASE || {};
const supabaseClient = window.supabase?.createClient && config.url && config.publishableKey
  ? window.supabase.createClient(config.url, config.publishableKey)
  : null;

const form = document.querySelector('#publicTicketForm');
const submitButton = document.querySelector('#publicSubmitButton');
const formMessage = document.querySelector('#publicFormMessage');
const successPanel = document.querySelector('#publicSuccess');
const successCode = document.querySelector('#publicSuccessCode');
const areaSelect = form?.querySelector('[name="area"]');
const subareaField = document.querySelector('#publicSubareaField');
const subareaSelect = document.querySelector('#publicSubareaInput');
const typeSelect = form?.querySelector('[name="type"]');
const prioritySelect = form?.querySelector('[name="priority"]');
let formConfig = window.normalizeMesaFormConfig
  ? window.normalizeMesaFormConfig(window.MESA_FORM_DEFAULTS)
  : { areas: [{ name: 'Odoo', subareas: ['PDV', 'Inventario'] }], types: ['Solicitud', 'Bug', 'Mejora'], priorities: ['Media', 'Alta', 'Baja'] };

function renderSubareas(areaName) {
  if (!subareaField || !subareaSelect) return;
  const area = formConfig.areas.find((item) => item.name === areaName);
  const subareas = area?.subareas || [];
  subareaField.classList.toggle('is-hidden', subareas.length === 0);
  subareaSelect.innerHTML = `<option value="">Selecciona un detalle</option>${subareas.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('')}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function renderFormOptions() {
  if (!areaSelect || !typeSelect || !prioritySelect) return;
  areaSelect.innerHTML = `<option value="">Selecciona una opción</option>${formConfig.areas.map((area) => `<option value="${escapeHtml(area.name)}">${escapeHtml(area.name)}</option>`).join('')}`;
  typeSelect.innerHTML = `<option value="">Selecciona una opción</option>${formConfig.types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('')}`;
  prioritySelect.innerHTML = formConfig.priorities.map((priority) => `<option>${escapeHtml(priority)}</option>`).join('');
  renderSubareas('');
}

async function loadFormConfig() {
  if (!supabaseClient) {
    renderFormOptions();
    return;
  }
  const { data, error } = await supabaseClient.from('form_config').select('config').eq('id', 1).maybeSingle();
  if (!error && data?.config && window.normalizeMesaFormConfig) formConfig = window.normalizeMesaFormConfig(data.config);
  renderFormOptions();
}

function makeCode() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `JUL-${stamp}-${random}`;
}

function showMessage(message, type = 'error') {
  formMessage.textContent = message;
  formMessage.className = `public-form-message is-visible ${type}`;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    showMessage('La conexión todavía no está configurada. Avísale a Julio.', 'error');
    return;
  }

  const data = new FormData(form);
  const payload = {
    code: makeCode(),
    title: String(data.get('title') || '').trim(),
    description: String(data.get('description') || '').trim(),
    area: String(data.get('area') || '').trim(),
    subarea: String(data.get('subarea') || '').trim(),
    type: String(data.get('type') || '').trim(),
    priority: String(data.get('priority') || 'Media').trim(),
    module: String(data.get('module') || '').trim(),
    requester: String(data.get('requester') || '').trim(),
    requester_email: String(data.get('requester_email') || '').trim(),
    environment: 'Cliente',
    acceptance: String(data.get('acceptance') || '').trim(),
    status: 'new',
    source: 'public'
  };

  submitButton.disabled = true;
  submitButton.setAttribute('aria-busy', 'true');
  showMessage('Enviando solicitud…', 'loading');

  const { error } = await supabaseClient.from('tickets').insert(payload);
  submitButton.disabled = false;
  submitButton.removeAttribute('aria-busy');

  if (error) {
    console.error(error);
    showMessage('No se pudo enviar todavía. Revisa que Julio haya activado la mesa e inténtalo de nuevo.', 'error');
    return;
  }

  form.reset();
  successCode.textContent = payload.code;
  successPanel.classList.add('is-visible');
  form.classList.add('is-hidden');
  formMessage.className = 'public-form-message';
});

document.querySelector('#sendAnotherButton')?.addEventListener('click', () => {
  successPanel.classList.remove('is-visible');
  form.classList.remove('is-hidden');
  document.querySelector('#titleInput')?.focus();
});

areaSelect?.addEventListener('change', () => renderSubareas(areaSelect.value));
void loadFormConfig();
