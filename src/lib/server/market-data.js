const QUOTE_SYMBOLS = [
  { id: "nvda", symbol: "NVDA", name: "NVIDIA" },
  { id: "msft", symbol: "MSFT", name: "Microsoft" },
  { id: "tsla", symbol: "TSLA", name: "Tesla" },
  { id: "aapl", symbol: "AAPL", name: "Apple" },
];

const FX_SYMBOL = "NOK=X";
const CACHE_TTL_MS = 15 * 1000;

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

function chartUrl(symbol) {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`;
}

async function fetchChartMeta(symbol, fetchImpl) {
  const response = await fetchImpl(chartUrl(symbol), {
    headers: {
      Accept: "application/json",
      "User-Agent": "TEKKNO market widget/1.0",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new MarketDataError(`Quote provider returned ${response.status}`);
  }

  const body = await response.json();
  const meta = body?.chart?.result?.[0]?.meta;
  if (!meta) {
    throw new MarketDataError("Quote provider returned an invalid response");
  }

  return meta;
}

export function mapQuoteToNok(definition, meta, usdNokRate) {
  const priceUsd = Number(meta.regularMarketPrice);
  const previousCloseUsd = Number(meta.chartPreviousClose ?? meta.previousClose);

  if (!Number.isFinite(usdNokRate) || usdNokRate <= 0) {
    throw new MarketDataError("Invalid USD/NOK rate");
  }

  return {
    id: definition.id,
    symbol: definition.symbol,
    name: definition.name,
    price: Number((priceUsd * usdNokRate).toFixed(2)),
    change: Number(calculatePercentChange(priceUsd, previousCloseUsd).toFixed(2)),
    currency: "NOK",
    marketTime: Number(meta.regularMarketTime) || null,
  };
}

export async function getMarketData({ fetchImpl = fetch, now = Date.now(), force = false } = {}) {
  if (!force && memoryCache && memoryCache.expiresAt > now) {
    return memoryCache.value;
  }

  const [fxMeta, ...quoteMeta] = await Promise.all([
    fetchChartMeta(FX_SYMBOL, fetchImpl),
    ...QUOTE_SYMBOLS.map((quote) => fetchChartMeta(quote.symbol, fetchImpl)),
  ]);

  const usdNokRate = Number(fxMeta.regularMarketPrice);
  const stocks = QUOTE_SYMBOLS.map((definition, index) =>
    mapQuoteToNok(definition, quoteMeta[index], usdNokRate),
  );
  const latestMarketTime = Math.max(
    ...stocks.map((stock) => stock.marketTime || 0),
    Number(fxMeta.regularMarketTime) || 0,
  );

  const value = {
    stocks,
    currency: "NOK",
    delayed: true,
    provider: "yahoo-finance",
    asOf: latestMarketTime > 0 ? new Date(latestMarketTime * 1000).toISOString() : new Date(now).toISOString(),
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
