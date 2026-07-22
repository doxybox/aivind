import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  calculatePercentChange,
  clearMarketDataCache,
  getMarketData,
  isMarketOpenFromQuoteTime,
  isRegularMarketOpen,
  isUsRegularMarketHours,
  mapQuoteToNok,
} from "../src/lib/server/market-data.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("market quotes convert USD prices to NOK and calculate daily change", () => {
  const regularSessionNow = Date.UTC(2024, 0, 2, 15, 0);
  const regularSessionQuote = Math.floor(regularSessionNow / 1000);
  const stock = mapQuoteToNok(
    { id: "aapl", symbol: "AAPL", name: "Apple" },
    { regularMarketPrice: 200, chartPreviousClose: 190, regularMarketTime: regularSessionQuote },
    10.5,
    10,
  );

  assert.equal(stock.price, 2100);
  assert.equal(stock.change, 200);
  assert.equal(stock.changePercent, 10.53);
  assert.equal(stock.currency, "NOK");
  assert.equal(Number(calculatePercentChange(90, 100).toFixed(2)), -10);
  assert.equal(isMarketOpenFromQuoteTime(1700000000, 1700000020000), true);
  assert.equal(isMarketOpenFromQuoteTime(1700000000, 1700003600000), false);
  assert.equal(isUsRegularMarketHours(Date.UTC(2024, 0, 2, 15, 0)), true);
  assert.equal(isUsRegularMarketHours(Date.UTC(2024, 0, 2, 21, 0)), false);
  assert.equal(isRegularMarketOpen(regularSessionQuote, regularSessionNow), true);
});

test("market data fetches four quotes and USD/NOK server-side", async () => {
  clearMarketDataCache();
  const regularSessionNow = Date.UTC(2024, 0, 2, 15, 0);
  const regularSessionQuote = Math.floor(regularSessionNow / 1000);
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    const isFx = url.includes("NOK%3DX");
    return {
      ok: true,
      json: async () => ({
        chart: {
          result: [{
            meta: isFx
              ? { chartPreviousClose: 9.5 }
              : { chartPreviousClose: 95 },
            timestamp: [regularSessionQuote - 15 * 60],
            indicators: { quote: [{ close: [isFx ? 10 : 100] }] },
          }],
        },
      }),
    };
  };

  const result = await getMarketData({ fetchImpl, now: regularSessionNow, force: true });

  assert.equal(calls.length, 5);
  assert.equal(result.stocks.length, 4);
  assert.equal(result.stocks[0].price, 1000);
  assert.equal(result.stocks[0].change, 97.5);
  assert.equal(result.stocks[0].changePercent, 10.8);
  assert.equal(result.provider, "yahoo-finance");
  assert.equal(result.delayed, true);
  assert.equal(result.delayedMinutes, 15);
  assert.equal(result.stocks[0].marketState, "OPEN");
  assert.equal(result.marketOpen, true);
});

test("market data API is GET-only, rate limited and cached for two minutes", () => {
  const apiSource = readProjectFile("src/pages/api/market-data.js");
  const pageSource = readProjectFile("src/pages/NyFrontside1.jsx");

  assert.match(apiSource, /req\.method !== "GET"/);
  assert.match(apiSource, /enforceRateLimit\(req, res/);
  assert.match(apiSource, /s-maxage=120/);
  assert.match(pageSource, /fetch\("\/api\/market\/quotes"\)/);
  assert.match(pageSource, /setInterval\(refreshWhenVisible, 2 \* 60 \* 1000\)/);
  assert.match(pageSource, /document\.visibilityState === "visible"/);
  assert.doesNotMatch(pageSource, /fallbackMarketData/);
});
