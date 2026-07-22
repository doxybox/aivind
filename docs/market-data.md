# Market data

The `Tech Aksjer` widget reads data from `GET /api/market/quotes`. The legacy `GET /api/market-data` route remains as a compatible alias.

## Flow

1. The server asks the active market-data provider for a 15-minute delayed quote for `NVDA`, `MSFT`, `TSLA`, and `AAPL`.
2. The server gets the matching delayed `USD/NOK` quote separately.
3. USD stock prices are converted to NOK.
4. USD prices and previous closes are both converted to NOK before daily percentage change is calculated. The displayed percentage therefore matches the displayed NOK price.
5. The API returns only normalized public quote data to the browser.

No market-data secret or upstream URL is sent from the client. The endpoint is GET-only, rate limited, cached in memory for two minutes, and emits CDN cache headers (`s-maxage=120`, `stale-while-revalidate=60`).

## Response contract

Every stock uses the same provider-neutral shape:

```json
{
  "symbol": "AAPL",
  "name": "Apple",
  "price": 210.87,
  "currency": "NOK",
  "change": -2.63,
  "changePercent": -1.23,
  "marketState": "CLOSED",
  "delayedMinutes": 15,
  "source": "yahoo-finance",
  "updatedAt": "2026-07-22T20:30:00Z"
}
```

## Product behavior

- Quotes are deliberately served at least 15 minutes behind the latest provider value and include an `updatedAt` timestamp.
- `asOf` is based on the latest stock quote, not the separately fetched FX quote.
- The widget only shows an active market during the normal US regular trading session (weekday, 09:30-16:00 in New York) and with a fresh quote. Outside that it shows `Markedet er stengt` and the last stock timestamp.
- The frontend refreshes every two minutes while the browser tab is visible. This is appropriate for a news-site widget and leaves rate-limit headroom.
- Polling pauses for hidden tabs and refreshes immediately when the user returns.
- If the upstream provider is unavailable, the widget shows an honest unavailable state and retry button.
- Hardcoded fallback prices are not shown as current market data.

## Production note

The current upstream is a best-effort, keyless Yahoo Finance chart endpoint without a contractual SLA. Before a high-traffic production launch, review redistribution terms and replace it with a licensed provider if required. `src/lib/server/market-providers/yahoo-finance.js` is an isolated provider implementation, so a licensed Finnhub, Twelve Data, Euronext, or other provider can replace it without changing the frontend contract.
