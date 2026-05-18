# Apps Script para registros

Este script recibe el formulario del sitio, guarda cada registro en Google Sheets y manda una notificacion por correo.

## Instalacion

1. Crea un Google Sheet para los registros.
2. En el Sheet, abre Extensiones > Apps Script.
3. Pega el contenido de `Code.gs`.
4. Guarda el proyecto.
5. Despliega como Web App.
6. En permisos de acceso, usa una opcion que permita recibir envios publicos del formulario.
7. Copia la URL del Web App y pegala en el `action` del formulario.

Cuando tengas la URL del Web App, reemplaza en `formulario_rally_por_la_luz_2026.html`:

```html
action="https://formsubmit.co/anyel.garcia@inaoe.mx"
```

por:

```html
action="URL_DEL_WEB_APP"
```
