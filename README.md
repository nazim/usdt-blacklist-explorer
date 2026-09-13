# USDT Blacklist Explorer

**Live: https://nazim.github.io/usdt-blacklist-explorer/**

Tether freezes USDT addresses on Ethereum and TRON, sometimes destroys the frozen balance, and sometimes lifts the freeze again. This site shows all three events for every address, going back to the first freeze in November 2017.

## What you can do

- See how many addresses are frozen right now, per chain, and how many have since been un-blacklisted.
- Follow the recent activity feed: blacklisted, un-blacklisted, and funds destroyed, with USDT amounts.
- Browse the active blacklist. Sort by date or block, filter by chain, copy an address with one click.
- Type any part of an address and pick it from the dropdown.
- Open an address page: status, first freeze, un-blacklist time, destroyed total, the full event timeline, and links to Etherscan or Tronscan, OKLink, Arkham, and MistTrack.

Address pages have plain URLs, for example `/address/0x9faf5515f177f3a8a845d48c19032b33cc54c09c`.

## Where the data comes from

The site is static. It reads a public, read-only JSON API at `data-usdt.leadup.com.tr` that collects three events from the USDT contracts every six hours:

| Event | Meaning |
|---|---|
| `AddedBlackList` | address frozen |
| `RemovedBlackList` | freeze lifted |
| `DestroyedBlackFunds` | frozen balance burned |

Ethereum logs come from Etherscan, TRON events from TronGrid. An address counts as active when its latest add/remove event is an add.

Endpoints, all `GET`, rate-limited to 60 requests per minute per IP:

```
/stats
/public/addresses?chain=&q=&sort=timestamp|timestamp_asc|block|block_asc&limit=&offset=
/public/events?type=added|removed|destroyed&chain=&q=&limit=&offset=
/public/search?q=
/public/address/{address}
```

## How it is built

Hono renders the page with JSX and `hono/ssg` writes it to static HTML. The browser side is plain JavaScript, no framework. GitHub Actions builds on every push to `main` and deploys to GitHub Pages; `404.html` is a copy of `index.html`, which is how `/address/…` URLs work on a static host.

```bash
npm install
npm run build   # writes ./dist
```

## Notes

Not affiliated with Tether, TRON, or Tronscan. Freeze events are read from the chain as they happen; the site adds no judgment about why an address was frozen.

MIT license.
