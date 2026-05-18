const SHEET_NAME = 'Registros';
const NOTIFY_EMAIL = 'anyel.garcia@inaoe.mx';
const THANK_YOU_URL = 'https://rally-luz.github.io/2026/gracias.html';

function doPost(e) {
  try {
    const data = e.parameter || {};
    const sheet = getSheet_();
    ensureHeaders_(sheet);

    const row = [
      new Date(),
      data.nombre || '',
      data.apellidos || '',
      data.email || '',
      data.telefono || '',
      data.estado || '',
      data.institucion || '',
      data.hospedaje || ''
    ];

    sheet.appendRow(row);
    sendNotification_(data);

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

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() > 0) return;

  sheet.appendRow([
    'Fecha',
    'Nombre(s)',
    'Apellidos',
    'Correo',
    'Telefono',
    'Estado',
    'Institucion',
    'Hospedaje'
  ]);
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
    body
  });
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
