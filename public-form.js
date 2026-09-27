const config = window.MESA_SUPABASE || {};
const supabaseClient = window.supabase?.createClient && config.url && config.publishableKey
  ? window.supabase.createClient(config.url, config.publishableKey)
  : null;

const form = document.querySelector('#publicTicketForm');
const submitButton = document.querySelector('#publicSubmitButton');
const formMessage = document.querySelector('#publicFormMessage');
const successPanel = document.querySelector('#publicSuccess');
const successCode = document.querySelector('#publicSuccessCode');

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
