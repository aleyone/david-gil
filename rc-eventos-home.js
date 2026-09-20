/**
 * Próximos encuentros en Home — lectura desde API pública Admin.
 * Fuente de verdad: Admin/Firestore. Sin Firebase en el navegador.
 */
(function () {
  "use strict";

  var API_URL =
    "https://admin.reconexionconsciente.es/api/publico/eventos?estado=proximos&limit=3";
  var TZ = "Europe/Madrid";
  var LOCALE = "es-ES";

  var ETIQUETA_TIPO = {
    taller: "Taller",
    charla: "Charla",
    feria: "Feria",
    encuentro: "Encuentro",
    otro: "Otro",
  };

  var listEl = document.querySelector("[data-events-list]");
  var sectionEl = document.querySelector("[data-events-section]");
  var moreWrap = document.querySelector("[data-events-more]");
  var detalle = typeof window !== "undefined" ? window.RcEventoDetalle : null;
  if (!listEl || !sectionEl) return;
  if (detalle) detalle.ensureShell();

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

  function formatDiaLargo(iso) {
    return formatParts(iso, { day: "numeric", month: "long" });
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

  function ymMadrid(iso) {
    return ymdMadrid(iso).slice(0, 7);
  }

  /** Fecha compacta visual para la columna de fecha (HTML interno de <time>). */
  function etiquetaFechaCompactaHtml(evento) {
    var ini = evento.fechaInicio;
    var fin = evento.fechaFin;
    if (esMismoDia(ini, fin)) {
      return (
        '<span class="rc-event-date-day">' +
        escapeHtml(formatDiaNum(ini)) +
        "</span>" +
        '<span class="rc-event-date-month">' +
        escapeHtml(formatMesAbrev(ini)) +
        "</span>"
      );
    }
    if (ymMadrid(ini) === ymMadrid(fin)) {
      return (
        '<span class="rc-event-date-day">' +
        escapeHtml(formatDiaNum(ini) + "–" + formatDiaNum(fin)) +
        "</span>" +
        '<span class="rc-event-date-month">' +
        escapeHtml(formatMesAbrev(ini)) +
        "</span>"
      );
    }
    return (
      '<span class="rc-event-date-range">' +
      '<span class="rc-event-date-part">' +
      '<span class="rc-event-date-day">' +
      escapeHtml(formatDiaNum(ini)) +
      "</span>" +
      '<span class="rc-event-date-month">' +
      escapeHtml(formatMesAbrev(ini)) +
      "</span>" +
      "</span>" +
      '<span class="rc-event-date-sep" aria-hidden="true">—</span>' +
      '<span class="rc-event-date-part">' +
      '<span class="rc-event-date-day">' +
      escapeHtml(formatDiaNum(fin)) +
      "</span>" +
      '<span class="rc-event-date-month">' +
      escapeHtml(formatMesAbrev(fin)) +
      "</span>" +
      "</span>" +
      "</span>"
    );
  }

  function etiquetaFechaAccesible(evento) {
    if (esMismoDia(evento.fechaInicio, evento.fechaFin)) {
      return formatDiaLargo(evento.fechaInicio);
    }
    return formatDiaLargo(evento.fechaInicio) + " – " + formatDiaLargo(evento.fechaFin);
  }

  function datetimeAttr(evento) {
    return ymdMadrid(evento.fechaInicio);
  }

  function lineaMeta(evento, ahora) {
    var partes = [];
    if (estaEnCurso(evento, ahora)) partes.push("En curso");

    if (evento.todoElDia) {
      if (!esMismoDia(evento.fechaInicio, evento.fechaFin)) {
        partes.push("Varios días");
      } else {
        partes.push("Todo el día");
      }
    } else if (esMismoDia(evento.fechaInicio, evento.fechaFin)) {
      var hIni = formatHora(evento.fechaInicio);
      var hFin = formatHora(evento.fechaFin);
      if (hIni === hFin) partes.push(hIni);
      else partes.push(hIni.replace(" h", "") + "–" + hFin);
    } else {
      partes.push(
        formatHora(evento.fechaInicio).replace(" h", "") +
          " – " +
          formatDiaLargo(evento.fechaFin) +
          " " +
          formatHora(evento.fechaFin)
      );
    }

    var sitio = [evento.lugar, evento.localidad].filter(Boolean).join(" · ");
    if (sitio) partes.push(sitio);
    if (evento.precioTexto) partes.push(evento.precioTexto);
    return partes.join(" · ");
  }

  function ctaHtml(evento) {
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

  function accionesHtml(evento) {
    var slug = String(evento.slug || "").trim();
    var externo = ctaHtml(evento);
    var ver = slug
      ? '<a class="rc-btn rc-btn-ghost rc-event-link" href="/eventos/' +
        encodeURIComponent(slug) +
        '" data-open-event="' +
        escapeHtml(slug) +
        '">Ver encuentro</a>'
      : "";
    if (!externo && !ver) return "";
    return '<div class="rc-event-actions">' + externo + ver + "</div>";
  }

  function tarjetaHtml(evento, ahora) {
    var tipo = ETIQUETA_TIPO[evento.tipo] || "Encuentro";
    var classes = "rc-event";
    if (evento.destacado) classes += " is-featured";
    if (estaEnCurso(evento, ahora)) classes += " is-ongoing";

    var img = "";
    if (evento.imagenUrl) {
      img =
        '<div class="rc-event-media">' +
        '<img src="' +
        escapeHtml(evento.imagenUrl) +
        '" alt="Cartel de ' +
        escapeHtml(evento.titulo) +
        '" loading="lazy" decoding="async" width="120" height="160">' +
        "</div>";
    }

    var badge = evento.destacado
      ? '<span class="rc-event-badge">Destacado</span>'
      : "";

    return (
      '<article class="' +
      classes +
      '" data-event-id="' +
      escapeHtml(evento.id) +
      '" data-event-slug="' +
      escapeHtml(evento.slug) +
      '" data-event-status="' +
      (estaEnCurso(evento, ahora) ? "ongoing" : "upcoming") +
      '">' +
      img +
      '<div class="rc-event-content">' +
      '<time class="rc-event-date" datetime="' +
      escapeHtml(datetimeAttr(evento)) +
      '" aria-label="' +
      escapeHtml(etiquetaFechaAccesible(evento)) +
      '">' +
      etiquetaFechaCompactaHtml(evento) +
      "</time>" +
      '<div class="rc-event-body">' +
      '<span class="rc-event-type">' +
      escapeHtml(tipo) +
      "</span>" +
      badge +
      "<h3>" +
      escapeHtml(evento.titulo) +
      "</h3>" +
      "<p>" +
      escapeHtml(lineaMeta(evento, ahora)) +
      "</p>" +
      "</div>" +
      "</div>" +
      accionesHtml(evento) +
      "</article>"
    );
  }

  function setBusy(busy) {
    sectionEl.setAttribute("aria-busy", busy ? "true" : "false");
  }

  function renderEmpty() {
    listEl.innerHTML =
      '<p class="rc-event-empty">Ahora mismo no hay próximos encuentros publicados. Cuando haya nuevas fechas, aparecerán aquí.</p>';
    if (moreWrap) moreWrap.hidden = true;
  }

  function renderError() {
    listEl.innerHTML =
      '<p class="rc-event-empty rc-event-error">No hemos podido cargar los próximos encuentros en este momento. Vuelve a intentarlo más tarde.</p>';
    if (moreWrap) moreWrap.hidden = true;
  }

  function renderLista(payload) {
    var eventos = Array.isArray(payload.eventos) ? payload.eventos : [];
    var hayMas = Boolean(payload.hayMas);
    var ahora = new Date();

    if (!eventos.length) {
      renderEmpty();
      return;
    }

    listEl.innerHTML = eventos.map(function (ev) {
      return tarjetaHtml(ev, ahora);
    }).join("");

    if (moreWrap) {
      moreWrap.hidden = !hayMas;
    }
  }

  function cargar() {
    setBusy(true);
    fetch(API_URL, { method: "GET", credentials: "omit", mode: "cors" })
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
        console.error("[encuentros] No se pudieron cargar los eventos públicos:", err);
        renderError();
        setBusy(false);
      });
  }

  listEl.addEventListener("click", function (e) {
    if (!detalle) return;
    var link = e.target.closest("[data-open-event]");
    if (!link || !listEl.contains(link)) return;
    if (e.defaultPrevented) return;
    if (e.button != null && e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    var slug = link.getAttribute("data-open-event") || "";
    if (!slug && detalle.parseSlugFromPath) {
      slug = detalle.parseSlugFromPath(link.getAttribute("href") || "");
    }
    if (!slug) return;
    detalle.open({
      slug: slug,
      origin: "home",
      returnUrl: location.pathname + location.search + location.hash,
      returnScrollY: window.scrollY || window.pageYOffset || 0,
      returnTitle: document.title,
      trigger: link,
      pushHistory: true,
    });
  });

  cargar();
})();
