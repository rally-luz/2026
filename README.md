# Rally por la Luz 2026

Manual para replicar, publicar y operar el sitio de registro del Rally por la Luz.

Este repositorio contiene:

- Sitio publico en GitHub Pages.
- Formulario de registro.
- Pagina de gracias.
- Portada abierta y cerrada.
- Scripts para abrir/cerrar registro.
- Google Apps Script para guardar registros en Sheets y enviar correos.
- Google Apps Script para avisos, recordatorios y confirmacion de asistencia.

## 1. Requisitos

- Git instalado.
- Acceso al repositorio de GitHub.
- Acceso a una cuenta de Google con Google Sheets, Apps Script y Gmail.
- Permisos para activar GitHub Pages.

En Windows, si `git` no esta en el PATH, se puede usar:

```powershell
& 'C:\Program Files\Git\cmd\git.exe' status
```

## 2. Crear una nueva edicion desde la anterior

Ejemplo: crear `2026` a partir de `2025`.

```powershell
cd C:\Users\eagar\Downloads
git clone https://github.com/rally-luz/2025.git
Rename-Item 2025 2026
cd 2026
Remove-Item .git -Recurse -Force
git init
git add .
git commit -m "Version inicial 2026"
git branch -M main
git remote add origin https://github.com/rally-luz/2026.git
git push -u origin main
```

Si el repositorio remoto ya tiene un README inicial, el primer push puede requerir:

```powershell
git push --force-with-lease -u origin main
```

Usalo solo cuando estes seguro de que quieres reemplazar el contenido inicial del repo remoto.

## 3. Archivos principales

```text
index.html
```

Pagina publicada actual. GitHub Pages siempre carga este archivo como inicio.

```text
index_abierto.html
```

Plantilla de portada con registro abierto.

```text
index_cerrado.html
```

Plantilla de portada con registro cerrado.

```text
formulario_rally_por_la_luz_2026.html
```

Formulario publico. Envia datos al Web App de Apps Script.

```text
gracias.html
```

Pantalla final despues de un registro exitoso.

```text
asistencia-si.html
asistencia-no.html
```

Paginas usadas para confirmar asistencia desde enlaces enviados por correo, si se usa ese flujo.

```text
apps-script/Code.gs
```

Recibe registros, escribe en Google Sheets, envia correo al organizador, envia correo de confirmacion al participante y procesa respuestas de asistencia.

```text
apps-script/Envios.gs
```

Funciones manuales para enviar avisos, recordatorios y solicitudes de confirmacion de asistencia.

## 4. Activar GitHub Pages

En GitHub:

1. Abrir el repositorio, por ejemplo `rally-luz/2026`.
2. Entrar a `Settings`.
3. Entrar a `Pages`.
4. En `Build and deployment`, seleccionar:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Guardar.

La URL esperada queda asi:

```text
https://rally-luz.github.io/2026/
```

Puede tardar unos minutos en publicar.

## 5. Dominio personalizado opcional

Si se quiere usar un dominio del INAOE/CCC, hay dos escenarios.

Subdominio:

```text
rally-luz.inaoep.mx
```

En este caso, el administrador del dominio debe apuntarlo a GitHub Pages y despues se configura en `Settings > Pages > Custom domain`.

Ruta dentro de otro sitio:

```text
https://ccc.inaoep.mx/~seminario-biomedicas/registro-rally/
```

Esto no se configura en GitHub Pages como custom domain. En ese caso, el administrador del sitio debe poner un enlace o redireccion hacia:

```text
https://rally-luz.github.io/2026/
```

## 6. Configurar Google Sheets

1. Crear un Google Sheet para registros.
2. Nombrar una pestana como:

```text
Registros
```

3. No es necesario crear encabezados manualmente. `Code.gs` puede crearlos.
4. Si ya existen datos, asegurarse de tener columnas compatibles:

```text
Fecha
Nombre(s)
Apellidos
Correo
Telefono
Estado
Institucion
Hospedaje
Token
Confirmacion asistencia
Fecha confirmacion
Correo confirmacion
Error correo confirmacion
```

## 7. Configurar Apps Script

Desde el Google Sheet:

1. Ir a `Extensiones > Apps Script`.
2. Crear o usar el archivo `Code.gs`.
3. Pegar el contenido de:

```text
apps-script/Code.gs
```

4. Crear otro archivo llamado `Envios.gs`.
5. Pegar el contenido de:

```text
apps-script/Envios.gs
```

6. Guardar el proyecto.

## 8. Desplegar Apps Script como Web App

En Apps Script:

1. Click en `Deploy`.
2. Click en `New deployment`.
3. Tipo: `Web app`.
4. Configurar:
   - Execute as: `Me`
   - Who has access: `Anyone` o `Anyone with the link`
5. Deploy.
6. Autorizar permisos.
7. Copiar la URL que termina en `/exec`.

Ejemplo:

```text
https://script.google.com/macros/s/AKfy.../exec
```

## 9. Conectar el formulario al Web App

En `formulario_rally_por_la_luz_2026.html`, buscar:

```html
<form id="registro-form" action="URL_DEL_WEB_APP"
```

Reemplazar `URL_DEL_WEB_APP` por la URL `/exec` de Apps Script.

Actualmente el formulario usa una URL de Apps Script ya configurada. Si se crea una nueva hoja o un nuevo despliegue, hay que actualizar esa URL.

## 10. Actualizar Apps Script despues de cambios

Cada vez que se modifiquen `Code.gs` o `Envios.gs` en este repo:

1. Copiar el contenido actualizado al editor de Apps Script.
2. Guardar.
3. Ir a `Deploy > Manage deployments`.
4. Editar el despliegue.
5. Seleccionar `New version`.
6. Deploy.

Si no se crea nueva version, el formulario puede seguir usando codigo viejo.

## 11. Que hace `Code.gs`

`Code.gs` corre automaticamente cuando alguien usa el formulario.

No necesita trigger para el registro.

Funciones importantes:

```js
doPost(e)
```

Se ejecuta cuando el formulario envia datos. Hace:

- Guarda el registro en la pestana `Registros`.
- Crea token unico.
- Envia correo al organizador.
- Envia correo de confirmacion al participante.
- Marca estado del correo en la hoja.

```js
doGet(e)
```

Se ejecuta cuando alguien abre enlaces especiales, por ejemplo para confirmar asistencia.

```js
sendParticipantConfirmation_(data, sheet, rowNumber)
```

Manda el correo automatico de "Registro recibido" al participante.

Si ese correo no llega, revisar en Sheets:

```text
Correo confirmacion
Error correo confirmacion
```

## 12. Que hace `Envios.gs`

`Envios.gs` se ejecuta manualmente desde Apps Script. No manda todo junto: cada funcion es independiente.

Este archivo sirve para comunicarse con participantes que ya estan registrados en la hoja `Registros`.

```js
enviarAvisoATodos()
```

Manda un aviso general editable.

Se usa cuando hay que comunicar cualquier informacion no programada, por ejemplo:

- Cambio de horario.
- Indicaciones de llegada.
- Aviso de documentos/materiales.
- Mensaje general del comite organizador.

Antes de ejecutarla, se edita dentro de la funcion:

- `subject`
- `textBody`
- `htmlBody`

```js
enviarRecordatorioATodos()
```

Manda un recordatorio general del evento.

Se usa para recordar datos principales:

- Sede.
- Fechas.
- Modalidad.
- Recomendaciones generales.
- Enlace al sitio del evento.

Normalmente se ejecuta dias antes del evento.

```js
enviarConfirmacionAsistenciaATodos()
```

Manda correos individuales para confirmar asistencia. Cada participante recibe enlaces/botones propios.

Esta funcion no usa BCC porque cada participante necesita enlaces personalizados.

El correo incluye botones como:

- `Si asistire`
- `No asistire`

Cuando la persona confirma, la respuesta queda registrada en Sheets.

Antes de enviar a todos, se recomienda probar con 1 o 2 correos.

Funciones internas importantes:

```js
enviarMasivo_({ subject, textBody, htmlBody })
```

Helper interno que manda correos por lotes usando BCC. Lo usan `enviarAvisoATodos()` y `enviarRecordatorioATodos()`.

```js
cargarParticipantes_()
```

Lee la hoja `Registros`, busca la columna de correo, valida emails y elimina duplicados.

```js
cargarParticipantesConToken_()
```

Lee participantes con correo valido y token. Si alguien no tiene token, genera uno y lo guarda en la hoja.

```js
crearHtmlAviso2026_(...)
```

Construye el correo HTML con el estilo visual 2026.

```js
crearHtmlConfirmacionAsistencia_(participante, yesUrl, noUrl)
```

Construye el correo HTML de confirmacion de asistencia con botones personalizados.

```js
findHeaderIndex_(header, names)
normalizeHeader_(value)
```

Permiten encontrar columnas aunque el encabezado tenga mayusculas, minusculas o acentos distintos.

```js
isValidEmail_(value)
```

Valida que el correo tenga formato basico correcto.

```js
escapeHtml_(value)
```

Escapa texto antes de insertarlo en HTML para evitar romper el correo si algun nombre contiene caracteres especiales.

## 13. Triggers

No se necesita trigger para:

- Recibir registros.
- Guardar en Sheets.
- Enviar correo automatico de registro.
- Procesar clics de asistencia.

Eso lo hacen `doPost(e)` y `doGet(e)` automaticamente desde el Web App.

Solo usar triggers si se quiere programar algo automatico, por ejemplo:

- Mandar recordatorio en una fecha y hora.
- Mandar confirmacion de asistencia automaticamente una semana antes.

Si los avisos se mandan manualmente desde Apps Script, no hace falta trigger.

## 14. Abrir y cerrar registro

El sitio publicado siempre es:

```text
index.html
```

Para cambiar estado con doble click en Windows:

```text
cambiar_registro.bat
```

Ese archivo alterna automaticamente:

- Si esta abierto, copia `index_cerrado.html` a `index.html`.
- Si esta cerrado, copia `index_abierto.html` a `index.html`.
- Hace commit y push.

Tambien existen comandos manuales:

```powershell
powershell -ExecutionPolicy Bypass -File .\registro.ps1 abierto -Publicar
powershell -ExecutionPolicy Bypass -File .\registro.ps1 cerrado -Publicar
```

En WSL/Linux:

```bash
./registro.sh abierto publicar
./registro.sh cerrado publicar
```

## 15. Publicar cambios del sitio

Flujo normal:

```powershell
git status
git add .
git commit -m "Describe el cambio"
git push
```

Si hay cambios de otra persona:

```powershell
git pull --rebase origin main
git push
```

No usar `git reset --hard` a menos que se sepa exactamente que se quiere borrar.

## 16. Probar el formulario

1. Abrir:

```text
https://rally-luz.github.io/2026/
```

2. Entrar a `Inscribirme`.
3. Llenar datos de prueba.
4. Enviar.
5. Verificar:
   - Nueva fila en Sheets.
   - Correo al organizador.
   - Correo al participante.
   - Columnas `Correo confirmacion` y `Error correo confirmacion`.

Si solo llega correo al organizador pero no al participante:

1. Confirmar que Apps Script tenga el `Code.gs` actualizado.
2. Crear nueva version del despliegue.
3. Revisar spam/promociones del participante.
4. Revisar `Error correo confirmacion` en Sheets.

## 17. Probar correos masivos

Antes de enviar a todos:

1. Hacer copia de la hoja o filtrar a pocos correos.
2. Ejecutar una funcion de prueba desde Apps Script.
3. Revisar Gmail enviados.
4. Revisar limites diarios de Gmail.

Funciones:

```js
enviarAvisoATodos()
enviarRecordatorioATodos()
enviarConfirmacionAsistenciaATodos()
```

## 18. Cambiar datos para una nueva edicion

Para crear otra edicion, por ejemplo 2027:

1. Clonar repo anterior.
2. Renombrar carpeta y repo.
3. Reemplazar textos `2026` por `2027`.
4. Renombrar formulario si se desea:

```text
formulario_rally_por_la_luz_2027.html
```

5. Crear nuevo Google Sheet.
6. Crear o copiar Apps Script.
7. Desplegar nuevo Web App.
8. Actualizar `action` del formulario.
9. Activar GitHub Pages.
10. Probar registro.

## 19. Correos y contacto

Correo de contacto publico:

```text
rallyxlaluz@inaoep.mx
```

Correo organizador que recibe notificaciones desde Apps Script:

```text
anyel.garcia@inaoe.mx
```

Si cambia alguno, actualizar:

- `formulario_rally_por_la_luz_2026.html`
- `apps-script/Code.gs`
- `apps-script/Envios.gs`
- `index.html`
- `index_abierto.html`
- `index_cerrado.html`
- `gracias.html`

## 20. Notas importantes

- No poner contrasenas ni tokens privados en el repo.
- La URL `/exec` de Apps Script puede estar en el HTML.
- Si se cambia Apps Script, siempre desplegar nueva version.
- Si se cambia solo HTML/CSS, basta con `git push`.
- GitHub Pages puede tardar unos minutos en reflejar cambios.
- Apps Script/Gmail tiene limites de envio diarios.
