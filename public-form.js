const config = window.MESA_SUPABASE || {};
const supabaseClient = window.supabase?.createClient && config.url && config.publishableKey
  ? window.supabase.createClient(config.url, config.publishableKey)
  : null;

const form = document.querySelector('#publicTicketForm');
const submitButton = document.querySelector('#publicSubmitButton');
const formMessage = document.querySelector('#publicFormMessage');
const successPanel = document.querySelector('#publicSuccess');
const successCode = document.querySelector('#publicSuccessCode');
const panelCode = document.querySelector('#publicPanelCode');
const areaSelect = form?.querySelector('[name="area"]');
const subareaField = document.querySelector('#publicSubareaField');
const subareaSelect = document.querySelector('#publicSubareaInput');
const typeSelect = form?.querySelector('[name="type"]');
const prioritySelect = form?.querySelector('[name="priority"]');
let formConfig = window.normalizeMesaFormConfig
  ? window.normalizeMesaFormConfig(window.MESA_FORM_DEFAULTS)
  : { areas: [{ name: 'Odoo', subareas: ['PDV', 'Inventario'] }], types: ['Solicitud', 'Bug', 'Mejora'], priorities: ['Media', 'Alta', 'Baja'] };

function applyPublicTheme() {
  const theme = formConfig.theme || {};
  const accent = theme.accent || '#f06a3c';
  const hot = theme.hot || accent;
  const ink = theme.ink || accent;
  const workspaceName = theme.workspaceName || 'Julio';
  const initials = theme.initials || workspaceName[0] || 'J';
  const codePrefix = initials.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 3) || 'JUL';
  const root = document.documentElement;
  root.style.setProperty('--profile-color', accent);
  root.style.setProperty('--profile-hot', hot);
  root.style.setProperty('--profile-ink', ink);
  root.style.setProperty('--orange', accent);
  root.style.setProperty('--orange-hot', hot);
  root.style.setProperty('--orange-ink', ink);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = accent;
  const mark = document.querySelector('#publicBrandMark');
  const note = document.querySelector('#publicHeaderNote');
  const subtitle = document.querySelector('#publicBrandSubtitle');
  const intro = document.querySelector('#publicIntroCopy');
  const successWorkspace = document.querySelector('#publicSuccessWorkspace');
  const title = document.querySelector('title');
  if (mark) mark.textContent = initials.slice(0, 1);
  if (note) note.textContent = `${workspaceName.toUpperCase()} · RECEPCIÓN`;
  if (subtitle) subtitle.textContent = `${workspaceName} · formulario de solicitudes`;
  if (intro) intro.textContent = `Completa este formulario y la solicitud llegará directamente a la mesa de ${workspaceName} con el contexto necesario para darle seguimiento.`;
  if (successWorkspace) successWorkspace.textContent = workspaceName;
  if (panelCode) panelCode.textContent = `${codePrefix}—`;
  if (title) title.textContent = `Enviar solicitud · Mesa de ${workspaceName}`;
}

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
  applyPublicTheme();
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
  applyPublicTheme();
  renderFormOptions();
}

function makeCode() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  const prefix = (formConfig.theme?.initials || 'JUL').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 3) || 'JUL';
  return `${prefix}-${stamp}-${random}`;
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
