/**
 * Agenda pública /eventos — API Admin.
 * El detalle modal vive en rc-evento-detalle.js.
 * Fuente de verdad: Admin. Sin Firebase en el navegador.
 */
(function () {
  "use strict";

  var API_LIST =
    "https://admin.reconexionconsciente.es/api/publico/eventos?estado=proximos&limit=50";
  var TZ = "Europe/Madrid";
  var LOCALE = "es-ES";

  var ETIQUETA_TIPO = {
    taller: "Taller",
    charla: "Charla",
    feria: "Feria",
    encuentro: "Encuentro",
    otro: "Otro",
  };

  var listEl = document.querySelector("[data-events-page-list]");
  var shellEl = document.querySelector("[data-events-page]");
  var detalle = typeof window !== "undefined" ? window.RcEventoDetalle : null;
  if (!listEl || !shellEl || !detalle) return;

  detalle.ensureShell();

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatParts(iso, options) {
    return new Intl.DateTimeFormat(LOCALE, Object.assign({ timeZone: TZ }, options)).format(
      new Date(iso)
    );
  }

  function ymdMadrid(iso) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  }

  function ymMadrid(iso) {
    return ymdMadrid(iso).slice(0, 7);
  }

  function formatDiaLargo(iso) {
    return formatParts(iso, { day: "numeric", month: "long" });
  }

  function formatDiaNum(iso) {
    return formatParts(iso, { day: "numeric" });
  }

  function formatMesAbrev(iso) {
    var mes = formatParts(iso, { month: "short" })
      .replace(/\./g, "")
      .trim()
      .toLocaleUpperCase("es-ES");
    return mes.slice(0, 3);
  }

  function formatHora(iso) {
    return formatParts(iso, { hour: "2-digit", minute: "2-digit", hour12: false }) + " h";
  }

  function esMismoDia(inicioIso, finIso) {
    return ymdMadrid(inicioIso) === ymdMadrid(finIso);
  }

  function estaEnCurso(evento, ahora) {
    var ini = new Date(evento.fechaInicio).getTime();
    var fin = new Date(evento.fechaFin).getTime();
    var t = ahora.getTime();
    return t >= ini && t <= fin;
  }

  function capitalizeMes(value) {
    var s = String(value || "");
    if (!s) return s;
    return s.charAt(0).toLocaleUpperCase("es-ES") + s.slice(1);
  }

  function etiquetaFechaAccesible(evento) {
    if (esMismoDia(evento.fechaInicio, evento.fechaFin)) {
      return formatDiaLargo(evento.fechaInicio);
    }
    return formatDiaLargo(evento.fechaInicio) + " – " + formatDiaLargo(evento.fechaFin);
  }

  function etiquetaFechaCompactaHtml(evento) {
    var ini = evento.fechaInicio;
    var fin = evento.fechaFin;
    if (esMismoDia(ini, fin)) {
      return (
        '<span class="rc-agenda-date-day">' +
        escapeHtml(formatDiaNum(ini)) +
        "</span>" +
        '<span class="rc-agenda-date-month">' +
        escapeHtml(formatMesAbrev(ini)) +
        "</span>"
      );
    }
    if (ymMadrid(ini) === ymMadrid(fin)) {
      return (
        '<span class="rc-agenda-date-day">' +
        escapeHtml(formatDiaNum(ini) + "–" + formatDiaNum(fin)) +
        "</span>" +
        '<span class="rc-agenda-date-month">' +
        escapeHtml(formatMesAbrev(ini)) +
        "</span>"
      );
    }
    return (
      '<span class="rc-agenda-date-range">' +
      '<span class="rc-agenda-date-part">' +
      '<span class="rc-agenda-date-day">' +
      escapeHtml(formatDiaNum(ini)) +
      "</span>" +
      '<span class="rc-agenda-date-month">' +
      escapeHtml(formatMesAbrev(ini)) +
      "</span>" +
      "</span>" +
      '<span class="rc-agenda-date-sep" aria-hidden="true">—</span>' +
      '<span class="rc-agenda-date-part">' +
      '<span class="rc-agenda-date-day">' +
      escapeHtml(formatDiaNum(fin)) +
      "</span>" +
      '<span class="rc-agenda-date-month">' +
      escapeHtml(formatMesAbrev(fin)) +
      "</span>" +
      "</span>" +
      "</span>"
    );
  }

  function etiquetaHorario(evento) {
    if (evento.todoElDia) {
      return esMismoDia(evento.fechaInicio, evento.fechaFin)
        ? "Todo el día"
        : "Varios días · Todo el día";
    }
    if (esMismoDia(evento.fechaInicio, evento.fechaFin)) {
      var hIni = formatHora(evento.fechaInicio);
      var hFin = formatHora(evento.fechaFin);
      if (hIni === hFin) return hIni;
      return hIni.replace(" h", "") + "–" + hFin;
    }
    return (
      formatHora(evento.fechaInicio).replace(" h", "") +
      " – " +
      formatDiaLargo(evento.fechaFin) +
      " " +
      formatHora(evento.fechaFin)
    );
  }

  function ctaExternoCardHtml(evento) {
    var reserva = (evento.urlReserva || "").trim();
    var info = (evento.urlInformacion || "").trim();
    if (reserva) {
      return (
        '<a class="rc-btn rc-btn-gold" href="' +
        escapeHtml(reserva) +
        '" target="_blank" rel="noopener noreferrer">Reservar plaza</a>'
      );
    }
    if (info) {
      return (
        '<a class="rc-btn rc-btn-gold" href="' +
        escapeHtml(info) +
        '" target="_blank" rel="noopener noreferrer">Más información</a>'
      );
    }
    return "";
  }

  function groupByMonth(eventos) {
    var groups = [];
    var index = Object.create(null);
    eventos.forEach(function (ev) {
      var key = ymMadrid(ev.fechaInicio);
      if (!index[key]) {
        index[key] = {
          key: key,
          mes: capitalizeMes(formatParts(ev.fechaInicio, { month: "long" })),
          anio: formatParts(ev.fechaInicio, { year: "numeric" }),
          eventos: [],
        };
        groups.push(index[key]);
      }
      index[key].eventos.push(ev);
    });
    return groups;
  }

  function tarjetaHtml(evento, ahora) {
    var tipo = ETIQUETA_TIPO[evento.tipo] || "Encuentro";
    var slug = String(evento.slug || "").trim();
    var classes = "rc-agenda-item";
    if (evento.destacado) classes += " is-featured";
    if (estaEnCurso(evento, ahora)) classes += " is-ongoing";

    var media = evento.imagenUrl
      ? '<div class="rc-agenda-media"><img src="' +
        escapeHtml(evento.imagenUrl) +
        '" alt="Cartel de ' +
        escapeHtml(evento.titulo) +
        '" loading="lazy" decoding="async" width="160" height="213"></div>'
      : '<div class="rc-agenda-media is-empty" aria-hidden="true"></div>';

    var badge = evento.destacado
      ? '<span class="rc-agenda-badge">Destacado</span>'
      : "";
    var enCurso = estaEnCurso(evento, ahora)
      ? '<span class="rc-agenda-status">En curso</span>'
      : "";

    var metaBits = [];
    var sitio = [evento.lugar, evento.localidad].filter(Boolean).join(" · ");
    if (sitio) metaBits.push(sitio);
    if (evento.precioTexto) metaBits.push(evento.precioTexto);

    var desc = (evento.descripcionCorta || "").trim();
    var descHtml = desc
      ? '<p class="rc-agenda-desc">' + escapeHtml(desc) + "</p>"
      : "";

    var verEncuentro = slug
      ? '<a class="rc-btn rc-btn-ghost rc-agenda-link" href="/eventos/' +
        encodeURIComponent(slug) +
        '" data-open-event="' +
        escapeHtml(slug) +
        '">Ver encuentro</a>'
      : "";

    var acciones = ctaExternoCardHtml(evento) + verEncuentro;

    return (
      '<article class="' +
      classes +
      '" data-event-id="' +
      escapeHtml(evento.id) +
      '" data-event-slug="' +
      escapeHtml(slug) +
      '">' +
      '<time class="rc-agenda-date" datetime="' +
      escapeHtml(ymdMadrid(evento.fechaInicio)) +
      '" aria-label="' +
      escapeHtml(etiquetaFechaAccesible(evento)) +
      '">' +
      etiquetaFechaCompactaHtml(evento) +
      "</time>" +
      media +
      '<div class="rc-agenda-body">' +
      '<div class="rc-agenda-meta">' +
      '<span class="rc-agenda-type">' +
      escapeHtml(tipo) +
      "</span>" +
      badge +
      enCurso +
      "</div>" +
      "<h2>" +
      escapeHtml(evento.titulo) +
      "</h2>" +
      '<p class="rc-agenda-time">' +
      escapeHtml(etiquetaHorario(evento)) +
      "</p>" +
      (metaBits.length
        ? '<p class="rc-agenda-place">' + escapeHtml(metaBits.join(" · ")) + "</p>"
        : "") +
      descHtml +
      (acciones
        ? '<div class="rc-agenda-actions">' + acciones + "</div>"
        : "") +
      "</div></article>"
    );
  }

  function monthSectionHtml(group, ahora) {
    return (
      '<section class="rc-agenda-month" data-month-key="' +
      escapeHtml(group.key) +
      '">' +
      '<h2 class="rc-agenda-month-head">' +
      '<span class="rc-agenda-month-line" aria-hidden="true"></span>' +
      '<span class="rc-agenda-month-label">' +
      '<span class="rc-agenda-month-name">' +
      escapeHtml(group.mes) +
      "</span>" +
      '<span class="rc-agenda-month-year">' +
      escapeHtml(group.anio) +
      "</span>" +
      "</span>" +
      '<span class="rc-agenda-month-line" aria-hidden="true"></span>' +
      "</h2>" +
      '<div class="rc-agenda-month-list">' +
      group.eventos
        .map(function (ev) {
          return tarjetaHtml(ev, ahora);
        })
        .join("") +
      "</div></section>"
    );
  }

  function setBusy(busy) {
    shellEl.setAttribute("aria-busy", busy ? "true" : "false");
  }

  function renderSkeleton() {
    listEl.innerHTML =
      '<article class="rc-agenda-item rc-agenda-item-skeleton" aria-hidden="true">' +
      '<div class="rc-agenda-date is-skel"></div>' +
      '<div class="rc-agenda-media is-skel"></div>' +
      '<div class="rc-agenda-body">' +
      '<div class="rc-events-skel-line short"></div>' +
      '<div class="rc-events-skel-line mid"></div>' +
      '<div class="rc-events-skel-line"></div>' +
      "</div></article>" +
      '<article class="rc-agenda-item rc-agenda-item-skeleton" aria-hidden="true">' +
      '<div class="rc-agenda-date is-skel"></div>' +
      '<div class="rc-agenda-media is-skel"></div>' +
      '<div class="rc-agenda-body">' +
      '<div class="rc-events-skel-line short"></div>' +
      '<div class="rc-events-skel-line mid"></div>' +
      '<div class="rc-events-skel-line"></div>' +
      "</div></article>" +
      '<p class="rc-visually-hidden">Cargando próximos encuentros…</p>';
  }

  function renderEmpty() {
    listEl.innerHTML =
      '<p class="rc-events-page-empty">No hay próximos encuentros publicados en este momento.</p>';
  }

  function renderError() {
    listEl.innerHTML =
      '<p class="rc-events-page-empty rc-events-page-error">No hemos podido cargar los próximos encuentros en este momento.</p>';
  }

  function renderLista(payload) {
    var eventos = Array.isArray(payload.eventos) ? payload.eventos : [];
    var ahora = new Date();
    if (!eventos.length) {
      renderEmpty();
      return;
    }
    var groups = groupByMonth(eventos);
    listEl.innerHTML = groups
      .map(function (g) {
        return monthSectionHtml(g, ahora);
      })
      .join("");
  }

  listEl.addEventListener("click", function (e) {
    var link = e.target.closest("[data-open-event]");
    if (!link) return;
    e.preventDefault();
    var slug = link.getAttribute("data-open-event");
    detalle.open({
      slug: slug,
      origin: "list",
      returnUrl: "/eventos",
      returnTitle: detalle.TITLE_LIST,
      trigger: link,
      pushHistory: true,
    });
  });

  function cargarLista() {
    setBusy(true);
    renderSkeleton();
    return fetch(API_LIST, { method: "GET", credentials: "omit", mode: "cors" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || typeof data !== "object") throw new Error("Respuesta inválida");
        renderLista(data);
        setBusy(false);
      })
      .catch(function (err) {
        console.error("[eventos] No se pudieron cargar los eventos públicos:", err);
        renderError();
        setBusy(false);
      });
  }

  var initialSlug = detalle.parseSlugFromPath(location.pathname);
  cargarLista().then(function () {
    if (initialSlug) {
      detalle.open({
        slug: initialSlug,
        origin: "direct",
        returnUrl: "/eventos",
        returnTitle: detalle.TITLE_LIST,
        pushHistory: false,
      });
    }
  });
})();
