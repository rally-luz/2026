# Bot Telegram para reportes

Este bot corre en una PC/servidor propio y lee Google Sheets directamente. Apps Script sigue recibiendo registros, escribiendo en la hoja y enviando correos.

## Ventaja

Evita los problemas de webhook/polling dentro de Apps Script. El bot usa polling real desde Node.js y responde comandos desde la PC.

## Configuracion

Requiere Node.js 18 o superior.

1. Instala dependencias:

```powershell
npm.cmd install
```

2. Copia `.env.example` como `.env`.

3. Configura `.env`:

```text
TELEGRAM_BOT_TOKEN=token_de_botfather
TELEGRAM_ALLOWED_CHAT_ID=tu_chat_id
GOOGLE_SHEET_ID=id_de_la_sheet
GOOGLE_SHEET_NAME=Registros
GOOGLE_SERVICE_ACCOUNT_KEY=service-account.json
```

4. Crea una cuenta de servicio en Google Cloud y descarga su llave JSON.

5. Guarda la llave como:

```text
telegram-bot/service-account.json
```

6. En Google Sheets, comparte la hoja con el correo de la cuenta de servicio. Ese correo termina normalmente en:

```text
@*.iam.gserviceaccount.com
```

Permiso suficiente: lector.

7. Ejecuta el bot:

```powershell
npm.cmd start
```

En Windows tambien puedes abrir:

```text
iniciar_bot_telegram.bat
```

## Comandos

- `/ayuda`: muestra comandos disponibles.
- `/resumen`: muestra totales rapidos.
- `/hospedaje`: envia CSV de quienes solicitaron hospedaje.
- `/confirmados`: envia CSV de quienes confirmaron que si asistiran.
- `/no_asisten`: envia CSV de quienes confirmaron que no asistiran.
- `/pendientes`: envia CSV de registros sin confirmacion de asistencia.
- `/id`: muestra el chat id.

Los CSV incluyen columna `WhatsApp`. El enlace usa los ultimos 10 digitos del telefono y antepone `52`.

## Recomendacion

Si usas este bot externo, desactiva el polling de Telegram en Apps Script ejecutando:

```js
desinstalarTriggerTelegramPolling()
```

Tambien puedes borrar el webhook si quedo configurado:

```js
borrarTelegramWebhook()
```
