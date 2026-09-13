(function () {
  'use strict';

  var API_BASE = 'https://data-usdt.leadup.com.tr';

  // Site base path (from <base href>), e.g. "/usdt-blacklist-explorer/"
  var BASE = new URL(document.baseURI).pathname.replace(/\/?$/, '/');

  function addressPath(address) {
    return BASE + 'address/' + encodeURIComponent(address);
  }

  var fmtInt = new Intl.NumberFormat('en-US');

  function $(id) {
    return document.getElementById(id);
  }

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function cell(tag, text, className) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }

  function shortHash(hash, head, tail) {
    if (!hash) return '—';
    if (hash.length <= head + tail + 3) return hash;
    return hash.slice(0, head) + '…' + hash.slice(-tail);
  }

  var COPY_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.3" d="M6 6h6.5a.5.5 0 0 1 .5.5V13a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V6.5A.5.5 0 0 1 6 6Z"/><path fill="none" stroke="currentColor" stroke-width="1.3" d="M3.5 10H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5h6.5a.5.5 0 0 1 .5.5v.5"/></svg>';
  var CHECK_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M3 8.5 6.5 12 13 4.5"/></svg>';
  var FAIL_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M4 4l8 8M12 4l-8 8"/></svg>';

  function addressCell(address) {
    var wrap = document.createElement('div');
    wrap.className = 'addr-cell';

    var span = document.createElement('a');
    span.className = 'addr addr-link';
    span.textContent = shortHash(address, 8, 6);
    span.title = address;
    span.href = addressPath(address);
    span.setAttribute('data-route', '');
    wrap.appendChild(span);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copy address');
    btn.innerHTML = COPY_ICON;
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(address).then(function () {
        btn.innerHTML = CHECK_ICON;
        btn.classList.add('copied');
        setTimeout(function () {
          btn.innerHTML = COPY_ICON;
          btn.classList.remove('copied');
        }, 1200);
      });
    });
    wrap.appendChild(btn);

    return wrap;
  }

  function explorerTxUrl(chain, tx) {
    if (!tx) return null;
    if (chain === 'ethereum') return 'https://etherscan.io/tx/' + encodeURIComponent(tx);
    if (chain === 'tron') return 'https://tronscan.org/#/transaction/' + encodeURIComponent(tx);
    return null;
  }

  function formatDate(unixSeconds) {
    if (!unixSeconds) return '—';
    var d = new Date(unixSeconds * 1000);
    return d.toISOString().slice(0, 16).replace('T', ' ');
  }

  function formatIsoDateTime(iso) {
    if (!iso) return '—';
    return iso.replace('T', ' ').slice(0, 19);
  }

  async function getJSON(path, params) {
    var url = new URL(API_BASE + path);
    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
    var res = await fetch(url.toString());
    if (!res.ok) throw new Error('Request failed: ' + res.status);
    return res.json();
  }

  // --- Stats ---

  async function loadStats() {
    try {
      var stats = await getJSON('/stats', {});
      var eth = stats.ethereum.count;
      var tron = stats.tron.count;
      var total = stats.total || (eth + tron);

      $('stat-eth').textContent = fmtInt.format(eth);
      $('stat-tron').textContent = fmtInt.format(tron);
      $('stat-total').textContent = fmtInt.format(total);
      $('stat-removed').textContent = fmtInt.format(stats.total_removed || 0);

      var ethPct = total ? (eth / total) * 100 : 0;
      var tronPct = total ? (tron / total) * 100 : 0;
      $('dist-eth').style.width = ethPct.toFixed(2) + '%';
      $('dist-tron').style.width = tronPct.toFixed(2) + '%';
      $('dist-eth-pct').textContent = fmtInt.format(eth) + ' (' + ethPct.toFixed(1) + '%)';
      $('dist-tron-pct').textContent = fmtInt.format(tron) + ' (' + tronPct.toFixed(1) + '%)';
    } catch (err) {
      $('stat-total').textContent = '—';
    }
  }

  // --- Address explorer ---

  var addressState = { chain: '', q: '', sortCol: 'timestamp', sortDir: 'desc', limit: 25, offset: 0 };

  function sortParam() {
    return addressState.sortDir === 'asc' ? addressState.sortCol + '_asc' : addressState.sortCol;
  }

  function renderAddressRows(addresses) {
    var tbody = $('address-rows');
    clearChildren(tbody);

    if (!addresses.length) {
      var tr = document.createElement('tr');
      tr.appendChild(cell('td', 'No matching addresses.', 'empty-row'));
      tr.lastChild.colSpan = 5;
      tbody.appendChild(tr);
      return;
    }

    addresses.forEach(function (row) {
      var tr = document.createElement('tr');

      var addrTd = document.createElement('td');
      addrTd.appendChild(addressCell(row.address));
      tr.appendChild(addrTd);

      var chainTd = document.createElement('td');
      var chainSpan = cell('span', row.chain === 'ethereum' ? 'ETH' : 'TRX', 'chain-tag');
      chainTd.appendChild(chainSpan);
      tr.appendChild(chainTd);

      tr.appendChild(cell('td', row.block ? fmtInt.format(row.block) : '—', 'num'));
      tr.appendChild(cell('td', formatDate(row.timestamp)));

      var txUrl = explorerTxUrl(row.chain, row.tx);
      var txCell = document.createElement('td');
      if (txUrl) {
        var a = document.createElement('a');
        a.href = txUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'tx-link';
        a.textContent = shortHash(row.tx, 8, 6);
        txCell.appendChild(a);
      } else {
        txCell.textContent = '—';
      }
      tr.appendChild(txCell);

      tbody.appendChild(tr);
    });
  }

  async function loadAddresses() {
    var tbody = $('address-rows');
    clearChildren(tbody);
    tbody.appendChild(cell('td', 'Loading…', 'loading-row'));
    tbody.firstChild.colSpan = 5;

    try {
      var data = await getJSON('/public/addresses', {
        chain: addressState.chain,
        q: addressState.q,
        sort: sortParam(),
        limit: addressState.limit,
        offset: addressState.offset
      });
      renderAddressRows(data.addresses);

      var caption = $('table-caption');
      clearChildren(caption);
      caption.appendChild(document.createTextNode('A total of '));
      caption.appendChild(cell('b', fmtInt.format(data.total)));
      caption.appendChild(document.createTextNode(addressState.q || addressState.chain ? ' matching addresses' : ' blacklisted addresses'));

      var from = data.total === 0 ? 0 : data.offset + 1;
      var to = Math.min(data.offset + data.limit, data.total);
      $('page-info').textContent = fmtInt.format(from) + '–' + fmtInt.format(to) + ' of ' + fmtInt.format(data.total);
      $('prev-page').disabled = data.offset <= 0;
      $('next-page').disabled = !data.has_more;
    } catch (err) {
      clearChildren(tbody);
      tbody.appendChild(cell('td', 'Could not load addresses.', 'empty-row'));
      tbody.firstChild.colSpan = 5;
    }
  }

  // --- Search typeahead (Tronscan-style dropdown under the search bar) ---

  var ACCOUNT_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="3" width="13" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="5.5" cy="7.5" r="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 11c.4-1.2 1.2-1.8 2-1.8s1.6.6 2 1.8M9.5 6.5h3M9.5 9h3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';

  var searchInput = $('search-input');
  var searchPanel = $('search-panel');
  var searchClear = $('search-clear');
  var searchTimer = null;
  var searchItems = [];
  var searchIndex = -1;
  var searchSeq = 0;

  function openPanel() {
    searchPanel.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
  }

  function closePanel() {
    searchPanel.hidden = true;
    searchInput.setAttribute('aria-expanded', 'false');
    searchItems = [];
    searchIndex = -1;
  }

  function highlightSearch(index) {
    searchIndex = index;
    searchItems.forEach(function (el, i) {
      el.classList.toggle('is-selected', i === index);
    });
    if (index >= 0 && searchItems[index]) {
      searchItems[index].scrollIntoView({ block: 'nearest' });
    }
  }

  function renderSearchPanel(query, data) {
    var chips = $('search-chips');
    var title = $('search-group-title');
    var list = $('search-results');
    clearChildren(chips);
    clearChildren(list);
    searchItems = [];
    searchIndex = -1;

    var total = data.total || 0;
    var chip = cell('span', 'Addresses (' + fmtInt.format(total) + ')', 'search-chip' + (total ? '' : ' is-muted'));
    chips.appendChild(chip);
    title.textContent = 'Addresses (' + fmtInt.format(total) + ')';

    if (!data.results.length) {
      list.appendChild(cell('div', 'No blacklisted address matches “' + query + '”.', 'search-empty'));
      openPanel();
      return;
    }

    data.results.forEach(function (r) {
      var a = document.createElement('a');
      a.className = 'search-result';
      a.href = addressPath(r.address);
      a.setAttribute('data-route', '');
      a.setAttribute('role', 'option');

      var icon = document.createElement('span');
      icon.className = 'search-result-icon';
      icon.innerHTML = ACCOUNT_ICON;
      a.appendChild(icon);

      a.appendChild(cell('span', r.address, 'search-result-addr'));

      var meta = document.createElement('span');
      meta.className = 'search-result-meta';
      meta.appendChild(cell('span', r.chain === 'ethereum' ? 'ETH' : 'TRX', 'chain-tag'));
      meta.appendChild(cell('span', r.status === 'active' ? 'Blacklisted' : 'Un-blacklisted', 'event-tag ' + (r.status === 'active' ? 'event-added' : 'event-removed')));
      a.appendChild(meta);

      a.addEventListener('mouseenter', function () { highlightSearch(searchItems.indexOf(a)); });
      list.appendChild(a);
      searchItems.push(a);
    });
    openPanel();
  }

  async function runSearch(query) {
    var seq = ++searchSeq;
    try {
      var data = await getJSON('/public/search', { q: query, limit: 8 });
      if (seq !== searchSeq) return; // stale response
      renderSearchPanel(query, data);
    } catch (err) {
      if (seq !== searchSeq) return;
      renderSearchPanel(query, { total: 0, results: [] });
    }
  }

  searchInput.addEventListener('input', function (e) {
    clearTimeout(searchTimer);
    var value = e.target.value.trim();
    searchClear.hidden = value.length === 0;
    if (value.length < 4) {
      closePanel();
      return;
    }
    searchTimer = setTimeout(function () { runSearch(value); }, 250);
  });

  searchInput.addEventListener('focus', function () {
    if (searchInput.value.trim().length >= 4 && $('search-results').childNodes.length) openPanel();
  });

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' && searchItems.length) {
      e.preventDefault();
      highlightSearch((searchIndex + 1) % searchItems.length);
    } else if (e.key === 'ArrowUp' && searchItems.length) {
      e.preventDefault();
      highlightSearch((searchIndex - 1 + searchItems.length) % searchItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      var value = searchInput.value.trim();
      if (searchIndex >= 0 && searchItems[searchIndex]) {
        navigate(new URL(searchItems[searchIndex].href).pathname);
      } else if (searchItems.length === 1) {
        navigate(new URL(searchItems[0].href).pathname);
      } else if (value.length >= 20) {
        navigate(addressPath(value));
      }
      closePanel();
    } else if (e.key === 'Escape') {
      closePanel();
      searchInput.blur();
    }
  });

  searchClear.addEventListener('click', function () {
    searchInput.value = '';
    searchClear.hidden = true;
    closePanel();
    searchInput.focus();
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-hero')) closePanel();
  });

  $('chain-filter').addEventListener('click', function (e) {
    var btn = e.target.closest('.tab');
    if (!btn) return;
    var current = $('chain-filter').querySelector('.tab.is-active');
    if (current) current.classList.remove('is-active');
    btn.classList.add('is-active');
    addressState.chain = btn.dataset.value;
    addressState.offset = 0;
    loadAddresses();
  });

  document.querySelectorAll('#address-table .sortable').forEach(function (th) {
    th.addEventListener('click', function () {
      var col = th.dataset.sortCol;
      if (addressState.sortCol === col) {
        addressState.sortDir = addressState.sortDir === 'desc' ? 'asc' : 'desc';
      } else {
        addressState.sortCol = col;
        addressState.sortDir = 'desc';
      }
      document.querySelectorAll('#address-table .sortable').forEach(function (other) {
        other.classList.toggle('is-sorted', other === th);
        other.classList.toggle('is-asc', other === th && addressState.sortDir === 'asc');
      });
      addressState.offset = 0;
      loadAddresses();
    });
  });

  $('prev-page').addEventListener('click', function () {
    addressState.offset = Math.max(0, addressState.offset - addressState.limit);
    loadAddresses();
  });

  $('next-page').addEventListener('click', function () {
    addressState.offset += addressState.limit;
    loadAddresses();
  });

  // --- Recent activity (on-chain events) ---

  var EVENT_LABELS = {
    added: 'Blacklisted',
    removed: 'Un-blacklisted',
    destroyed: 'Funds destroyed'
  };

  function formatUsdt(rawAmount) {
    if (rawAmount === null || rawAmount === undefined || rawAmount === '') return '—';
    var n = Number(rawAmount) / 1e6;
    if (!isFinite(n)) return '—';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' USDT';
  }

  var eventState = { type: '', limit: 20, offset: 0 };

  function renderEventRows(events) {
    var tbody = $('event-rows');
    clearChildren(tbody);

    if (!events.length) {
      var tr = document.createElement('tr');
      tr.appendChild(cell('td', 'No events.', 'empty-row'));
      tr.lastChild.colSpan = 6;
      tbody.appendChild(tr);
      return;
    }

    events.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.appendChild(cell('td', formatDate(row.timestamp)));

      var typeTd = document.createElement('td');
      typeTd.appendChild(cell('span', EVENT_LABELS[row.event_type] || row.event_type, 'event-tag event-' + row.event_type));
      tr.appendChild(typeTd);

      var chainTd = document.createElement('td');
      chainTd.appendChild(cell('span', row.chain === 'ethereum' ? 'ETH' : 'TRX', 'chain-tag'));
      tr.appendChild(chainTd);

      var addrTd = document.createElement('td');
      addrTd.appendChild(addressCell(row.address));
      tr.appendChild(addrTd);

      tr.appendChild(cell('td', row.event_type === 'destroyed' ? formatUsdt(row.amount) : '—', 'num'));

      var txUrl = explorerTxUrl(row.chain, row.tx);
      var txCell = document.createElement('td');
      if (txUrl) {
        var a = document.createElement('a');
        a.href = txUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'tx-link';
        a.textContent = shortHash(row.tx, 8, 6);
        txCell.appendChild(a);
      } else {
        txCell.textContent = '—';
      }
      tr.appendChild(txCell);

      tbody.appendChild(tr);
    });
  }

  async function loadEvents() {
    var tbody = $('event-rows');
    clearChildren(tbody);
    tbody.appendChild(cell('td', 'Loading…', 'loading-row'));
    tbody.firstChild.colSpan = 6;

    try {
      var data = await getJSON('/public/events', {
        type: eventState.type,
        limit: eventState.limit,
        offset: eventState.offset
      });
      renderEventRows(data.events);

      var caption = $('events-caption');
      clearChildren(caption);
      caption.appendChild(document.createTextNode('A total of '));
      caption.appendChild(cell('b', fmtInt.format(data.total)));
      caption.appendChild(document.createTextNode(eventState.type ? ' ' + EVENT_LABELS[eventState.type].toLowerCase() + ' events' : ' on-chain events'));

      var from = data.total === 0 ? 0 : data.offset + 1;
      var to = Math.min(data.offset + data.limit, data.total);
      $('events-page-info').textContent = fmtInt.format(from) + '–' + fmtInt.format(to) + ' of ' + fmtInt.format(data.total);
      $('events-prev').disabled = data.offset <= 0;
      $('events-next').disabled = !data.has_more;
    } catch (err) {
      clearChildren(tbody);
      tbody.appendChild(cell('td', 'Could not load events.', 'empty-row'));
      tbody.firstChild.colSpan = 6;
    }
  }

  $('event-filter').addEventListener('click', function (e) {
    var btn = e.target.closest('.tab');
    if (!btn) return;
    var current = $('event-filter').querySelector('.tab.is-active');
    if (current) current.classList.remove('is-active');
    btn.classList.add('is-active');
    eventState.type = btn.dataset.value;
    eventState.offset = 0;
    loadEvents();
  });

  $('events-prev').addEventListener('click', function () {
    eventState.offset = Math.max(0, eventState.offset - eventState.limit);
    loadEvents();
  });

  $('events-next').addEventListener('click', function () {
    eventState.offset += eventState.limit;
    loadEvents();
  });

  // --- Address detail view (hash route: #/address/<address>) ---

  var STATUS_LABELS = { active: 'Blacklisted', removed: 'Un-blacklisted', unknown: 'Not in blacklist' };
  var STATUS_CLASS = { active: 'event-added', removed: 'event-removed', unknown: 'chain-tag' };

  // Third-party explorers per chain. Favicons come from Google's favicon service.
  function explorerLinks(chain, address) {
    var a = encodeURIComponent(address);
    var isEth = chain === 'ethereum';
    return [
      isEth
        ? { name: 'Etherscan', domain: 'etherscan.io', url: 'https://etherscan.io/address/' + a }
        : { name: 'Tronscan', domain: 'tronscan.org', url: 'https://tronscan.org/#/address/' + a },
      { name: 'OKLink', domain: 'oklink.com', url: 'https://www.oklink.com/' + (isEth ? 'ethereum' : 'tron') + '/address/' + a },
      { name: 'Arkham', domain: 'arkm.com', url: 'https://arkm.com/explorer/address/' + a },
      { name: 'MistTrack', domain: 'misttrack.io', url: 'https://light.misttrack.io/address/' + (isEth ? 'ETH' : 'TRX') + '/' + a }
    ];
  }

  function faviconUrl(domain) {
    return 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(domain) + '&sz=32';
  }

  function txLink(chain, tx) {
    var url = explorerTxUrl(chain, tx);
    if (!url) return cell('span', '—');
    var a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'tx-link';
    a.textContent = shortHash(tx, 8, 6);
    return a;
  }

  function renderDetail(detail) {
    $('detail-address').textContent = detail.address;
    $('detail-chain').textContent = detail.chain === 'ethereum' ? 'ETH' : 'TRX';

    var status = $('detail-status');
    status.textContent = STATUS_LABELS[detail.status] || detail.status;
    status.className = 'event-tag ' + (STATUS_CLASS[detail.status] || '');

    $('detail-first').textContent = formatDate(detail.first_blacklisted);
    $('detail-removed').textContent = detail.removed_at ? formatIsoDateTime(detail.removed_at).slice(0, 16) : '—';
    $('detail-destroyed').textContent = Number(detail.destroyed_total) > 0 ? formatUsdt(detail.destroyed_total) : '—';

    $('detail-chain-name').textContent = detail.chain === 'ethereum' ? 'Ethereum (ERC-20)' : 'TRON (TRC-20)';

    var explorer = $('detail-explorer');
    clearChildren(explorer);
    explorerLinks(detail.chain, detail.address).forEach(function (x) {
      var a = document.createElement('a');
      a.className = 'explorer-link';
      a.href = x.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      var img = document.createElement('img');
      img.src = faviconUrl(x.domain);
      img.alt = '';
      img.width = 16;
      img.height = 16;
      img.loading = 'lazy';
      img.onerror = function () { img.remove(); };
      a.appendChild(img);
      a.appendChild(document.createTextNode(x.name));
      explorer.appendChild(a);
    });

    var copyBtn = $('detail-copy');
    copyBtn.innerHTML = COPY_ICON;
    copyBtn.onclick = function () {
      navigator.clipboard.writeText(detail.address).then(function () {
        copyBtn.innerHTML = CHECK_ICON;
        copyBtn.classList.add('copied');
        setTimeout(function () { copyBtn.innerHTML = COPY_ICON; copyBtn.classList.remove('copied'); }, 1200);
      });
    };

    var tbody = $('detail-event-rows');
    clearChildren(tbody);
    if (!detail.events.length) {
      var tr = document.createElement('tr');
      tr.appendChild(cell('td', 'No events recorded.', 'empty-row'));
      tr.lastChild.colSpan = 5;
      tbody.appendChild(tr);
      return;
    }
    detail.events.forEach(function (ev) {
      var tr = document.createElement('tr');
      tr.appendChild(cell('td', formatDate(ev.timestamp)));
      var typeTd = document.createElement('td');
      typeTd.appendChild(cell('span', EVENT_LABELS[ev.event_type] || ev.event_type, 'event-tag event-' + ev.event_type));
      tr.appendChild(typeTd);
      tr.appendChild(cell('td', ev.event_type === 'destroyed' ? formatUsdt(ev.amount) : '—', 'num'));
      tr.appendChild(cell('td', ev.block ? fmtInt.format(ev.block) : '—', 'num'));
      var txTd = document.createElement('td');
      txTd.appendChild(txLink(ev.chain, ev.tx));
      tr.appendChild(txTd);
      tbody.appendChild(tr);
    });
  }

  async function showAddress(address) {
    $('home-view').hidden = true;
    var view = $('address-view');
    view.hidden = false;
    $('detail-address').textContent = address;
    var tbody = $('detail-event-rows');
    clearChildren(tbody);
    tbody.appendChild(cell('td', 'Loading…', 'loading-row'));
    tbody.firstChild.colSpan = 5;
    document.title = shortHash(address, 8, 6) + ' · USDT Blacklist Explorer';

    try {
      var res = await fetch(API_BASE + '/public/address/' + encodeURIComponent(address));
      if (res.status === 404) {
        renderDetail({ address: address, chain: address.indexOf('0x') === 0 ? 'ethereum' : 'tron', status: 'unknown', first_blacklisted: null, removed_at: null, destroyed_total: '0', events: [] });
        return;
      }
      if (!res.ok) throw new Error('Request failed: ' + res.status);
      renderDetail(await res.json());
    } catch (err) {
      clearChildren(tbody);
      tbody.appendChild(cell('td', 'Could not load address.', 'empty-row'));
      tbody.firstChild.colSpan = 5;
    }
  }

  function showHome() {
    $('address-view').hidden = true;
    $('home-view').hidden = false;
    document.title = 'USDT Blacklist Explorer';
  }

  function route() {
    // Legacy hash links (#/address/…) → clean path
    var legacy = /^#\/address\/([^/?#]+)/.exec(location.hash || '');
    if (legacy) {
      history.replaceState(null, '', addressPath(decodeURIComponent(legacy[1])));
    }

    var rel = location.pathname.indexOf(BASE) === 0 ? location.pathname.slice(BASE.length) : '';
    var m = /^address\/([^/?#]+)/.exec(rel);
    if (m) {
      showAddress(decodeURIComponent(m[1]));
      window.scrollTo(0, 0);
    } else {
      showHome();
    }
  }

  function navigate(path) {
    if (location.pathname !== path) history.pushState(null, '', path);
    route();
  }

  window.addEventListener('popstate', route);

  // In-app links: <a data-route href="…"> navigate without a full reload
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-route]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    closePanel();
    navigate(new URL(a.href).pathname);
  });

  route();
  loadStats();
  loadEvents();
  loadAddresses();
})();
