import { createYahooFinanceProvider } from "./market-providers/yahoo-finance.js";

const QUOTE_SYMBOLS = [
  { id: "nvda", symbol: "NVDA", name: "NVIDIA" },
  { id: "msft", symbol: "MSFT", name: "Microsoft" },
  { id: "tsla", symbol: "TSLA", name: "Tesla" },
  { id: "aapl", symbol: "AAPL", name: "Apple" },
];

const FX_SYMBOL = "NOK=X";
const CACHE_TTL_MS = 2 * 60 * 1000;
const DELAYED_MINUTES = 15;
const MARKET_OPEN_FRESHNESS_MS = 25 * 60 * 1000;
const US_MARKET_TIME_ZONE = "America/New_York";

let memoryCache = null;

export class MarketDataError extends Error {
  constructor(message = "Market data is unavailable") {
    super(message);
    this.name = "MarketDataError";
    this.status = 502;
  }
}

export function calculatePercentChange(price, previousClose) {
  if (!Number.isFinite(price) || !Number.isFinite(previousClose) || previousClose <= 0) {
    throw new MarketDataError("Invalid quote values");
  }

  return ((price - previousClose) / previousClose) * 100;
}

export function mapQuoteToNok(definition, meta, usdNokRate, previousUsdNokRate = usdNokRate) {
  const priceUsd = Number(meta.regularMarketPrice);
  const previousCloseUsd = Number(meta.chartPreviousClose ?? meta.previousClose);

  if (
    !Number.isFinite(usdNokRate) ||
    usdNokRate <= 0 ||
    !Number.isFinite(previousUsdNokRate) ||
    previousUsdNokRate <= 0
  ) {
    throw new MarketDataError("Invalid USD/NOK rate");
  }

  const priceNok = priceUsd * usdNokRate;
  const previousCloseNok = previousCloseUsd * previousUsdNokRate;

  return {
    id: definition.id,
    symbol: definition.symbol,
    name: definition.name,
    price: Number(priceNok.toFixed(2)),
    change: Number((priceNok - previousCloseNok).toFixed(2)),
    changePercent: Number(calculatePercentChange(priceNok, previousCloseNok).toFixed(2)),
    currency: "NOK",
    marketTime: Number(meta.regularMarketTime) || null,
  };
}

export function isMarketOpenFromQuoteTime(marketTime, now = Date.now()) {
  if (!Number.isFinite(marketTime) || marketTime <= 0) return false;
  const quoteAge = now - marketTime * 1000;
  return quoteAge >= 0 && quoteAge <= MARKET_OPEN_FRESHNESS_MS;
}

export function isUsRegularMarketHours(now = Date.now()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: US_MARKET_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  const part = (type) => parts.find((item) => item.type === type)?.value;
  const weekday = part("weekday");
  const hours = Number(part("hour"));
  const minutes = Number(part("minute"));
  const minutesSinceMidnight = hours * 60 + minutes;

  return ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday) &&
    minutesSinceMidnight >= 9 * 60 + 30 &&
    minutesSinceMidnight < 16 * 60;
}

export function isRegularMarketOpen(marketTime, now = Date.now()) {
  return isMarketOpenFromQuoteTime(marketTime, now) && isUsRegularMarketHours(now);
}

export async function getMarketData({ fetchImpl = fetch, now = Date.now(), force = false, provider } = {}) {
  if (!force && memoryCache && memoryCache.expiresAt > now) {
    return memoryCache.value;
  }

  const activeProvider = provider || createYahooFinanceProvider({ fetchImpl });

  let fxMeta;
  let quoteMeta;
  try {
    [fxMeta, ...quoteMeta] = await Promise.all([
      activeProvider.getQuote(FX_SYMBOL, { now, delayedMinutes: DELAYED_MINUTES }),
      ...QUOTE_SYMBOLS.map((quote) => activeProvider.getQuote(quote.symbol, { now, delayedMinutes: DELAYED_MINUTES })),
    ]);
  } catch (error) {
    throw new MarketDataError(error instanceof Error ? error.message : undefined);
  }

  const usdNokRate = Number(fxMeta.regularMarketPrice);
  const previousUsdNokRate = Number(fxMeta.chartPreviousClose ?? fxMeta.previousClose ?? usdNokRate);
  const latestMarketTime = Math.max(...quoteMeta.map((quote) => Number(quote.regularMarketTime) || 0));
  const marketOpen = isRegularMarketOpen(latestMarketTime, now);
  const updatedAt = latestMarketTime > 0 ? new Date(latestMarketTime * 1000).toISOString() : new Date(now).toISOString();
  const stocks = QUOTE_SYMBOLS.map((definition, index) => ({
    ...mapQuoteToNok(definition, quoteMeta[index], usdNokRate, previousUsdNokRate),
    marketState: marketOpen ? "OPEN" : "CLOSED",
    delayedMinutes: DELAYED_MINUTES,
    source: activeProvider.name,
    updatedAt,
  }));

  const value = {
    stocks,
    currency: "NOK",
    delayed: true,
    delayedMinutes: DELAYED_MINUTES,
    marketOpen,
    marketState: marketOpen ? "OPEN" : "CLOSED",
    provider: activeProvider.name,
    updatedAt,
    asOf: updatedAt,
  };

  memoryCache = {
    value,
    expiresAt: now + CACHE_TTL_MS,
  };

  return value;
}

export function clearMarketDataCache() {
  memoryCache = null;
}
