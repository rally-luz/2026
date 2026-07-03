const SHEET_NAME = 'Registros';
const NOTIFY_EMAIL = 'anyel.garcia@inaoe.mx';
const REPLY_TO_EMAIL = 'rallyxlaluz@inaoe.mx';

const THANK_YOU_URL =
  'https://ccc.inaoep.mx/~seminario-biomedicas/RallyXLu.html';

const EVENT_URL =
  'https://ccc.inaoep.mx/~seminario-biomedicas/RallyXLu.html';

const GOOGLE_CALENDAR_URL =
  'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Rally%20por%20la%20Luz%202026&dates=20260921T150000Z/20260922T230000Z&details=Rally%20por%20la%20Luz%202026%20en%20INAOE.%20Experiencia%20presencial%20de%20biofot%C3%B3nica%2C%20retos%20colaborativos%20y%20aprendizaje%20aplicado.&location=INAOE%2C%20Tonantzintla%2C%20Puebla';

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

    if (isTelegramUpdate_(data)) {
      handleTelegramUpdate_(data);
      return ContentService.createTextOutput('ok');
    }

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
    notifyTelegram_([
      'Nuevo registro Rally por la Luz 2026',
      `Nombre: ${data.nombre || ''} ${data.apellidos || ''}`.trim(),
      `Correo: ${data.email || ''}`,
      `Telefono: ${data.telefono || ''}`,
      `WhatsApp: ${createWhatsappUrl_(data.telefono) || 'Sin telefono valido'}`,
      `Estado: ${data.estado || ''}`,
      `Institucion: ${data.institucion || ''}`,
      `Hospedaje: ${data.hospedaje || ''}`,
      `Fila: ${rowNumber}`
    ].join('\n'));

    return redirect_(THANK_YOU_URL);

  } catch (error) {
    notifyTelegram_([
      'Error en registro Rally por la Luz 2026',
      String(error && error.stack ? error.stack : error)
    ].join('\n'));

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'Error en formulario Rally por la Luz 2026',
      body: String(error && error.stack ? error.stack : error)
    });

    return HtmlService.createHtmlOutput(
      '<h1>No se pudo guardar el registro</h1><p>Por favor intenta nuevamente.</p>'
    );
  }
}

function getPostData_(e) {
  if (!e) return {};

  if (e.parameter && Object.keys(e.parameter).length > 0) {
    return repairObjectText_(e.parameter);
  }

  if (e.postData && e.postData.contents) {
    try {
      return repairObjectText_(JSON.parse(e.postData.contents));
    } catch (error) {
      throw new Error('No se pudo leer el cuerpo POST.');
    }
  }

  return {};
}

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};

    if (params.action === 'asistencia') {
      return handleAttendanceConfirmation_(params);
    }

    return HtmlService.createHtmlOutput('Rally por la Luz 2026');
  } catch (error) {
    notifyTelegram_([
      'Error en enlace de asistencia Rally por la Luz 2026',
      String(error && error.stack ? error.stack : error)
    ].join('\n'));

    return HtmlService.createHtmlOutput('No pudimos procesar la solicitud.');
  }
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

function repairObjectText_(obj) {
  const repaired = {};

  Object.keys(obj || {}).forEach(key => {
    repaired[key] = repairMojibakeText_(obj[key]);
  });

  return repaired;
}

function handleAttendanceConfirmation_(params) {
  const token = String(params.token || '').trim();
  const response = normalizeAttendanceResponse_(params.respuesta);

  if (!token || !response) {
    return createAttendancePage_(
      'No pudimos registrar tu respuesta',
      'El enlace no es válido.'
    );
  }

  const sheet = getSheet_();
  ensureHeaders_(sheet);

  const headers = getHeaders_(sheet);

  const idxToken = headers.indexOf('Token');
  const idxResponse = headers.indexOf('Confirmacion asistencia');
  const idxDate = headers.indexOf('Fecha confirmacion');

  if (idxToken < 0 || idxResponse < 0 || idxDate < 0) {
    return createAttendancePage_(
      'No pudimos registrar tu respuesta',
      'La hoja no tiene las columnas necesarias.'
    );
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return createAttendancePage_(
      'No encontramos tu registro',
      'Por favor responde nuevamente el correo.'
    );
  }

  const tokens = sheet.getRange(2, idxToken + 1, lastRow - 1, 1).getValues();

  const matchIndex = tokens.findIndex(
    row => String(row[0] || '').trim() === token
  );

  if (matchIndex < 0) {
    return createAttendancePage_(
      'No encontramos tu registro',
      'Por favor responde nuevamente el correo.'
    );
  }

  const rowNumber = matchIndex + 2;

  sheet.getRange(rowNumber, idxResponse + 1).setValue(response);
  sheet.getRange(rowNumber, idxDate + 1).setValue(new Date());
  notifyTelegram_([
    'Confirmacion de asistencia Rally por la Luz 2026',
    `Respuesta: ${response}`,
    `Fila: ${rowNumber}`
  ].join('\n'));

  if (response === 'Sí asistiré') {
    return createAttendancePage_(
      '¡Gracias por confirmar!',
      'Tu asistencia al Rally por la Luz 2026 ha sido confirmada. Muy pronto recibirás más información del evento.'
    );
  }

  return createAttendancePage_(
    'Lamentamos que no puedas asistir',
    'Gracias por avisarnos. Esperamos contar contigo en futuras ediciones del Rally por la Luz.'
  );
}

function normalizeAttendanceResponse_(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'si' || normalized === 'sí') return 'Sí asistiré';
  if (normalized === 'no') return 'No asistiré';

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

      <body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#fbfaf7;font-family:Arial,Helvetica,sans-serif;padding:24px;color:#203040;">
        <main style="width:100%;max-width:760px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid rgba(16,36,63,.12);box-shadow:0 24px 60px rgba(16,36,63,.18);">
          <section style="background:linear-gradient(160deg,rgba(239,111,108,.75),transparent 34%),linear-gradient(20deg,rgba(0,169,157,.8),transparent 42%),linear-gradient(135deg,#10243f,#163b63);padding:34px;color:#ffffff;">
            <div style="display:inline-block;padding:8px 12px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(255,255,255,.12);font-size:13px;font-weight:800;text-transform:uppercase;">
              Edición 2026
            </div>

            <h1 style="margin:22px 0 12px;font-size:40px;line-height:1.05;color:#ffffff;">
              ${escapeEmailHtml_(title)}
            </h1>

            <p style="margin:0;color:rgba(255,255,255,.86);font-size:17px;line-height:1.55;">
              Rally por la Luz 2026
            </p>
          </section>

          <section style="padding:34px;">
            <p style="margin:0;color:#203040;font-size:18px;line-height:1.7;">
              ${escapeEmailHtml_(message)}
            </p>

            <div style="text-align:center;margin-top:34px;">
              <a href="${EVENT_URL}" target="_blank" style="display:inline-block;background:linear-gradient(90deg,#00a99d,#10243f);color:#ffffff;text-decoration:none;padding:15px 24px;border-radius:8px;font-weight:850;font-size:15px;box-shadow:0 14px 28px rgba(0,169,157,.25);margin:6px;">
                Volver al sitio del evento
              </a>

              <a href="${GOOGLE_CALENDAR_URL}" target="_blank" style="display:inline-block;background:#ffffff;border:1px solid #10243f;color:#10243f;text-decoration:none;padding:15px 24px;border-radius:8px;font-weight:850;font-size:15px;margin:6px;">
                Agregar a Google Calendar
              </a>
            </div>
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
  const email = String(data.email || '').trim();

  if (!email || !isValidParticipantEmail_(email)) {
    markParticipantEmailStatus_(sheet, rowNumber, 'No enviado', 'Correo inválido');
    notifyTelegram_([
      'No se envio correo de confirmacion',
      'Motivo: correo invalido o vacio',
      `Correo: ${email}`,
      `Fila: ${rowNumber}`
    ].join('\n'));
    return;
  }

  const subject = 'Confirmación de registro al Rally por la Luz 2026';

  const body = [
    `Hola ${data.nombre || ''},`,
    '',
    'Tu registro fue recibido correctamente.',
    '',
    'Sede: INAOE, Tonantzintla, Puebla',
    'Fechas: 21 y 22 de septiembre',
    'Modalidad: presencial',
    '',
    'Más adelante te enviaremos información adicional.',
    '',
    `Sitio del evento: ${EVENT_URL}`,
    `Google Calendar: ${GOOGLE_CALENDAR_URL}`,
    '',
    `Dudas: ${REPLY_TO_EMAIL}`,
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

    markParticipantEmailStatus_(sheet, rowNumber, 'Enviado', '');

  } catch (error) {
    markParticipantEmailStatus_(
      sheet,
      rowNumber,
      'Error',
      String(error && error.message ? error.message : error)
    );
    notifyTelegram_([
      'Error enviando correo al participante',
      `Correo: ${email}`,
      `Fila: ${rowNumber}`,
      String(error && error.stack ? error.stack : error)
    ].join('\n'));

    throw error;
  }
}

function probarTelegram() {
  notifyTelegram_('Prueba Telegram Rally por la Luz 2026: conexion correcta.');
}

function configurarTelegramWebhook() {
  const config = getTelegramConfig_();
  if (!config.token) throw new Error('Falta TELEGRAM_BOT_TOKEN en Script properties.');

  const url = getTelegramWebhookUrl_();
  if (!url) throw new Error('No se encontro la URL del Web App. Despliega el script primero.');

  configurarTelegramComandos();

  const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${config.token}/setWebhook`, {
    method: 'post',
    muteHttpExceptions: true,
    payload: { url }
  });

  console.log(response.getContentText());
  return response.getContentText();
}

function getTelegramWebhookUrl_() {
  const props = PropertiesService.getScriptProperties();
  const configuredUrl = String(props.getProperty('TELEGRAM_WEBAPP_URL') || '').trim();
  if (configuredUrl) return configuredUrl;

  const serviceUrl = ScriptApp.getService().getUrl();
  if (!serviceUrl) return '';

  return serviceUrl.replace(/\/dev(\?.*)?$/, '/exec$1');
}

function configurarTelegramComandos() {
  const config = getTelegramConfig_();
  if (!config.token) throw new Error('Falta TELEGRAM_BOT_TOKEN en Script properties.');

  const commands = [
    { command: 'ayuda', description: 'Ver comandos disponibles' },
    { command: 'resumen', description: 'Ver totales rapidos' },
    { command: 'hospedaje', description: 'CSV de quienes solicitaron hospedaje' },
    { command: 'confirmados', description: 'CSV de quienes si asistiran' },
    { command: 'no_asisten', description: 'CSV de quienes no asistiran' },
    { command: 'pendientes', description: 'CSV sin confirmacion de asistencia' },
    { command: 'id', description: 'Mostrar chat id' }
  ];

  const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${config.token}/setMyCommands`, {
    method: 'post',
    muteHttpExceptions: true,
    payload: {
      commands: JSON.stringify(commands)
    }
  });

  console.log(response.getContentText());
  return response.getContentText();
}

function verEstadoTelegramWebhook() {
  const config = getTelegramConfig_();
  if (!config.token) throw new Error('Falta TELEGRAM_BOT_TOKEN en Script properties.');

  const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${config.token}/getWebhookInfo`, {
    method: 'get',
    muteHttpExceptions: true
  });

  console.log(response.getContentText());
  return response.getContentText();
}

function instalarTriggerTelegramPolling() {
  const config = getTelegramConfig_();
  if (!config.token) throw new Error('Falta TELEGRAM_BOT_TOKEN en Script properties.');

  borrarTelegramWebhook();
  configurarTelegramComandos();
  eliminarTriggersTelegramPolling_();
  descartarTelegramPendientes_();

  ScriptApp.newTrigger('revisarTelegramComandos')
    .timeBased()
    .everyMinutes(1)
    .create();

  revisarTelegramComandos();

  if (config.chatId) {
    sendTelegramMessageToChat_(
      config.chatId,
      'Polling de Telegram activado. Ya puedo responder comandos como /ayuda, /resumen, /hospedaje y /confirmados.'
    );
  }
}

function reiniciarTelegramPollingDesdeAhora() {
  descartarTelegramPendientes_();
  sendTelegramMessageToChat_(
    getTelegramConfig_().chatId,
    'Listo. Ya descarte los comandos anteriores y empezare a responder solo mensajes nuevos.'
  );
}

function desinstalarTriggerTelegramPolling() {
  eliminarTriggersTelegramPolling_();
}

function apagarTelegramAppsScript() {
  eliminarTriggersTelegramPolling_();
  PropertiesService.getScriptProperties().deleteProperty('TELEGRAM_LAST_UPDATE_ID');

  try {
    return borrarTelegramWebhook();
  } catch (error) {
    console.warn(`No se pudo borrar webhook: ${error}`);
    return String(error);
  }
}

function revisarTelegramComandos() {
  const config = getTelegramConfig_();
  if (!config.token) throw new Error('Falta TELEGRAM_BOT_TOKEN en Script properties.');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) return;

  try {
    const props = PropertiesService.getScriptProperties();
    const lastUpdateId = Number(props.getProperty('TELEGRAM_LAST_UPDATE_ID') || 0);
    const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${config.token}/getUpdates`, {
      method: 'post',
      muteHttpExceptions: true,
      payload: {
        offset: lastUpdateId + 1,
        timeout: 0,
        allowed_updates: JSON.stringify(['message', 'edited_message'])
      }
    });
    const result = JSON.parse(response.getContentText() || '{}');

    if (!result.ok) {
      console.warn(response.getContentText());
      return;
    }

    (result.result || []).forEach(update => {
      if (typeof update.update_id === 'number') {
        props.setProperty('TELEGRAM_LAST_UPDATE_ID', String(update.update_id));
      }

      try {
        handleTelegramUpdate_(update);
      } catch (error) {
        notifyTelegram_([
          'Error procesando comando de Telegram',
          `Update: ${update.update_id || ''}`,
          String(error && error.stack ? error.stack : error)
        ].join('\n'));
      }
    });
  } finally {
    lock.releaseLock();
  }
}

function descartarTelegramPendientes_() {
  const config = getTelegramConfig_();
  if (!config.token) throw new Error('Falta TELEGRAM_BOT_TOKEN en Script properties.');

  const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${config.token}/getUpdates`, {
    method: 'post',
    muteHttpExceptions: true,
    payload: {
      timeout: 0,
      allowed_updates: JSON.stringify(['message', 'edited_message'])
    }
  });
  const result = JSON.parse(response.getContentText() || '{}');
  const updates = result.ok ? (result.result || []) : [];
  const maxUpdateId = updates.reduce((max, update) => {
    return typeof update.update_id === 'number' ? Math.max(max, update.update_id) : max;
  }, Number(PropertiesService.getScriptProperties().getProperty('TELEGRAM_LAST_UPDATE_ID') || 0));

  if (maxUpdateId > 0) {
    PropertiesService.getScriptProperties().setProperty('TELEGRAM_LAST_UPDATE_ID', String(maxUpdateId));
  }
}

function eliminarTriggersTelegramPolling_() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'revisarTelegramComandos')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
}

function probarComandoAyudaTelegram() {
  const config = getTelegramConfig_();
  if (!config.chatId) throw new Error('Falta TELEGRAM_CHAT_ID en Script properties.');

  handleTelegramUpdate_({
    message: {
      text: '/ayuda',
      chat: { id: config.chatId }
    }
  });
}

function borrarTelegramWebhook() {
  const config = getTelegramConfig_();
  if (!config.token) throw new Error('Falta TELEGRAM_BOT_TOKEN en Script properties.');

  const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${config.token}/deleteWebhook`, {
    method: 'post',
    muteHttpExceptions: true
  });

  console.log(response.getContentText());
  return response.getContentText();
}

function eliminarWebhookTelegram() {
  return borrarTelegramWebhook();
}

function notifyTelegram_(message) {
  const config = getTelegramConfig_();
  if (!config.token || !config.chatId) return;

  sendTelegramMessageToChat_(config.chatId, message);
}

function sendTelegramMessageToChat_(chatId, message) {
  const config = getTelegramConfig_();
  if (!config.token || !chatId) return;

  try {
    UrlFetchApp.fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
      method: 'post',
      muteHttpExceptions: true,
      payload: {
        chat_id: chatId,
        text: String(message || '').slice(0, 3900),
        disable_web_page_preview: true
      }
    });
  } catch (error) {
    console.warn(`No se pudo enviar alerta Telegram: ${error}`);
  }
}

function sendTelegramDocumentToChat_(chatId, blob, caption) {
  const config = getTelegramConfig_();
  if (!config.token || !chatId || !blob) return;

  try {
    UrlFetchApp.fetch(`https://api.telegram.org/bot${config.token}/sendDocument`, {
      method: 'post',
      muteHttpExceptions: true,
      payload: {
        chat_id: chatId,
        caption: String(caption || '').slice(0, 900),
        document: blob
      }
    });
  } catch (error) {
    console.warn(`No se pudo enviar documento Telegram: ${error}`);
  }
}

function isTelegramUpdate_(data) {
  return Boolean(data && (data.message || data.edited_message || data.callback_query));
}

function handleTelegramUpdate_(update) {
  const message = update.message || update.edited_message || {};
  const chat = message.chat || {};
  const chatId = String(chat.id || '').trim();
  const text = String(message.text || '').trim();
  const command = text.split(/\s+/)[0].split('@')[0].toLowerCase();
  const config = getTelegramConfig_();

  if (!chatId || !command) return;

  if (command === '/id') {
    sendTelegramMessageToChat_(chatId, `Chat ID: ${chatId}`);
    return;
  }

  if (!config.chatId) {
    sendTelegramMessageToChat_(chatId, 'Falta configurar TELEGRAM_CHAT_ID en Script properties. Usa /id para obtenerlo.');
    return;
  }

  if (chatId !== String(config.chatId)) return;

  if (command === '/ayuda' || command === '/start') {
    sendTelegramMessageToChat_(chatId, [
      'Comandos Rally por la Luz 2026',
      '/hospedaje - CSV de registros que solicitaron hospedaje',
      '/confirmados - CSV de quienes confirmaron que si asistiran',
      '/no_asisten - CSV de quienes confirmaron que no asistiran',
      '/pendientes - CSV de registros sin confirmacion de asistencia',
      '/resumen - Totales rapidos',
      '/id - Muestra el chat id'
    ].join('\n'));
    return;
  }

  if (command === '/hospedaje') {
    sendTelegramCsvReport_(chatId, 'hospedaje');
    return;
  }

  if (command === '/confirmados') {
    sendTelegramCsvReport_(chatId, 'confirmados');
    return;
  }

  if (command === '/no_asisten') {
    sendTelegramCsvReport_(chatId, 'no_asisten');
    return;
  }

  if (command === '/pendientes') {
    sendTelegramCsvReport_(chatId, 'pendientes');
    return;
  }

  if (command === '/resumen') {
    sendTelegramMessageToChat_(chatId, buildTelegramSummary_());
    return;
  }

  sendTelegramMessageToChat_(chatId, 'Comando no reconocido. Usa /ayuda.');
}

function sendTelegramCsvReport_(chatId, reportType) {
  const report = buildCsvReport_(reportType);
  const blob = Utilities.newBlob(report.csv, 'text/csv', report.filename);
  sendTelegramDocumentToChat_(chatId, blob, report.caption);
}

function buildTelegramSummary_() {
  const records = getRegistrationRecords_();
  const hospedaje = records.filter(record => isYesValue_(record['Hospedaje'])).length;
  const confirmados = records.filter(record => normalizeText_(record['Confirmacion asistencia']).includes('si')).length;
  const noAsisten = records.filter(record => normalizeText_(record['Confirmacion asistencia']).includes('no')).length;
  const pendientes = records.length - confirmados - noAsisten;

  return [
    'Resumen Rally por la Luz 2026',
    `Registros: ${records.length}`,
    `Hospedaje: ${hospedaje}`,
    `Si asistiran: ${confirmados}`,
    `No asistiran: ${noAsisten}`,
    `Pendientes: ${pendientes}`
  ].join('\n');
}

function buildCsvReport_(reportType) {
  const records = getRegistrationRecords_();
  const filters = {
    hospedaje: record => isYesValue_(record['Hospedaje']),
    confirmados: record => normalizeText_(record['Confirmacion asistencia']).includes('si'),
    no_asisten: record => normalizeText_(record['Confirmacion asistencia']).includes('no'),
    pendientes: record => !String(record['Confirmacion asistencia'] || '').trim()
  };
  const names = {
    hospedaje: 'hospedaje',
    confirmados: 'confirmados',
    no_asisten: 'no_asisten',
    pendientes: 'pendientes'
  };
  const filter = filters[reportType] || (() => true);
  const rows = records.filter(filter);
  const csvHeaders = [
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
  const lines = [csvHeaders.join(',')];

  rows.forEach(record => {
    const row = csvHeaders.map(header => {
      if (header === 'WhatsApp') return csvEscape_(createWhatsappUrl_(record['Telefono']));
      return csvEscape_(record[header]);
    });
    lines.push(row.join(','));
  });

  const name = names[reportType] || 'registros';
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmm');

  return {
    csv: lines.join('\n'),
    filename: `rally-2026-${name}-${date}.csv`,
    caption: `Rally por la Luz 2026: ${name} (${rows.length})`
  };
}

function getRegistrationRecords_() {
  const sheet = getSheet_();
  ensureHeaders_(sheet);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const headers = getHeaders_(sheet);
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  return values.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = repairMojibakeText_(row[index]);
    });
    return record;
  });
}

function createWhatsappUrl_(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return '';

  const localNumber = digits.slice(-10);
  return `https://wa.me/52${localNumber}`;
}

function isYesValue_(value) {
  return normalizeText_(value) === 'si';
}

function normalizeText_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function repairMojibakeText_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' || typeof value !== 'string') {
    return value;
  }

  if (!hasMojibakeMarker_(value)) return value;

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

function hasMojibakeMarker_(value) {
  return String(value || '').split('').some(char => {
    const code = char.charCodeAt(0);
    return code === 0x00c3 || code === 0x00c2 || code === 0x00e2;
  });
}

function csvEscape_(value) {
  let text = value;

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    text = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  }

  text = String(repairMojibakeText_(text) || '');
  return `"${text.replace(/"/g, '""')}"`;
}

function getTelegramConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    token: props.getProperty('TELEGRAM_BOT_TOKEN') || '',
    chatId: props.getProperty('TELEGRAM_CHAT_ID') || ''
  };
}

function markParticipantEmailStatus_(sheet, rowNumber, status, errorMessage) {
  if (!sheet || !rowNumber) return;

  ensureHeaders_(sheet);

  const headers = getHeaders_(sheet);
  const idxStatus = headers.indexOf('Correo confirmacion');
  const idxError = headers.indexOf('Error correo confirmacion');

  if (idxStatus >= 0) {
    sheet.getRange(rowNumber, idxStatus + 1).setValue(status);
  }

  if (idxError >= 0) {
    sheet.getRange(rowNumber, idxError + 1).setValue(errorMessage || '');
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
  ].map(([label, value]) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #d8e2ea;color:#657486;font-weight:800;">${escapeEmailHtml_(label)}</td>
      <td style="padding:12px;border-bottom:1px solid #d8e2ea;color:#203040;">${escapeEmailHtml_(value || '')}</td>
    </tr>
  `).join('');

  return createEmailShell2026_({
    title: 'Nuevo registro',
    intro: 'Se recibió un nuevo registro para el Rally por la Luz 2026.',
    content: `
      <table style="width:100%;border-collapse:collapse;border:1px solid #d8e2ea;border-radius:8px;overflow:hidden;">
        ${rows}
      </table>
    `,
    buttons: []
  });
}

function createParticipantHtml_(data) {
  const nombre = escapeEmailHtml_(data.nombre || '');

  return createEmailShell2026_({
    title: 'Registro recibido',
    intro: `Hola ${nombre}, tu registro fue recibido correctamente.`,
    content: `
      <div style="display:grid;gap:12px;margin:18px 0;">
        <div style="padding:14px;border:1px solid #d8e2ea;border-radius:8px;background:#ffffff;">
          <div style="color:#657486;font-size:13px;font-weight:800;text-transform:uppercase;">Fechas</div>
          <div style="margin-top:6px;color:#10243f;font-size:16px;font-weight:850;">21 y 22 de septiembre</div>
        </div>

        <div style="padding:14px;border:1px solid #d8e2ea;border-radius:8px;background:#ffffff;">
          <div style="color:#657486;font-size:13px;font-weight:800;text-transform:uppercase;">Sede</div>
          <div style="margin-top:6px;color:#10243f;font-size:16px;font-weight:850;">INAOE, Tonantzintla, Puebla</div>
        </div>

        <div style="padding:14px;border:1px solid #d8e2ea;border-radius:8px;background:#ffffff;">
          <div style="color:#657486;font-size:13px;font-weight:800;text-transform:uppercase;">Modalidad</div>
          <div style="margin-top:6px;color:#10243f;font-size:16px;font-weight:850;">Presencial</div>
        </div>
      </div>

      <div style="margin:18px 0;padding:14px;border-left:4px solid #f6c85f;border-radius:8px;background:#fff8e5;color:#765a12;font-size:14px;line-height:1.5;">
        Más adelante te enviaremos información adicional sobre la logística del evento.
      </div>

      <p style="margin:18px 0 0;color:#203040;font-size:15px;line-height:1.6;">
        Para cualquier duda puedes responder este correo o escribir a <strong>${REPLY_TO_EMAIL}</strong>.
      </p>
    `,
    buttons: [
      {
        text: 'Ver sitio del evento',
        url: EVENT_URL,
        primary: true
      },
      {
        text: 'Agregar a Google Calendar',
        url: GOOGLE_CALENDAR_URL,
        primary: false
      }
    ]
  });
}

function createEmailShell2026_({ title, intro, content, buttons }) {
  const buttonsHtml = (buttons || []).length
    ? `
      <div style="text-align:center;margin:26px 0 8px;">
        ${buttons.map(button => {
          const style = button.primary
            ? 'display:inline-block;background:linear-gradient(90deg,#00a99d,#10243f);border-radius:8px;padding:14px 20px;color:#ffffff;text-decoration:none;font-weight:850;font-size:15px;box-shadow:0 14px 28px rgba(0,169,157,.25);margin:6px;'
            : 'display:inline-block;background:#ffffff;border:1px solid #10243f;border-radius:8px;padding:14px 20px;color:#10243f;text-decoration:none;font-weight:850;font-size:15px;margin:6px;';
          return `<a href="${button.url}" target="_blank" style="${style}">${escapeEmailHtml_(button.text)}</a>`;
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
            ${escapeEmailHtml_(title)}
          </h1>

          <p style="margin:0;color:rgba(255,255,255,.84);font-size:16px;line-height:1.55;">
            Rally por la Luz 2026
          </p>
        </div>

        <div style="padding:34px;">
          <p style="margin:0 0 20px;color:#203040;font-size:16px;line-height:1.6;">
            ${intro}
          </p>

          ${content}

          ${buttonsHtml}

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
