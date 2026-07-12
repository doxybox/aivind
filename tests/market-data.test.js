import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  calculatePercentChange,
  clearMarketDataCache,
  getMarketData,
  mapQuoteToNok,
} from "../src/lib/server/market-data.js";

const rootDir = process.cwd();

function readProjectFile(filePath) {
  return readFileSync(path.join(rootDir, filePath), "utf8");
}

test("market quotes convert USD prices to NOK and calculate daily change", () => {
  const stock = mapQuoteToNok(
    { id: "aapl", symbol: "AAPL", name: "Apple" },
    { regularMarketPrice: 200, chartPreviousClose: 190, regularMarketTime: 1700000000 },
    10.5,
  );

  assert.equal(stock.price, 2100);
  assert.equal(stock.change, 5.26);
  assert.equal(stock.currency, "NOK");
  assert.equal(Number(calculatePercentChange(90, 100).toFixed(2)), -10);
});

test("market data fetches four quotes and USD/NOK server-side", async () => {
  clearMarketDataCache();
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
              ? { regularMarketPrice: 10, regularMarketTime: 1700000010 }
              : { regularMarketPrice: 100, chartPreviousClose: 95, regularMarketTime: 1700000000 },
          }],
        },
      }),
    };
  };

  const result = await getMarketData({ fetchImpl, now: 1700000020000, force: true });

  assert.equal(calls.length, 5);
  assert.equal(result.stocks.length, 4);
  assert.equal(result.stocks[0].price, 1000);
  assert.equal(result.provider, "yahoo-finance");
  assert.equal(result.delayed, true);
});

test("market data API is GET-only, rate limited and cached for one minute", () => {
  const apiSource = readProjectFile("src/pages/api/market-data.js");
  const pageSource = readProjectFile("src/pages/NyFrontside1.jsx");

  assert.match(apiSource, /req\.method !== "GET"/);
  assert.match(apiSource, /enforceRateLimit\(req, res/);
  assert.match(apiSource, /s-maxage=60/);
  assert.match(pageSource, /fetch\("\/api\/market-data"\)/);
  assert.match(pageSource, /setInterval\(fetchStocks, 60 \* 1000\)/);
  assert.doesNotMatch(pageSource, /fallbackMarketData/);
});
