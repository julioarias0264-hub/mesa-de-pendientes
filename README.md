# Mesa de trabajo · Julio

MVP local para recibir y estructurar solicitudes, bugs, pendientes y seguimientos de Julio. Odoo aparece como una categoría más, junto con clientes, administración, automatización, documentos y operación.

## Ejecutar

Desde este directorio:

```bash
python3 -m http.server 4173
```

Después abre <http://127.0.0.1:4173>.

La app se sirve como sitio estático y carga el cliente de Supabase desde CDN. El perfil visual y la caché local se guardan en `localStorage`; cuando la cuenta de Supabase está conectada, la cola se sincroniza en la nube.

## Activar Supabase

1. Abre `supabase-schema.sql` y ejecuta todo su contenido en **Supabase → SQL Editor**.
2. En **Authentication → Users**, crea el usuario que utilizará Julio para entrar a la mesa.
3. La mesa principal usa `index.html` y el formulario público para compartir es `solicitar.html`.

Desde **Inicio → Configurar formulario público** puedes editar las áreas, sus detalles dependientes, tipos y prioridades. Por ejemplo, al elegir `Odoo` el formulario puede mostrar `PDV`, `Inventario`, `Ventas` y `Compras`.

La clave `publishable` está en `supabase-config.js` y es apta para el navegador. Nunca coloques una clave `secret` o `service_role` en este repositorio.

## Perfiles y personalización

La primera vez puedes crear un perfil local con nombre, iniciales y color. Desde el avatar puedes cambiar esos datos, crear o quitar categorías y cambiar de perfil. Cada perfil conserva sus propios tickets y preferencias en el navegador.

El perfil visual sigue siendo personalizable por navegador. La cuenta de Supabase protege la lectura y edición de los tickets; el formulario público sólo puede crear solicitudes nuevas.

## Pantallas principales

- **Inicio:** bienvenida, resumen de la mesa, accesos rápidos y categorías.
- **Recepción:** captura y edición detallada de tickets.
- **En curso:** solicitudes que requieren revisión o un siguiente paso.
- **Historial:** tickets cerrados y contexto de referencia.
