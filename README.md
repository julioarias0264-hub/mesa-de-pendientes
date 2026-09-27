# Mesa de trabajo · Julio

MVP local para recibir y estructurar solicitudes, bugs, pendientes y seguimientos de Julio. Odoo aparece como una categoría más, junto con clientes, administración, automatización, documentos y operación.

## Ejecutar

Desde este directorio:

```bash
python3 -m http.server 4173
```

Después abre <http://127.0.0.1:4173>.

La app no necesita build ni dependencias adicionales. Abre con la cola vacía; los tickets nuevos se guardan en `localStorage` del navegador.

## Perfiles y personalización

La primera vez puedes crear un perfil local con nombre, iniciales y color. Desde el avatar puedes cambiar esos datos, crear o quitar categorías y cambiar de perfil. Cada perfil conserva sus propios tickets y preferencias en el navegador.

Este acceso es local para el MVP de GitHub Pages: no es una autenticación con contraseña ni sincroniza información entre dispositivos. Para eso habría que conectar un backend o un proveedor de identidad.
