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
  if (!listEl || !sectionEl) return;

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

  function etiquetaFechaPrincipal(evento) {
    if (evento.todoElDia || !esMismoDia(evento.fechaInicio, evento.fechaFin)) {
      if (esMismoDia(evento.fechaInicio, evento.fechaFin)) {
        return formatDiaLargo(evento.fechaInicio);
      }
      return formatDiaLargo(evento.fechaInicio) + " – " + formatDiaLargo(evento.fechaFin);
    }
    return formatDiaLargo(evento.fechaInicio);
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
      '<time datetime="' +
      escapeHtml(datetimeAttr(evento)) +
      '">' +
      escapeHtml(etiquetaFechaPrincipal(evento)) +
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

  cargar();
})();
