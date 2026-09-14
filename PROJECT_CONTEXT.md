# Reconexión Consciente — Contexto del proyecto

> Documento de referencia para el desarrollo y evolución del ecosistema
> Reconexión Consciente. Debe mantenerse actualizado con las decisiones
> relevantes del proyecto.

## 1. Propósito de este documento

Este archivo es la fuente de contexto principal del proyecto.

Debe permitir que un nuevo agente de IA, desarrollador o nueva conversación
pueda comprender el estado del ecosistema sin depender del historial de una
conversación anterior.

Debe distinguir siempre entre:

- **estado actual**;
- **decisiones ya aprobadas**;
- **pendientes**;
- **dirección futura**.

No debe convertir propuestas o ideas en decisiones definitivas.
No debe presentar funciones futuras como si ya existieran.

---

# ESTADO ACTUAL

## 2. Marca

Nombre:

**Reconexión Consciente**

No utilizar:

**"Escuela de Reconexión Consciente"**

Reconexión Consciente funciona como **marca paraguas**. Debe poder albergar
herramientas, experiencias, contenidos, publicaciones, talleres y proyectos
futuros sin quedar limitada a una escuela o formación.

Claim:

**"El conocimiento que buscas ya está en ti."**

**David Gil** es la persona/guía visible, autor y guía del proyecto, dentro
de la marca.

## 3. Dominio y arquitectura pública

Dominio principal:

**reconexionconsciente.es**

Es el dominio canónico de la marca.

También existe:

**reconexionconsciente.com**

El dominio `.com` redirige permanentemente al `.es`.

Subdominios actuales:

- `numerologia.reconexionconsciente.es`
- `tarot.reconexionconsciente.es`
- `confluencia.reconexionconsciente.es`

Los antiguos dominios de Vercel se mantienen como infraestructura/fallback,
pero no deben ser la identidad pública principal.

## 4. Organización local del workspace

El workspace local es:

`ReconexionConsciente`

Su estructura actual es:

```text
ReconexionConsciente/
├── Confluencia/
├── Web/
├── Tarot/
└── NumerologiaCafe/
```

Este repositorio (`Web`) contiene la Home pública de Reconexión Consciente.
El trabajo de la Home V1 se realiza **exclusivamente dentro de `Web`**.

Servidor de desarrollo local:

```text
node serve.mjs
```

No utilizar `php -S` para las pruebas de esta Home: el servidor PHP de un
solo hilo provocó falsos problemas de carga con los assets concurrentes.

## 5. Home V1

La Home V1 está **implementada, responsive, y aprobada visual y técnicamente**
para Preview.

Archivos principales:

- `index.html`
- `rc-home.css`
- `assets/` (WebP/SVG de la V1)
- `serve.mjs`

Estructura de la página:

1. Header
2. Hero
3. Experiencias
4. Manifiesto
5. Libro
6. Encuentros
7. Sobre mí
8. CTA final
9. Footer

Rama de trabajo:

`feature/reconexion-home-v1`

## 6. Experiencias (en la Home)

Actualmente visibles:

- **Explórate** — Numerología
- **Escúchate** — Tarot del Alma Naciente
- **Encuéntrate** — Confluencia

## 7. Libro

Libro actual:

**ALCYONE**  
*La belleza en el todo*

Autor mostrado: **Dune Rúnica**

CTA implementado: **COMPRAR EN AMAZON**, con enlace a Amazon.

La **sinopsis definitiva** ya está incorporada a la Home (dos párrafos).

Texto conceptual de la sinopsis:

Alcyone presenta la Trinidad como estructura energética de creación, no como
interpretación religiosa.

Las tres fuerzas principales son:

- Pensamiento y Voluntad
- Amor y Aceptación
- Sabiduría nacida de integrar ambas

Existe además un cuarto elemento: el **Observador / verdadero Ser**.

El libro plantea un recorrido interior relacionado con consciencia,
experiencia, amor, causa y efecto y nuestra capacidad creadora.

Puede leerse como obra completa o utilizarse abriendo cualquier página como
herramienta personal de reflexión.

La sección Libro tiene tratamiento responsive específico para garantizar la
legibilidad de la sinopsis sobre el fondo artístico (velo crema orgánico
detrás de la columna de lectura; no es una tarjeta ni un recuadro).

## 8. Sobre mí

Nombre: **David Gil**

Fotografía y marco actuales: **aprobados**.

No modificar el encaje del retrato sin decisión explícita.

Texto actual definitivo:

> Desde pequeño he sido una persona curiosa, de las que necesitan mirar un
> poco más allá y hacerse preguntas. Esa curiosidad me llevó hace años a
> acercarme al Reiki y, a partir de ahí, se abrió ante mí un mundo que fui
> explorando a través de las meditaciones grupales y otras formas de
> entendernos y conocernos mejor.
>
> Con el tiempo, la numerología se convirtió en una de mis principales
> herramientas de autoconocimiento. Años de estudio, práctica y experiencia
> me han permitido compartirla también con otras personas, tanto en sesiones
> como en talleres y ponencias. No busco ofrecer respuestas cerradas, sino
> abrir preguntas, aportar claridad y crear espacios en los que cada persona
> pueda descubrir sus propias respuestas.

## 9. Encuentros

La sección visual está implementada.

El evento mostrado actualmente es **contenido provisional**.

## 10. Responsive

Comportamiento actual aproximado:

| Ancho | Comportamiento |
|---|---|
| ≥ 1025 px | Desktop. Navegación completa. |
| ≤ 1024 px | Tablet / header hamburguesa. Libro y Sobre mí en 2 columnas. |
| ≤ 768 px | Tablet vertical. 2 columnas más compactas. |
| ≤ 639 px | Móvil / una columna donde corresponde. |
| ≤ 390 px | Ajustes para móvil estrecho (botones a ancho completo). |

Resoluciones verificadas y aprobadas:

- 1920×1080
- 1366×768
- 1024×768
- 768×1024
- 390×844
- 360×800

El menú hamburguesa bloquea correctamente el scroll del documento
(`html`/`body.rc-nav-open`, `body` en `position: fixed`) y restaura la
posición al cerrarse.

## 11. Rendimiento y limpieza técnica V1

La limpieza técnica V1 está realizada.

Estado:

- assets principales en WebP/SVG;
- 0 PNG legacy en `assets/`;
- código legacy de la antigua Home eliminado (`.layout`, `<style>` inline,
  segundo script);
- carrusel/JS antiguo de YouTube eliminado (sin `setInterval` legacy ni
  miniaturas `img.youtube.com`);
- formularios antiguos eliminados;
- fuentes reducidas a **Fraunces + Jost**;
- Hero responsive mediante `<picture>`;
- desktop descarga únicamente Hero desktop;
- móvil descarga únicamente Hero mobile;
- Hero prioritario y **no** lazy;
- contenido below-the-fold utiliza lazy loading cuando corresponde;
- cero 404 locales;
- cero ERR_* locales;
- cero errores JavaScript detectados.

Peso aproximado recorrido completo desktop: **~4 MB**.

`index.html` tras la limpieza estructural: **~11 KB** (antes de los últimos
ajustes de contenido de Libro y Sobre mí).

---

# DECISIONES APROBADAS

## 12. Identidad visual

Paleta y lenguaje visual:

- crema / marfil
- burdeos / vino
- terracota
- marrón oscuro
- dorado como acento
- acuarela
- texturas orgánicas
- naturaleza
- raíces
- espiral

Tipografías actuales de la Home V1:

- **Fraunces**
- **Jost**

Evitar:

- estética genérica new age;
- coaching visual convencional;
- galaxias;
- mandalas genéricos;
- abuso del dorado.

La identidad debe sentirse: **orgánica, contemporánea, cálida y reconocible**.

## 13. Decisiones de producto ya cerradas

- El nombre público es **Reconexión Consciente**, no
  "Escuela de Reconexión Consciente".
- El claim es **"El conocimiento que buscas ya está en ti."**
- David Gil es la persona/guía visible; la marca es el paraguas.
- La Home V1 está **aprobada** visual y técnicamente para Preview.
- Fotografía y marco de Sobre mí: **aprobados**. No alterar el encaje
  (slot `left: 55.5%; top: 39.8%; width/height: 77%`) sin decisión explícita.
- La sinopsis de ALCYONE y el texto de Sobre mí son los textos definitivos
  actuales de la Home.
- Los encuentros/eventos **deberán obtenerse desde el sistema de
  administración** cuando la administración global se integre en la web
  principal. No está fijada todavía una implementación técnica definitiva.

## 14. Ecosistema conceptual (aprobado como mapa, no como UI completa)

Conceptualmente el ecosistema completo contempla:

- **Explórate** — Numerología
- **Escúchate** — Tarot del Alma Naciente
- **Encuéntrate** — Confluencia
- **Profundiza** — Libro
- **Vívelo** — Encuentros

Las aplicaciones deberán integrarse progresivamente dentro del ecosistema
Reconexión Consciente. En la Home V1 solo están resueltos visualmente los
tres primeros bloques de experiencias, más Libro y Encuentros como
secciones propias.

---

# PENDIENTES

- Revisión final en **Vercel Preview** de `feature/reconexion-home-v1`.
- Sustituir el evento provisional de Encuentros por datos reales cuando
  exista fuente de administración.
- Integración progresiva de las aplicaciones (Numerología, Tarot,
  Confluencia) en la web principal: **no implementada**.
- Merge a `main` / producción: **no autorizado** en el cierre de esta V1.

---

# DIRECCIÓN FUTURA

Registrar como dirección futura, **no como funcionalidad implementada**:

- integración progresiva de Numerología, Tarot y Confluencia;
- experiencia más integrada dentro de reconexionconsciente.es;
- identidad/usuario compartido;
- posible área "Mi espacio";
- evolución del Admin actual de Confluencia hacia administración global;
- administración centralizada de eventos;
- calendario global;
- futura arquitectura de marketing;
- planificación de publicaciones;
- generación IA de texto/imagen;
- revisión/aprobación antes de publicación;
- futura integración con APIs sociales cuando se aborde ese módulo.

Estas funciones **no existen actualmente** en la Home V1.
