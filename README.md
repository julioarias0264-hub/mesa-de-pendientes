# Mesa de pendientes

Aplicación local en español para recibir solicitudes, organizar pendientes y consultar su historial. Express sirve la interfaz y la API; los tickets y la configuración se guardan en archivos JSON dentro de `data/`.

## Requisitos

- Node.js 20 o posterior
- npm

## Instalar y ejecutar

Desde una terminal, clona, instala y ejecuta el proyecto con este comando:

```bash
git clone https://github.com/julioarias0264-hub/mesa-de-trabajo-julio.git && cd mesa-de-trabajo-julio && npm install && npm start
```

Abre [http://localhost:3000](http://localhost:3000) y elige el nombre que quieres usar en tu mesa. Cada persona configura su propio perfil en su navegador; no se requiere contraseña ni archivo `.env`. El formulario para recibir solicitudes está en [http://localhost:3000/solicitar.html](http://localhost:3000/solicitar.html).

La cola y su configuración se guardan en `data/` y permanecen disponibles al reiniciar el servidor. Para detenerlo, pulsa `Ctrl+C` en la terminal.

## Recorrido de demo

1. Abre la mesa en `http://localhost:3000`.
2. Abre el formulario en otra pestaña y envía una solicitud completa.
3. Vuelve a la mesa y pulsa actualizar para ver el nuevo ticket.
4. Cambia su prioridad o estado, guárdalo y revisa las vistas de cola e historial.
5. Reinicia el servidor; el ticket seguirá guardado en `data/tickets.json`.
6. Prueba un envío sin asunto, descripción o criterio de aceptación: el servidor lo rechazará y mostrará el error.

Los campos del formulario y su apariencia se editan desde la mesa y se guardan en `data/form-config.json`. Las preferencias de perfil permanecen en el navegador.

## API principal

- `POST /api/public/tickets`: crear una solicitud desde el formulario.
- `GET /api/tickets`, `POST /api/tickets`, `PATCH /api/tickets/:id`: consultar y gestionar tickets.
- `GET /api/form-config`, `PUT /api/form-config`: consultar y cambiar las opciones del formulario.
