/**
 * Modal compartido de detalle de evento público.
 * Usado por /eventos (y preparado para Home en 3C.3).
 * Fuente de verdad: Admin. Sin Firebase en el navegador.
 */
(function (global) {
  "use strict";

  var API_DETAIL_BASE =
    "https://admin.reconexionconsciente.es/api/publico/eventos/";
  var TITLE_LIST = "Próximos encuentros | Reconexión Consciente";
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

  var ETIQUETA_EXPERIENCIA = {
    numerologia: "Numerología",
    tarot: "Tarot",
    confluencia: "Confluencia",
    libro: "Libro",
    reconexion: "Reconexión",
  };

  var MODAL_SHELL_HTML =
    '<div class="rc-events-modal" data-events-modal hidden aria-hidden="true">' +
    '<div class="rc-events-modal-backdrop" data-events-modal-backdrop tabindex="-1"></div>' +
    '<div class="rc-events-modal-panel" data-events-modal-panel role="dialog" aria-modal="true" aria-labelledby="rc-events-modal-title">' +
    '<div class="rc-events-modal-toolbar">' +
    '<button type="button" class="rc-events-modal-x" data-events-modal-close aria-label="Cerrar">×</button>' +
    '<button type="button" class="rc-events-modal-cerrar" data-events-modal-close>Cerrar</button>' +
    "</div>" +
    '<div class="rc-events-modal-body" data-events-modal-body></div>' +
    "</div></div>";

  var modalRoot = null;
  var modalPanel = null;
  var modalBody = null;
  var listenersBound = false;

  var modalOpen = false;
  var currentSlug = "";
  var currentOrigin = "list";
  var returnUrl = "/eventos";
  var returnTitle = TITLE_LIST;
  var returnScrollY = null;
  /** true si abrimos con pushState (history.back seguro). */
  var openedViaPush = false;
  var ignorePopstate = false;
  var lastTrigger = null;
  var lastFocusable = [];
  var fetchSeq = 0;

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

  function parseSlugFromPath(pathname) {
    var m = String(pathname || "").match(/^\/eventos\/([^/]+)\/?$/);
    if (!m) return "";
    try {
      return decodeURIComponent(m[1]).trim();
    } catch (e) {
      return m[1].trim();
    }
  }

  function isListPath(pathname) {
    var p = String(pathname || "");
    return p === "/eventos" || p === "/eventos/";
  }

  function defaultsForOrigin(origin) {
    if (origin === "home") {
      return {
        returnUrl: "/",
        returnTitle: document.title || "Reconexión Consciente · David Gil",
      };
    }
    return {
      returnUrl: "/eventos",
      returnTitle: TITLE_LIST,
    };
  }

  function setEventTitle(titulo) {
    var t = String(titulo || "").trim();
    document.title = t ? t + " | Reconexión Consciente" : returnTitle;
  }

  function restoreReturnTitle() {
    document.title = returnTitle || TITLE_LIST;
  }

  function ensureShell() {
    if (modalRoot && document.body.contains(modalRoot)) {
      return modalRoot;
    }
    modalRoot = document.querySelector("[data-events-modal]");
    if (!modalRoot) {
      var wrap = document.createElement("div");
      wrap.innerHTML = MODAL_SHELL_HTML;
      modalRoot = wrap.firstChild;
      document.body.appendChild(modalRoot);
    }
    modalPanel = modalRoot.querySelector("[data-events-modal-panel]");
    modalBody = modalRoot.querySelector("[data-events-modal-body]");
    bindListeners();
    return modalRoot;
  }

  function getFocusable(container) {
    return Array.prototype.slice
      .call(
        container.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(function (el) {
        return !el.hasAttribute("disabled") && el.offsetParent !== null;
      });
  }

  function lockBodyScroll() {
    document.documentElement.classList.add("rc-events-modal-open");
    document.body.classList.add("rc-events-modal-open");
  }

  function unlockBodyScroll() {
    document.documentElement.classList.remove("rc-events-modal-open");
    document.body.classList.remove("rc-events-modal-open");
  }

  function showModalShell() {
    ensureShell();
    modalRoot.hidden = false;
    modalRoot.setAttribute("aria-hidden", "false");
    lockBodyScroll();
    modalOpen = true;
  }

  function hideModalShell() {
    if (!modalRoot) return;
    modalRoot.hidden = true;
    modalRoot.setAttribute("aria-hidden", "true");
    unlockBodyScroll();
    modalOpen = false;
    currentSlug = "";
    openedViaPush = false;
    if (modalBody) modalBody.innerHTML = "";
    restoreReturnTitle();
    if (lastTrigger && typeof lastTrigger.focus === "function") {
      try {
        lastTrigger.focus();
      } catch (e) {}
    }
    lastTrigger = null;
  }

  function ctaExternoHtml(evento) {
    var reserva = (evento.urlReserva || "").trim();
    var info = (evento.urlInformacion || "").trim();
    var html = "";
    if (reserva) {
      html +=
        '<a class="rc-btn rc-btn-gold" href="' +
        escapeHtml(reserva) +
        '" target="_blank" rel="noopener noreferrer">Reservar plaza</a>';
    }
    if (info) {
      html +=
        '<a class="rc-btn ' +
        (reserva ? "rc-btn-ghost rc-events-modal-secondary" : "rc-btn-gold") +
        '" href="' +
        escapeHtml(info) +
        '" target="_blank" rel="noopener noreferrer">Más información</a>';
    }
    return html;
  }

  function experienciasHtml(evento) {
    var exps = Array.isArray(evento.experiencias) ? evento.experiencias : [];
    var labels = exps
      .map(function (x) {
        return ETIQUETA_EXPERIENCIA[x] || "";
      })
      .filter(Boolean);
    if (!labels.length) return "";
    return (
      '<p class="rc-events-modal-exps"><span>Experiencias</span> ' +
      escapeHtml(labels.join(" · ")) +
      "</p>"
    );
  }

  function renderModalLoading() {
    modalBody.innerHTML =
      '<div class="rc-events-modal-loading" role="status">' +
      '<h2 id="rc-events-modal-title" class="rc-visually-hidden">Cargando encuentro</h2>' +
      "Cargando encuentro…" +
      "</div>";
  }

  function renderModalUnavailable() {
    setEventTitle("Encuentro no disponible");
    modalBody.innerHTML =
      '<div class="rc-events-modal-state">' +
      '<h2 id="rc-events-modal-title">Este encuentro no está disponible.</h2>' +
      "<p>Puede haber finalizado su publicación o el enlace ya no es válido.</p>" +
      '<button type="button" class="rc-btn rc-btn-gold" data-events-go-list>Ver próximos encuentros</button>' +
      "</div>";
  }

  function renderModalError() {
    setEventTitle("Encuentro");
    modalBody.innerHTML =
      '<div class="rc-events-modal-state">' +
      '<h2 id="rc-events-modal-title">No hemos podido cargar este encuentro en este momento.</h2>' +
      "<p>Inténtalo de nuevo un poco más tarde.</p>" +
      '<button type="button" class="rc-btn rc-btn-gold" data-events-go-list>Ver próximos encuentros</button>' +
      "</div>";
  }

  function renderModalEvento(evento) {
    var tipo = ETIQUETA_TIPO[evento.tipo] || "Encuentro";
    var modalidad = ETIQUETA_MODALIDAD[evento.modalidad] || "";
    setEventTitle(evento.titulo);

    var media = evento.imagenUrl
      ? '<div class="rc-events-modal-media"><img src="' +
        escapeHtml(evento.imagenUrl) +
        '" alt="Cartel de ' +
        escapeHtml(evento.titulo) +
        '" decoding="async"></div>'
      : '<div class="rc-events-modal-media is-empty" aria-hidden="true"></div>';

    var badge = evento.destacado
      ? '<span class="rc-events-card-badge">Destacado</span>'
      : "";

    var lugarParts = [];
    if (evento.lugar) lugarParts.push(evento.lugar);
    if (evento.direccion) lugarParts.push(evento.direccion);
    var ciudad = [evento.localidad, evento.provincia].filter(Boolean).join(", ");
    if (ciudad) lugarParts.push(ciudad);

    var desc = (evento.descripcion || evento.descripcionCorta || "").trim();
    var org = (evento.organizador || "").trim();
    var precio = (evento.precioTexto || "").trim();
    var ctas = ctaExternoHtml(evento);

    modalBody.innerHTML =
      '<div class="rc-events-modal-layout">' +
      media +
      '<div class="rc-events-modal-copy">' +
      '<div class="rc-events-card-meta">' +
      '<span class="rc-events-card-type">' +
      escapeHtml(tipo) +
      "</span>" +
      badge +
      "</div>" +
      '<h2 id="rc-events-modal-title">' +
      escapeHtml(evento.titulo) +
      "</h2>" +
      '<time class="rc-events-card-date" datetime="' +
      escapeHtml(ymdMadrid(evento.fechaInicio)) +
      '">' +
      escapeHtml(etiquetaFecha(evento)) +
      "</time>" +
      '<p class="rc-events-card-time">' +
      escapeHtml(etiquetaHorario(evento)) +
      "</p>" +
      (modalidad
        ? '<p class="rc-events-modal-row"><span>Modalidad</span> ' +
          escapeHtml(modalidad) +
          "</p>"
        : "") +
      (lugarParts.length
        ? '<p class="rc-events-modal-row"><span>Lugar</span> ' +
          escapeHtml(lugarParts.join(" · ")) +
          "</p>"
        : "") +
      (org
        ? '<p class="rc-events-modal-row"><span>Organiza</span> ' +
          escapeHtml(org) +
          "</p>"
        : "") +
      (precio
        ? '<p class="rc-events-modal-row"><span>Precio</span> ' +
          escapeHtml(precio) +
          "</p>"
        : "") +
      experienciasHtml(evento) +
      (desc
        ? '<div class="rc-events-modal-desc">' +
          escapeHtml(desc).replace(/\r\n|\n|\r/g, "<br>") +
          "</div>"
        : "") +
      (ctas ? '<div class="rc-events-card-actions">' + ctas + "</div>" : "") +
      "</div></div>";
  }

  function focusModal() {
    lastFocusable = getFocusable(modalPanel);
    var prefer =
      modalPanel.querySelector("[data-events-modal-close]") || lastFocusable[0];
    if (prefer) prefer.focus();
  }

  function fetchDetalle(slug) {
    var seq = ++fetchSeq;
    return fetch(API_DETAIL_BASE + encodeURIComponent(slug), {
      method: "GET",
      credentials: "omit",
      mode: "cors",
    }).then(function (res) {
      if (seq !== fetchSeq) return { stale: true };
      if (res.status === 404) return { unavailable: true };
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json().then(function (data) {
        if (seq !== fetchSeq) return { stale: true };
        if (!data || !data.evento) throw new Error("Respuesta inválida");
        return { evento: data.evento };
      });
    });
  }

  function historyStatePayload(slug) {
    return {
      eventosModal: true,
      slug: slug,
      origin: currentOrigin,
      returnUrl: returnUrl,
      returnTitle: returnTitle,
      returnScrollY: returnScrollY,
    };
  }

  /**
   * @param {object} opts
   * @param {string} opts.slug
   * @param {"home"|"list"|"direct"} [opts.origin]
   * @param {string} [opts.returnUrl]
   * @param {number|null} [opts.returnScrollY]
   * @param {string} [opts.returnTitle]
   * @param {Element|null} [opts.trigger]
   * @param {boolean} [opts.pushHistory] — si true, pushState a /eventos/{slug}
   * @param {boolean} [opts.fromHistory] — apertura por popstate (sin push)
   */
  function open(opts) {
    opts = opts || {};
    var clean = String(opts.slug || "").trim();
    if (!clean) return;

    ensureShell();

    var origin = opts.origin || "list";
    var defaults = defaultsForOrigin(origin);
    currentOrigin = origin;
    returnUrl =
      opts.returnUrl != null ? String(opts.returnUrl) : defaults.returnUrl;
    returnTitle =
      opts.returnTitle != null ? String(opts.returnTitle) : defaults.returnTitle;
    returnScrollY =
      typeof opts.returnScrollY === "number" ? opts.returnScrollY : null;

    var shouldPush =
      !opts.fromHistory &&
      (opts.pushHistory === true ||
        (opts.pushHistory !== false && origin === "list"));

    if (opts.trigger) {
      lastTrigger = opts.trigger;
    }

    if (shouldPush && (!modalOpen || currentSlug !== clean)) {
      history.pushState(
        historyStatePayload(clean),
        "",
        "/eventos/" + encodeURIComponent(clean)
      );
      openedViaPush = true;
    } else if (opts.fromHistory) {
      openedViaPush = false;
    } else if (origin === "direct") {
      openedViaPush = false;
    }

    currentSlug = clean;
    showModalShell();
    renderModalLoading();
    focusModal();

    fetchDetalle(clean)
      .then(function (result) {
        if (!result || result.stale) return;
        if (result.unavailable) {
          renderModalUnavailable();
          focusModal();
          return;
        }
        renderModalEvento(result.evento);
        focusModal();
      })
      .catch(function (err) {
        console.error("[evento-detalle] Detalle no disponible:", err);
        renderModalError();
        focusModal();
      });
  }

  /**
   * @param {object} [opts]
   * @param {boolean} [opts.useBack] — preferir history.back si hubo push
   */
  function close(opts) {
    opts = opts || {};
    ensureShell();

    if (!modalOpen && isListPath(location.pathname)) {
      restoreReturnTitle();
      return;
    }

    var useBack = opts.useBack !== false && openedViaPush;

    if (useBack && openedViaPush) {
      ignorePopstate = false;
      history.back();
      return;
    }

    ignorePopstate = true;
    var target = returnUrl || "/eventos";
    history.replaceState(
      { eventosModal: false, origin: currentOrigin },
      "",
      target
    );
    hideModalShell();
    if (typeof returnScrollY === "number") {
      try {
        window.scrollTo(0, returnScrollY);
      } catch (e) {}
    }
    setTimeout(function () {
      ignorePopstate = false;
    }, 0);
  }

  function onPopState() {
    if (ignorePopstate) return;
    var slug = parseSlugFromPath(location.pathname);
    if (slug) {
      open({
        slug: slug,
        origin: "direct",
        fromHistory: true,
        returnUrl: returnUrl,
        returnTitle: returnTitle,
        returnScrollY: returnScrollY,
      });
      return;
    }
    if (isListPath(location.pathname)) {
      if (modalOpen) hideModalShell();
      else restoreReturnTitle();
      return;
    }
    /* Preparado para 3C.3 (origin=home): cerrar al volver fuera del slug. */
    if (modalOpen && currentOrigin === "home" && !slug) {
      hideModalShell();
    }
  }

  function onKeyDown(e) {
    if (!modalOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close({ useBack: openedViaPush });
      return;
    }
    if (e.key !== "Tab") return;
    lastFocusable = getFocusable(modalPanel);
    if (!lastFocusable.length) {
      e.preventDefault();
      return;
    }
    var first = lastFocusable[0];
    var last = lastFocusable[lastFocusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onModalClick(e) {
    if (!modalRoot) return;
    if (e.target === modalRoot || e.target.hasAttribute("data-events-modal-backdrop")) {
      close({ useBack: openedViaPush });
      return;
    }
    if (e.target.closest("[data-events-modal-close]")) {
      close({ useBack: openedViaPush });
      return;
    }
    if (e.target.closest("[data-events-go-list]")) {
      close({ useBack: false });
    }
  }

  function bindListeners() {
    if (listenersBound || !modalRoot) return;
    listenersBound = true;
    modalRoot.addEventListener("click", onModalClick);
    window.addEventListener("popstate", onPopState);
    document.addEventListener("keydown", onKeyDown);
  }

  global.RcEventoDetalle = {
    open: open,
    close: close,
    isOpen: function () {
      return modalOpen;
    },
    currentSlug: function () {
      return currentSlug;
    },
    parseSlugFromPath: parseSlugFromPath,
    isListPath: isListPath,
    ensureShell: ensureShell,
    TITLE_LIST: TITLE_LIST,
  };
})(typeof window !== "undefined" ? window : globalThis);
