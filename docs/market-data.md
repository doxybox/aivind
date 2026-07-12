# Market data

The `Tech Aksjer` widget reads data from `GET /api/market-data`.

## Flow

1. The server fetches daily chart metadata for `NVDA`, `MSFT`, `TSLA`, and `AAPL`.
2. The server fetches the current `USD/NOK` quote separately.
3. USD stock prices are converted to NOK.
4. Daily percentage change is calculated from the previous close.
5. The API returns only normalized public quote data to the browser.

No market-data secret or upstream URL is sent from the client. The endpoint is GET-only, rate limited, cached in memory for one minute, and emits CDN cache headers (`s-maxage=60`, `stale-while-revalidate=120`).

## Product behavior

- Quotes are marked as delayed and include an `asOf` timestamp.
- The frontend refreshes every minute.
- If the upstream provider is unavailable, the widget shows an honest unavailable state and retry button.
- Hardcoded fallback prices are not shown as current market data.

## Production note

The current upstream is a best-effort, keyless Yahoo Finance chart endpoint without a contractual SLA. Before a high-traffic production launch, review redistribution terms and replace it with a licensed provider if required. The first-party API boundary means the frontend does not need to change when the provider is replaced.
