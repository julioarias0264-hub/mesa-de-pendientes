# Mesa de trabajo de Julio

Aplicación local en español para recibir solicitudes, organizar una cola de tickets, asignar prioridades y estados, y consultar el historial. Express sirve la interfaz y la API; los tickets y la configuración del formulario se guardan en archivos JSON locales. No requiere base de datos ni servicios externos.

## Requisitos

- Node.js 20 o posterior
- npm

## Instalación y configuración

```bash
npm install
cp .env.example .env
```

Edita `.env` y define `ADMIN_PASSWORD` (al menos 12 caracteres) y `SESSION_SECRET` (al menos 32 caracteres). Puedes cambiar el puerto con `PORT` y la carpeta de datos JSON con `DATA_DIR`. El valor predeterminado de `DATA_DIR` es `./data`; esa carpeta está excluida de Git.

## Ejecutar

```bash
npm start
```

Abre [http://localhost:3000](http://localhost:3000) e inicia sesión con `ADMIN_PASSWORD`. El formulario para nuevas solicitudes está en [http://localhost:3000/solicitar.html](http://localhost:3000/solicitar.html). La sesión administrativa dura ocho horas.

## Recorrido de demo

1. Entra en la mesa con la contraseña de administrador.
2. Abre el formulario público en otra pestaña y envía una solicitud completa.
3. Vuelve a la mesa y pulsa actualizar para ver el nuevo ticket.
4. Cambia su prioridad o estado, guárdalo y revisa las vistas de cola e historial.
5. Reinicia el servidor con `Ctrl+C` y `npm start`; el ticket permanecerá en `data/tickets.json`.
6. Prueba un envío sin asunto, descripción o criterio de aceptación: el servidor lo rechazará y mostrará el error.

Los campos del formulario y la apariencia se editan desde la mesa y se guardan en `data/form-config.json`. Las preferencias de perfil de interfaz permanecen en `localStorage`; los tickets no se guardan allí.

## API principal

- `POST /api/public/tickets`: crear solicitud pública (sin sesión).
- `GET /api/tickets`, `POST /api/tickets`, `PATCH /api/tickets/:id`: cola y gestión protegidas por sesión administrativa.
- `GET /api/form-config`: leer opciones públicas del formulario.
- `PUT /api/form-config`: actualizar opciones (requiere sesión).
- `GET`, `POST`, `DELETE /api/session`: consultar, iniciar y cerrar sesión.

## Publicación

Esta versión necesita un proceso Node.js y almacenamiento persistente para `DATA_DIR`. GitHub Pages solo publica archivos estáticos y no ejecuta el backend; el workflow anterior de Pages se retiró. La demo de entrega se ejecuta en `localhost`.
