# Apps Script para registros

Este script recibe el formulario del sitio, guarda cada registro en Google Sheets y manda una notificacion por correo.
Tambien incluye funciones para enviar recordatorios o avisos masivos a los correos registrados.

## Instalacion

1. Crea un Google Sheet para los registros.
2. En el Sheet, abre Extensiones > Apps Script.
3. Pega el contenido de `Code.gs`.
4. Agrega otro archivo en Apps Script llamado `Envios.gs` y pega su contenido.
5. Guarda el proyecto.
6. Despliega como Web App.
7. En permisos de acceso, usa una opcion que permita recibir envios publicos del formulario.
8. Copia la URL del Web App y pegala en el `action` del formulario.

La URL configurada actualmente en `formulario_rally_por_la_luz_2026.html` es:

```text
https://script.google.com/macros/s/AKfycbzaGEFpN2IGYZ04T9NKQMknfuslO-0QrsAyGrmnu01vJIsr_fSiGD_KuxKr5VG4Rdax/exec
```

## Envios masivos

El archivo `Envios.gs` lee la pestana `Registros`, toma la columna `Correo`, valida y deduplica emails, y envia por BCC en lotes.

Funciones disponibles:

- `enviarRecordatorioATodos()`: plantilla de recordatorio 2026.
- `enviarAvisoATodos()`: plantilla base para editar y mandar un aviso.
- `enviarConfirmacionAsistenciaATodos()`: envia correos individuales con botones para confirmar si asistiran o no.

Antes de enviar algo real, ejecuta una prueba con pocos correos o revisa el limite diario de Gmail de la cuenta.

Las respuestas de asistencia se guardan en las columnas:

- `Confirmacion asistencia`
- `Fecha confirmacion`

El envio del correo automatico al participante se registra en:

- `Correo confirmacion`
- `Error correo confirmacion`

## Actualizar cambios

Cada vez que cambies `Code.gs` o `Envios.gs`, copia el contenido actualizado en Apps Script y crea una nueva version del despliegue del Web App para que el sitio use el codigo mas reciente.

## Alertas por Telegram

`Code.gs` puede mandar alertas internas a Telegram cuando:

- Se recibe un nuevo registro.
- Alguien confirma asistencia.
- Falla el registro.
- Falla el enlace de asistencia.
- No se puede enviar el correo de confirmacion al participante.

No guardes el token del bot directamente en GitHub. Configuralo en Apps Script:

1. Abre el proyecto de Apps Script.
2. Entra a `Project Settings`.
3. En `Script properties`, agrega:

```text
TELEGRAM_BOT_TOKEN
```

con el token del bot.

4. Agrega tambien:

```text
TELEGRAM_CHAT_ID
```

con el chat id donde deben llegar las alertas.

5. Guarda.
6. Ejecuta la funcion:

```js
probarTelegram()
```

Si todo esta bien, llegara un mensaje de prueba al chat configurado.

### Comandos de Telegram

Tambien puedes usar el bot para pedir reportes desde Telegram. Primero configura:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Para obtener el `TELEGRAM_CHAT_ID`:

1. Guarda solo `TELEGRAM_BOT_TOKEN`.
2. Escribe `/id` al bot.
3. Copia el numero que responde.
4. Guardalo como `TELEGRAM_CHAT_ID`.

Despues de desplegar el Web App, ejecuta una vez:

```js
configurarTelegramWebhook()
```

Con eso el bot escuchara comandos. Comandos disponibles:

- `/hospedaje`: envia un CSV con los registros que solicitaron hospedaje.
- `/confirmados`: envia un CSV con quienes confirmaron que si asistiran.
- `/no_asisten`: envia un CSV con quienes confirmaron que no asistiran.
- `/pendientes`: envia un CSV con registros sin confirmacion de asistencia.
- `/resumen`: muestra totales rapidos.
- `/ayuda`: muestra la lista de comandos.
- `/id`: muestra el chat id.

Los CSV incluyen una columna `WhatsApp`. El enlace se arma con los ultimos 10 digitos del telefono registrado y se le antepone `52`, para evitar duplicar lada cuando alguien escriba `52`, `+52`, espacios o guiones.

Si necesitas desactivar los comandos del bot, ejecuta:

```js
borrarTelegramWebhook()
```
