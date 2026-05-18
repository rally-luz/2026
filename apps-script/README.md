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

Antes de enviar algo real, ejecuta una prueba con pocos correos o revisa el limite diario de Gmail de la cuenta.

## Actualizar cambios

Cada vez que cambies `Code.gs` o `Envios.gs`, copia el contenido actualizado en Apps Script y crea una nueva version del despliegue del Web App para que el sitio use el codigo mas reciente.
