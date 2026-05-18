const SHEET_NAME = 'Registros';
const NOTIFY_EMAIL = 'anyel.garcia@inaoe.mx';
const REPLY_TO_EMAIL = 'rallyxlaluz@inaoe.mx';

const THANK_YOU_URL =
  'https://ccc.inaoep.mx/~seminario-biomedicas/RallyXLu.html';

const EVENT_URL =
  'https://ccc.inaoep.mx/~seminario-biomedicas/RallyXLu.html';

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
  'Fecha confirmacion',
  'Correo confirmacion',
  'Error correo confirmacion'
];

function doPost(e) {
  try {
    const data = getPostData_(e);

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
      'Fecha confirmacion': '',
      'Correo confirmacion': '',
      'Error correo confirmacion': ''
    };

    sheet.appendRow(buildRow_(sheet, rowData));

    const rowNumber = sheet.getLastRow();

    sendNotification_(data);
    sendParticipantConfirmation_(data, sheet, rowNumber);

    return redirect_(THANK_YOU_URL);

  } catch (error) {

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'Error en formulario Rally por la Luz 2026',
      body: String(error && error.stack ? error.stack : error)
    });

    return HtmlService.createHtmlOutput(
      '<h1>No se pudo guardar el registro</h1>' +
      '<p>Por favor intenta nuevamente.</p>'
    );
  }
}

function getPostData_(e) {

  if (!e) return {};

  if (e.parameter && Object.keys(e.parameter).length > 0) {
    return e.parameter;
  }

  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      throw new Error('No se pudo leer el cuerpo POST.');
    }
  }

  return {};
}

function doGet(e) {

  const params = e && e.parameter ? e.parameter : {};

  if (params.action === 'asistencia') {
    return handleAttendanceConfirmation_(params);
  }

  return HtmlService.createHtmlOutput('Rally por la Luz 2026');
}

function getSheet_() {

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  return spreadsheet.getSheetByName(SHEET_NAME) ||
    spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(REGISTRATION_HEADERS);
    return;
  }

  const headers = getHeaders_(sheet);

  const missing = REGISTRATION_HEADERS.filter(
    header => !headers.includes(header)
  );

  if (missing.length > 0) {
    sheet
      .getRange(1, headers.length + 1, 1, missing.length)
      .setValues([missing]);
  }
}

function getHeaders_(sheet) {

  return sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(String);
}

function buildRow_(sheet, rowData) {

  return getHeaders_(sheet).map(
    header => rowData[header] || ''
  );
}

function handleAttendanceConfirmation_(params) {

  const token = String(params.token || '').trim();

  const response =
    normalizeAttendanceResponse_(params.respuesta);

  if (!token || !response) {

    return createAttendancePage_(
      'No pudimos registrar tu respuesta',
      'El enlace no es válido.'
    );
  }

  const sheet = getSheet_();

  ensureHeaders_(sheet);

  const headers = getHeaders_(sheet);

  const idxToken =
    headers.indexOf('Token');

  const idxResponse =
    headers.indexOf('Confirmacion asistencia');

  const idxDate =
    headers.indexOf('Fecha confirmacion');

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {

    return createAttendancePage_(
      'No encontramos tu registro',
      'Por favor responde el correo.'
    );
  }

  const tokens = sheet
    .getRange(2, idxToken + 1, lastRow - 1, 1)
    .getValues();

  const matchIndex = tokens.findIndex(
    row => String(row[0] || '').trim() === token
  );

  if (matchIndex < 0) {

    return createAttendancePage_(
      'No encontramos tu registro',
      'Por favor responde el correo.'
    );
  }

  const rowNumber = matchIndex + 2;

  sheet
    .getRange(rowNumber, idxResponse + 1)
    .setValue(response);

  sheet
    .getRange(rowNumber, idxDate + 1)
    .setValue(new Date());

  const title =
    response === 'Sí asistiré'
      ? 'Asistencia confirmada'
      : 'Respuesta registrada';

  const message =
    response === 'Sí asistiré'
      ? 'Gracias por confirmar tu asistencia.'
      : 'Gracias por avisarnos.';

  return createAttendancePage_(title, message);
}

function normalizeAttendanceResponse_(value) {

  const normalized =
    String(value || '')
      .trim()
      .toLowerCase();

  if (normalized === 'si' || normalized === 'sí') {
    return 'Sí asistiré';
  }

  if (normalized === 'no') {
    return 'No asistiré';
  }

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

      <body style="margin:0;padding:40px;font-family:Arial;background:#fbfaf7;">

        <div style="max-width:650px;margin:auto;background:#fff;border-radius:10px;padding:30px;border:1px solid #d8e2ea;">

          <h1>${escapeEmailHtml_(title)}</h1>

          <p>${escapeEmailHtml_(message)}</p>

          <a
            href="${EVENT_URL}"
            style="display:inline-block;padding:14px 20px;background:#10243f;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;"
          >
            Volver al sitio
          </a>

        </div>

      </body>
    </html>
  `);
}

function sendNotification_(data) {

  const subject =
    'Nuevo registro: Rally por la Luz 2026';

  const body = [
    'Nuevo registro para Rally por la Luz 2026',
    '',
    `Nombre(s): ${data.nombre || ''}`,
    `Apellidos: ${data.apellidos || ''}`,
    `Correo: ${data.email || ''}`,
    `Telefono: ${data.telefono || ''}`,
    `Estado: ${data.estado || ''}`,
    `Institucion: ${data.institucion || ''}`,
    `Hospedaje: ${data.hospedaje || ''}`
  ].join('\n');

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: data.email || REPLY_TO_EMAIL,
    subject,
    body,
    htmlBody: createOrganizerHtml_(data)
  });
}

function sendParticipantConfirmation_(data, sheet, rowNumber) {

  const email =
    String(data.email || '').trim();

  if (!email || !isValidParticipantEmail_(email)) {

    markParticipantEmailStatus_(
      sheet,
      rowNumber,
      'No enviado',
      'Correo inválido'
    );

    return;
  }

  const subject =
    'Confirmación de registro al Rally por la Luz 2026';

  const body = [
    `Hola ${data.nombre || ''},`,
    '',
    'Tu registro fue recibido correctamente.',
    '',
    'Sede: INAOE, Tonantzintla, Puebla',
    'Fechas: 29 y 30 de septiembre',
    '',
    'Más adelante te enviaremos información adicional.',
    '',
    `Sitio del evento: ${EVENT_URL}`,
    '',
    'Comité Organizador',
    'Rally por la Luz 2026'
  ].join('\n');

  try {

    MailApp.sendEmail({
      to: email,
      replyTo: REPLY_TO_EMAIL,
      name: 'Rally por la Luz 2026',
      subject,
      body,
      htmlBody: createParticipantHtml_(data)
    });

    markParticipantEmailStatus_(
      sheet,
      rowNumber,
      'Enviado',
      ''
    );

  } catch (error) {

    markParticipantEmailStatus_(
      sheet,
      rowNumber,
      'Error',
      String(error && error.message ? error.message : error)
    );

    throw error;
  }
}

function markParticipantEmailStatus_(
  sheet,
  rowNumber,
  status,
  errorMessage
) {

  if (!sheet || !rowNumber) return;

  ensureHeaders_(sheet);

  const headers = getHeaders_(sheet);

  const idxStatus =
    headers.indexOf('Correo confirmacion');

  const idxError =
    headers.indexOf('Error correo confirmacion');

  if (idxStatus >= 0) {

    sheet
      .getRange(rowNumber, idxStatus + 1)
      .setValue(status);
  }

  if (idxError >= 0) {

    sheet
      .getRange(rowNumber, idxError + 1)
      .setValue(errorMessage || '');
  }
}

function createOrganizerHtml_(data) {

  const rows = [
    ['Nombre(s)', data.nombre],
    ['Apellidos', data.apellidos],
    ['Correo', data.email],
    ['Telefono', data.telefono],
    ['Estado', data.estado],
    ['Institucion', data.institucion],
    ['Hospedaje', data.hospedaje]
  ]
  .map(([label, value]) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #ddd;font-weight:bold;">
        ${escapeEmailHtml_(label)}
      </td>

      <td style="padding:10px;border-bottom:1px solid #ddd;">
        ${escapeEmailHtml_(value || '')}
      </td>
    </tr>
  `)
  .join('');

  return createEmailShell_({
    title: 'Nuevo registro',
    intro: 'Se recibió un nuevo registro.',
    content: `
      <table style="width:100%;border-collapse:collapse;">
        ${rows}
      </table>
    `
  });
}

function createParticipantHtml_(data) {

  return createEmailShell_({
    title: 'Registro recibido',
    intro:
      `Hola ${escapeEmailHtml_(data.nombre || '')}, tu registro fue recibido correctamente.`,
    content: `

      <div style="margin:20px 0;padding:18px;background:#f7f7f7;border-radius:10px;">

        <p><strong>Fechas:</strong> 29 y 30 de septiembre</p>

        <p><strong>Sede:</strong> INAOE, Tonantzintla, Puebla</p>

      </div>

      <div style="text-align:center;margin-top:30px;">

        <a
          href="${EVENT_URL}"
          target="_blank"
          style="display:inline-block;background:#10243f;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold;"
        >
          Ver sitio del evento
        </a>

      </div>
    `
  });
}

function createEmailShell_({
  title,
  intro,
  content
}) {

  return `
    <div style="background:#fbfaf7;padding:30px;">

      <div style="max-width:650px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #ddd;">

        <div style="background:#10243f;padding:24px;color:#fff;">

          <div style="font-size:13px;font-weight:bold;">
            Rally por la Luz 2026
          </div>

          <h1 style="margin-top:8px;color:#fff;">
            ${escapeEmailHtml_(title)}
          </h1>

        </div>

        <div style="padding:24px;">

          <p style="font-size:16px;line-height:1.6;">
            ${intro}
          </p>

          ${content}

          <p style="margin-top:30px;">
            Comité Organizador<br>
            Rally por la Luz 2026
          </p>

        </div>

      </div>

    </div>
  `;
}

function isValidParticipantEmail_(value) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(String(value || '').trim());
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
    '<!doctype html>' +
    '<html>' +
    '<head>' +
    '<meta charset="utf-8">' +
    '<meta http-equiv="refresh" content="0; url=' + url + '">' +
    '</head>' +
    '<body>' +
    '<script>' +
    'window.top.location.href=' + JSON.stringify(url) + ';' +
    '</script>' +
    '</body>' +
    '</html>'
  );
}
