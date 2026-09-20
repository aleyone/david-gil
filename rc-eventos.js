/**
 * Listado público /eventos — API Admin.
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

  var ETIQUETA_MODALIDAD = {
    presencial: "Presencial",
    online: "Online",
    hibrido: "Híbrido",
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

  function etiquetaFecha(evento) {
    if (esMismoDia(evento.fechaInicio, evento.fechaFin)) {
      return formatDiaLargo(evento.fechaInicio);
    }
    return formatDiaLargo(evento.fechaInicio) + " – " + formatDiaLargo(evento.fechaFin);
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
      formatHora(evento.fechaInicio) +
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

  function tarjetaHtml(evento, ahora) {
    var tipo = ETIQUETA_TIPO[evento.tipo] || "Encuentro";
    var modalidad = ETIQUETA_MODALIDAD[evento.modalidad] || "";
    var slug = String(evento.slug || "").trim();
    var classes = "rc-events-card";
    if (evento.destacado) classes += " is-featured";
    if (estaEnCurso(evento, ahora)) classes += " is-ongoing";

    var media = evento.imagenUrl
      ? '<div class="rc-events-card-media"><img src="' +
        escapeHtml(evento.imagenUrl) +
        '" alt="Cartel de ' +
        escapeHtml(evento.titulo) +
        '" loading="lazy" decoding="async" width="240" height="320"></div>'
      : '<div class="rc-events-card-media is-empty" aria-hidden="true"></div>';

    var badge = evento.destacado
      ? '<span class="rc-events-card-badge">Destacado</span>'
      : "";
    var enCurso = estaEnCurso(evento, ahora)
      ? '<span class="rc-events-card-status">En curso</span>'
      : "";

    var metaBits = [];
    if (modalidad) metaBits.push(modalidad);
    var sitio = [evento.lugar, evento.localidad].filter(Boolean).join(" · ");
    if (sitio) metaBits.push(sitio);
    if (evento.precioTexto) metaBits.push(evento.precioTexto);

    var desc = (evento.descripcionCorta || "").trim();
    var descHtml = desc
      ? '<p class="rc-events-card-desc">' + escapeHtml(desc) + "</p>"
      : "";

    var verEncuentro = slug
      ? '<a class="rc-btn rc-btn-ghost rc-events-card-link" href="/eventos/' +
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
      media +
      '<div class="rc-events-card-body">' +
      '<div class="rc-events-card-meta">' +
      '<span class="rc-events-card-type">' +
      escapeHtml(tipo) +
      "</span>" +
      badge +
      enCurso +
      "</div>" +
      '<time class="rc-events-card-date" datetime="' +
      escapeHtml(ymdMadrid(evento.fechaInicio)) +
      '">' +
      escapeHtml(etiquetaFecha(evento)) +
      "</time>" +
      '<p class="rc-events-card-time">' +
      escapeHtml(etiquetaHorario(evento)) +
      "</p>" +
      "<h2>" +
      escapeHtml(evento.titulo) +
      "</h2>" +
      descHtml +
      (metaBits.length
        ? '<p class="rc-events-card-place">' + escapeHtml(metaBits.join(" · ")) + "</p>"
        : "") +
      (acciones
        ? '<div class="rc-events-card-actions">' + acciones + "</div>"
        : "") +
      "</div></article>"
    );
  }

  function setBusy(busy) {
    shellEl.setAttribute("aria-busy", busy ? "true" : "false");
  }

  function renderSkeleton() {
    listEl.innerHTML =
      '<article class="rc-events-card rc-events-card-skeleton" aria-hidden="true">' +
      '<div class="rc-events-card-media is-skel"></div>' +
      '<div class="rc-events-card-body">' +
      '<div class="rc-events-skel-line short"></div>' +
      '<div class="rc-events-skel-line mid"></div>' +
      '<div class="rc-events-skel-line"></div>' +
      '<div class="rc-events-skel-line long"></div>' +
      "</div></article>" +
      '<article class="rc-events-card rc-events-card-skeleton" aria-hidden="true">' +
      '<div class="rc-events-card-media is-skel"></div>' +
      '<div class="rc-events-card-body">' +
      '<div class="rc-events-skel-line short"></div>' +
      '<div class="rc-events-skel-line mid"></div>' +
      '<div class="rc-events-skel-line"></div>' +
      '<div class="rc-events-skel-line long"></div>' +
      "</div></article>" +
      '<p class="rc-visually-hidden">Cargando próximos encuentros…</p>';
  }

  function renderEmpty() {
    listEl.innerHTML =
      '<p class="rc-events-page-empty">Ahora mismo no hay próximos encuentros programados.</p>';
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
    listEl.innerHTML = eventos
      .map(function (ev) {
        return tarjetaHtml(ev, ahora);
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
