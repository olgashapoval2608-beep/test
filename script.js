(function () {
  'use strict';

  // ---- iOS Safari :active fix (touch listeners must exist for :active to fire) ----
  document.addEventListener('touchstart', function () {}, { passive: true });

  // ---- Places dataset (recent + autocomplete suggestions) — Lviv, Ukraine ----
  var PLACES = [
    { title: 'Forum Lviv', subtitle: 'Pid Dubom St, Lviv' },
    { title: 'Victoria Gardens', subtitle: 'Stryiska St, Lviv' },
    { title: 'Lviv Railway Station', subtitle: 'Chernivetska St, Lviv' },
    { title: 'Lviv Danylo Halytskyi International Airport', subtitle: 'Lyubinska St, Lviv' },
    { title: 'Stryiskyi Park', subtitle: 'Stryiska St, Lviv' }
  ];

  // Real approximate coordinates for Lviv landmarks
  var LVIV_CENTER = [49.8419, 24.0315]; // Rynok Square (pickup)
  var PLACE_COORDS = {
    'Forum Lviv': [49.8494, 24.0224],
    'Victoria Gardens': [49.8075, 23.9783],
    'Lviv Railway Station': [49.8392, 23.9945],
    'Lviv Danylo Halytskyi International Airport': [49.8125, 23.9561],
    'Stryiskyi Park': [49.8226, 24.0234]
  };

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

  var continueBtn = document.getElementById('continue-btn');
  var rideBackBtn = document.getElementById('ride-back-btn');
  var rideDestinationText = document.getElementById('ride-destination-text');
  var rideList = document.getElementById('ride-list');
  var confirmRideBtn = document.getElementById('confirm-ride-btn');
  var confirmRideLabel = document.getElementById('confirm-ride-label');
  var confirmRidePrice = document.getElementById('confirm-ride-price');
  var promoInput = document.getElementById('promo-input');
  var promoApplyBtn = document.getElementById('promo-apply-btn');
  var promoFeedback = document.getElementById('promo-feedback');
  var promoField = document.getElementById('promo-field');
  var noteInput = document.getElementById('note-input');

  var paymentTriggerBtn = document.getElementById('payment-trigger-btn');
  var paymentSheet = document.getElementById('payment-sheet');
  var paymentScrim = document.getElementById('payment-scrim');
  var paymentCloseBtn = document.getElementById('payment-close-btn');
  var paymentList = document.getElementById('payment-list');
  var paymentMethodLabel = document.getElementById('payment-method-label');

  var etaPill = document.getElementById('eta-pill');
  var liveEtaEl = document.getElementById('live-eta');
  var driverBackBtn = document.getElementById('driver-back-btn');
  var callBtn = document.getElementById('call-btn');
  var messageBtn = document.getElementById('message-btn');
  var cancelRideBtn = document.getElementById('cancel-ride-btn');
  var cancelSheet = document.getElementById('cancel-sheet');
  var cancelScrim = document.getElementById('cancel-scrim');
  var keepRideBtn = document.getElementById('keep-ride-btn');
  var confirmCancelBtn = document.getElementById('confirm-cancel-btn');
  var messageSheet = document.getElementById('message-sheet');
  var messageScrim = document.getElementById('message-scrim');
  var messageCloseBtn = document.getElementById('message-close-btn');
  var driverMessageInput = document.getElementById('driver-message-input');
  var sendMessageBtn = document.getElementById('send-message-btn');
  var driverTripTitle = document.getElementById('driver-trip-title');
  var driverTripPrice = document.getElementById('driver-trip-price');
  var driverTripPayment = document.getElementById('driver-trip-payment');
  var toast = document.getElementById('toast');
  var toastMessage = document.getElementById('toast-message');

  var stops = [];
  var selectedDestination = null;
  var selectedRide = { name: 'Economy', basePrice: 8.4, price: '£8.40', eta: 3 };
  var promoApplied = false;
  var etaCountdownTimer = null;
  var toastTimer = null;

  function showToast(message) {
    toastMessage.textContent = message;
    toast.hidden = false;
    requestAnimationFrame(function () { toast.classList.add('is-visible'); });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () { toast.hidden = true; }, 240);
    }, 2200);
  }

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
    selectedDestination = place;
    destinationLabel.textContent = place.title;
    destinationLabel.classList.remove('route-row__title--placeholder');
    destinationClearBtn.hidden = false;
    continueBtn.hidden = false;
    setDestinationOnMap(place.title, place.coords);
  }

  function clearDestination() {
    selectedDestination = null;
    destinationLabel.textContent = 'Enter destination';
    destinationLabel.classList.add('route-row__title--placeholder');
    destinationClearBtn.hidden = true;
    continueBtn.hidden = true;
    clearDestinationOnMap();
  }

  destinationClearBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    clearDestination();
  });

  // ============================================================
  // Real map — Leaflet + free Carto Positron tiles (OSM data, no key)
  // ============================================================
  var map = L.map('leaflet-map', {
    zoomControl: false,
    attributionControl: true,
    scrollWheelZoom: false,
    tap: true
  }).setView(LVIV_CENTER, 14);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  var pickupIcon = L.divIcon({
    className: 'viode-marker',
    html: '<div class="viode-pulse-marker"><span class="viode-pulse-marker__ring"></span><span class="viode-pulse-marker__ring" style="animation-delay:1.4s;"></span><span class="viode-pulse-marker__dot"></span></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
  L.marker(LVIV_CENTER, { icon: pickupIcon, keyboard: false, interactive: false }).addTo(map);

  var destMarker = null;
  var routeLine = null;

  function quadraticCurve(p0, p1, ctrl, steps) {
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var lat = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * ctrl[0] + t * t * p1[0];
      var lng = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * ctrl[1] + t * t * p1[1];
      pts.push([lat, lng]);
    }
    return pts;
  }

  function setDestinationOnMap(title, coordinates) {
    var dest = coordinates || PLACE_COORDS[title];
    if (!dest) return;

    if (destMarker) map.removeLayer(destMarker);
    if (routeLine) map.removeLayer(routeLine);

    var destIcon = L.divIcon({
      className: 'viode-dest-marker',
      html: '<svg class="viode-dest-pin" viewBox="0 0 22 26" xmlns="http://www.w3.org/2000/svg"><path d="M11,0 C17,0 22,4.7 22,10.5 C22,18 11,26 11,26 C11,26 0,18 0,10.5 C0,4.7 5,0 11,0Z" fill="#1D1D27"/><circle cx="11" cy="10.5" r="4.5" fill="#FFFFFF"/></svg>',
      iconSize: [22, 26],
      iconAnchor: [11, 26]
    });
    destMarker = L.marker(dest, { icon: destIcon, keyboard: false, interactive: false }).addTo(map);

    // Believable curved route (no external routing service) — a gentle
    // arc between pickup and destination, not a literal street path.
    var mid = [(LVIV_CENTER[0] + dest[0]) / 2, (LVIV_CENTER[1] + dest[1]) / 2];
    var dx = dest[0] - LVIV_CENTER[0];
    var dy = dest[1] - LVIV_CENTER[1];
    var ctrl = [mid[0] - dy * 0.35, mid[1] + dx * 0.35];
    var curvePoints = quadraticCurve(LVIV_CENTER, dest, ctrl, 32);

    routeLine = L.polyline(curvePoints, {
      color: '#6C63FF',
      weight: 3.5,
      opacity: 0.88,
      lineCap: 'round'
    }).addTo(map);

    requestAnimationFrame(function () {
      var pathEl = routeLine.getElement();
      if (pathEl && pathEl.getTotalLength) {
        var length = pathEl.getTotalLength();
        pathEl.style.strokeDasharray = length;
        pathEl.style.strokeDashoffset = length;
        void pathEl.getBoundingClientRect();
        pathEl.style.transition = 'stroke-dashoffset 700ms cubic-bezier(0.4,0,0.2,1)';
        pathEl.style.strokeDashoffset = '0';
      }
    });

    map.flyToBounds([LVIV_CENTER, dest], { paddingTopLeft: [40, 100], paddingBottomRight: [40, 260], duration: 0.9 });
  }

  map.on('click', function (event) {
    var activeView = sheetViewport.querySelector('.sheet__view.is-active');
    if (!activeView || activeView.dataset.view !== 'default') return;
    selectDestination({
      title: 'Pinned destination',
      subtitle: 'Custom map point, Lviv',
      coords: [event.latlng.lat, event.latlng.lng]
    });
    showToast('Destination set from map');
  });

  function clearDestinationOnMap() {
    if (destMarker) { map.removeLayer(destMarker); destMarker = null; }
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    map.flyTo(LVIV_CENTER, 14, { duration: 0.7 });
  }

  function invalidateMapSize() {
    setTimeout(function () { map.invalidateSize(); }, 320);
  }
  sheetViewport.addEventListener('transitionend', function (e) {
    if (e.propertyName === 'height') invalidateMapSize();
  });

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
    profile: { panel: profilePanel, scrim: null },
    payment: { panel: paymentSheet, scrim: paymentScrim },
    message: { panel: messageSheet, scrim: messageScrim },
    cancel: { panel: cancelSheet, scrim: cancelScrim }
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
    if (name === 'message') {
      driverMessageInput.value = '';
      driverMessageInput.classList.remove('is-invalid');
      setTimeout(function () { driverMessageInput.focus(); }, 260);
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
  menuDrawer.querySelector('.drawer__nav').addEventListener('click', function (e) {
    var item = e.target.closest('.drawer__item');
    if (!item) return;
    var label = item.textContent.trim();
    closeOverlay();
    if (label === 'Home') {
      resetTrip();
      showToast('Back to pickup');
      return;
    }
    showToast(label + ' is ready in your VioRide account');
  });

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
  profilePanel.querySelector('.profile-panel__list').addEventListener('click', function (e) {
    var row = e.target.closest('.profile-row');
    if (!row) return;
    showToast(row.textContent.trim());
  });

  // ============================================================
  // Current-location button — smooth recenter feedback
  // ============================================================
  locateBtn.addEventListener('click', function () {
    locateBtn.style.transform = 'scale(0.9)';
    setTimeout(function () { locateBtn.style.transform = ''; }, 120);
    map.flyTo(LVIV_CENTER, Math.max(map.getZoom(), 14), { duration: 0.7 });
  });

  // ============================================================
  // Screen 2 — ride selection
  // ============================================================
  continueBtn.addEventListener('click', function () {
    if (!selectedDestination) return;
    rideDestinationText.textContent = selectedDestination.title;
    showSheetView('ride');
    invalidateMapSize();
  });

  rideBackBtn.addEventListener('click', function () {
    showSheetView('default');
    invalidateMapSize();
  });

  function updateConfirmButton() {
    confirmRideLabel.textContent = 'Confirm ' + selectedRide.name;
    confirmRidePrice.textContent = selectedRide.price;
  }

  function getFare(basePrice) {
    return promoApplied ? basePrice * 0.8 : basePrice;
  }

  function formatFare(amount) {
    return '£' + amount.toFixed(2);
  }

  function syncRidePrices() {
    rideList.querySelectorAll('.ride-card').forEach(function (card) {
      var basePrice = Number(card.dataset.basePrice);
      var price = formatFare(getFare(basePrice));
      card.dataset.price = price;
      card.querySelector('.ride-card__price').textContent = price;
      if (card.classList.contains('is-selected')) {
        selectedRide.price = price;
        selectedRide.basePrice = basePrice;
      }
    });
    updateConfirmButton();
  }

  rideList.addEventListener('click', function (e) {
    var card = e.target.closest('.ride-card');
    if (!card) return;
    rideList.querySelectorAll('.ride-card').forEach(function (c) { c.classList.remove('is-selected'); });
    card.classList.add('is-selected');
    selectedRide = {
      name: card.dataset.ride,
      basePrice: Number(card.dataset.basePrice),
      price: card.dataset.price,
      eta: Number(card.dataset.eta)
    };
    updateConfirmButton();
  });

  function applyPromo() {
    var code = promoInput.value.trim().toUpperCase();
    promoInput.value = code;
    if (code === 'VIO20') {
      promoApplied = true;
      promoField.classList.remove('is-invalid');
      promoField.classList.add('is-valid');
      promoFeedback.className = 'field-feedback is-success';
      promoFeedback.textContent = '20% off applied';
      promoApplyBtn.textContent = 'Applied';
      syncRidePrices();
      showToast('VIO20 saved you 20%');
      return;
    }
    promoApplied = false;
    promoField.classList.remove('is-valid');
    promoField.classList.add('is-invalid');
    promoFeedback.className = 'field-feedback is-error';
    promoFeedback.textContent = code ? 'Try VIO20 for this prototype' : 'Enter a promo code';
    promoApplyBtn.textContent = 'Apply';
    syncRidePrices();
  }

  promoApplyBtn.addEventListener('click', applyPromo);
  promoInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyPromo();
    }
  });
  promoInput.addEventListener('input', function () {
    if (!promoApplied) {
      promoField.classList.remove('is-invalid');
      promoFeedback.className = 'field-feedback';
      promoFeedback.textContent = '';
    }
  });

  paymentTriggerBtn.addEventListener('click', function () { openOverlay('payment'); });
  paymentCloseBtn.addEventListener('click', closeOverlay);
  paymentScrim.addEventListener('click', closeOverlay);
  paymentList.addEventListener('click', function (e) {
    var opt = e.target.closest('.payment-option');
    if (!opt) return;
    paymentList.querySelectorAll('.payment-option').forEach(function (o) { o.classList.remove('is-selected'); });
    opt.classList.add('is-selected');
    paymentMethodLabel.textContent = opt.dataset.method;
    closeOverlay();
  });

  messageCloseBtn.addEventListener('click', closeOverlay);
  messageScrim.addEventListener('click', closeOverlay);
  sendMessageBtn.addEventListener('click', function () {
    var message = driverMessageInput.value.trim();
    if (!message) {
      driverMessageInput.classList.add('is-invalid');
      driverMessageInput.focus();
      return;
    }
    closeOverlay();
    setTimeout(function () { showToast('Message sent to Alex'); }, 180);
  });

  // ============================================================
  // Screen 3 — driver coming
  // ============================================================
  function startEtaCountdown() {
    var minutesLeft = 4;
    liveEtaEl.textContent = minutesLeft;
    if (etaCountdownTimer) clearInterval(etaCountdownTimer);
    etaCountdownTimer = setInterval(function () {
      if (minutesLeft > 1) {
        minutesLeft -= 1;
        liveEtaEl.textContent = minutesLeft;
      }
    }, 8000);
  }

  confirmRideBtn.addEventListener('click', function () {
    driverTripTitle.textContent = selectedRide.name + ' to ' + selectedDestination.title;
    driverTripPrice.textContent = selectedRide.price;
    driverTripPayment.textContent = paymentMethodLabel.textContent;
    showSheetView('driver');
    etaPill.hidden = false;
    startEtaCountdown();
    invalidateMapSize();
  });

  callBtn.addEventListener('click', function () {
    callBtn.style.transform = 'scale(0.95)';
    showToast('Calling Alex K…');
    setTimeout(function () {
      callBtn.style.transform = '';
      showToast('Call connected');
    }, 900);
  });
  messageBtn.addEventListener('click', function () { openOverlay('message'); });

  driverBackBtn.addEventListener('click', function () {
    etaPill.hidden = true;
    if (etaCountdownTimer) { clearInterval(etaCountdownTimer); etaCountdownTimer = null; }
    showSheetView('ride');
    invalidateMapSize();
  });

  function resetTrip() {
    // Normalize overlay/history state first so a fast cancel immediately after
    // closing a modal cannot allow a delayed popstate to reopen that modal.
    history.replaceState(null, '');
    applyOverlayState(null);
    clearDestination();
    stops = [];
    renderStops();
    selectedRide = { name: 'Economy', basePrice: 8.4, price: '£8.40', eta: 3 };
    rideList.querySelectorAll('.ride-card').forEach(function (c, i) { c.classList.toggle('is-selected', i === 0); });
    promoApplied = false;
    promoInput.value = '';
    promoField.classList.remove('is-valid', 'is-invalid');
    promoFeedback.className = 'field-feedback';
    promoFeedback.textContent = '';
    promoApplyBtn.textContent = 'Apply';
    syncRidePrices();
    noteInput.value = '';
    paymentMethodLabel.textContent = 'Visa •••• 4242';
    paymentList.querySelectorAll('.payment-option').forEach(function (o, i) { o.classList.toggle('is-selected', i === 0); });
    etaPill.hidden = true;
    if (etaCountdownTimer) { clearInterval(etaCountdownTimer); etaCountdownTimer = null; }
    showSheetView('default');
    invalidateMapSize();
  }

  cancelRideBtn.addEventListener('click', function () { openOverlay('cancel'); });
  cancelScrim.addEventListener('click', closeOverlay);
  keepRideBtn.addEventListener('click', closeOverlay);
  confirmCancelBtn.addEventListener('click', function () {
    resetTrip();
    showToast('Ride cancelled');
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
