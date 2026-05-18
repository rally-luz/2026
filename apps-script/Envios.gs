/* global SHEET_NAME, NOTIFY_EMAIL, EVENT_URL, ensureHeaders_ */

const MASS_BCC_BATCH_SIZE = 80;
const MASS_BATCH_DELAY_MS = 1200;
const MASS_SENDER_NAME = 'Rally por la Luz 2026';

const WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbzaGEFpN2IGYZ04T9NKQMknfuslO-0QrsAyGrmnu01vJIsr_fSiGD_KuxKr5VG4Rdax/exec';

const CONTACT_EMAIL =
  'rallyxlaluz@inaoe.mx';

const CONFIRM_YES_URL =
  'https://rally-luz.github.io/2026/asistencia-si.html';

const CONFIRM_NO_URL =
  'https://rally-luz.github.io/2026/asistencia-no.html';

function enviarConfirmacionAsistenciaATodos() {
  const participantes = cargarParticipantesConToken_();

  if (participantes.length === 0) {
    console.warn('[asistencia] No hay participantes con email válido.');
    return;
  }

  participantes.forEach((participante, index) => {
    const yesUrl = crearUrlConfirmacionGithub_(CONFIRM_YES_URL, participante.token);
    const noUrl = crearUrlConfirmacionGithub_(CONFIRM_NO_URL, participante.token);

    const subject = '[Rally por la Luz 2026] Confirma tu asistencia';

    const textBody = [
      `Hola ${participante.nombre || ''},`,
      '',
      'Para manejar mejor la logística del evento, por favor confirma si asistirás o si no podrás asistir.',
      '',
      `Sí asistiré: ${yesUrl}`,
      `No asistiré: ${noUrl}`,
      '',
      `Dudas: ${CONTACT_EMAIL}`,
      '',
      'Comité Organizador - Rally por la Luz 2026'
    ].join('\n');

    const htmlBody = crearHtmlConfirmacionAsistencia_(participante, yesUrl, noUrl);

    GmailApp.sendEmail(participante.email, subject, textBody, {
      name: MASS_SENDER_NAME,
      replyTo: CONTACT_EMAIL,
      htmlBody
    });

    console.log(`[asistencia] Enviado ${index + 1} / ${participantes.length}: ${participante.email}`);
    Utilities.sleep(MASS_BATCH_DELAY_MS);
  });

  console.log('[asistencia] Envío de confirmación completado.');
}

function crearUrlConfirmacionGithub_(baseUrl, token) {
  return baseUrl + '?token=' + encodeURIComponent(token);
}

function enviarRecordatorioATodos() {
  const subject = '[Rally por la Luz 2026] Recordatorio del evento';

  const textBody = [
    'Hola,',
    '',
    'Te recordamos la información principal del Rally por la Luz 2026.',
    '',
    'Sede: INAOE, Tonantzintla, Puebla',
    'Fechas: 29 y 30 de septiembre',
    'Modalidad: presencial',
    '',
    'Recomendaciones:',
    '- Trae ropa y calzado cómodos.',
    '- Lleva agua o botella reutilizable.',
    '- Usa protección solar.',
    '',
    `Dudas: ${CONTACT_EMAIL}`,
    '',
    'Comité Organizador - Rally por la Luz 2026'
  ].join('\n');

  const htmlBody = crearHtmlAviso_({
    titulo: 'Recordatorio del evento',
    subtitulo: 'Rally por la Luz 2026',
    intro: 'Te compartimos la información principal para tu participación.',
    bloques: [
      { etiqueta: 'Sede', valor: 'INAOE, Tonantzintla, Puebla' },
      { etiqueta: 'Fechas', valor: '29 y 30 de septiembre' },
      { etiqueta: 'Modalidad', valor: 'Presencial' }
    ],
    nota: 'Trae ropa y calzado cómodos, agua o botella reutilizable y protección solar.',
    cta: 'Ver detalles del evento',
    url: EVENT_URL
  });

  enviarMasivo_({ subject, textBody, htmlBody });
}

function enviarAvisoATodos() {
  const subject = '[Rally por la Luz 2026] Aviso importante';

  const textBody = [
    'Hola,',
    '',
    'Tenemos un aviso importante para participantes del Rally por la Luz 2026.',
    '',
    'Escribe aquí el contenido del aviso.',
    '',
    `Dudas: ${CONTACT_EMAIL}`,
    '',
    'Comité Organizador - Rally por la Luz 2026'
  ].join('\n');

  const htmlBody = crearHtmlAviso_({
    titulo: 'Aviso importante',
    subtitulo: 'Rally por la Luz 2026',
    intro: 'Escribe aquí el contenido del aviso para los participantes.',
    bloques: [],
    nota: `Para cualquier duda, responde este correo o escribe a ${CONTACT_EMAIL}.`,
    cta: 'Ver sitio del evento',
    url: EVENT_URL
  });

  enviarMasivo_({ subject, textBody, htmlBody });
}

function enviarMasivo_({ subject, textBody, htmlBody }) {
  const recipients = cargarParticipantes_();

  if (recipients.length === 0) {
    console.warn('[masivo] No hay participantes con email válido.');
    return;
  }

  for (let i = 0; i < recipients.length; i += MASS_BCC_BATCH_SIZE) {
    const batch = recipients.slice(i, i + MASS_BCC_BATCH_SIZE);

    GmailApp.sendEmail(NOTIFY_EMAIL, subject, textBody, {
      name: MASS_SENDER_NAME,
      replyTo: CONTACT_EMAIL,
      htmlBody,
      bcc: batch.join(',')
    });

    console.log(`[masivo] Lote enviado ${i + 1}..${i + batch.length} / ${recipients.length}`);
    Utilities.sleep(MASS_BATCH_DELAY_MS);
  }
}

function cargarParticipantes_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh) throw new Error(`No existe la pestaña "${SHEET_NAME}".`);

  const data = sh.getDataRange().getValues();
  const header = data.shift() || [];

  const idxEmail = findHeaderIndex_(header, [
    'Correo',
    'email',
    'Email',
    'Correo electronico',
    'Correo electrónico'
  ]);

  if (idxEmail < 0) throw new Error('No encuentro columna de correo.');

  const emails = new Set();

  data.forEach(row => {
    const email = String(row[idxEmail] || '').trim().toLowerCase();
    if (isValidEmail_(email)) emails.add(email);
  });

  return Array.from(emails);
}

function cargarParticipantesConToken_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh) throw new Error(`No existe la pestaña "${SHEET_NAME}".`);

  ensureHeaders_(sh);

  const data = sh.getDataRange().getValues();
  const header = data.shift() || [];

  const idxEmail = findHeaderIndex_(header, [
    'Correo',
    'email',
    'Email',
    'Correo electronico',
    'Correo electrónico'
  ]);

  const idxNombre = findHeaderIndex_(header, [
    'Nombre(s)',
    'Nombre',
    'nombre'
  ]);

  const idxApellidos = findHeaderIndex_(header, [
    'Apellidos',
    'apellidos'
  ]);

  const idxToken = findHeaderIndex_(header, ['Token']);

  if (idxEmail < 0) throw new Error('No encuentro columna de correo.');
  if (idxToken < 0) throw new Error('No encuentro columna Token.');

  const seen = new Set();
  const participantes = [];

  data.forEach((row, index) => {
    const email = String(row[idxEmail] || '').trim().toLowerCase();

    if (!isValidEmail_(email) || seen.has(email)) return;

    let token = String(row[idxToken] || '').trim();

    if (!token) {
      token = Utilities.getUuid();
      sh.getRange(index + 2, idxToken + 1).setValue(token);
    }

    seen.add(email);

    participantes.push({
      email,
      token,
      nombre: idxNombre >= 0 ? String(row[idxNombre] || '').trim() : '',
      apellidos: idxApellidos >= 0 ? String(row[idxApellidos] || '').trim() : ''
    });
  });

  return participantes;
}

function crearHtmlAviso_({ titulo, subtitulo, intro, bloques, nota, cta, url }) {
  const bloquesHtml = (bloques || []).map(bloque => `
    <div style="padding:14px;border:1px solid #d8e2ea;border-radius:8px;background:#ffffff;">
      <div style="color:#657486;font-size:13px;font-weight:700;">
        ${escapeHtml_(bloque.etiqueta)}
      </div>
      <div style="margin-top:6px;color:#10243f;font-size:16px;font-weight:800;">
        ${escapeHtml_(bloque.valor)}
      </div>
    </div>
  `).join('');

  return `
    <div style="background:#fbfaf7;padding:24px 0;margin:0;">
      <div style="max-width:640px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#203040;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #d8e2ea;">
        <div style="background:linear-gradient(135deg,#10243f,#00a99d);padding:24px;color:#ffffff;">
          <div style="font-size:13px;font-weight:800;text-transform:uppercase;">
            ${escapeHtml_(subtitulo)}
          </div>
          <h1 style="margin:8px 0 0;font-size:26px;color:#ffffff;">
            ${escapeHtml_(titulo)}
          </h1>
        </div>
        <div style="padding:24px;">
          <p style="font-size:16px;line-height:1.6;">Hola,</p>
          <p style="font-size:16px;line-height:1.6;">${escapeHtml_(intro)}</p>
          <div style="display:grid;gap:12px;margin:18px 0;">${bloquesHtml}</div>
          <div style="margin:18px 0;padding:14px;border-left:4px solid #f6c85f;border-radius:8px;background:#fff8e5;color:#765a12;font-size:14px;line-height:1.5;">
            ${escapeHtml_(nota)}
          </div>
          <div style="text-align:center;margin:24px 0 8px;">
            <a href="${escapeHtml_(url)}" target="_blank" style="display:inline-block;background:linear-gradient(90deg,#00a99d,#10243f);border-radius:8px;padding:13px 18px;color:#ffffff;text-decoration:none;font-weight:800;">
              ${escapeHtml_(cta)}
            </a>
          </div>
          <p style="font-size:16px;line-height:1.6;">
            Comité Organizador - Rally por la Luz 2026
          </p>
        </div>
      </div>
    </div>
  `;
}

function crearHtmlConfirmacionAsistencia_(participante, yesUrl, noUrl) {
  const nombre = participante.nombre ? ` ${escapeHtml_(participante.nombre)}` : '';

  return `
    <div style="background:#fbfaf7;padding:24px 0;margin:0;">
      <div style="max-width:640px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#203040;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #d8e2ea;">
        <div style="background:linear-gradient(135deg,#10243f,#00a99d);padding:24px;color:#ffffff;">
          <div style="font-size:13px;font-weight:800;text-transform:uppercase;">
            Rally por la Luz 2026
          </div>
          <h1 style="margin:8px 0 0;font-size:26px;color:#ffffff;">
            Confirma tu asistencia
          </h1>
        </div>
        <div style="padding:24px;">
          <p style="font-size:16px;line-height:1.6;">Hola${nombre},</p>
          <p style="font-size:16px;line-height:1.6;">
            Para manejar mejor la logística del evento, por favor confirma si asistirás o si no podrás asistir.
          </p>
          <div style="text-align:center;margin:24px 0 10px;">
            <a href="${yesUrl}" target="_blank" style="display:inline-block;margin:6px;background:#00a99d;border-radius:8px;padding:13px 18px;color:#ffffff;text-decoration:none;font-weight:800;">
              Sí asistiré
            </a>
            <a href="${noUrl}" target="_blank" style="display:inline-block;margin:6px;background:#fff0ef;border:1px solid #ef6f6c;border-radius:8px;padding:13px 18px;color:#8d302f;text-decoration:none;font-weight:800;">
              No asistiré
            </a>
          </div>
          <p style="font-size:16px;line-height:1.6;">
            Para cualquier duda puedes escribir a ${CONTACT_EMAIL}.
          </p>
          <p style="font-size:16px;line-height:1.6;">
            Comité Organizador - Rally por la Luz 2026
          </p>
        </div>
      </div>
    </div>
  `;
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

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
