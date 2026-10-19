(function () {
  var DATA_URL = '/DataStories/data/eras.json';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOLD_LABEL = {
    empire: 'Imperial hold',
    city: 'A city or colony',
    contested: 'Contested',
    transit: 'Open passage',
    regime: 'Treaty regime',
    shut: 'No through route'
  };

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function yearLabel(y) {
    if (y < 0) return Math.abs(y) + ' BCE';
    return y + ' CE';
  }

  function eraById(data, id) {
    for (var i = 0; i < data.eras.length; i++) if (data.eras[i].id === id) return data.eras[i];
    return null;
  }

  function eraForYear(data, year) {
    var eras = data.eras;
    for (var i = 0; i < eras.length; i++) {
      if (year >= eras[i].start && year <= eras[i].end) return eras[i];
    }
    return year < eras[0].start ? eras[0] : eras[eras.length - 1];
  }

  function boot() {
    var root = document.getElementById('atlas-root');
    if (!root) return;
    var mode = root.getAttribute('data-atlas') || 'lobby';
    fetch(DATA_URL).then(function (r) {
      if (!r.ok) throw new Error('bad status');
      return r.json();
    }).then(function (data) {
      if (mode === 'story') mountStory(root, data);
      else mountLobby(root, data);
    }).catch(function () {
      root.appendChild(el('p', 'atlas-error', 'The story data did not load. Refresh the page.'));
    });
  }

  function makeMap(container) {
    var map = L.map(container, {
      minZoom: 3,
      maxZoom: 8,
      maxBounds: [[6, -18], [52, 70]],
      maxBoundsViscosity: 0.85,
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true
    });
    map.setView([32, 30], 4);
    var tiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 16
    });
    tiles.addTo(map);
    var errors = 0;
    var note = container.parentNode.querySelector('.tile-note');
    tiles.on('tileerror', function () {
      errors += 1;
      if (errors === 8 && note) {
        note.textContent = 'Map tiles did not load. The briefing beside the map still works. Check the network and reload.';
        note.classList.add('is-warn');
      }
    });
    container.addEventListener('click', function () {
      if (map.scrollWheelZoom) map.scrollWheelZoom.enable();
    });
    if (window.ResizeObserver) {
      new ResizeObserver(function () { map.invalidateSize(); }).observe(container);
    }
    setTimeout(function () { map.invalidateSize(); }, 200);
    return map;
  }

  function MapState(data, map, onSelect) {
    this.data = data;
    this.map = map;
    this.onSelect = onSelect;
    this.layers = L.layerGroup().addTo(map);
    this.filters = { ports: true, routes: true, conflicts: true, migration: true, straits: true, cables: true };
    this.era = null;
    this.stage = false;
  }

  MapState.prototype.draw = function (era, stage) {
    this.era = era;
    this.stage = !!stage;
    var self = this;
    this.layers.clearLayers();
    var bounds = [];
    function add(latlng) { bounds.push(latlng); }

    if (!stage && this.filters.routes) {
      (era.routes || []).forEach(function (r) {
        var line = L.polyline(r.path, { color: '#c9a84c', weight: 2.5, opacity: 0.9 });
        line.on('click', function () { self.onSelect({ kind: 'Route', title: r.name, text: r.commodity }); });
        line.addTo(self.layers);
        r.path.forEach(add);
      });
    }
    if (!stage && this.filters.cables && era.cables) {
      era.cables.forEach(function (r) {
        var line = L.polyline(r.path, { color: '#7dcea0', weight: 1.5, opacity: 0.85, dashArray: '2 6' });
        line.on('click', function () { self.onSelect({ kind: 'Cable corridor', title: r.name, text: r.note }); });
        line.addTo(self.layers);
        r.path.forEach(add);
      });
    }
    if (!stage && this.filters.migration) {
      (era.migration || []).forEach(function (m) {
        if (!m.path) return;
        var line = L.polyline(m.path, { color: '#f5a623', weight: 2, opacity: 0.85, dashArray: '7 8' });
        line.on('click', function () { self.onSelect({ kind: 'Displacement', title: m.name, text: m.who + '. ' + m.note }); });
        line.addTo(self.layers);
        m.path.forEach(add);
      });
    }
    if (this.filters.straits) {
      this.data.straits.forEach(function (s) {
        var info = (era.straits && era.straits[s.id]) || { who: '', hold: 'transit' };
        var marker = L.marker([s.lat, s.lng], {
          icon: L.divIcon({ className: 'strait-icon hold-' + info.hold, html: '<span></span>', iconSize: [14, 14], iconAnchor: [7, 7] }),
          keyboard: true,
          title: s.name
        });
        marker.on('click', function () {
          self.onSelect({ kind: 'Strait · ' + (HOLD_LABEL[info.hold] || ''), title: s.name, text: stage ? 'The door stays. The holder changes.' : info.who });
        });
        marker.addTo(self.layers);
        var shapesTheZoom = stage || (info.hold !== 'transit' && info.hold !== 'shut');
        if (shapesTheZoom) add([s.lat, s.lng]);
      });
    }
    if (!stage && this.filters.ports) {
      (era.ports || []).forEach(function (p) {
        var marker = L.circleMarker([p.lat, p.lng], {
          radius: 6, color: '#06210c', weight: 1, fillColor: '#4fd962', fillOpacity: 0.95
        });
        marker.on('click', function () { self.onSelect({ kind: 'Port · ' + p.tag, title: p.name, text: p.note }); });
        marker.addTo(self.layers);
        add([p.lat, p.lng]);
      });
    }
    if (!stage && this.filters.conflicts) {
      (era.conflicts || []).forEach(function (c) {
        if (c.lat == null) return;
        var marker = L.circleMarker([c.lat, c.lng], {
          radius: 6, color: '#3b0d0d', weight: 1, fillColor: '#e74c3c', fillOpacity: 0.9
        });
        marker.on('click', function () { self.onSelect({ kind: 'Conflict · ' + c.year, title: c.name, text: c.note }); });
        marker.addTo(self.layers);
        add([c.lat, c.lng]);
      });
    }

    if (bounds.length) {
      this.map.fitBounds(L.latLngBounds(bounds).pad(0.18), {
        animate: !reduced,
        duration: 0.6,
        maxZoom: 6,
        padding: [28, 28]
      });
    }
  };

  function fillDetail(node, item) {
    node.hidden = false;
    node.innerHTML = '';
    var head = el('div', 'detail-head');
    head.appendChild(el('p', 'detail-kicker', item.kind));
    var close = el('button', 'detail-close', 'Close');
    close.type = 'button';
    close.addEventListener('click', function () { node.hidden = true; });
    head.appendChild(close);
    node.appendChild(head);
    node.appendChild(el('h3', null, item.title));
    node.appendChild(el('p', null, item.text));
  }

  function renderLayers(bar, state, era) {
    bar.innerHTML = '';
    var specs = [
      ['straits', 'Straits'],
      ['ports', 'Ports'],
      ['routes', 'Routes'],
      ['conflicts', 'Conflicts'],
      ['migration', 'Displacement'],
      ['cables', 'Cables']
    ];
    specs.forEach(function (spec) {
      var key = spec[0];
      var count = key === 'straits' ? state.data.straits.length
        : key === 'cables' ? ((era && era.cables) || []).length
        : ((era && era[key]) || []).length;
      if (key === 'migration') count = (era && era.migration) ? era.migration.length : 0;
      var b = el('button', 'chip' + (state.filters[key] ? ' is-on' : ''), spec[1] + ' ' + count);
      b.type = 'button';
      b.setAttribute('aria-pressed', state.filters[key] ? 'true' : 'false');
      if (!state.stage && count === 0 && key !== 'straits') {
        b.disabled = true;
        b.classList.add('is-off');
      }
      b.addEventListener('click', function () {
        state.filters[key] = !state.filters[key];
        state.draw(state.era, state.stage);
        renderLayers(bar, state, state.era);
      });
      bar.appendChild(b);
    });
  }

  function renderCommodities(host, era) {
    host.innerHTML = '';
    host.appendChild(el('p', 'panel-title', 'Schematic cargo mix'));
    var bars = el('div', 'bars');
    era.commodities.forEach(function (c) {
      var row = el('div', 'bar-row');
      row.appendChild(el('span', 'bar-name', c.name));
      var track = el('span', 'bar-track');
      var fill = el('span', 'bar-fill');
      fill.style.width = c.share + '%';
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('span', 'bar-pct', String(c.share)));
      bars.appendChild(row);
    });
    host.appendChild(bars);
    host.appendChild(el('p', 'chart-note', 'An index for comparison across eras, not a customs table. ' + era.commodities.map(function (c) { return c.name + ': ' + c.note; }).join(' ')));
  }

  function renderTriad(host, era) {
    host.innerHTML = '';
    [['Moved', era.triad.moved], ['At risk', era.triad.risked], ['Financed by', era.triad.financed]].forEach(function (pair) {
      var card = el('div', 'triad-card');
      card.appendChild(el('p', 'panel-title', pair[0]));
      card.appendChild(el('p', null, pair[1]));
      host.appendChild(card);
    });
  }

  function renderTimeline(host, data, api) {
    host.innerHTML = '';
    var top = el('div', 'time-top');
    var play = el('button', 'time-play', 'Play');
    play.type = 'button';
    play.setAttribute('aria-pressed', 'false');
    var label = el('p', 'time-label', '');
    top.appendChild(play);
    top.appendChild(label);
    host.appendChild(top);

    var range = el('input', 'time-range');
    range.type = 'range';
    range.min = String(data.eras[0].start);
    range.max = String(data.eras[data.eras.length - 1].end);
    range.step = '5';
    host.appendChild(range);

    var ticks = el('div', 'time-ticks');
    data.eras.forEach(function (era) {
      var b = el('button', 'tick', era.name);
      b.type = 'button';
      b.dataset.id = era.id;
      b.addEventListener('click', function () { api.stop(); api.setYear(era.focus, 'tick'); });
      ticks.appendChild(b);
    });
    host.appendChild(ticks);

    function paint() {
      var era = api.currentEra();
      var stage = api.isStage();
      range.value = String(api.currentYear());
      label.textContent = stage && api.mode === 'story'
        ? 'The straits. Drag the line, or scroll into a period.'
        : era.name + ' · ' + yearLabel(api.currentYear()) + ' · ' + era.range;
      range.setAttribute('aria-valuetext', label.textContent);
      ticks.querySelectorAll('.tick').forEach(function (t) {
        t.classList.toggle('is-on', !stage && t.dataset.id === era.id);
        t.setAttribute('aria-current', (!stage && t.dataset.id === era.id) ? 'true' : 'false');
      });
      play.textContent = api.isPlaying() ? 'Pause' : 'Play';
      play.setAttribute('aria-pressed', api.isPlaying() ? 'true' : 'false');
    }

    range.addEventListener('input', function () {
      api.stop();
      api.setYear(Number(range.value), 'slider');
    });
    play.addEventListener('click', function () { api.toggle(); });
    api.onPaint(paint);
    paint();
  }

  function renderMatrix(host, data, api) {
    host.innerHTML = '';
    host.appendChild(el('p', 'section-label', 'Who held the door'));
    host.appendChild(el('h2', null, 'One sea, seven gates'));
    host.appendChild(el('p', 'chart-note', 'Each cell is the settled pattern of that era, not every reversal inside it. Select a row to move the map.'));
    var wrap = el('div', 'matrix-scroll');
    var table = el('table', 'matrix');
    var thead = el('thead');
    var hr = el('tr');
    hr.appendChild(el('th', null, 'Period'));
    data.straits.forEach(function (s) { hr.appendChild(el('th', null, s.name)); });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tb = el('tbody');
    data.eras.forEach(function (era) {
      var tr = el('tr');
      tr.dataset.id = era.id;
      var th = el('th', null, era.name);
      var btn = el('button', 'matrix-jump', era.name);
      btn.type = 'button';
      th.textContent = '';
      th.appendChild(btn);
      btn.addEventListener('click', function () { api.stop(); api.setYear(era.focus, 'matrix'); });
      tr.appendChild(th);
      data.straits.forEach(function (s) {
        var info = era.straits[s.id];
        var td = el('td', 'hold-' + info.hold, info.who);
        td.title = HOLD_LABEL[info.hold] || '';
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    wrap.appendChild(table);
    host.appendChild(wrap);
    var legend = el('ul', 'hold-legend');
    Object.keys(HOLD_LABEL).forEach(function (k) {
      var li = el('li', 'hold-' + k, HOLD_LABEL[k]);
      legend.appendChild(li);
    });
    host.appendChild(legend);
    api.onPaint(function () {
      var id = api.isStage() ? '' : api.currentEra().id;
      tb.querySelectorAll('tr').forEach(function (tr) {
        tr.classList.toggle('is-on', tr.dataset.id === id);
      });
    });
  }

  function renderRegister(host, data) {
    host.innerHTML = '';
    host.appendChild(el('p', 'section-label', 'Asset register'));
    host.appendChild(el('h2', null, 'What this page knows, and what it is waiting for'));
    host.appendChild(el('p', 'section-lead', 'The narrative is editorial. The empty rows are a slot for a Sentinella asset database. When a measured series is attached, mark it measured. Do not drop a commercial cable map or an invented time series into a slot.'));
    var table = el('table', 'register');
    var thead = el('thead');
    var hr = el('tr');
    ['Source', 'Status', 'Covers', 'Note'].forEach(function (h) { hr.appendChild(el('th', null, h)); });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tb = el('tbody');
    data.assetSources.forEach(function (s) {
      var tr = el('tr');
      var name = el('td');
      name.appendChild(el('strong', null, s.title));
      name.appendChild(el('span', 'reg-pub', s.publisher));
      tr.appendChild(name);
      tr.appendChild(el('td', 'status-' + s.status, s.status === 'awaiting' ? 'Awaiting dataset' : 'Editorial'));
      tr.appendChild(el('td', null, s.covers));
      tr.appendChild(el('td', null, s.note));
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    var wrap = el('div', 'matrix-scroll');
    wrap.appendChild(table);
    host.appendChild(wrap);
  }

  function controller(data, mode) {
    var year = mode === 'lobby' ? 2024 : data.eras[0].focus;
    var stage = mode === 'story';
    var playing = false;
    var timer = null;
    var painters = [];
    var listeners = [];
    var lockUntil = 0;
    var drawnKey = '';
    var api = {};
    api.mode = mode;
    api.currentYear = function () { return year; };
    api.currentEra = function () { return eraForYear(data, year); };
    api.isStage = function () { return stage; };
    api.isPlaying = function () { return playing; };
    api.onPaint = function (fn) { painters.push(fn); };
    api.onChange = function (fn) { listeners.push(fn); };
    api.lock = function (ms) { lockUntil = Date.now() + ms; };
    api.locked = function () { return Date.now() < lockUntil; };
    function emit(mapChanged) {
      painters.forEach(function (fn) { fn(); });
      if (mapChanged) listeners.forEach(function (fn) { fn(api.currentEra(), stage); });
    }
    function scrollTo(id) {
      var node = document.getElementById(id);
      if (!node || mode !== 'story') return;
      api.lock(reduced ? 500 : 1000);
      requestAnimationFrame(function () {
        node.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      });
    }
    api.setYear = function (y, origin) {
      year = Math.max(data.eras[0].start, Math.min(data.eras[data.eras.length - 1].end, y));
      var wasStage = stage;
      stage = false;
      var key = api.currentEra().id;
      emit(wasStage || drawnKey !== key);
      drawnKey = key;
      if (origin !== 'scroll' && origin !== 'init') scrollTo('chapter-' + key);
      if (origin !== 'scroll' && origin !== 'init') {
        var hash = '#era=' + key;
        if (location.hash !== hash) history.replaceState(null, '', hash);
      }
    };
    api.showStage = function (origin) {
      var changed = !stage;
      stage = true;
      drawnKey = 'stage';
      emit(changed || origin === 'init');
      if (origin !== 'scroll' && origin !== 'init') scrollTo('chapter-stage');
    };
    api.stop = function () {
      playing = false;
      if (timer) clearInterval(timer);
      timer = null;
      painters.forEach(function (fn) { fn(); });
    };
    api.toggle = function () {
      if (playing) { api.stop(); return; }
      playing = true;
      painters.forEach(function (fn) { fn(); });
      timer = setInterval(function () {
        var eras = data.eras;
        var idx = eras.indexOf(api.currentEra());
        if (stage) idx = -1;
        if (idx >= eras.length - 1) { api.stop(); return; }
        api.setYear(eras[idx + 1].focus, 'play');
      }, 3200);
    };
    return api;
  }

  function mountLobby(root, data) {
    var api = controller(data, 'lobby');
    var hash = (location.hash || '').replace('#era=', '').replace('#', '');
    var fromHash = eraById(data, hash);

    var grid = el('div', 'lobby-grid');
    var mapCard = el('div', 'map-card');
    var toolbar = el('div', 'map-toolbar');
    var eraName = el('p', 'map-era', '');
    var layers = el('div', 'chips');
    toolbar.appendChild(eraName);
    toolbar.appendChild(layers);
    mapCard.appendChild(toolbar);
    var frame = el('div', 'map-frame');
    var mapEl = el('div', 'map-canvas');
    mapEl.id = 'mare-map';
    frame.appendChild(mapEl);
    var detail = el('div', 'detail');
    detail.hidden = true;
    frame.appendChild(detail);
    mapCard.appendChild(frame);
    mapCard.appendChild(el('p', 'tile-note', 'Coastline tiles load in small pieces as you pan, from Esri. Country names are modern, a location aid, not the political map of the period. Click the map, then scroll to zoom.'));
    grid.appendChild(mapCard);

    var brief = el('aside', 'brief');
    grid.appendChild(brief);
    root.appendChild(grid);

    var timeHost = el('div', 'time-card');
    root.appendChild(timeHost);
    var matrixHost = el('section', 'matrix-section');
    matrixHost.id = 'matrix';
    root.appendChild(matrixHost);
    var jump = el('section', 'jump-section');
    root.appendChild(jump);
    var reg = el('section', 'register-section');
    root.appendChild(reg);

    var map = makeMap(mapEl);
    var state = new MapState(data, map, function (item) { fillDetail(detail, item); });

    function paintBrief(era) {
      eraName.textContent = era.name;
      brief.innerHTML = '';
      var fig = el('div', 'figure');
      fig.appendChild(el('p', 'figure-value', era.figure.value));
      fig.appendChild(el('p', 'figure-label', era.figure.label));
      fig.appendChild(el('p', 'chart-note', era.figure.caveat));
      brief.appendChild(fig);
      brief.appendChild(el('p', 'pull', era.pull));
      var img = el('img', 'era-shot');
      img.src = era.image;
      img.alt = era.imageAlt;
      brief.appendChild(img);
      var triad = el('div', 'triad');
      renderTriad(triad, era);
      brief.appendChild(triad);
      brief.appendChild(el('h3', 'brief-h', 'Players'));
      var ul = el('ul', 'player-list');
      era.players.forEach(function (p) {
        var li = el('li');
        li.appendChild(el('strong', null, p.name));
        li.appendChild(el('span', 'player-role', p.role));
        li.appendChild(el('span', null, p.note));
        ul.appendChild(li);
      });
      brief.appendChild(ul);
      var commodities = el('div', 'commodity-block');
      renderCommodities(commodities, era);
      brief.appendChild(commodities);
      var a = el('a', 'btn-primary brief-read', 'Read this period');
      a.href = '/DataStories/EvolutionOfMaritimeHistory/#era=' + era.id;
      brief.appendChild(a);
    }

    api.onChange(function (era, stage) {
      state.draw(era, stage);
      renderLayers(layers, state, era);
      if (!stage) paintBrief(era);
    });
    renderTimeline(timeHost, data, api);
    renderMatrix(matrixHost, data, api);
    renderRegister(reg, data);

    jump.appendChild(el('p', 'section-label', 'The long read'));
    jump.appendChild(el('h2', null, 'Eleven periods, told in order'));
    jump.appendChild(el('p', 'section-lead', 'The lobby keeps the whole sea in one map. The narrative lets each period speak, with the same map keeping up as you scroll.'));
    var list = el('div', 'jump-grid');
    data.eras.forEach(function (era) {
      var a = el('a', 'jump-card', '');
      a.href = '/DataStories/EvolutionOfMaritimeHistory/#era=' + era.id;
      a.appendChild(el('span', 'jump-range', era.range));
      a.appendChild(el('span', 'jump-name', era.name));
      a.appendChild(el('span', 'jump-kicker', era.kicker));
      list.appendChild(a);
    });
    jump.appendChild(list);

    if (fromHash) api.setYear(fromHash.focus, 'hash');
    else api.setYear(2024, 'init');
  }

  function mountStory(root, data) {
    var api = controller(data, 'story');
    var shell = el('div', 'story-shell');
    var stage = el('aside', 'story-stage');
    var stageBar = el('div', 'map-toolbar');
    var eraName = el('p', 'map-era', '');
    var collapse = el('button', 'chip is-on', 'Hide map');
    collapse.type = 'button';
    collapse.setAttribute('aria-pressed', 'false');
    stageBar.appendChild(eraName);
    stageBar.appendChild(collapse);
    stage.appendChild(stageBar);
    var frame = el('div', 'map-frame story-frame');
    var mapEl = el('div', 'map-canvas');
    frame.appendChild(mapEl);
    var detail = el('div', 'detail');
    detail.hidden = true;
    frame.appendChild(detail);
    stage.appendChild(frame);
    var layers = el('div', 'chips story-chips');
    stage.appendChild(layers);
    var progress = el('p', 'story-progress', '');
    stage.appendChild(progress);
    var timeHost = el('div', 'time-card time-compact');
    stage.appendChild(timeHost);
    stage.appendChild(el('p', 'tile-note', 'Tiles load as you move the map. Country names are modern. Click the map, then scroll to zoom.'));
    shell.appendChild(stage);

    var read = el('div', 'story-read');
    var intro = el('article', 'chapter');
    intro.id = 'chapter-stage';
    intro.dataset.era = 'stage';
    intro.appendChild(el('p', 'section-label', 'The lobby, in one column'));
    intro.appendChild(el('h2', null, 'Six doors and a ditch'));
    intro.appendChild(el('p', null, 'Gibraltar, the Sicily Channel, the Dardanelles, the Bosporus, Suez, Bab el-Mandeb, and Hormuz are the characters. Empires rent them. They do not move. Scroll, and the map will fill in who used each one. Or drag the timeline if you would rather arrive than walk.'));
    intro.appendChild(el('p', null, 'Modern periods are longer on purpose. Coal, oil, containers, insurance, and the glass under the keel changed the price of the same doors. Ancient periods are the reason those doors were already expensive.'));
    var toLobby = el('a', 'text-link', 'Open the full map lobby and the strait matrix');
    toLobby.href = '/DataStories/';
    intro.appendChild(toLobby);
    read.appendChild(intro);

    data.eras.forEach(function (era, index) {
      var article = el('article', 'chapter');
      article.id = 'chapter-' + era.id;
      article.dataset.era = era.id;
      article.appendChild(el('p', 'chapter-index', String(index + 1).padStart(2, '0') + '  /  ' + String(data.eras.length).padStart(2, '0')));
      var img = el('img', 'chapter-img');
      img.src = era.image;
      img.alt = era.imageAlt;
      img.loading = index === 0 ? 'eager' : 'lazy';
      article.appendChild(img);
      article.appendChild(el('p', 'section-label', era.range));
      article.appendChild(el('h2', null, era.name));
      article.appendChild(el('p', 'chapter-kicker', era.kicker));
      var fig = el('div', 'figure figure-inline');
      fig.appendChild(el('p', 'figure-value', era.figure.value));
      fig.appendChild(el('p', 'figure-label', era.figure.label));
      fig.appendChild(el('p', 'chart-note', era.figure.caveat));
      article.appendChild(fig);
      era.narrative.forEach(function (para) { article.appendChild(el('p', null, para)); });
      article.appendChild(el('p', 'pull', era.pull));
      var triad = el('div', 'triad');
      renderTriad(triad, era);
      article.appendChild(triad);

      article.appendChild(el('h3', 'brief-h', era.ship.headline));
      var specs = el('dl', 'ship-specs');
      [['Propulsion', era.ship.propulsion], ['Navigation', era.ship.navigation], ['Force', era.ship.armament]].forEach(function (pair) {
        specs.appendChild(el('dt', null, pair[0]));
        specs.appendChild(el('dd', null, pair[1]));
      });
      article.appendChild(specs);
      article.appendChild(el('p', null, era.ship.note));

      var commodities = el('div', 'commodity-block');
      renderCommodities(commodities, era);
      article.appendChild(commodities);

      article.appendChild(el('h3', 'brief-h', 'Players'));
      var ul = el('ul', 'player-list');
      era.players.forEach(function (p) {
        var li = el('li');
        li.appendChild(el('strong', null, p.name));
        li.appendChild(el('span', 'player-role', p.role));
        li.appendChild(el('span', null, p.note));
        ul.appendChild(li);
      });
      article.appendChild(ul);

      article.appendChild(el('h3', 'brief-h', 'Displacement'));
      era.migration.forEach(function (m) {
        var card = el('div', 'mig-card');
        card.appendChild(el('p', 'panel-title', m.name));
        card.appendChild(el('p', null, m.who + ' — from ' + m.from + ' to ' + m.to));
        card.appendChild(el('p', null, m.note));
        article.appendChild(card);
      });

      if (era.basins) {
        article.appendChild(el('h3', 'brief-h', 'The coasts in this period'));
        var basins = el('div', 'basin-grid');
        era.basins.forEach(function (b) {
          var card = el('article', 'basin-card');
          card.appendChild(el('h4', null, b.name));
          card.appendChild(el('p', 'player-role', b.states));
          card.appendChild(el('p', null, b.text));
          basins.appendChild(card);
        });
        article.appendChild(basins);
      }

      ['finance', 'security', 'diplomacy', 'infrastructure'].forEach(function (key) {
        var titles = { finance: 'Finance', security: 'Security', diplomacy: 'Diplomacy', infrastructure: 'Infrastructure' };
        article.appendChild(el('h3', 'brief-h', titles[key]));
        var list = el('ul', 'plain-list');
        era[key].forEach(function (item) {
          var li = el('li');
          li.appendChild(el('strong', null, item.name + '. '));
          li.appendChild(document.createTextNode(item.note));
          list.appendChild(li);
        });
        article.appendChild(list);
      });

      article.appendChild(el('h3', 'brief-h', 'Sources for this period'));
      var src = el('ul', 'plain-list sources');
      era.sources.forEach(function (s) {
        var li = el('li');
        li.appendChild(el('strong', null, s.title + '. '));
        li.appendChild(document.createTextNode(s.detail));
        src.appendChild(li);
      });
      article.appendChild(src);
      read.appendChild(article);
    });

    var reg = el('section', 'register-section');
    renderRegister(reg, data);
    read.appendChild(reg);
    shell.appendChild(read);
    root.appendChild(shell);

    var map = makeMap(mapEl);
    var state = new MapState(data, map, function (item) { fillDetail(detail, item); });

    collapse.addEventListener('click', function () {
      var hidden = frame.classList.toggle('is-hidden');
      collapse.textContent = hidden ? 'Show map' : 'Hide map';
      collapse.setAttribute('aria-pressed', hidden ? 'true' : 'false');
      setTimeout(function () { map.invalidateSize(); }, 50);
    });

    api.onChange(function (era, isStage) {
      state.draw(era, isStage);
      renderLayers(layers, state, era);
      if (isStage) {
        eraName.textContent = 'The straits';
        progress.textContent = 'Geography first';
      } else {
        var idx = data.eras.indexOf(era) + 1;
        eraName.textContent = era.name;
        progress.textContent = String(idx).padStart(2, '0') + ' / ' + String(data.eras.length).padStart(2, '0') + '  ·  ' + era.range;
      }
    });
    renderTimeline(timeHost, data, api);

    var chapters = [].slice.call(read.querySelectorAll('.chapter'));
    var scrollQueued = false;
    function syncFromScroll() {
      scrollQueued = false;
      if (api.locked()) return;
      var line = window.innerHeight * 0.35;
      var current = null;
      for (var i = 0; i < chapters.length; i++) {
        var rect = chapters[i].getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) current = chapters[i];
      }
      if (!current) {
        var lastRect = chapters[chapters.length - 1].getBoundingClientRect();
        if (lastRect.bottom <= line) current = chapters[chapters.length - 1];
        else return;
      }
      var id = current.dataset.era;
      if (id === 'stage') {
        if (!api.isStage()) api.showStage('scroll');
      } else {
        var era = eraById(data, id);
        if (era && (api.isStage() || api.currentEra().id !== era.id)) api.setYear(era.focus, 'scroll');
      }
    }
    window.addEventListener('scroll', function () {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(syncFromScroll);
    }, { passive: true });

    var hash = (location.hash || '').replace('#era=', '').replace('#', '');
    var fromHash = eraById(data, hash);
    if (fromHash) api.setYear(fromHash.focus, 'hash');
    else api.showStage('init');
  }

  ready(boot);
})();
