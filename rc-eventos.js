/**
 * Listado + detalle modal /eventos — API pública Admin.
 * Fuente de verdad: Admin. Sin Firebase en el navegador.
 */
(function () {
  "use strict";

  var API_LIST =
    "https://admin.reconexionconsciente.es/api/publico/eventos?estado=proximos&limit=50";
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

  var listEl = document.querySelector("[data-events-page-list]");
  var shellEl = document.querySelector("[data-events-page]");
  var modalRoot = document.querySelector("[data-events-modal]");
  if (!listEl || !shellEl || !modalRoot) return;

  var modalPanel = modalRoot.querySelector("[data-events-modal-panel]");
  var modalBody = modalRoot.querySelector("[data-events-modal-body]");
  var modalCloseBtns = modalRoot.querySelectorAll("[data-events-modal-close]");

  var modalOpen = false;
  var currentSlug = "";
  /** true si abrimos con pushState desde el listado (history.back seguro). */
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

  function setListTitle() {
    document.title = TITLE_LIST;
  }

  function setEventTitle(titulo) {
    var t = String(titulo || "").trim();
    document.title = t ? t + " | Reconexión Consciente" : TITLE_LIST;
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

  function getFocusable(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (el) {
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
    modalRoot.hidden = false;
    modalRoot.setAttribute("aria-hidden", "false");
    lockBodyScroll();
    modalOpen = true;
  }

  function hideModalShell() {
    modalRoot.hidden = true;
    modalRoot.setAttribute("aria-hidden", "true");
    unlockBodyScroll();
    modalOpen = false;
    currentSlug = "";
    openedViaPush = false;
    modalBody.innerHTML = "";
    setListTitle();
    if (lastTrigger && typeof lastTrigger.focus === "function") {
      try {
        lastTrigger.focus();
      } catch (e) {}
    }
    lastTrigger = null;
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
      "<h2 id=\"rc-events-modal-title\">Este encuentro no está disponible.</h2>" +
      '<p>Puede haber finalizado su publicación o el enlace ya no es válido.</p>' +
      '<button type="button" class="rc-btn rc-btn-gold" data-events-go-list>Ver próximos encuentros</button>' +
      "</div>";
  }

  function renderModalError() {
    setEventTitle("Encuentro");
    modalBody.innerHTML =
      '<div class="rc-events-modal-state">' +
      '<h2 id="rc-events-modal-title">No hemos podido cargar este encuentro en este momento.</h2>' +
      '<p>Inténtalo de nuevo un poco más tarde.</p>' +
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

  function openDetalle(slug, opts) {
    opts = opts || {};
    var clean = String(slug || "").trim();
    if (!clean) return;

    if (opts.fromClick) {
      lastTrigger = opts.trigger || null;
      if (!modalOpen || currentSlug !== clean) {
        history.pushState({ eventosModal: true, slug: clean }, "", "/eventos/" + encodeURIComponent(clean));
        openedViaPush = true;
      }
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
        console.error("[eventos] Detalle no disponible:", err);
        renderModalError();
        focusModal();
      });
  }

  function closeToList(opts) {
    opts = opts || {};
    if (!modalOpen && isListPath(location.pathname)) {
      setListTitle();
      return;
    }

    if (opts.useBack && openedViaPush) {
      ignorePopstate = false;
      history.back();
      return;
    }

    ignorePopstate = true;
    history.replaceState({ eventosModal: false }, "", "/eventos");
    hideModalShell();
    setTimeout(function () {
      ignorePopstate = false;
    }, 0);
  }

  function onPopState() {
    if (ignorePopstate) return;
    var slug = parseSlugFromPath(location.pathname);
    if (slug) {
      openedViaPush = false;
      openDetalle(slug, { fromClick: false });
      return;
    }
    if (isListPath(location.pathname)) {
      if (modalOpen) hideModalShell();
      else setListTitle();
    }
  }

  function onKeyDown(e) {
    if (!modalOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeToList({ useBack: openedViaPush });
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

  listEl.addEventListener("click", function (e) {
    var link = e.target.closest("[data-open-event]");
    if (!link) return;
    e.preventDefault();
    var slug = link.getAttribute("data-open-event");
    openDetalle(slug, { fromClick: true, trigger: link });
  });

  modalRoot.addEventListener("click", function (e) {
    if (e.target === modalRoot || e.target.hasAttribute("data-events-modal-backdrop")) {
      closeToList({ useBack: openedViaPush });
      return;
    }
    if (e.target.closest("[data-events-modal-close]")) {
      closeToList({ useBack: openedViaPush });
      return;
    }
    if (e.target.closest("[data-events-go-list]")) {
      closeToList({ useBack: false });
    }
  });

  Array.prototype.forEach.call(modalCloseBtns, function (btn) {
    btn.addEventListener("click", function () {
      closeToList({ useBack: openedViaPush });
    });
  });

  window.addEventListener("popstate", onPopState);
  document.addEventListener("keydown", onKeyDown);

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

  var initialSlug = parseSlugFromPath(location.pathname);
  cargarLista().then(function () {
    if (initialSlug) {
      openedViaPush = false;
      openDetalle(initialSlug, { fromClick: false });
    }
  });
})();
