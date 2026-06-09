/* global SHEET_NAME, NOTIFY_EMAIL, EVENT_URL, ensureHeaders_ */

const MASS_BCC_BATCH_SIZE = 80;
const MASS_BATCH_DELAY_MS = 1200;
const MASS_SENDER_NAME = 'Rally por la Luz 2026';

const CONTACT_EMAIL = 'rallyxlaluz@inaoe.mx';

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
    'Fechas: 21 y 22 de septiembre',
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

  const htmlBody = crearHtmlAviso2026_({
    titulo: 'Recordatorio del evento',
    intro: 'Te compartimos la información principal para tu participación.',
    bloques: [
      { etiqueta: 'Sede', valor: 'INAOE, Tonantzintla, Puebla' },
      { etiqueta: 'Fechas', valor: '21 y 22 de septiembre' },
      { etiqueta: 'Modalidad', valor: 'Presencial' }
    ],
    nota: 'Trae ropa y calzado cómodos, agua o botella reutilizable y protección solar.',
    botones: [
      {
        texto: 'Ver detalles del evento',
        url: EVENT_URL,
        primario: true
      }
    ]
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

  const htmlBody = crearHtmlAviso2026_({
    titulo: 'Aviso importante',
    intro: 'Escribe aquí el contenido del aviso para los participantes.',
    bloques: [],
    nota: `Para cualquier duda, responde este correo o escribe a ${CONTACT_EMAIL}.`,
    botones: [
      {
        texto: 'Ver sitio del evento',
        url: EVENT_URL,
        primario: true
      }
    ]
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

function crearHtmlConfirmacionAsistencia_(participante, yesUrl, noUrl) {
  const nombre = participante.nombre ? ` ${escapeHtml_(participante.nombre)}` : '';

  return crearHtmlAviso2026_({
    titulo: 'Confirma tu asistencia',
    intro: `Hola${nombre}, para manejar mejor la logística del evento, por favor confirma si asistirás o si no podrás asistir.`,
    bloques: [
      { etiqueta: 'Sede', valor: 'INAOE, Tonantzintla, Puebla' },
      { etiqueta: 'Fechas', valor: '21 y 22 de septiembre' },
      { etiqueta: 'Modalidad', valor: 'Presencial' }
    ],
    nota: 'Tu respuesta nos ayuda muchísimo a preparar accesos, materiales y cupos.',
    botones: [
      {
        texto: 'Sí asistiré',
        url: yesUrl,
        primario: true
      },
      {
        texto: 'No asistiré',
        url: noUrl,
        primario: false
      }
    ]
  });
}

function crearHtmlAviso2026_({ titulo, intro, bloques, nota, botones }) {
  const bloquesHtml = (bloques || []).map(bloque => `
    <div style="padding:14px;border:1px solid #d8e2ea;border-radius:8px;background:#ffffff;">
      <div style="color:#657486;font-size:13px;font-weight:800;text-transform:uppercase;">
        ${escapeHtml_(bloque.etiqueta)}
      </div>
      <div style="margin-top:6px;color:#10243f;font-size:16px;font-weight:850;">
        ${escapeHtml_(bloque.valor)}
      </div>
    </div>
  `).join('');

  const botonesHtml = (botones || []).length
    ? `
      <div style="text-align:center;margin:26px 0 8px;">
        ${botones.map(boton => {
          const style = boton.primario
            ? 'display:inline-block;background:linear-gradient(90deg,#00a99d,#10243f);border-radius:8px;padding:14px 20px;color:#ffffff;text-decoration:none;font-weight:850;font-size:15px;box-shadow:0 14px 28px rgba(0,169,157,.25);margin:6px;'
            : 'display:inline-block;background:#fff0ef;border:1px solid #ef6f6c;border-radius:8px;padding:14px 20px;color:#8d302f;text-decoration:none;font-weight:850;font-size:15px;margin:6px;';
          return `<a href="${boton.url}" target="_blank" style="${style}">${escapeHtml_(boton.texto)}</a>`;
        }).join('')}
      </div>
    `
    : '';

  return `
    <div style="margin:0;padding:28px 0;background:#fbfaf7;font-family:Arial,Helvetica,sans-serif;color:#203040;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid rgba(16,36,63,.12);border-radius:8px;overflow:hidden;box-shadow:0 24px 60px rgba(16,36,63,.14);">

        <div style="background:linear-gradient(160deg,rgba(239,111,108,.75),transparent 34%),linear-gradient(20deg,rgba(0,169,157,.8),transparent 42%),linear-gradient(135deg,#10243f,#163b63);padding:34px;color:#ffffff;">
          <div style="display:inline-block;padding:8px 12px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(255,255,255,.12);font-size:13px;font-weight:800;text-transform:uppercase;">
            Edición 2026
          </div>

          <h1 style="margin:22px 0 12px;color:#ffffff;font-size:38px;line-height:1.05;">
            ${escapeHtml_(titulo)}
          </h1>

          <p style="margin:0;color:rgba(255,255,255,.84);font-size:16px;line-height:1.55;">
            Rally por la Luz 2026
          </p>
        </div>

        <div style="padding:34px;">
          <p style="margin:0 0 20px;color:#203040;font-size:16px;line-height:1.6;">
            ${intro}
          </p>

          <div style="display:grid;gap:12px;margin:18px 0;">
            ${bloquesHtml}
          </div>

          <div style="margin:18px 0;padding:14px;border-left:4px solid #f6c85f;border-radius:8px;background:#fff8e5;color:#765a12;font-size:14px;line-height:1.5;">
            ${escapeHtml_(nota)}
          </div>

          ${botonesHtml}

          <p style="margin:22px 0 0;color:#203040;font-size:16px;line-height:1.6;">
            Para cualquier duda puedes escribir a <strong>${CONTACT_EMAIL}</strong>.
          </p>

          <p style="margin:28px 0 0;color:#203040;font-size:16px;line-height:1.6;">
            Comité Organizador<br>
            Rally por la Luz 2026
          </p>
        </div>

        <div style="background:#f3f4f6;color:#657486;text-align:center;font-size:12px;padding:12px;">
          Rally por la Luz - INAOE
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
