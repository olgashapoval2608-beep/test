(function () {
  'use strict';

  // ---- iOS Safari :active fix (touch listeners must exist for :active to fire) ----
  document.addEventListener('touchstart', function () {}, { passive: true });

  // ---- Places dataset (recent + autocomplete suggestions) — Lviv, Ukraine ----
  var PLACES = [
    { title: 'Forum Lviv', subtitle: 'Kniazia Romana St, Lviv' },
    { title: 'Victoria Gardens', subtitle: 'Stryiska St, Lviv' },
    { title: 'Lviv Railway Station', subtitle: 'Chernivetska St, Lviv' },
    { title: 'Lviv Danylo Halytskyi International Airport', subtitle: 'Lyubinska St, Lviv' },
    { title: 'Stryiskyi Park', subtitle: 'Stryiska St, Lviv' }
  ];

  // Preset map coordinates a destination marker can land on (viewBox 0 0 375 300)
  var DEST_PRESETS = [
    { x: 300, y: 230 },
    { x: 80, y: 225 },
    { x: 290, y: 40 },
    { x: 60, y: 95 },
    { x: 330, y: 130 }
  ];

  function hashString(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  // ---- Element refs ----
  var screenEl = document.getElementById('screen-home');
  var sheetViewport = document.getElementById('sheet-viewport');
  var searchTriggerBtn = document.getElementById('search-trigger-btn');
  var searchBackBtn = document.getElementById('search-back-btn');
  var destinationInput = document.getElementById('destination-input');
  var suggestionsList = document.getElementById('suggestions-list');
  var destinationLabel = document.getElementById('destination-label');
  var destinationRowBtn = document.getElementById('destination-row-btn');
  var destinationClearBtn = document.getElementById('destination-clear-btn');
  var recentList = document.getElementById('recent-list');

  var addStopBtn = document.getElementById('add-stop-btn');
  var addstopSheet = document.getElementById('addstop-sheet');
  var addstopScrim = document.getElementById('addstop-scrim');
  var addstopCloseBtn = document.getElementById('addstop-close-btn');
  var stopInput = document.getElementById('stop-input');
  var stopSuggestionsList = document.getElementById('stop-suggestions-list');
  var stopsListEl = document.getElementById('stops-list');

  var menuBtn = document.getElementById('menu-btn');
  var menuDrawer = document.getElementById('menu-drawer');
  var menuScrim = document.getElementById('menu-scrim');
  var menuCloseBtn = document.getElementById('menu-close-btn');

  var profileBtn = document.getElementById('profile-btn');
  var profilePanel = document.getElementById('profile-panel');
  var profileBackBtn = document.getElementById('profile-back-btn');

  var locateBtn = document.getElementById('locate-btn');
  var mapEl = document.getElementById('map');

  var stops = [];

  // ============================================================
  // Bottom-sheet view swap (default <-> search), smooth height morph
  // ============================================================
  function showSheetView(name) {
    var views = sheetViewport.querySelectorAll('.sheet__view');
    var newView = sheetViewport.querySelector('[data-view="' + name + '"]');
    if (!newView) return;

    var newHeight = newView.scrollHeight;
    sheetViewport.style.height = sheetViewport.offsetHeight + 'px';
    // force reflow so the browser registers the starting height before we animate
    void sheetViewport.offsetHeight;

    views.forEach(function (v) {
      v.classList.toggle('is-active', v === newView);
    });

    requestAnimationFrame(function () {
      sheetViewport.style.height = newHeight + 'px';
    });
  }

  sheetViewport.addEventListener('transitionend', function (e) {
    if (e.propertyName === 'height') {
      var active = sheetViewport.querySelector('.sheet__view.is-active');
      if (active) sheetViewport.style.height = active.scrollHeight + 'px';
    }
  });

  function openSearch() {
    showSheetView('search');
    destinationInput.value = '';
    renderSuggestions(suggestionsList, '', function (place) {
      selectDestination(place);
      closeSearch();
    });
    setTimeout(function () { destinationInput.focus(); }, 260);
  }

  function closeSearch() {
    showSheetView('default');
  }

  searchTriggerBtn.addEventListener('click', openSearch);
  destinationRowBtn.addEventListener('click', function (e) {
    if (e.target.closest('#destination-clear-btn')) return;
    openSearch();
  });
  destinationRowBtn.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('#destination-clear-btn')) {
      e.preventDefault();
      openSearch();
    }
  });
  searchBackBtn.addEventListener('click', closeSearch);

  destinationInput.addEventListener('input', function () {
    renderSuggestions(suggestionsList, destinationInput.value, function (place) {
      selectDestination(place);
      closeSearch();
    });
  });

  // ============================================================
  // Suggestions rendering (shared by search view + add-stop sheet)
  // ============================================================
  function renderSuggestions(container, query, onSelect) {
    var q = query.trim().toLowerCase();
    var matches = q
      ? PLACES.filter(function (p) { return p.title.toLowerCase().indexOf(q) !== -1; })
      : PLACES;

    container.innerHTML = '';

    if (!matches.length) {
      var empty = document.createElement('div');
      empty.className = 'suggestions-list__empty';
      empty.textContent = 'No places found';
      container.appendChild(empty);
      return;
    }

    matches.forEach(function (place) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'recent-row';
      row.innerHTML =
        '<span class="recent-row__icon">' +
        '<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M8.5 1.8C5.8 1.8 3.8 3.9 3.8 6.5C3.8 10 8.5 15.2 8.5 15.2C8.5 15.2 13.2 10 13.2 6.5C13.2 3.9 11.2 1.8 8.5 1.8Z" stroke="#70707D" stroke-width="1.5"/><circle cx="8.5" cy="6.5" r="1.7" stroke="#70707D" stroke-width="1.5"/></svg>' +
        '</span>' +
        '<span class="recent-row__text">' +
        '<span class="recent-row__title"></span>' +
        '<span class="recent-row__subtitle"></span>' +
        '</span>';
      row.querySelector('.recent-row__title').textContent = place.title;
      row.querySelector('.recent-row__subtitle').textContent = place.subtitle;
      row.addEventListener('click', function () { onSelect(place); });
      container.appendChild(row);
    });
  }

  // ============================================================
  // Recent places (default view) — click fills destination directly
  // ============================================================
  recentList.addEventListener('click', function (e) {
    var row = e.target.closest('.recent-row');
    if (!row) return;
    selectDestination({ title: row.dataset.title, subtitle: row.dataset.subtitle });
  });

  // ============================================================
  // Destination selection
  // ============================================================
  function selectDestination(place) {
    destinationLabel.textContent = place.title;
    destinationLabel.classList.remove('route-row__title--placeholder');
    destinationClearBtn.hidden = false;
    setDestinationOnMap(place.title);
  }

  function clearDestination() {
    destinationLabel.textContent = 'Enter destination';
    destinationLabel.classList.add('route-row__title--placeholder');
    destinationClearBtn.hidden = true;
    clearDestinationOnMap();
  }

  destinationClearBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    clearDestination();
  });

  // ============================================================
  // Map: destination marker + animated route line
  // ============================================================
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var PICKUP = { x: 191, y: 155 };

  function pickDestinationCoord(seed) {
    var idx = hashString(seed) % DEST_PRESETS.length;
    return DEST_PRESETS[idx];
  }

  function setDestinationOnMap(seed) {
    var svg = document.getElementById('map-svg');
    var group = document.getElementById('dynamic-route');
    group.innerHTML = '';

    var dest = pickDestinationCoord(seed);
    var midX = (PICKUP.x + dest.x) / 2;
    var midY = (PICKUP.y + dest.y) / 2 - 18;
    var d = 'M' + PICKUP.x + ',' + PICKUP.y + ' Q' + midX + ',' + midY + ' ' + dest.x + ',' + dest.y;

    // A subtle route preview, not a committed navigation line — thinner,
    // softly translucent, drawn in with a smooth reveal.
    var route = document.createElementNS(SVG_NS, 'path');
    route.setAttribute('d', d);
    route.setAttribute('fill', 'none');
    route.setAttribute('stroke', '#6C63FF');
    route.setAttribute('stroke-width', '2.5');
    route.setAttribute('stroke-linecap', 'round');
    route.setAttribute('opacity', '0.85');
    group.appendChild(route);

    var length = route.getTotalLength();
    route.style.strokeDasharray = length;
    route.style.strokeDashoffset = length;
    // force reflow, then animate the draw-in
    void route.getBoundingClientRect();
    route.style.transition = 'stroke-dashoffset 620ms ' + 'cubic-bezier(0.4,0,0.2,1)';
    route.style.strokeDashoffset = '0';

    var pin = document.createElementNS(SVG_NS, 'g');
    pin.setAttribute('class', 'dest-pin');
    pin.setAttribute('transform', 'translate(' + dest.x + ',' + dest.y + ')');
    pin.innerHTML =
      '<ellipse cx="0" cy="15" rx="6" ry="2" fill="#1D1D27" opacity="0.15"/>' +
      '<path d="M0,-14 C6,-14 10.5,-9.5 10.5,-4 C10.5,3 0,14 0,14 C0,14 -10.5,3 -10.5,-4 C-10.5,-9.5 -6,-14 0,-14Z" fill="#1D1D27"/>' +
      '<circle cx="0" cy="-4" r="4" fill="#FFFFFF"/>';
    group.appendChild(pin);
  }

  function clearDestinationOnMap() {
    document.getElementById('dynamic-route').innerHTML = '';
  }

  // ============================================================
  // Add stop
  // ============================================================
  function renderStops() {
    stopsListEl.innerHTML = '';
    stops.forEach(function (stop, index) {
      var row = document.createElement('div');
      row.className = 'stop-row';
      row.innerHTML =
        '<span class="stop-row__icon">' +
        '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2V14M2.5 7H13.5" stroke="#6C63FF" stroke-width="1.6" stroke-linecap="round"/></svg>' +
        '</span>' +
        '<span class="stop-row__title"></span>' +
        '<button type="button" class="stop-remove-btn" aria-label="Remove stop">' +
        '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
        '</button>';
      row.querySelector('.stop-row__title').textContent = stop.title;
      row.querySelector('.stop-remove-btn').addEventListener('click', function () {
        stops.splice(index, 1);
        renderStops();
      });
      stopsListEl.appendChild(row);
    });
  }

  // ============================================================
  // Overlay stack (menu / addstop / profile) with real back-button support
  // ============================================================
  var currentOverlay = null;
  var overlays = {
    menu: { panel: menuDrawer, scrim: menuScrim },
    addstop: { panel: addstopSheet, scrim: addstopScrim },
    profile: { panel: profilePanel, scrim: null }
  };

  function applyOverlayState(name) {
    currentOverlay = name;
    Object.keys(overlays).forEach(function (key) {
      var cfg = overlays[key];
      var open = key === name;
      cfg.panel.classList.toggle('is-open', open);
      if (cfg.scrim) cfg.scrim.classList.toggle('is-open', open);
    });
    if (name === 'addstop') {
      stopInput.value = '';
      renderSuggestions(stopSuggestionsList, '', function (place) {
        stops.push(place);
        renderStops();
        closeOverlay();
      });
      setTimeout(function () { stopInput.focus(); }, 260);
    }
  }

  function openOverlay(name) {
    history.pushState({ overlay: name }, '');
    applyOverlayState(name);
  }

  function closeOverlay() {
    if (currentOverlay) {
      history.back();
    }
  }

  window.addEventListener('popstate', function (e) {
    applyOverlayState((e.state && e.state.overlay) || null);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && currentOverlay) closeOverlay();
  });

  menuBtn.addEventListener('click', function () { openOverlay('menu'); });
  menuScrim.addEventListener('click', closeOverlay);
  menuCloseBtn.addEventListener('click', closeOverlay);

  addStopBtn.addEventListener('click', function () { openOverlay('addstop'); });
  addstopScrim.addEventListener('click', closeOverlay);
  addstopCloseBtn.addEventListener('click', closeOverlay);
  stopInput.addEventListener('input', function () {
    renderSuggestions(stopSuggestionsList, stopInput.value, function (place) {
      stops.push(place);
      renderStops();
      closeOverlay();
    });
  });

  profileBtn.addEventListener('click', function () { openOverlay('profile'); });
  profileBackBtn.addEventListener('click', closeOverlay);

  // ============================================================
  // Current-location button — smooth recenter feedback
  // ============================================================
  locateBtn.addEventListener('click', function () {
    locateBtn.style.transform = 'scale(0.9)';
    setTimeout(function () { locateBtn.style.transform = ''; }, 120);

    mapEl.classList.remove('is-recentering');
    void mapEl.offsetWidth; // restart animation if clicked repeatedly
    mapEl.classList.add('is-recentering');
    setTimeout(function () { mapEl.classList.remove('is-recentering'); }, 550);
  });

  // ============================================================
  // Launch splash — a brief branded moment on cold load, like a
  // native app's launch screen, then fades into the interface.
  // ============================================================
  var splash = document.getElementById('splash');
  if (splash) {
    var dismissSplash = function () {
      splash.classList.add('is-hidden');
      setTimeout(function () {
        if (splash.parentNode) splash.parentNode.removeChild(splash);
      }, 400);
    };
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(dismissSplash, prefersReducedMotion ? 0 : 650);
  }
})();
