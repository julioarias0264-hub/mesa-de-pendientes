const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const express = require('express');
const { MESA_FORM_DEFAULTS, normalizeMesaFormConfig } = require('./form-config');

const app = express();
const PORT = 3000;
const HOST = '127.0.0.1';
const DATA_DIR = path.join(__dirname, 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const FORM_CONFIG_FILE = path.join(DATA_DIR, 'form-config.json');
const TICKET_STATUSES = new Set(['new', 'review', 'qa', 'blocked', 'done']);
let writeQueue = Promise.resolve();

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

function queueWrite(operation) {
  const next = writeQueue.then(operation);
  writeQueue = next.catch(() => {});
  return next;
}

async function writeJson(file, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temp, file);
}

async function getTickets() {
  const tickets = await readJson(TICKETS_FILE, []);
  if (!Array.isArray(tickets)) throw new Error('El archivo tickets.json debe contener una lista.');
  return tickets;
}

async function getFormConfig() {
  const config = await readJson(FORM_CONFIG_FILE, MESA_FORM_DEFAULTS);
  return normalizeMesaFormConfig(config);
}

function text(value, maxLength = 5000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizeTicket(input, previous = {}) {
  const ticket = {
    id: previous.id || '',
    title: text(input.title ?? previous.title, 140),
    description: text(input.description ?? previous.description, 5000),
    area: text(input.area ?? previous.area, 100),
    subarea: text(input.subarea ?? previous.subarea, 100),
    type: text(input.type ?? previous.type, 60),
    priority: text(input.priority ?? previous.priority, 30),
    module: text(input.module ?? previous.module, 120),
    requester: text(input.requester ?? previous.requester, 120),
    requester_email: text(input.requester_email ?? previous.requester_email, 254),
    environment: text(input.environment ?? previous.environment ?? 'Cliente', 80),
    acceptance: text(input.acceptance ?? previous.acceptance, 2000),
    status: text(input.status ?? previous.status ?? 'new', 20),
    source: previous.source || (input.source === 'desk' ? 'desk' : 'public'),
    createdAt: previous.createdAt || ''
  };
  const missing = ['title', 'description', 'area', 'type', 'priority', 'acceptance'].filter((key) => !ticket[key]);
  if (missing.length) {
    const error = new Error(`Completa los campos obligatorios: ${missing.join(', ')}.`);
    error.status = 400;
    throw error;
  }
  if (!TICKET_STATUSES.has(ticket.status)) {
    const error = new Error('El estado del ticket no es válido.');
    error.status = 400;
    throw error;
  }
  if (ticket.requester_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticket.requester_email)) {
    const error = new Error('El correo de contacto no es válido.');
    error.status = 400;
    throw error;
  }
  return ticket;
}

function nextTicketId(tickets) {
  const max = tickets.reduce((value, ticket) => Math.max(value, Number(String(ticket.id).match(/(\d+)$/)?.[1] || 0)), 0);
  return `JUL-${String(max + 1).padStart(4, '0')}`;
}

app.disable('x-powered-by');
app.use(express.json({ limit: '40kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/form-config', async (_req, res, next) => {
  try { res.json({ config: await getFormConfig() }); } catch (error) { next(error); }
});
app.put('/api/form-config', async (req, res, next) => {
  try {
    const config = normalizeMesaFormConfig(req.body?.config);
    await queueWrite(() => writeJson(FORM_CONFIG_FILE, config));
    res.json({ config });
  } catch (error) { next(error); }
});

async function createTicket(input, source) {
  return queueWrite(async () => {
    const tickets = await getTickets();
    const ticket = normalizeTicket({ ...input, source }, {});
    const now = new Date().toISOString();
    ticket.id = nextTicketId(tickets);
    ticket.source = source;
    ticket.createdAt = now;
    ticket.updatedAt = now;
    tickets.unshift(ticket);
    await writeJson(TICKETS_FILE, tickets);
    return ticket;
  });
}

app.post('/api/public/tickets', async (req, res, next) => {
  try { res.status(201).json(await createTicket(req.body || {}, 'public')); } catch (error) { next(error); }
});
app.get('/api/tickets', async (_req, res, next) => {
  try { res.json(await getTickets()); } catch (error) { next(error); }
});
app.post('/api/tickets', async (req, res, next) => {
  try { res.status(201).json(await createTicket(req.body || {}, 'desk')); } catch (error) { next(error); }
});
app.patch('/api/tickets/:id', async (req, res, next) => {
  try {
    const updated = await queueWrite(async () => {
      const tickets = await getTickets();
      const index = tickets.findIndex((ticket) => ticket.id === req.params.id);
      if (index < 0) return null;
      const ticket = normalizeTicket(req.body || {}, tickets[index]);
      ticket.id = tickets[index].id;
      ticket.source = tickets[index].source;
      ticket.createdAt = tickets[index].createdAt;
      ticket.updatedAt = new Date().toISOString();
      tickets[index] = ticket;
      await writeJson(TICKETS_FILE, tickets);
      return ticket;
    });
    if (!updated) return res.status(404).json({ error: 'No se encontró ese ticket.' });
    res.json(updated);
  } catch (error) { next(error); }
});

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
for (const asset of ['index.html', 'solicitar.html', 'styles.css', 'app.js', 'public-form.js', 'form-config.js']) {
  app.get(`/${asset}`, (_req, res) => res.sendFile(path.join(__dirname, asset)));
}
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.status ? error.message : 'Ocurrió un error en el servidor.' });
});

app.listen(PORT, HOST, () => {
  console.log(`Mesa de trabajo disponible en http://${HOST}:${PORT}`);
  console.log(`Formulario público local: http://${HOST}:${PORT}/solicitar.html`);
  console.log(`Datos persistentes: ${DATA_DIR}`);
});
