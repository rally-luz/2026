/* global SHEET_NAME, NOTIFY_EMAIL */

const MASS_BCC_BATCH_SIZE = 80;
const MASS_BATCH_DELAY_MS = 1200;
const MASS_SENDER_NAME = 'Rally por la Luz';
const EVENT_URL = 'https://rally-luz.github.io/2026/';

/**
 * Ejecuta esta funcion para enviar un recordatorio general a todos los registros.
 * Antes de usarla para un envio real, edita asunto/texto/html si hace falta.
 */
function enviarRecordatorioATodos() {
  const subject = '[Rally por la Luz 2026] Recordatorio del evento';
  const textBody = [
    'Hola,',
    '',
    'Te recordamos la informacion principal del Rally por la Luz 2026.',
    '',
    'Sede: INAOE, Tonantzintla, Puebla',
    'Fechas: 29 y 30 de septiembre',
    'Modalidad: presencial',
    '',
    'Recomendaciones:',
    '- Trae ropa y calzado comodos.',
    '- Lleva agua o botella reutilizable.',
    '- Usa proteccion solar.',
    '',
    'Si por algun motivo no podras asistir, por favor responde a este correo para avisar.',
    '',
    'Dudas: rallyxlaluz@inaoep.mx',
    '',
    'Comite Organizador - Rally por la Luz'
  ].join('\n');

  const htmlBody = crearHtmlAviso_({
    titulo: 'Recordatorio del evento',
    subtitulo: 'Rally por la Luz 2026',
    intro: 'Te compartimos la informacion principal para tu participacion.',
    bloques: [
      { etiqueta: 'Sede', valor: 'INAOE, Tonantzintla, Puebla' },
      { etiqueta: 'Fechas', valor: '29 y 30 de septiembre' },
      { etiqueta: 'Modalidad', valor: 'Presencial' }
    ],
    nota: 'Trae ropa y calzado comodos, agua o botella reutilizable y proteccion solar.',
    cta: 'Ver detalles del evento',
    url: EVENT_URL
  });

  enviarMasivo_({ subject, textBody, htmlBody });
}

/**
 * Funcion base para enviar un aviso personalizado.
 * Edita los valores y ejecuta enviarAvisoATodos().
 */
function enviarAvisoATodos() {
  const subject = '[Rally por la Luz 2026] Aviso importante';
  const textBody = [
    'Hola,',
    '',
    'Tenemos un aviso importante para participantes del Rally por la Luz 2026.',
    '',
    'Escribe aqui el contenido del aviso.',
    '',
    'Dudas: rallyxlaluz@inaoep.mx',
    '',
    'Comite Organizador - Rally por la Luz'
  ].join('\n');

  const htmlBody = crearHtmlAviso_({
    titulo: 'Aviso importante',
    subtitulo: 'Rally por la Luz 2026',
    intro: 'Escribe aqui el contenido del aviso para los participantes.',
    bloques: [],
    nota: 'Para cualquier duda, responde este correo o escribe a rallyxlaluz@inaoep.mx.',
    cta: 'Ver sitio del evento',
    url: EVENT_URL
  });

  enviarMasivo_({ subject, textBody, htmlBody });
}

function enviarMasivo_({ subject, textBody, htmlBody }) {
  const recipients = cargarParticipantes_();

  if (recipients.length === 0) {
    console.warn('[masivo] No hay participantes con email valido.');
    return;
  }

  console.log(`[masivo] Total destinatarios: ${recipients.length}`);

  for (let i = 0; i < recipients.length; i += MASS_BCC_BATCH_SIZE) {
    const batch = recipients.slice(i, i + MASS_BCC_BATCH_SIZE);

    GmailApp.sendEmail(
      NOTIFY_EMAIL,
      subject,
      textBody,
      {
        name: MASS_SENDER_NAME,
        replyTo: NOTIFY_EMAIL,
        htmlBody,
        bcc: batch.join(',')
      }
    );

    console.log(`[masivo] Lote enviado ${i + 1}..${i + batch.length} / ${recipients.length}`);
    Utilities.sleep(MASS_BATCH_DELAY_MS);
  }

  console.log('[masivo] Envio masivo completado.');
}

function cargarParticipantes_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh) throw new Error(`No existe la pestana "${SHEET_NAME}".`);

  const data = sh.getDataRange().getValues();
  const header = data.shift() || [];
  const idxEmail = findHeaderIndex_(header, ['Correo', 'email', 'Email', 'Correo electronico']);

  if (idxEmail < 0) {
    throw new Error('No encuentro columna de correo. Usa encabezado "Correo" o "email".');
  }

  const emails = new Set();
  data.forEach(row => {
    const email = String(row[idxEmail] || '').trim().toLowerCase();
    if (isValidEmail_(email)) emails.add(email);
  });

  return Array.from(emails);
}

function findHeaderIndex_(header, names) {
  const normalized = header.map(value => normalizeHeader_(value));
  const targets = names.map(value => normalizeHeader_(value));
  return normalized.findIndex(value => targets.includes(value));
}

function normalizeHeader_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function crearHtmlAviso_({ titulo, subtitulo, intro, bloques, nota, cta, url }) {
  const bloquesHtml = (bloques || []).map(bloque => `
    <div style="padding:14px;border:1px solid #d8e2ea;border-radius:8px;background:#ffffff;">
      <div style="color:#657486;font-size:13px;font-weight:700;">${escapeHtml_(bloque.etiqueta)}</div>
      <div style="margin-top:6px;color:#10243f;font-size:16px;font-weight:800;">${escapeHtml_(bloque.valor)}</div>
    </div>
  `).join('');

  return `
  <div style="background:#fbfaf7;padding:24px 0;margin:0;">
    <div style="max-width:640px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#203040;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #d8e2ea;">
      <div style="background:linear-gradient(135deg,#10243f,#00a99d);padding:24px;text-align:left;color:#ffffff;">
        <div style="font-size:13px;font-weight:800;text-transform:uppercase;">${escapeHtml_(subtitulo)}</div>
        <h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;color:#ffffff;">${escapeHtml_(titulo)}</h1>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;color:#203040;font-size:16px;line-height:1.6;">Hola,</p>
        <p style="margin:0 0 18px;color:#203040;font-size:16px;line-height:1.6;">${escapeHtml_(intro)}</p>
        <div style="display:grid;gap:12px;margin:18px 0;">${bloquesHtml}</div>
        <div style="margin:18px 0;padding:14px;border-left:4px solid #f6c85f;border-radius:8px;background:#fff8e5;color:#765a12;font-size:14px;line-height:1.5;">${escapeHtml_(nota)}</div>
        <div style="text-align:center;margin:24px 0 8px;">
          <a href="${escapeHtml_(url)}" target="_blank" style="display:inline-block;background:linear-gradient(90deg,#00a99d,#10243f);border-radius:8px;padding:13px 18px;color:#ffffff;text-decoration:none;font-weight:800;">${escapeHtml_(cta)}</a>
        </div>
        <p style="margin:22px 0 0;color:#203040;font-size:16px;line-height:1.6;">Comite Organizador - Rally por la Luz</p>
      </div>
      <div style="background:#f3f4f6;color:#657486;text-align:center;font-size:12px;padding:12px;">Rally por la Luz - INAOE</div>
    </div>
  </div>
  `;
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
