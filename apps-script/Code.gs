const SHEET_NAME = 'Registros';
const NOTIFY_EMAIL = 'anyel.garcia@inaoe.mx';
const THANK_YOU_URL = 'https://rally-luz.github.io/2026/gracias.html';
const REGISTRATION_HEADERS = [
  'Fecha',
  'Nombre(s)',
  'Apellidos',
  'Correo',
  'Telefono',
  'Estado',
  'Institucion',
  'Hospedaje',
  'Token',
  'Confirmacion asistencia',
  'Fecha confirmacion'
];

function doPost(e) {
  try {
    const data = e.parameter || {};
    const sheet = getSheet_();
    ensureHeaders_(sheet);

    const token = Utilities.getUuid();
    const rowData = {
      'Fecha': new Date(),
      'Nombre(s)': data.nombre || '',
      'Apellidos': data.apellidos || '',
      'Correo': data.email || '',
      'Telefono': data.telefono || '',
      'Estado': data.estado || '',
      'Institucion': data.institucion || '',
      'Hospedaje': data.hospedaje || '',
      'Token': token,
      'Confirmacion asistencia': '',
      'Fecha confirmacion': ''
    };

    sheet.appendRow(buildRow_(sheet, rowData));
    sendNotification_(data);
    sendParticipantConfirmation_(data);

    return redirect_(THANK_YOU_URL);
  } catch (error) {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'Error en formulario Rally por la Luz 2026',
      body: String(error && error.stack ? error.stack : error)
    });

    return HtmlService.createHtmlOutput(
      '<h1>No se pudo guardar el registro</h1><p>Por favor intenta nuevamente o escribe a ' +
      NOTIFY_EMAIL +
      '.</p>'
    );
  }
}

function doGet(e) {
  const params = e.parameter || {};

  if (params.action === 'asistencia') {
    return handleAttendanceConfirmation_(params);
  }

  return HtmlService.createHtmlOutput('Rally por la Luz 2026');
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(REGISTRATION_HEADERS);
    return;
  }

  const headers = getHeaders_(sheet);
  const missing = REGISTRATION_HEADERS.filter(header => !headers.includes(header));

  if (missing.length > 0) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
  }
}

function getHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
}

function buildRow_(sheet, rowData) {
  return getHeaders_(sheet).map(header => rowData[header] || '');
}

function handleAttendanceConfirmation_(params) {
  const token = String(params.token || '').trim();
  const response = normalizeAttendanceResponse_(params.respuesta);

  if (!token || !response) {
    return createAttendancePage_('No pudimos registrar tu respuesta', 'El enlace no contiene una respuesta valida. Por favor responde el correo si necesitas ayuda.');
  }

  const sheet = getSheet_();
  ensureHeaders_(sheet);
  const headers = getHeaders_(sheet);
  const idxToken = headers.indexOf('Token');
  const idxResponse = headers.indexOf('Confirmacion asistencia');
  const idxDate = headers.indexOf('Fecha confirmacion');

  if (idxToken < 0 || idxResponse < 0 || idxDate < 0) {
    return createAttendancePage_('No pudimos registrar tu respuesta', 'La hoja no tiene las columnas de confirmacion listas.');
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return createAttendancePage_('No encontramos tu registro', 'Por favor responde el correo para confirmar tu asistencia.');
  }

  const tokens = sheet.getRange(2, idxToken + 1, lastRow - 1, 1).getValues();
  const matchIndex = tokens.findIndex(row => String(row[0] || '').trim() === token);

  if (matchIndex < 0) {
    return createAttendancePage_('No encontramos tu registro', 'Por favor responde el correo para confirmar tu asistencia.');
  }

  const rowNumber = matchIndex + 2;
  sheet.getRange(rowNumber, idxResponse + 1).setValue(response);
  sheet.getRange(rowNumber, idxDate + 1).setValue(new Date());

  const title = response === 'Si asistire' ? 'Asistencia confirmada' : 'Respuesta registrada';
  const message = response === 'Si asistire'
    ? 'Gracias por confirmar que asistirás al Rally por la Luz 2026.'
    : 'Gracias por avisarnos que no podrás asistir. Nos ayudas mucho con la logística.';

  return createAttendancePage_(title, message);
}

function normalizeAttendanceResponse_(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'si') return 'Si asistire';
  if (normalized === 'no') return 'No asistire';
  return '';
}

function createAttendancePage_(title, message) {
  return HtmlService.createHtmlOutput(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeEmailHtml_(title)}</title>
      </head>
      <body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#fbfaf7;font-family:Arial,Helvetica,sans-serif;color:#203040;padding:24px;">
        <main style="max-width:640px;border:1px solid #d8e2ea;border-radius:8px;background:#ffffff;overflow:hidden;box-shadow:0 24px 60px rgba(16,36,63,.14);">
          <section style="background:linear-gradient(135deg,#10243f,#00a99d);padding:24px;color:#ffffff;">
            <div style="font-size:13px;font-weight:800;text-transform:uppercase;">Rally por la Luz 2026</div>
            <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;">${escapeEmailHtml_(title)}</h1>
          </section>
          <section style="padding:24px;">
            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">${escapeEmailHtml_(message)}</p>
            <a href="https://rally-luz.github.io/2026/" style="display:inline-block;background:linear-gradient(90deg,#00a99d,#10243f);border-radius:8px;padding:13px 18px;color:#ffffff;text-decoration:none;font-weight:800;">Volver al sitio</a>
          </section>
        </main>
      </body>
    </html>
  `);
}

function sendNotification_(data) {
  const subject = 'Nuevo registro: Rally por la Luz 2026';
  const body = [
    'Nuevo registro para Rally por la Luz 2026',
    '',
    `Nombre(s): ${data.nombre || ''}`,
    `Apellidos: ${data.apellidos || ''}`,
    `Correo electronico: ${data.email || ''}`,
    `Celular o WhatsApp: ${data.telefono || ''}`,
    `Estado: ${data.estado || ''}`,
    `Institucion: ${data.institucion || ''}`,
    `Necesita hospedaje: ${data.hospedaje || ''}`
  ].join('\n');

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: data.email || NOTIFY_EMAIL,
    subject,
    body,
    htmlBody: createOrganizerHtml_(data)
  });
}

function sendParticipantConfirmation_(data) {
  const email = String(data.email || '').trim();
  if (!email || !isValidParticipantEmail_(email)) return;

  const subject = 'Registro recibido: Rally por la Luz 2026';
  const body = [
    'Hola,',
    '',
    'Hemos recibido tu registro para el Rally por la Luz 2026.',
    '',
    'Sede: INAOE, Tonantzintla, Puebla',
    'Fechas: 29 y 30 de septiembre',
    'Modalidad: presencial',
    '',
    'Te contactaremos con mas detalles conforme se acerque la fecha.',
    '',
    'Dudas: rallyxlaluz@inaoep.mx',
    '',
    'Comite Organizador - Rally por la Luz'
  ].join('\n');

  MailApp.sendEmail({
    to: email,
    replyTo: NOTIFY_EMAIL,
    name: 'Rally por la Luz',
    subject,
    body,
    htmlBody: createParticipantHtml_(data)
  });
}

function createOrganizerHtml_(data) {
  const rows = [
    ['Nombre(s)', data.nombre],
    ['Apellidos', data.apellidos],
    ['Correo', data.email],
    ['Celular o WhatsApp', data.telefono],
    ['Estado', data.estado],
    ['Institucion', data.institucion],
    ['Hospedaje', data.hospedaje]
  ].map(([label, value]) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #d8e2ea;color:#657486;font-weight:700;">${escapeEmailHtml_(label)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #d8e2ea;color:#10243f;">${escapeEmailHtml_(value || '')}</td>
    </tr>
  `).join('');

  return createEmailShell_({
    title: 'Nuevo registro',
    intro: 'Se recibio un nuevo registro para Rally por la Luz 2026.',
    content: `<table style="width:100%;border-collapse:collapse;border:1px solid #d8e2ea;border-radius:8px;overflow:hidden;">${rows}</table>`
  });
}

function createParticipantHtml_(data) {
  return createEmailShell_({
    title: 'Registro recibido',
    intro: `Hola ${escapeEmailHtml_(data.nombre || '')}, hemos recibido tu registro para Rally por la Luz 2026.`,
    content: `
      <div style="display:grid;gap:12px;margin:18px 0;">
        <div style="padding:14px;border:1px solid #d8e2ea;border-radius:8px;background:#ffffff;">
          <div style="color:#657486;font-size:13px;font-weight:700;">Fechas</div>
          <div style="margin-top:6px;color:#10243f;font-size:16px;font-weight:800;">29 y 30 de septiembre</div>
        </div>
        <div style="padding:14px;border:1px solid #d8e2ea;border-radius:8px;background:#ffffff;">
          <div style="color:#657486;font-size:13px;font-weight:700;">Sede</div>
          <div style="margin-top:6px;color:#10243f;font-size:16px;font-weight:800;">INAOE, Tonantzintla, Puebla</div>
        </div>
      </div>
      <div style="margin:18px 0;padding:14px;border-left:4px solid #f6c85f;border-radius:8px;background:#fff8e5;color:#765a12;font-size:14px;line-height:1.5;">
        Te contactaremos con mas detalles conforme se acerque la fecha.
      </div>
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="https://rally-luz.github.io/2026/" target="_blank" style="display:inline-block;background:linear-gradient(90deg,#00a99d,#10243f);border-radius:8px;padding:13px 18px;color:#ffffff;text-decoration:none;font-weight:800;">Ver sitio del evento</a>
      </div>
    `
  });
}

function createEmailShell_({ title, intro, content }) {
  return `
  <div style="background:#fbfaf7;padding:24px 0;margin:0;">
    <div style="max-width:640px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#203040;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #d8e2ea;">
      <div style="background:linear-gradient(135deg,#10243f,#00a99d);padding:24px;text-align:left;color:#ffffff;">
        <div style="font-size:13px;font-weight:800;text-transform:uppercase;">Rally por la Luz 2026</div>
        <h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;color:#ffffff;">${escapeEmailHtml_(title)}</h1>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 18px;color:#203040;font-size:16px;line-height:1.6;">${intro}</p>
        ${content}
        <p style="margin:22px 0 0;color:#203040;font-size:16px;line-height:1.6;">Comite Organizador - Rally por la Luz</p>
      </div>
      <div style="background:#f3f4f6;color:#657486;text-align:center;font-size:12px;padding:12px;">Rally por la Luz - INAOE</div>
    </div>
  </div>
  `;
}

function isValidParticipantEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function escapeEmailHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function redirect_(url) {
  return HtmlService.createHtmlOutput(
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta http-equiv="refresh" content="0; url=' + url + '">' +
    '</head><body><script>window.top.location.href=' +
    JSON.stringify(url) +
    ';</script></body></html>'
  );
}
