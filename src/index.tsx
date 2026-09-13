import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.html(
    '<!doctype html>' +
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>USDT Blacklist Explorer</title>
        {/* Site lives under this path on GitHub Pages; lets /address/<addr> deep links resolve assets. */}
        <base href="/usdt-blacklist-explorer/" />
        <meta
          name="description"
          content="Search and track Tether (USDT) frozen/blacklisted addresses on Ethereum and TRON, with full history of changes."
        />
        <link rel="preconnect" href="https://data-usdt.leadup.com.tr" crossorigin />
        <link rel="dns-prefetch" href="https://data-usdt.leadup.com.tr" />
        <link rel="preload" href="./fonts/lato-400-latin.woff2" as="font" type="font/woff2" crossorigin />
        <link rel="preload" href="./fonts/lato-700-latin.woff2" as="font" type="font/woff2" crossorigin />
        <link rel="stylesheet" href="./style.css" />
        <script defer src="./app.js"></script>
      </head>
      <body>
        <nav class="topbar">
          <div class="container topbar-inner">
            <a class="brand" href="./" data-route>
              <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
                <circle cx="16" cy="16" r="16" fill="#26a17b" />
                <path
                  fill="#fff"
                  d="M17.9 17.4v-.002c-.108.008-.667.041-1.913.041-.995 0-1.698-.03-1.945-.041v.002c-3.845-.169-6.715-.839-6.715-1.64 0-.802 2.87-1.471 6.715-1.643v2.617c.251.018.972.06 1.962.06 1.188 0 1.783-.05 1.896-.06v-2.615c3.837.171 6.7.84 6.7 1.641 0 .8-2.863 1.47-6.7 1.64m0-3.553V11.5h5.354V7.93H8.703V11.5h5.354v2.345c-4.352.2-7.624 1.062-7.624 2.095s3.272 1.895 7.624 2.096v7.51h3.843v-7.512c4.343-.2 7.607-1.062 7.607-2.094s-3.264-1.894-7.607-2.094"
                />
              </svg>
              <span class="brand-name">USDT Blacklist Explorer</span>
            </a>
            <div class="topbar-right">
              <span class="net-pill">Ethereum</span>
              <span class="net-pill">TRON</span>
              <a class="topbar-link" href="https://github.com/nazim/usdt-blacklist-explorer">GitHub</a>
            </div>
          </div>
        </nav>

        <div class="container">
          <div class="search-hero">
            <svg class="search-icon" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                d="M13.6 13.6 18 18M9 15.5A6.5 6.5 0 1 1 9 2.5a6.5 6.5 0 0 1 0 13Z"
              />
            </svg>
            <input
              type="search"
              id="search-input"
              placeholder="Search by address"
              autocomplete="off"
              spellcheck={false}
              role="combobox"
              aria-expanded="false"
              aria-controls="search-panel"
              aria-autocomplete="list"
            />
            <button type="button" class="search-clear" id="search-clear" aria-label="Clear search" hidden>
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor" /><path d="M5.2 5.2l5.6 5.6M10.8 5.2l-5.6 5.6" stroke="#fff" stroke-width="1.5" stroke-linecap="round" /></svg>
            </button>
            <div class="search-panel" id="search-panel" role="listbox" hidden>
              <div class="search-chips" id="search-chips"></div>
              <div class="search-group-title" id="search-group-title"></div>
              <div id="search-results"></div>
              <div class="search-hints">
                <span><kbd>↑</kbd><kbd>↓</kbd> To Navigate</span>
                <span><kbd>ESC</kbd> To Cancel</span>
                <span><kbd>↵</kbd> To Enter</span>
              </div>
            </div>
          </div>

          <section id="address-view" class="card table-card address-view" hidden>
            <a class="back-link" href="./" data-route>← All addresses</a>
            <div class="address-head">
              <div class="address-title">
                <span class="address-full" id="detail-address">—</span>
                <button type="button" class="copy-btn" id="detail-copy" aria-label="Copy address"></button>
              </div>
              <div class="address-badges">
                <span class="chain-tag" id="detail-chain">—</span>
                <span class="event-tag" id="detail-status">—</span>
              </div>
            </div>
            <dl class="meta-grid">
              <div><dt>First blacklisted (UTC)</dt><dd id="detail-first">—</dd></div>
              <div><dt>Un-blacklisted (UTC)</dt><dd id="detail-removed">—</dd></div>
              <div><dt>Funds destroyed</dt><dd id="detail-destroyed">—</dd></div>
              <div><dt>Chain</dt><dd id="detail-chain-name">—</dd></div>
            </dl>
            <div class="explorers">
              <span class="explorers-label">View on</span>
              <div class="explorer-links" id="detail-explorer"></div>
            </div>
            <h2 class="section-title">Event timeline</h2>
            <div class="table-wrap">
              <table id="detail-events-table">
                <thead>
                  <tr>
                    <th>Time (UTC)</th>
                    <th>Event</th>
                    <th class="num">Amount</th>
                    <th class="num">Block</th>
                    <th>Transaction</th>
                  </tr>
                </thead>
                <tbody id="detail-event-rows">
                  <tr><td colspan={5} class="loading-row">Loading…</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <div id="home-view">
          <h1 class="page-title">Blacklisted Addresses</h1>

          <section class="summary" aria-label="Summary statistics">
            <div class="card summary-card">
              <div class="summary-block">
                <div class="summary-heading">Addresses</div>
                <div class="summary-row">
                  <div>
                    <div class="summary-value" id="stat-total">—</div>
                    <div class="summary-label">Active</div>
                  </div>
                  <div>
                    <div class="summary-value" id="stat-eth">—</div>
                    <div class="summary-label">Ethereum</div>
                  </div>
                  <div>
                    <div class="summary-value" id="stat-tron">—</div>
                    <div class="summary-label">TRON</div>
                  </div>
                  <div>
                    <div class="summary-value" id="stat-removed">—</div>
                    <div class="summary-label">Un-blacklisted</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card summary-card">
              <div class="summary-block">
                <div class="summary-heading">Distribution</div>
                <div class="dist">
                  <div class="dist-bar" aria-hidden="true">
                    <span class="dist-seg dist-eth" id="dist-eth"></span>
                    <span class="dist-seg dist-tron" id="dist-tron"></span>
                  </div>
                  <ul class="dist-legend">
                    <li><span class="dot dot-eth"></span>Ethereum <b id="dist-eth-pct">—</b></li>
                    <li><span class="dot dot-tron"></span>TRON <b id="dist-tron-pct">—</b></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section class="card table-card" aria-label="Recent activity">
            <div class="table-toolbar">
              <div>
                <h2 class="section-title">Recent activity</h2>
                <p class="table-caption" id="events-caption">Loading…</p>
              </div>
              <div class="tabs" id="event-filter" role="group" aria-label="Event type">
                <button type="button" class="tab is-active" data-value="">All</button>
                <button type="button" class="tab" data-value="added">Blacklisted</button>
                <button type="button" class="tab" data-value="removed">Un-blacklisted</button>
                <button type="button" class="tab" data-value="destroyed">Funds destroyed</button>
              </div>
            </div>
            <div class="table-wrap">
              <table id="events-table">
                <thead>
                  <tr>
                    <th>Time (UTC)</th>
                    <th>Event</th>
                    <th>Chain</th>
                    <th>Address</th>
                    <th class="num">Amount</th>
                    <th>Transaction</th>
                  </tr>
                </thead>
                <tbody id="event-rows">
                  <tr>
                    <td colspan={6} class="loading-row">Loading…</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pager">
              <button id="events-prev" class="btn" type="button">Previous</button>
              <span id="events-page-info"></span>
              <button id="events-next" class="btn" type="button">Next</button>
            </div>
          </section>

          <section class="card table-card" aria-label="Address list">
            <div class="table-toolbar">
              <div>
                <h2 class="section-title">Active blacklist</h2>
                <p class="table-caption" id="table-caption">Loading…</p>
              </div>
              <div class="tabs" id="chain-filter" role="group" aria-label="Chain">
                <button type="button" class="tab is-active" data-value="">All</button>
                <button type="button" class="tab" data-value="ethereum">Ethereum</button>
                <button type="button" class="tab" data-value="tron">TRON</button>
              </div>
            </div>

            <div class="table-wrap">
              <table id="address-table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Chain</th>
                    <th class="num sortable" data-sort-col="block">
                      <span class="th-label">Block</span>
                      <svg class="sort-chevron" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" /></svg>
                    </th>
                    <th class="sortable is-sorted" data-sort-col="timestamp">
                      <span class="th-label">Date (UTC)</span>
                      <svg class="sort-chevron" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" /></svg>
                    </th>
                    <th>Transaction</th>
                  </tr>
                </thead>
                <tbody id="address-rows">
                  <tr>
                    <td colspan={5} class="loading-row">Loading…</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="pager">
              <button id="prev-page" class="btn" type="button">Previous</button>
              <span id="page-info"></span>
              <button id="next-page" class="btn" type="button">Next</button>
            </div>
          </section>
          </div>

        </div>

        <footer class="site-footer">
          <div class="container">
            <p>
              Data sourced from public blockchain records via Etherscan and TronGrid.
              Refreshed automatically every 6 hours. Not affiliated with Tether, TRON, or Tronscan.
            </p>
            <p>
              <a href="https://github.com/nazim/usdt-blacklist-explorer">Source on GitHub</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
})

export default app
