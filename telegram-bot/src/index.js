require('dotenv').config();

const path = require('path');
const { google } = require('googleapis');

const REQUIRED_ENV = [
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_ALLOWED_CHAT_ID',
  'GOOGLE_SHEET_ID'
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Falta configurar ${key} en .env`);
    process.exit(1);
  }
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const allowedChatId = String(process.env.TELEGRAM_ALLOWED_CHAT_ID).trim();
const sheetName = process.env.GOOGLE_SHEET_NAME || 'Registros';
let nextOffset = 0;

main().catch(error => {
  console.error(error);
  process.exit(1);
});

async function main() {
  await setTelegramCommands();
  console.log('Bot Telegram Rally por la Luz 2026 iniciado.');

  while (true) {
    try {
      const updates = await telegram('getUpdates', {
        offset: nextOffset,
        timeout: 25,
        allowed_updates: ['message', 'edited_message']
      });

      for (const update of updates.result || []) {
        nextOffset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch (error) {
      console.error('[polling]', error.message);
      await sleep(3000);
    }
  }
}

async function handleUpdate(update) {
  const message = update.message || update.edited_message;
  if (!message || !message.text) return;

  const chatId = String(message.chat.id);
  const command = message.text.trim().split(/\s+/)[0].split('@')[0].toLowerCase();

  if (command === '/id') {
    await sendMessage(chatId, `Chat ID: ${chatId}`);
    return;
  }

  if (chatId !== allowedChatId) {
    await sendMessage(chatId, 'Este bot no esta autorizado para este chat.');
    return;
  }

  if (command === '/start' || command === '/ayuda') {
    await sendHelp(chatId);
    return;
  }

  if (command === '/resumen') {
    await sendSummary(chatId);
    return;
  }

  if (command === '/hospedaje') {
    await sendCsvReport(chatId, 'hospedaje');
    return;
  }

  if (command === '/confirmados') {
    await sendCsvReport(chatId, 'confirmados');
    return;
  }

  if (command === '/no_asisten') {
    await sendCsvReport(chatId, 'no_asisten');
    return;
  }

  if (command === '/pendientes') {
    await sendCsvReport(chatId, 'pendientes');
    return;
  }

  if (command.startsWith('/')) {
    await sendMessage(chatId, 'Comando no reconocido. Usa /ayuda.');
  }
}

async function sendHelp(chatId) {
  await sendMessage(chatId, [
    'Comandos Rally por la Luz 2026',
    '/resumen - Totales rapidos',
    '/hospedaje - CSV de quienes solicitaron hospedaje',
    '/confirmados - CSV de quienes si asistiran',
    '/no_asisten - CSV de quienes no asistiran',
    '/pendientes - CSV sin confirmacion de asistencia',
    '/id - Mostrar chat id'
  ].join('\n'));
}

async function sendSummary(chatId) {
  await sendChatAction(chatId, 'typing');

  const records = await getRecords();
  const hospedaje = records.filter(record => isYes(record.Hospedaje)).length;
  const confirmados = records.filter(record => normalize(record['Confirmacion asistencia']).includes('si')).length;
  const noAsisten = records.filter(record => normalize(record['Confirmacion asistencia']).includes('no')).length;
  const pendientes = records.length - confirmados - noAsisten;

  await sendMessage(chatId, [
    'Resumen Rally por la Luz 2026',
    `Registros: ${records.length}`,
    `Hospedaje: ${hospedaje}`,
    `Si asistiran: ${confirmados}`,
    `No asistiran: ${noAsisten}`,
    `Pendientes: ${pendientes}`
  ].join('\n'));
}

async function sendCsvReport(chatId, type) {
  await sendChatAction(chatId, 'upload_document');

  const report = await buildCsvReport(type);
  await sendDocument(chatId, report.csv, report.filename, report.caption);
}

async function buildCsvReport(type) {
  const records = await getRecords();
  const filters = {
    hospedaje: record => isYes(record.Hospedaje),
    confirmados: record => normalize(record['Confirmacion asistencia']).includes('si'),
    no_asisten: record => normalize(record['Confirmacion asistencia']).includes('no'),
    pendientes: record => !String(record['Confirmacion asistencia'] || '').trim()
  };
  const names = {
    hospedaje: 'hospedaje',
    confirmados: 'confirmados',
    no_asisten: 'no_asisten',
    pendientes: 'pendientes'
  };
  const rows = records.filter(filters[type] || (() => true));
  const headers = [
    'Fecha',
    'Nombre(s)',
    'Apellidos',
    'Correo',
    'Telefono',
    'WhatsApp',
    'Estado',
    'Institucion',
    'Hospedaje',
    'Confirmacion asistencia',
    'Fecha confirmacion'
  ];
  const csvRows = [headers.join(',')];

  for (const record of rows) {
    csvRows.push(headers.map(header => {
      if (header === 'WhatsApp') return csvEscape(createWhatsappUrl(record.Telefono));
      return csvEscape(repairMojibake(record[header]));
    }).join(','));
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13);
  const name = names[type] || 'registros';

  return {
    csv: csvRows.join('\n'),
    filename: `rally-2026-${name}-${stamp}.csv`,
    caption: `Rally por la Luz 2026: ${name} (${rows.length})`
  };
}

async function getRecords() {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A:Z`
  });
  const rows = response.data.values || [];
  const headers = rows.shift() || [];

  return rows.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = repairMojibake(row[index] || '');
    });
    return record;
  });
}

async function getSheetsClient() {
  const keyPath = path.resolve(__dirname, '..', process.env.GOOGLE_SERVICE_ACCOUNT_KEY || 'service-account.json');
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  return google.sheets({ version: 'v4', auth });
}

async function setTelegramCommands() {
  await telegram('setMyCommands', {
    commands: [
      { command: 'ayuda', description: 'Ver comandos disponibles' },
      { command: 'resumen', description: 'Ver totales rapidos' },
      { command: 'hospedaje', description: 'CSV de quienes solicitaron hospedaje' },
      { command: 'confirmados', description: 'CSV de quienes si asistiran' },
      { command: 'no_asisten', description: 'CSV de quienes no asistiran' },
      { command: 'pendientes', description: 'CSV sin confirmacion de asistencia' },
      { command: 'id', description: 'Mostrar chat id' }
    ]
  });
}

async function telegram(method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload || {})
  });
  const data = await response.json();

  if (!data.ok) {
    throw new Error(`${method}: ${data.description || response.statusText}`);
  }

  return data;
}

async function sendMessage(chatId, text) {
  await telegram('sendMessage', {
    chat_id: chatId,
    text: String(text || '').slice(0, 3900),
    disable_web_page_preview: true
  });
}

async function sendChatAction(chatId, action) {
  await telegram('sendChatAction', {
    chat_id: chatId,
    action
  });
}

async function sendDocument(chatId, csv, filename, caption) {
  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('caption', caption || '');
  form.append('document', new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);

  const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: 'POST',
    body: form
  });
  const data = await response.json();

  if (!data.ok) {
    throw new Error(`sendDocument: ${data.description || response.statusText}`);
  }
}

function createWhatsappUrl(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return '';

  return `https://wa.me/52${digits.slice(-10)}`;
}

function isYes(value) {
  return normalize(value) === 'si';
}

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function repairMojibake(value) {
  if (typeof value !== 'string' || !hasMojibakeMarker(value)) return value;

  try {
    return decodeURIComponent(
      value.split('').map(char => {
        const code = char.charCodeAt(0);
        return code <= 255 ? `%${(`0${code.toString(16)}`).slice(-2)}` : encodeURIComponent(char);
      }).join('')
    );
  } catch (error) {
    return value;
  }
}

function hasMojibakeMarker(value) {
  return String(value || '').split('').some(char => {
    const code = char.charCodeAt(0);
    return code === 0x00c3 || code === 0x00c2 || code === 0x00e2;
  });
}

function csvEscape(value) {
  const text = String(value || '');
  return `"${text.replace(/"/g, '""')}"`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
