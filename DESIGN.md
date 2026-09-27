---
name: Mesa de tickets
description: Buzón local de trabajo convertido en una mesa de corte para recibir, ordenar y hacer avanzar tickets verificables.
colors:
  ink: "#0b0e0f"
  ink-soft: "#151a1b"
  ink-lift: "#202728"
  rail: "#101415"
  paper: "#f4f2eb"
  paper-soft: "#ebe9df"
  paper-deep: "#d9d8ce"
  cream: "#fffdf5"
  orange: "#f06a3c"
  orange-hot: "#ff8051"
  orange-ink: "#9c361b"
  muted: "#a9afaa"
  muted-dark: "#59625e"
  line: "rgba(244, 242, 235, .16)"
  line-dark: "rgba(11, 14, 15, .17)"
  danger: "#df544d"
  good: "#a9cf78"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(32px, 3.8vw, 52px)"
    fontWeight: 700
    lineHeight: ".96"
    letterSpacing: "-.065em"
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: "1"
    letterSpacing: "-.05em"
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "1.65"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "1.5"
  label-mono:
    fontFamily: "'DM Mono', monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: "1.4"
    letterSpacing: ".03em"
rounded:
  none: "0px"
  sm: "4px"
  md: "10px"
  pill: "999px"
  circle: "50%"
spacing:
  micro: "6px"
  xs: "8px"
  sm: "10px"
  md: "16px"
  lg: "22px"
  xl: "29px"
  2xl: "44px"
  3xl: "72px"
components:
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "41px"
  button-primary-hover:
    backgroundColor: "{colors.orange-hot}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "41px"
  filter-chip:
    backgroundColor: "transparent"
    textColor: "{colors.muted-dark}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  field-input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 11px"
    height: "39px"
  ticket-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "17px 6px 16px 12px"
  status-strip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "11px 13px"
    height: "46px"
  readiness:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    size: "35px"
  workbench:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
---

# Design System: Mesa de tickets

## Overview

**Creative North Star: "La mesa de corte del trabajo"**

El mundo visual es una mesa de edición / *film cutting bench* traducida a interfaz operativa: oscura, precisa y hecha de piezas que se pueden revisar antes de enviarse a la siguiente etapa. La cola de tickets funciona como una tira de película; el rail lateral es la espina de secuencia; el editor es la superficie clara donde una solicitud cotidiana se recorta, se etiqueta y se deja lista para circular. La dirección es **code-led**: la identidad nace de CSS explícito, estados visibles, líneas de montaje y tipografía de terminal, no de una capa decorativa separada.

La dirección visual está fijada por la **seed key `82ddc6fc`**. El contraste entre `--ink`, `--paper-soft` y `--cream` crea una mesa de trabajo en dos tonos: la navegación y el contexto viven en el lado oscuro; la cola y el formulario se abren como hojas de edición iluminadas. `--orange` es la marca de corte: aparece en acciones primarias, selección, focus, estados de avance y pequeños indicadores. El lenguaje debe seguir siendo rápido de escanear y suficientemente sobrio para el uso diario de Julio.

**Key Characteristics:**

- Mesa de corte code-led: cola + editor, no tablero genérico de tarjetas.
- Alto contraste tonal: tinta, papel y crema con naranja de señal.
- Metadatos en mono, títulos sans compactos y jerarquía editorial comprimida.
- Geometría de perforaciones, círculos, reglas y marcadores de secuencia.
- Profundidad contenida: una sombra ambiental y capas de superficie antes que efectos.

## Colors

La paleta es una mesa de montaje nocturna: neutros cálidos para el papel, negros verdosos para el chasis y un naranja de señal reservado para cortes, foco y avance. Los nombres y valores normativos viven en el frontmatter; aquí se documenta su uso.

### Primary

- **Naranja de corte** (`--orange`): acción primaria, selección activa, puntos de secuencia y estado de avance.
- **Naranja caliente** (`--orange-hot`): hover de acciones primarias y anillo de foco visible.
- **Naranja de tinta** (`--orange-ink`): etiquetas y acciones textuales sobre superficies claras.

### Neutral

- **Chasis tinta** (`--ink`): fondo global, texto sobre superficies claras y controles primarios.
- **Tinta suave** (`--ink-soft`): nivel oscuro intermedio para futuras superficies de navegación.
- **Tinta elevada** (`--ink-lift`): toast, avatar y superficies oscuras que necesitan separarse del fondo.
- **Rail de secuencia** (`--rail`): fondo dedicado del rail lateral y agujeros de estado.
- **Papel de cola** (`--paper-soft`): panel de pendientes y superficie de lectura operativa.
- **Papel principal** (`--paper`): texto claro, regla de film y base clara del workbench.
- **Papel profundo** (`--paper-deep`): anillos incompletos, divisores sutiles y marcas de baja intensidad.
- **Crema de editor** (`--cream`): superficie de edición y foco de inputs.
- **Texto muted** (`--muted`): navegación y contexto sobre el chasis oscuro.
- **Texto muted oscuro** (`--muted-dark`): metadatos y etiquetas sobre papel.
- **Regla oscura** (`--line`): bordes sobre fondos oscuros.
- **Regla clara** (`--line-dark`): bordes y separadores sobre fondos claros.

### Estado

- **Correcto / local** (`--good`): guardado local, entorno local y prioridad baja.
- **Riesgo / error** (`--danger`): prioridad alta y mensajes de error.
- **Activo**: naranja para el punto y la etiqueta; el texto de estado siempre acompaña al color.
- **Deshabilitado**: el componente conserva su estructura y baja a `opacity: .62`; no se comunica sólo con color.

**The One Voice Rule.** El naranja es una marca de edición, no un relleno ambiental: úsalo para acción, foco, selección o estado; no conviertas toda la mesa en naranja.

## Typography

**Display Font:** stack sans local `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.

**Body Font:** el mismo stack sans local para lectura, formularios y botones.

**Label/Mono Font:** `'DM Mono', monospace` como primera opción local para IDs, fechas, estados y etiquetas de operación.

**Character:** La sans compacta hace que la mesa se sienta utilitaria y contemporánea; el mono introduce el pulso de una consola de edición para que los IDs, fechas y estados se lean como información de corte. Manrope/DM Mono no se cargan desde red: la implementación usa stacks locales. En concreto, el código actual no declara `@font-face`, `@import` ni una dependencia remota; el cuerpo cae en el stack sans del sistema y las etiquetas piden `DM Mono` con fallback `monospace`.

### Hierarchy

- **Display** (700, `clamp(32px, 3.8vw, 52px)`, line-height `.96`, letter-spacing `-.065em`): el título de la superficie de recepción.
- **Headline** (700, `20px`, line-height `1`, letter-spacing `-.05em`): encabezados de la cola y del editor.
- **Title** (400, `13px`, line-height `1.65`): explicación de la página, con un ancho de lectura de `56ch`.
- **Body** (400, `12px`, line-height `1.5`): títulos de tickets, campos, mensajes y controles compactos.
- **Label** (500, `11px`, line-height `1.4`, letter-spacing `.03em`): microcopy de contexto, IDs, metadatos y estados; se combina con mono y, cuando aplica, con mayúsculas.

**The Mono Metadata Rule.** Reserva el mono para información de sistema —IDs, fechas, estados, conteos, hints y labels— y deja que los títulos y la explicación respiren en sans.

## Layout

La composición base es una mesa de dos zonas: un topbar sticky de `74px`, un rail de secuencia de `245px` y un main centrado con `max-width: 1640px`. El main usa `44px` arriba, `clamp(26px, 5vw, 72px)` en horizontal y `72px` abajo. El workbench tiene dos columnas `minmax(320px, .85fr)` y `minmax(500px, 1.4fr)`, con una altura mínima de `690px`: la cola mira a la izquierda y el intake editor domina a la derecha.

La cola es deliberadamente escaneable: heading, búsqueda, filtros rápidos, una regla de film de `15px` y una lista de filas separadas por líneas. El formulario usa una rejilla de dos columnas con `19px` de separación vertical y `18px` horizontal; asunto y descripción ocupan las dos columnas. El ritmo recurrente del código es `6 / 8 / 10 / 16 / 22 / 29 / 44 / 72px`, con campos de `39px`, botones de `41px` y etiquetas de `11px`.

Responsive behavior is structural, not cosmetic:

- En `max-width: 1180px`, el rail baja a `210px`, el topbar reduce sus laterales a `24px`, el main a `30px` y el workbench conserva dos columnas más compactas.
- En `max-width: 930px`, el rail se convierte en una franja horizontal con overflow, desaparecen su spine/resumen/footer, la mesa pasa a una columna y la cola limita su lista a `365px` con scroll.
- En `max-width: 620px`, el topbar envuelve la navegación y la vuelve desplazable, el main usa `15px`, el título baja a `36px`, el formulario pasa a una columna, el status strip se apila y las acciones ocupan todo el ancho.
- La base mantiene `min-width: 320px`; las áreas desplazables tienen hint visible cuando la lista continúa.

**The Bench Flow Rule.** Conserva la lectura izquierda → derecha en escritorio y arriba → abajo en móvil: descubrir pendientes, abrir contexto, editar ficha, confirmar criterios.

## Elevation & Depth

El sistema es principalmente tonal y lineal. `--paper-soft` separa la cola de `--cream` sin cardificar cada bloque; las reglas de un pixel hacen visible la estructura de edición. La única elevación ambiental reutilizada es `--shadow` sobre el workbench y el toast, con suficiente difusión para separarlos del chasis sin parecer un panel flotante. El estado se expresa primero con color, borde, regla o posición; no con una colección de sombras.

### Shadow Vocabulary

- **Workbench / toast ambient** (`--shadow`, `0 18px 48px rgba(0, 0, 0, .18)`): separación suave de la mesa completa y de avisos temporales.
- **Focus ring** (`0 0 0 2px` con naranja translúcido): halo corto de interacción en búsqueda y campos; la outline global sigue siendo la garantía de teclado.
- **Marker halo** (`0 0 0 3px` con opacidad baja): sólo para comunicar prioridad alta, estado local o selección de puntos.

**The Flat-By-Default Rule.** Las superficies descansan planas; la profundidad pertenece al workbench, al toast o a un indicador de estado, no a cada fila o campo.

## Shapes

La forma es de banco de corte: bordes nítidos, cajas rectangulares y pequeños detalles circulares que recuerdan perforaciones de película. Los inputs y textareas tienen radio `0`; los botones usan una curva mínima de `4px`; los filtros usan píldora `999px`; avatares, dots, anillos y puntos de ticket son circulares (`50%`). Las líneas son parte del material: se prefieren bordes finos y divisores a contenedores con radios grandes.

El film rule combina barras de `27px × 5px`, agujeros de `7px` y dos reglas horizontales. El marcador seleccionado de una fila es una barra naranja lateral con remate redondeado parcial, no un card outline. Esta geometría debe sobrevivir a cualquier nueva vista para que el producto siga pareciendo una mesa de edición y no un dashboard genérico.

## Components

### Buttons

- **Shape:** rectángulo compacto de `4px`, altura mínima `41px`, padding horizontal `16px`, icono inline de `15px`.
- **Primary:** naranja de corte con texto tinta; se usa para acciones que crean o guardan. En hover pasa a naranja caliente y eleva `1px`.
- **Hover / Focus:** todas las acciones admiten hover visible; el focus de teclado es outline naranja caliente de `2px` con offset de `3px`. El botón deshabilitado mantiene layout, baja a `.62` y usa cursor de espera.
- **Quiet:** fondo transparente, texto muted y borde de regla oscura; en hover sube a texto papel y borde más visible.

### Chips

- **Style:** contorno de regla oscura, píldora, padding `6px 10px`, texto muted oscuro.
- **State:** `is-active` invierte a tinta con texto papel; filtros rápidos conservan overflow horizontal en pantallas estrechas.

### Cards / Containers

- **Corner Style:** workbench, queue panel e intake panel no tienen radio; la forma viene del encaje de superficies.
- **Background:** workbench papel; queue papel suave; editor crema; chasis tinta.
- **Shadow Strategy:** sólo la sombra ambiental del workbench; los paneles internos se separan por color y regla.
- **Border:** queue/editor se separan con `--line-dark`; la mesa y el topbar usan reglas sutiles.
- **Internal Padding:** queue `29px 23px 19px`; editor `29px clamp(25px, 3vw, 47px) 32px`; adaptar a `17px` laterales en móvil.

### Inputs / Fields

- **Style:** labels visibles en mono de `11px`; control rectangular sin radio, fondo transparente, borde de `1px`, padding `10px 11px`; input/select de `39px`, textarea con mínimo `82px` y resize vertical.
- **Focus:** borde naranja, fondo crema y halo naranja translúcido de `2px`, además del focus-visible global.
- **Error / Disabled:** el error usa texto y borde rojo con fondo rojo tenue y `role="alert"`; no ocultar labels requeridos ni depender del placeholder.

### Navigation

- **Topbar:** sticky, chasis oscuro, brand a la izquierda, navegación centrada y estado local/avatar a la derecha; el activo se marca con texto papel y una regla naranja de `2px`.
- **Sequence rail:** navegación vertical con spine, agujeros circulares, estados y conteos; el punto activo rellena naranja y lleva halo del color del rail.
- **Mobile treatment:** a `930px` el rail se vuelve una tira horizontal; a `620px` el topnav también se vuelve una fila scrollable de `36px`. La navegación no debe desaparecer: debe cambiar de orientación.

### Film-cutting Queue

La fila de ticket es la firma del sistema: botón de ancho completo, tres columnas para marcador, título/metadatos y código/prioridad, padding vertical `17px / 16px` y regla inferior. Hover usa una película clara; selección usa crema, punto naranja y una marca lateral. El título debe seguir siendo el primer dato; área, estado, ID y prioridad son la banda de metadatos.

### Status & Readiness

El status strip usa dos reglas horizontales, un punto naranja, estado en sans y ayuda en mono, con acción textual para avanzar o devolver el ticket. El readiness ring de `35px` muestra porcentaje, usa papel profundo como base y naranja —o `--good` cuando llega a 100%— como señal de completitud. El texto "Ficha incompleta" / "Ficha lista para circular" acompaña siempre al indicador.

## Do's and Don'ts

### Do:

- **Do** preservar la mesa de dos superficies: chasis oscuro fuera, queue papel suave e intake crema dentro.
- **Do** usar `--orange` como señal escasa de acción, focus, selección o avance; `--good` y `--danger` quedan para estados concretos.
- **Do** mantener el mono en IDs, fechas, estados, conteos y labels, con stacks locales sin cargar tipografías desde red.
- **Do** conservar reglas finas, marcadores circulares y la film rule como gramática de orientación.
- **Do** mantener labels visibles, nombres de estado acompañando a los dots, focus de teclado de `2px`/`3px` y mensajes live para cambios operativos.
- **Do** convertir la composición a una columna y a filas scrollables en móvil antes que reducir la legibilidad o forzar un canvas fijo.

### Don't:

- **Don't** convertir la cola en un mosaico de cards redondeadas o introducir una estética SaaS genérica.
- **Don't** importar Manrope, DM Mono u otra webfont desde una URL: esta implementación depende de stacks locales.
- **Don't** redondear inputs, textareas o el workbench; el contraste entre caja nítida y detalle circular es parte de la dirección.
- **Don't** usar gradientes decorativos, sombras repetidas o glow permanente para simular la mesa de corte.
- **Don't** comunicar prioridad o estado sólo con color; conserva texto, labels, `aria-pressed`, `aria-live` y `role="alert"`.
- **Don't** sacrificar el flujo queue → editor en responsive: el orden de lectura es una decisión funcional, no sólo visual.
