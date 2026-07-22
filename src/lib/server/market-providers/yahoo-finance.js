const DEFAULT_DELAYED_MINUTES = 15;

function chartUrl(symbol) {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`;
}

function findDelayedPrice(result, cutoffSeconds) {
  const timestamps = result?.timestamp || [];
  const closes = result?.indicators?.quote?.[0]?.close || [];

  for (let index = Math.min(timestamps.length, closes.length) - 1; index >= 0; index -= 1) {
    const timestamp = Number(timestamps[index]);
    const price = Number(closes[index]);

    if (timestamp <= cutoffSeconds && Number.isFinite(price) && price > 0) {
      return { price, timestamp };
    }
  }

  throw new Error("The provider did not return a delayed quote");
}

export function createYahooFinanceProvider({ fetchImpl = fetch } = {}) {
  return {
    name: "yahoo-finance",
    async getQuote(symbol, { now = Date.now(), delayedMinutes = DEFAULT_DELAYED_MINUTES } = {}) {
      const response = await fetchImpl(chartUrl(symbol), {
        headers: {
          Accept: "application/json",
          "User-Agent": "TEKKNO market widget/1.0",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        throw new Error(`Quote provider returned ${response.status}`);
      }

      const body = await response.json();
      const result = body?.chart?.result?.[0];
      const meta = result?.meta;
      if (!meta) {
        throw new Error("Quote provider returned an invalid response");
      }

      const delayedQuote = findDelayedPrice(result, Math.floor((now - delayedMinutes * 60 * 1000) / 1000));
      const previousClose = Number(meta.chartPreviousClose ?? meta.previousClose);
      if (!Number.isFinite(previousClose) || previousClose <= 0) {
        throw new Error("Quote provider did not return a previous close");
      }

      return {
        regularMarketPrice: delayedQuote.price,
        chartPreviousClose: previousClose,
        regularMarketTime: delayedQuote.timestamp,
      };
    },
  };
}
