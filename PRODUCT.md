# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: plain HTML, CSS and JavaScript so the local MVP can run without a build step; Playwright is available for browser verification.

## Users

Julio, que recibe solicitudes, pendientes y encargos de distintas áreas y necesita convertirlos rápidamente en tickets claros y verificables.

## Product Purpose

Recibir y estructurar tickets de trabajo desde una sola pantalla, capturando el contexto mínimo para poder atenderlos sin perseguir información por mensajes o notas sueltas. El éxito inicial es que una solicitud nueva quede clasificada, priorizada y con criterios de aceptación accionables.

## Positioning

Un buzón personal de trabajo que transforma lenguaje cotidiano en una ficha con contexto, alcance y condiciones de aceptación desde el momento de la recepción. Puede recibir trabajo de Odoo, clientes, administración, automatización, documentos u otras áreas.

## Operating Context

Julio trabaja con sistemas, clientes, documentos, automatizaciones, desarrollo y pendientes operativos. Necesita distinguir solicitudes nuevas, aclaraciones, trabajo en curso, entregables listos y bloqueos. La primera versión abre vacía y opera localmente con persistencia en el navegador.

## Capabilities and Constraints

- Crear tickets con título, descripción, área, tipo, prioridad, solicitante, herramienta relacionada y criterios de aceptación.
- Mostrar la cola de tickets con estados y filtros operativos.
- Editar y revisar el detalle de un ticket sin perder el contexto de recepción.
- La primera versión no modifica sistemas externos ni envía mensajes externos.
- La primera versión abre sin tickets precargados y usa persistencia local del navegador; la integración con Google Sheets, repositorios, correo y automatizaciones queda abierta para una siguiente fase.

## Evidence on Hand

- La hoja de pendientes compartida por el usuario contiene solicitudes reales de POS, cotizaciones, vales, descuentos, inventario, compras y reportes.
- No se proporcionó un logotipo o sistema visual obligatorio para esta app.

## Product Principles

- Capturar contexto antes de repartir trabajo.
- Hacer visible qué falta para poder desarrollar o probar.
- Mantener el flujo operativo escaneable y rápido.
- No declarar un ticket listo sin criterios verificables.

## Accessibility & Inclusion

La interfaz debe funcionar con teclado, mantener contraste legible, ofrecer etiquetas visibles y adaptarse a pantallas pequeñas.
